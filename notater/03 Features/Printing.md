---
title: Printing
tags: [norsken, printing, print-html, domino]
updated: 2026-11-21
---
# Printing

The printout is the one sheet of paper the staff work from during a shift: the table map of
Spisestua with every party's name on its table, and, when there is anything to list, the evening's
arrivals beside it with a box to tick when each party comes in. It is made by a separate page,
`src/print.html`, which reads the saved plan and guest list, draws them, and opens the print window
by itself. It exists as its own page (not a print stylesheet on the app) so that the paper can be laid
out for A4 with no browser margins, and so that the page never has to redo seat geometry: `src/app.js`
bakes what the printout needs into the saved plan. A salon (Bar, Toddy, Møterom, 1772 …) prints its
own map the same way, without the guest list. The root `print.html` and `extension/print.html` +
`extension/print.js` are generated from `src/print.html` by `tools/build.py` (the built root
`index.html` also carries a base64 copy of it) – never edit those.

## Where printing starts
- **«🖨 Skriv ut»** in the top bar (`#print-btn` in `src/index.html`). The markup says «Skriv ut / PDF»,
  but `renderChrome()` in `src/app.js` replaces it with «🖨 Skriv ut» / «🖨 Print». It is an
  `<a href="print.html" target="_blank" rel="noopener">`. In a salon, `renderChrome()` sets the link to
  `print.html?room=<room id>`. In Domino the link stays plain `print.html`, so printing from Domino
  locally gives the Spisestua sheet (comment in `print.html`: «The sheet is always Spisestua (Domino
  goes beside it when it is in use)»).
- **«🖨 Skriv ut»** on the «☀ I dag» start screen (`#today-print`, step 3): calls `closeToday()` and
  then clicks `#print-btn`. See [[Shifts and start screen]].
- **«🪑 med stoler» / «🪑 uten stoler»** (`#print-chairs`, next to the print button in the same
  `.print-group`; English «with chairs» / «no chairs»): toggles `state.printNoChairs`, then `save()` +
  `render()`, toast «Utskriften blir uten stoler.» / «Utskriften blir med stoler.» (3 s). It does
  **not** follow the on-screen «Skjul alle stoler» (`state.hideChairs`); `print.html` never reads
  `hideChairs`. (The comment above the «Skjul alle stoler» handler in `src/app.js` still says it
  affects the printout – it does not.)
- Inside the printout: the «Skriv ut / lagre som PDF» button (`#print`, English «Print / save as PDF»)
  calls `window.print()` again. It sits in a `<p class="no-print">`, so it is hidden on paper.

## How the data reaches print.html

### Locally (extension, downloaded zip, plain file)
The link opens `print.html` in a new tab on the same origin, so it reads the same localStorage as the
app. `save()` in `src/app.js` has already written everything. On `load` it waits 300 ms and calls
`window.print()` (not in embed mode).

### In the hosted copy
The hosted page blocks new tabs and `window.print`. The `#print-btn` click handler in `src/app.js`
(the block under the comment «print in the hosted page») only acts when `window.claude?.use` exists:
1. `event.preventDefault()`, then asks for the `downloads` capability. If there is none, toast
   «Utskrift virker ikke på denne nettsiden. Bruk Norsken-utvidelsen (eller versjonen du lastet ned)
   og trykk «Skriv ut» der.»
2. `save()`, then gets the print page's source. `src/app.js` itself only has
   `await (await fetch("print.html")).text()`; `tools/build.py` rewrites that line in the built
   `index.html` to read `window.__NORSKEN_PRINT_SRC__` first (base64 of `src/print.html`, which the
   build also writes into the built `index.html`) and fall back to the fetch.
3. Replaces the **first** `<script>` tag in that source with a new script that sets four globals,
   followed by the original `<script>` tag – so the globals script runs just before the page's own
   script. The globals: `window.__NORSKEN_STATE__` (the whole `state`), `window.__NORSKEN_GUESTS__`
   (the whole `guests`), `window.__NORSKEN_ROOM__` (`ROOM_ID`, the room the app is in) and
   `window.__NORSKEN_SHIFT__` (`SHIFT`). `<` in the two JSON blobs is written as `<`.
4. Saves it with `downloads.save()` as `norsken-oppsett-YYYY-MM-DD.html` (date from
   `new Date().toISOString()`, so the UTC date) and shows «Utskriften er lastet ned
   (norsken-oppsett-….html). Åpne fila – da kommer utskriften opp av seg selv.» A refusal with
   `error.code === "declined"` is ignored silently; other errors go to the console.

