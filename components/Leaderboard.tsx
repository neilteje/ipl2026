"use client";

import { useState } from "react";
import { Parlay, BetLine, ParlayLeg } from "@/types";
import {
  formatCurrency,
  formatOdds,
  getParlayMultiplier,
  cn,
  normalizeUserName,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Minus,
  Trash2,
  Loader2,
  ChevronRight,
} from "lucide-react";

interface LeaderboardProps {
  parlays: Parlay[];
  bets: BetLine[];
  currentUser: string | null;
  onDeleteParlay: (parlayId: string) => Promise<void>;
}

function ParlayStatusIcon({ status }: { status: Parlay["status"] }) {
  if (status === "won") return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  if (status === "lost") return <XCircle className="w-4 h-4 text-red-400" />;
  if (status === "push") return <Minus className="w-4 h-4 text-yellow-400" />;
  return <Clock className="w-4 h-4 text-muted-foreground" />;
}

function ParlayStatusBadge({ status }: { status: Parlay["status"] }) {
  if (status === "won") return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Won</Badge>;
  if (status === "lost") return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Lost</Badge>;
  if (status === "push") return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Push</Badge>;
  return <Badge variant="outline">Pending</Badge>;
}

type LegResult = "won" | "lost" | "push" | "pending";

function isOverDirection(direction: ParlayLeg["direction"]) {
  return direction === "over" || direction === "yes";
}

function getLegResult(bet: BetLine | undefined, leg: ParlayLeg): LegResult {
  if (!bet?.result) return "pending";
  if (bet.result.winner === "push") return "push";

  const selectedOver = isOverDirection(leg.direction);
  if (
    (selectedOver && bet.result.winner === "over") ||
    (!selectedOver && bet.result.winner === "under")
  ) {
    return "won";
  }

  return "lost";
}

function getLegScale(line: number, actualValue: number) {
  const delta = Math.abs(actualValue - line);
  const padding = Math.max(delta * 0.7, Math.max(1, Math.abs(line) * 0.12));
  const min = Math.max(0, Math.min(line, actualValue) - padding);
  const max = Math.max(line, actualValue) + padding;
  const range = Math.max(1, max - min);

  return {
    linePct: ((line - min) / range) * 100,
    actualPct: ((actualValue - min) / range) * 100,
  };
}

