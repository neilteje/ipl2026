/**
 * Database abstraction layer.
 * Uses Vercel KV (Redis) in production.
 * Falls back to a shared JSON file when KV is not configured.
 */

import { promises as fs } from "fs";
import path from "path";
import { BetLine, Parlay, MatchBettingData } from "@/types";
import { ChatMessage } from "@/components/ChatPanel";
import { getIPLMatches } from "@/lib/cricket-api";

const LOCAL_STORE_PATH = process.env.LOCAL_STORE_PATH || "/tmp/ipl-parlay-store.json";
let localWriteQueue = Promise.resolve();

async function readLocalStore(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(LOCAL_STORE_PATH, "utf8");
    return JSON.parse(raw) as Record<string, string>;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return {};
    console.error("Local store read error:", err);
    return {};
  }
}

async function writeLocalStore(store: Record<string, string>): Promise<void> {
  try {
    await fs.mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
    await fs.writeFile(LOCAL_STORE_PATH, JSON.stringify(store), "utf8");
  } catch (err) {
    console.error("Local store write error:", err);
  }
}

async function setLocalValue(key: string, value: unknown): Promise<void> {
  localWriteQueue = localWriteQueue.then(async () => {
    const store = await readLocalStore();
    store[key] = JSON.stringify(value);
    await writeLocalStore(store);
  });
  return localWriteQueue;
}

async function deleteLocalValue(key: string): Promise<void> {
  localWriteQueue = localWriteQueue.then(async () => {
    const store = await readLocalStore();
    delete store[key];
    await writeLocalStore(store);
  });
  return localWriteQueue;
}

// Clear all local fallback data (for development)
export async function clearMemoryStore(): Promise<void> {
  await writeLocalStore({});
  console.log("🧹 Local fallback store cleared");
}

// Clear only bet-related keys
export async function clearAllBets(): Promise<void> {
  const store = await readLocalStore();
  Object.keys(store).forEach((key) => {
    if (key.startsWith("bets:")) {
      delete store[key];
    }
  });
  await writeLocalStore(store);
  console.log("🧹 All bet caches cleared");
}

async function getKV() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { kv } = await import("@vercel/kv");
    return kv;
  }
  return null;
}

