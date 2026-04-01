"use client";

import { useState } from "react";
import { Parlay, BetLine } from "@/types";
import { formatCurrency, getParlayMultiplier, cn } from "@/lib/utils";
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

export function Leaderboard({ parlays, bets, currentUser, onDeleteParlay }: LeaderboardProps) {
  const [confirmDelete, setConfirmDelete] = useState<Parlay | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getBetById = (id: string) => bets.find((b) => b.id === id);

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
      <div className="space-y-3">
        {sorted.map((parlay, rank) => {
          const isOwn = currentUser && parlay.userName === currentUser;

          return (
            <Card
              key={parlay.id}
              className={cn(
                "overflow-hidden transition-all",
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
                        ${parlay.betAmount} · {parlay.legs.length}L · {getParlayMultiplier(parlay.legs.length)}x
                      </div>
                    </div>

                    {/* Delete button — only for own pending parlays */}
                    {isOwn && parlay.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mt-0.5"
                        onClick={() => setConfirmDelete(parlay)}
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
                    const isOver = leg.direction === "over" || leg.direction === "yes";

                    let legResult: "won" | "lost" | "push" | "pending" = "pending";
                    if (bet.result) {
                      if (bet.result.winner === "push") legResult = "push";
                      else if (
                        (isOver && bet.result.winner === "over") ||
                        (!isOver && bet.result.winner === "under")
                      ) {
                        legResult = "won";
                      } else {
                        legResult = "lost";
                      }
                    }

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
              </CardContent>
            </Card>
          );
        })}
      </div>

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
