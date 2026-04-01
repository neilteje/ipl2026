# Weekly Settlement System

## Overview

The weekly settlement system creates a **shared pool** where all bets placed during a week (Monday-Sunday) are pooled together. Winners split the losers' contributions proportionally based on their net winnings.

## How It Works

### Basic Concept

Instead of individual payouts, everyone's money goes into a weekly pot:
- **Losers**: Their lost bet amounts go into the pool
- **Winners**: They split the pool based on their winning percentage
- **Settlement**: Calculated at end of week (Sunday 11:59 PM)

### Example Scenario

**Week 1 Bets**:
- Alice bets $10, wins $30 → Net: +$20
- Bob bets $10, loses → Net: -$10
- Charlie bets $20, wins $50 → Net: +$30
- Dana bets $10, loses → Net: -$10

**Pool Calculation**:
- Total pool: $50 (all bets)
- Total losses: $20 (Bob + Dana)
- Total winnings: $50 (Alice + Charlie)

**Settlement Distribution**:
Bob and Dana each lost $10. This $20 is split among winners:
- Alice won 40% of total winnings (20/50) → receives $8 from losers
- Charlie won 60% of total winnings (30/50) → receives $12 from losers

**Final Settlements**:
- Bob owes: $4 to Alice, $6 to Charlie
- Dana owes: $4 to Alice, $6 to Charlie
- Alice receives: $8 total
- Charlie receives: $12 total

## Settlement Logic

### 1. Week Definition
- **Starts**: Monday 00:00:00
- **Ends**: Sunday 23:59:59
- **Timezone**: Based on parlay creation timestamp

### 2. Calculation Steps

```typescript
1. Filter parlays by week (createdAt between Monday-Sunday)
2. Only include resolved parlays (won/lost/push)
3. Calculate each user's net: (totalWon - totalBet)
4. Identify winners (net > 0) and losers (net < 0)
5. For each loser:
   - Calculate total owed
   - Distribute to winners proportionally based on their net winnings
6. Generate settlement transactions (from → to, amount)
```

### 3. Proportional Distribution

Winner's share = (Winner's Net / Total Winnings) × Loser's Total Loss

**Example**:
- Winner A: +$30 (60% of $50 total winnings)
- Winner B: +$20 (40% of $50 total winnings)
- Loser C: -$10

Loser C pays:
- $6 to Winner A (60% of $10)
- $4 to Winner B (40% of $10)

## Features

### Settlement Page (`/settlements`)

**Shows**:
1. **Week range** (e.g., "Mar 24 - Mar 30")
2. **Pool stats**:
   - Total pool (all bets)
   - Winners pot (total winnings)
   - Participants count
3. **Your balance**:
   - Net amount (positive = receiving, negative = paying)
   - List of who you owe
   - List of who owes you
4. **All settlements**:
   - Complete list of all transfers
   - From → To with amounts

### Navigation

- **Homepage**: New "Settle" button in navbar
- **Direct link**: `/settlements`
- **Auto-calculates**: Current week on page load

## Technical Implementation

### Database Schema

```typescript
interface WeeklySettlement {
  weekStart: string;         // "2026-03-24" (Monday)
  weekEnd: string;           // "2026-03-30" (Sunday)
  participants: string[];    // all userNames who bet
  totalPool: number;         // sum of all betAmounts
  winnersPot: number;        // total net winnings
  losersPot: number;         // total net losses
  settlements: Settlement[]; // who owes who
  isSettled: boolean;
  settledAt?: string;        // ISO timestamp
}

interface Settlement {
  from: string;              // userName (loser)
  to: string;                // userName (winner)
  amount: number;            // $ amount
  reason: string;            // "Week of 2026-03-24"
}
```

### API Endpoints

**GET `/api/settlements`**
- Returns current week's settlement
- Auto-calculates if not cached

**POST `/api/settlements`**
- Body: `{ weekStart: "2026-03-24" }`
- Recalculates settlement for specific week

### Storage

- **Key**: `settlement:2026-03-24` (week start date)
- **TTL**: 60 days
- **Caching**: Settlements are cached once calculated
- **Recalculation**: Manual refresh or new parlays trigger recalc

## Benefits

### For Players

1. **Fair distribution**: Winners share the pot proportionally
2. **Clear accounting**: See exactly who owes who
3. **Weekly cadence**: Natural settlement rhythm
4. **Simplified payments**: Fewer transactions than individual payouts

### For Friend Groups

1. **Community pot**: Everyone contributes to shared pool
2. **Transparent**: All settlements visible to everyone
3. **Automatic**: Calculations happen automatically
4. **Flexible**: Works with any number of participants

## Edge Cases Handled

### No Winners or No Losers
- If everyone loses: No settlements (house keeps nothing)
- If everyone wins: No settlements (impossible scenario)
- If all push: Everyone gets stake back, no settlements

### Rounding
- All amounts rounded to 2 decimal places
- Minimum payment: $0.01
- Payments < $0.01 are excluded

### Pending Parlays
- Only resolved parlays (won/lost/push) count
- Pending parlays excluded from settlement
- Settlements recalculate as matches resolve

## Future Enhancements

Potential additions:
- Historical weeks view (browse past settlements)
- Export settlements as CSV
- Payment status tracking (mark as paid)
- Venmo/PayPal integration links
- Weekly summary emails
- Season-long cumulative balances

## Testing

1. **Create test bets**:
   - Multiple users place parlays
   - Mix of wins and losses
   - All within same week

2. **Visit settlements page**:
   ```
   http://localhost:3000/settlements
   ```

3. **Verify calculations**:
   - Check your balance
   - Review who owes who
   - Confirm amounts add up

4. **Test edge cases**:
   - Week with no bets
   - Week with all wins
   - Week with all losses
