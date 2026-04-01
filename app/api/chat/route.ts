import { NextRequest, NextResponse } from "next/server";
import { getChatMessages, addChatMessage } from "@/lib/db";
import { ChatMessage } from "@/components/ChatPanel";
import { generateId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("matchId");
  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  try {
    const messages = await getChatMessages(matchId);
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, userName, text } = body as {
      matchId: string;
      userName: string;
      text: string;
    };

    if (!matchId || !userName || !text?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (text.length > 200) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    if (userName.length > 30) {
      return NextResponse.json({ error: "Name too long" }, { status: 400 });
    }

    const message: ChatMessage = {
      id: generateId(),
      userName: userName.trim(),
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    await addChatMessage(matchId, message);

    return NextResponse.json({ message }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export const runtime = "nodejs";
