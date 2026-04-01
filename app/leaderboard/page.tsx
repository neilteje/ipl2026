"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayerStats } from "@/lib/db";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Crown,
  Flame,
  Target,
  DollarSign,
} from "lucide-react";

const AVATAR_COLORS = [
  "bg-purple-500", "bg-blue-500", "bg-green-500", "bg-orange-500",
  "bg-pink-500", "bg-yellow-500", "bg-red-500", "bg-cyan-500",
];

function nameToColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function NetBadge({ net }: { net: number }) {
  if (net > 0) {
    return (
      <span className="flex items-center gap-1 text-green-400 font-bold text-sm">
        <TrendingUp className="w-3.5 h-3.5" />
        +{formatCurrency(net)}
      </span>
    );
  }
  if (net < 0) {
    return (
      <span className="flex items-center gap-1 text-red-400 font-bold text-sm">
        <TrendingDown className="w-3.5 h-3.5" />
        {formatCurrency(net)}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-muted-foreground font-bold text-sm">
      <Minus className="w-3.5 h-3.5" />
      {formatCurrency(0)}
    </span>
  );
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 0) return <Crown className="w-4 h-4 text-yellow-400" />;
  if (rank === 1) return <Crown className="w-4 h-4 text-slate-400" />;
  if (rank === 2) return <Crown className="w-4 h-4 text-amber-600" />;
  return (
    <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-muted-foreground">
      {rank + 1}
    </span>
  );
}

export default function LeaderboardPage() {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setStats(data.stats || []);
      setLastUpdated(new Date());
    } catch {
      console.error("Failed to fetch leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalPool = stats.reduce((s, p) => s + p.totalBet, 0);
  const topPlayer = stats[0];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="surface-header sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-ipl-orange" />
              <h1 className="font-bold text-sm">IPL 2026 leaderboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settlements">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <DollarSign className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Settle</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setLoading(true); fetchStats(); }}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Summary bar */}
        {!loading && stats.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <SummaryCard
              icon={<Target className="w-4 h-4 text-primary" />}
              label="Total Pool"
              value={formatCurrency(totalPool)}
            />
            <SummaryCard
              icon={<Flame className="w-4 h-4 text-orange-400" />}
              label="Players"
              value={stats.length.toString()}
            />
            <SummaryCard
              icon={<Trophy className="w-4 h-4 text-yellow-400" />}
              label="Leader"
              value={topPlayer?.userName || "—"}
              highlight
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && stats.length === 0 && (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground">No parlays submitted yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Head to a match and lock in your picks!
            </p>
            <Link href="/" className="mt-4 inline-block">
              <Button size="sm" className="mt-4">Browse Matches</Button>
            </Link>
          </div>
        )}

        {/* Leaderboard rows */}
        {!loading && stats.length > 0 && (
          <div className="space-y-2">
            {stats.map((player, rank) => (
              <PlayerRow key={player.userName} player={player} rank={rank} />
            ))}
          </div>
        )}

        {lastUpdated && (
          <p className="text-center text-xs text-muted-foreground/50 mt-6">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "surface-raised p-4",
        highlight && "border-amber-500/40 bg-card ring-1 ring-amber-500/15"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-bold text-base truncate">{value}</p>
    </div>
  );
}

function PlayerRow({ player, rank }: { player: PlayerStats; rank: number }) {
  const winRate =
    player.wins + player.losses > 0
      ? Math.round((player.wins / (player.wins + player.losses)) * 100)
      : null;

  return (
    <div
      className={cn(
        "surface-raised p-4 transition-all",
        rank === 0 && player.net > 0 && "border-amber-500/35 ring-1 ring-amber-500/12",
        player.net < 0 && "opacity-85"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Rank */}
        <div className="w-5 shrink-0 flex justify-center">
          <RankIcon rank={rank} />
        </div>

        {/* Avatar */}
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0",
            nameToColor(player.userName)
          )}
        >
          {player.userName[0]?.toUpperCase()}
        </div>

        {/* Name + record */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{player.userName}</span>
            {winRate !== null && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0",
                  winRate >= 60
                    ? "text-green-400 border-green-500/30"
                    : winRate >= 40
                    ? "text-yellow-400 border-yellow-500/30"
                    : "text-red-400 border-red-500/30"
                )}
              >
                {winRate}% WR
              </Badge>
            )}
            {player.pending > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                {player.pending} pending
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
            <span>{player.parlayCount} parlays</span>
            <span className="text-green-400/80">{player.wins}W</span>
            <span className="text-red-400/80">{player.losses}L</span>
            {player.pushes > 0 && <span className="text-yellow-400/80">{player.pushes}P</span>}
            <span>Bet: {formatCurrency(player.totalBet)}</span>
          </div>
        </div>

        {/* Net P&L */}
        <div className="text-right shrink-0">
          <NetBadge net={player.net} />
          <p className="text-[10px] text-muted-foreground mt-0.5">
            out: {formatCurrency(player.totalPayout)}
          </p>
        </div>
      </div>
    </div>
  );
}
