import { BetLine, BetCategory, IPLMatch, TeamStats, VenueStats } from "@/types";
import { generateId } from "@/lib/utils";

// IPL 2026 team stats based on 2024-2025 performance + retention strength
const TEAM_STATS: Record<string, TeamStats> = {
  "Chennai Super Kings": {
    battingStrength: 8.0,
    powerplayAvg: 50,
    avgInningsScore: 172,
    sixesPerGame: 7.5,
    foursPerGame: 14,
    topBatsmen: ["Ruturaj Gaikwad", "Sanju Samson", "Shivam Dube"],
    topBowlers: ["Khaleel Ahmed", "Nathan Ellis", "Noor Ahmad"],
    bowlingStrength: 7.5,
    avgWicketsGiven: 6.8,
  },
  "Mumbai Indians": {
    battingStrength: 8.5,
    powerplayAvg: 54,
    avgInningsScore: 176,
    sixesPerGame: 8.5,
    foursPerGame: 14,
    topBatsmen: ["Rohit Sharma", "Suryakumar Yadav", "Tilak Varma"],
    topBowlers: ["Jasprit Bumrah", "Trent Boult", "Deepak Chahar"],
    bowlingStrength: 8.5,
    avgWicketsGiven: 6.5,
  },
  "Royal Challengers Bengaluru": {
    battingStrength: 9.0,
    powerplayAvg: 56,
    avgInningsScore: 180,
    sixesPerGame: 9.5,
    foursPerGame: 15,
    topBatsmen: ["Virat Kohli", "Phil Salt", "Rajat Patidar"],
    topBowlers: ["Josh Hazlewood", "Bhuvneshwar Kumar", "Krunal Pandya"],
    bowlingStrength: 8.0,
    avgWicketsGiven: 6.8,
  },
  "Royal Challengers Bangalore": {
    battingStrength: 9.0,
    powerplayAvg: 56,
    avgInningsScore: 180,
    sixesPerGame: 9.5,
    foursPerGame: 15,
    topBatsmen: ["Virat Kohli", "Phil Salt", "Rajat Patidar"],
    topBowlers: ["Josh Hazlewood", "Bhuvneshwar Kumar", "Krunal Pandya"],
    bowlingStrength: 8.0,
    avgWicketsGiven: 6.8,
  },
  "Kolkata Knight Riders": {
    battingStrength: 8.5,
    powerplayAvg: 53,
    avgInningsScore: 175,
    sixesPerGame: 9.0,
    foursPerGame: 14,
    topBatsmen: ["Rinku Singh", "Sunil Narine", "Cameron Green"],
    topBowlers: ["Varun Chakravarthy", "Harshit Rana", "Matheesha Pathirana"],
    bowlingStrength: 8.5,
    avgWicketsGiven: 6.5,
  },
  "Delhi Capitals": {
    battingStrength: 7.5,
    powerplayAvg: 49,
    avgInningsScore: 168,
    sixesPerGame: 7.0,
    foursPerGame: 13,
    topBatsmen: ["Jake Fraser-McGurk", "Rishabh Pant", "Tristan Stubbs"],
    topBowlers: ["Axar Patel", "Kuldeep Yadav", "Mukesh Kumar"],
    bowlingStrength: 7.5,
    avgWicketsGiven: 7.0,
  },
  "Sunrisers Hyderabad": {
    battingStrength: 9.5,
    powerplayAvg: 60,
    avgInningsScore: 185,
    sixesPerGame: 11.0,
    foursPerGame: 16,
    topBatsmen: ["Travis Head", "Abhishek Sharma", "Heinrich Klaasen"],
    topBowlers: ["Pat Cummins", "Jaydev Unadkat", "Brydon Carse"],
    bowlingStrength: 7.5,
    avgWicketsGiven: 7.2,
  },
  "Punjab Kings": {
    battingStrength: 7.5,
    powerplayAvg: 51,
    avgInningsScore: 170,
    sixesPerGame: 8.0,
    foursPerGame: 14,
    topBatsmen: ["Prabhsimran Singh", "Shashank Singh", "Marcus Stoinis"],
    topBowlers: ["Arshdeep Singh", "Harshal Patel", "Yuzvendra Chahal"],
    bowlingStrength: 7.5,
    avgWicketsGiven: 7.0,
  },
  "Rajasthan Royals": {
    battingStrength: 8.5,
    powerplayAvg: 54,
    avgInningsScore: 176,
    sixesPerGame: 8.5,
    foursPerGame: 14,
    topBatsmen: ["Yashasvi Jaiswal", "Sanju Samson", "Riyan Parag"],
    topBowlers: ["Trent Boult", "Yuzvendra Chahal", "Ravichandran Ashwin"],
    bowlingStrength: 8.0,
    avgWicketsGiven: 6.8,
  },
  "Gujarat Titans": {
    battingStrength: 7.5,
    powerplayAvg: 50,
    avgInningsScore: 168,
    sixesPerGame: 7.5,
    foursPerGame: 13,
    topBatsmen: ["Shubman Gill", "Sai Sudharsan", "Rahul Tewatia"],
    topBowlers: ["Mohammed Shami", "Rashid Khan", "Mohit Sharma"],
    bowlingStrength: 8.5,
    avgWicketsGiven: 6.5,
  },
  "Lucknow Super Giants": {
    battingStrength: 7.5,
    powerplayAvg: 51,
    avgInningsScore: 170,
    sixesPerGame: 7.5,
    foursPerGame: 13,
    topBatsmen: ["Nicholas Pooran", "Ayush Badoni", "Devdutt Padikkal"],
    topBowlers: ["Mohammed Shami", "Ravi Bishnoi", "Mohsin Khan"],
    bowlingStrength: 8.0,
    avgWicketsGiven: 6.8,
  },
};

