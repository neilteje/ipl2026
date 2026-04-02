import { NextRequest, NextResponse } from "next/server";
import { applyResolvedBetValues } from "@/lib/settlement";

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

    const settlement = await applyResolvedBetValues(matchId, results);

    return NextResponse.json({
      message: "Results resolved successfully",
      resolvedBets: settlement.resolvedBets,
      updatedParlays: settlement.updatedParlays,
    });
  } catch (err) {
    console.error("Resolve error:", err);
    return NextResponse.json({ error: "Failed to resolve bets" }, { status: 500 });
  }
}

export const runtime = "nodejs";