That file has the guest names baked in (see [[Rules]] on privacy). It lives in Downloads, not in
localStorage. Because `__NORSKEN_ROOM__` is the current room, a download made while the app is in
Domino or a salon is that room's sheet, not Spisestua's (follows from the code).

### What print.html reads

| Input | Baked global (hosted copy) | Otherwise |
|---|---|---|
| Which room the sheet is (`ROOM_ID`) | `__NORSKEN_ROOM__` | `?room=<id>` for any id in `ROOM_NAMES` (Spisestua, Domino and the eleven salons, same ids as `ROOM_DEFS` in `src/app.js`); missing or unknown → `"spisestua"` |
| The plan (`state`) | `__NORSKEN_STATE__` | localStorage key from `roomKey()`: `norsken-layout-v3` (Spisestua), `norsken-layout-domino-v1` (Domino), `norsken-layout-<id>-v1` (a salon) |
| The other room's plan (`otherPlan`) | – never baked | localStorage of the other room's key (Domino for Spisestua and vice versa); never read for a salon |
| Guests (`guestStore`) | `__NORSKEN_GUESTS__` | localStorage `norsken-guests-v1`; never read for a salon |
| Shift (`SHIFT`) | `__NORSKEN_SHIFT__` | localStorage `norsken-shift`, else `""` |

A salon (`IS_SALON`: any room other than Spisestua and Domino) gets no guest list and no other room,
so its sheet is the map plus at most rows made from names (or re-sets) typed on its own tables (see
«Who is on it»).

Because `otherPlan` is not baked, a baked file reads it from the localStorage of wherever the file is
opened, which normally does not hold the plan: a booking seated in Domino then falls through to the
«not on a table» path and shows «Domino» in the table column instead of its table number (this
follows from the code; not checked on paper).

Fields used from the plan: `tables[]` (`id`, `zone`, `lead`, `x`, `y`, `size`, `rotated`, `custom`,
`own`, `piece`, `label`, `name`, `guests`, `seatCount`, `redeck`, `redeckPax`, `group`, `gapPlates`,
`groupInfo`, `seatsRender`), `dims`, `fixtures`, `lang`, `withChairs`, `printNoChairs`. (`withChairs`
only feeds the distance maths of the hidden «Målliste» and warnings, not whether chairs are drawn.)
From the guests: `list[]` (`id`, `name`, `time`, `pax`, `note`, `area`, `areaLabel`, `event`),
`placed`, `room`, `arrived`, `redeck`, `redeckHint`. Shapes are on [[Storage and data]].

What `src/app.js` bakes for the printout:
- `save()` writes `table.guests` (= `seatsOf(table).length` for floor tables, `null` otherwise) and
  `table.seatsRender`: one entry per chair `{ x, y, mark, note, name, a }`, `x`/`y` in percent of the
  room, `a` the angle in whole degrees (0 when unknown). See [[Chairs and plates]].
- `relabelRoom()` writes `lead.groupInfo = { count, gaps, strips }` on each langbord's lead table
  (`groupGaps()` / `groupStrips()`); `strips` are the plate inserts already in percent, so
  `print.html` never redoes `gapBand()` / `orderGroup()`.
- `overflowToDomino()` writes `guests` and `seatCount` on the Domino tables it uses (in Domino's
  stored plan), but not `seatsRender`.