async function kvGet<T>(key: string): Promise<T | null> {
  try {
    const kv = await getKV();
    if (kv) return await kv.get<T>(key);
    const store = await readLocalStore();
    const val = store[key];
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

async function kvSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  try {
    const kv = await getKV();
    if (kv) {
      if (ttlSeconds) {
        await kv.setex(key, ttlSeconds, value);
      } else {
        await kv.set(key, value);
      }
      return;
    }
    await setLocalValue(key, value);
  } catch (err) {
    console.error("KV set error:", err);
  }
}

async function kvDelete(key: string): Promise<void> {
  const kv = await getKV();
  if (kv) {
    await kv.del(key);
    return;
  }
  await deleteLocalValue(key);
}

// ─── BET LINES ─────────────────────────────────────────────────────────────

const BETS_CACHE_VERSION = "v2";
const BETS_KEY = (matchId: string) => `bets:${BETS_CACHE_VERSION}:${matchId}`;

export async function saveBets(matchId: string, bets: BetLine[]): Promise<void> {
  await kvSet(BETS_KEY(matchId), bets, 60 * 60 * 24 * 7);
}

export async function getBets(matchId: string): Promise<BetLine[] | null> {
  return kvGet<BetLine[]>(BETS_KEY(matchId));
}

export async function updateBetResult(
  matchId: string,
  betId: string,
  actualValue: number,
  winner: "over" | "under" | "push"
): Promise<void> {
  const bets = await getBets(matchId);
  if (!bets) return;
  const updated = bets.map((b) =>
    b.id === betId
      ? { ...b, result: { actualValue, winner, resolvedAt: new Date().toISOString() } }
      : b
  );
  await saveBets(matchId, updated);
}

// ─── MATCH REGISTRY ────────────────────────────────────────────────────────
// Track all matchIds that have ever had a parlay, so the leaderboard can aggregate

const MATCH_REGISTRY_KEY = "match_registry";

async function registerMatch(matchId: string): Promise<void> {
  const existing = (await kvGet<string[]>(MATCH_REGISTRY_KEY)) || [];
  if (!existing.includes(matchId)) {
    await kvSet(MATCH_REGISTRY_KEY, [...existing, matchId]);
  }
}

export async function getAllMatchIds(): Promise<string[]> {
  return (await kvGet<string[]>(MATCH_REGISTRY_KEY)) || [];
}

function isLegacyMockMatchId(matchId: string): boolean {
  return /^ipl26-\d+$/i.test(matchId);
}

async function getValidRegisteredMatchIds(): Promise<string[]> {
  const matchIds = (await getAllMatchIds()).filter((matchId) => !isLegacyMockMatchId(matchId));
  if (!matchIds.length) return [];

  try {
    const liveMatchIds = new Set((await getIPLMatches()).map((match) => match.id));
    if (!liveMatchIds.size) return matchIds;
    return matchIds.filter((matchId) => liveMatchIds.has(matchId));
  } catch {
    return matchIds;
  }
}

// ─── PARLAYS ───────────────────────────────────────────────────────────────

const PARLAY_KEY = (parlayId: string) => `parlay:${parlayId}`;
const MATCH_PARLAYS_KEY = (matchId: string) => `match_parlays:${matchId}`;

export async function saveParlay(parlay: Parlay): Promise<void> {
  await kvSet(PARLAY_KEY(parlay.id), parlay, 60 * 60 * 24 * 60); // 60 days

  const existing = (await kvGet<string[]>(MATCH_PARLAYS_KEY(parlay.matchId))) || [];
  if (!existing.includes(parlay.id)) {
    await kvSet(MATCH_PARLAYS_KEY(parlay.matchId), [...existing, parlay.id]);
  }

  // Register this match in the global registry for leaderboard aggregation
  await registerMatch(parlay.matchId);
}

export async function getParlay(parlayId: string): Promise<Parlay | null> {
  return kvGet<Parlay>(PARLAY_KEY(parlayId));
}

export async function deleteParlay(parlayId: string, requestingUser: string): Promise<{ ok: boolean; error?: string }> {
  const parlay = await getParlay(parlayId);
  if (!parlay) return { ok: false, error: "Parlay not found" };
  if (parlay.userName !== requestingUser) return { ok: false, error: "Not your parlay" };

  // Remove the parlay record
  await kvDelete(PARLAY_KEY(parlayId));

  // Remove from the match parlay list
  const existing = (await kvGet<string[]>(MATCH_PARLAYS_KEY(parlay.matchId))) || [];
  await kvSet(MATCH_PARLAYS_KEY(parlay.matchId), existing.filter((id) => id !== parlayId));

  return { ok: true };
}

export async function getParlaysForMatch(matchId: string): Promise<Parlay[]> {
  const ids = (await kvGet<string[]>(MATCH_PARLAYS_KEY(matchId))) || [];
  if (!ids.length) return [];
  const parlays = await Promise.all(ids.map((id) => getParlay(id)));
  return parlays.filter(Boolean) as Parlay[];
}

export async function updateParlayStatus(
  parlayId: string,
  status: "won" | "lost" | "push",
  payout?: number
): Promise<void> {
  const parlay = await getParlay(parlayId);
  if (!parlay) return;
  await kvSet(PARLAY_KEY(parlayId), { ...parlay, status, payout });
}

// ─── MATCH BETTING DATA (combined) ─────────────────────────────────────────

export async function getMatchBettingData(matchId: string): Promise<MatchBettingData | null> {
  const [bets, parlays] = await Promise.all([
    getBets(matchId),
    getParlaysForMatch(matchId),
  ]);
  if (!bets) return null;
  return { matchId, bets, parlays, generatedAt: new Date().toISOString() };
}

// ─── CHAT ──────────────────────────────────────────────────────────────────

const CHAT_KEY = (matchId: string) => `chat:${matchId}`;
const MAX_CHAT_MESSAGES = 100;

export async function getChatMessages(matchId: string): Promise<ChatMessage[]> {
  return (await kvGet<ChatMessage[]>(CHAT_KEY(matchId))) || [];
}

export async function addChatMessage(
  matchId: string,
  message: ChatMessage
): Promise<void> {
  const existing = await getChatMessages(matchId);
  const updated = [...existing, message].slice(-MAX_CHAT_MESSAGES);
  await kvSet(CHAT_KEY(matchId), updated, 60 * 60 * 24 * 7); // 7 days
}

// ─── LEADERBOARD ───────────────────────────────────────────────────────────

export interface PlayerStats {
  userName: string;
  totalBet: number;
  totalPayout: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  net: number;
  parlayCount: number;
}

export async function getLeaderboardStats(): Promise<PlayerStats[]> {
  const matchIds = await getValidRegisteredMatchIds();
  if (!matchIds.length) return [];

  const allParlaysArrays = await Promise.all(matchIds.map(getParlaysForMatch));
  const allParlays = allParlaysArrays.flat();

  const statsMap = new Map<string, PlayerStats>();

  for (const parlay of allParlays) {
    const name = parlay.userName;
    if (!statsMap.has(name)) {
      statsMap.set(name, {
        userName: name,
        totalBet: 0,
        totalPayout: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
        pending: 0,
        net: 0,
        parlayCount: 0,
      });
    }

    const s = statsMap.get(name)!;
    s.parlayCount += 1;
    s.totalBet += parlay.betAmount;

    if (parlay.status === "won") {
      s.wins += 1;
      s.totalPayout += parlay.payout ?? parlay.potentialPayout;
    } else if (parlay.status === "lost") {
      s.losses += 1;
    } else if (parlay.status === "push") {
      s.pushes += 1;
      s.totalPayout += parlay.betAmount;
    } else {
      s.pending += 1;
    }

    s.net = s.totalPayout - s.totalBet;
  }

  return Array.from(statsMap.values()).sort((a, b) => b.net - a.net);
}

// ─── WEEKLY SETTLEMENTS ────────────────────────────────────────────────────

function getWeekKey(date: Date): string {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

function getWeekRange(weekStart: string): { start: Date; end: Date } {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

const WEEKLY_SETTLEMENT_KEY = (weekStart: string) => `settlement:${weekStart}`;

export async function calculateWeeklySettlement(weekStart: string): Promise<any> {
  const { start, end } = getWeekRange(weekStart);
  const matchIds = await getValidRegisteredMatchIds();
  
  const allParlaysArrays = await Promise.all(matchIds.map(getParlaysForMatch));
  const allParlays = allParlaysArrays.flat();

  const weekParlays = allParlays.filter((p) => {
    const createdDate = new Date(p.createdAt);
    return createdDate >= start && createdDate <= end && p.status !== "pending";
  });

  if (weekParlays.length === 0) {
    return { weekStart, participants: [], settlements: [], totalPool: 0 };
  }

  const userStats = new Map<string, { bet: number; won: number; net: number }>();

  for (const parlay of weekParlays) {
    if (!userStats.has(parlay.userName)) {
      userStats.set(parlay.userName, { bet: 0, won: 0, net: 0 });
    }
    const stats = userStats.get(parlay.userName)!;
    stats.bet += parlay.betAmount;
    
    if (parlay.status === "won") {
      stats.won += parlay.payout ?? parlay.potentialPayout;
    } else if (parlay.status === "push") {
      stats.won += parlay.betAmount;
    }
    
    stats.net = stats.won - stats.bet;
  }

  const participants = Array.from(userStats.keys());
  const totalPool = weekParlays.reduce((sum, p) => sum + p.betAmount, 0);
  
  const winners = participants.filter((u) => userStats.get(u)!.net > 0);
  const losers = participants.filter((u) => userStats.get(u)!.net < 0);
  
  const totalWinnings = winners.reduce((sum, u) => sum + userStats.get(u)!.net, 0);
  const totalLosses = Math.abs(losers.reduce((sum, u) => sum + userStats.get(u)!.net, 0));

  const settlements: any[] = [];

  if (winners.length > 0 && losers.length > 0) {
    for (const loser of losers) {
      const owes = Math.abs(userStats.get(loser)!.net);
      let remaining = owes;

      for (const winner of winners) {
        if (remaining <= 0.01) break;
        
        const winnerNet = userStats.get(winner)!.net;
        const winnerShare = totalWinnings > 0 ? winnerNet / totalWinnings : 0;
        const payment = Math.min(remaining, owes * winnerShare);
        
        if (payment > 0.01) {
          settlements.push({
            from: loser,
            to: winner,
            amount: Math.round(payment * 100) / 100,
            reason: `Week of ${weekStart}`,
          });
          remaining -= payment;
        }
      }
    }
  }

  const settlement = {
    weekStart,
    weekEnd: end.toISOString().split("T")[0],
    participants,
    totalPool,
    winnersPot: totalWinnings,
    losersPot: totalLosses,
    settlements,
    isSettled: true,
    settledAt: new Date().toISOString(),
  };

  await kvSet(WEEKLY_SETTLEMENT_KEY(weekStart), settlement);
  return settlement;
}

export async function getWeeklySettlement(weekStart: string): Promise<any | null> {
  return kvGet<any>(WEEKLY_SETTLEMENT_KEY(weekStart));
}

export async function getCurrentWeekSettlement(): Promise<any> {
  const today = new Date();
  const weekKey = getWeekKey(today);
  
  let settlement = await getWeeklySettlement(weekKey);
  if (!settlement) {
    settlement = await calculateWeeklySettlement(weekKey);
  }
  
  return settlement;
}
