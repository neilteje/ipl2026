"use client";

import { BetLine, BetDirection, ParlayLeg } from "@/types";
import { cn, formatOdds } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, User, CheckCircle2, XCircle } from "lucide-react";

interface BetCardProps {
  bet: BetLine;
  selectedLeg?: ParlayLeg;
  onSelect: (betId: string, direction: BetDirection, odds: number) => void;
  onDeselect: (betId: string) => void;
  disabled?: boolean;
}

const CATEGORY_ACCENT: Record<string, string> = {
  Match: "border-l-amber-400/70",
  Innings: "border-l-violet-400/60",
  Batting: "border-l-orange-400/65",
  Bowling: "border-l-emerald-400/60",
  Opening: "border-l-yellow-400/55",
  Extras: "border-l-rose-400/55",
};

const CATEGORY_BADGE: Record<string, string> = {
  Match: "border-amber-500/30 text-amber-100/90 bg-zinc-900/70",
  Innings: "border-violet-500/30 text-violet-100/85 bg-zinc-900/70",
  Batting: "border-orange-500/30 text-orange-100/90 bg-zinc-900/70",
  Bowling: "border-emerald-500/30 text-emerald-100/90 bg-zinc-900/70",
  Opening: "border-yellow-500/30 text-yellow-100/85 bg-zinc-900/70",
  Extras: "border-rose-500/30 text-rose-100/85 bg-zinc-900/70",
};

export function BetCard({ bet, selectedLeg, onSelect, onDeselect, disabled }: BetCardProps) {
  const isResolved = !!bet.result;
  const overSelected = selectedLeg?.direction === "over" || selectedLeg?.direction === "yes";
  const underSelected = selectedLeg?.direction === "under" || selectedLeg?.direction === "no";
  const isAlternateLine = bet.isPlayerProp && /\d+\+$/.test(bet.shortDesc);

  const overLabel = bet.unit === "wickets" || bet.unit === "runs" ? "OVER" : "OVER";
  const underLabel = bet.unit === "wickets" || bet.unit === "runs" ? "UNDER" : "UNDER";

  const handleOverClick = () => {
    if (disabled) return;
    if (overSelected) {
      onDeselect(bet.id);
    } else {
      onSelect(bet.id, "over", bet.overOdds);
    }
  };

  const handleUnderClick = () => {
    if (disabled) return;
    if (underSelected) {
      onDeselect(bet.id);
    } else {
      onSelect(bet.id, "under", bet.underOdds);
    }
  };

  const getResultBadge = () => {
    if (!bet.result) return null;
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="font-medium">
          Actual: {bet.result.actualValue} {bet.unit}
        </span>
        {bet.result.winner === "over" ? (
          <Badge className="bg-emerald-950/80 text-emerald-300 border-emerald-600/35 text-[10px] shadow-raised-sm">
            OVER HIT
          </Badge>
        ) : bet.result.winner === "under" ? (
          <Badge className="bg-rose-950/80 text-rose-300 border-rose-600/35 text-[10px] shadow-raised-sm">
            UNDER HIT
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]">
            PUSH
          </Badge>
        )}
      </div>
    );
  };

  const getSelectionResult = (direction: "over" | "under") => {
    if (!bet.result) return null;
    const won = bet.result.winner === direction;
    const push = bet.result.winner === "push";
    if (push) return <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />;
    return won ? (
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
    ) : (
      <XCircle className="w-3.5 h-3.5 text-red-400" />
    );
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.07] bg-card p-4 shadow-raised-sm transition-all duration-200 border-l-[3px]",
        CATEGORY_ACCENT[bet.category] ?? "border-l-zinc-500/40",
        selectedLeg && "ring-1 ring-primary/45 border-primary/30 shadow-raised",
        isResolved && "opacity-95"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 shadow-raised-sm",
                CATEGORY_BADGE[bet.category] ?? "border-zinc-600/35 text-zinc-200 bg-zinc-900/70"
              )}
            >
              {bet.category}
            </Badge>
            {bet.isPlayerProp && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-zinc-900/70 text-zinc-300 border-zinc-600/35"
              >
                <User className="w-2.5 h-2.5 mr-0.5" />
                Player prop
              </Badge>
            )}
            {isAlternateLine && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-zinc-900/70 text-amber-200 border-amber-500/30"
              >
                Alt line
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium leading-tight">{bet.description}</p>
          {isResolved && <div className="mt-1">{getResultBadge()}</div>}
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-foreground tabular-nums">{bet.line}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{bet.unit}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleOverClick}
          disabled={disabled || isResolved}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border py-2.5 px-3 text-sm font-semibold transition-all duration-150 shadow-raised-sm",
            "active:translate-y-px",
            overSelected
              ? "border-emerald-500/45 bg-emerald-950/35 text-emerald-200"
              : "border-white/[0.08] bg-secondary/35 text-muted-foreground hover:bg-accent/80",
            (disabled || isResolved) && "cursor-not-allowed opacity-60"
          )}
        >
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{overLabel}</span>
            {overSelected && isResolved && getSelectionResult("over")}
          </div>
          <span
            className={cn(
              "text-xs mt-0.5 tabular-nums",
              overSelected ? "text-emerald-300/85" : "text-muted-foreground/65"
            )}
          >
            {formatOdds(bet.overOdds)}
          </span>
        </button>

        <button
          onClick={handleUnderClick}
          disabled={disabled || isResolved}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border py-2.5 px-3 text-sm font-semibold transition-all duration-150 shadow-raised-sm",
            "active:translate-y-px",
            underSelected
              ? "border-rose-500/45 bg-rose-950/35 text-rose-200"
              : "border-white/[0.08] bg-secondary/35 text-muted-foreground hover:bg-accent/80",
            (disabled || isResolved) && "cursor-not-allowed opacity-60"
          )}
        >
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{underLabel}</span>
            {underSelected && isResolved && getSelectionResult("under")}
          </div>
          <span
            className={cn(
              "text-xs mt-0.5 tabular-nums",
              underSelected ? "text-rose-300/85" : "text-muted-foreground/65"
            )}
          >
            {formatOdds(bet.underOdds)}
          </span>
        </button>
      </div>
    </div>
  );
}
