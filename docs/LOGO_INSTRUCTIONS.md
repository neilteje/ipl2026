# IPL Logo Setup Instructions

## Add Your IPL Logo

1. **Get a transparent IPL logo** (PNG format with transparent background)
   - Search for "IPL logo transparent PNG" or use the official IPL brand assets
   - Recommended size: 400x400px or larger (will auto-scale)

2. **Add to your project**:
   ```bash
   # Place your logo file here:
   /Users/neilteje/Desktop/uiuc 2025-2026/ipl_parlay/public/ipl-logo.png
   ```

3. **That's it!** The logo will automatically appear in:
   - Homepage navbar (top-left)
   - Match page navbar
   - Leaderboard page navbar
   - Login/gate screen

## Logo Specifications

- **Format**: PNG with transparent background
- **Dimensions**: Any size (auto-scales to fit)
- **File name**: Must be exactly `ipl-logo.png`
- **Location**: `public/` folder (root of public directory)

## Fallback Behavior

If the logo file is missing or fails to load:
- A blue Sparkles icon appears as fallback
- No errors shown to users
- App continues to work normally

## Testing

After adding your logo:
1. Restart dev server: `npm run dev`
2. Visit http://localhost:3000
3. Logo should appear in top-left corner of navbar
