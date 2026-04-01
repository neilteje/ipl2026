# IPL Parlay — Setup Guide

## Quick Start (Local)

```bash
cd ipl_parlay
npm install
cp .env.local.example .env.local
# Edit .env.local with your keys (see below)
npm run dev
```

Open http://localhost:3000 — works immediately with mock IPL match data!

---

## Environment Variables

### 1. CricAPI Key (for live IPL schedule)
- Sign up free at **https://www.cricapi.com/**
- Free tier: 100 requests/day (more than enough)
- Add to `.env.local`:
  ```
  CRICAPI_KEY=your_key_here
  ```

**Vercel:** In the project → Settings → Environment Variables, add `CRICAPI_KEY` for **Production** (and **Preview** if you test preview deployments). Redeploy after saving, or new deploys pick it up automatically.

**Why the home page sometimes showed no matches:** With a key set, the app used to call `currentMatches` only when the IPL 2026 series was not found in search. Outside live windows that returns an empty list and the built-in schedule was never used. That is fixed: if CricAPI returns no IPL fixtures, the app falls back to the built-in schedule preview.

**Optional — force a series:** If CricAPI lists IPL under a specific id, set:
```
IPL_SERIES_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```
(Also accepts `CRICAPI_IPL_SERIES_ID`.) Find ids via CricAPI `series` / `series_info` in their docs or dashboard.

### 2. Vercel KV (for shared parlay storage)
Without KV, parlays use in-memory storage — **resets on server restart**.
For production (persistent, shared with friends), add Vercel KV:

**Option A: Vercel Dashboard (easiest)**
1. Deploy to Vercel (see below)
2. In your Vercel project → Storage → Create KV Database
3. Vercel auto-injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`

**Option B: Upstash (for local dev too)**
1. Create free Redis at https://upstash.com/
2. Add to `.env.local`:
   ```
   KV_REST_API_URL=https://xxx.upstash.io
   KV_REST_API_TOKEN=your_token
   ```

### 3. Admin Secret
Change the default in `.env.local`:
```
ADMIN_SECRET=your_secret_phrase
```
Used to access `/admin/[matchId]` for resolving bets after a match.

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add CRICAPI_KEY
vercel env add ADMIN_SECRET
```

Or push to GitHub and connect repo at vercel.com — auto-deploys on every push.

---

## How to Use

### For a match day:
1. **Pick a match** from the home page
2. **Everyone visits the same match URL** (share the link with friends)
3. Each person **clicks OVER or UNDER** on bets to build their parlay
4. Enter your name + bet amount → **Submit Parlay**
5. Watch the **Parlays tab** to see all friends' picks

### Parlay payouts (1.9x per leg):
| Legs | Multiplier | $10 bet wins |
|------|-----------|-------------|
| 2    | 3.6x      | $36         |
| 3    | 6.9x      | $69         |
| 4    | 13.0x     | $130        |
| 5    | 24.8x     | $248        |

### After the match:
1. Go to `/admin/[matchId]`
2. Enter admin secret
3. Type in actual values for each bet (e.g., "Total Runs: 334")
4. Click **Save Results** — parlays are auto-resolved

---

## Bet Types Generated Per Match

- **Match:** Total runs, total sixes, total fours, total wickets
- **Innings:** 1st innings score, 2nd innings score
- **Powerplay:** Each team's 6-over powerplay score
- **Opening:** Opening partnership runs (both teams)
- **Batting:** Top batsmen run lines, 50+ milestones
- **Bowling:** Top bowler wicket lines, 2+ wicket props
- **Extras:** Extras, death-over sixes

All lines are calibrated to IPL historical averages per team and venue.
