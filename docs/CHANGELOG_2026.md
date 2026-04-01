# IPL Parlay 2026 Update

## Season Data (March 2026)

### Schedule
- **Season dates**: March 28 – May 31, 2026 (84 matches)
- **Opening match**: Royal Challengers Bengaluru vs Sunrisers Hyderabad at M. Chinnaswamy Stadium, March 28, 2026
- Mock schedule includes 14 realistic first-phase fixtures
- API integration ready for live CricAPI data when `CRICAPI_KEY` is set

### Team Rosters (2026 Retention + Auction)
Updated all team stats with current 2026 squads:

**Chennai Super Kings**
- Key players: Ruturaj Gaikwad (C), MS Dhoni, Sanju Samson, Shivam Dube
- Bowlers: Khaleel Ahmed, Nathan Ellis, Noor Ahmad
- Note: Ravindra Jadeja traded out

**Mumbai Indians**
- Key players: Rohit Sharma, Hardik Pandya (C), Jasprit Bumrah, Suryakumar Yadav, Tilak Varma
- Bowlers: Trent Boult, Deepak Chahar

**Royal Challengers Bengaluru** (Defending Champions)
- Key players: Virat Kohli, Phil Salt, Rajat Patidar (C)
- Bowlers: Josh Hazlewood, Bhuvneshwar Kumar, Krunal Pandya

**Sunrisers Hyderabad**
- Key players: Travis Head, Abhishek Sharma, Heinrich Klaasen
- Bowlers: Pat Cummins (C), Jaydev Unadkat, Brydon Carse

**Kolkata Knight Riders**
- Key players: Rinku Singh, Sunil Narine, Cameron Green
- Bowlers: Varun Chakravarthy, Harshit Rana, Matheesha Pathirana
- Captain: Ajinkya Rahane

**Other Teams**: Updated with 2026 retention lists

## Bet Logic Fixes

### Critical Cricket Logic Corrections

**Before (WRONG)**:
- "Both innings combined = 175 runs" ❌
- This implied each team scores ~87 runs (impossible in T20)

**After (CORRECT)**:
- "Match Total Runs (Both Teams Combined)" = ~340-360 runs ✅
- Each team scores ~170-185 runs per innings
- Total = First Innings + Second Innings

### Bet Line Examples (RCB vs SRH at Chinnaswamy)
- **Match Total Runs**: ~365.5 runs (both teams combined)
- **Match Total Sixes**: ~18.5 sixes (both teams)
- **Match Total Fours**: ~28.5 fours (both teams)
- **RCB 1st Innings**: ~182.5 runs
- **SRH 2nd Innings**: ~180.5 runs
- **Powerplay scores**: ~55-62 runs (per team, overs 1-6)
- **Opening partnerships**: ~30-36 runs (per team)
- **Player props**: 30-40 runs for top batsmen, 1.5-2 wickets for bowlers

All lines now use realistic T20 cricket values based on:
- Team batting/bowling strength
- Venue factors (Chinnaswamy is high-scoring: 1.10x factor)
- Historical averages from 2024-2025 seasons

## UI Redesign (Modern Skeuomorphic)

### Design System Changes

**Removed**:
- Purple gradient blobs (`blur-3xl` orbs)
- Flat `/10` opacity washes
- Generic violet primary color

**Added**:
- **Stadium gold** primary accent (#F9CD1F / hsl(43 92% 54%))
- **Warm charcoal** base (zinc/slate tones)
- **Subtle pitch grid** background (no gradients)
- **Plus Jakarta Sans** font (modern, readable)

### Skeuomorphic Components

**Surface utilities** (`globals.css`):
- `.surface-raised` - Elevated panels with inset highlight + soft shadow
- `.surface-inset` - Recessed wells (inputs, inactive tabs)
- `.surface-header` - Sticky chrome with subtle depth

**Tactile elements**:
- Buttons: border + `shadow-raised-sm`, active state translates 1px down
- Cards: `shadow-raised` with white/[0.07] borders
- Tabs: Inset track with raised active chip
- Bet cards: Left accent border (color-coded by category)
- Team badges: Ring + color-mixed backgrounds (not flat overlays)
- Status indicators: Glowing emerald dot for "live" states

### Component Updates

**All pages/components** now use:
- `surface-raised` / `surface-inset` classes
- `shadow-raised-sm` / `shadow-insetWell`
- Border tokens: `border-white/[0.07]` (subtle, physical)
- Sparkles icon (replaces generic "Zap" where appropriate)
- Tabular nums for multipliers/currency
- Refined spacing, tracking, and visual hierarchy

## Technical Notes

- Build passes with no linter errors
- All TypeScript types preserved
- CricAPI integration unchanged (still supports live data)
- Mock data serves as fallback when API key not set
- Responsive design maintained across mobile/tablet/desktop
