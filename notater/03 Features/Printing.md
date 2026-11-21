---
title: Printing
tags: [norsken, printing, print-html, domino]
updated: 2026-11-21
---
# Printing

The printout is the one sheet of paper the staff work from during a shift: the table map of
Spisestua with every party's name on its table, and, when there is a guest list, the evening's
arrivals beside it with a box to tick when each party comes in. It is made by a separate page,
`src/print.html`, which reads the saved plan and guest list, draws them, and opens the print window
by itself. It exists as its own page (not a print stylesheet on the app) so that the paper can be laid
out for A4 with no browser margins, and so that the app never has to redo seat geometry: `src/app.js`
bakes what the printout needs into the saved plan. The root `print.html` and `extension/print.html` +
`extension/print.js` are generated from `src/print.html` by `tools/build.py` – never edit those.

## Where printing starts
- **«🖨 Skriv ut»** in the top bar (`#print-btn` in `src/index.html`). The markup says «Skriv ut / PDF»,
  but `renderChrome()` in `src/app.js` replaces it with «🖨 Skriv ut» / «🖨 Print». It is an
  `<a href="print.html" target="_blank">`.
- **«🖨 Skriv ut»** on the «☀ I dag» start screen (`#today-print`): closes the start screen and clicks
  `#print-btn`. See [[Shifts and start screen]].
- **«🪑 med stoler» / «🪑 uten stoler»** (`#print-chairs`, beside the print button): toggles
  `state.printNoChairs`, then `save()` + `render()`, toast «Utskriften blir uten stoler.» /
  «Utskriften blir med stoler.». It does **not** follow the on-screen «Skjul alle stoler»
  (`state.hideChairs`); `print.html` never reads `hideChairs`. (The comment above the
  «Skjul alle stoler» handler still says it affects the printout – it does not.)
- Inside the printout: «Skriv ut / lagre som PDF» (`#print`, class `no-print`, hidden on paper) calls
  `window.print()` again.

## How the data reaches print.html

### Locally (extension, downloaded zip, plain file)
The link opens `print.html` in a new tab on the same origin, so it reads the same localStorage as the
app. `save()` in `src/app.js` has already written everything. On `load` it waits 300 ms and calls
`window.print()` (not in embed mode).

### In the hosted copy
The hosted page blocks new tabs and `window.print`. The `#print-btn` click handler in `src/app.js`
(the block under «print in the hosted page») only acts when `window.claude?.use` exists:
1. `event.preventDefault()`, then asks for the `downloads` capability. If there is none, toast
   «Utskrift virker ikke på denne nettsiden. Bruk Norsken-utvidelsen (eller versjonen du lastet ned)
   og trykk «Skriv ut» der.»
2. `save()`, then gets the print page's source: in the built `index.html` from
   `window.__NORSKEN_PRINT_SRC__` (base64 of `src/print.html`, put there by `tools/build.py`), else
   `fetch("print.html")`.
3. Replaces the **first** `<script>` in that source with a script that sets four globals:
   `window.__NORSKEN_STATE__` (the whole `state`), `window.__NORSKEN_GUESTS__` (the whole `guests`),
   `window.__NORSKEN_ROOM__` (`ROOM_ID`) and `window.__NORSKEN_SHIFT__` (`SHIFT`). `<` in the JSON is
   written as `<`.
4. Saves it as `norsken-oppsett-YYYY-MM-DD.html` (date from `new Date().toISOString()`, so the UTC
   date) and shows «Utskriften er lastet ned (norsken-oppsett-….html). Åpne fila – da kommer
   utskriften opp av seg selv.»

That file has the guest names baked in (see [[Rules]] on privacy). It lives in Downloads, not in
localStorage.

### What print.html reads

| Input | Baked global (hosted copy) | Otherwise |
|---|---|---|
| Which room the sheet is (`ROOM_ID`) | `__NORSKEN_ROOM__` | `?room=spisestua` / `?room=domino`, default `"spisestua"` |
| The plan (`state`) | `__NORSKEN_STATE__` | localStorage `norsken-layout-v3` (Spisestua) or `norsken-layout-domino-v1` (Domino) |
| The other room's plan (`otherPlan`) | – never baked | localStorage of the other room's key |
| Guests (`guestStore`) | `__NORSKEN_GUESTS__` | localStorage `norsken-guests-v1` |
| Shift (`SHIFT`) | `__NORSKEN_SHIFT__` | localStorage `norsken-shift`, else `""` |

Because `otherPlan` is not baked, a baked file has no Domino tables to look at: a booking seated in
Domino then falls through to the «not on a table» path and shows «Domino» in the table column instead
of its table number (this follows from the code; not checked on paper).