### Shift filter
Only bookings in the chosen shift are printed (names typed on tables are not filtered). `print.html`
has its own copy of the rule from `inShift()` / `isEvent()` in `src/app.js`: same `EVENT_WORDS`
regex (tested on `areaLabel || area` and on `note`), lunch is a time before 15:00, a booking with no
time counts as dinner, `g.event === true/false` (the boss's ★) overrides the words, and a combined
shift like `"middag+arrangement"` takes a booking if any part fits. `""` = the whole day. One small
difference: the print copy reads a time that starts «19:00» or «19.00», while `minutesOf()` in the
app only takes an exact «HH:MM». See [[Shifts and start screen]].

## The sheet

### Page size
- Default `@page { size: A4 portrait; margin: 0 }`. Margin 0 means the browser prints no date, title,
  address or page number. The body has its own padding `6mm 8mm 0`.
- When there are arrivals (see below; not in embed mode) the script adds the class `with-list` on
  `<html>` and injects a second style: `@page { size: A4 landscape; margin: 0; }`. Then `.spread` is a
  flex row: map on the left, list on the right (gap 6 mm).
- Map height: `.room` is `276mm` on portrait (comment: 297 − 6 top − 9 date line − 6 bottom), `188mm`
  in landscape; with the Domino corner it is set to 252 mm / 188 mm (see below). Width follows from
  `aspect-ratio: <room w> / <room h>`.
- Header: only the print date and time, top left (`#meta`, `toLocaleString` in `nb-NO` or `en-GB`).
  The «Norsken» brand block is hidden with CSS.
- `document.title` is «Norsken — <room>», e.g. «Norsken — Spisestua» («Norsken — Dining room» in
  English). Language follows `state.lang`.
- Fonts Fraunces and Outfit come from Google Fonts; offline it falls back to Georgia / system-ui.

### The map
- **Grid**: a line every metre and a fainter one every half metre (`.grid-layer`). The metre numbers
  along the edges are built but never added to the page («no metre numbers along the edges on paper
  (Danny 2026-11-13)»).
- **Doors**: from `state.fixtures`, else the defaults `double-1` (left wall, 24 %), `double-2` (left
  wall, 68 %), `waitress` (bottom wall, 50 %).
- **Tables**: only `zone === "room"` (lead tables and the other halves of a langbord). Size from
  `dims`, or the table's own size: `custom` w × l for a langbord half, `own` w × l for other tables
  (`customCm()`); `rotated` swaps width and length. `dims` is `DEFAULT_DIMS` in `print.html` with
  these keys taken from the saved `state.dims`: `room`, `small`, `big`, `oval`, `sidebord`, `long`,
  `plateS`–`plateXL`, `aisle`, `est`. `rect` and `chairBig` are **not** taken over, so a changed size
  for those in the app does not reach the paper. Plate sizes (`plateS` … `plateXL`) count as `long`
  and an unknown size as `small` (`normSize()`); class `plate` (for `long`), `oval`, `rect` or
  `round`.
- **Table label** (`item0Label()`, comment «a guest name beats a table number»): `table.name`, else the
  number (`label`). A `piece` prints its name instead («Flygel» / «Grand piano»). A table with a name
  (`lead !== false`, not embed mode) gets class `named` and shows: the name, «Bord 6», «4 pers» (from
  `table.guests`, when set) and «↻ <text>» with the whole `table.redeck` text when that is set. A
  table without a name shows its number and «N pers». (`table.redeck` / `redeckPax` are older fields:
  the current `src/app.js` only clears them in `clearBookedNames()`.)
- **Party name on the map** (`partyName()`): when bookings sit at a table, the table's printed name is
  rebuilt from them, so a typed table name no longer hides bookings. Bookings are grouped by time:
  «19:00 Testa, Testb»; «↻ » in front when any of them is a re-set (`guests.redeck[id]`); several
  times are joined with « / ». When more than one booking at the same time all come from the same
  other Område (`area` starting `other:`), it prints «<areaLabel> · N pers» instead of the names.
- **Plate inserts**: one striped box per `groupInfo.strips` entry on each lead table.
- **`joinLangbord()`** (print copy): a langbord group of 2+ halves, all `long`/plate sizes, with no
  `gapPlates`, is drawn as one table – the borders and round corners where the halves meet are
  removed. The axis is the direction the halves spread most. Differences from `joinLangbord(roomEl)`
  in `src/app.js`: the app also checks that the halves really touch (gap ≤ 2 cm) and uses CSS classes
  (`joined`, `join-before`, `join-after`); the print copy does not check the gap and sets inline
  styles. See [[Chairs and plates]].
- **`fitNames()`**: every `.table.named` name starts at 8.5 pt and shrinks by 0.5 pt until it fits the
  table (width and height), never below 5 pt. Runs once, and again when `document.fonts.ready`
  resolves. Long names shrink instead of breaking mid-word (`word-break: keep-all`).

### Chairs
Drawn from `table.seatsRender` – none at all when `state.printNoChairs` is true.
- Size: always 54 cm. The code reads `dims.chairBig.d` with fallback 54, but `dims` in `print.html`
  never has `chairBig` (see «Tables» above), so the app's «Stol · bredde» setting is not used on
  paper. Each chair is turned by its angle `a` + 90° (−90 when `a` is missing) and gets a thicker
  `border-top` (2.5 px).
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

  Text colour is black or white from `inkOn()` (relative luminance above 0.42 → `#1d1812`, else
  `#ffffff`).
- **Chair note** (`note`): a small «✱» on a yellow dot on the chair; the note is listed under
  «✱ Notater».
- **Name on a chair** (`name`): a small label just outside the chair (1.15 × chair size along its
  angle); also listed under «Navn på stol».
- With «uten stoler» the chair loop runs over nothing, so «Navn på stol», the mark legend and
  «✱ Notater» are empty too. The marks in the «Kommentar» column still show, because `marksAt()`
  reads `seatsRender` directly.

## The arrivals list (right side)
Shown only when there is at least one arrivals row – a booking, or a name or re-set typed on a table,
so it can appear without any imported guest list. Title `#list-title`: «Ankomster», plus « · » and
the shift name when a shift is chosen – e.g. «Ankomster · Middag», «Ankomster · Middag +
Arrangement» (English «Arrivals · Dinner»). With the whole day it is just «Ankomster».

### Who is on it
`arrivals[]` is built from three sources, in this order:
1. **Tables in this room** (`state.tables`, floor, `lead !== false`), via `addTable()`. Every booking
   in the shift with `guests.placed[id] === table.id` and room (`guests.room[id]`, default
   `spisestua`) = this room gets a row. If a table has no bookings: a row for its `table.redeck`
   («↻» time + name, pax `redeckPax` or `guests`), and a row for a typed `table.name` (a leading
   «19:00» is split off as the time by `timeOf()`; pax `guests` or `seatCount`).
2. **Tables in the other room** (`otherPlan`), the same way, except that a table's `redeck` row is
   only made for this room and the party name is only rebuilt on this room's map.
3. **Every booking in the shift not seated above** («Uten bord», other rooms, waiting for a re-set).
   Its table column (`where`) is: «↻ bord N» when `guests.redeckHint` has a hint (N is the table
   label); the Område name (`areaLabel`) for an `other:` area; the room name («Domino») when
   `guests.room` puts it in the other room; else empty.

### Grouping and order
Grouped by room (`groupOf()`): a seated row goes under its room; otherwise an `other:` area is its own
group named after `areaLabel`; otherwise the room its `area` names (`spisestua` / `domino`), and only
when the area is not a known room id, its `guests.room` (default Spisestua). Order: Spisestua first,
Domino second, then the other groups alphabetically (`localeCompare` on the label); inside a group by
time (no time last), then table number. Each group starts with a heading row: «Spisestua · 12
bookinger · 41 gjester» («booking» when there is one).

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
  2. **Chair marks** on that table, once per table (the first row of the table carries them): each
     code box, followed by «×2» etc. when more than one chair has it.
  3. **Double-booking note** (`clashes()` / `doubleNote()`): the same name (lower case, spaces
     squeezed) on more than one row of the sheet. Under 90 minutes apart (or a time missing):
     red «⚠ dobbeltbooking? også <group> <time>». Further apart: a quiet «↔ også <group> <time>»
     (cards in 1772 first, dinner later is normal). `<group>` is the other row's group label (room or
     Område). Only rows from the guest list (with an `id`) count, not typed table names. Same name
     key and 90-minute limit as `doubleOf()` / `doubleChip()` in `src/app.js`, but the app compares
     against the whole `guests.list`, while the printout only sees rows on the sheet (this shift).
  4. «↻ dekk om» when the row is a re-set.
  5. The booking's own comment text.

  Items 3–5 are joined with « · ».

