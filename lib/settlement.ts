import { unzipSync, strFromU8 } from "fflate";
import { getMatchScorecard, getMatchById } from "@/lib/cricket-api";
import {
  getAllMatchIds,
  getBets,
  getMatchMetadata,
  getParlaysForMatch,
  updateBetResult,
  updateParlayStatus,
} from "@/lib/db";
import { calculateParlayPayout, getMatchKickoffTime, isMatchCompleted } from "@/lib/utils";
import { BetLine, IPLMatch } from "@/types";

interface ResolvedBetInput {
  betId: string;
  actualValue: number;
}

interface AutoSettlementMatchResult {
  matchId: string;
  status: "settled" | "skipped" | "pending";
  resolvedBets: number;
  updatedParlays: number;
  unresolvedBetIds: string[];
  reason?: string;
}

interface AutoSettlementSummary {
  checkedMatches: number;
  settledMatches: number;
  resolvedBets: number;
  updatedParlays: number;
  pendingMatches: number;
  skippedMatches: number;
  results: AutoSettlementMatchResult[];
}

interface CricApiBatterCard {
  batsman?: { name?: string };
  r?: number;
  ["6s"]?: number;
}

interface CricApiBowlerCard {
  bowler?: { name?: string };
  w?: number;
}

interface CricApiScorecardInnings {
  inning?: string;
  batting?: CricApiBatterCard[];
  bowling?: CricApiBowlerCard[];
}

interface CricsheetDelivery {
  batter?: string;
  bowler?: string;
  non_striker?: string;
  runs?: {
    batter?: number;
    extras?: number;
    total?: number;
  };
  wickets?: Array<{
    player_out?: string;
    kind?: string;
  }>;
}

interface CricsheetOver {
  over?: number;
  deliveries?: CricsheetDelivery[];
}

interface CricsheetInnings {
  team?: string;
  overs?: CricsheetOver[];
}

interface CricsheetMatch {
  info?: {
    dates?: string[];
    teams?: string[];
    event?: { name?: string };
  };
  innings?: CricsheetInnings[];
}

interface PrimaryMatchSnapshot {
  totalRuns: number;
  highestInnings: number;
  totalWickets: number;
  totalSixes: number;
  matchExtras: number;
  teamTotals: Map<string, number>;
  teamTopScores: Map<string, number>;
  playerRuns: Map<string, number>;
  playerWickets: Map<string, number>;
}

interface DetailedInningsSnapshot {
  powerplayRunsByTeam: Map<string, number>;
  openingPartnershipByTeam: Map<string, number>;
}

const CRICSHEET_ARCHIVE_URL =
  "https://cricsheet.org/downloads/recently_played_30_male_json.zip";
const CRICSHEET_EVENT_NAME = "Indian Premier League";
const UNRESOLVED_PUSH_GRACE_HOURS = 6;
const NON_BOWLER_WICKET_KINDS = new Set([
  "run out",
  "retired hurt",
  "retired out",
  "obstructing the field",
]);
const cricsheetSeasonCache = new Map<string, Promise<CricsheetMatch[]>>();

function normalizeToken(value: string | undefined): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchDateKey(match: IPLMatch): string {
  const raw = match.date || match.dateTimeGMT || "";
  return raw.includes("T") ? raw.slice(0, 10) : raw;
}

function getMatchAgeHours(match: IPLMatch): number {
  const kickoff = getMatchKickoffTime(match);
  if (Number.isNaN(kickoff)) return 0;
  return (Date.now() - kickoff) / (1000 * 60 * 60);
}

function getCricsheetMatchAgeHours(cricsheetMatch: CricsheetMatch | null): number {
  const dateKey = cricsheetMatch?.info?.dates?.[0];
  if (!dateKey) return 0;
  const kickoff = new Date(`${dateKey}T00:00:00Z`).getTime();
  if (Number.isNaN(kickoff)) return 0;
  return (Date.now() - kickoff) / (1000 * 60 * 60);
}

function extractBetTeams(bets: BetLine[]): string[] {
  const seen = new Set<string>();
  const teams: string[] = [];

  for (const bet of bets) {
    if (!bet.teamName) continue;
    const key = normalizeToken(bet.teamName);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    teams.push(bet.teamName);
  }

  return teams;
}

