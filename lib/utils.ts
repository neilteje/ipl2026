import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BetLine, ParlayLeg, IPLMatch } from "@/types";

const BETTING_CLOSE_BUFFER_MS = 60 * 60 * 1000;

function parseMatchTimestamp(rawValue?: string, assumeUtc = false): number {
  const raw = rawValue?.trim();
  if (!raw) return Number.NaN;

  const normalized = raw.replace(" ", "T");
  if (assumeUtc) {
    const withTimezone =
      /(?:z|[+-]\d{2}:?\d{2})$/i.test(normalized) ? normalized : `${normalized}Z`;
    const utcTimestamp = Date.parse(withTimezone);
    if (!Number.isNaN(utcTimestamp)) return utcTimestamp;
  }

  const direct = Date.parse(raw);
  if (!Number.isNaN(direct)) return direct;

  return Date.parse(normalized);
}

export function getMatchKickoffTime(match: Pick<IPLMatch, "dateTimeGMT" | "date">): number {
  const gmtKickoff = parseMatchTimestamp(match.dateTimeGMT, true);
  if (!Number.isNaN(gmtKickoff)) return gmtKickoff;

  return parseMatchTimestamp(match.date);
}

export function getBettingCloseTime(match: Pick<IPLMatch, "dateTimeGMT" | "date">): number {
  const kickoff = getMatchKickoffTime(match);
  if (Number.isNaN(kickoff)) return Number.NaN;
  return kickoff - BETTING_CLOSE_BUFFER_MS;
}

/**
 * Whether a fixture is finished for home-page grouping.
 * CricAPI often uses statuses like "Toss won by MI, elected to field" — naive `status.includes("won")`
 * treats those as completed and hides them from Upcoming. Use this instead.
 */
