"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/user-context";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface Settlement {
  from: string;
  to: string;
  amount: number;
  reason: string;
}

interface WeeklySettlement {
  weekStart: string;
  weekEnd: string;
  participants: string[];
  totalPool: number;
  winnersPot: number;
  losersPot: number;
  settlements: Settlement[];
  isSettled: boolean;
  settledAt?: string;
}

export default function SettlementsPage() {
  const { userName } = useUser();
  const [settlement, setSettlement] = useState<WeeklySettlement | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettlement = async () => {
    try {
      const res = await fetch("/api/settlements");
      const data = await res.json();
      setSettlement(data.settlement);
    } catch {
      console.error("Failed to fetch settlement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlement();
  }, []);

  const myPayments = settlement?.settlements.filter((s) => s.from === userName) || [];
  const myReceivables = settlement?.settlements.filter((s) => s.to === userName) || [];
  const myNetOwed = myPayments.reduce((sum, s) => sum + s.amount, 0);
  const myNetReceivable = myReceivables.reduce((sum, s) => sum + s.amount, 0);
  const myBalance = myNetReceivable - myNetOwed;

  const formatWeekRange = (start: string, end: string) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${e.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    } catch {
      return `${start} - ${end}`;
    }
  };

  return (
    <div className="min-h-screen">
      <header className="surface-header sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Users className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Board</span>
              </Button>
            </Link>
            <img 
              src="/ipl-logo.png" 
              alt="IPL" 
              className="h-8 w-auto object-contain hidden sm:block"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-ipl-orange" />
              <h1 className="font-bold text-sm">Weekly Settlements</h1>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setLoading(true); fetchSettlement(); }}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && settlement && (
          <>
            {/* Week header */}
            <div className="surface-raised p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-lg">
                    {formatWeekRange(settlement.weekStart, settlement.weekEnd)}
                  </h2>
                </div>
                {settlement.isSettled && (
                  <Badge className="border-emerald-500/35 text-emerald-400 bg-card">
                    Settled
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="surface-inset p-3 rounded-lg border-white/[0.05]">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    Total Pool
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {formatCurrency(settlement.totalPool)}
                  </div>
                </div>
                <div className="surface-inset p-3 rounded-lg border-white/[0.05]">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    Winners Pot
                  </div>
                  <div className="text-xl font-bold text-emerald-400">
                    {formatCurrency(settlement.winnersPot)}
                  </div>
                </div>
                <div className="surface-inset p-3 rounded-lg border-white/[0.05]">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    Participants
                  </div>
                  <div className="text-xl font-bold text-primary">
                    {settlement.participants.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Your balance */}
            {userName && (myNetOwed > 0 || myNetReceivable > 0) && (
              <div
                className={cn(
                  "surface-raised p-5 mb-6 border-l-4",
                  myBalance > 0
                    ? "border-l-emerald-500/70"
                    : myBalance < 0
                    ? "border-l-rose-500/70"
                    : "border-l-zinc-500/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Your Balance</h3>
                  <Badge
                    className={cn(
                      myBalance > 0
                        ? "border-emerald-500/35 text-emerald-400 bg-card"
                        : myBalance < 0
                        ? "border-rose-500/35 text-rose-400 bg-card"
                        : "border-zinc-500/35 text-zinc-400 bg-card"
                    )}
                  >
                    {myBalance > 0 ? (
                      <>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Receiving
                      </>
                    ) : myBalance < 0 ? (
                      <>
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Paying
                      </>
                    ) : (
                      "Even"
                    )}
                  </Badge>
                </div>
                <div className="text-3xl font-bold mb-3">
                  <span
                    className={cn(
                      myBalance > 0
                        ? "text-emerald-400"
                        : myBalance < 0
                        ? "text-rose-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {myBalance > 0 ? "+" : ""}
                    {formatCurrency(myBalance)}
                  </span>
                </div>

                {myPayments.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      You owe:
                    </p>
                    {myPayments.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm bg-rose-950/20 border border-rose-500/20 rounded-lg px-3 py-2"
                      >
                        <span className="text-foreground">{s.to}</span>
                        <span className="font-bold text-rose-400">{formatCurrency(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {myReceivables.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      You receive:
                    </p>
                    {myReceivables.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm bg-emerald-950/20 border border-emerald-500/20 rounded-lg px-3 py-2"
                      >
                        <span className="text-foreground">{s.from}</span>
                        <span className="font-bold text-emerald-400">
                          {formatCurrency(s.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* All settlements */}
            <div className="surface-raised p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">All Settlements</h3>
                <Badge variant="outline" className="text-[10px] ml-auto">
                  {settlement.settlements.length} transfers
                </Badge>
              </div>

              {settlement.settlements.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No settlements for this week</p>
                  <p className="text-xs mt-1">Place bets and wait for results!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {settlement.settlements.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-secondary/40 p-3 shadow-raised-sm"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-[11px] font-bold text-rose-300 shrink-0">
                          {s.from[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-sm truncate">{s.from}</span>
                      </div>

                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />

                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="font-medium text-sm truncate">{s.to}</span>
                        <div className="w-7 h-7 rounded-full bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-[11px] font-bold text-emerald-300 shrink-0">
                          {s.to[0]?.toUpperCase()}
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <div className="font-bold text-sm text-foreground">
                          {formatCurrency(s.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <p className="font-semibold text-foreground mb-1">How weekly settlements work:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>All bets placed Monday-Sunday form a shared pool</li>
                    <li>Winners split the losers&apos; contributions proportionally</li>
                    <li>If you lose $5, it&apos;s distributed among all winners</li>
                    <li>If you win $20, it comes from all losers combined</li>
                    <li>Settlements calculate at week end (Sunday 11:59 PM)</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && !settlement && (
          <div className="surface-raised p-10 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No settlement data available</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Place some bets to see weekly settlements!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
