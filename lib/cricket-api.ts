import { IPLMatch } from "@/types";

const CRICAPI_BASE = "https://api.cricapi.com/v1";

/** Default key for this app; override anytime with `CRICAPI_KEY` in env (recommended if the repo is public). */
const CRICAPI_KEY_DEFAULT = "e00bd3cb-0080-4097-b0ef-2eec8f79448d";

const API_KEY = (process.env.CRICAPI_KEY?.trim() || CRICAPI_KEY_DEFAULT) || undefined;

/** Optional: paste from CricAPI dashboard / series search when IPL 2026 is listed */
function getConfiguredSeriesId(): string {
  return (process.env.IPL_SERIES_ID || process.env.CRICAPI_IPL_SERIES_ID || "").trim();
}

function pickIplSeriesFromSearch(
  rows: Array<{ id: string; name: string }> | undefined
): string {
  if (!rows?.length) return "";
  const lower = (s: string) => s.toLowerCase();
  const ipl = rows.filter((s) => lower(s.name || "").includes("indian premier league"));
  if (!ipl.length) return "";
  const y2026 = ipl.find(
    (s) => s.name?.includes("2026") || lower(s.name).includes("ipl 2026")
  );
  if (y2026) return y2026.id;
  return ipl[0].id;
}

async function searchSeriesId(query: string): Promise<string> {
  if (!API_KEY) return "";
  const res = await fetch(`${CRICAPI_BASE}/series?apikey=${API_KEY}&search=${encodeURIComponent(query)}`, {
    next: { revalidate: 3600 * 6 },
  });
  if (!res.ok) return "";
  const searchData = await res.json();
  if (searchData.status !== "success" || !searchData.data?.length) return "";
  return pickIplSeriesFromSearch(searchData.data as Array<{ id: string; name: string }>);
}

/** When API key is set but CricAPI returns no IPL fixtures, use the built-in preview schedule */
function fallbackSchedule(reason: string): IPLMatch[] {
  console.warn(`CricAPI: ${reason} — using built-in IPL schedule preview`);
  return getMockMatches();
}

export async function getIPLMatches(): Promise<IPLMatch[]> {
  if (!API_KEY) {
    console.warn("CRICAPI_KEY not set, using mock data");
    return getMockMatches();
  }

  try {
    let seriesId = getConfiguredSeriesId();

    if (!seriesId) {
      seriesId = await searchSeriesId("Indian Premier League 2026");
    }
    if (!seriesId) {
      seriesId = await searchSeriesId("Indian Premier League");
    }

    if (!seriesId) {
      const live = await getCurrentIPLMatches();
      if (live.length > 0) return live;
      return fallbackSchedule("no series id found and no live IPL in currentMatches");
    }

    const seriesRes = await fetch(
      `${CRICAPI_BASE}/series_info?apikey=${API_KEY}&id=${seriesId}`,
      { next: { revalidate: 3600 } }
    );

    if (!seriesRes.ok) throw new Error(`Series fetch failed: ${seriesRes.status}`);

    const seriesData = await seriesRes.json();
    if (seriesData.status !== "success") throw new Error("Series API error");

    const seriesMatches: IPLMatch[] = seriesData.data?.matchList || [];

    if (seriesMatches.length === 0) {
      const live = await getCurrentIPLMatches();
      if (live.length > 0) return live;
      return fallbackSchedule("series_info returned no matches");
    }

    const liveMatches = await getCurrentIPLMatches();
    const liveMap = new Map(liveMatches.map((m) => [m.id, m]));

    return seriesMatches.map((m) => liveMap.get(m.id) || m);
  } catch (err) {
    console.error("CricAPI fetch error:", err);
    try {
      const live = await getCurrentIPLMatches();
      if (live.length > 0) return live;
    } catch {}
    return fallbackSchedule("request failed; using preview schedule");
  }
}

async function getCurrentIPLMatches(): Promise<IPLMatch[]> {
  if (!API_KEY) return [];

  const res = await fetch(`${CRICAPI_BASE}/currentMatches?apikey=${API_KEY}&offset=0`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];

  const data = await res.json();
  if (data.status !== "success") return [];

  return (data.data || []).filter(
    (m: IPLMatch) =>
      m.matchType?.toLowerCase() === "t20" &&
      (m.name?.toLowerCase().includes("ipl") ||
        m.name?.toLowerCase().includes("indian premier league") ||
        isIPLTeam(m.teams?.[0]) ||
        isIPLTeam(m.teams?.[1]))
  );
}