Fields used from the plan: `tables[]` (`zone`, `lead`, `x`, `y`, `size`, `rotated`, `custom`, `label`,
`name`, `guests`, `seatCount`, `redeck`, `redeckPax`, `group`, `gapPlates`, `groupInfo`,
`seatsRender`), `dims`, `fixtures`, `lang`, `withChairs`, `printNoChairs`. From the guests:
`list[]` (`id`, `name`, `time`, `pax`, `note`, `area`, `areaLabel`, `event`), `placed`, `room`,
`arrived`, `redeck`, `redeckHint`. Shapes are on [[Storage and data]].

What `src/app.js` bakes for the printout:
- `save()` writes `table.guests` (= `seatsOf(table).length` for floor tables) and `table.seatsRender`:
  one entry per chair `{ x, y, mark, note, name, a }`, `x`/`y` in percent of the room, `a` the angle
  in degrees. See [[Chairs and plates]].
- `relabelRoom()` writes `lead.groupInfo = { count, gaps, strips }` on each langbord's lead table;
  `strips` are the plate inserts already in percent, so `print.html` never redoes `gapBand()` /
  `orderGroup()`.
- `overflowToDomino()` writes `guests` and `seatCount` on the Domino tables it uses (in Domino's
  stored plan), but not `seatsRender`.

