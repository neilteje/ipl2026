"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BetLine, Parlay, ParlayLeg, BetDirection, BetCategory } from "@/types";
import { BetCard } from "@/components/BetCard";
import { ParlayPanel } from "@/components/ParlayPanel";
import { Leaderboard } from "@/components/Leaderboard";
import { ChatPanel } from "@/components/ChatPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/lib/user-context";
import {
  cn,
  getParlayMultiplier,
  formatCurrency,
  getTeamShortName,
  getTeamColor,
} from "@/lib/utils";
import {
  ArrowLeft,
  Sparkles,
  Users,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  MessageCircle,
  Settings,
} from "lucide-react";

const CATEGORIES: BetCategory[] = ["Match", "Innings", "Batting", "Bowling", "Opening", "Extras"];

export default function MatchPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const { toast } = useToast();
  const { userName } = useUser();

  const [bets, setBets] = useState<BetLine[]>([]);
  const [parlays, setParlays] = useState<Parlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([]);
  const [showParlay, setShowParlay] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("bets");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [matchName, setMatchName] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      const [betsRes, parlaysRes, matchesRes] = await Promise.all([
        fetch(`/api/bets/${matchId}`),
        fetch(`/api/parlay?matchId=${matchId}`),
        fetch(`/api/matches`),
      ]);

      const betsData = await betsRes.json();
      const parlaysData = await parlaysRes.json();
      const matchesData = await matchesRes.json();

      if (betsData.bets) setBets(betsData.bets);
      if (parlaysData.parlays) setParlays(parlaysData.parlays);

      const match = matchesData.matches?.find((m: { id: string; name: string }) => m.id === matchId);
      if (match) setMatchName(match.name);
    } catch {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [matchId, toast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetch(`/api/parlay?matchId=${matchId}`)
        .then((r) => r.json())
        .then((data) => { if (data.parlays) setParlays(data.parlays); })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [matchId, fetchData]);

  const handleSelectLeg = (betId: string, direction: BetDirection, odds: number) => {
    setParlayLegs((prev) => {
      const exists = prev.find((l) => l.betId === betId);
      if (exists) return prev.map((l) => l.betId === betId ? { ...l, direction, odds } : l);
      return [...prev, { betId, direction, odds }];
    });
    setShowParlay(true);
  };

  const handleDeselectLeg = (betId: string) => {
    setParlayLegs((prev) => prev.filter((l) => l.betId !== betId));
  };

  const handleSubmitParlay = async (name: string, betAmount: number) => {
    const res = await fetch("/api/parlay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, userName: name, betAmount, legs: parlayLegs }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to submit");
    }

    const data = await res.json();
    setParlays((prev) => [data.parlay, ...prev]);
    setParlayLegs([]);
    setShowParlay(false);
    setActiveTab("parlays");

    toast({
      title: "Parlay locked in!",
      description: `${parlayLegs.length}-leg parlay · Potential: ${formatCurrency(data.parlay.potentialPayout)}`,
    });
  };

  const handleDeleteParlay = async (parlayId: string) => {
    if (!userName) return;

    const res = await fetch(`/api/parlay/${parlayId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Can't delete", description: err.error, variant: "destructive" });
      return;
    }

    setParlays((prev) => prev.filter((p) => p.id !== parlayId));
    toast({ title: "Parlay removed" });
  };

  // Derive teams from match name
  const teams = matchName.split(" vs ");
  const t1 = teams[0] || "Team 1";
  const t2 = teams[1] || "Team 2";
  const t1Short = getTeamShortName(t1);
  const t2Short = getTeamShortName(t2);

  const filteredBets =
    activeCategory === "All" ? bets : bets.filter((b) => b.category === activeCategory);

  const categoryCounts = CATEGORIES.reduce(
    (acc, cat) => ({ ...acc, [cat]: bets.filter((b) => b.category === cat).length }),
    {} as Record<string, number>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="surface-header sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <img 
              src="/ipl-logo.png" 
              alt="IPL" 
              className="h-8 w-auto object-contain hidden sm:block"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {!loading && matchName && (
              <div className="flex items-center gap-2 min-w-0">
                <TeamPill shortName={t1Short} />
                <span className="text-xs text-muted-foreground">vs</span>
                <TeamPill shortName={t2Short} />
                <span className="hidden sm:block text-sm font-medium truncate max-w-[200px]">
                  {matchName}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {userName && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground rounded-full border border-white/[0.07] bg-card/80 px-2.5 py-1 shadow-raised-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.55)]" />
                {userName}
              </span>
            )}
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={fetchData}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
            <Link href={`/admin/${matchId}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </Link>
            {parlayLegs.length > 0 && (
              <Button
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => setShowParlay((v) => !v)}
              >
                <ShoppingCart className="w-3 h-3" />
                {parlayLegs.length} leg{parlayLegs.length > 1 ? "s" : ""}
                {" · "}
                {getParlayMultiplier(parlayLegs.length)}x
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6 relative">
          {/* Main content */}
          <div className="flex-1 min-w-0 lg:pr-[324px]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <TabsList>
                  <TabsTrigger value="bets" className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Bet Lines
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-0.5">
                      {bets.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="parlays" className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Parlays
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-0.5">
                      {parlays.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Chat
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ── BET LINES ── */}
              <TabsContent value="bets">
                <div className="flex gap-1.5 mb-4 flex-wrap">
                  <CategoryPill
                    label={`All (${bets.length})`}
                    active={activeCategory === "All"}
                    onClick={() => setActiveCategory("All")}
                  />
                  {CATEGORIES.filter((c) => categoryCounts[c] > 0).map((cat) => (
                    <CategoryPill
                      key={cat}
                      label={`${cat} (${categoryCounts[cat]})`}
                      active={activeCategory === cat}
                      onClick={() => setActiveCategory(cat)}
                    />
                  ))}
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-36 rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredBets.map((bet) => (
                      <BetCard
                        key={bet.id}
                        bet={bet}
                        selectedLeg={parlayLegs.find((l) => l.betId === bet.id)}
                        onSelect={handleSelectLeg}
                        onDeselect={handleDeselectLeg}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── PARLAYS ── */}
              <TabsContent value="parlays">
                <Leaderboard
                  parlays={parlays}
                  bets={bets}
                  currentUser={userName}
                  onDeleteParlay={handleDeleteParlay}
                />
              </TabsContent>

              {/* ── CHAT ── */}
              <TabsContent value="chat">
                <div className="surface-raised p-4 h-[60vh] flex flex-col overflow-hidden">
                  <ChatPanel matchId={matchId} />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop sidebar: Parlay + Chat - FIXED POSITION */}
          <div className="hidden lg:flex flex-col gap-4 w-[300px] fixed right-4 top-20 bottom-4 max-w-[300px]">
            {/* Parlay builder */}
            <div className="surface-raised p-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" strokeWidth={2.25} />
                  Your parlay
                </h3>
                {parlayLegs.length > 0 && (
                  <Badge className="border-primary/35 text-primary bg-card text-xs shadow-raised-sm">
                    {parlayLegs.length} leg{parlayLegs.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <Separator className="mb-3" />
              <ParlayPanel
                legs={parlayLegs}
                bets={bets}
                matchId={matchId}
                currentUser={userName}
                onRemoveLeg={handleDeselectLeg}
                onClearAll={() => setParlayLegs([])}
                onSubmit={handleSubmitParlay}
              />
            </div>

            {/* Global Chat sidebar - FIXED, SCROLLABLE */}
            <div className="surface-raised p-4 flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-3">
                <MessageCircle className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Global chat</h3>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.55)] ml-auto" />
              </div>
              <Separator className="mb-3" />
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <ChatPanel matchId="global" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile parlay drawer */}
      {parlayLegs.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
          <div className="border-t border-white/[0.07] bg-card/98 backdrop-blur-md shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.5)]">
            <button
              className="w-full flex items-center justify-between px-4 py-3"
              onClick={() => setShowParlay((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" strokeWidth={2.25} />
                <span className="font-semibold text-sm">
                  Parlay · {parlayLegs.length} leg{parlayLegs.length > 1 ? "s" : ""}
                </span>
                <Badge className="border-primary/35 text-primary bg-card text-[10px] shadow-raised-sm">
                  {getParlayMultiplier(parlayLegs.length)}x
                </Badge>
              </div>
              {showParlay ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {showParlay && (
              <div className="px-4 pb-6 max-h-[60vh] overflow-y-auto">
                <ParlayPanel
                  legs={parlayLegs}
                  bets={bets}
                  matchId={matchId}
                  currentUser={userName}
                  onRemoveLeg={handleDeselectLeg}
                  onClearAll={() => { setParlayLegs([]); setShowParlay(false); }}
                  onSubmit={handleSubmitParlay}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground border-primary/40 shadow-raised-sm"
          : "border-white/[0.08] bg-secondary/40 text-muted-foreground hover:border-primary/25 hover:text-foreground shadow-raised-sm"
      )}
    >
      {label}
    </button>
  );
}

function TeamPill({ shortName }: { shortName: string }) {
  const color = getTeamColor(shortName);
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[11px] font-bold"
      style={{ borderColor: color + "60", color, backgroundColor: color + "20" }}
    >
      {shortName}
    </span>
  );
}
