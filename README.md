# Thunderball Promo Board

An offline-friendly, single-page web app to display and manage a 10x10 Thunderball prize board for an in-person promotion.

## Features
- 10x10 stylized prize grid (numbers 1-100) with retro 80s neon aesthetic.
- Special prizes (1,25,50,75,100) that increase in value daily by a configurable increment (default +$25 per elapsed day unclaimed).
- Click (touch) a tile to mark prize as claimed (shows animated red X overlay) and persists via localStorage.
- Live computed current value for special prizes based on the current day or claim day.
- Management panel (toggle with the grave/tilde key `) includes:
  - Current Day control, increment amount, advance/reset day buttons
  - 10x10 checkbox matrix to bulk mark claims
  - Download current state as CSV (Number,Prize,isSpecial,isClaimed)
  - Upload CSV to restore/replace values
  - Restore default packaged CSV
  - Clear local storage / factory reset
  - Theme toggle (dark / light) and header toggle
  - Live stats (claimed, remaining, total unclaimed special value)
- Header (toggle with 'h') shows title, day indicator, and logo placeholders (left & right).
- All stateful values stored in localStorage (day, increment, claims, base prizes, theme).
- Fallback CSV parser tolerant of simple or loosely formatted rows.

## File Structure
```
index.html        # Main page
style.css         # Styling / themes / animations
app.js            # Logic and UI wiring
Thunderball.csv   # Default base prize list
README.md         # Documentation
```

## Key Bindings
- ` (grave / tilde) : Open / close Management Panel
- h : Toggle header visibility

## Data Model
State persisted under key `thunderballStateV1`:
```
{
  day: number,
  specialIncrement: number,          // daily add for specials
  prizes: [
    { number, basePrize, isSpecial, isClaimed, claimDay|null }
  ],
  lastUpdated: epochMs
}
```
Display value for a prize:
- Non-special: `basePrize`
- Special (unclaimed): `basePrize + specialIncrement * (day - 1)`
- Special (claimed on day D): `basePrize + specialIncrement * (D - 1)`

## CSV Import / Export
Export format (download):
```
Number,Prize,isSpecial,isClaimed
1,100,1,0
... etc
```
Import rules:
- Accepts lines like `N,$VALUE` or `N,VALUE` or loosely `N - $VALUE`.
- If a number 1-100 appears with a currency-looking amount, it's captured.
- Missing numbers default to $0 base values.

## Customization
- Replace placeholder logos: set `background-image: url('path.png')` on `#logoLeft` and `#logoRight` in `style.css` or inject inline style.
- Adjust base prizes: edit `Thunderball.csv` or upload a CSV.
- Change special increment default: update `specialIncrement` via panel.
- Add new specials: (code constant `DEFAULT_SPECIAL_NUMBERS` in `app.js`).

## Offline / Local Use
No network required after first load of the default CSV. All changes saved locally. Use backup download for redundancy.

## Suggested Enhancements (Future)
- Add animation sparkles to special tiles.
- Multi-user sync via simple websocket backend (optional).
- Sorting / filtering view modes.

## License
Internal promotional tool example. Add your own license as needed.
