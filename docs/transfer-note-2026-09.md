# Norsken — agent transfer note

Last updated: 2026-09-26 (measured plates restored after an overwrite, old-table length from photo, half-cm Mål inputs). Before that 2026-09-22 (plate widths, bottom-wall old table, drag-in plates, guest names, cover counts, rotation). Written so a new agent can continue without the old chat.

## What this is

A **waitress floor-plan layout board** for restaurant **Norsken**, room **Spisestua**. Staff drag blank tables onto a map, numbers appear from **where** the table sits, the board reports **real distances in cm**, then they print/PDF the floor.

Stated goal from the project owner: *"for my boss to use this website for planning for waitress to move the table and find precise measurement."* The measurement layer added on 2026-09-21 is that goal.

It is **not** an occupancy tracker (ledig / opptatt / reservert). That was an earlier version and was thrown out.

The user is a waitress. They write mixed English and Norwegian. Keep UI copy in **Norwegian first**, English via the NO/EN chip.

## Where it lives

**Moved 2026-09-21.** The live workspace is now **`F:\Norsken`** on the Windows machine `DESKTOP-IP8U4OO` ("Danny"). Edit there. The user connected that folder to the cloud session themselves and said to use it instead of the old one.

- **Current home:** `F:\Norsken` — writable from a Claude cloud session. Deleting files there is blocked until the user approves it, so `cp`/`mv` work but `rm` fails with `Operation not permitted`; ask for delete permission rather than reporting it as impossible.
- **Old home:** the NAS share `/srv/dev-disk-by-uuid-8d7fb191-15e8-4690-9dfe-1879216b1480/norsken`, mapped on Windows as `Y:\norsken`. It mounts **read-only** in a cloud session — every write returns "Windows denied access". It still holds the pre-measurement version. Treat it as the old copy, not the live one; do not edit it and do not assume the two are in sync.
- Git history came across with the move: local `main` only, base commit `9e26c13`. **No remote.** User explicitly said **do not push**. `origin` CLI SIGILL on the NAS's Ivy Bridge CPU; GitHub CLI token on that box is invalid.
- Not a public product. Do not invent a GitHub remote unless they ask.
- Serving: bind **`0.0.0.0:8765`**, never `127.0.0.1` — phones on the LAN and Cursor's browser cannot use loopback. Port **8765** must stay up if they use it on shift.
- **The LAN address changed with the move.** `http://192.168.1.245:8765/` was the *NAS*. Serving from `F:\Norsken` means the URL is the Windows box's own LAN IP. The launcher prints it; do not quote an IP you have not seen printed.

### An agent cannot start the server for them

`device_bash` runs in a **sandboxed Linux VM** with the connected folders mounted — it is *not* the Windows host. A server started there is unreachable from the user's browser or phone, and the shell is killed after ~2–3 minutes anyway. So hosting is always handed to the user as a double-click launcher, never started from here. Do not promise otherwise.

## Files (all of them)

| File | Role |
|---|---|
| `index.html` | App shell. Cache-bust `styles.css?v=21` and `app.js?v=22`. Bump the one you change. |
| `app.js` | All behavior. Storage key `norsken-layout-v3`. |
| `styles.css` | Layout, room aspect `7 / 13.6`, grid, rulers, doors, tables, tray, målliste. |
| `print.html` | New-tab print/PDF. Same storage key. Auto `window.print()` after load. Two A4 pages: map, then måltabell. |
| `.cursor/settings.json` | Enables Cursor Supermemory plugin. |
| `.gitignore` | `.env`, logs, `.DS_Store`. |
| `start-norsken.cmd` | **Double-click launcher.** Prints localhost + every LAN URL, then serves the folder. Tries Node, then `py`, then `python`, then `serve.ps1`. |
| `serve.js` | Node static server, binds `0.0.0.0`. Correct MIME types, no-cache, path-traversal guarded. Port via `NORSKEN_PORT`. |
| `serve.ps1` | PowerShell fallback when neither Node nor Python exists. `HttpListener` on `http://+:PORT/` needs admin; falls back to localhost-only and says so. |
| `stopp-norsken.cmd` | Finds whatever listens on the port via `netstat` and kills it. |
| `start-norsken-skjult.vbs` | Starts it with no console window (the user prefers no CMD flash while gaming). Stop it with `stopp-norsken.cmd`. |

**The launcher files are ASCII-only and CRLF.** Norwegian æ/ø/å turn to mush in the Windows console codepage, and an LF-only `.cmd` can break `goto` labels. Keep both properties if you edit them.