function getOtherTeam(match: IPLMatch, teamName: string): string | null {
  const target = normalizeToken(teamName);
  return match.teams.find((team) => normalizeToken(team) !== target) || null;
}

function inferInningsTeam(match: IPLMatch, inningsLabel: string | undefined, index: number): string | null {
  const label = normalizeToken(inningsLabel);
  for (const team of match.teams || []) {
    if (label.includes(normalizeToken(team))) return team;
  }
  return match.teams[index] || null;
}

function getTeamScoreEntry(match: IPLMatch, teamName: string, indexHint: number) {
  const target = normalizeToken(teamName);
  const innings = match.score || [];
  return (
    innings.find((entry) => normalizeToken(entry.inning).includes(target)) ||
    innings[indexHint] ||
    null
  );
}

function winnerForBet(bet: BetLine, actualValue: number): "over" | "under" | "push" {
  if (Math.abs(actualValue - bet.line) < 0.01) return "push";
  return actualValue > bet.line ? "over" : "under";
}

function deriveActualValueFromMatchSummary(bet: BetLine, match: IPLMatch): number | null {
  const innings = match.score || [];
  if (!innings.length) return null;

  if (bet.shortDesc === "Match Total Runs") {
    return innings.reduce((sum, entry) => sum + (entry.r || 0), 0);
  }

  if (bet.shortDesc === "Highest Innings") {
    return innings.reduce((max, entry) => Math.max(max, entry.r || 0), 0);
  }

  if (bet.shortDesc === "Match Total Wickets") {
    return innings.reduce((sum, entry) => sum + (entry.w || 0), 0);
  }

  if (bet.category === "Innings" && bet.shortDesc.endsWith(" Total") && bet.teamName) {
    const scoreEntry = getTeamScoreEntry(match, bet.teamName, 0);
    return scoreEntry?.r ?? null;
  }

  return null;
}

function buildPrimarySnapshot(match: IPLMatch & { scorecard?: CricApiScorecardInnings[] }): PrimaryMatchSnapshot {
  const teamTotals = new Map<string, number>();
  const teamTopScores = new Map<string, number>();
  const playerRuns = new Map<string, number>();
  const playerWickets = new Map<string, number>();

  let totalRuns = 0;
  let highestInnings = 0;
  let totalWickets = 0;
  let totalSixes = 0;
  let matchExtras = 0;

  const inningsCards = match.scorecard || [];

  inningsCards.forEach((innings, index) => {
    const teamName = inferInningsTeam(match, innings.inning, index);
    if (!teamName) return;

    const scoreEntry = getTeamScoreEntry(match, teamName, index);
    const inningsRuns = scoreEntry?.r ?? 0;
    const inningsWickets = scoreEntry?.w ?? 0;
    const battingCards = innings.batting || [];
    const bowlingCards = innings.bowling || [];

    const battingRuns = battingCards.reduce((sum, batter) => sum + (batter.r || 0), 0);
    const topScore = battingCards.reduce((max, batter) => Math.max(max, batter.r || 0), 0);
    const inningsSixes = battingCards.reduce((sum, batter) => sum + (batter["6s"] || 0), 0);

    teamTotals.set(normalizeToken(teamName), inningsRuns);
    teamTopScores.set(normalizeToken(teamName), topScore);

    totalRuns += inningsRuns;
    highestInnings = Math.max(highestInnings, inningsRuns);
    totalWickets += inningsWickets;
    totalSixes += inningsSixes;
    matchExtras += Math.max(0, inningsRuns - battingRuns);

    battingCards.forEach((batter) => {
      const name = normalizeToken(batter.batsman?.name);
      if (!name) return;
      playerRuns.set(name, (playerRuns.get(name) || 0) + (batter.r || 0));
    });

    const bowlingTeam = getOtherTeam(match, teamName);
    if (!bowlingTeam) return;

    bowlingCards.forEach((bowler) => {
      const name = normalizeToken(bowler.bowler?.name);
      if (!name) return;
      playerWickets.set(name, (playerWickets.get(name) || 0) + (bowler.w || 0));
    });
  });

  return {
    totalRuns,
    highestInnings,
    totalWickets,
    totalSixes,
    matchExtras,
    teamTotals,
    teamTopScores,
    playerRuns,
    playerWickets,
  };
}