### Shift filter
Only bookings in the chosen shift are printed. `print.html` has its own copy of the rule from
`inShift()` in `src/app.js`: same `EVENT_WORDS` regex, lunch is a time before 15:00, a booking with no
time counts as dinner, `g.event === true/false` (the boss's ★) overrides the words, and a combined
shift like `"middag+arrangement"` takes a booking if any part fits. `""` = the whole day. See
[[Shifts and start screen]].

## The sheet

### Page size
- Default `@page { size: A4 portrait; margin: 0 }`. Margin 0 means the browser prints no date, title,
  address or page number. The body has its own padding `6mm 8mm 0`.
- When there is a guest list (any arrival, see below) the script adds the class `with-list` on
  `<html>` and injects a second style: `@page { size: A4 landscape; margin: 0; }`. Then `.spread` is a
  flex row: map on the left, list on the right (gap 6 mm).
- Map height: `.room` is `276mm` on portrait (comment: 297 − 6 top − 9 date line − 6 bottom), `188mm`
  in landscape. Width follows from `aspect-ratio: <room w> / <room h>`.
- Header: only the print date and time, top left (`#meta`, `toLocaleString` in `nb-NO` or `en-GB`).
  The «Norsken» brand block is hidden with CSS.
- `document.title` is «Norsken — Spisestua» («Norsken — Dining room» in English). Language follows
  `state.lang`.
- Fonts Fraunces and Outfit come from Google Fonts; offline it falls back to Georgia / system-ui.

### The map
- **Grid**: a line every metre and a fainter one every half metre (`.grid-layer`). The metre numbers
  along the edges are built but never added to the page («no metre numbers along the edges on paper
  (Danny 2026-11-13)»).
- **Doors**: from `state.fixtures`, else the defaults `double-1` (left wall, 24 %), `double-2` (left
  wall, 68 %), `waitress` (bottom wall, 50 %).
- **Tables**: only `zone === "room"`. Size from `dims` (`DEFAULT_DIMS` in `print.html`, overridden by
  the saved `state.dims`), or the langbord's own `custom` w × l. Plate sizes (`plateS` … `plateXL`)
  count as `long` (`normSize()`); class `plate`, `oval`, `rect` or `round`.
- **Table label** (`item0Label()`): «a guest name beats a table number» – `table.name`, else the
  number. A table with a name (and `lead !== false`) gets class `named` and shows: the name, «Bord 6»,
  «4 pers» (from `table.guests`) and «↻ <time>» when `table.redeck` is set. A table without a name
  shows its number and «N pers».
- **Party name on the map** (`partyName()`): when bookings sit at a table, the table's printed name is
  rebuilt from them, so a typed table name no longer hides bookings. Bookings are grouped by time:
  «19:00 Testa, Testb»; «↻ » in front when any of them is a re-set; several times are joined with
  « / ». When more than one booking at the same time all come from the same other Område, it prints
  «<Område> · N pers» instead of the names.
- **Plate inserts**: one striped box per `groupInfo.strips` entry on each lead table.
- **`joinLangbord()`** (print copy): a langbord group of 2+ halves, all `long`/plate sizes, with no
  `gapPlates`, is drawn as one table – the borders and round corners where the halves meet are
  removed. The axis is the direction the halves spread most. Differences from `joinLangbord(roomEl)`
  in `src/app.js`: the app also checks that the halves really touch (gap ≤ 2 cm) and uses CSS classes;
  the print copy does not check the gap and sets inline styles. See [[Chairs and plates]].
- **`fitNames()`**: every `.table.named` name starts at 8.5 pt and shrinks by 0.5 pt until it fits the
  table (width and height), never below 5 pt. Runs once, and again when `document.fonts.ready`
  resolves. Long names shrink instead of breaking mid-word (`word-break: keep-all`).

### Chairs
Drawn from `table.seatsRender` – none at all when `state.printNoChairs` is true.
- Size: `dims.chairBig.d` (fallback 54 cm). Each chair is turned by its angle `a` (+90°) and gets a
  thicker `border-top` (2.5 px).
- **Marks**: a chair with `mark` is filled with the mark's colour and shows its code. `SEAT_MARKS` in
  `print.html` is a copy of the one in `src/app.js`:

| Code | Key | Norwegian | Colour |
|---|---|---|---|
| G | `gluten` | Gluten | `#2a78d6` |
| L | `laktose` | Laktose | `#eb6834` |
| N | `notter` | Nøtter | `#1baf7a` |
| S | `skalldyr` | Skalldyr | `#eda100` |
| D | `diabetes` | Diabetes | `#e87ba4` |
| Gr | `gravid` | Gravid | `#008300` |
| V | `vegetar` | Vegetar | `#4a3aa7` |
| Vg | `veganer` | Veganer | `#5f7d1f` |
| P | `pescetar` | Pescetarianer | `#1f8fb0` |
| A | `annet` | Annet | `#e34948` |
| Ø | `onske` | Ønske (a food wish, not an allergy) | `#ffe14d` |

  Text colour is black or white from `inkOn()` (relative luminance above 0.42 → `#1d1812`).
- **Chair note** (`note`): a small yellow «✱» on the chair; the note is listed under «✱ Notater».
- **Name on a chair** (`name`): a small label just outside the chair (1.15 × chair size along its
  angle); also listed under «Navn på stol».

## The arrivals list (right side)
Shown only when there is at least one arrival. Title `#list-title`: «Ankomster», plus « · » and the
shift name when a shift is chosen – e.g. «Ankomster · Middag», «Ankomster · Middag + Arrangement»
(English «Arrivals · Dinner»). With the whole day it is just «Ankomster».

### Who is on it
`arrivals[]` is built from three sources, in this order:
1. **Tables in this room** (`state.tables`, floor, `lead !== false`), via `addTable()`. Every booking
   in the shift with `guests.placed[id] === table.id` and room = this room gets a row. If a table has
   no bookings: a row for its `table.redeck` («↻» time + name, pax `redeckPax` or `guests`), and a row
   for a typed `table.name` (a leading «19:00» is split off as the time by `timeOf()`).
2. **Tables in the other room** (`otherPlan`), the same way, except that a table's `redeck` row is
   only made for this room and the party name is only rebuilt on this room's map.
3. **Every booking in the shift not seated above** («Uten bord», other rooms, waiting for a re-set).
   Its table column (`where`) is: «↻ bord N» when `guests.redeckHint` has a hint; the Område name for
   an `other:` area; the room name («Domino») when it belongs to the other room; else empty.

### Grouping and order
Grouped by room (`groupOf()`): a seated row goes under its room; otherwise an `other:` area is its own
group named after `areaLabel`; else Spisestua or Domino. Order: Spisestua first, Domino second, then
the other rooms alphabetically (`localeCompare` on the label); inside a group by time (no time last),
then table number. Each group starts with a heading row: «Spisestua · 12 bookinger · 41 gjester»
(«booking» when there is one).

### Columns
«✓» · «Tid» · «Navn» · «Pers» · «Bord» · «Kommentar» (English: ✓ · Time · Name · Ppl · Table ·
Comment).
- **✓** – an empty 4 mm box to tick by pen; it already holds «✓» when the party was ticked off in the
  app (`guests.arrived[id]`). See [[Reservations list]].
- **Bord** – the table number; a table in the other room gets the room name in front («Domino 3»).
  A booking in its own other room with no table of ours shows «–». A booking with no table shows
  `where` or «uten bord».
- **Kommentar** – in this order:
  1. **Diet codes** from the booking's comment: `dietTagsOf(note)` (a copy of `dietTags()` in
     `src/app.js`, same `DIET_WORDS` regexes; «allerg»/«intoleran» with no known word gives `annet`),
     drawn as the coloured code boxes above.
  2. **Chair marks** on that table, once per table (the first row of the table carries them), e.g.
     «G ×2».
  3. **Double-booking note** (`clashes()` / `doubleNote()`): the same name (lower case, spaces
     squeezed) booked more than once in the list. Under 90 minutes apart (or a time missing):
     red «⚠ dobbeltbooking? også <room> <time>». Further apart: a quiet «↔ også <room> <time>» (cards
     in 1772 first, dinner later is normal). Only rows from the guest list (with an `id`) count, not
     typed table names. Same rule as `doubleOf()` / `doubleChip()` in `src/app.js`.
  4. «↻ dekk om» when the booking is a re-set.
  5. The booking's own comment text.

