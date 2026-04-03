"use client";

import { useState } from "react";
import { BetLine, ParlayLeg } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  calculateParlayPayout,
  getParlayMultiplier,
  formatCurrency,
  formatOdds,
  cn,
  quoteParlay,
  validateParlayLegs,
} from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Trash2,
  Loader2,
  Sparkles,
  Trophy,
} from "lucide-react";

interface ParlayPanelProps {
  legs: ParlayLeg[];
  bets: BetLine[];
  matchId: string;
  currentUser: string | null;
  lockedReason?: string | null;
  onRemoveLeg: (betId: string) => void;
  onClearAll: () => void;
  onSubmit: (userName: string, betAmount: number) => Promise<void>;
}

export function ParlayPanel({
  legs,
  bets,
  matchId,
  currentUser,
  lockedReason,
  onRemoveLeg,
  onClearAll,
  onSubmit,
}: ParlayPanelProps) {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const locked = !!lockedReason;

  const getBetForLeg = (leg: ParlayLeg) => bets.find((b) => b.id === leg.betId);
  const validation = validateParlayLegs(legs, bets);
  const quote =
    validation.valid && legs.length > 0
      ? quoteParlay(betAmount, legs, bets)
      : null;

  const multiplier = quote?.multiplier ?? getParlayMultiplier(legs);
  const potentialPayout = quote?.potentialPayout ?? calculateParlayPayout(betAmount, legs);

  const handleSubmit = async () => {
    if (locked || !currentUser || legs.length === 0 || betAmount <= 0) return;
    setLoading(true);
    try {
      await onSubmit(currentUser, betAmount);
    } finally {
      setLoading(false);
    }
  };

  if (legs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center px-4">
        <div className="w-12 h-12 rounded-full border border-white/[0.07] bg-muted/50 shadow-insetWell flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground text-sm mb-1">Build Your Parlay</h3>
        <p className="text-xs text-muted-foreground">
          {lockedReason || "Click OVER or UNDER on any bet to start"}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 w-full max-w-xs">
          {[2, 3, 4].map((n) => (
            <div
              key={n}
              className="surface-inset rounded-lg p-2 text-center border-white/[0.05]"
            >
              <div className="text-[10px] text-muted-foreground">{n} legs</div>
              <div className="text-sm font-bold text-primary tabular-nums">{getParlayMultiplier(n)}x</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {(lockedReason || validation.error) && (
        <div className="mb-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {lockedReason || validation.error}
        </div>
      )}

      {/* Legs list */}
      <ScrollArea className="flex-1 max-h-[300px]">
        <div className="space-y-2 p-1">
          {legs.map((leg, i) => {
            const bet = getBetForLeg(leg);
            if (!bet) return null;
            const isOver = leg.direction === "over" || leg.direction === "yes";

            return (
              <div
                key={leg.betId}
                className="flex items-start gap-2 rounded-lg surface-inset p-2.5 border-white/[0.05]"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full border border-primary/30 bg-card text-primary text-[10px] font-bold flex items-center justify-center mt-0.5 shadow-raised-sm">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-tight truncate">{bet.shortDesc}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Badge
                      className={cn(
                        "text-[10px] px-1 py-0 h-4",
                        isOver
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      )}
                      variant="outline"
                    >
                      {isOver ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                      {isOver ? "OVER" : "UNDER"} {bet.line} @ {formatOdds(leg.odds)}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveLeg(leg.betId)}
                  className="flex-shrink-0 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Separator className="my-3" />

      {/* Payout info */}
      <div className="rounded-lg surface-inset border-primary/25 p-3 mb-3 bg-card/40">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">
            {legs.length} leg{legs.length > 1 ? "s" : ""} · {multiplier}x
          </span>
          <Badge className="border-primary/35 text-primary bg-card text-[10px] shadow-raised-sm">
            <Trophy className="w-2.5 h-2.5 mr-1" />
            Parlay
          </Badge>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">To win</span>
          <span className="text-xl font-bold text-primary tabular-nums">{formatCurrency(potentialPayout)}</span>
        </div>
        <div className="text-xs text-muted-foreground text-right">on {formatCurrency(betAmount)} bet</div>
        {quote && quote.correlationDiscountPct > 0.01 && (
          <div className="mt-2 text-[11px] text-muted-foreground text-right">
            Correlation haircut {Math.round(quote.correlationDiscountPct * 100)}% · Raw {quote.rawMultiplier}x
          </div>
        )}
      </div>

      {/* Bet amount + submitting as */}
      <div className="space-y-3">
        {currentUser && (
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-secondary/50 px-3 py-2 shadow-raised-sm">
            <div className="w-6 h-6 rounded-full border border-primary/30 bg-card flex items-center justify-center text-[11px] font-bold text-primary shadow-raised-sm">
              {currentUser[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium">{currentUser}</span>
            <span className="text-xs text-muted-foreground ml-auto">submitting as</span>
          </div>
        )}

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Bet Amount ($)</Label>
          <div className="flex gap-1.5 mb-1.5">
            {[5, 10, 20, 50].map((amt) => (
              <button
                key={amt}
                onClick={() => setBetAmount(amt)}
                disabled={locked}
                className={cn(
                  "flex-1 h-8 rounded-md border text-xs font-medium transition-colors",
                  betAmount === amt
                    ? "bg-primary text-primary-foreground border-primary/40 shadow-raised-sm"
                    : "bg-secondary/40 border-white/[0.08] hover:bg-accent shadow-raised-sm",
                  locked && "cursor-not-allowed opacity-60"
                )}
              >
                ${amt}
              </button>
            ))}
          </div>
          <Input
            type="number"
            min={1}
            step={1}
            value={betAmount}
            disabled={locked}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="h-9 text-sm"
            placeholder="Custom amount"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClearAll} className="flex-1" disabled={loading}>
            Clear
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={locked || loading || !currentUser || legs.length === 0 || betAmount <= 0 || !validation.valid}
            className="flex-1"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
