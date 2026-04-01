import { NextRequest, NextResponse } from "next/server";
import {
  getBets,
  getParlaysForMatch,
  updateBetResult,
  updateParlayStatus,
} from "@/lib/db";
import { calculateParlayPayout } from "@/lib/utils";

// POST /api/resolve
// Body: { matchId, adminSecret, results: [{ betId, actualValue }] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, adminSecret, results } = body as {
      matchId: string;
      adminSecret: string;
      results: { betId: string; actualValue: number }[];
    };

    // Admin auth check
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!matchId || !results?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch current bets to get lines
    const bets = await getBets(matchId);
    if (!bets) {
      return NextResponse.json({ error: "No bets found for match" }, { status: 404 });
    }

    // Resolve each bet
    for (const { betId, actualValue } of results) {
      const bet = bets.find((b) => b.id === betId);
      if (!bet) continue;

      let winner: "over" | "under" | "push";
      if (Math.abs(actualValue - bet.line) < 0.01) {
        winner = "push";
      } else if (actualValue > bet.line) {
        winner = "over";
      } else {
        winner = "under";
      }

      await updateBetResult(matchId, betId, actualValue, winner);
    }

    // Re-fetch updated bets
    const updatedBets = await getBets(matchId);

    // Resolve all parlays for this match
    const parlays = await getParlaysForMatch(matchId);
    const resolvedBetMap = new Map(
      (updatedBets || []).filter((b) => b.result).map((b) => [b.id, b])
    );

    for (const parlay of parlays) {
      // Check how many legs are resolved
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

      const allResolved = legResults.every((r) => r !== "pending");
      if (!allResolved) continue;

      const anyLost = legResults.some((r) => r === "lost");
      const allPush = legResults.every((r) => r === "push");

      let status: "won" | "lost" | "push";
      let payout: number | undefined;

      if (anyLost) {
        status = "lost";
        payout = 0;
      } else if (allPush) {
        status = "push";
        payout = parlay.betAmount; // return stake on full push
      } else {
        // Count non-push winning legs for payout
        const winningLegs = legResults.filter((r) => r === "won").length;
        status = "won";
        payout = calculateParlayPayout(parlay.betAmount, winningLegs);
      }

      await updateParlayStatus(parlay.id, status, payout);
    }

    return NextResponse.json({
      message: "Results resolved successfully",
      resolvedBets: results.length,
    });
  } catch (err) {
    console.error("Resolve error:", err);
    return NextResponse.json({ error: "Failed to resolve bets" }, { status: 500 });
  }
}

export const runtime = "nodejs";
