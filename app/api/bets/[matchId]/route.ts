import { NextRequest, NextResponse } from "next/server";
import { getBets, saveBets } from "@/lib/db";
import { generateBetsForMatch } from "@/lib/bet-generator";
import { getMatchById } from "@/lib/cricket-api";
import { getMockMatches } from "@/lib/cricket-api";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const { matchId } = params;

  try {
    // Check if force regeneration is requested
    const url = new URL(req.url);
    const forceRegenerate = url.searchParams.get("regenerate") === "true";

    // Try to get cached bets first (unless force regenerate)
    let bets = forceRegenerate ? null : await getBets(matchId);

    if (!bets) {
      // Fetch match info to generate bets
      const allMocks = getMockMatches();
      let match = allMocks.find((m) => m.id === matchId);
      
      // Only try CricAPI if not found in mocks AND we have an API key
      if (!match && process.env.CRICAPI_KEY) {
        try {
          const apiMatch = await getMatchById(matchId);
          if (apiMatch) match = apiMatch;
        } catch (apiErr) {
          console.warn("CricAPI fetch failed, match not in mocks:", matchId);
        }
      }

      if (!match) {
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }

      // Generate and cache bets
      bets = generateBetsForMatch(match);
      await saveBets(matchId, bets);
    }

    return NextResponse.json({ bets });
  } catch (err) {
    console.error("Bets API error:", err);
    return NextResponse.json({ error: "Failed to fetch bets" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  // Regenerate bets (reset) - force regeneration by not using cache
  const { matchId } = params;

  try {
    console.log(`🔄 Regenerating bets for match: ${matchId}`);
    
    // Try mocks first
    const allMocks = getMockMatches();
    let match = allMocks.find((m) => m.id === matchId);
    
    // Only try CricAPI if not found in mocks AND we have an API key
    if (!match && process.env.CRICAPI_KEY) {
      try {
        const apiMatch = await getMatchById(matchId);
        if (apiMatch) match = apiMatch;
      } catch (apiErr) {
        console.warn("CricAPI fetch failed for delete:", matchId);
      }
    }

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Generate fresh bets with current logic
    const bets = generateBetsForMatch(match);
    console.log(`✅ Generated ${bets.length} bets for ${matchId}`);
    
    // Save to cache
    await saveBets(matchId, bets);
    return NextResponse.json({ bets, regenerated: true });
  } catch (err) {
    console.error("Regenerate bets error:", err);
    return NextResponse.json({ error: "Failed to regenerate bets" }, { status: 500 });
  }
}

export const runtime = "nodejs";
