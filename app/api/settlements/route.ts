import { NextResponse } from "next/server";
import { getCurrentWeekSettlement, calculateWeeklySettlement } from "@/lib/db";

export async function GET() {
  try {
    const settlement = await getCurrentWeekSettlement();
    return NextResponse.json({ settlement });
  } catch (err) {
    console.error("Settlements API error:", err);
    return NextResponse.json({ error: "Failed to fetch settlements" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { weekStart } = await req.json();
    if (!weekStart) {
      return NextResponse.json({ error: "weekStart required" }, { status: 400 });
    }
    
    const settlement = await calculateWeeklySettlement(weekStart);
    return NextResponse.json({ settlement });
  } catch (err) {
    console.error("Settlement calculation error:", err);
    return NextResponse.json({ error: "Failed to calculate settlement" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const revalidate = 300;
