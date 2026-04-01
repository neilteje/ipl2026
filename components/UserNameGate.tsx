"use client";

import { useState, FormEvent } from "react";
import { useUser } from "@/lib/user-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Trophy } from "lucide-react";

export function UserNameGate({ children }: { children: React.ReactNode }) {
  const { userName, setUserName, isReady } = useUser();
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (userName) return <>{children}</>;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError("Name can't be empty");
      return;
    }
    if (trimmed.length > 24) {
      setError("Name must be 24 characters or less");
      return;
    }
    setError("");
    setUserName(trimmed);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/ipl-logo.png" 
            alt="IPL" 
            className="h-20 w-auto object-contain mb-4"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div className="hidden w-16 h-16 rounded-2xl border border-white/[0.09] bg-card shadow-raised items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary" strokeWidth={2.25} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">IPL Parlay</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Friends betting league · IPL 2026 (Mar 28 – May 31)
          </p>
        </div>

        <div className="flex gap-2 mb-8 justify-center">
          {[
            { l: 2, m: "3.6x" },
            { l: 3, m: "6.9x" },
            { l: 4, m: "13x" },
            { l: 5, m: "24.8x" },
          ].map(({ l, m }) => (
            <div
              key={l}
              className="surface-inset flex flex-col items-center px-3 py-2 min-w-[56px] border-white/[0.05]"
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {l} legs
              </span>
              <span className="text-base font-bold text-primary tabular-nums">{m}</span>
            </div>
          ))}
        </div>

        <div className="surface-raised p-6">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-ipl-orange" strokeWidth={2} />
            <h2 className="font-semibold text-sm">Join the board</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Choose a display name — it appears on every parlay and in match chat.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Input
                autoFocus
                placeholder="Nickname (e.g. Rohit)"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (error) setError("");
                }}
                className="h-11 text-base border-white/[0.08] bg-secondary/40 shadow-insetWell"
                maxLength={24}
              />
              {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            </div>
            <Button type="submit" className="w-full h-11 text-sm" disabled={!inputValue.trim()}>
              <Sparkles className="w-4 h-4 mr-2" />
              Enter app
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Stored on this device only — no account required
        </p>
      </div>
    </div>
  );
}
