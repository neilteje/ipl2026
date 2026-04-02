import { BetLine, IPLMatch, TeamStats, VenueStats } from "@/types";
import { isMatchCompleted } from "@/lib/utils";
import { BatterProfile, BowlerProfile, getTeamPlayerPool } from "@/lib/player-pools";

interface CalibratedTeamStats extends TeamStats {
  sampleSize: number;
  avgRunsConceded: number;
  recentScored: number;
  recentConceded: number;
}

const TEAM_BASELINES: Record<string, TeamStats> = {
  "Chennai Super Kings": {
    battingStrength: 7.4,
    bowlingStrength: 7.5,
    powerplayAvg: 49,
    avgInningsScore: 168,
    sixesPerGame: 7.3,
    foursPerGame: 14.2,
    avgWicketsLost: 6.7,
    avgTopBatterScore: 56,
    avgLeadBowlerWickets: 2.0,
    avgExtrasConceded: 11.0,
  },
  "Mumbai Indians": {
    battingStrength: 8.8,
    bowlingStrength: 8.3,
    powerplayAvg: 54,
    avgInningsScore: 180,
    sixesPerGame: 9.5,
    foursPerGame: 15.0,
    avgWicketsLost: 6.4,
    avgTopBatterScore: 63,
    avgLeadBowlerWickets: 2.1,
    avgExtrasConceded: 10.5,
  },
  "Royal Challengers Bengaluru": {
    battingStrength: 8.6,
    bowlingStrength: 7.8,
    powerplayAvg: 53,
    avgInningsScore: 178,
    sixesPerGame: 9.0,
    foursPerGame: 15.0,
    avgWicketsLost: 6.8,
    avgTopBatterScore: 60,
    avgLeadBowlerWickets: 1.9,
    avgExtrasConceded: 10.8,
  },
  "Royal Challengers Bangalore": {
    battingStrength: 8.6,
    bowlingStrength: 7.8,
    powerplayAvg: 53,
    avgInningsScore: 178,
    sixesPerGame: 9.0,
    foursPerGame: 15.0,
    avgWicketsLost: 6.8,
    avgTopBatterScore: 60,
    avgLeadBowlerWickets: 1.9,
    avgExtrasConceded: 10.8,
  },
  "Kolkata Knight Riders": {
    battingStrength: 8.4,
    bowlingStrength: 8.2,
    powerplayAvg: 52,
    avgInningsScore: 176,
    sixesPerGame: 8.9,
    foursPerGame: 14.5,
    avgWicketsLost: 6.5,
    avgTopBatterScore: 59,
    avgLeadBowlerWickets: 2.0,
    avgExtrasConceded: 10.6,
  },
  "Delhi Capitals": {
    battingStrength: 7.8,
    bowlingStrength: 7.7,
    powerplayAvg: 49,
    avgInningsScore: 170,
    sixesPerGame: 7.4,
    foursPerGame: 13.7,
    avgWicketsLost: 7.1,
    avgTopBatterScore: 55,
    avgLeadBowlerWickets: 1.9,
    avgExtrasConceded: 11.3,
  },
  "Sunrisers Hyderabad": {
    battingStrength: 9.2,
    bowlingStrength: 7.6,
    powerplayAvg: 58,
    avgInningsScore: 184,
    sixesPerGame: 10.8,
    foursPerGame: 15.7,
    avgWicketsLost: 6.9,
    avgTopBatterScore: 64,
    avgLeadBowlerWickets: 1.9,
    avgExtrasConceded: 11.6,
  },
  "Punjab Kings": {
    battingStrength: 8.0,
    bowlingStrength: 7.4,
    powerplayAvg: 50,
    avgInningsScore: 171,
    sixesPerGame: 8.2,
    foursPerGame: 14.1,
    avgWicketsLost: 7.0,
    avgTopBatterScore: 56,
    avgLeadBowlerWickets: 1.8,
    avgExtrasConceded: 11.2,
  },
  "Rajasthan Royals": {
    battingStrength: 8.1,
    bowlingStrength: 7.9,
    powerplayAvg: 52,
    avgInningsScore: 174,
    sixesPerGame: 8.5,
    foursPerGame: 14.2,
    avgWicketsLost: 6.6,
    avgTopBatterScore: 58,
    avgLeadBowlerWickets: 2.0,
    avgExtrasConceded: 10.7,
  },
  "Gujarat Titans": {
    battingStrength: 7.7,
    bowlingStrength: 8.3,
    powerplayAvg: 48,
    avgInningsScore: 169,
    sixesPerGame: 7.4,
    foursPerGame: 13.5,
    avgWicketsLost: 6.4,
    avgTopBatterScore: 54,
    avgLeadBowlerWickets: 2.1,
    avgExtrasConceded: 10.4,
  },
  "Lucknow Super Giants": {
    battingStrength: 8.0,
    bowlingStrength: 7.8,
    powerplayAvg: 50,
    avgInningsScore: 172,
    sixesPerGame: 8.1,
    foursPerGame: 13.8,
    avgWicketsLost: 6.8,
    avgTopBatterScore: 57,
    avgLeadBowlerWickets: 1.9,
    avgExtrasConceded: 10.9,
  },
};

