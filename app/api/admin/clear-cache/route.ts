import { NextResponse } from "next/server";
import { clearAllBets } from "@/lib/db";

export async function POST() {
  try {
    await clearAllBets();
    return NextResponse.json({ 
      success: true, 
      message: "All bet caches cleared. New bets will be regenerated on next request." 
    });
  } catch (err) {
    console.error("Clear cache error:", err);
    return NextResponse.json({ error: "Failed to clear cache" }, { status: 500 });
  }
}

export const runtime = "nodejs";
