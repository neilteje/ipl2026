export interface IPLMatch {
  id: string;
  name: string;
  matchType: string;
  status: string;
  venue: string;
  date: string;
  dateTimeGMT: string;
  teams: string[];
  teamInfo?: TeamInfo[];
  score?: ScoreInfo[];
  tossWinner?: string;
  tossChoice?: string;
  matchWinner?: string;
}

export interface TeamInfo {
  name: string;
  shortname: string;
  img?: string;
}

export interface ScoreInfo {
  r: number;   // runs
  w: number;   // wickets
  o: number;   // overs
  inning: string;
}

export type BetCategory =
  | "Match"
  | "Batting"
  | "Bowling"
  | "Innings"
  | "Extras"
  | "Opening";

export type BetDirection = "over" | "under" | "yes" | "no";

export interface BetLine {
  id: string;
  matchId: string;
  category: BetCategory;
  description: string;
  shortDesc: string;
  line: number;
  overOdds: number;   // payout multiplier for OVER/YES (e.g. 1.9)
  underOdds: number;  // payout multiplier for UNDER/NO
  unit: string;       // "runs", "wickets", "sixes", etc.
  result?: BetResult;
  isPlayerProp: boolean;
  playerName?: string;
  teamName?: string;
}

export interface BetResult {
  actualValue: number;
  winner: "over" | "under" | "push";
  resolvedAt: string;
}

export interface ParlayLeg {
  betId: string;
  direction: BetDirection;
  odds: number;
}

export interface Parlay {
  id: string;
  matchId: string;
  userName: string;
  betAmount: number;
  legs: ParlayLeg[];
  createdAt: string;
  status: "pending" | "won" | "lost" | "push";
  payout?: number;
  potentialPayout: number;
}

export interface MatchBettingData {
  matchId: string;
  bets: BetLine[];
  parlays: Parlay[];
  generatedAt: string;
}

export type TeamKey =
  | "Chennai Super Kings"
  | "Mumbai Indians"
  | "Royal Challengers Bengaluru"
  | "Kolkata Knight Riders"
  | "Delhi Capitals"
  | "Sunrisers Hyderabad"
  | "Punjab Kings"
  | "Rajasthan Royals"
  | "Gujarat Titans"
  | "Lucknow Super Giants";

export interface TeamStats {
  battingStrength: number;   // 1-10 scale
  powerplayAvg: number;      // avg runs in first 6 overs
  avgInningsScore: number;   // historical avg T20 score
  sixesPerGame: number;
  foursPerGame: number;
  topBatsmen: string[];
  topBowlers: string[];
  bowlingStrength: number;   // 1-10 scale
  avgWicketsGiven: number;
}

export interface VenueStats {
  name: string;
  avgFirstInnings: number;
  avgTotal: number;
  pitchFactor: number;       // multiplier: >1 batting friendly, <1 bowling
  avgSixes: number;
}

export interface WeeklySettlement {
  weekStart: string;         // ISO date of Monday
  weekEnd: string;           // ISO date of Sunday
  participants: string[];    // all users who bet this week
  totalPool: number;         // sum of all bets placed
  winnersPot: number;        // total winnings to distribute
  losersPot: number;         // total losses collected
  settlements: Settlement[];  // who owes who
  isSettled: boolean;
  settledAt?: string;
}

export interface Settlement {
  from: string;              // userName who owes
  to: string;                // userName who is owed
  amount: number;            // how much
  reason: string;            // e.g., "Week 1 pool settlement"
}
