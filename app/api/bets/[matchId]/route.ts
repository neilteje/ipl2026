import { NextRequest, NextResponse } from "next/server";
import { getOrCreateMatchBets } from "@/lib/betting-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const { matchId } = params;

  try {
    const url = new URL(req.url);
    const forceRegenerate = url.searchParams.get("regenerate") === "true";
    const payload = await getOrCreateMatchBets(matchId, { forceRegenerate });

    if (!payload) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (payload.bettingClosed && payload.bets.length === 0) {
      return NextResponse.json({
        bets: [],
        match: payload.match,
        bettingClosed: true,
        error: "Betting is closed because this match starts in less than 1 hour.",
      });
    }

    return NextResponse.json({
      bets: payload.bets,
      match: payload.match,
      bettingClosed: payload.bettingClosed,
    });
  } catch (err) {
    console.error("Bets API error:", err);
    return NextResponse.json({ error: "Failed to fetch bets" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const { matchId } = params;

  try {
    const payload = await getOrCreateMatchBets(matchId, { forceRegenerate: true });

    if (!payload) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (payload.bettingClosed) {
      return NextResponse.json(
        { error: "Cannot regenerate bets within 1 hour of match start", match: payload.match },
        { status: 409 }
      );
    }

    return NextResponse.json({ bets: payload.bets, match: payload.match, regenerated: true });
  } catch (err) {
    console.error("Regenerate bets error:", err);
    return NextResponse.json({ error: "Failed to regenerate bets" }, { status: 500 });
  }
}

export const runtime = "nodejs";