export function isMatchCompleted(m: IPLMatch): boolean {
  if (m.matchWinner) return true;

  const raw = (m.status || "").trim();
  const s = raw.toLowerCase();
  if (!s) return false;

  // Pre-match or in progress — not "completed" for the list
  const ongoingOrNotStarted =
    /not started|scheduled|starts at|yet to begin|match starts|fixture|upcoming|toss won|elected to|opted to|choose to|innings break|drinks|stumps|rain|delay|live\b|powerplay|strategic timeout|super over -|over \d+\.\d+/i.test(
      s
    );
  if (ongoingOrNotStarted) return false;

  // Clear end states
  if (
    /\b(won by|won the match|won with|beat |defeated|match tied|tied\b|no result|abandoned|match ended|innings completed|result:)/i.test(
      raw
    )
  ) {
    return true;
  }

  // "… won by 5 wickets" style without matchWinner yet
  if (/\bwon by\b.*\b(runs|wickets)\b/i.test(s)) return true;

  // Future kickoff with no finish signal → treat as upcoming
  const kickoff = getMatchKickoffTime(m);
  if (!Number.isNaN(kickoff) && kickoff > Date.now()) return false;

  return false;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDisplayMatchName(match: Pick<IPLMatch, "name" | "teams">): string {
  if (match.teams?.length === 2) {
    return `${match.teams[0]} vs ${match.teams[1]}`;
  }
  return (match.name || "").split(",")[0].trim();
}

export function normalizeUserName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isBettingOpen(match: IPLMatch): boolean {
  if (match.matchEnded || match.matchStarted) return false;
  if (isMatchCompleted(match)) return false;

  const bettingCloseTime = getBettingCloseTime(match);
  if (!Number.isNaN(bettingCloseTime) && Date.now() >= bettingCloseTime) return false;

  return true;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

type ParlayPricingInput = number | number[] | Array<{ odds: number }>;

const TYPICAL_LEG_ODDS = 1.82;
const CORRELATION_PRICING_VERSION = "correlation-v1";

type MarketFamily =
  | "match_total_runs"
  | "match_total_wickets"
  | "match_total_sixes"
  | "highest_innings"
  | "match_extras"
  | "team_total"
  | "team_powerplay"
  | "team_opening"
  | "team_top_score"
  | "player_runs"
  | "player_wickets"
  | "other";

type CorrelationFactors = Map<string, number>;

export interface ParlayValidationResult {
  valid: boolean;
  error?: string;
}

export interface ParlayQuote {
  pricingModel: typeof CORRELATION_PRICING_VERSION;
  rawMultiplier: number;
  multiplier: number;
  rawPotentialPayout: number;
  potentialPayout: number;
  correlationDiscountPct: number;
  correlationScore: number;
}

function getParlayOdds(input: ParlayPricingInput): number[] {
  if (typeof input === "number") {
    return Array.from({ length: Math.max(0, input) }, () => TYPICAL_LEG_ODDS);
  }

  return input
    .map((value) => (typeof value === "number" ? value : value.odds))
    .filter((value) => Number.isFinite(value) && value > 1);
}

export function calculateParlayPayout(betAmount: number, input: ParlayPricingInput): number {
  const multiplier = getParlayMultiplier(input);
  return Math.round(betAmount * multiplier * 100) / 100;
}

export function getParlayMultiplier(input: ParlayPricingInput): number {
  const odds = getParlayOdds(input);
  if (!odds.length) return 0;
  return Math.round(odds.reduce((product, odd) => product * odd, 1) * 100) / 100;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeEntityKey(value?: string): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getMarketFamily(bet: BetLine): MarketFamily {
  if (bet.category === "Match" && bet.shortDesc === "Match Total Runs") return "match_total_runs";
  if (bet.category === "Match" && bet.shortDesc === "Match Total Wickets") return "match_total_wickets";
  if (bet.category === "Match" && bet.shortDesc === "Match Total Sixes") return "match_total_sixes";
  if (bet.category === "Match" && bet.shortDesc === "Highest Innings") return "highest_innings";
  if (bet.category === "Extras") return "match_extras";
  if (bet.category === "Innings" && bet.shortDesc.endsWith(" Total")) return "team_total";
  if (bet.category === "Innings" && bet.shortDesc.endsWith(" Powerplay")) return "team_powerplay";
  if (bet.category === "Opening" && bet.shortDesc.endsWith(" Opening Stand")) return "team_opening";
  if (bet.category === "Batting" && bet.shortDesc.endsWith(" Top Score")) return "team_top_score";
  if (bet.category === "Batting" && bet.isPlayerProp) return "player_runs";
  if (bet.category === "Bowling" && bet.isPlayerProp) return "player_wickets";
  return "other";
}

function getSelectionGroupKey(bet: BetLine): string {
  const family = getMarketFamily(bet);

  if (family === "player_runs" || family === "player_wickets") {
    return `${family}:${normalizeEntityKey(bet.playerName)}`;
  }

  if (
    family === "team_total" ||
    family === "team_powerplay" ||
    family === "team_opening" ||
    family === "team_top_score"
  ) {
    return `${family}:${normalizeEntityKey(bet.teamName)}`;
  }

  return `${family}:${normalizeEntityKey(bet.shortDesc)}`;
}

function getSelectionGroupLabel(bet: BetLine): string {
  const family = getMarketFamily(bet);

  if (family === "player_runs") return `${bet.playerName} runs`;
  if (family === "player_wickets") return `${bet.playerName} wickets`;
  if (family === "team_total") return `${bet.teamName} total`;
  if (family === "team_powerplay") return `${bet.teamName} powerplay`;
  if (family === "team_opening") return `${bet.teamName} opening partnership`;
  if (family === "team_top_score") return `${bet.teamName} top batter`;
  if (family === "match_total_runs") return "match total runs";
  if (family === "match_total_wickets") return "match total wickets";
  if (family === "match_total_sixes") return "match total sixes";
  if (family === "highest_innings") return "highest innings";
  if (family === "match_extras") return "match extras";
  return bet.shortDesc;
}

function getDirectionSign(direction: ParlayLeg["direction"]): number {
  return direction === "over" || direction === "yes" ? 1 : -1;
}

function buildBoardTeams(bets: BetLine[]): string[] {
  const seen = new Set<string>();
  const teams: string[] = [];

  for (const bet of bets) {
    if (!bet.teamName) continue;
    const key = normalizeEntityKey(bet.teamName);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    teams.push(bet.teamName);
  }

  return teams;
}

function getOpponentTeam(teamName: string | undefined, boardTeams: string[]): string | null {
  const target = normalizeEntityKey(teamName);
  if (!target) return null;
  return boardTeams.find((team) => normalizeEntityKey(team) !== target) || null;
}

function addFactor(factors: CorrelationFactors, key: string | null, weight: number) {
  if (!key || Math.abs(weight) < 0.001) return;
  factors.set(key, (factors.get(key) || 0) + weight);
}

function buildCorrelationFactors(
  bet: BetLine,
  direction: ParlayLeg["direction"],
  boardTeams: string[]
): CorrelationFactors {
  const factors = new Map<string, number>();
  const sign = getDirectionSign(direction);
  const family = getMarketFamily(bet);
  const teamKey = bet.teamName ? `team:${normalizeEntityKey(bet.teamName)}:batting` : null;
  const playerKey = bet.playerName
    ? `player:${normalizeEntityKey(bet.playerName)}:${family}`
    : null;
  const opponentTeam = getOpponentTeam(bet.teamName, boardTeams);
  const opponentKey = opponentTeam ? `team:${normalizeEntityKey(opponentTeam)}:batting` : null;

  switch (family) {
    case "match_total_runs":
      addFactor(factors, "script:scoring", sign * 1);
      boardTeams.forEach((team) =>
        addFactor(factors, `team:${normalizeEntityKey(team)}:batting`, sign * 0.35)
      );
      break;
    case "match_total_sixes":
      addFactor(factors, "script:scoring", sign * 0.75);
      break;
    case "highest_innings":
      addFactor(factors, "script:scoring", sign * 0.7);
      break;
    case "match_total_wickets":
      addFactor(factors, "script:wickets", sign * 1);
      addFactor(factors, "script:scoring", sign * -0.35);
      break;
    case "match_extras":
      addFactor(factors, "script:wickets", sign * 0.15);
      break;
    case "team_total":
      addFactor(factors, teamKey, sign * 1);
      addFactor(factors, "script:scoring", sign * 0.65);
      addFactor(factors, "script:wickets", sign * -0.25);
      break;
    case "team_powerplay":
      addFactor(factors, teamKey, sign * 0.78);
      addFactor(factors, "script:scoring", sign * 0.3);
      break;
    case "team_opening":
      addFactor(factors, teamKey, sign * 0.82);
      addFactor(factors, "script:wickets", sign * -0.2);
      addFactor(factors, "script:scoring", sign * 0.22);
      break;
    case "team_top_score":
      addFactor(factors, teamKey, sign * 0.62);
      addFactor(factors, "script:scoring", sign * 0.18);
      break;
    case "player_runs":
      addFactor(factors, playerKey, sign * 1);
      addFactor(factors, teamKey, sign * 0.58);
      addFactor(factors, "script:scoring", sign * 0.2);
      break;
    case "player_wickets":
      addFactor(factors, playerKey, sign * 1);
      addFactor(factors, opponentKey, sign * -0.92);
      addFactor(factors, "script:wickets", sign * 0.82);
      addFactor(factors, "script:scoring", sign * -0.25);
      break;
    default:
      break;
  }

  return factors;
}

function getPairCorrelationScore(
  left: CorrelationFactors,
  right: CorrelationFactors
): number {
  let score = 0;

  left.forEach((leftWeight, key) => {
    const rightWeight = right.get(key);
    if (rightWeight === undefined) return;
    if (Math.sign(leftWeight) !== Math.sign(rightWeight)) return;

    score += Math.min(Math.abs(leftWeight), Math.abs(rightWeight));
  });

  return Math.min(score, 1.35);
}

export function validateParlayLegs(
  legs: ParlayLeg[],
  bets: BetLine[]
): ParlayValidationResult {
  const betById = new Map(bets.map((bet) => [bet.id, bet]));
  const seenGroups = new Map<string, BetLine>();

  for (const leg of legs) {
    const bet = betById.get(leg.betId);
    if (!bet) continue;

    const groupKey = getSelectionGroupKey(bet);
    const previous = seenGroups.get(groupKey);
    if (!previous) {
      seenGroups.set(groupKey, bet);
      continue;
    }

    if (bet.playerName && previous.playerName && bet.playerName === previous.playerName) {
      return {
        valid: false,
        error: `Same-player ladders are not allowed. Keep just one ${getSelectionGroupLabel(bet)} leg.`,
      };
    }

    return {
      valid: false,
      error: `Only one ${getSelectionGroupLabel(bet)} line is allowed in a single parlay.`,
    };
  }

  return { valid: true };
}

export function quoteParlay(
  betAmount: number,
  legs: ParlayLeg[],
  bets: BetLine[]
): ParlayQuote {
  const rawMultiplier = getParlayMultiplier(legs);
  const rawPotentialPayout = calculateParlayPayout(betAmount, legs);

  if (legs.length <= 1) {
    return {
      pricingModel: CORRELATION_PRICING_VERSION,
      rawMultiplier,
      multiplier: rawMultiplier,
      rawPotentialPayout,
      potentialPayout: rawPotentialPayout,
      correlationDiscountPct: 0,
      correlationScore: 0,
    };
  }

  const boardTeams = buildBoardTeams(bets);
  const betById = new Map(bets.map((bet) => [bet.id, bet]));
  const factors = legs.map((leg) => {
    const bet = betById.get(leg.betId);
    return bet ? buildCorrelationFactors(bet, leg.direction, boardTeams) : new Map<string, number>();
  });

  let correlationScore = 0;

  for (let i = 0; i < factors.length; i += 1) {
    for (let j = i + 1; j < factors.length; j += 1) {
      correlationScore += getPairCorrelationScore(factors[i], factors[j]);
    }
  }

  const divisor = 1 + 0.16 * correlationScore + 0.04 * correlationScore * correlationScore;
  const multiplier = roundToTwo(rawMultiplier / divisor);
  const potentialPayout = roundToTwo(betAmount * multiplier);
  const correlationDiscountPct =
    rawMultiplier > 0 ? Math.max(0, 1 - multiplier / rawMultiplier) : 0;

  return {
    pricingModel: CORRELATION_PRICING_VERSION,
    rawMultiplier,
    multiplier,
    rawPotentialPayout,
    potentialPayout,
    correlationDiscountPct,
    correlationScore: roundToTwo(correlationScore),
  };
}

export function formatOdds(decimalOdds: number): string {
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) return "EVEN";

  if (decimalOdds >= 2) {
    return `+${Math.round((decimalOdds - 1) * 100)}`;
  }

  return `${Math.round(-100 / (decimalOdds - 1))}`;
}

export function formatDate(dateStr: string): string {
  try {
    const date = getDisplayDate(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatTime(dateStr: string): string {
  try {
    const date = getDisplayDate(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return "";
  }
}

function getDisplayDate(dateStr: string): Date {
  const trimmed = dateStr.trim();
  const timestamp = parseMatchTimestamp(
    trimmed,
    /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(trimmed)
  );
  return new Date(Number.isNaN(timestamp) ? trimmed : timestamp);
}

function formatTimeForZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

export function formatTimeCdtIst(dateStr: string): string {
  try {
    const date = getDisplayDate(dateStr);
    return `CDT ${formatTimeForZone(date, "America/Chicago")} · IST ${formatTimeForZone(date, "Asia/Kolkata")}`;
  } catch {
    return "";
  }
}

export function getTeamShortName(fullName: string): string {
  const normalized = fullName
    .split(",")[0]
    .replace(/\s+vs\s+.*/i, "")
    .trim();

  const shortNames: Record<string, string> = {
    "Chennai Super Kings": "CSK",
    "Mumbai Indians": "MI",
    "Royal Challengers Bengaluru": "RCB",
    "Royal Challengers Bangalore": "RCB",
    "Kolkata Knight Riders": "KKR",
    "Delhi Capitals": "DC",
    "Sunrisers Hyderabad": "SRH",
    "Punjab Kings": "PBKS",
    "Rajasthan Royals": "RR",
    "Gujarat Titans": "GT",
    "Lucknow Super Giants": "LSG",
  };
  return shortNames[normalized] || normalized.slice(0, 3).toUpperCase();
}

export function getTeamColor(shortName: string): string {
  const colors: Record<string, string> = {
    CSK: "#F9CD1F",
    MI: "#004BA0",
    RCB: "#EC1C24",
    KKR: "#3A225D",
    DC: "#00008B",
    SRH: "#FF822A",
    PBKS: "#ED1F27",
    RR: "#FFC0CB",
    GT: "#1D2951",
    LSG: "#A7D5F2",
  };
  return colors[shortName] || "#6366f1";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