const DEFAULT_TEAM_STATS: TeamStats = {
  battingStrength: 7.8,
  bowlingStrength: 7.8,
  powerplayAvg: 50,
  avgInningsScore: 172,
  sixesPerGame: 8.0,
  foursPerGame: 14.0,
  avgWicketsLost: 6.8,
  avgTopBatterScore: 56,
  avgLeadBowlerWickets: 2.0,
  avgExtrasConceded: 11.0,
};

const VENUE_BASELINES: Record<string, VenueStats> = {
  wankhede: {
    name: "Wankhede Stadium",
    avgFirstInnings: 181,
    avgTotal: 356,
    pitchFactor: 1.06,
    avgSixes: 18,
  },
  chinnaswamy: {
    name: "M. Chinnaswamy Stadium",
    avgFirstInnings: 186,
    avgTotal: 365,
    pitchFactor: 1.1,
    avgSixes: 21,
  },
  "eden gardens": {
    name: "Eden Gardens",
    avgFirstInnings: 176,
    avgTotal: 345,
    pitchFactor: 1.02,
    avgSixes: 17,
  },
  chidambaram: {
    name: "MA Chidambaram Stadium",
    avgFirstInnings: 165,
    avgTotal: 323,
    pitchFactor: 0.94,
    avgSixes: 13,
  },
  "rajiv gandhi": {
    name: "Rajiv Gandhi International Stadium",
    avgFirstInnings: 178,
    avgTotal: 349,
    pitchFactor: 1.03,
    avgSixes: 18,
  },
  "sawai mansingh": {
    name: "Sawai Mansingh Stadium",
    avgFirstInnings: 171,
    avgTotal: 336,
    pitchFactor: 0.99,
    avgSixes: 15,
  },
  barsapara: {
    name: "Barsapara Cricket Stadium",
    avgFirstInnings: 174,
    avgTotal: 341,
    pitchFactor: 1.01,
    avgSixes: 16,
  },
  "arun jaitley": {
    name: "Arun Jaitley Stadium",
    avgFirstInnings: 172,
    avgTotal: 338,
    pitchFactor: 1.0,
    avgSixes: 16,
  },
  "narendra modi": {
    name: "Narendra Modi Stadium",
    avgFirstInnings: 175,
    avgTotal: 343,
    pitchFactor: 1.01,
    avgSixes: 16,
  },
  mullanpur: {
    name: "Mullanpur",
    avgFirstInnings: 174,
    avgTotal: 341,
    pitchFactor: 1.0,
    avgSixes: 16,
  },
  ekana: {
    name: "Ekana Stadium",
    avgFirstInnings: 167,
    avgTotal: 328,
    pitchFactor: 0.95,
    avgSixes: 13,
  },
  dharamsala: {
    name: "Dharamsala",
    avgFirstInnings: 183,
    avgTotal: 360,
    pitchFactor: 1.07,
    avgSixes: 18,
  },
  raipur: {
    name: "Raipur",
    avgFirstInnings: 176,
    avgTotal: 344,
    pitchFactor: 1.01,
    avgSixes: 16,
  },
};

const DEFAULT_VENUE: VenueStats = {
  name: "Neutral",
  avgFirstInnings: 172,
  avgTotal: 338,
  pitchFactor: 1,
  avgSixes: 16,
};

function getVenueBaseline(venueName: string): VenueStats {
  const lowerVenue = venueName.toLowerCase();

  for (const [needle, stats] of Object.entries(VENUE_BASELINES)) {
    if (lowerVenue.includes(needle)) return stats;
  }

  return DEFAULT_VENUE;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundToBookHalf(value: number): number {
  return Math.floor(value) + 0.5;
}

function deterministicJitter(matchId: string, seed: number, range: number): number {
  let hash = 0;
  const source = `${matchId}:${seed}`;

  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) & 0xffffffff;
  }

  const normalized = ((hash >>> 0) / 0xffffffff) - 0.5;
  return normalized * range;
}

function priorRunsAllowed(stats: TeamStats): number {
  return clamp(206 - stats.bowlingStrength * 4.5, 160, 182);
}

function blendPrior(prior: number, observed: number, sampleSize: number, maxWeight = 0.62): number {
  if (!sampleSize || !Number.isFinite(observed)) return prior;
  const weight = clamp(sampleSize / (sampleSize + 4), 0, maxWeight);
  return prior * (1 - weight) + observed * weight;
}

