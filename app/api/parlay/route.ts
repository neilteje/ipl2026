import { NextRequest, NextResponse } from "next/server";
import { saveParlay, getParlaysForMatch } from "@/lib/db";
import { Parlay, ParlayLeg } from "@/types";
import { calculateParlayPayout, generateId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, userName, betAmount, legs } = body as {
      matchId: string;
      userName: string;
      betAmount: number;
      legs: ParlayLeg[];
    };

    // Validation
    if (!matchId || !userName || !betAmount || !legs?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (userName.length > 30) {
      return NextResponse.json({ error: "Name too long" }, { status: 400 });
    }

    if (betAmount <= 0 || betAmount > 10000) {
      return NextResponse.json({ error: "Invalid bet amount" }, { status: 400 });
    }

    if (legs.length > 10) {
      return NextResponse.json({ error: "Max 10 legs per parlay" }, { status: 400 });
    }

    const potentialPayout = calculateParlayPayout(betAmount, legs.length);

    const parlay: Parlay = {
      id: generateId(),
      matchId,
      userName: userName.trim(),
      betAmount,
      legs,
      createdAt: new Date().toISOString(),
      status: "pending",
      potentialPayout,
    };

    await saveParlay(parlay);

    return NextResponse.json({ parlay }, { status: 201 });
  } catch (err) {
    console.error("Parlay POST error:", err);
    return NextResponse.json({ error: "Failed to save parlay" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("matchId");
  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  try {
    const parlays = await getParlaysForMatch(matchId);
    return NextResponse.json({ parlays });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch parlays" }, { status: 500 });
  }
}

export const runtime = "nodejs";
