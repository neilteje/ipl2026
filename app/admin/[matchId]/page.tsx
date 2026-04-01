"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BetLine, Parlay } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  Loader2,
  TrendingUp,
  TrendingDown,
  Save,
  Trophy,
} from "lucide-react";

interface ResultEntry {
  betId: string;
  actualValue: string;
}

export default function AdminPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const { toast } = useToast();

  const [adminSecret, setAdminSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [bets, setBets] = useState<BetLine[]>([]);
  const [parlays, setParlays] = useState<Parlay[]>([]);
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret.trim()) return;

    setLoading(true);
    try {
      const [betsRes, parlaysRes] = await Promise.all([
        fetch(`/api/bets/${matchId}`),
        fetch(`/api/parlay?matchId=${matchId}`),
      ]);
      const betsData = await betsRes.json();
      const parlaysData = await parlaysRes.json();

      setBets(betsData.bets || []);
      setParlays(parlaysData.parlays || []);
      setAuthenticated(true);
    } catch {
      toast({ title: "Error loading data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResults = async () => {
    const resolvedResults = Object.entries(results)
      .filter(([, val]) => val !== "" && !isNaN(Number(val)))
      .map(([betId, actualValue]) => ({ betId, actualValue: Number(actualValue) }));

    if (resolvedResults.length === 0) {
      toast({ title: "No results entered", description: "Enter actual values for at least one bet" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, adminSecret, results: resolvedResults }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }

      const data = await res.json();
      toast({
        title: "Results resolved!",
        description: `${data.resolvedBets} bets resolved. Parlays updated.`,
      });

      // Refresh data
      const [betsRes, parlaysRes] = await Promise.all([
        fetch(`/api/bets/${matchId}`),
        fetch(`/api/parlay?matchId=${matchId}`),
      ]);
      setBets((await betsRes.json()).bets || []);
      setParlays((await parlaysRes.json()).parlays || []);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to resolve",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const categoryGroups = bets.reduce(
    (acc, bet) => {
      if (!acc[bet.category]) acc[bet.category] = [];
      acc[bet.category].push(bet);
      return acc;
    },
    {} as Record<string, BetLine[]>
  );

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the admin secret to resolve bets for this match.
            </p>
            <form onSubmit={handleAuth} className="space-y-3">
              <div>
                <Label htmlFor="secret" className="text-xs">Admin Secret</Label>
                <Input
                  id="secret"
                  type="password"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="Enter secret..."
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                Unlock
              </Button>
            </form>
            <div className="mt-4 pt-4 border-t border-border/50">
              <Link href={`/match/${matchId}`}>
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Back to match
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/match/${matchId}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-sm">Resolve Bets</h1>
              <p className="text-[11px] text-muted-foreground">Enter actual match values</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleSubmitResults}
            disabled={submitting}
            className="gap-1.5"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Results
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Parlay summary */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              {parlays.length} Parlay{parlays.length !== 1 ? "s" : ""} Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {parlays.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2 py-1">
                  <span className="text-sm font-medium">{p.userName}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    {p.legs.length}L • {formatCurrency(p.potentialPayout)}
                  </Badge>
                  {p.status === "won" && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                  {p.status === "lost" && <span className="text-xs text-red-400">✗</span>}
                  {p.status === "pending" && <span className="text-xs text-muted-foreground">⏳</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bet resolution form */}
        <div className="space-y-6">
          {Object.entries(categoryGroups).map(([category, catBets]) => (
            <div key={category}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {category}
              </h2>
              <div className="space-y-2">
                {catBets.map((bet) => {
                  const result = results[bet.id];
                  const actual = result !== undefined && result !== "" ? Number(result) : null;

                  let preview: "over" | "under" | "push" | null = null;
                  if (actual !== null && !isNaN(actual)) {
                    if (Math.abs(actual - bet.line) < 0.01) preview = "push";
                    else if (actual > bet.line) preview = "over";
                    else preview = "under";
                  }

                  const isResolved = !!bet.result;

                  return (
                    <div
                      key={bet.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border border-border/50 bg-card/60 p-3",
                        isResolved && "border-green-500/20 bg-green-500/5"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{bet.shortDesc}</p>
                        <p className="text-xs text-muted-foreground">
                          Line: <span className="font-mono text-foreground">{bet.line}</span> {bet.unit}
                          {isResolved && (
                            <span className="ml-2 text-green-400">
                              ✓ Actual: {bet.result!.actualValue} ({bet.result!.winner.toUpperCase()})
                            </span>
                          )}
                        </p>
                      </div>

                      {!isResolved ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-28">
                            <Input
                              type="number"
                              step="0.5"
                              placeholder={`Actual ${bet.unit}`}
                              value={results[bet.id] || ""}
                              onChange={(e) =>
                                setResults((prev) => ({ ...prev, [bet.id]: e.target.value }))
                              }
                              className="h-8 text-sm text-center font-mono"
                            />
                          </div>
                          {preview && (
                            <Badge
                              className={cn(
                                "text-[10px] shrink-0",
                                preview === "over" && "bg-green-500/10 text-green-400 border-green-500/20",
                                preview === "under" && "bg-red-500/10 text-red-400 border-red-500/20",
                                preview === "push" && "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              )}
                              variant="outline"
                            >
                              {preview === "over" ? <TrendingUp className="w-3 h-3 mr-0.5" /> : preview === "under" ? <TrendingDown className="w-3 h-3 mr-0.5" /> : null}
                              {preview.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 shrink-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-border/50">
          <Button
            size="lg"
            onClick={handleSubmitResults}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save All Results & Resolve Parlays
          </Button>
        </div>
      </div>
    </div>
  );
}
