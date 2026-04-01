"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useUser } from "@/lib/user-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, MessageCircle } from "lucide-react";

export interface ChatMessage {
  id: string;
  userName: string;
  text: string;
  timestamp: string;
}

interface ChatPanelProps {
  matchId: string;
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

const AVATAR_COLORS = [
  "bg-purple-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-cyan-500",
];

function nameToColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function Avatar({ name }: { name: string }) {
  return (
    <div
      className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
        nameToColor(name)
      )}
    >
      {name[0]?.toUpperCase()}
    </div>
  );
}

export function ChatPanel({ matchId }: ChatPanelProps) {
  const { userName } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat?matchId=${matchId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {}
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [matchId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length !== prevLengthRef.current) {
      prevLengthRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !userName || sending) return;

    setSending(true);
    setInput("");

    // Optimistic update
    const optimistic: ChatMessage = {
      id: "tmp-" + Date.now(),
      userName,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, userName, text }),
      });
      if (res.ok) {
        // Refresh to get server-side message with proper ID
        await fetchMessages();
      }
    } catch {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          <MessageCircle className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Be the first to trash talk</p>
        </div>
        <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-border/50">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something..."
            className="h-9 text-sm flex-1"
            maxLength={200}
            disabled={!userName}
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!input.trim() || sending}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-1">
        <div className="space-y-2 py-1">
          {messages.map((msg) => {
            const isOwn = msg.userName === userName;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end gap-1.5",
                  isOwn ? "flex-row-reverse" : "flex-row"
                )}
              >
                {!isOwn && <Avatar name={msg.userName} />}
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3 py-2 text-sm border shadow-raised-sm",
                    isOwn
                      ? "bg-primary text-primary-foreground border-primary/40 rounded-br-md"
                      : "bg-secondary/80 border-white/[0.06] rounded-bl-md"
                  )}
                >
                  {!isOwn && (
                    <p className="text-[10px] font-semibold mb-0.5 opacity-70">{msg.userName}</p>
                  )}
                  <p className="leading-snug break-words">{msg.text}</p>
                  <p
                    className={cn(
                      "text-[9px] mt-0.5",
                      isOwn ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
                    )}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-border/50 mt-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something..."
          className="h-9 text-sm flex-1"
          maxLength={200}
          disabled={!userName}
        />
        <Button
          type="submit"
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={!input.trim() || sending || !userName}
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );
}