function buildCricsheetPrimarySnapshot(cricsheetMatch: CricsheetMatch): PrimaryMatchSnapshot | null {
  if (!cricsheetMatch.innings?.length) return null;

  const teamTotals = new Map<string, number>();
  const teamTopScores = new Map<string, number>();
  const playerRuns = new Map<string, number>();
  const playerWickets = new Map<string, number>();

  let totalRuns = 0;
  let highestInnings = 0;
  let totalWickets = 0;
  let totalSixes = 0;
  let matchExtras = 0;

  for (const innings of cricsheetMatch.innings) {
    const teamName = normalizeToken(innings.team);
    if (!teamName) continue;

    const batterRuns = new Map<string, number>();
    let inningsTotal = 0;
    let inningsExtras = 0;
    let inningsWickets = 0;

    for (const over of innings.overs || []) {
      for (const delivery of over.deliveries || []) {
        const batterName = normalizeToken(delivery.batter);
        const deliveryRuns = delivery.runs?.total || 0;
        const batterRunValue = delivery.runs?.batter || 0;
        const extraRuns = delivery.runs?.extras || 0;

        inningsTotal += deliveryRuns;
        inningsExtras += extraRuns;

        if (batterName) {
          batterRuns.set(batterName, (batterRuns.get(batterName) || 0) + batterRunValue);
          playerRuns.set(batterName, (playerRuns.get(batterName) || 0) + batterRunValue);
        }

        if (batterRunValue === 6) {
          totalSixes += 1;
        }

        const creditedWickets = (delivery.wickets || []).filter(
          (wicket) => !NON_BOWLER_WICKET_KINDS.has(normalizeToken(wicket.kind))
        );
        const validWickets = (delivery.wickets || []).filter(
          (wicket) => normalizeToken(wicket.kind) !== "retired hurt"
        );

        inningsWickets += validWickets.length;

        const bowlerName = normalizeToken(delivery.bowler);
        if (bowlerName && creditedWickets.length) {
          playerWickets.set(
            bowlerName,
            (playerWickets.get(bowlerName) || 0) + creditedWickets.length
          );
        }
      }
    }

    const topScore = Array.from(batterRuns.values()).reduce((max, runs) => Math.max(max, runs), 0);
    teamTotals.set(teamName, inningsTotal);
    teamTopScores.set(teamName, topScore);

    totalRuns += inningsTotal;
    highestInnings = Math.max(highestInnings, inningsTotal);
    totalWickets += inningsWickets;
    matchExtras += inningsExtras;
  }

  return {
    totalRuns,
    highestInnings,
    totalWickets,
    totalSixes,
    matchExtras,
    teamTotals,
    teamTopScores,
    playerRuns,
    playerWickets,
  };
}

function getPlayerMetric(metricMap: Map<string, number>, playerName: string | undefined): number | null {
  const target = normalizeToken(playerName);
  if (!target) return null;

  const direct = metricMap.get(target);
  if (direct !== undefined) return direct;

  const tokens = target.split(" ").filter(Boolean);
  if (!tokens.length) return null;

  const surname = tokens[tokens.length - 1];
  const initials = tokens.slice(0, -1).map((token) => token[0]).join("");
  const firstInitial = tokens[0][0] || "";

  const candidates = Array.from(metricMap.entries()).filter(([candidate]) => {
    const candidateTokens = candidate.split(" ").filter(Boolean);
    if (!candidateTokens.length) return false;
    const candidateSurname = candidateTokens[candidateTokens.length - 1];
    if (candidateSurname !== surname) return false;

    const candidateInitials = candidateTokens.slice(0, -1).join("");
    return !!candidateInitials && candidateInitials[0] === firstInitial;
  });

  if (candidates.length === 1) {
    return candidates[0][1];
  }

  const tighter = candidates.find(([candidate]) => {
    const candidateTokens = candidate.split(" ").filter(Boolean);
    const candidateInitials = candidateTokens.slice(0, -1).join("");
    return (
      candidateInitials === initials ||
      candidateInitials.startsWith(initials) ||
      initials.startsWith(candidateInitials)
    );
  });

  return tighter ? tighter[1] : null;
}

