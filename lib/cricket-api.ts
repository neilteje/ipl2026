import { IPLMatch, TeamInfo } from "@/types";

const CRICAPI_BASE = "https://api.cricapi.com/v1";
const API_KEY = process.env.CRICAPI_KEY?.trim();
const IPL_SEASON_YEAR =
  process.env.IPL_SEASON_YEAR?.trim() || new Date().getUTCFullYear().toString();

interface SeriesSearchRow {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  matches?: number;
  squads?: number;
  t20?: number;
}

type CricApiMatch = IPLMatch & {
  series_id?: string;
};

const TEAM_ALIASES: Record<string, string> = {
  "Royal Challengers Bangalore": "Royal Challengers Bengaluru",
  RCB: "Royal Challengers Bengaluru",
};

const TEAM_SHORT_NAMES: Record<string, string> = {
  "Chennai Super Kings": "CSK",
  "Mumbai Indians": "MI",
  "Royal Challengers Bengaluru": "RCB",
  "Royal Challengers Bangalore": "RCB",
  "Kolkata Knight Riders": "KKR",
  "Delhi Capitals": "DC",
  "Sunrisers Hyderabad": "SRH",
  "Punjab Kings": "PBKS",
  "Rajasthan Royals": "RR",
  "Gujarat Titans": "GT",
  "Lucknow Super Giants": "LSG",
};

function getConfiguredSeriesId(): string {
  return (process.env.IPL_SERIES_ID || process.env.CRICAPI_IPL_SERIES_ID || "").trim();
}

function normalizeTeamName(name?: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  return TEAM_ALIASES[trimmed] || trimmed;
}

function getShortName(name: string): string {
  return TEAM_SHORT_NAMES[name] || name.slice(0, 3).toUpperCase();
}

function normalizeTeamInfo(teamInfo: TeamInfo[] | undefined, teams: string[]): TeamInfo[] {
  if (teamInfo?.length) {
    return teamInfo.map((team) => {
      const name = normalizeTeamName(team.name);
      return {
        ...team,
        name,
        shortname: getShortName(name),
      };
    });
  }

  return teams.map((name) => ({
    name,
    shortname: getShortName(name),
  }));
}

function normalizeMatch(match: CricApiMatch): IPLMatch {
  const teams = (match.teams || []).map(normalizeTeamName);

  return {
    id: match.id,
    name: match.name || `${teams[0] || "Team 1"} vs ${teams[1] || "Team 2"}`,
    matchType: (match.matchType || "T20").toUpperCase(),
    status: match.status || "",
    venue: match.venue || "",
    date: match.date || match.dateTimeGMT || "",
    dateTimeGMT: match.dateTimeGMT || match.date || "",
    teams,
    teamInfo: normalizeTeamInfo(match.teamInfo, teams),
    score: match.score,
    tossWinner: match.tossWinner ? normalizeTeamName(match.tossWinner) : undefined,
    tossChoice: match.tossChoice,
    matchWinner: match.matchWinner ? normalizeTeamName(match.matchWinner) : undefined,
    seriesId: match.seriesId || match.series_id,
    fantasyEnabled: match.fantasyEnabled,
    bbbEnabled: match.bbbEnabled,
    hasSquad: match.hasSquad,
    matchStarted: match.matchStarted,
    matchEnded: match.matchEnded,
  };
}

function isIplSeries(row: SeriesSearchRow): boolean {
  return (row.name || "").toLowerCase().includes("indian premier league");
}

function scoreSeriesCandidate(row: SeriesSearchRow): number {
  const lowerName = (row.name || "").toLowerCase();
  let score = 0;

  if (isIplSeries(row)) score += 10_000;
  if (lowerName.includes(IPL_SEASON_YEAR)) score += 5_000;
  score += (row.matches || 0) * 20;
  score += (row.squads || 0) * 5;
  score += (row.t20 || 0) * 2;

  const startDate = `${row.startDate || ""} ${row.endDate || ""}`.toLowerCase();
  if (startDate.includes(IPL_SEASON_YEAR)) score += 100;

  return score;
}

function sortMatches(matches: IPLMatch[]): IPLMatch[] {
  return [...matches].sort((a, b) => {
    const dateA = new Date(a.dateTimeGMT || a.date).getTime();
    const dateB = new Date(b.dateTimeGMT || b.date).getTime();
    return dateA - dateB;
  });
}