Static HTML only. No build step. Serve the folder as the web root.

## Room geometry

- Physical room: **13.60 m** (long walls / left–right of the *tall* map) × **7.00 m** (window wall). This is **measured**, not a guess.
- Map is **portrait**: top = window, bottom = waitress door, left = two double doors.
- Coordinates: `x`/`y` percents of the map, `y=0` at the **window (top)**. Percent stays the storage format; **centimetres are derived from it** at render time.
- **Window wall has THREE tall windows**, not one strip — `WINDOWS = [{at:22},{at:50},{at:78}]`, each 17% wide, with a rose curtain block either side. Taken from photos IMG_2469/2471/2472.
- Floor is **herringbone parquet**; a large patterned red rug (`CARPET`, 84% × 86%, centred) covers the middle with parquet showing all round. The rug is drawn at ~17% opacity **on purpose** — an earlier pass drew it at full strength with a gold medallion and it buried the tables and the grid. This map is for measuring; the dressing must stay a hint.
- Walls are **grey panelled**, not tan; doors are grey leaves, not red boxes. The waitress door reads as an opening.
- Top-right dark block is a **placeholder corner**. User said they would photograph it; photo was never received.
- Wall text (Dobbeltdør / Servitørdør / Vindu) stays **off the map**. Those names now appear only in the measurement readouts ("klaring: vindu 1,15 m · servitørdør …"), which the user asked for.

## Mål / measurements (added 2026-09-21)

Everything real lives in **centimetres**, in `state.dims`, persisted under the same storage key:

```
v:      7                      // DIMS_VERSION
room:   { w: 700,  h: 1360 }   // MEASURED
small:  { d: 132 }             // MEASURED 2026-09-21
big:    { d: 160 }             // PLACEHOLDER
long:   { w: 90,  l: 220 }     // PLACEHOLDER - the rectangular TABLE
plateS: { w: 37,   l: 90, n: 2 } // w MEASURED 2026-09-22 - insert: w = gap it fills
plateM: { w: 49.5, l: 90, n: 2 } // w MEASURED 2026-09-22
plateL: { w: 80,   l: 90, n: 2 } // PLACEHOLDER
sidebord:   { w: 60, l: 178 }  // depth MEASURED, length FROM PHOTO (±5), still est
chairBig:   { d: 54 }          // MEASURED 2026-09-21
chairSmall: { d: 45 }          // PLACEHOLDER
aisle:  90                     // minimum free passage for a waitress
snap:   10                     // grid step in cm, 0 = off
est:    { small: false, big: true, long: true,
          plateS: false, plateM: false, plateL: true,
          sidebord: true, chairBig: false, chairSmall: true }
```

### DIMS_VERSION and the placeholder migration

Saved dims normally win over the defaults. The exception: when `saved.v !== DIMS_VERSION`, any size the user **never measured** (`est` true) takes the newer default instead. A size the user typed in (`est: false`) is never overwritten. So **bump `DIMS_VERSION` whenever you change a placeholder** — otherwise an existing browser keeps the old guess forever. Tested against three states: an old browser on placeholders, a browser with a measured value, and a fresh one.

### What is measured, and from what

- **Room 700 × 1360 cm** — from the user, earlier.
- **Lite = 132 cm round** — tape photo IMG_2481 / IMG_2482, 2026-09-21. The table is laid for six, and 132 cm gives 415 cm of edge, i.e. 7.7 chairs at 54 cm, so six is comfortable. Two independent readings agree.
- **Chair width 54 cm** at its widest (the front, tucked in) — user, from IMG_2477 / IMG_2479. Stored as `chairBig`, but nothing computes with it yet. See "chair ring" under next work.
- **Old table depth 60 cm** — tape photos IMG_2487–2489. **IMG_2490 is the depth again**, laid across the near END (rule reads ~60 at the leather edge, ~63 at the outer rope edge), not the length. IMG_2491 is an overview with the rule put down on the white serving cart.
- **Old table length 178 cm, from the photo, not the tape** (2026-09-26). The user forgot to tape it and said to take it from the photo. IMG_2490 has the whole top in frame: HEIC EXIF iPhone 15 Plus, 26 mm equiv → f ≈ 4290 px at 5712×4284; vanishing point along the table from the left wall's gold trim + the table's right edge; across direction from the near edge + orthogonality; scale from rule marks 30 and 60. Near inner edge → far outer edge ≈ 172–177 cm, plus the ~4 cm near rim. Cross-check: the rope carving has the same pitch (~2,3 cm) on the near edge (scaled by the rule) and the long edge (scaled by f), which agrees with f ≈ 4290–4450. Range 176–181, set 178, **still ANSLAG** until someone tapes it.
- The room photos IMG_2537–2554 are **reference shots of how the room looks**, not measurements (user, 2026-09-26). No tape in any of them.
- **Liten plate fyller 37 cm, medium plate fyller 49,5 cm** — tape photos IMG_2483–2486, confirmed by the user 2026-09-22. `plateL.w` is still a guess, and so is every `n`.
- Everything else is still a guess wearing an ANSLAG badge.

