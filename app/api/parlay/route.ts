import { NextRequest, NextResponse } from "next/server";
import { saveParlay, getParlaysForMatch, getParlayForUserMatch } from "@/lib/db";
import { Parlay, ParlayLeg } from "@/types";
import { generateId, quoteParlay, validateParlayLegs } from "@/lib/utils";
import { getOrCreateMatchBets } from "@/lib/betting-service";

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

    const trimmedUserName = userName.trim();

    if (!trimmedUserName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (trimmedUserName.length > 30) {
      return NextResponse.json({ error: "Name too long" }, { status: 400 });
    }

    if (betAmount <= 0 || betAmount > 10000) {
      return NextResponse.json({ error: "Invalid bet amount" }, { status: 400 });
    }

    if (legs.length > 10) {
      return NextResponse.json({ error: "Max 10 legs per parlay" }, { status: 400 });
    }

    const validDirections = new Set(["over", "under", "yes", "no"]);
    if (legs.some((leg) => !validDirections.has(leg.direction))) {
      return NextResponse.json({ error: "Invalid leg direction" }, { status: 400 });
    }

    const uniqueLegIds = new Set(legs.map((leg) => leg.betId));
    if (uniqueLegIds.size !== legs.length) {
      return NextResponse.json({ error: "Duplicate bet legs are not allowed" }, { status: 400 });
    }

    const bettingPayload = await getOrCreateMatchBets(matchId);
    if (!bettingPayload) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (bettingPayload.bettingClosed) {
      return NextResponse.json(
        { error: "Betting is closed for this match" },
        { status: 409 }
      );
    }

    const existingParlay = await getParlayForUserMatch(matchId, trimmedUserName);
    if (existingParlay) {
      return NextResponse.json(
        { error: "You already have a parlay for this match. Delete it first to replace it." },
        { status: 409 }
      );
    }

    const betById = new Map(bettingPayload.bets.map((bet) => [bet.id, bet]));
    if (legs.some((leg) => !betById.has(leg.betId))) {
      return NextResponse.json({ error: "One or more legs are invalid for this match" }, { status: 400 });
    }

    const pricedLegs: ParlayLeg[] = legs.map((leg) => {
      const bet = betById.get(leg.betId)!;
      const isOver = leg.direction === "over" || leg.direction === "yes";

      return {
        betId: leg.betId,
        direction: leg.direction,
        odds: isOver ? bet.overOdds : bet.underOdds,
      };
    });

    const validation = validateParlayLegs(pricedLegs, bettingPayload.bets);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const quote = quoteParlay(betAmount, pricedLegs, bettingPayload.bets);

    const parlay: Parlay = {
      id: generateId(),
      matchId,
      userName: trimmedUserName,
      betAmount,
      legs: pricedLegs,
      createdAt: new Date().toISOString(),
      status: "pending",
      potentialPayout: quote.potentialPayout,
      pricingModel: quote.pricingModel,
      multiplier: quote.multiplier,
      rawMultiplier: quote.rawMultiplier,
      rawPotentialPayout: quote.rawPotentialPayout,
      correlationDiscountPct: quote.correlationDiscountPct,
      correlationScore: quote.correlationScore,
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