function dedupeMatches(matches: IPLMatch[]): IPLMatch[] {
  const byId = new Map<string, IPLMatch>();
  for (const match of matches) {
    byId.set(match.id, match);
  }
  return Array.from(byId.values());
}

async function searchSeriesCandidates(query: string): Promise<SeriesSearchRow[]> {
  if (!API_KEY) return [];

  const res = await fetch(
    `${CRICAPI_BASE}/series?apikey=${API_KEY}&search=${encodeURIComponent(query)}`,
    { next: { revalidate: 3600 * 6 } }
  );

  if (!res.ok) return [];

  const data = await res.json();
  if (data.status !== "success" || !Array.isArray(data.data)) return [];

  return (data.data as SeriesSearchRow[])
    .filter(isIplSeries)
    .sort((a, b) => scoreSeriesCandidate(b) - scoreSeriesCandidate(a));
}

async function fetchSeriesMatches(seriesId: string): Promise<IPLMatch[]> {
  if (!API_KEY || !seriesId) return [];

  const res = await fetch(`${CRICAPI_BASE}/series_info?apikey=${API_KEY}&id=${seriesId}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const data = await res.json();
  if (data.status !== "success" || !Array.isArray(data.data?.matchList)) return [];

  return sortMatches((data.data.matchList as CricApiMatch[]).map(normalizeMatch));
}

async function resolveSeriesMatches(): Promise<IPLMatch[]> {
  const configuredSeriesId = getConfiguredSeriesId();
  if (configuredSeriesId) {
    const configuredMatches = await fetchSeriesMatches(configuredSeriesId);
    if (configuredMatches.length > 0) return configuredMatches;
  }

  const seenSeries = new Set<string>(configuredSeriesId ? [configuredSeriesId] : []);
  const queries = [`Indian Premier League ${IPL_SEASON_YEAR}`, "Indian Premier League"];

  for (const query of queries) {
    const candidates = await searchSeriesCandidates(query);

    for (const candidate of candidates) {
      if (seenSeries.has(candidate.id)) continue;
      seenSeries.add(candidate.id);

      const matches = await fetchSeriesMatches(candidate.id);
      if (matches.length > 0) return matches;
    }
  }

  return [];
}

function isIPLTeam(name?: string): boolean {
  return !!TEAM_SHORT_NAMES[normalizeTeamName(name)];
}

async function getCurrentIPLMatches(): Promise<IPLMatch[]> {
  if (!API_KEY) return [];

  const res = await fetch(`${CRICAPI_BASE}/currentMatches?apikey=${API_KEY}&offset=0`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];

  const data = await res.json();
  if (data.status !== "success" || !Array.isArray(data.data)) return [];

  return sortMatches(
    (data.data as CricApiMatch[])
      .filter((match) => {
        const lowerName = (match.name || "").toLowerCase();
        return (
          (match.matchType || "").toLowerCase() === "t20" &&
          (lowerName.includes("indian premier league") ||
            lowerName.includes("ipl") ||
            isIPLTeam(match.teams?.[0]) ||
            isIPLTeam(match.teams?.[1]))
        );
      })
      .map(normalizeMatch)
  );
}

export async function getIPLMatches(): Promise<IPLMatch[]> {
  if (!API_KEY) {
    console.warn("CRICAPI_KEY not set; returning no IPL fixtures");
    return [];
  }

  try {
    const [seriesMatches, liveMatches] = await Promise.all([
      resolveSeriesMatches(),
      getCurrentIPLMatches(),
    ]);

    if (seriesMatches.length === 0) {
      return liveMatches;
    }

    const liveById = new Map(liveMatches.map((match) => [match.id, match]));
    const merged = seriesMatches.map((match) => liveById.get(match.id) || match);

    return sortMatches(dedupeMatches([...merged, ...liveMatches]));
  } catch (err) {
    console.error("Failed to fetch IPL matches from CricAPI:", err);
    return [];
  }
}

export async function getMatchById(matchId: string): Promise<IPLMatch | null> {
  if (!API_KEY) {
    console.warn(`CRICAPI_KEY not set; unable to fetch match ${matchId}`);
    return null;
  }

  try {
    const res = await fetch(`${CRICAPI_BASE}/match_info?apikey=${API_KEY}&id=${matchId}`, {
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === "success" && data.data) {
        return normalizeMatch(data.data as CricApiMatch);
      }
    }
  } catch (err) {
    console.warn(`match_info lookup failed for ${matchId}:`, err);
  }

  const matches = await getIPLMatches();
  return matches.find((match) => match.id === matchId) || null;
}
