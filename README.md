# Thunderball Promo Board

An offline-friendly, single-page web app to display and manage the Thunderball promo prize board.

## Features
- 75-cell stylized prize grid (numbers 1–75) rendered in a 15 x 5 layout with retro 80s neon aesthetic.
- Special ("Golden") prizes loaded from the CSV `isSpecial` column (fallback list 71–75). They accrue a daily increment (default +$25) ONLY while never claimed.
- Click / touch a tile to mark a prize as claimed (animated red X overlay) and persist via `localStorage`.
- Golden prize value resets to base immediately when claimed and never accrues again (retired) even after daily board resets.
- Daily day advance automatically resets (deselects) the entire board while keeping a `wasClaimed` flag on previously claimed golden numbers so they remain at base value.
- Management panel (` key) includes:
  - Current Day control, increment amount, advance/reset day buttons
  - 75-number checkbox matrix to bulk mark claims
  - Download current state as CSV (Number,Prize,isSpecial,isClaimed)
  - Upload CSV to restore/replace values
  - Restore default packaged CSV
  - Clear local storage / factory reset
  - Theme toggle (dark / light) and sidebar toggle
  - Live stats (claimed, remaining, total unclaimed special value)
- Header sidebars (toggle with `h`) show title, day indicator, and logo tickers.
- All state persisted in `localStorage` (day, increment, claims, base prizes, theme).
- Robust CSV parser tolerant of simple or loosely formatted rows.

## File Structure

```text
index.html        # Main page
style.css         # Styling / themes / animations
app.js            # Logic and UI wiring
Thunderball.csv   # Default base prize list (now 1–75)
README.md         # Documentation
```

## Key Bindings

- ` (grave / tilde) : Open / close Management Panel
- h : Toggle sidebars visibility
- n : Advance day (triggers board reset & golden accrual logic)
- t : Re-trigger thunder strike animation on last claimed prize

## Data Model

State persisted under key `thunderballStateV1`:

```js
{
  day: number,
  specialIncrement: number,          // daily add for unclaimed golden prizes
  prizes: [
    { number, basePrize, isSpecial, isClaimed, claimDay|null, wasClaimed }
  ],
  lastUpdated: epochMs
}
```

Display value for a prize:

- Non-special: `basePrize`
- Golden (unclaimed & never claimed): `basePrize + specialIncrement * (day - 1)` (Day 1 => 0 accrued days)
- Golden (claimed or previously claimed/retired): `basePrize`

Daily Reset Logic:

- When the day number increases, all tiles are cleared (set to unclaimed).
- Golden tiles that had been claimed set `wasClaimed = true` and stay at base value with no future accrual.
- Unclaimed golden tiles continue accruing based on the new day.

Redesign Note (2025-11-05): Golden prizes now retire (reset to base and stop accruing) once claimed.
Daily Reset Enhancement (2025-11-05): Board auto-clears on day advance while preserving golden retirement state.

## CSV Import / Export

Export format (download):

```csv
Number,Prize,isSpecial,isClaimed
1,5,0,0
...
```

Import rules:

- Preferred header: `Number,Prize,isSpecial` (third column optional). If present, values `1,true,yes,y` mark a golden prize.
- Fallback parsing: detects lines containing a number 1–75 and a currency-like value.
- Only numbers 1–75 ingested; others ignored. Missing numbers auto-filled at $0.
- If `isSpecial` column absent, fallback list `DEFAULT_SPECIAL_NUMBERS` (71–75) is used.

## Customization

- Replace placeholder logos: adjust `background-image` for ticker logo elements in CSS.
- Adjust base prizes: edit `Thunderball.csv` or upload a new CSV.
- Change special increment default: modify the input in the management panel.
- Add / change specials: include or edit `isSpecial` flags in the CSV (or update fallback constant).
- Theme: toggle via panel or the stored preference.

## Offline / Local Use

After initial load, no network required. All changes saved locally. Use CSV download for backups.

## Suggested Enhancements (Future)

- Visual indicator for retired (claimed) golden prizes.
- Prevent manual unclaim of retired golden prizes.
- Historical claim log export.
- Multi-user sync via websocket backend.
- Additional animations or rarity tiers.

## License
Internal promotional tool example. Add your own license as needed.
