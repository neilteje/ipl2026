# How to Clear Cached Bets

## The Problem

Bet lines are cached in memory (or Vercel KV in production). When you update the bet generation logic, old cached bets persist until manually cleared.

**Why this happens**: Next.js hot reload doesn't clear module-level variables in development, so the `memoryStore` object persists across code changes.

## Solution 1: Use the Clear Script (EASIEST)

Run this script while your dev server is running:

```bash
node scripts/clear-all-bets.js
```

This will:
1. Clear all cached bet lines from memory
2. Regenerate bets for all 14 matches
3. Show a summary of what was cleared

**Output you'll see**:
```
🧹 Clearing all cached bet lines...

📡 Calling admin clear-cache endpoint...
✅ All bet caches cleared. New bets will be regenerated on next request.

🔄 Regenerating bets for all matches...

✅ ipl26-1: 22 bets regenerated
✅ ipl26-2: 22 bets regenerated
...

📊 Summary:
   Regenerated: 14
   Failed: 0

✨ All bet lines updated with new logic!
```

## Solution 2: Use the Admin API Endpoint

### Clear ALL bet caches at once:

```bash
curl -X POST http://localhost:3000/api/admin/clear-cache
```

Then visit any match page to regenerate bets with new logic.

### Clear a SPECIFIC match:

```bash
curl -X DELETE http://localhost:3000/api/bets/ipl26-1
```

Repeat for each match you want to regenerate.

## Solution 3: Use the URL Parameter

Visit any match with `?regenerate=true`:

```
http://localhost:3000/match/ipl26-1?regenerate=true
```

This forces that specific match to regenerate its bets, bypassing the cache.

## Solution 4: Restart Dev Server (UNRELIABLE)

```bash
# Stop server (Ctrl+C)
npm run dev
```

⚠️ **Warning**: This doesn't always work because Next.js may not fully restart the Node process. Use Solution 1 instead.

## How to Verify It Worked

1. Visit the homepage: `http://localhost:3000`
2. Click on any match
3. Check the "Match" category bets
4. You should see:
   - ✅ **Winning Margin** (25.5 runs/wkts)
   - ✅ **Highest Innings Score** (dynamic line)
   - ✅ **Total Sixes Hit in the Match**
   - ❌ **NO "Total Match Runs (Both Teams Combined)"**

## Production (Vercel KV)

If you're using Vercel KV in production:

### Option 1: Use the admin endpoint
```bash
curl -X POST https://your-app.vercel.app/api/admin/clear-cache
```

### Option 2: Delete from Vercel Dashboard
1. Go to Vercel Dashboard → Storage → KV
2. Find keys starting with `bets:`
3. Delete them manually

### Option 3: Wait for TTL
Bet caches expire after 7 days automatically.

## When to Clear Cache

Clear the cache whenever you:
- Update bet generation logic in `lib/bet-generator.ts`
- Change team stats or venue stats
- Modify bet line calculations
- Add/remove bet types
- Update odds generation

## Technical Details

### Memory Store Structure
```typescript
memoryStore = {
  "bets:ipl26-1": "[...bet objects...]",
  "bets:ipl26-2": "[...bet objects...]",
  "parlay:abc123": "{...parlay object...}",
  "chat:global": "[...messages...]",
  // etc
}
```

### Cache Keys
- Bets: `bets:${matchId}`
- Parlays: `parlay:${parlayId}`
- Match parlays: `match_parlays:${matchId}`
- Chat: `chat:${matchId}`
- Settlements: `settlement:${weekStart}`

### Functions Added
- `clearMemoryStore()` - Clears ALL data (nuclear option)
- `clearAllBets()` - Clears only bet-related keys (safer)

## Troubleshooting

### Script fails with "fetch failed"
**Cause**: Dev server isn't running
**Fix**: Start dev server first: `npm run dev`

### Bets still show old data after clearing
**Cause**: Browser cache or React state
**Fix**: Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)

### Script says "Failed (404)"
**Cause**: Match ID doesn't exist in mock data
**Fix**: Check `lib/cricket-api.ts` for correct match IDs

### Memory store clears but bets regenerate with old logic
**Cause**: Code changes not saved or Next.js not recompiling
**Fix**: 
1. Save all files
2. Wait for "compiled successfully" message
3. Run clear script again