function normalizeToken(value: string | undefined): string {
  return (value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matchTimestamp(match: IPLMatch): number {
  return new Date(match.dateTimeGMT || match.date).getTime();
}

function getHistoricalMatches(match: IPLMatch, seasonMatches: IPLMatch[]): IPLMatch[] {
  const kickoff = matchTimestamp(match);

  return seasonMatches.filter((candidate) => {
    if (candidate.id === match.id) return false;
    if (!isMatchCompleted(candidate)) return false;

    const candidateTime = matchTimestamp(candidate);
    if (Number.isNaN(candidateTime)) return true;
    if (Number.isNaN(kickoff)) return true;

    return candidateTime < kickoff;
  });
}

function getTeamInnings(match: IPLMatch, teamName: string): { runs: number; wickets: number } | null {
  const innings = match.score || [];
  if (!innings.length) return null;

  const target = normalizeToken(teamName);
  const direct = innings.find((entry) => normalizeToken(entry.inning).includes(target));
  if (direct) {
    return { runs: direct.r, wickets: direct.w };
  }

  const teamIndex = (match.teams || []).findIndex((team) => normalizeToken(team) === target);
  if (teamIndex >= 0 && innings[teamIndex]) {
    return { runs: innings[teamIndex].r, wickets: innings[teamIndex].w };
  }

  return null;
}

function buildTeamModel(teamName: string, history: IPLMatch[]): CalibratedTeamStats {
  const baseline = TEAM_BASELINES[teamName] || DEFAULT_TEAM_STATS;
  const scored: number[] = [];
  const conceded: number[] = [];
  const wicketsLost: number[] = [];

  for (const match of history) {
    const ownInnings = getTeamInnings(match, teamName);
    if (!ownInnings) continue;

    const opponentName = (match.teams || []).find((team) => normalizeToken(team) !== normalizeToken(teamName));
    const opponentInnings = opponentName ? getTeamInnings(match, opponentName) : null;

    scored.push(ownInnings.runs);
    wicketsLost.push(ownInnings.wickets);
    if (opponentInnings) {
      conceded.push(opponentInnings.runs);
    }
  }

  const sampleSize = scored.length;
  const observedScored = average(scored);
  const observedConceded = average(conceded);
  const observedWickets = average(wicketsLost);

  const recentScored = average(scored.slice(-3)) || observedScored || baseline.avgInningsScore;
  const recentConceded = average(conceded.slice(-3)) || observedConceded || priorRunsAllowed(baseline);

  const avgInningsScore = blendPrior(baseline.avgInningsScore, observedScored, sampleSize);
  const avgRunsConceded = blendPrior(priorRunsAllowed(baseline), observedConceded, conceded.length, 0.58);
  const avgWicketsLost = blendPrior(baseline.avgWicketsLost, observedWickets, wicketsLost.length, 0.56);

  const battingStrength = clamp(
    baseline.battingStrength +
      (avgInningsScore - baseline.avgInningsScore) / 18 +
      (recentScored - avgInningsScore) / 28,
    6.1,
    9.8
  );

  const bowlingStrength = clamp(
    baseline.bowlingStrength +
      (priorRunsAllowed(baseline) - avgRunsConceded) / 18 +
      (avgRunsConceded - recentConceded) / 28,
    6.0,
    9.6
  );

  return {
    battingStrength,
    bowlingStrength,
    powerplayAvg: clamp(
      blendPrior(
        baseline.powerplayAvg,
        baseline.powerplayAvg + (avgInningsScore - baseline.avgInningsScore) * 0.32,
        sampleSize,
        0.5
      ),
      43,
      66
    ),
    avgInningsScore,
    sixesPerGame: clamp(
      blendPrior(
        baseline.sixesPerGame,
        baseline.sixesPerGame + (avgInningsScore - baseline.avgInningsScore) / 18,
        sampleSize,
        0.48
      ),
      5.5,
      13.5
    ),
    foursPerGame: clamp(
      blendPrior(
        baseline.foursPerGame,
        baseline.foursPerGame + (avgInningsScore - baseline.avgInningsScore) / 24,
        sampleSize,
        0.42
      ),
      11.5,
      18.5
    ),
    avgWicketsLost,
    avgTopBatterScore: clamp(
      blendPrior(
        baseline.avgTopBatterScore,
        baseline.avgTopBatterScore + (avgInningsScore - baseline.avgInningsScore) * 0.25,
        sampleSize,
        0.44
      ),
      45,
      76
    ),
    avgLeadBowlerWickets: clamp(
      blendPrior(
        baseline.avgLeadBowlerWickets,
        baseline.avgLeadBowlerWickets + (bowlingStrength - baseline.bowlingStrength) * 0.2,
        sampleSize,
        0.38
      ),
      1.5,
      2.8
    ),
    avgExtrasConceded: clamp(
      blendPrior(
        baseline.avgExtrasConceded,
        baseline.avgExtrasConceded + (avgRunsConceded - priorRunsAllowed(baseline)) * 0.04,
        sampleSize,
        0.35
      ),
      8.5,
      14.5
    ),
    sampleSize,
    avgRunsConceded,
    recentScored,
    recentConceded,
  };
}

function buildVenueModel(venueName: string, history: IPLMatch[]): VenueStats {
  const baseline = getVenueBaseline(venueName);
  const venueToken = normalizeToken(venueName);

  if (!venueToken) return baseline;

  const sameVenueMatches = history.filter((match) => {
    const token = normalizeToken(match.venue);
    return token && (token.includes(venueToken) || venueToken.includes(token));
  });

  const firstInningsTotals: number[] = [];
  const matchTotals: number[] = [];

  for (const match of sameVenueMatches) {
    const innings = (match.score || []).slice(0, 2);
    if (!innings.length) continue;

    if (innings[0]) {
      firstInningsTotals.push(innings[0].r);
    }
    if (innings.length >= 2) {
      matchTotals.push(innings[0].r + innings[1].r);
    }
  }

  const firstInningsAvg = average(firstInningsTotals);
  const totalAvg = average(matchTotals);
  const sampleSize = sameVenueMatches.length;

  return {
    ...baseline,
    avgFirstInnings: blendPrior(baseline.avgFirstInnings, firstInningsAvg, sampleSize, 0.55),
    avgTotal: blendPrior(baseline.avgTotal, totalAvg, sampleSize, 0.55),
    pitchFactor: clamp(
      blendPrior(baseline.pitchFactor, totalAvg ? totalAvg / 338 : baseline.pitchFactor, sampleSize, 0.42),
      0.9,
      1.12
    ),
    avgSixes: clamp(
      blendPrior(
        baseline.avgSixes,
        baseline.avgSixes + ((totalAvg || baseline.avgTotal) - baseline.avgTotal) / 22,
        sampleSize,
        0.35
      ),
      12,
      22
    ),
  };
}

function normalCdf(zScore: number): number {
  const sign = zScore < 0 ? -1 : 1;
  const x = Math.abs(zScore) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const erf =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));

  return 0.5 * (1 + sign * erf);
}

