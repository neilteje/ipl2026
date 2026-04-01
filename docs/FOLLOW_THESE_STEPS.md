# 🚀 Follow These Steps to See New Bets

## The Problem You're Experiencing

You're seeing the old "Total Match Runs" bet on all matches except the first one. This is because the bet lines are cached in memory.

## The Solution (3 Simple Steps)

### Step 1: Make Sure Dev Server is Running

In your terminal, you should see:
```
✓ Ready in 2.3s
○ Local: http://localhost:3000
```

If not, start it:
```bash
cd "/Users/neilteje/Desktop/uiuc 2025-2026/ipl_parlay"
npm run dev
```

### Step 2: Open a NEW Terminal and Run the Clear Script

**Open a second terminal window** (don't close the first one!) and run:

```bash
cd "/Users/neilteje/Desktop/uiuc 2025-2026/ipl_parlay"
node scripts/clear-all-bets.js
```

You should see output like:
```
🧹 Clearing all cached bet lines...

📡 Calling admin clear-cache endpoint...
✅ All bet caches cleared. New bets will be regenerated on next request.

🔄 Regenerating bets for all matches...

✅ ipl26-1: 22 bets regenerated
✅ ipl26-2: 22 bets regenerated
✅ ipl26-3: 22 bets regenerated
... (all 14 matches)

📊 Summary:
   Regenerated: 14
   Failed: 0

✨ All bet lines updated with new logic!
   Visit http://localhost:3000 to see updated bets
```

### Step 3: Refresh Your Browser

1. Go to `http://localhost:3000`
2. Click on **any match** (not just the first one)
3. Look at the "Match" category bets

## What You Should See

### ✅ NEW Bets (should be there):
- **Winning Margin** - Over/Under 25.5 runs/wickets
- **Highest Innings Score** - Over/Under ~180-190 runs (varies by teams)

### ❌ OLD Bet (should be GONE):
- **Total Match Runs (Both Teams Combined)** - Should NOT appear

### ✅ UNCHANGED Bets (still there):
- Total Sixes Hit in the Match
- Total Fours Hit in the Match
- Total Wickets Taken
- First Innings Totals
- Powerplay Runs
- Opening Partnerships
- Player Props

## If It Still Doesn't Work

### Problem: Script says "fetch failed"
**Solution**: Your dev server isn't running. Go back to Step 1.

### Problem: Script says "Failed (404)"
**Solution**: This is normal for matches that don't exist yet. As long as you see some "✅ regenerated" messages, you're good.

### Problem: Browser still shows old bets
**Solution**: Hard refresh your browser:
- **Mac**: Cmd + Shift + R
- **Windows/Linux**: Ctrl + Shift + R

### Problem: Script runs but bets don't change
**Solution**: 
1. Make sure you saved all code files
2. Wait for "compiled successfully" in the dev server terminal
3. Run the script again

## Quick Test

After running the script, test these URLs:

1. `http://localhost:3000/match/ipl26-1` - Should have new bets
2. `http://localhost:3000/match/ipl26-2` - Should have new bets
3. `http://localhost:3000/match/ipl26-3` - Should have new bets

If all three show the new bets (Winning Margin, Highest Innings), **you're done!** ✅

## Why This Happened

Next.js keeps module-level variables in memory during development, even when you change code. The `memoryStore` object that holds cached bets persists across hot reloads.

The clear script properly deletes all cached bets from memory, forcing the app to regenerate them with your new logic.

## Need More Help?

See these files:
- `HOW_TO_CLEAR_CACHE.md` - Detailed guide with all options
- `CACHE_FIX_SUMMARY.md` - Technical explanation of the fix
- `CLEAR_CACHE.md` - Quick reference
