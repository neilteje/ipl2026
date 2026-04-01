import { NextResponse } from "next/server";
import { getLeaderboardStats } from "@/lib/db";

export async function GET() {
  try {
    const stats = await getLeaderboardStats();
    return NextResponse.json({ stats });
  } catch {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}

export const runtime = "nodejs";