function computeOpeningPartnership(innings: CricsheetInnings): number | null {
  const overs = innings.overs || [];
  const firstDelivery = overs.flatMap((over) => over.deliveries || []).find(Boolean);
  if (!firstDelivery?.batter || !firstDelivery.non_striker) return null;

  const openers = new Set([firstDelivery.batter, firstDelivery.non_striker]);
  let total = 0;

  for (const over of overs) {
    for (const delivery of over.deliveries || []) {
      total += delivery.runs?.total || 0;
      const openingWicket = (delivery.wickets || []).some(
        (wicket) => wicket.player_out && openers.has(wicket.player_out)
      );
      if (openingWicket) {
        return total;
      }
    }
  }

  return total;
}

function buildDetailedSnapshot(cricsheetMatch: CricsheetMatch | null): DetailedInningsSnapshot | null {
  if (!cricsheetMatch?.innings?.length) return null;

  const powerplayRunsByTeam = new Map<string, number>();
  const openingPartnershipByTeam = new Map<string, number>();

  for (const innings of cricsheetMatch.innings) {
    const teamName = normalizeToken(innings.team);
    if (!teamName) continue;

    const powerplayRuns = (innings.overs || [])
      .filter((over) => (over.over ?? 99) < 6)
      .reduce(
        (total, over) =>
          total +
          (over.deliveries || []).reduce(
            (overTotal, delivery) => overTotal + (delivery.runs?.total || 0),
            0
          ),
        0
      );

    const openingPartnership = computeOpeningPartnership(innings);

    powerplayRunsByTeam.set(teamName, powerplayRuns);
    if (openingPartnership !== null) {
      openingPartnershipByTeam.set(teamName, openingPartnership);
    }
  }

  return {
    powerplayRunsByTeam,
    openingPartnershipByTeam,
  };
}