- `est.<size> === true` renders an **ANSLAG / est.** badge next to that size everywhere it appears. Typing a real number into the **Mål** panel clears that size's badge. **Do not clear a badge in code** — it is the honest marker that the number was never measured.
- On-screen percentages are derived: `w% = cm / room.w * 100`, `h% = cm / room.h * 100`. Change a cm value and the map redraws to scale. Nothing stores pixels.
- **Mål** chip opens the editable panel (room, each table size, minimum aisle, snap step). Values are clamped to sane ranges; out-of-range input snaps back. Inputs take **half centimetres** (step 0,5, rounded to the nearest 0,5) — until 2026-09-26 the panel showed and saved `Math.round`, so the measured medium plate read 50 and any edit would have stored 50. An empty box reverts. The old table's **depth** field has no `est` key (it is taped), so only the length carries that badge and typing a depth does not clear it.
- **Rutenett** chip toggles the metre grid + edge rulers. One square = 1 m, faint lines at 0,5 m, numbered ticks along the top and left edges. Off = the old plain plank floor.
- Selected floor table shows in the drawer: size in cm, centre position from window and from the left wall, clearance to all four walls, and the gap to the nearest table. Plus **Flytt** nudge buttons that move the table by exactly one snap step (10 cm by default) — this is how you place a table precisely, not by dragging.
- **Målliste** under the board: every floor table with number, size, distance from window, distance from left wall, nearest neighbour. Reprinted on page 2 of the PDF.
- Dragging snaps the table centre to the snap step and clamps it so no table can overlap a wall.

### Gap maths

`gapCm(a, b)` is edge-to-edge free space:

- round ↔ round: centre distance minus both radii (exact).
- anything involving the langbord: bounding-box gap — exact for an axis-aligned rectangle, slightly **conservative** where a round table sits diagonally off a rectangle corner. Conservative is the safe direction for a passage check.

### Aisle check

Any table pair whose gap is **below `dims.aisle`** is listed under **For trangt for servitør**, in the app and on the print. Exactly at the minimum is fine; only strictly-less is flagged.

**Wall clearances are deliberately not flagged.** A table pushed against a wall is normal in this room, so warning on it would cry wolf. Wall numbers are shown as information only. If the user later asks for wall warnings, gate them on "a table with no side ≥ aisle" rather than on every short wall gap.

## Fixed furniture

`state.furniture` holds things that occupy floor space but are not dining tables. One entry today: **`sidebord`, the big old table in the bottom-left corner, against the BOTTOM wall.** (It was on the *left* wall until 2026-09-22; the user corrected that — `migrateFurniture()` moves a saved one across once.) The user called it "heavy as fuck" — it is not moved in service, so the board treats it as an obstacle. It matters because **table 1 sits right next to it** and table 1 is usually a big table, sometimes seating up to 8 on the old small chairs.

- Anchored to a wall (`wall` + `along`), like the doors: on the bottom wall it only slides horizontally and stays flush. `syncFurniture()` derives `x`/`y` percent from the anchor plus the current cm size, so furniture reuses every table helper — `centerCm`, `tableCm`, `clearances`, `gapCm`.
- **It counts for clearances.** `obstacles()` returns floor tables plus furniture; `nearest()` and `tightPairs()` both run over that, so a table too close to the old table is flagged exactly like two tables too close together. Two pieces of furniture are never flagged against each other.
- Never numbered, never goes to the tray. `obstacleName()` gives it its display name.
- Drawn on both the board and the print, as a hatched wood block.
- Verified that the app and `print.html` produce the *same* warning text and the same centimetre figure for a table-vs-furniture conflict. If you change the gap maths, change it in both files and re-check that.

Sizes live in `dims` like everything else (`dims.sidebord`), so the length is editable in the Mål panel and badged ANSLAG until measured.

## Setemerker — chairs and guest flags

Chairs are drawn automatically as squares around every floor table, and each one can be tagged with a guest requirement (gluten, laktose, nøtter, skalldyr, diabetes, gravid, vegetar, annet). This is the service sheet: which *seat* needs what.

