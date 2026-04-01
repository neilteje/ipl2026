"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IPLMatch } from "@/types";
import { useUser } from "@/lib/user-context";
import {
  formatDate,
  getTeamShortName,
  getTeamColor,
  cn,
  isMatchCompleted,
  isBettingOpen,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  MapPin,
  ChevronRight,
  Trophy,
  Activity,
  BarChart3,
  LogOut,
  Sparkles,
  DollarSign,
} from "lucide-react";

export default function HomePage() {
  const { userName, setUserName } = useUser();
  const [matches, setMatches] = useState<IPLMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data) => {
        const allMatches = data.matches || [];
        // Sort by date (earliest first)
        allMatches.sort((a: IPLMatch, b: IPLMatch) => {
          const dateA = new Date(a.dateTimeGMT || a.date).getTime();
          const dateB = new Date(b.dateTimeGMT || b.date).getTime();
          return dateA - dateB;
        });
        setMatches(allMatches);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load matches. Please try again.");
        setLoading(false);
      });
  }, []);

  const upcomingMatches = matches.filter((m) => !isMatchCompleted(m));
  const completedMatches = matches.filter((m) => isMatchCompleted(m));

  return (
    <div className="min-h-screen">
      <header className="surface-header sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/ipl-logo.png" 
              alt="IPL" 
              className="h-10 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="hidden w-9 h-9 rounded-xl border border-white/[0.08] bg-card shadow-raised-sm items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" strokeWidth={2.25} />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight tracking-tight">IPL Parlay</h1>
              <p className="text-[10px] text-muted-foreground tracking-wide">
                Friends league · 2026 season
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/settlements">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Settle</span>
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Board</span>
              </Button>
            </Link>

            {userName && (
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground rounded-full border border-white/[0.07] bg-card/80 px-2.5 py-1 shadow-raised-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                  {userName}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Change name"
                  onClick={() => {
                    if (confirm(`Change name from "${userName}"? You'll need to re-enter.`)) {
                      localStorage.removeItem("ipl_username");
                      setUserName("");
                      window.location.reload();
                    }
                  }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            <Badge
              variant="outline"
              className="text-[10px] border-primary/35 text-primary bg-card/60 shadow-raised-sm"
            >
              <Activity className="w-3 h-3 mr-1 text-emerald-500" />
              Live · &apos;26
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-5 shadow-raised-sm">
            <Trophy className="w-3.5 h-3.5 text-ipl-orange" strokeWidth={2.25} />
            IPL 2026 · Mar 28 – May 31
          </div>
          {userName && (
            <p className="text-muted-foreground text-sm mb-2">
              Welcome back,{" "}
              <span className="text-foreground font-semibold">{userName}</span>
            </p>
          )}
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-balance">
            Who&apos;s calling the shots this match?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            Pick a fixture, stack over/under legs, and compare payouts with your crew. More
            legs — bigger multipliers.
          </p>

          <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
            {[
              { legs: 2, mult: "3.6x" },
              { legs: 3, mult: "6.9x" },
              { legs: 4, mult: "13.0x" },
              { legs: 5, mult: "24.8x" },
            ].map(({ legs, mult }) => (
              <div
                key={legs}
                className="surface-inset flex flex-col items-center px-3 py-2.5 min-w-[72px] border-white/[0.05]"
              >
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {legs} legs
                </span>
                <span className="text-lg font-bold text-primary tabular-nums">{mult}</span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link href="/leaderboard">
              <Button variant="outline" className="gap-2 text-sm">
                <BarChart3 className="w-4 h-4" />
                Season leaderboard
              </Button>
            </Link>
          </div>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl border border-white/[0.04]" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-10">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {upcomingMatches.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.14em]">
                    Upcoming
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {upcomingMatches.map((match) => (
                    <MatchRow key={match.id} match={match} />
                  ))}
                </div>
              </section>
            )}

            {completedMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/70" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.14em]">
                    Completed
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {completedMatches.map((match) => (
                    <MatchRow key={match.id} match={match} completed />
                  ))}
                </div>
              </section>
            )}

            {matches.length === 0 && (
              <div className="surface-raised text-center py-16 px-4 max-w-md mx-auto">
                <p className="text-muted-foreground">No matches loaded.</p>
                <p className="text-xs text-muted-foreground/80 mt-2 leading-relaxed">
                  Add <code className="text-primary/90">CRICAPI_KEY</code> for local or Vercel,
                  and optionally pin <code className="text-primary/90">IPL_SERIES_ID</code> to the
                  live IPL season. The app no longer invents fixtures when the live feed is
                  missing.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function MatchRow({ match, completed }: { match: IPLMatch; completed?: boolean }) {
  const t1 = match.teams?.[0] || "Team 1";
  const t2 = match.teams?.[1] || "Team 2";
  const t1Short = getTeamShortName(t1);
  const t2Short = getTeamShortName(t2);
  const bettingOpen = isBettingOpen(match);

  return (
    <Link href={`/match/${match.id}`}>
      <div
        className={cn(
          "group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-card/90 p-4 shadow-raised-sm",
          "hover:border-primary/35 hover:shadow-raised transition-all duration-200 cursor-pointer",
          completed && "opacity-75"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <TeamBadge shortName={t1Short} />
            <span className="text-[11px] text-muted-foreground font-medium">vs</span>
            <TeamBadge shortName={t2Short} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">
                {t1Short}{" "}
                <span className="text-muted-foreground font-normal">vs</span> {t2Short}
              </span>
              {!completed && (
                bettingOpen ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-primary/40 text-primary bg-card"
                  >
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                    Bet
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Locked
                  </Badge>
                )
              )}
              {completed && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Final
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {formatDate(match.dateTimeGMT || match.date)}
              </span>
              {match.venue && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-[200px]">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{match.venue.split(",")[0]}</span>
                </span>
              )}
            </div>
            {match.score && match.score.length > 0 && (
              <div className="flex gap-3 mt-1">
                {match.score.map((s, i) => (
                  <span key={i} className="text-[11px] font-medium text-foreground/85">
                    {s.inning?.split(" ").slice(-2).join(" ")}: {s.r}/{s.w} ({s.o} ov)
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </Link>
  );
}

function TeamBadge({ shortName }: { shortName: string }) {
  const color = getTeamColor(shortName);
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-white/[0.08] shrink-0 shadow-raised-sm ring-1 ring-black/40"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 22%, hsl(220 14% 12%))`,
        borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
        color,
      }}
    >
      {shortName.slice(0, 3)}
    </div>
  );
}
