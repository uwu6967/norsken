# Norsken — handoff (2026-11-12)

Everything a new chat / Claude Code session needs to keep working on this.
Newer than `docs/transfer-note-2026-09.md` (that one is the deep history; where they
disagree, THIS file wins).

## 1. What it is, where it lives

- **Norsken** = table planner for the **Spisestua** dining room at **Norske Selskab** (Danny's work).
  Waitresses use it to lay out tables, check aisles, plan the langbord plates, mark allergies
  per seat, seat bookings, and print an A4.
- **Live (source of truth):** Claude artifact https://claude.ai/artifact/RBdn3W3FKaBSeTCLVNaimr
  - Shared plan for everyone with the link (artifact `db` capability, doc `plan/current`).
  - Capabilities: `db`, `user`, `downloads`. Republish **without** passing `capabilities` to keep them.
  - The artifact tool can only publish the page itself, so the app is **one self-contained
    `index.html`**: CSS + JS inlined, `print.html` embedded as base64 (`window.__NORSKEN_PRINT_SRC__`).
- **This repo:** `src/` = real sources (`index.html`, `app.js`, `styles.css`, `print.html`);
  `python3 tools/build.py` writes the single-file `index.html`. Opened from disk / GitHub Pages it
  falls back to localStorage only (no shared plan).
- **Old local copy `F:\Norsken`** on Danny's PC is OLDER than this repo/artifact. Don't touch his PC
  (rule: cloud VMs only, hands off DESKTOP-IP8U4OO and the NAS).
- In Sept the user said "don't push". On 2026-11-12 he **asked for a GitHub repo `norsken`** (private
  recommended) incl. the ResDiary code. That is the current wish.

## 2. Room

- 7,00 m × 13,60 m (measured). Map: **top = window wall** (3 windows), **bottom = waitress door wall**
  (servitørdør, middle), **left = two double doors**, right long wall = no doors.
- Sidebordet (old dark sideboard) flush in bottom-left corner against the bottom wall: depth 60
  measured, length 180 = ANSLAG. Two white trolleys on wheels exist (by waitress door, under right
  window) — deliberately NOT on the map.
- Top-right "dark block" placeholder was removed: photos show nothing on the floor there.
- Door positions are drag-able fixtures. Photo estimates (±0,5 m), not applied: upper double door
  centre ≈ 2,5 m from window wall, lower ≈ 3,3 m from waitress wall (defaults are 24 % / 68 %).
- Big patterned rug is narrower than drawn (side tables stand on parquet); table 16 has its own
  small dark rug. Cosmetic, not fixed.
- Paintings layer exists (9 paintings, gold bars, tap to name) but **hidden by default** — user:
  "not important".

## 3. Measurements (DIMS_VERSION = 10)

`state.dims` in cm. `est` flag = ANSLAG badge (guess). A size the user typed is never overwritten
by a new default; placeholders (`est: true`) take the new default when DIMS_VERSION bumps.

| What | Value | Status |
|---|---|---|
| Lite (small round) | Ø130 | user said 130 (an older tape photo read 132) |
| Stort (big round) | Ø150 | user said 150 — **a tape photo of an 8-cover round table read ~140; unconfirmed which table** |
| Ovalt (table 16) | 100 × 180 | ANSLAG |
| Langbord **half** | 90 × 105 | ANSLAG (from photos) — **most important missing measurement** |
| Plass per person (langbord) | 60 | ANSLAG |
| Chair (big) | 54 wide | measured |
| Small old chairs | 45 | ANSLAG |
| Plates (fill width / count) | liten 37 ×2 · medium 49,5 ×4 · stor 55,5 ×2 · ekstra stor 64 ×1 | measured (tape photos of the stack) |
| Aisle minimum | 90 between chair backs | rule |

Migrations in `mergeDims()`/`normalizeState()`: v8 moves saved lite 132→130 and medium count 2→4 if
still the old number; v10 turns the saved round table labelled 16 into the oval and puts a round back
in storage.

## 4. Tables, langbord and plates

- Sizes: `small` (round), `big` (round), `oval` (stadium shape, chairs on long sides like a rect),
  `long` (one langbord HALF). Stock: 8 lite, 6 stort, 1 ovalt, 4 halves.
- A **langbord = two halves joined** (`table.group`). Halves pull apart on wooden rails; **plates**
  (tabletop inserts) drop in the gap. Plates live on the downstream member: `gapPlates: [...]`.
- Joined langbord seats as ONE table: `groupSeatLead()` → the first half carries all chairs along the
  whole run (`groupRun()`), the other half carries none. Ends: `table.ends` 0/1/2 (Kortende).
- **People → plates** (`planPlates()`): perSide = ceil((people − ends)/2); need = perSide × cover −
  halves' length; picks the SMALLEST stock combination ≥ need (ties → fewer plates), respaces,
  keeps it in the room. Drawer: "Personer ved langbordet" + **Finn plater**; **+/−** on a langbord
  also runs it. If plates run out it says so and how many fit.
- Moving: a joined langbord moves as one piece (`moveGroupBy`, `fitGroupInRoom`, `setCenterRaw`).
  Never clamp halves one by one (that was the "middle table messed up" bug, fixed 2026-11-12).
- The word "Langbord"/"Ovalt" is NOT printed on the shapes (user: "we know it's a langbord").

## 5. Chairs and marks

- Chairs face their table (thick edge = back). Round tables default to the diagonals
  (`seatTurn` 45) so neighbours don't collide; ⟲ ⟳ turns 15° (round only). Oval: 3 + 3 on the sides.
- Clashing chairs (with chairs, tables or walls) turn red + listed in warnings.
- Seat marks: Gluten, Laktose, Nøtter, Skalldyr, Diabetes, Gravid, Vegetar, Annet, **Ønske** (yellow:
  a food wish, e.g. cold goose at gåsemiddag), plus **✎ Notat** (free text per seat, `table.seatNotes`).
  "Merket totalt: N plasser" shown and printed; notes listed on the print.
- On the paper plans staff draw: blue = allergy note, yellow = wish, ✱ = seat. Waitress names/arrows
  on paper are their station routes — user said NOT needed in the app.

## 6. Numbering

Left column 1–5 counted from the waitress door up; right column 6–10 from the window down; 16 =
middle top (the oval); 14 = langbord; 11/12/15 = extras/middle. Manual numbers (e.g. 1a) supported.

## 7. Presets

- **Vanlig oppsett**: rounds both sides, 16 oval at top, langbord 14 closed in the middle.
- **Lunsj-oppsett** (lunch after a selskap): rounds + 16 + two closed langbords end to end with a
  40 cm gap: window one 3+3 + 1 end chair (7), the other 2+2 (4).

## 8. Bookings → tables (from the ResDiary printouts)

Staff re-seat ResDiary's list by hand. Rules built in (`assignBookings()`):
- Side tables first in this order (editable box): **3, 6, 5, 8, 10, 9, 11, 7, 2, 4**.
- Never the middle (anything in the middle band, langbord, 12/14/15). 14 = shared table for walk-ins.
- More than 5 people → 16 first, then a stort table.
- Earliest time gets the first free table. `B:7` / `bord 7` on a line locks it.
- Leftover tables listed as "Ekstra: …, 14 (felles)".
- Input: one line per booking: `12:30 2` (time, people, optional initials). **No names (NDA).**

## 9. ResDiary bookmarklets (`resdiary/`)

- **Rydd liste**: removes blank rows + Telefon / E-post columns on the ResDiary print page.
- **Til bordplan**: copies `time people` lines (no names) to the clipboard for the planner.

## 10. Rules for whoever works on this

- **NDA**: every guest is a VIP. Never store, repeat or commit guest names, phones, emails. No photos
  of booking lists in the repo. Booking box examples are name-free.
- Git author AND committer: `uwu6967 <22033341+uwu6967@users.noreply.github.com>`. No co-author
  lines. Verify with `git log`.
- No API keys/tokens in chat.
- Danny wants short replies and to "just build it". If unsure (a measurement, a rule), ask or leave it
  as ANSLAG — don't guess.
- UI copy Norwegian first (English toggle exists).
- Verify in a real browser (Playwright): click through the changed feature, desktop + phone width,
  reload, print page. Rebuild `index.html` and republish the artifact after changes.

## 11. Still open

1. Tape ONE langbord half (width × length to where plates start) → Mål.
2. Confirm stort: 150 or ~140 (and which table the 140 photo was).
3. Tape oval 16; check 60 cm per person (dinner photos suggest ~11 per side on the full langbord).
4. Sidebord length, small chairs, exact door positions, chair pulled-out depth.
5. Future idea from Danny: drag a booking/guest onto a table and pick their seat.
6. Push this repo to GitHub (`norsken`, private) via Claude Code or from the PC.