- `seatPositions()` places them — evenly round a circle for round tables, along the two long sides for rectangles, offset `chairBig.d * 0.62` from the edge. `seatCount()` derives a default from perimeter ÷ chair width (132 cm round ÷ 54 cm chair = 7); `table.seatCount` overrides it, with −/+/Auto in the drawer.
- `seatBlocked()` drops any chair standing inside a joined neighbour's footprint or inside the plate gap — nobody sits on the plates.
- Marks live in `table.seatMarks = { seatIndex: markKey }`. Pick a colour in the brush row, click a chair; clicking with the same colour clears it.
- `save()` bakes `table.seatsRender` (percent positions + mark) so `print.html` draws chairs without redoing the geometry. The print legend lists only the marks actually in use, with `print-color-adjust: exact` so the colours survive.

### Med stoler — the aisle check counts chairs

`gapCm(a, b, withChairs)` takes a third argument. With it true, `occupiedCm()` grows each table by `chairBig.d * 1.12 * 2` — chair centre sits at edge + `chair*0.62`, so the outer edge is + `chair*1.12`. `nearest()` and `tightPairs()` pass `state.withChairs` (default on, **Med stoler** chip); the warning text says which basis it used.

**Plate matching must stay on the raw tabletop** — `groupGaps()` calls `gapCm()` with no third argument. Passing chairs in there would wreck the plate answer.

Two 132 cm tables 3 m apart: 168 cm tabletop to tabletop, but only 47 cm chair back to chair back. That difference is the whole point.

### Why every mark carries a letter

**Do not make this colour-only, and do not add a ninth colour.** The eight hues are the validated reference categorical order, but they were run through the palette validator for this exact use (any two marks can end up adjacent, so it is the all-pairs case, on the cream `#eee0cd` surface) and eight **fails**: worst normal-vision pair red↔orange ΔE 7.1 against a floor of 15, worst colour-vision-deficient pair green↔orange ΔE 3.2. That is not fixable by re-picking hues — with all 28 pairs in play no eight-colour set clears it.

So the **code letter is the identity** (`G`, `L`, `N`, `S`, `D`, `Gr`, `V`, `A`) and colour is only the fast cue. The letter is what makes it work for the ~1 in 12 men with colour-vision deficiency and on a black-and-white printout. `inkOn()` picks black or white text per swatch by luminance rather than guessing. If more categories are ever needed, add letters — not hues.

## Bordplater are INSERTS, not tables — and they combine

**This was got wrong twice on 2026-09-21/22. Read this before touching plates.**

The user drew it: two tables stood apart with the metal frame spanning the gap between them, and **plates dropped into that gap** to make one long table. A plate is a filler piece. It is *not* a tabletop you place on the floor, and it is *not* a dinner plate.

A second drawing settled the other half: **several plates go into ONE gap, side by side** — their example was small + large + medium in a single gap. So the question is never "which plate", it is **"which combination of plates"**.

Consequences, all live in the code:

- `dims.plateS/M/L` are inserts: **`w` is how much of the gap the plate fills**, `l` is its length across the table, `n` is how many the restaurant owns. They are NOT in `SIZES` and cannot be put on the floor.
- `dims.long` is the rectangular table itself (the langbord in the middle). Plates go between two of these. `SIZES = ["small", "big", "long"]`.
- `bestPlate(gap)` brute-forces every combination within stock (a few hundred at most) and returns the closest total, breaking ties toward fewer plates. `PLATE_TOLERANCE = 5` cm counts as a fit.
- Migration: v3/v4 briefly had plates as floor tables. `loadState` turns any `plateS/M/L` table into a `long`.

### Joining tables (bordgrupper)

A joined set is **one table with one number** (user, explicitly). `table.group` holds a group id.

- `relabelRoom()` numbers a group as a single unit via its lead (`orderGroup()[0]`, lowest y then x), then copies the lead's label to every member and sets `table.lead` so only the lead draws a number and only the lead appears in the målliste. The lead also carries `groupInfo = { count, gaps }` so `print.html` renders the plate answer without redoing the maths.
- Gaps **inside** a group are excluded from `nearest()` and `tightPairs()` — that gap is the plate, not a passage fault. Forgetting this paints a joined table red.
- `gapBand()` gives the empty band between two members; `plateInserts()` draws one hatched strip per plate so the combination is visible on the map.
- Join/separate is one button in the drawer, acting on the nearest table.

## Tables

