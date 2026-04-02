export type BatterRole = "opener" | "top-order" | "middle-order";
export type BowlerRole = "strike" | "support" | "spinner";

export interface BatterProfile {
  name: string;
  role: BatterRole;
  runShare: number;
  volatility: number;
}

export interface BowlerProfile {
  name: string;
  role: BowlerRole;
  wicketShare: number;
  volatility: number;
}

export interface TeamPlayerPool {
  batters: BatterProfile[];
  bowlers: BowlerProfile[];
}

const rcbPool: TeamPlayerPool = {
  batters: [
    { name: "Virat Kohli", role: "opener", runShare: 0.2, volatility: 0.9 },
    { name: "Phil Salt", role: "opener", runShare: 0.17, volatility: 1.2 },
    { name: "Rajat Patidar", role: "top-order", runShare: 0.16, volatility: 1.0 },
  ],
  bowlers: [
    { name: "Josh Hazlewood", role: "strike", wicketShare: 0.3, volatility: 0.95 },
    { name: "Bhuvneshwar Kumar", role: "support", wicketShare: 0.24, volatility: 0.85 },
    { name: "Krunal Pandya", role: "spinner", wicketShare: 0.22, volatility: 0.82 },
  ],
};

export const TEAM_PLAYER_POOLS: Record<string, TeamPlayerPool> = {
  "Chennai Super Kings": {
    batters: [
      { name: "Ruturaj Gaikwad", role: "opener", runShare: 0.2, volatility: 0.9 },
      { name: "Sanju Samson", role: "top-order", runShare: 0.17, volatility: 1.0 },
      { name: "Shivam Dube", role: "middle-order", runShare: 0.15, volatility: 1.15 },
    ],
    bowlers: [
      { name: "Noor Ahmad", role: "spinner", wicketShare: 0.29, volatility: 0.9 },
      { name: "Khaleel Ahmed", role: "strike", wicketShare: 0.27, volatility: 0.92 },
      { name: "Nathan Ellis", role: "support", wicketShare: 0.23, volatility: 0.86 },
    ],
  },
  "Mumbai Indians": {
    batters: [
      { name: "Rohit Sharma", role: "opener", runShare: 0.19, volatility: 1.0 },
      { name: "Suryakumar Yadav", role: "top-order", runShare: 0.18, volatility: 1.2 },
      { name: "Tilak Varma", role: "top-order", runShare: 0.16, volatility: 1.0 },
    ],
    bowlers: [
      { name: "Jasprit Bumrah", role: "strike", wicketShare: 0.33, volatility: 0.96 },
      { name: "Trent Boult", role: "strike", wicketShare: 0.29, volatility: 0.95 },
      { name: "Deepak Chahar", role: "support", wicketShare: 0.23, volatility: 0.86 },
    ],
  },
  "Royal Challengers Bengaluru": rcbPool,
  "Royal Challengers Bangalore": rcbPool,
  "Kolkata Knight Riders": {
    batters: [
      { name: "Sunil Narine", role: "opener", runShare: 0.17, volatility: 1.25 },
      { name: "Cameron Green", role: "top-order", runShare: 0.18, volatility: 1.05 },
      { name: "Rinku Singh", role: "middle-order", runShare: 0.15, volatility: 1.12 },
    ],
    bowlers: [
      { name: "Varun Chakaravarthy", role: "spinner", wicketShare: 0.29, volatility: 0.86 },
      { name: "Matheesha Pathirana", role: "strike", wicketShare: 0.28, volatility: 0.97 },
      { name: "Harshit Rana", role: "support", wicketShare: 0.24, volatility: 0.9 },
    ],
  },
  "Delhi Capitals": {
    batters: [
      { name: "KL Rahul", role: "opener", runShare: 0.19, volatility: 0.92 },
      { name: "Tristan Stubbs", role: "middle-order", runShare: 0.16, volatility: 1.18 },
      { name: "Faf du Plessis", role: "top-order", runShare: 0.15, volatility: 0.96 },
    ],
    bowlers: [
      { name: "Mitchell Starc", role: "strike", wicketShare: 0.3, volatility: 0.98 },
      { name: "Kuldeep Yadav", role: "spinner", wicketShare: 0.28, volatility: 0.87 },
      { name: "Mukesh Kumar", role: "support", wicketShare: 0.22, volatility: 0.85 },
    ],
  },
  "Sunrisers Hyderabad": {
    batters: [
      { name: "Travis Head", role: "opener", runShare: 0.2, volatility: 1.15 },
      { name: "Abhishek Sharma", role: "opener", runShare: 0.18, volatility: 1.16 },
      { name: "Heinrich Klaasen", role: "middle-order", runShare: 0.17, volatility: 1.22 },
    ],
    bowlers: [
      { name: "Pat Cummins", role: "strike", wicketShare: 0.28, volatility: 0.92 },
      { name: "Harshal Patel", role: "support", wicketShare: 0.26, volatility: 0.94 },
      { name: "Adam Zampa", role: "spinner", wicketShare: 0.24, volatility: 0.84 },
    ],
  },
  "Punjab Kings": {
    batters: [
      { name: "Prabhsimran Singh", role: "opener", runShare: 0.17, volatility: 1.08 },
      { name: "Shreyas Iyer", role: "top-order", runShare: 0.18, volatility: 0.96 },
      { name: "Marcus Stoinis", role: "middle-order", runShare: 0.15, volatility: 1.16 },
    ],
    bowlers: [
      { name: "Arshdeep Singh", role: "strike", wicketShare: 0.29, volatility: 0.92 },
      { name: "Yuzvendra Chahal", role: "spinner", wicketShare: 0.28, volatility: 0.86 },
      { name: "Lockie Ferguson", role: "support", wicketShare: 0.24, volatility: 0.97 },
    ],
  },
  "Rajasthan Royals": {
    batters: [
      { name: "Yashasvi Jaiswal", role: "opener", runShare: 0.2, volatility: 1.05 },
      { name: "Riyan Parag", role: "top-order", runShare: 0.17, volatility: 1.06 },
      { name: "Dhruv Jurel", role: "middle-order", runShare: 0.14, volatility: 1.1 },
    ],
    bowlers: [
      { name: "Jofra Archer", role: "strike", wicketShare: 0.3, volatility: 0.97 },
      { name: "Wanindu Hasaranga", role: "spinner", wicketShare: 0.26, volatility: 0.88 },
      { name: "Tushar Deshpande", role: "support", wicketShare: 0.22, volatility: 0.9 },
    ],
  },
  "Gujarat Titans": {
    batters: [
      { name: "Shubman Gill", role: "opener", runShare: 0.2, volatility: 0.9 },
      { name: "Sai Sudharsan", role: "top-order", runShare: 0.18, volatility: 0.94 },
      { name: "Jos Buttler", role: "top-order", runShare: 0.18, volatility: 1.15 },
    ],
    bowlers: [
      { name: "Rashid Khan", role: "spinner", wicketShare: 0.29, volatility: 0.85 },
      { name: "Mohammed Siraj", role: "strike", wicketShare: 0.27, volatility: 0.91 },
      { name: "Kagiso Rabada", role: "strike", wicketShare: 0.27, volatility: 0.94 },
    ],
  },
  "Lucknow Super Giants": {
    batters: [
      { name: "Nicholas Pooran", role: "middle-order", runShare: 0.18, volatility: 1.24 },
      { name: "Mitchell Marsh", role: "top-order", runShare: 0.18, volatility: 1.14 },
      { name: "Rishabh Pant", role: "top-order", runShare: 0.16, volatility: 1.16 },
    ],
    bowlers: [
      { name: "Mohammed Shami", role: "strike", wicketShare: 0.29, volatility: 0.92 },
      { name: "Mayank Yadav", role: "strike", wicketShare: 0.28, volatility: 0.99 },
      { name: "Avesh Khan", role: "support", wicketShare: 0.24, volatility: 0.89 },
    ],
  },
};

export function getTeamPlayerPool(teamName: string): TeamPlayerPool | null {
  return TEAM_PLAYER_POOLS[teamName] || null;
}