function probabilityToOdds(probability: number, margin = 0.045): number {
  const implied = clamp(probability * (1 + margin), 0.08, 0.92);
  return roundToTwo(clamp(1 / implied, 1.28, 5.5));
}

function priceTwoWayMarket(mean: number, stdDev: number, line: number): { over: number; under: number } {
  const safeStdDev = Math.max(stdDev, 1.25);
  const overProb = clamp(1 - normalCdf((line - mean) / safeStdDev), 0.14, 0.86);
  const underProb = clamp(1 - overProb, 0.14, 0.86);

  return {
    over: probabilityToOdds(overProb),
    under: probabilityToOdds(underProb),
  };
}

function selectBookLine(matchId: string, seed: number, mean: number, stdDev: number, min: number, max: number): number {
  const shade = deterministicJitter(matchId, seed + 6000, stdDev * 0.36);
  return clamp(roundToBookHalf(mean + shade), min, max);
}

function estimateInningsMean(
  batting: CalibratedTeamStats,
  bowling: CalibratedTeamStats,
  venue: VenueStats,
  matchId: string,
  seed: number
): number {
  const matchupBase =
    batting.avgInningsScore * 0.58 +
    bowling.avgRunsConceded * 0.27 +
    venue.avgFirstInnings * 0.15;

  const strengthEdge = (batting.battingStrength - bowling.bowlingStrength) * 5.4;
  const recentForm =
    (batting.recentScored - batting.avgInningsScore) * 0.28 +
    (bowling.avgRunsConceded - bowling.recentConceded) * 0.22;

  const venueLift = (venue.pitchFactor - 1) * 18;

  return clamp(
    matchupBase + strengthEdge + recentForm + venueLift + deterministicJitter(matchId, seed, 6),
    145,
    228
  );
}

function estimateInningsStdDev(
  batting: CalibratedTeamStats,
  bowling: CalibratedTeamStats,
  venue: VenueStats
): number {
  return clamp(
    13.5 +
      batting.avgWicketsLost * 0.85 +
      Math.abs(batting.battingStrength - bowling.bowlingStrength) * 0.9 +
      (1.03 - venue.pitchFactor) * 8,
    12,
    23
  );
}

