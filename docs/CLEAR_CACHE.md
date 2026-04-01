# Clear Cached Bets - FIXED

The "Total Match Runs" bet is still showing because the old bet lines are **cached in memory**.

## ✅ BEST FIX: Use the Clear Script

**While your dev server is running**, open a new terminal and run:

```bash
node scripts/clear-all-bets.js
```

This will:
- Clear ALL cached bet lines from memory
- Regenerate bets for ALL 14 matches automatically
- Show you a summary of what was cleared

**That's it!** Refresh your browser and all matches will have the new bet lines.

---

## Alternative Fixes (if script doesn't work)

### Option 1: Use the Admin API

```bash
curl -X POST http://localhost:3000/api/admin/clear-cache
```

Then visit any match page to see new bets.

### Option 2: Use the URL Parameter

Visit each match with `?regenerate=true`:

```
http://localhost:3000/match/ipl26-1?regenerate=true
```

### Option 3: Use the Admin Page

1. Go to: `http://localhost:3000/admin/ipl26-1`
2. Click "Regenerate Bets"
3. Repeat for each match

## What Changed

**Removed**:
- ❌ Total Match Runs (Both Teams Combined) - Line: 184.5 runs

**Added**:
- ✅ Winning Margin - Line: 25.5 runs/wickets
- ✅ Highest Innings Score - Dynamic line based on teams

## Why This Happened

The app caches bet lines in the database (or memory) to ensure consistency - if someone places a parlay on a bet line, that line shouldn't change. 

When I updated the bet generation logic, existing cached bets weren't automatically regenerated. You need to manually clear them using one of the options above.

## Production Note

If you're using Vercel KV in production, you'll need to either:
1. Wait for the cache TTL to expire (7 days)
2. Use the admin regenerate button for each match
3. Manually delete the keys from Vercel KV dashboard
