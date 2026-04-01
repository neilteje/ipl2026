import { BetCategory, BetLine, IPLMatch, TeamStats, VenueStats } from "@/types";

const TEAM_STATS: Record<string, TeamStats> = {
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

const VENUE_STATS: Record<string, VenueStats> = {
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

function getVenueStats(venueName: string): VenueStats {
  const lowerVenue = venueName.toLowerCase();

  for (const [needle, stats] of Object.entries(VENUE_STATS)) {
    if (lowerVenue.includes(needle)) return stats;
  }

  return DEFAULT_VENUE;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
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

function generateOdds(matchId: string, seed: number): { over: number; under: number } {
  const swing = deterministicJitter(matchId, seed + 1000, 0.24);
  const over = clamp(Math.round((1.82 + swing) * 20) / 20, 1.68, 2.08);
  const under = clamp(Math.round((1.82 - swing) * 20) / 20, 1.68, 2.08);

  return { over, under };
}

function estimateInningsTotal(
  batting: TeamStats,
  bowling: TeamStats,
  venue: VenueStats,
  matchId: string,
  seed: number
): number {
  const base =
    (batting.avgInningsScore + venue.avgFirstInnings) / 2 +
    (batting.battingStrength - bowling.bowlingStrength) * 4.5 +
    deterministicJitter(matchId, seed, 8);

  return clamp(base * venue.pitchFactor, 148, 225);
}

function makeBet(
  matchId: string,
  category: BetCategory,
  description: string,
  shortDesc: string,
  line: number,
  unit: string,
  seed: number,
  extra: Partial<BetLine> = {}
): BetLine {
  const odds = generateOdds(matchId, seed);

  return {
    id: `${matchId}-${shortDesc.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    matchId,
    category,
    description,
    shortDesc,
    line: roundToHalf(line),
    overOdds: odds.over,
    underOdds: odds.under,
    unit,
    isPlayerProp: false,
    ...extra,
  };
}

export function generateBetsForMatch(match: IPLMatch): BetLine[] {
  const [team1Name = "Team 1", team2Name = "Team 2"] = match.teams;
  const team1 = TEAM_STATS[team1Name] || DEFAULT_TEAM_STATS;
  const team2 = TEAM_STATS[team2Name] || DEFAULT_TEAM_STATS;
  const venue = getVenueStats(match.venue || "");
  const matchId = match.id;

  const team1Expected = estimateInningsTotal(team1, team2, venue, matchId, 10);
  const team2Expected = estimateInningsTotal(team2, team1, venue, matchId, 11);

  const totalRunsLine = clamp(
    team1Expected + team2Expected + deterministicJitter(matchId, 1, 10),
    295.5,
    419.5
  );
  const highestInningsLine = clamp(
    Math.max(team1Expected, team2Expected) + deterministicJitter(matchId, 2, 6),
    154.5,
    239.5
  );
  const totalSixesLine = clamp(
    (team1.sixesPerGame + team2.sixesPerGame) * venue.pitchFactor +
      deterministicJitter(matchId, 3, 2.4),
    10.5,
    28.5
  );
  const totalFoursLine = clamp(
    (team1.foursPerGame + team2.foursPerGame) * ((venue.pitchFactor + 1) / 2) +
      deterministicJitter(matchId, 4, 3.2),
    19.5,
    38.5
  );
  const totalWicketsLine = clamp(
    team1.avgWicketsLost + team2.avgWicketsLost + deterministicJitter(matchId, 5, 1.4),
    8.5,
    18.5
  );

  const team1PowerplayLine = clamp(
    team1.powerplayAvg * venue.pitchFactor + deterministicJitter(matchId, 6, 4.5),
    37.5,
    74.5
  );
  const team2PowerplayLine = clamp(
    team2.powerplayAvg * venue.pitchFactor + deterministicJitter(matchId, 7, 4.5),
    37.5,
    74.5
  );

  const team1OpeningLine = clamp(
    team1.powerplayAvg * 0.58 +
      (team1.battingStrength - team2.bowlingStrength) * 1.2 +
      deterministicJitter(matchId, 8, 5),
    14.5,
    60.5
  );
  const team2OpeningLine = clamp(
    team2.powerplayAvg * 0.58 +
      (team2.battingStrength - team1.bowlingStrength) * 1.2 +
      deterministicJitter(matchId, 9, 5),
    14.5,
    60.5
  );

  const team1TopBatterLine = clamp(
    team1.avgTopBatterScore + deterministicJitter(matchId, 12, 6),
    37.5,
    79.5
  );
  const team2TopBatterLine = clamp(
    team2.avgTopBatterScore + deterministicJitter(matchId, 13, 6),
    37.5,
    79.5
  );

  const team1WicketsLine = clamp(
    team2.avgWicketsLost + (team1.bowlingStrength - team2.battingStrength) * 0.35 +
      deterministicJitter(matchId, 14, 0.9),
    3.5,
    9.5
  );
  const team2WicketsLine = clamp(
    team1.avgWicketsLost + (team2.bowlingStrength - team1.battingStrength) * 0.35 +
      deterministicJitter(matchId, 15, 0.9),
    3.5,
    9.5
  );

  const totalExtrasLine = clamp(
    team1.avgExtrasConceded + team2.avgExtrasConceded + deterministicJitter(matchId, 16, 3),
    12.5,
    31.5
  );

  return [
    makeBet(
      matchId,
      "Match",
      "Total Runs in the Match",
      "Match Total Runs",
      totalRunsLine,
      "runs",
      1
    ),
    makeBet(
      matchId,
      "Match",
      "Highest Team Score in the Match",
      "Highest Innings",
      highestInningsLine,
      "runs",
      2
    ),
    makeBet(
      matchId,
      "Match",
      "Total Sixes Hit in the Match",
      "Match Total Sixes",
      totalSixesLine,
      "sixes",
      3
    ),
    makeBet(
      matchId,
      "Match",
      "Total Fours Hit in the Match",
      "Match Total Fours",
      totalFoursLine,
      "fours",
      4
    ),
    makeBet(
      matchId,
      "Match",
      "Total Wickets Lost in the Match",
      "Match Total Wickets",
      totalWicketsLine,
      "wickets",
      5
    ),
    makeBet(
      matchId,
      "Innings",
      `${team1Name} Total Runs`,
      `${team1Name} Total`,
      team1Expected + deterministicJitter(matchId, 20, 5),
      "runs",
      6,
      { teamName: team1Name }
    ),
    makeBet(
      matchId,
      "Innings",
      `${team2Name} Total Runs`,
      `${team2Name} Total`,
      team2Expected + deterministicJitter(matchId, 21, 5),
      "runs",
      7,
      { teamName: team2Name }
    ),
    makeBet(
      matchId,
      "Innings",
      `${team1Name} Powerplay Runs (Overs 1-6)`,
      `${team1Name} Powerplay`,
      team1PowerplayLine,
      "runs",
      8,
      { teamName: team1Name }
    ),
    makeBet(
      matchId,
      "Innings",
      `${team2Name} Powerplay Runs (Overs 1-6)`,
      `${team2Name} Powerplay`,
      team2PowerplayLine,
      "runs",
      9,
      { teamName: team2Name }
    ),
    makeBet(
      matchId,
      "Opening",
      `${team1Name} Opening Partnership`,
      `${team1Name} Opening Stand`,
      team1OpeningLine,
      "runs",
      10,
      { teamName: team1Name }
    ),
    makeBet(
      matchId,
      "Opening",
      `${team2Name} Opening Partnership`,
      `${team2Name} Opening Stand`,
      team2OpeningLine,
      "runs",
      11,
      { teamName: team2Name }
    ),
    makeBet(
      matchId,
      "Batting",
      `${team1Name} Top Batter Score`,
      `${team1Name} Top Score`,
      team1TopBatterLine,
      "runs",
      12,
      { teamName: team1Name }
    ),
    makeBet(
      matchId,
      "Batting",
      `${team2Name} Top Batter Score`,
      `${team2Name} Top Score`,
      team2TopBatterLine,
      "runs",
      13,
      { teamName: team2Name }
    ),
    makeBet(
      matchId,
      "Bowling",
      `${team1Name} Wickets Taken`,
      `${team1Name} Wickets`,
      team1WicketsLine,
      "wickets",
      14,
      { teamName: team1Name }
    ),
    makeBet(
      matchId,
      "Bowling",
      `${team2Name} Wickets Taken`,
      `${team2Name} Wickets`,
      team2WicketsLine,
      "wickets",
      15,
      { teamName: team2Name }
    ),
    makeBet(
      matchId,
      "Extras",
      "Total Extras in the Match",
      "Match Extras",
      totalExtrasLine,
      "runs",
      16
    ),
  ];
}