function estimatePowerplayMean(
  batting: CalibratedTeamStats,
  bowling: CalibratedTeamStats,
  venue: VenueStats,
  matchId: string,
  seed: number
): number {
  return clamp(
    batting.powerplayAvg +
      (batting.battingStrength - bowling.bowlingStrength) * 2.1 +
      (venue.pitchFactor - 1) * 16 +
      (batting.recentScored - batting.avgInningsScore) * 0.08 +
      deterministicJitter(matchId, seed, 2.5),
    38,
    74
  );
}

function estimateOpeningStandMean(
  batting: CalibratedTeamStats,
  bowling: CalibratedTeamStats,
  powerplayMean: number,
  matchId: string,
  seed: number
): number {
  return clamp(
    powerplayMean * 0.56 +
      batting.avgTopBatterScore * 0.14 +
      (batting.battingStrength - bowling.bowlingStrength) * 1.35 +
      deterministicJitter(matchId, seed, 3.5),
    16,
    76
  );
}

function estimateTopBatterMean(
  batting: CalibratedTeamStats,
  bowling: CalibratedTeamStats,
  matchId: string,
  seed: number
): number {
  return clamp(
    batting.avgTopBatterScore +
      (batting.battingStrength - bowling.bowlingStrength) * 2.4 +
      (batting.recentScored - batting.avgInningsScore) * 0.07 +
      deterministicJitter(matchId, seed, 2.2),
    40,
    79
  );
}

function estimateMatchExtrasMean(
  team1: CalibratedTeamStats,
  team2: CalibratedTeamStats,
  totalWicketsMean: number,
  matchId: string,
  seed: number
): number {
  return clamp(
    team1.avgExtrasConceded +
      team2.avgExtrasConceded +
      totalWicketsMean * 0.42 +
      deterministicJitter(matchId, seed, 1.6),
    13,
    31
  );
}

function estimatePlayerRunsMean(
  player: BatterProfile,
  batting: CalibratedTeamStats,
  bowling: CalibratedTeamStats,
  venue: VenueStats,
  teamExpected: number,
  matchId: string,
  seed: number
): number {
  const roleBoost =
    player.role === "opener" ? 1.8 : player.role === "top-order" ? 0.9 : -0.4;
  const baseRuns = teamExpected * player.runShare * 0.92;
  const qualityEdge = (batting.battingStrength - bowling.bowlingStrength) * 1.05;
  const topOrderLift = (batting.avgTopBatterScore - 56) * 0.11;
  const formLift = (batting.recentScored - batting.avgInningsScore) * 0.05;
  const venueLift = (venue.pitchFactor - 1) * 6;

  return clamp(
    baseRuns +
      roleBoost +
      qualityEdge +
      topOrderLift +
      formLift +
      venueLift +
      deterministicJitter(matchId, seed, 1.8),
    14,
    58
  );
}

function estimatePlayerRunsStdDev(player: BatterProfile, venue: VenueStats): number {
  return clamp(
    8.6 +
      player.volatility * 2.3 +
      (player.role === "middle-order" ? 0.9 : 0) +
      Math.max(0, venue.pitchFactor - 1) * 4,
    8.5,
    14.8
  );
}

function estimatePlayerWicketsMean(
  player: BowlerProfile,
  bowling: CalibratedTeamStats,
  batting: CalibratedTeamStats,
  venue: VenueStats,
  opponentWicketsMean: number,
  matchId: string,
  seed: number
): number {
  const roleBoost =
    player.role === "strike" ? 0.18 : player.role === "spinner" ? 0.12 : 0.02;
  const baseWickets = opponentWicketsMean * player.wicketShare * 0.82;
  const qualityEdge =
    (bowling.avgLeadBowlerWickets - 2) * 0.45 +
    (bowling.bowlingStrength - batting.battingStrength) * 0.1;
  const surfaceLift = (1 - venue.pitchFactor) * 0.9;

  return clamp(
    baseWickets +
      roleBoost +
      qualityEdge +
      surfaceLift +
      deterministicJitter(matchId, seed, 0.16),
    0.45,
    2.85
  );
}

function estimatePlayerWicketsStdDev(player: BowlerProfile): number {
  return clamp(0.76 + player.volatility * 0.22, 0.72, 1.16);
}

function selectAlternatePlayerLine(args: {
  matchId: string;
  seed: number;
  mean: number;
  stdDev: number;
  baseLine: number;
  minGap: number;
  minLine: number;
  maxLine: number;
  aggressiveness: number;
}): number {
  const candidate = roundToBookHalf(
    args.mean +
      args.stdDev * args.aggressiveness +
      deterministicJitter(args.matchId, args.seed, args.stdDev * 0.18)
  );

  return clamp(
    Math.max(args.baseLine + args.minGap, candidate),
    args.minLine,
    args.maxLine
  );
}

