import { NextRequest, NextResponse } from "next/server";
import { runAutomaticSettlement } from "@/lib/settlement";

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization") || "";
  const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const adminHeader = req.headers.get("x-admin-secret") || "";
  const userAgent = req.headers.get("user-agent") || "";
  const vercelCronHeader = req.headers.get("x-vercel-cron") || "";

  if (process.env.CRON_SECRET && bearerToken === process.env.CRON_SECRET) {
    return true;
  }

  if (process.env.ADMIN_SECRET && adminHeader === process.env.ADMIN_SECRET) {
    return true;
  }

  if (!process.env.CRON_SECRET && (vercelCronHeader || userAgent.includes("vercel-cron/1.0"))) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runAutomaticSettlement();
    return NextResponse.json(summary);
  } catch (err) {
    console.error("Automatic settlement failed:", err);
    return NextResponse.json({ error: "Automatic settlement failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