function formatStatValue(value: number, unit: string) {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${rounded} ${unit}`;
}

function LegResultBadge({ result }: { result: LegResult }) {
  if (result === "won") {
    return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Won</Badge>;
  }
  if (result === "lost") {
    return <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Lost</Badge>;
  }
  if (result === "push") {
    return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Push</Badge>;
  }
  return <Badge variant="outline">Pending</Badge>;
}

function ParlayLegBreakdown({ leg, bet }: { leg: ParlayLeg; bet?: BetLine }) {
  if (!bet) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-card/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Archived leg</p>
            <p className="text-xs text-muted-foreground mt-1">
              This bet line is no longer available on the current board.
            </p>
          </div>
          <LegResultBadge result="pending" />
        </div>
      </div>
    );
  }

  const selectedOver = isOverDirection(leg.direction);
  const legResult = getLegResult(bet, leg);
  const actualValue = bet.result?.actualValue;
  const scale = actualValue !== undefined ? getLegScale(bet.line, actualValue) : null;
  const barLeft = scale ? Math.min(scale.linePct, scale.actualPct) : 50;
  const barWidth = scale ? Math.max(Math.abs(scale.actualPct - scale.linePct), 0.8) : 0.8;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-card/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">{bet.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                selectedOver
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                  : "border-rose-500/25 bg-rose-500/10 text-rose-300"
              )}
            >
              {selectedOver ? "Over" : "Under"} {bet.line}
            </Badge>
            <Badge variant="outline" className="text-[10px] border-white/[0.08] bg-card text-muted-foreground">
              {formatOdds(leg.odds)}
            </Badge>
            {actualValue !== undefined && (
              <Badge variant="outline" className="text-[10px] border-white/[0.08] bg-card text-muted-foreground">
                Actual {formatStatValue(actualValue, bet.unit)}
              </Badge>
            )}
          </div>
        </div>
        <LegResultBadge result={legResult} />
      </div>

      {actualValue !== undefined ? (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wide">
            <span className={cn(selectedOver ? "text-muted-foreground" : "text-rose-300")}>Under side</span>
            <span className={cn(selectedOver ? "text-emerald-300" : "text-muted-foreground")}>Over side</span>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden border border-white/[0.08] bg-secondary/50">
            <div
              className="absolute inset-y-0 left-0 bg-rose-500/12"
              style={{ width: `${scale?.linePct ?? 50}%` }}
            />
            <div
              className="absolute inset-y-0 bg-emerald-500/12"
              style={{ left: `${scale?.linePct ?? 50}%`, width: `${100 - (scale?.linePct ?? 50)}%` }}
            />
            <div
              className={cn(
                "absolute top-1/2 h-2 -translate-y-1/2 rounded-full",
                legResult === "won" && "bg-green-400/80",
                legResult === "lost" && "bg-red-400/80",
                legResult === "push" && "bg-yellow-400/80",
                legResult === "pending" && "bg-white/40"
              )}
              style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
            />
            <div
              className="absolute inset-y-0 w-px bg-white/90"
              style={{ left: `${scale?.linePct ?? 50}%` }}
            />
            <div
              className={cn(
                "absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-sm",
                legResult === "won" && "bg-green-400",
                legResult === "lost" && "bg-red-400",
                legResult === "push" && "bg-yellow-400",
                legResult === "pending" && "bg-white/70"
              )}
              style={{ left: `${scale?.actualPct ?? 50}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
            <span>Line {formatStatValue(bet.line, bet.unit)}</span>
            <span
              className={cn(
                legResult === "won" && "text-green-400",
                legResult === "lost" && "text-red-400",
                legResult === "push" && "text-yellow-400"
              )}
            >
              Actual {formatStatValue(actualValue, bet.unit)}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-white/[0.08] bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
          Waiting for this leg to settle.
        </div>
      )}
    </div>
  );
}