Five sizes, in `SIZES` order: two round (`small`, `big`) and three **bordplater** (`plateS`, `plateM`, `plateL`).

A **plate** is a tabletop panel fetched from storage and set on bases to build a long table — *not* a dinner plate. The user confirmed this on 2026-09-21. There are three types in the room. They want to mark the real ones with a colour or a number so staff know which to fetch; **they explicitly said not to build that marking yet** ("right now nothing, in the future maybe"), so the size keys are kept distinct and stable to make adding a `mark` field later a small change. Do not invent the marking UI unprompted.

The single old `long` size is gone. Both migrations are handled: a saved table with `size: "long"` becomes `plateL` in `loadState`, and saved `dims.long` / `est.long` become `dims.plateL` / `est.plateL` in `mergeDims`.

Tray (**Lager / ikke i bruk**) starts with **8 lite**, **6 stort**, and **one of each plate**. All **unnumbered**; tray labels are size only.

On the floor: big number + small size tag; hover title shows the cm. Selected floor table opens a drawer with all five sizes as a row (`#size-row`, rendered from `SIZES`), **Roter** shown only for plates, **Til lager**, plus the measurement block and nudge buttons.

`+ lite` / `+ stort` / `+ liten plate` / `+ medium plate` / `+ stor plate` add extra stock. **Tomt rom** resets tables but **keeps door positions, measurements, language, and the grid/mål toggles**.

Oval size existed in an older version; it is gone.

## Numbering (do not "next 1, 2, 3")

`relabelRoom()` runs on every drop, nudge, and when a table returns to the tray. Skip **13**. Sequence used: `1–12, 14, 15, 16`.

| Place | Number |
|---|---|
| Bottom-left column (`x < 42`), bottom → top | **1, 2, 3, 4, 5** |
| Right column (`x > 58`), top → bottom | **6, 7, 8, 9, 10**, then **11** only if a 6th right-side table exists |
| Middle top (`y ≤ 26`, `x` 38–62) | always **16** |
| Other mid, near top | **15** |
| Other mid, lower (under long table) | **12** |
| First langbord (lowest `y`) | always **14** |
| Extra langbord | whatever is left, assigned **last** |

User rules, in their words: middle top always 16, bottom left always 1, top right always 6, table 11 can be 10 sometimes (right side with five tables = 6–10, no 11).

**Order matters.** `"14"` is reserved in `used` *before* the round tables are numbered, but the extra plates are only assigned *after* every round has its position-based number. Get this wrong and three plates on the floor will steal `1` and `2` from the bottom-left column — that regression was hit and fixed on 2026-09-21.

### Manual numbers (1a / 1b)

Any floor table can be given a manual number: `table.manual` (max 4 chars, whitespace stripped). `relabelRoom()` reserves manual labels first, skips those tables in the automatic pass, and **leaves their position in the sequence intact** — so labelling the bottom two of a left column `1a` and `1b` leaves the ones above as 3, 4, 5 rather than shifting everything up. Each spot keeps its slot number. The drawer has a **Nummer** field and an **Auto** button; going back to the tray clears it. Duplicate numbers are flagged in the warnings. `labelSortKey()` sorts `1a` next to `1` in both the app and `print.html` — a plain `Number(label)` there sends it to the bottom as NaN, which was the original bug.

This covers the old 15a/15b intent; the auto-numberer still does not split 15 by itself.

## Doors / fixtures

Saved in `state.fixtures` (same localStorage). Drag:

- Left-wall double doors (`double-1`, `double-2`): slide **vertically** (`along` = y %).
- Bottom waitress door (`waitress`): slide **horizontally**.

Doors never go to the tray. Defaults: left 24% and 68%, bottom 50%. Positions are approximate until the user aligns them to real tables. Door positions are **not** part of the cm model yet — they are still raw percentages.

## Drag implementation

Pointer + mouse. Ghost clone (do **not** move the original node to `body` — that caused duplicate "12"s). `pointercancel` still drops at last point if the drag had moved. `setPointerCapture` is try/catch wrapped.

HTML5 `draggable` is unused on purpose.

## Print

`print.html` reads `norsken-layout-v3` and re-derives every centimetre from `dims` with the same formulas as the app. Only `zone === "room"` tables. Page 1: map at 205 mm tall with grid, rulers, doors and the scale caption. Page 2: **Målliste** table plus the aisle warnings. No wall words.

## What the user still owes / next work

