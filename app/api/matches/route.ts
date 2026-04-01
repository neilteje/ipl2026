import { NextResponse } from "next/server";
import { getIPLMatches } from "@/lib/cricket-api";

export async function GET() {
  try {
    const matches = await getIPLMatches();
    return NextResponse.json({ matches });
  } catch (err) {
    console.error("Matches API error:", err);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}

export const runtime = "nodejs";
/** Always resolve matches at request time (env + CricAPI can change) */
export const dynamic = "force-dynamic";
