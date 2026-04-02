import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { IPLMatch } from "@/types";

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
  const kickoff = new Date(m.dateTimeGMT || m.date).getTime();
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

  const kickoff = new Date(match.dateTimeGMT || match.date).getTime();
  if (!Number.isNaN(kickoff) && kickoff <= Date.now()) return false;

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

export function formatOdds(decimalOdds: number): string {
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) return "EVEN";

  if (decimalOdds >= 2) {
    return `+${Math.round((decimalOdds - 1) * 100)}`;
  }

  return `${Math.round(-100 / (decimalOdds - 1))}`;
}

export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
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
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
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