export function Leaderboard({ parlays, bets, currentUser, onDeleteParlay }: LeaderboardProps) {
  const [confirmDelete, setConfirmDelete] = useState<Parlay | null>(null);
  const [activeParlay, setActiveParlay] = useState<Parlay | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getBetById = (id: string) => bets.find((b) => b.id === id);
  const getDisplayMultiplier = (parlay: Parlay) =>
    parlay.multiplier ?? getParlayMultiplier(parlay.legs);

  const sorted = [...parlays].sort((a, b) => {
    const order = { won: 0, pending: 1, push: 2, lost: 3 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return (b.payout || b.potentialPayout) - (a.payout || a.potentialPayout);
  });

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await onDeleteParlay(confirmDelete.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  if (parlays.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No parlays submitted yet.</p>
          <p className="text-xs mt-1">Be the first to lock in your picks!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {bets.some((bet) => bet.result) && (
        <div className="mb-3 rounded-xl border border-white/[0.06] bg-card/70 px-4 py-3 text-xs text-muted-foreground">
          Open any ticket to see the settled leg breakdown and result bars.
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((parlay, rank) => {
          const isOwn = currentUser && normalizeUserName(parlay.userName) === normalizeUserName(currentUser);

          return (
            <Card
              key={parlay.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveParlay(parlay)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActiveParlay(parlay);
                }
              }}
              className={cn(
                "overflow-hidden transition-all cursor-pointer hover:border-primary/25 hover:shadow-raised",
                parlay.status === "won" && "border-green-500/30",
                parlay.status === "lost" && "border-red-500/20 opacity-80",
                isOwn && "ring-1 ring-primary/40"
              )}
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {rank === 0 && parlay.status === "won" && (
                      <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
                    )}
                    <ParlayStatusIcon status={parlay.status} />
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-semibold text-sm">
                        {parlay.userName}
                        {isOwn && (
                          <span className="ml-1.5 text-[10px] text-primary font-normal opacity-90">
                            (you)
                          </span>
                        )}
                      </span>
                      <ParlayStatusBadge status={parlay.status} />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 shrink-0">
                    <div className="text-right">
                      {parlay.status === "won" && parlay.payout ? (
                        <div className="text-green-400 font-bold text-sm">
                          +{formatCurrency(parlay.payout - parlay.betAmount)}
                        </div>
                      ) : parlay.status === "pending" ? (
                        <div className="text-primary font-medium text-sm">
                          To win: {formatCurrency(parlay.potentialPayout)}
                        </div>
                      ) : parlay.status === "lost" ? (
                        <div className="text-red-400 text-sm">
                          -{formatCurrency(parlay.betAmount)}
                        </div>
                      ) : null}
                      <div className="text-xs text-muted-foreground">
                        ${parlay.betAmount} · {parlay.legs.length}L · {getDisplayMultiplier(parlay)}x
                      </div>
                    </div>

                    {/* Delete button — only for own pending parlays */}
                    {isOwn && parlay.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mt-0.5"
                        onClick={(event) => {
                          event.stopPropagation();
                          setConfirmDelete(parlay);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-4 pb-3">
                <div className="flex flex-wrap gap-1.5">
                  {parlay.legs.map((leg) => {
                    const bet = getBetById(leg.betId);
                    if (!bet) return null;
                    const isOver = isOverDirection(leg.direction);
                    const legResult = getLegResult(bet, leg);

                    return (
                      <div
                        key={leg.betId}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium",
                          legResult === "won" && "bg-green-500/10 border-green-500/30 text-green-400",
                          legResult === "lost" && "bg-red-500/10 border-red-500/30 text-red-400",
                          legResult === "push" && "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
                          legResult === "pending" && "bg-muted border-border text-muted-foreground"
                        )}
                      >
                        {isOver ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {bet.shortDesc} {isOver ? "OV" : "UN"} {bet.line}
                        {legResult === "won" && <CheckCircle2 className="w-3 h-3" />}
                        {legResult === "lost" && <XCircle className="w-3 h-3" />}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Tap to open ticket breakdown</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!activeParlay} onOpenChange={(open) => !open && setActiveParlay(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            {activeParlay && (
              <>
                <DialogTitle className="flex items-center gap-2">
                  <ParlayStatusIcon status={activeParlay.status} />
                  {activeParlay.userName}&apos;s Ticket
                </DialogTitle>
                <div className="flex items-center gap-2 pt-1">
                  <ParlayStatusBadge status={activeParlay.status} />
                  <DialogDescription className="m-0">
                    {activeParlay.legs.length}-leg parlay settled leg-by-leg.
                  </DialogDescription>
                </div>
              </>
            )}
          </DialogHeader>

          {activeParlay && (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-xl border border-white/[0.08] bg-card/70 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Stake</div>
                  <div className="text-sm font-semibold tabular-nums">{formatCurrency(activeParlay.betAmount)}</div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-card/70 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Multiplier</div>
                  <div className="text-sm font-semibold tabular-nums">{getDisplayMultiplier(activeParlay)}x</div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-card/70 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {activeParlay.status === "pending" ? "To Win" : "Payout"}
                  </div>
                  <div className="text-sm font-semibold tabular-nums">
                    {formatCurrency(
                      activeParlay.status === "pending"
                        ? activeParlay.potentialPayout
                        : activeParlay.status === "push"
                          ? activeParlay.betAmount
                          : activeParlay.payout ?? 0
                    )}
                  </div>
                </div>
              </div>

              {activeParlay.pricingModel === "correlation-v1" &&
                activeParlay.correlationDiscountPct &&
                activeParlay.rawMultiplier && (
                  <div className="mb-4 rounded-xl border border-white/[0.08] bg-card/70 px-3 py-2 text-xs text-muted-foreground">
                    Correlation haircut {Math.round(activeParlay.correlationDiscountPct * 100)}% ·
                    Raw {activeParlay.rawMultiplier}x
                  </div>
                )}

              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-3">
                  {activeParlay.legs.map((leg) => (
                    <ParlayLegBreakdown
                      key={leg.betId}
                      leg={leg}
                      bet={getBetById(leg.betId)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-destructive" />
              Delete Parlay?
            </DialogTitle>
            <DialogDescription>
              This will remove your{" "}
              <span className="font-semibold text-foreground">
                {confirmDelete?.legs.length}-leg parlay
              </span>{" "}
              (potential: {formatCurrency(confirmDelete?.potentialPayout ?? 0)}). This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