function selectFeaturedBowler(teamName: string, venue: VenueStats): BowlerProfile | null {
  const pool = getTeamPlayerPool(teamName);
  if (!pool?.bowlers.length) return null;

  if (venue.pitchFactor < 0.99) {
    return pool.bowlers.find((bowler) => bowler.role === "spinner") || pool.bowlers[0];
  }

  return pool.bowlers.find((bowler) => bowler.role === "strike") || pool.bowlers[0];
}

function buildPlayerPropBets(args: {
  matchId: string;
  teamName: string;
  teamStats: CalibratedTeamStats;
  opponentStats: CalibratedTeamStats;
  venue: VenueStats;
  teamExpected: number;
  opponentWicketsMean: number;
  seedBase: number;
}): BetLine[] {
  const pool = getTeamPlayerPool(args.teamName);
  if (!pool) return [];

  const batterBets: BetLine[] = [];
  const featuredBatter = pool.batters[0];
  const supportBatter = pool.batters[1];

  if (featuredBatter) {
    const featuredMean = estimatePlayerRunsMean(
      featuredBatter,
      args.teamStats,
      args.opponentStats,
      args.venue,
      args.teamExpected,
      args.matchId,
      args.seedBase
    );
    const featuredStdDev = estimatePlayerRunsStdDev(featuredBatter, args.venue);
    const featuredBaseBet = makeBet({
      matchId: args.matchId,
      category: "Batting",
      description: `${featuredBatter.name} Total Runs`,
      shortDesc: `${featuredBatter.name} Runs`,
      mean: featuredMean,
      stdDev: featuredStdDev,
      minLine: 15.5,
      maxLine: 49.5,
      unit: "runs",
      seed: args.seedBase,
      extra: {
        isPlayerProp: true,
        playerName: featuredBatter.name,
        teamName: args.teamName,
      },
    });
    batterBets.push(featuredBaseBet);

    const aggressiveLine = selectAlternatePlayerLine({
      matchId: args.matchId,
      seed: args.seedBase + 10,
      mean: featuredMean,
      stdDev: featuredStdDev,
      baseLine: featuredBaseBet.line,
      minGap: 6,
      minLine: 21.5,
      maxLine: 59.5,
      aggressiveness: 0.55,
    });
    const ceilingLine = selectAlternatePlayerLine({
      matchId: args.matchId,
      seed: args.seedBase + 11,
      mean: featuredMean,
      stdDev: featuredStdDev,
      baseLine: aggressiveLine,
      minGap: 8,
      minLine: 29.5,
      maxLine: 69.5,
      aggressiveness: 1.15,
    });

    const alternateLines = [aggressiveLine, ceilingLine].filter(
      (line, index, lines) => line > featuredBaseBet.line && lines.indexOf(line) === index
    );

    alternateLines.forEach((line, index) => {
      const milestone = Math.floor(line + 0.5);
      batterBets.push(
        makeBet({
          matchId: args.matchId,
          category: "Batting",
          description: `${featuredBatter.name} ${milestone}+ Runs`,
          shortDesc: `${featuredBatter.name} ${milestone}+`,
          mean: featuredMean,
          stdDev: featuredStdDev,
          minLine: 21.5,
          maxLine: 69.5,
          lineOverride: line,
          unit: "runs",
          seed: args.seedBase + 20 + index,
          extra: {
            isPlayerProp: true,
            playerName: featuredBatter.name,
            teamName: args.teamName,
          },
        })
      );
    });
  }

  if (supportBatter) {
    batterBets.push(
      makeBet({
        matchId: args.matchId,
        category: "Batting",
        description: `${supportBatter.name} Total Runs`,
        shortDesc: `${supportBatter.name} Runs`,
        mean: estimatePlayerRunsMean(
          supportBatter,
          args.teamStats,
          args.opponentStats,
          args.venue,
          args.teamExpected,
          args.matchId,
          args.seedBase + 1
        ),
        stdDev: estimatePlayerRunsStdDev(supportBatter, args.venue),
        minLine: 15.5,
        maxLine: 49.5,
        unit: "runs",
        seed: args.seedBase + 1,
        extra: {
          isPlayerProp: true,
          playerName: supportBatter.name,
          teamName: args.teamName,
        },
      })
    );
  }

  const featuredBowler = selectFeaturedBowler(args.teamName, args.venue);
  if (!featuredBowler) return batterBets;

  return [
    ...batterBets,
    makeBet({
      matchId: args.matchId,
      category: "Bowling",
      description: `${featuredBowler.name} Wickets Taken`,
      shortDesc: `${featuredBowler.name} Wickets`,
      mean: estimatePlayerWicketsMean(
        featuredBowler,
        args.teamStats,
        args.opponentStats,
        args.venue,
        args.opponentWicketsMean,
        args.matchId,
        args.seedBase + 2
      ),
      stdDev: estimatePlayerWicketsStdDev(featuredBowler),
      minLine: 0.5,
      maxLine: 2.5,
      unit: "wickets",
      seed: args.seedBase + 2,
      extra: {
        isPlayerProp: true,
        playerName: featuredBowler.name,
        teamName: args.teamName,
      },
    }),
  ];
}

