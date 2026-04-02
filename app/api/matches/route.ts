import { NextResponse } from "next/server";
import { getIPLMatches } from "@/lib/cricket-api";
import { getRegisteredMatchesMetadata } from "@/lib/db";
import { getMatchKickoffTime } from "@/lib/utils";
import { IPLMatch } from "@/types";

export async function GET() {
  try {
    const [liveMatches, storedMatches] = await Promise.all([
      getIPLMatches(),
      getRegisteredMatchesMetadata(),
    ]);

    const matchById = new Map<string, IPLMatch>();

    for (const match of storedMatches) {
      matchById.set(match.id, match);
    }

    for (const match of liveMatches) {
      matchById.set(match.id, match);
    }

    const matches = Array.from(matchById.values()).sort((a, b) => {
      const dateA = getMatchKickoffTime(a);
      const dateB = getMatchKickoffTime(b);
      return dateA - dateB;
    });

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("Matches API error:", err);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}

export const runtime = "nodejs";
/** Always resolve matches at request time (env + CricAPI can change) */
export const dynamic = "force-dynamic";