**Plates: two of three widths are in.** Liten 37 and medium 49,5 are measured. Still guesses: **stor plate `w` (80)**, **every count `n` (2 each)**, and plate length `l` (90, which is just the langbord width). Also still guesses: **stort bord diameter (160)**, **langbord 90 × 220**, **old small chairs (45)**. The user was given this list on 2026-09-26; they measure on shift, so do not push mid-conversation.

**Chair ring.** Chairs are **54 cm** wide (`dims.chairBig`); there is also a set of old small chairs, `dims.chairSmall`, still a 45 cm guess — the user could not measure them because they were not at work. They get used at table 1 for **up to 8 people max**. The aisle check currently measures tabletop to tabletop, but a waitress walks between the backs of *occupied chairs*, not between tabletops — so a gap the board calls 90 cm can be much less in practice. The missing input is **how far a tucked-in chair projects past the table edge**. With that, draw a faint ring at table radius + projection and run `tightPairs()` against the ring instead of the top. This is what turns the board from "are the tables apart" into "can someone get through", which is the question the boss is actually asking. Ask for that one number — and note the user can only measure when they are on shift, so do not push for numbers mid-conversation; leave the ANSLAG badge and move on.

**Seat counts.** With `chairBig`/`chairSmall` in `dims`, a seat estimate per table is a small addition: circumference / chair width. 132 cm round gives 415 cm of edge = 7.7 chairs at 54 cm (matches the six covers in IMG_2481), or about 9 at 45 cm. The user's "8 max" at table 1 is a practical cap rather than a geometric one, so present any count as an estimate and let them override it. **Not built — do not add it unasked.**

They said they would send later:

1. **Remaining table measurements in cm** — stort, and the three plates. The user is measuring and reporting; a photo walkthrough of their tape shots was underway on 2026-09-21 (shot 1 = chair width 54, shot 2 = something on the middle long table, shots 3 and 4 not yet identified).
2. Photo of the **top-right corner**.
3. Accurate **door positions** vs tables (red marks on the original sketch were "not accurate"). Worth converting doors to cm at the same time.
4. **Maleri** (paintings) on the walls, each with a name.

Also still optional: 15a/15b split; plate ticks on langbord 14 (data field exists, layout UI does not show them).

## Putting plates in: drag, do not measure (2026-09-22)

The user asked for the extender and chose **drag a plate into the gap**, with the length decided by **the plates we actually own**. The flow is no longer "measure a gap, get a suggestion" — it is "drop plates in, the tables move apart to fit them".

- **`table.gapPlates`** lists the plate sizes filling the gap ABOVE/LEFT of that table, stored on the **downstream** member of a pair. A group's first member always has `gapPlates: null`.
- **`respaceGroup(groupId, anchorId)`** sets every gap to `gapWidthOf(member)` and lines all members up on one centre line. Runs after every insert, removal, and after dragging any member — that is what makes a joined set behave like one long table.
- **The plate rack** (`#plate-stack`, `renderPlateRack()`) shows each size with how much it fills and how many are free. One draggable chip per free plate, so stock is visible and enforced.
- **Dropping**: `findGap(pointCm)` takes the nearest eligible pair within `GAP_REACH` (260 cm); non-adjacent members of one group are skipped. `showGapTarget()` outlines the gap mid-drag.
- **Removing**: click a plate strip on the map; the gap closes and the chip returns.
- `bestPlate()` survives only as a **suggestion for an empty gap**. A gap with real plates reports those and is never flagged as a bad fit.
- `print.html` redoes none of it: `relabelRoom()` bakes `lead.groupInfo.strips` and `gaps[].plates`. Change the geometry, change `groupStrips()`, re-check the print.

### Two traps in that code

1. **`loadState()` runs before `state` exists.** Its normalisation must not call `orderGroup`, `centerCm` or `room()` — they read `state`, throw into the `catch`, and the user silently loses their whole layout. It sorts on raw percentages instead.
2. **`plateInserts()` and `seatNodes()` sit next to each other.** Replacing one by span deletes the other. Edit them by name.

## Guest names, cover counts, rotation (2026-09-22)

The A4 is a service sheet, so the **name matters more than the table number** (user: "the number table doesnt really matter ... we want name of the person instead when we print out a4").

