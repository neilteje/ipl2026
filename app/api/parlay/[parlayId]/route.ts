import { NextRequest, NextResponse } from "next/server";
import { deleteParlay } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { parlayId: string } }
) {
  const { parlayId } = params;

  try {
    const body = await req.json();
    const { userName } = body as { userName: string };

    if (!userName?.trim()) {
      return NextResponse.json({ error: "userName required" }, { status: 400 });
    }

    const result = await deleteParlay(parlayId, userName.trim());

    if (!result.ok) {
      const status = result.error === "Not your parlay" ? 403 : 404;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete parlay" }, { status: 500 });
  }
}

export const runtime = "nodejs";