### Stats boxes
A row of boxes above the table (`.stats`): «N bookinger», «N gjester» (sum of pax), «N bord i bruk»
(distinct room + table among seated rows, both rooms), and «6, 9, 11 ledige bord» – floor tables in
**this** room with a number and no seated row (shown only when there are any).

### Below the table
Added to the list section in this order, each only when it has content:
- «Navn på stol»: «Bord 6: <name>» for each chair with a name.
- Legend of the marks in use, then «Merket: N» (number of marked chairs).
- «✱ Notater»: «Bord 6: <note>» for each chair note.

### `fitList()` – one page
Only with `with-list`. Sets CSS `zoom` on the list section and lowers it in steps of 0.04 while the
list is taller than the map (+4 px); the loop stops once zoom is at or below 0.5 (last step 0.48).
Runs once and again after `document.fonts.ready`.

## Without a guest list
With no arrivals the sheet is portrait and shows only the map. The list section is
`display: none !important` unless `with-list` is set («no second page (Danny 2026-11-13)»), so the
old «Målliste» (table sizes, distances from window and left wall, nearest table) and the extras below
it are still built but not seen. With no tables at all the list would say «Ingen bord på gulvet ennå.»
– also hidden.

## Domino on the same sheet
When printing Spisestua locally, Domino is put beside the map, small, if it is in use.
- Conditions: not embed mode, `ROOM_ID === "spisestua"`, and **not** a baked file
  (`!window.__NORSKEN_STATE__`) – so the hosted copy's download never has the Domino corner.
- `dominoInUse()` reads `norsken-layout-domino-v1` and `norsken-guests-v1`. In use = Domino has floor
  tables (`zone === "room"`, `lead !== false`) **and** either a booking is placed with
  `guests.room[id] === "domino"`, or a floor table has `name`, `redeck`, `seatCount > 0` or a non-empty
  `seatsRender`. Since `save()` bakes `seatsRender` for every floor table, a saved Domino floor with
  chairs counts as in use even with no bookings.
- Size (mm): Spisestua is set to `mainH` = 188 (landscape) or 252 (portrait). Domino column width
  `sideW` = 48 in landscape, else `max(40, 194 − mainW − 5)` where `mainW = mainH × room w / room h +
  3.7` (the frame). Height keeps Domino's proportions: `(sideW − 1.6) × h / w + 1.6`, with Domino's
  `dims.room` or the placeholder 500 × 650.
- It is an `<iframe>` (`#domino-frame`) loading `print.html?room=domino&embed=1`, under the title
  «Domino».
- **Embed mode** (`embed=1`, class `embed` on `<html>`): no header, no button, no Domino side, the room
  fills the frame (`height: 100vh`, 3 px border). Tables show **only their numbers** – no names, no
  «N pers» (`item0Label()`: «the small Domino corner: just the number, the names are in the list»).
  It does not open the print window. Domino's bookings are in the arrivals list of the main sheet.
- The iframe draws Domino's chairs from Domino's own stored plan, and uses Domino's own
  `printNoChairs`. `overflowToDomino()` does not write `seatsRender`, so chairs for tables filled from
  Spisestua can be missing or out of date until Domino has been opened and saved (see
  [[Open questions and ideas]]).

## Switched off on paper (code still there)
- «Trenger plate» (plates per langbord gap): `if (false && plateLines.length)` – «not on paper any
  more (Danny 2026-11-18)».
- The «For trangt for servitør» distance warnings: `if (true) warnEl.innerHTML = ""`.
- The old side table («Gammelt bord»): `furniture` is an empty array.
- The metre numbers (see the map).
CSS for `.window` and `.corner` exists but no element uses it.

## When you change print.html
- `tools/build.py` asserts that `src/print.html` has **exactly one** `<script>` (followed by a new
  line): it is moved to `extension/print.js` because Manifest V3 forbids inline scripts. The hosted
  copy's bake also replaces the first `<script>` it finds. So: one inline script, no `<script>` text
  before it.
- `print.html` keeps its own copies of rules from `src/app.js`: `SEAT_MARKS`, `DIET_WORDS` /
  `dietTagsOf()`, `EVENT_WORDS` / `inShift()`, the double-booking rule and `joinLangbord()`. Change
  one, change both.
- Run `python3 tools/build.py` afterwards and test with made-up names ([[Testing]]).

## Related
- [[Chairs and plates]]
- [[Reservations list]]
- [[Shifts and start screen]]
- [[Storage and data]]
- [[Files and build]]
- [[Extension, website and releases]]
- [[ResDiary import]]
- [[House map]]
- [[Rules]]
- [[Decisions]]
- [[Open questions and ideas]]
- [[Testing]]