- **`table.name`** — free text, 28 chars, edited beside the number (`#name-input`). When set it is the **big label on the map and the print**, number small underneath. `item0Label()` in `print.html` prefers it, and the printed table gets `.table.named`.
- **`table.guests`** is the cover count, and it is the SAME number as the chairs drawn (`seatsOf(table).length`), so ring and count cannot disagree. Stepper is in the label row; `table.seatCount` is the override, Auto deletes it.
- **`guests` is baked in `save()`, not `relabelRoom()`** — changing the people count does not renumber the room, so `relabelRoom()` never runs for it and the printout would keep a stale figure. Hit and fixed.
- **`ROUND_DEFAULT_SEATS = 4`.** A round table is laid for four. The old default was the perimeter sum (7 on a 132 cm table), which is what fits, not what is laid.
- **Rotation is on every size.** A rectangle swaps w/h. A circle looks identical rotated, so Roter turns its **chair ring by half a place** instead. `applySize()` and `loadState()` no longer force `rotated = false`.
- Going back to storage clears `name` with the number and the plates.
- **Navn** and **Personer** columns added to the maalliste and the printout.

## Layout traps (fixed 2026-09-22)

1. **Tray LANGBORD label.** Pill is 40 px, the word ~63 px, so it spilled onto the next pill. The tag now runs vertically.
2. **Ruler ticks under the fixtures.** `.ruler-layer` was `z-index: 1`, below the doors (4) and furniture (5), so metres 3 and 9 vanished. Now 7, still `pointer-events: none`.
3. **Top ticks under the window glass.** `.tick.top` sits at `top: 2.6%`. Not a pixel offset — the map scales.

## ANOTHER SESSION IS WRITING TO THIS FOLDER — read this first

A second cloud session, **`cse_01SQF8Uy9BdiQB2QUt1MbGw4`** (the user gave the id on 2026-09-22), has `F:\Norsken` open and keeps restoring `app.js`, `index.html`, `styles.css` and `print.html` to the **seat-marks branch**. It did it at 22:54 and again at 23:08, and it deleted `New folder/IMG_2461.JPG` once. It is not reachable from a session on this machine — `ListAgents` shows nothing — so it cannot be told to stop; the user has to close it.

**The trap it sets:** one of its overwrites landed *between* two commits of this session, so `f6ca239` and `0e6b50b` contain the REVERTED files even though their messages describe new work. `git status` looked clean the whole time.

So, working in this folder while that is unresolved:

- Never trust `git status` alone. Check the actual blob: `git hash-object app.js` against `git rev-parse HEAD:app.js`, or grep for a marker you know you added.
- Never `git add -A` on a tree you have not just verified — you will commit someone else's revert under your own message.
- Write, verify, commit in one go, then re-verify `git rev-parse HEAD:<file>`.
- **`fea1ffc` was the good build; `0998ab7` (2026-09-26) is fea1ffc + the old-table length + half-cm inputs.** `git checkout 0998ab7 -- app.js index.html styles.css print.html` puts it back.
- **It happened again before 2026-09-26:** the files on disk were the other session's 23:13 snapshot (`9ebe1ee`, plates back at 40/60, no plate rack). Restored as `5a5d84b`. `TRANSFER.md` on disk was that session's older copy too; this file replaced it.
- A session may connect the **old read-only `Y:\norsken`** instead of `F:\Norsken`. Request `F:\Norsken` folder access rather than working on Y.
- `git status` from `device_bash` can leave an empty `.git/index.lock` behind (the sandbox cannot unlink by default). Deleting it needs delete permission on `F:\Norsken`.

## Two versions collided on 2026-09-22

At 22:54, while a cloud session was working, **another AI session overwrote every file in `F:\Norsken`** with a branch that had setemerker but none of that day's measurement work. Nothing was lost: `a5451e5` holds the measurements and layout fixes, `c5bb015` the seat-marks version found on disk, and `2efceff` is the merge of both. If the files here ever look older than the git log again, suspect a second session on this folder before assuming a bug.

## Bugs already hit (do not regress)

1. Empty UI: leftover `copy.print` at top level crashed before `render()`. Keep `render()` in try/catch.
2. Duplicate tables / stuck "12"s: HTML5 drag + moving the real DOM. Use ghosts only.
3. Sequential numbering (1,2,3 by drop order) was wrong; must be **position-based** as above.
4. First python server bound `127.0.0.1` — phones saw nothing. Always `0.0.0.0:8765`.
5. Print map at 150 mm wide overflowed A4 and split the floor plan across two pages. It is now sized by **height** (205 mm) with width derived from the room aspect, and the list is forced onto its own page.
6. `print.html` must not assume `table.w` / `table.h` from storage. `app.js` still writes those percentages for backwards compatibility, but both files compute from `dims` so a size change is picked up everywhere.

## How to verify UI