async function getCricsheetSeasonMatches(seasonYear: string): Promise<CricsheetMatch[]> {
  const cached = cricsheetSeasonCache.get(seasonYear);
  if (cached) return cached;

  const pending = (async () => {
    const res = await fetch(CRICSHEET_ARCHIVE_URL, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Cricsheet archive fetch failed: ${res.status}`);
    }

    const buffer = new Uint8Array(await res.arrayBuffer());
    const files = unzipSync(buffer);
    const matches: CricsheetMatch[] = [];

    for (const [fileName, contents] of Object.entries(files)) {
      if (!fileName.endsWith(".json")) continue;

      const parsed = JSON.parse(strFromU8(contents)) as CricsheetMatch;
      const dates = parsed.info?.dates || [];
      if (
        parsed.info?.event?.name !== CRICSHEET_EVENT_NAME ||
        !dates.some((date) => date.startsWith(`${seasonYear}-`))
      ) {
        continue;
      }

      matches.push(parsed);
    }

    return matches;
  })();

  cricsheetSeasonCache.set(seasonYear, pending);

  try {
    return await pending;
  } catch (err) {
    cricsheetSeasonCache.delete(seasonYear);
    throw err;
  }
}

async function findCricsheetMatch(
  match: IPLMatch | null,
  fallbackTeams: string[] = []
): Promise<CricsheetMatch | null> {
  const dateKey = match ? matchDateKey(match) : "";
  const seasonYear = (dateKey || new Date().toISOString().slice(0, 10)).slice(0, 4);
  if (!seasonYear) return null;

  const seasonMatches = await getCricsheetSeasonMatches(seasonYear);
  const teamSource = match?.teams?.length ? match.teams : fallbackTeams;
  const targetTeams = new Set(teamSource.map(normalizeToken));
  if (!targetTeams.size) return null;

  const teamMatches = seasonMatches.filter((candidate) => {
    const teams = candidate.info?.teams || [];
    if (teams.length !== targetTeams.size) return false;
    return teams.every((team) => targetTeams.has(normalizeToken(team)));
  });

  if (!dateKey) {
    return teamMatches.length === 1 ? teamMatches[0] : null;
  }

  return (
    teamMatches.find((candidate) => (candidate.info?.dates || []).includes(dateKey)) || null
  );
}

function deriveActualValueForBet(
  bet: BetLine,
  primary: PrimaryMatchSnapshot,
  detailed: DetailedInningsSnapshot | null
): number | null {
  const teamKey = normalizeToken(bet.teamName);
  const playerKey = normalizeToken(bet.playerName);

  if (bet.shortDesc === "Match Total Runs") return primary.totalRuns;
  if (bet.shortDesc === "Highest Innings") return primary.highestInnings;
  if (bet.shortDesc === "Match Total Wickets") return primary.totalWickets;
  if (bet.shortDesc === "Match Total Sixes") return primary.totalSixes;
  if (bet.shortDesc === "Match Extras") return primary.matchExtras;

  if (bet.category === "Innings" && bet.shortDesc.endsWith(" Total")) {
    return primary.teamTotals.get(teamKey) ?? null;
  }

  if (bet.category === "Innings" && bet.shortDesc.endsWith(" Powerplay")) {
    return detailed?.powerplayRunsByTeam.get(teamKey) ?? null;
  }

  if (bet.category === "Opening" && bet.shortDesc.endsWith(" Opening Stand")) {
    return detailed?.openingPartnershipByTeam.get(teamKey) ?? null;
  }

  if (bet.category === "Batting" && bet.isPlayerProp && playerKey) {
    return getPlayerMetric(primary.playerRuns, bet.playerName) ?? 0;
  }

  if (bet.category === "Bowling" && bet.isPlayerProp && playerKey) {
    return getPlayerMetric(primary.playerWickets, bet.playerName) ?? 0;
  }

  if (bet.category === "Batting" && bet.shortDesc.endsWith(" Top Score")) {
    return primary.teamTopScores.get(teamKey) ?? null;
  }

  return null;
}

export async function applyResolvedBetValues(
  matchId: string,
  results: ResolvedBetInput[]
): Promise<{ resolvedBets: number; updatedParlays: number }> {
  const bets = await getBets(matchId);
  if (!bets) {
    throw new Error("No bets found for match");
  }

  let resolvedBets = 0;

  for (const { betId, actualValue } of results) {
    const bet = bets.find((candidate) => candidate.id === betId);
    if (!bet) continue;

    await updateBetResult(matchId, betId, actualValue, winnerForBet(bet, actualValue));
    resolvedBets += 1;
  }

  const updatedBets = await getBets(matchId);
  const parlays = await getParlaysForMatch(matchId);
  const resolvedBetMap = new Map(
    (updatedBets || []).filter((bet) => bet.result).map((bet) => [bet.id, bet])
  );

  let updatedParlays = 0;

  for (const parlay of parlays) {
    const legResults = parlay.legs.map((leg) => {
      const bet = resolvedBetMap.get(leg.betId);
      if (!bet?.result) return "pending";
      if (bet.result.winner === "push") return "push";

      const isOver = leg.direction === "over" || leg.direction === "yes";
      if (
        (isOver && bet.result.winner === "over") ||
        (!isOver && bet.result.winner === "under")
      ) {
        return "won";
      }
      return "lost";
    });

    if (legResults.some((result) => result === "pending")) continue;

    const anyLost = legResults.some((result) => result === "lost");
    const allPush = legResults.every((result) => result === "push");

    if (anyLost) {
      await updateParlayStatus(parlay.id, "lost", 0);
      updatedParlays += 1;
      continue;
    }

    if (allPush) {
      await updateParlayStatus(parlay.id, "push", parlay.betAmount);
      updatedParlays += 1;
      continue;
    }

    const winningLegOdds = parlay.legs
      .filter((_, index) => legResults[index] === "won")
      .map((leg) => leg.odds);
    await updateParlayStatus(
      parlay.id,
      "won",
      calculateParlayPayout(parlay.betAmount, winningLegOdds)
    );
    updatedParlays += 1;
  }

  return { resolvedBets, updatedParlays };
}

async function settleMatchAutomatically(matchId: string): Promise<AutoSettlementMatchResult> {
  const [liveMatch, storedMatch, bets, parlays] = await Promise.all([
    getMatchById(matchId),
    getMatchMetadata(matchId),
    getBets(matchId),
    getParlaysForMatch(matchId),
  ]);

  if (!bets?.length || !parlays.length) {
    return {
      matchId,
      status: "skipped",
      resolvedBets: 0,
      updatedParlays: 0,
      unresolvedBetIds: [],
      reason: "no-bets-or-parlays",
    };
  }

  const unresolvedBets = bets.filter((bet) => !bet.result);
  const hasPendingParlays = parlays.some((parlay) => parlay.status === "pending");
  if (!unresolvedBets.length && !hasPendingParlays) {
    return {
      matchId,
      status: "skipped",
      resolvedBets: 0,
      updatedParlays: 0,
      unresolvedBetIds: [],
      reason: "already-settled",
    };
  }

  const match = liveMatch || storedMatch;
  const betTeams = extractBetTeams(bets);

  let cricsheetMatch: CricsheetMatch | null = null;
  try {
    cricsheetMatch = await findCricsheetMatch(match, betTeams);
  } catch (err) {
    console.warn(`Cricsheet lookup failed for ${matchId}:`, err);
  }

  const matchIsComplete = !!cricsheetMatch || !!(match && (isMatchCompleted(match) || match.matchEnded));
  if (!matchIsComplete) {
    return {
      matchId,
      status: "skipped",
      resolvedBets: 0,
      updatedParlays: 0,
      unresolvedBetIds: [],
      reason: match ? "match-not-complete" : "match-not-found",
    };
  }

  let primary: PrimaryMatchSnapshot | null = null;

  try {
    const scorecard = await getMatchScorecard(matchId);
    if (scorecard?.scorecard?.length) {
      primary = buildPrimarySnapshot(scorecard);
    }
  } catch (err) {
    console.warn(`CricAPI scorecard lookup failed for ${matchId}:`, err);
  }

  if (!primary && cricsheetMatch) {
    primary = buildCricsheetPrimarySnapshot(cricsheetMatch);
  }

  const hasScoreSummary = !!match?.score?.length;
  if (!primary && !hasScoreSummary) {
    return {
      matchId,
      status: "pending",
      resolvedBets: 0,
      updatedParlays: 0,
      unresolvedBetIds: unresolvedBets.map((bet) => bet.id),
      reason: "score-data-unavailable",
    };
  }

  const needsDetailedData = unresolvedBets.some(
    (bet) =>
      (bet.category === "Innings" && bet.shortDesc.endsWith(" Powerplay")) ||
      bet.category === "Opening"
  );

  const detailed = needsDetailedData ? buildDetailedSnapshot(cricsheetMatch) : null;

  const results: ResolvedBetInput[] = [];
  const stillUnresolved: string[] = [];

  for (const bet of unresolvedBets) {
    const actualValue =
      (primary ? deriveActualValueForBet(bet, primary, detailed) : null) ??
      (match ? deriveActualValueFromMatchSummary(bet, match) : null);
    if (actualValue === null) {
      stillUnresolved.push(bet.id);
      continue;
    }

    results.push({ betId: bet.id, actualValue });
  }

  const matchAgeHours = match ? getMatchAgeHours(match) : getCricsheetMatchAgeHours(cricsheetMatch);

  if (stillUnresolved.length && matchAgeHours >= UNRESOLVED_PUSH_GRACE_HOURS) {
    for (const betId of stillUnresolved) {
      const bet = unresolvedBets.find((candidate) => candidate.id === betId);
      if (!bet) continue;
      results.push({ betId, actualValue: bet.line });
    }
  }

  if (!results.length) {
    return {
      matchId,
      status: "pending",
      resolvedBets: 0,
      updatedParlays: 0,
      unresolvedBetIds: stillUnresolved,
      reason: detailed ? "awaiting-final-data" : "awaiting-detailed-data",
    };
  }

  const settlement = await applyResolvedBetValues(matchId, results);
  const unresolvedAfterSettlement = unresolvedBets
    .map((bet) => bet.id)
    .filter((betId) => !results.some((result) => result.betId === betId));

  return {
    matchId,
    status: unresolvedAfterSettlement.length ? "pending" : "settled",
    resolvedBets: settlement.resolvedBets,
    updatedParlays: settlement.updatedParlays,
    unresolvedBetIds: unresolvedAfterSettlement,
    reason: unresolvedAfterSettlement.length ? "partial-settlement" : undefined,
  };
}

export async function runAutomaticSettlement(): Promise<AutoSettlementSummary> {
  const matchIds = await getAllMatchIds();
  const results: AutoSettlementMatchResult[] = [];

  for (const matchId of matchIds) {
    results.push(await settleMatchAutomatically(matchId));
  }

  return {
    checkedMatches: results.length,
    settledMatches: results.filter((result) => result.status === "settled").length,
    resolvedBets: results.reduce((sum, result) => sum + result.resolvedBets, 0),
    updatedParlays: results.reduce((sum, result) => sum + result.updatedParlays, 0),
    pendingMatches: results.filter((result) => result.status === "pending").length,
    skippedMatches: results.filter((result) => result.status === "skipped").length,
    results,
  };
}