const DEFAULT_TEAM_STATS: TeamStats = {
  battingStrength: 7.5,
  powerplayAvg: 52,
  avgInningsScore: 172,
  sixesPerGame: 8.0,
  foursPerGame: 14,
  topBatsmen: ["Batsman A", "Batsman B", "Batsman C"],
  topBowlers: ["Bowler A", "Bowler B", "Bowler C"],
  bowlingStrength: 7.5,
  avgWicketsGiven: 7.0,
};

const VENUE_STATS: Record<string, VenueStats> = {
  wankhede: {
    name: "Wankhede",
    avgFirstInnings: 178,
    avgTotal: 348,
    pitchFactor: 1.05,
    avgSixes: 18,
  },
  chinnaswamy: {
    name: "Chinnaswamy",
    avgFirstInnings: 185,
    avgTotal: 362,
    pitchFactor: 1.10,
    avgSixes: 21,
  },
  "eden gardens": {
    name: "Eden Gardens",
    avgFirstInnings: 172,
    avgTotal: 338,
    pitchFactor: 1.00,
    avgSixes: 16,
  },
  chidambaram: {
    name: "Chidambaram",
    avgFirstInnings: 162,
    avgTotal: 318,
    pitchFactor: 0.92,
    avgSixes: 13,
  },
  "rajiv gandhi": {
    name: "Rajiv Gandhi Stadium",
    avgFirstInnings: 176,
    avgTotal: 344,
    pitchFactor: 1.02,
    avgSixes: 17,
  },
  "sawai mansingh": {
    name: "Sawai Mansingh",
    avgFirstInnings: 170,
    avgTotal: 334,
    pitchFactor: 0.98,
    avgSixes: 15,
  },
  "arun jaitley": {
    name: "Arun Jaitley Stadium",
    avgFirstInnings: 168,
    avgTotal: 330,
    pitchFactor: 0.96,
    avgSixes: 14,
  },
  "narendra modi": {
    name: "Narendra Modi Stadium",
    avgFirstInnings: 174,
    avgTotal: 342,
    pitchFactor: 1.00,
    avgSixes: 16,
  },
  mullanpur: {
    name: "MYSI Stadium",
    avgFirstInnings: 175,
    avgTotal: 344,
    pitchFactor: 1.02,
    avgSixes: 17,
  },
  ekana: {
    name: "Ekana Stadium",
    avgFirstInnings: 166,
    avgTotal: 326,
    pitchFactor: 0.94,
    avgSixes: 13,
  },
};

const DEFAULT_VENUE: VenueStats = {
  name: "Neutral",
  avgFirstInnings: 172,
  avgTotal: 338,
  pitchFactor: 1.0,
  avgSixes: 16,
};