User rule: if you change the web UI, actually use it. **Do not drive the user's PC** — no mouse, keyboard or browser on `DESKTOP-IP8U4OO`, even though its `F:\Norsken` folder is now the workspace. Writing files there is fine; taking over the desktop is not. Headless Chromium in the cloud sandbox is the way; `playwright` resolves from `/home/claude/.npm-global/lib/node_modules/playwright/index.js` (CommonJS, so `import pw from …; const { chromium } = pw`), browsers at `/opt/pw-browsers`, never run `playwright install`.

Checks that must pass: drag tray → floor (number appears), move on floor (number follows zone), drag back (number gone, tray unlabeled), Lite/Stort toggle, Roter on langbord, door drag + reload persists, nudge moves exactly one snap step, editing a cm value rescales the drawn table by the same ratio and clears that ANSLAG badge, målliste numbers match the drawer, aisle warnings appear only below the minimum, print tab shows only floor tables and the same numbers.

A full twelve-table room must number **1–10, 16, 14** — five left, five right (no 11), middle top 16, langbord 14.

## Original sketch numbering (user)

Left 1–5 from waitress door **up**. Right 6–11 from window **down**. 12 under the long table. Skip 13. Long table 14. 15/16 at the top (16 middle-top). Brown on the sketch = window (implemented as blue glass bar). Red = doors.

## Remote Control / phone photos

User wanted to attach photos from the phone. Remote Control toggle lives in the **Agents Window**, not the classic IDE sidebar. `/remote-control` only works there. This folder had no git until 2026-09-09; it does now, still **no remote**.

A separate cloud agent `bc-01a08342-2b32-7526-8ac8-d2a8227f27e3` is **not** this chat. Histories were not merged. Photos sent to that ID never reached this codebase.

## Transcript

Prior session: [Norsken layout board](1c6f0911-ec1b-4d6c-8b7c-2918c18350ae) (uuid without `.jsonl`).

## Hosted as a Claude artifact — shared plan (2026-11-11)

The board now also runs as the artifact **"Norsken bordplan"** (slug `c3d76e0f-c4e0-40ce-b649-53b1f164fe25`, https://claude.ai/artifact/RBdn3W3FKaBSeTCLVNaimr), published from the four files with `publish_files`. Capabilities declared: `db`, `user`, `downloads`. This is the answer to "host it": the boss plans, waitresses open the same link on their phones. No server on the PC needed. The owner shares it from claude.ai; viewers must be signed in.

- **Shared layout:** `tables`, `fixtures`, `furniture`, `dims` are written (debounced 700 ms) to db doc `plan/current` as `{plan: JSON string, writer, at}`. Language, grid/chair toggles, selection and brush stay per person. `onSnapshot` applies other writers' plans through `normalizeState()` (split out of `loadState()`); own echoes are skipped by comparing the plan string. Empty db on first open → this device's layout becomes the plan. A permission error flips to "Kun visning". Status chip `#sync-status`. Outside the artifact (`window.claude` absent) none of it runs and localStorage works as before.
- **No confirm()/print()/new tabs in the hosted frame.** "Tomt rom" and the new "Vanlig oppsett" ask with a second tap (`armed()`). "Skriv ut / PDF" in the artifact builds `print.html` with `window.__NORSKEN_STATE__` baked in and offers it via `downloads.save` as `norsken-oppsett-<date>.html`; opening that file prints. Locally the link still opens print.html.
- **Vanlig oppsett** (`presetLayout()`): 1–5 down the left (1 = stort, by the waitress door), 6–10 down the right, 16 top middle, langbord 14 in the middle; rest of the normal stock back to the tray. A SUGGESTION from the user's numbering rules + room photos, not measured. User to confirm sizes/positions.
- Cache-bust now `styles.css?v=22`, `app.js?v=23`.
- **Not committed to git**: device_bash was unavailable this session, files were written into F:\Norsken with device_commit_files. Next session with a shell: `git add app.js index.html print.html styles.css TRANSFER.md && git commit`.
- To republish after edits: `publish_files` with the slug and the live version (get_artifact).

### Langbord sizes per table (2026-11-11)

User: the langbord are **not all the same size**. Each `long` table can carry `table.custom = {w, l}` (cm, half-cm steps), edited in the drawer under "Mål på dette bordet"; "Bruk standard" clears it and the table falls back to `dims.long` from Mål. `customCm()` is checked first in `sizeCm()` (app and print.html), so seats, gaps, plates and the print all follow. The floor/tray tag shows `82,5×183` instead of "Langbord" when set. Drawer re-render after a size change is deferred one tick and restores focus, otherwise tabbing from width to length lost the length box. Republished as artifact version 1794402480-e48f.