export async function getMatchById(matchId: string): Promise<IPLMatch | null> {
  // Always check mocks first for IPL 2026 matches
  const mockMatch = getMockMatches().find((m) => m.id === matchId);
  if (mockMatch) return mockMatch;

  if (!API_KEY) {
    console.warn(`Match ${matchId} not found in mocks and no CRICAPI_KEY set`);
    return null;
  }

  try {
    const res = await fetch(`${CRICAPI_BASE}/match_info?apikey=${API_KEY}&id=${matchId}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.warn(`CricAPI returned ${res.status} for match ${matchId}`);
      return null;
    }
    const data = await res.json();
    if (data.status !== "success") {
      console.warn(`CricAPI status not success for match ${matchId}`);
      return null;
    }
    return data.data as IPLMatch;
  } catch (err) {
    console.error(`Failed to fetch match ${matchId} from CricAPI:`, err);
    return null;
  }
}

function isIPLTeam(name?: string): boolean {
  if (!name) return false;
  const iplTeams = [
    "Chennai Super Kings",
    "Mumbai Indians",
    "Royal Challengers",
    "Kolkata Knight Riders",
    "Delhi Capitals",
    "Sunrisers Hyderabad",
    "Punjab Kings",
    "Rajasthan Royals",
    "Gujarat Titans",
    "Lucknow Super Giants",
  ];
  return iplTeams.some((t) => name.includes(t) || t.includes(name));
}

// IPL 2026 mock schedule — opening match & first-phase fixtures align with BCCI release (Mar 28 – May 31).
// Replace with live API data when CRICAPI_KEY is set.

export function getMockMatches(): IPLMatch[] {
  return [
    {
      id: "ipl26-1",
      name: "Royal Challengers Bengaluru vs Sunrisers Hyderabad",
      matchType: "T20",
      status: "Match starts at 19:30 IST",
      venue: "M Chinnaswamy Stadium, Bengaluru",
      date: "2026-03-28",
      dateTimeGMT: "2026-03-28T14:00:00",
      teams: ["Royal Challengers Bengaluru", "Sunrisers Hyderabad"],
      teamInfo: [
        { name: "Royal Challengers Bengaluru", shortname: "RCB" },
        { name: "Sunrisers Hyderabad", shortname: "SRH" },
      ],
    },
    {
      id: "ipl26-2",
      name: "Chennai Super Kings vs Mumbai Indians",
      matchType: "T20",
      status: "Match starts at 19:30 IST",
      venue: "MA Chidambaram Stadium, Chennai",
      date: "2026-03-29",
      dateTimeGMT: "2026-03-29T14:00:00",
      teams: ["Chennai Super Kings", "Mumbai Indians"],
      teamInfo: [
        { name: "Chennai Super Kings", shortname: "CSK" },
        { name: "Mumbai Indians", shortname: "MI" },
      ],
    },
    {
      id: "ipl26-3",
      name: "Kolkata Knight Riders vs Delhi Capitals",
      matchType: "T20",
      status: "Match starts at 15:30 IST",
      venue: "Eden Gardens, Kolkata",
      date: "2026-03-30",
      dateTimeGMT: "2026-03-30T10:00:00",
      teams: ["Kolkata Knight Riders", "Delhi Capitals"],
      teamInfo: [
        { name: "Kolkata Knight Riders", shortname: "KKR" },
        { name: "Delhi Capitals", shortname: "DC" },
      ],
    },
    {
      id: "ipl26-4",
      name: "Punjab Kings vs Rajasthan Royals",
      matchType: "T20",
      status: "Match starts at 19:30 IST",
      venue: "Maharaja Yadavindra Singh International Cricket Stadium, Mullanpur",
      date: "2026-03-31",
      dateTimeGMT: "2026-03-31T14:00:00",
      teams: ["Punjab Kings", "Rajasthan Royals"],
      teamInfo: [
        { name: "Punjab Kings", shortname: "PBKS" },
        { name: "Rajasthan Royals", shortname: "RR" },
      ],
    },
    {
      id: "ipl26-5",
      name: "Gujarat Titans vs Lucknow Super Giants",
      matchType: "T20",
      status: "Match starts at 19:30 IST",
      venue: "Narendra Modi Stadium, Ahmedabad",
      date: "2026-04-01",
      dateTimeGMT: "2026-04-01T14:00:00",
      teams: ["Gujarat Titans", "Lucknow Super Giants"],
      teamInfo: [
        { name: "Gujarat Titans", shortname: "GT" },
        { name: "Lucknow Super Giants", shortname: "LSG" },
      ],
    },
    {
      id: "ipl26-6",
      name: "Sunrisers Hyderabad vs Mumbai Indians",
      matchType: "T20",
      status: "Match starts at 19:30 IST",
      venue: "Rajiv Gandhi International Cricket Stadium, Hyderabad",
      date: "2026-04-02",
      dateTimeGMT: "2026-04-02T14:00:00",
      teams: ["Sunrisers Hyderabad", "Mumbai Indians"],
      teamInfo: [
        { name: "Sunrisers Hyderabad", shortname: "SRH" },
        { name: "Mumbai Indians", shortname: "MI" },
      ],
    },
    {
      id: "ipl26-7",
      name: "Royal Challengers Bengaluru vs Chennai Super Kings",
      matchType: "T20",
      status: "Match starts at 19:30 IST",
      venue: "M Chinnaswamy Stadium, Bengaluru",
      date: "2026-04-03",
      dateTimeGMT: "2026-04-03T14:00:00",
      teams: ["Royal Challengers Bengaluru", "Chennai Super Kings"],
      teamInfo: [
        { name: "Royal Challengers Bengaluru", shortname: "RCB" },
        { name: "Chennai Super Kings", shortname: "CSK" },
      ],
    },
    {
      id: "ipl26-8",
      name: "Rajasthan Royals vs Kolkata Knight Riders",
      matchType: "T20",
      status: "Match starts at 19:30 IST",
      venue: "Sawai Mansingh Stadium, Jaipur",
      date: "2026-04-04",
      dateTimeGMT: "2026-04-04T14:00:00",
      teams: ["Rajasthan Royals", "Kolkata Knight Riders"],
      teamInfo: [
        { name: "Rajasthan Royals", shortname: "RR" },
        { name: "Kolkata Knight Riders", shortname: "KKR" },
      ],
    },
    {
      id: "ipl26-9",
      name: "Delhi Capitals vs Gujarat Titans",
      matchType: "T20",
      status: "Match starts at 15:30 IST",
      venue: "Arun Jaitley Stadium, Delhi",
      date: "2026-04-05",
      dateTimeGMT: "2026-04-05T10:00:00",
      teams: ["Delhi Capitals", "Gujarat Titans"],
      teamInfo: [
        { name: "Delhi Capitals", shortname: "DC" },
        { name: "Gujarat Titans", shortname: "GT" },
      ],
    },
    {
      id: "ipl26-10",
      name: "Lucknow Super Giants vs Punjab Kings",
      matchType: "T20",
      status: "Match starts at 19:30 IST",
      venue: "Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow",
      date: "2026-04-05",
      dateTimeGMT: "2026-04-05T14:00:00",
      teams: ["Lucknow Super Giants", "Punjab Kings"],
      teamInfo: [
        { name: "Lucknow Super Giants", shortname: "LSG" },
        { name: "Punjab Kings", shortname: "PBKS" },
      ],
    },
    {
      id: "ipl26-11",
      name: "Mumbai Indians vs Kolkata Knight Riders",
      matchType: "T20",
      status: "Match starts at 19:30 IST",
      venue: "Wankhede Stadium, Mumbai",
      date: "2026-04-06",
      dateTimeGMT: "2026-04-06T14:00:00",
      teams: ["Mumbai Indians", "Kolkata Knight Riders"],
      teamInfo: [
        { name: "Mumbai Indians", shortname: "MI" },
        { name: "Kolkata Knight Riders", shortname: "KKR" },
      ],
    },
    {
      id: "ipl26-12",
      name: "Sunrisers Hyderabad vs Delhi Capitals",
      matchType: "T20",
      status: "Match starts at 19:30 IST",
      venue: "Rajiv Gandhi International Cricket Stadium, Hyderabad",
      date: "2026-04-07",
      dateTimeGMT: "2026-04-07T14:00:00",
      teams: ["Sunrisers Hyderabad", "Delhi Capitals"],
      teamInfo: [
        { name: "Sunrisers Hyderabad", shortname: "SRH" },
        { name: "Delhi Capitals", shortname: "DC" },
      ],
    },
    {
      id: "ipl26-13",
      name: "Chennai Super Kings vs Rajasthan Royals",
      matchType: "T20",
      status: "Match starts at 19:30 IST",
      venue: "MA Chidambaram Stadium, Chennai",
      date: "2026-04-08",
      dateTimeGMT: "2026-04-08T14:00:00",
      teams: ["Chennai Super Kings", "Rajasthan Royals"],
      teamInfo: [
        { name: "Chennai Super Kings", shortname: "CSK" },
        { name: "Rajasthan Royals", shortname: "RR" },
      ],
    },
    {
      id: "ipl26-14",
      name: "Royal Challengers Bengaluru vs Gujarat Titans",
      matchType: "T20",
      status: "Match starts at 19:30 IST",
      venue: "M Chinnaswamy Stadium, Bengaluru",
      date: "2026-04-09",
      dateTimeGMT: "2026-04-09T14:00:00",
      teams: ["Royal Challengers Bengaluru", "Gujarat Titans"],
      teamInfo: [
        { name: "Royal Challengers Bengaluru", shortname: "RCB" },
        { name: "Gujarat Titans", shortname: "GT" },
      ],
    },
  ];
}