### Stats boxes
A row of boxes above the table (`.stats`): «N bookinger» (all arrivals rows, typed table names and
re-set rows included), «N gjester» (sum of pax), «N bord i bruk» (distinct room + table among rows
that have a table, both rooms), and «6, 9, 11 ledige bord» – floor lead tables in **this** room with
a number and no row on them (shown only when there are any).

### Below the table
Added to the list section in this order, each only when it has content:
- «Navn på stol»: «Bord 6: <name>» for each chair with a name.
- Legend of the marks in use, then «Merket: N» (number of marked chairs).
- «✱ Notater»: «Bord 6: <note>» for each chair note.

### `fitList()` – one page
Only with `with-list`. Sets CSS `zoom` on the list section and lowers it in steps of 0.04 while the
list is taller than the map (+4 px); the loop stops once zoom is at or below 0.5 (last step 0.48).
Runs once and again after `document.fonts.ready`.

## Without arrivals
With no arrivals rows the sheet is portrait and shows only the map. The list section is
`display: none !important` unless `with-list` is set («no second page (Danny 2026-11-13)»), so the
old «Målliste» (table sizes, distances from window and left wall, nearest table) and the extras below
it («Navn på stol», legend, «✱ Notater») are still built but not seen. With no tables at all the list
would say «Ingen bord på gulvet ennå.» – also hidden.

## Domino on the same sheet
When printing Spisestua locally, Domino is put beside the map, small, if it is in use.
- Conditions: not embed mode, `ROOM_ID === "spisestua"`, and **not** a baked file
  (`!window.__NORSKEN_STATE__`) – so the hosted copy's download never has the Domino corner.