function getVenueStats(venueStr: string): VenueStats {
  const lower = venueStr.toLowerCase();
  for (const [key, stats] of Object.entries(VENUE_STATS)) {
    if (lower.includes(key)) return stats;
  }
  return DEFAULT_VENUE;
}

function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

function deterministicJitter(matchId: string, seed: number, range: number): number {
  let hash = 0;
  const str = matchId + seed.toString();
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  const normalized = ((hash >>> 0) / 0xffffffff) - 0.5;
  return normalized * range;
}

// Generate varied odds based on line difficulty
function generateOdds(matchId: string, seed: number): { over: number; under: number } {
  const jitter = deterministicJitter(matchId, seed + 1000, 0.3);
  const baseOver = 1.85 + jitter;
  const baseUnder = 1.85 - jitter;
  
  return {
    over: Math.max(1.65, Math.min(2.15, Math.round(baseOver * 20) / 20)),
    under: Math.max(1.65, Math.min(2.15, Math.round(baseUnder * 20) / 20)),
  };
}

export function generateBetsForMatch(match: IPLMatch): BetLine[] {
  const team1Name = match.teams[0];
  const team2Name = match.teams[1];
  const t1 = TEAM_STATS[team1Name] || DEFAULT_TEAM_STATS;
  const t2 = TEAM_STATS[team2Name] || DEFAULT_TEAM_STATS;
  const venue = getVenueStats(match.venue || "");
  const mid = match.id;

  const t1ExpectedScore =
    ((t1.avgInningsScore + (10 - t2.bowlingStrength) * 3) / 2) * venue.pitchFactor;
  const t2ExpectedScore =
    ((t2.avgInningsScore + (10 - t1.bowlingStrength) * 3) / 2) * venue.pitchFactor;

  const expectedTotal = t1ExpectedScore + t2ExpectedScore;
  const avgPowerplay1 = t1.powerplayAvg * venue.pitchFactor;
  const avgPowerplay2 = t2.powerplayAvg * venue.pitchFactor;
  const avgMatchSixes = ((t1.sixesPerGame + t2.sixesPerGame) / 2) * venue.pitchFactor;
  const avgMatchFours = ((t1.foursPerGame + t2.foursPerGame) / 2) * venue.pitchFactor;

  const bets: BetLine[] = [];

  // MATCH PROPS - Winning margin
  const marginOdds = generateOdds(mid, 1);
  bets.push({
    id: `${mid}-win-margin`,
    matchId: mid,
    category: "Match" as BetCategory,
    description: `Winning Margin (Runs or Wickets)`,
    shortDesc: "Winning Margin",
    line: 25.5,
    overOdds: marginOdds.over,
    underOdds: marginOdds.under,
    unit: "runs/wkts",
    isPlayerProp: false,
  });

  // Highest innings score
  const highScoreOdds = generateOdds(mid, 2);
  const expectedHighScore = Math.max(t1ExpectedScore, t2ExpectedScore);
  bets.push({
    id: `${mid}-highest-innings`,
    matchId: mid,
    category: "Match" as BetCategory,
    description: `Highest Innings Score of the Match`,
    shortDesc: "Highest Innings",
    line: roundToHalf(expectedHighScore + deterministicJitter(mid, 2, 8)),
    overOdds: highScoreOdds.over,
    underOdds: highScoreOdds.under,
    unit: "runs",
    isPlayerProp: false,
  });

  const sixesOdds = generateOdds(mid, 3);
  bets.push({
    id: `${mid}-total-sixes`,
    matchId: mid,
    category: "Match" as BetCategory,
    description: `Total Sixes Hit in the Match (Both Teams)`,
    shortDesc: "Match Total Sixes",
    line: roundToHalf(avgMatchSixes * 2 + deterministicJitter(mid, 3, 3)),
    overOdds: sixesOdds.over,
    underOdds: sixesOdds.under,
    unit: "sixes",
    isPlayerProp: false,
  });

  const foursOdds = generateOdds(mid, 4);
  bets.push({
    id: `${mid}-total-fours`,
    matchId: mid,
    category: "Match" as BetCategory,
    description: `Total Fours Hit in the Match (Both Teams)`,
    shortDesc: "Match Total Fours",
    line: roundToHalf(avgMatchFours * 2 + deterministicJitter(mid, 4, 3)),
    overOdds: foursOdds.over,
    underOdds: foursOdds.under,
    unit: "fours",
    isPlayerProp: false,
  });

  const wicketsOdds = generateOdds(mid, 5);
  bets.push({
    id: `${mid}-total-wkts`,
    matchId: mid,
    category: "Match" as BetCategory,
    description: `Total Wickets Taken (Both Teams Combined)`,
    shortDesc: "Match Total Wickets",
    line: roundToHalf(
      ((t1.avgWicketsGiven + t2.avgWicketsGiven) / 2) * 2 + deterministicJitter(mid, 5, 1.5)
    ),
    overOdds: wicketsOdds.over,
    underOdds: wicketsOdds.under,
    unit: "wickets",
    isPlayerProp: false,
  });

  // INNINGS PROPS
  const innings1Odds = generateOdds(mid, 6);
  bets.push({
    id: `${mid}-1st-innings`,
    matchId: mid,
    category: "Innings" as BetCategory,
    description: `${team1Name} First Innings Total`,
    shortDesc: `${team1Name} 1st Innings`,
    line: roundToHalf(t1ExpectedScore + deterministicJitter(mid, 6, 8)),
    overOdds: innings1Odds.over,
    underOdds: innings1Odds.under,
    unit: "runs",
    isPlayerProp: false,
    teamName: team1Name,
  });

  const innings2Odds = generateOdds(mid, 7);
  bets.push({
    id: `${mid}-2nd-innings`,
    matchId: mid,
    category: "Innings" as BetCategory,
    description: `${team2Name} Second Innings Total`,
    shortDesc: `${team2Name} 2nd Innings`,
    line: roundToHalf(t2ExpectedScore + deterministicJitter(mid, 7, 8)),
    overOdds: innings2Odds.over,
    underOdds: innings2Odds.under,
    unit: "runs",
    isPlayerProp: false,
    teamName: team2Name,
  });

  // POWERPLAY PROPS
  const pp1Odds = generateOdds(mid, 8);
  bets.push({
    id: `${mid}-pp1`,
    matchId: mid,
    category: "Innings" as BetCategory,
    description: `${team1Name} Powerplay Score (Overs 1-6)`,
    shortDesc: `${team1Name} Powerplay`,
    line: roundToHalf(avgPowerplay1 + deterministicJitter(mid, 8, 5)),
    overOdds: pp1Odds.over,
    underOdds: pp1Odds.under,
    unit: "runs",
    isPlayerProp: false,
    teamName: team1Name,
  });

  const pp2Odds = generateOdds(mid, 9);
  bets.push({
    id: `${mid}-pp2`,
    matchId: mid,
    category: "Innings" as BetCategory,
    description: `${team2Name} Powerplay Score (Overs 1-6)`,
    shortDesc: `${team2Name} Powerplay`,
    line: roundToHalf(avgPowerplay2 + deterministicJitter(mid, 9, 5)),
    overOdds: pp2Odds.over,
    underOdds: pp2Odds.under,
    unit: "runs",
    isPlayerProp: false,
    teamName: team2Name,
  });

  // OPENING PARTNERSHIP
  const openingLine1 = roundToHalf(t1.powerplayAvg * 0.6 + deterministicJitter(mid, 10, 6));
  const openingLine2 = roundToHalf(t2.powerplayAvg * 0.6 + deterministicJitter(mid, 11, 6));

  const open1Odds = generateOdds(mid, 10);
  bets.push({
    id: `${mid}-open1`,
    matchId: mid,
    category: "Opening" as BetCategory,
    description: `${team1Name} Opening Partnership Runs`,
    shortDesc: `${team1Name} Opening Stand`,
    line: openingLine1,
    overOdds: open1Odds.over,
    underOdds: open1Odds.under,
    unit: "runs",
    isPlayerProp: false,
    teamName: team1Name,
  });

  const open2Odds = generateOdds(mid, 11);
  bets.push({
    id: `${mid}-open2`,
    matchId: mid,
    category: "Opening" as BetCategory,
    description: `${team2Name} Opening Partnership Runs`,
    shortDesc: `${team2Name} Opening Stand`,
    line: openingLine2,
    overOdds: open2Odds.over,
    underOdds: open2Odds.under,
    unit: "runs",
    isPlayerProp: false,
    teamName: team2Name,
  });

  // PLAYER BATTING PROPS
  const t1Batsmen = t1.topBatsmen.slice(0, 3);
  const t2Batsmen = t2.topBatsmen.slice(0, 3);

  [
    { player: t1Batsmen[0], line: 36.5, seed: 11 },
    { player: t1Batsmen[1], line: 30.5, seed: 12 },
    { player: t2Batsmen[0], line: 36.5, seed: 13 },
    { player: t2Batsmen[1], line: 30.5, seed: 14 },
  ].forEach(({ player, line, seed }) => {
    const jitterLine = roundToHalf(line + deterministicJitter(mid, seed, 7));
    const playerOdds = generateOdds(mid, seed);
    bets.push({
      id: `${mid}-bat-${player.toLowerCase().replace(/\s/g, "-")}`,
      matchId: mid,
      category: "Batting" as BetCategory,
      description: `${player} Total Runs`,
      shortDesc: `${player} Runs`,
      line: Math.max(jitterLine, 18.5),
      overOdds: playerOdds.over,
      underOdds: playerOdds.under,
      unit: "runs",
      isPlayerProp: true,
      playerName: player,
    });
  });

  // 50+ milestone props
  [t1Batsmen[0], t2Batsmen[0]].forEach((player) => {
    bets.push({
      id: `${mid}-50plus-${player.toLowerCase().replace(/\s/g, "-")}`,
      matchId: mid,
      category: "Batting" as BetCategory,
      description: `${player} to Score 50+ Runs`,
      shortDesc: `${player} 50+`,
      line: 49.5,
      overOdds: 2.2,
      underOdds: 1.68,
      unit: "runs",
      isPlayerProp: true,
      playerName: player,
    });
  });

  // BOWLING PROPS
  const t1Bowler = t1.topBowlers[0];
  const t2Bowler = t2.topBowlers[0];

  [
    { player: t1Bowler, seed: 20, teamName: team1Name },
    { player: t2Bowler, seed: 21, teamName: team2Name },
  ].forEach(({ player, seed, teamName: tName }) => {
    const bowlerOdds = generateOdds(mid, seed);
    bets.push({
      id: `${mid}-bowl-${player.toLowerCase().replace(/\s/g, "-")}`,
      matchId: mid,
      category: "Bowling" as BetCategory,
      description: `${player} Total Wickets`,
      shortDesc: `${player} Wickets`,
      line: roundToHalf(1.5 + deterministicJitter(mid, seed, 0.6)),
      overOdds: bowlerOdds.over,
      underOdds: bowlerOdds.under,
      unit: "wickets",
      isPlayerProp: true,
      playerName: player,
      teamName: tName,
    });
  });

  [t1Bowler, t2Bowler].forEach((player) => {
    bets.push({
      id: `${mid}-2wkts-${player.toLowerCase().replace(/\s/g, "-")}`,
      matchId: mid,
      category: "Bowling" as BetCategory,
      description: `${player} to Take 2+ Wickets`,
      shortDesc: `${player} 2+ Wkts`,
      line: 1.5,
      overOdds: 2.1,
      underOdds: 1.78,
      unit: "wickets",
      isPlayerProp: true,
      playerName: player,
    });
  });

  // EXTRAS
  const extrasOdds = generateOdds(mid, 30);
  bets.push({
    id: `${mid}-extras-t1`,
    matchId: mid,
    category: "Extras" as BetCategory,
    description: `${team1Name} Extras Conceded`,
    shortDesc: `${team1Name} Extras`,
    line: roundToHalf(11.5 + deterministicJitter(mid, 30, 2.5)),
    overOdds: extrasOdds.over,
    underOdds: extrasOdds.under,
    unit: "runs",
    isPlayerProp: false,
    teamName: team1Name,
  });

  const deathOdds = generateOdds(mid, 31);
  bets.push({
    id: `${mid}-deathover-sixes`,
    matchId: mid,
    category: "Extras" as BetCategory,
    description: `Total Sixes in Death Overs (Overs 16-20, Both Teams)`,
    shortDesc: "Death Over Sixes",
    line: roundToHalf(6.5 + deterministicJitter(mid, 31, 2)),
    overOdds: deathOdds.over,
    underOdds: deathOdds.under,
    unit: "sixes",
    isPlayerProp: false,
  });

  return bets;
}