function makeBet(args: {
  matchId: string;
  category: BetLine["category"];
  description: string;
  shortDesc: string;
  mean: number;
  stdDev: number;
  minLine: number;
  maxLine: number;
  lineOverride?: number;
  unit: string;
  seed: number;
  extra?: Partial<BetLine>;
}): BetLine {
  const line =
    args.lineOverride ??
    selectBookLine(args.matchId, args.seed, args.mean, args.stdDev, args.minLine, args.maxLine);
  const odds = priceTwoWayMarket(args.mean, args.stdDev, line);

  return {
    id: `${args.matchId}-${args.shortDesc.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    matchId: args.matchId,
    category: args.category,
    description: args.description,
    shortDesc: args.shortDesc,
    line,
    overOdds: odds.over,
    underOdds: odds.under,
    unit: args.unit,
    isPlayerProp: false,
    ...args.extra,
  };
}

export function generateBetsForMatch(match: IPLMatch, seasonMatches: IPLMatch[] = []): BetLine[] {
  const [team1Name = "Team 1", team2Name = "Team 2"] = match.teams;
  const history = getHistoricalMatches(match, seasonMatches);

  const team1 = buildTeamModel(team1Name, history);
  const team2 = buildTeamModel(team2Name, history);
  const venue = buildVenueModel(match.venue || "", history);
  const matchId = match.id;

  const team1Expected = estimateInningsMean(team1, team2, venue, matchId, 10);
  const team2Expected = estimateInningsMean(team2, team1, venue, matchId, 11);
  const team1StdDev = estimateInningsStdDev(team1, team2, venue);
  const team2StdDev = estimateInningsStdDev(team2, team1, venue);

  const totalRunsMean =
    team1Expected +
    team2Expected +
    deterministicJitter(matchId, 1, 4.5);
  const totalRunsStdDev = clamp(
    Math.sqrt(team1StdDev ** 2 + team2StdDev ** 2 + 28),
    22,
    36
  );

  const highestInningsMean =
    Math.max(team1Expected, team2Expected) +
    Math.abs(team1Expected - team2Expected) * 0.08;
  const highestInningsStdDev = clamp(
    Math.max(team1StdDev, team2StdDev) * 0.82,
    10.5,
    18
  );

  const wicketsEnvironment = clamp((362 - totalRunsMean) / 54, -1.2, 2.1);
  const team1WicketsMean = clamp(
    team1.avgWicketsLost +
      (team2.bowlingStrength - team1.battingStrength) * 0.55 +
      wicketsEnvironment * 0.35 +
      deterministicJitter(matchId, 12, 0.45),
    3.8,
    8.8
  );
  const team2WicketsMean = clamp(
    team2.avgWicketsLost +
      (team1.bowlingStrength - team2.battingStrength) * 0.55 +
      wicketsEnvironment * 0.35 +
      deterministicJitter(matchId, 13, 0.45),
    3.8,
    8.8
  );
  const totalWicketsMean = team1WicketsMean + team2WicketsMean;

  const totalSixesMean = clamp(
    (team1.sixesPerGame + team2.sixesPerGame) * ((venue.pitchFactor + 1) / 2) +
      (totalRunsMean - 342) * 0.06 +
      deterministicJitter(matchId, 14, 1.3),
    11,
    27
  );

  const team1PowerplayMean = estimatePowerplayMean(team1, team2, venue, matchId, 15);
  const team2PowerplayMean = estimatePowerplayMean(team2, team1, venue, matchId, 16);
  const team1OpeningStandMean = estimateOpeningStandMean(team1, team2, team1PowerplayMean, matchId, 17);
  const team2OpeningStandMean = estimateOpeningStandMean(team2, team1, team2PowerplayMean, matchId, 18);

  const team1TopBatterMean = estimateTopBatterMean(team1, team2, matchId, 19);
  const team2TopBatterMean = estimateTopBatterMean(team2, team1, matchId, 20);
  const matchExtrasMean = estimateMatchExtrasMean(team1, team2, totalWicketsMean, matchId, 21);
  const team1PlayerProps = buildPlayerPropBets({
    matchId,
    teamName: team1Name,
    teamStats: team1,
    opponentStats: team2,
    venue,
    teamExpected: team1Expected,
    opponentWicketsMean: team2WicketsMean,
    seedBase: 30,
  });
  const team2PlayerProps = buildPlayerPropBets({
    matchId,
    teamName: team2Name,
    teamStats: team2,
    opponentStats: team1,
    venue,
    teamExpected: team2Expected,
    opponentWicketsMean: team1WicketsMean,
    seedBase: 50,
  });

  return [
    makeBet({
      matchId,
      category: "Match",
      description: "Total Runs in the Match",
      shortDesc: "Match Total Runs",
      mean: totalRunsMean,
      stdDev: totalRunsStdDev,
      minLine: 299.5,
      maxLine: 419.5,
      unit: "runs",
      seed: 1,
    }),
    makeBet({
      matchId,
      category: "Match",
      description: "Highest Team Score in the Match",
      shortDesc: "Highest Innings",
      mean: highestInningsMean,
      stdDev: highestInningsStdDev,
      minLine: 155.5,
      maxLine: 229.5,
      unit: "runs",
      seed: 2,
    }),
    makeBet({
      matchId,
      category: "Match",
      description: "Total Wickets Lost in the Match",
      shortDesc: "Match Total Wickets",
      mean: totalWicketsMean,
      stdDev: 2.2,
      minLine: 8.5,
      maxLine: 18.5,
      unit: "wickets",
      seed: 3,
    }),
    makeBet({
      matchId,
      category: "Match",
      description: "Total Sixes Hit in the Match",
      shortDesc: "Match Total Sixes",
      mean: totalSixesMean,
      stdDev: 3.6,
      minLine: 10.5,
      maxLine: 28.5,
      unit: "sixes",
      seed: 4,
    }),
    makeBet({
      matchId,
      category: "Innings",
      description: `${team1Name} Total Runs`,
      shortDesc: `${team1Name} Total`,
      mean: team1Expected,
      stdDev: team1StdDev,
      minLine: 148.5,
      maxLine: 224.5,
      unit: "runs",
      seed: 5,
      extra: { teamName: team1Name },
    }),
    makeBet({
      matchId,
      category: "Innings",
      description: `${team2Name} Total Runs`,
      shortDesc: `${team2Name} Total`,
      mean: team2Expected,
      stdDev: team2StdDev,
      minLine: 148.5,
      maxLine: 224.5,
      unit: "runs",
      seed: 6,
      extra: { teamName: team2Name },
    }),
    makeBet({
      matchId,
      category: "Innings",
      description: `${team1Name} Powerplay Runs (Overs 1-6)`,
      shortDesc: `${team1Name} Powerplay`,
      mean: team1PowerplayMean,
      stdDev: 6.8,
      minLine: 38.5,
      maxLine: 73.5,
      unit: "runs",
      seed: 7,
      extra: { teamName: team1Name },
    }),
    makeBet({
      matchId,
      category: "Innings",
      description: `${team2Name} Powerplay Runs (Overs 1-6)`,
      shortDesc: `${team2Name} Powerplay`,
      mean: team2PowerplayMean,
      stdDev: 6.8,
      minLine: 38.5,
      maxLine: 73.5,
      unit: "runs",
      seed: 8,
      extra: { teamName: team2Name },
    }),
    makeBet({
      matchId,
      category: "Opening",
      description: `${team1Name} Opening Partnership`,
      shortDesc: `${team1Name} Opening Stand`,
      mean: team1OpeningStandMean,
      stdDev: 8.1,
      minLine: 14.5,
      maxLine: 68.5,
      unit: "runs",
      seed: 11,
      extra: { teamName: team1Name },
    }),
    makeBet({
      matchId,
      category: "Opening",
      description: `${team2Name} Opening Partnership`,
      shortDesc: `${team2Name} Opening Stand`,
      mean: team2OpeningStandMean,
      stdDev: 8.1,
      minLine: 14.5,
      maxLine: 68.5,
      unit: "runs",
      seed: 12,
      extra: { teamName: team2Name },
    }),
    makeBet({
      matchId,
      category: "Extras",
      description: "Total Extras in the Match",
      shortDesc: "Match Extras",
      mean: matchExtrasMean,
      stdDev: 4.2,
      minLine: 12.5,
      maxLine: 30.5,
      unit: "runs",
      seed: 13,
    }),
    makeBet({
      matchId,
      category: "Batting",
      description: `${team1Name} Top Batter Score`,
      shortDesc: `${team1Name} Top Score`,
      mean: team1TopBatterMean,
      stdDev: 10.8,
      minLine: 39.5,
      maxLine: 79.5,
      unit: "runs",
      seed: 14,
      extra: { teamName: team1Name },
    }),
    makeBet({
      matchId,
      category: "Batting",
      description: `${team2Name} Top Batter Score`,
      shortDesc: `${team2Name} Top Score`,
      mean: team2TopBatterMean,
      stdDev: 10.8,
      minLine: 39.5,
      maxLine: 79.5,
      unit: "runs",
      seed: 15,
      extra: { teamName: team2Name },
    }),
    ...team1PlayerProps,
    ...team2PlayerProps,
  ];
}