- `dominoInUse()` reads `norsken-layout-domino-v1` and `norsken-guests-v1`. In use = Domino has floor
  tables (`zone === "room"`, `lead !== false`) **and** either a booking is placed with
  `guests.room[id] === "domino"`, or a floor table has `name`, `redeck`, `seatCount > 0` or a non-empty
  `seatsRender`. The shift is not checked. Since `save()` bakes `seatsRender` for every floor table, a
  saved Domino floor with chairs counts as in use even with no bookings.
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
  [[Open questions and ideas]]). Likewise, a Domino plan written only by `overflowToDomino()` (Domino
  never opened) has no `dims`: the frame is then sized for 500 × 650 while the map inside uses
  `DEFAULT_DIMS.room` 700 × 1360 (follows from the code; not checked on paper).

## Switched off on paper (code still there)
- «Trenger plate» (plates per langbord gap): `if (false && plateLines.length)` – «not on paper any
  more (Danny 2026-11-18)».
- The «For trangt for servitør» distance warnings: `if (true) warnEl.innerHTML = ""`.
- The old side table («Gammelt bord»): `furniture` is an empty array.
- The metre numbers (see the map).
CSS for `.window` and `.corner` exists but no element uses it.

## The aperitif sheet (`apero.html`)
A second printout, A4 standing, for the aperitif evening. Redesigned on 2026-11-23 (Danny: it does not
have to look like the old paper sheet): three designs were built and judged on real tasks – the door,
the salons, the pling, walk-ins – and the «pling» design won, with the door list of another grafted on.
- **Top:** «APERITIFF», the date, parties and guests, and a boxed «Pling 18:00 – da går alle til bordet
  under → Bord». One legend line in plain words, only what is on the page (opptatt / ledig / reservert,
  «Atheneum ❹ = Atheneum, bord 4», «D 1 = Domino, bord 1», «skriv inn», diet codes).
- **Left: one block per salon** (Toddy, Bar, Arneberg, Blå værelset, Atheneum): a black band with the
  name and «2 selskap · 12 pers. · 1 ledig», the map (grey = taken, hatched = reserved, the furniture
  word on each piece, name boxes beside their tables – with the table number as a tab when a box is not
  tight against its table), and **the room's own pling list**: Nr · Gjest · Pers · **→ Bord** (the
  dinner table, biggest and boldest). Free tables get a «ledig · 4–7 pl.» write-in row.
- **Right: «Gjesteliste» A–Å** for the door: letter gutter, 5–6 mm tick boxes (pre-ticked when already
  arrived), Navn · Pers · Tid · Plass («Arneberg ❸») · → Bord; a dashed line to write in a place when a
  party has none. Under it «Ledige bord» and at least 5 lines «Uten booking». On a busy night the
  walk-in block moves under the salons so the list keeps its size.
- Names: break only at a space or after a hyphen; two lines on quiet nights, smaller or cut only when
  crowded; never under 7.5 pt with ≤ 20 parties (7 pt otherwise). A map name that would still be cut is
  left off (the table stays grey and numbered; the list beside it has the name); a map too crowded for
  readable names shows numbers only.
- Always exactly one page (checked 0–48 parties, Norwegian and English); prints at full size (ink 196 ×
  282 mm). On a phone the page is laid out 820 px wide and zoomed out, never cut.
- Started by the links marked `data-apero-sheet` («🖨 Aperitiff-ark» in Reservasjoner's 🥂 list, «🥂
  Aperitiff-ark» on «☀ I dag» when the aperitif is on). Their click handler first writes
  `norsken-apero-sheet` (`aperoSheetData()`); in the hosted copy it downloads a baked
  `norsken-aperitiff-YYYY-MM-DD.html` instead. `?noprint=1` stops the automatic print (for tests).

## When you change print.html
- `tools/build.py` asserts that `src/print.html` has **exactly one** `<script>` (followed by a new
  line): it is moved to `extension/print.js` because Manifest V3 forbids inline scripts. The hosted
  copy's bake also puts its globals in front of the first `<script>` it finds. So: one inline script,
  no `<script>` text before it.
- `print.html` keeps its own copies of things from `src/app.js`: `ROOM_NAMES` (= `ROOM_DEFS`),
  `SEAT_MARKS`, `inkOn()`, `DEFAULT_DIMS`, `DIET_WORDS` / `dietTagsOf()`, `EVENT_WORDS` / `inShift()`,
  the double-booking rule and `joinLangbord()`. Change one, change both.
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
