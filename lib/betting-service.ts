import { generateBetsForMatch } from "@/lib/bet-generator";
import { getIPLMatches, getMatchById } from "@/lib/cricket-api";
import { getBets, saveBets, saveMatchMetadata } from "@/lib/db";
import { isBettingOpen } from "@/lib/utils";
import { BetLine, IPLMatch } from "@/types";

export interface MatchBetsPayload {
  match: IPLMatch;
  bets: BetLine[];
  bettingClosed: boolean;
}

export async function getOrCreateMatchBets(
  matchId: string,
  options: { forceRegenerate?: boolean } = {}
): Promise<MatchBetsPayload | null> {
  const match = await getMatchById(matchId);
  if (!match) return null;

  const cachedBets = options.forceRegenerate ? null : await getBets(matchId);
  if (cachedBets?.length) {
    await saveMatchMetadata(match);
    return {
      match,
      bets: cachedBets,
      bettingClosed: !isBettingOpen(match),
    };
  }

  if (!isBettingOpen(match)) {
    await saveMatchMetadata(match);
    return {
      match,
      bets: [],
      bettingClosed: true,
    };
  }

  const seasonMatches = await getIPLMatches();
  const freshBets = generateBetsForMatch(match, seasonMatches);
  await saveBets(matchId, freshBets);
  await saveMatchMetadata(match);

  return {
    match,
    bets: freshBets,
    bettingClosed: false,
  };
}
