---
title: Chairs and plates
tags: [norsken, seating, langbord, plates]
updated: 2026-11-21
---
# Chairs and plates

How many chairs a table has, where each chair stands, how the chairs follow the bookings and go back
again, and how langbord halves and bordplater (tabletop plates) are joined into one long table. It
exists because the printout has to match the real room: a waitress lays exactly the chairs on the
paper, and the plates the plan asks for are fetched from a small, counted stack in storage.
The logic is in `src/app.js`; the joined-langbord look is in `src/styles.css`; `src/print.html` only
reads the values `save()` and `relabelRoom()` bake onto each table (see [[Printing]]).

## Measures used
From `DEFAULT_DIMS` (`DIMS_VERSION = 11`), editable under «Mål» in ⚙ Innstillinger (the «Mål i cm»
panel, `FIELDS` / `renderMeasurePanel()`). ANSLAG = guess: `dims.est[size] === true`. Under «Mål»
such a field carries the word «anslag» (`<em class="est">`); in the plate rack line it shows as
« (anslag)». When a placeholder changes, bump `DIMS_VERSION`: `mergeDims()` then replaces saved
values that are still marked est, and never a value someone measured.

| Key | Value | Used for |
|---|---|---|
| `chairBig.d` | 54 cm, measured | Every chair: size on the map and distance from the table (`Math.max(20, chairBig.d)`) |
| `chairSmall.d` | 45 cm, ANSLAG | Only a field under «Mål» («Liten stol · bredde»); not used in the chair geometry |
| `cover.d` | 60 cm, ANSLAG | Table length one guest needs along a langbord (only `planPlates()`, at least 30) |
| `long` | 90 × 105 cm (w × l), ANSLAG | One langbord half. `table.custom = { w, l }` overrides it per table (clamped w 30–400, l 50–900), set in the half's drawer under «Mål på dette bordet»; «Bruk standard» removes it |
| `plateS` | w 37, l 90, n 2 (measured) | «liten plate» |
| `plateM` | w 49.5, l 90, n 4 (measured) | «medium plate» |
| `plateL` | w 55.5, l 90, n 2 (measured) | «stor plate» |
| `plateXL` | w 64, l 90, n 1 (measured) | «ekstra stor plate» |

For a plate, `w` is how much **gap** it fills, `l` its length across the table and `n` how many the
restaurant owns (field limits under «Mål»: `w` 10–400, `n` 0–12). Several plates can go into one
gap side by side.

## How many chairs: `seatCount(table)`
- A langbord half that is not the lead of its joined set → **0** (the lead carries every chair).
- `table.seatCount` is a finite number > 0 → `Math.min(40, seatCount)`.
- Otherwise **0**: `ROUND_DEFAULT_SEATS = 0`, `OVAL_DEFAULT_SEATS = 0` (2026-11-13: no chairs until
  people are added).

The number shown as «Personer» in the table drawer is `seatsOf(seatOwner(table)).length`.

What changes the count (all on `seatOwner(table)`, so on a joined langbord it is the lead):
- **«Personer» − / +** (`data-seats="-1"` / `"1"`): removes `seatFromGuest` and `seatBefore` (it is
  set by hand now), then `seatCount = clamp(1, 40, seatCount(table) + step)`, counting from the
  effective count, so − never goes below 1. On any langbord half (`size === "long"`) it calls
  `planPlates(picked, seatsOf(seatOwner(picked)).length + step)` instead: a loose half is paired up
  first, and the plates are chosen again, so the halves move apart or closer.
- **«Auto»** (`data-seats="auto"`): also removes `seatFromGuest` and `seatBefore`, and deletes
  `seatCount`, which means 0 chairs.
- **Bookings**: `guestSeats()`, below.
- **«Kortende»**: whenever `seatCount` is stored (by hand, by a booking or by `planPlates()`),
  `seatCount = clamp(1, 24, seatCount + newEnds − oldEnds)`, so the side chairs stay and the end
  chairs are added on top. With no stored count nothing is added (0 chairs stay 0).
- `planPlates()` sets the lead's count; `overflowToDomino()` sets Domino tables (see [[Auto seating]]).
- The ready-made setups in `presetLayout()` («Lunsj-oppsett», «Jul-oppsett») write `seatCount`
  (and sometimes `ends` / `endSide`) straight onto the tables they place.

## Chairs follow the party: `guestSeats(table)`
A table gets as many chairs as its **biggest sitting**, also when it had a set number of chairs
before. When the guests leave, it gets back the chairs it had. + / − after that is by hand.

```
guestSittings(table)  ->  [{ time, list, pax }]   // one entry per booking time
most = max(pax)
most > 0:  first time only: seatBefore = seatCount (or null), seatFromGuest = true
           seatCount = min(40, most)
most = 0 and seatFromGuest:  seatCount = seatBefore (or deleted);
                             seatFromGuest and seatBefore deleted
```
- `guestSittings(table)` takes `guestsOn(table)`, sorts by time (no time sorts last) and groups by
  the exact time string (`g.time || ""`); `pax` is the sum of `g.pax`.
  **Same time = one party sitting together, so their people add up.** Different times are a re-set
  (`guestLabel()` joins them with « / »).
  Example: Testa 12:00 (2) and Testb 12:00 (3) at table 6 → one sitting of 5 → 5 chairs. Add Testc
  at 14:00 (4) as a re-set → sittings 5 and 4 → still 5 chairs.
- The count can go **down** too: a table set for 6 that gets a party of 2 shows 2 chairs.
- `guestsOn()` only counts bookings placed at that table, in the current room, while the table is
  on the floor, and in the current shift (`inShift()`), so the chairs follow the shift.
- **Langbord are skipped** (`kind === "plate"` returns early). Their chairs come from `planPlates()`,
  + / −, «Kortende» or a ready-made setup, and `guestSeats()` never flags them `seatFromGuest`, so
  nothing gives them back automatically. Domino's three starter tables are langbord halves too
  (`dominoTablesAt()`: `size "long"`, `custom` 90 × 160); their counts come from
  `overflowToDomino()`, which *does* set `seatFromGuest` / `seatBefore`, so they are given back.
- Called from `placeGuest()`, `unplaceGuest()`, `moveParty()`, `placeGroup()`, `sendBackToList()`,
  `setGuestTime()`, `restoreGuests()`, `assignBookings()`, `setShift()`, `chooseShift()`, and for
  the tables that had guests in `importBookings()`, «Tøm lista» and «Ta alle av bordene».

## Giving chairs back
- **`releaseEmptySeats(tables)`** runs at the start of every `save()` over all tables. A table with
  `seatFromGuest` gets `seatBefore` back (or loses `seatCount`) unless it is on the floor and still
  has guests in the current shift. This covers tables sent to the store.
- **`releaseOtherRoomSeats()`** opens the other room's plan from localStorage (`readRoomPlan()`):
  Spisestua (`norsken-layout-v3`) when you are in Domino, otherwise Domino
  (`norsken-layout-domino-v1`). It does the same for its tables that no longer have a booking placed
  there in that room (no shift check). It writes the plan back only if something changed. Called by
  «Tøm lista» and `importBookings()` (a new list).
- **`clearDominoBooked()`** does it for Domino when seating is run from Spisestua (via
  `overflowToDomino()`), and on «Ta alle av bordene» in Spisestua. See [[Auto seating]].
- **Saving a setup** under «Mine oppsett» (`layoutSnapshot()`, stored in `norsken-presets-v1`):
  chairs given to a booking are not part of the layout, so `seatBefore` is put back and the
  `GUEST_FIELDS` are stripped: `name`, `booked`, `redeck`, `redeckPax`, `seatNames`, `seatNotes`,
  `seatMarks`, `seatFromGuest`, `seatBefore`, `seatsRender`. `layoutOnly()` does the same (and also
  drops `guests`) for the shared plan in the hosted copy, and `applyRemote()` keeps this device's
  own guest fields and booking-set `seatCount` when a shared update comes in.

Table fields involved: `seatCount`, `seatFromGuest` (true while the count comes from a booking),
`seatBefore` (the count before, or `null`). See [[Storage and data]].

## Where the chairs stand
`seatPositions(table)` = `baseSeatPositions(table)`, with any chair the waitress dragged moved to
its own angle from `table.seatAngles`. A chair's centre stands `chair × 0.62` outside the table edge
(chair = `max(20, chairBig.d)`), with its back to the room.

### Round tables
- Radius = diameter / 2 + chair × 0.62.
- **1–3 chairs**: backs to the nearest wall (Danny's sketch, 2026-11-12). The nearest wall comes
  from `clearances()`; that angle is shifted by `seatTurn − 45` degrees. 1 = towards the wall,
  2 = the two wall-side diagonals (wall ± 45°), 3 = those two plus one on the open side.
- **4 or more**: an even ring starting at the top (−90°) plus `turn`, where
  `turn = (rotated ? 180°/count : 0) + seatTurn`. With the default `seatTurn` of 45, four chairs
  stand on the diagonals.
- `seatTurn`: `makeTable()` gives 45 (oval 30); when `seatTurn` is missing, `normalizeState()` fills
  in 45 for a round table that is not rotated, else 0. «Snu stolene» ⟲ ⟳ (round tables only) turns it ±15°, kept in 0–359, and
  clears `seatAngles`.

### Rectangles, metal tables and the oval
- The table is "vertical" when its height ≥ width (after «Roter»).
- `ends = min(endSeatsOf(table), count)`; side chairs = count − ends; `perSide = ceil(sides / 2)`.
  The first long side (left or top) is filled first, then the other, each spaced at
  `(i + 0.5) / perSide` of the length.
- **End chairs go last**, so marks already on the side chairs keep their seat when an end is added.
- **Oval** (table 16): with no «Kortende» chosen and more than 6 chairs, it adds `min(2, count − 6)`
  end chairs by itself: 3 + 3 along the sides, then the top/left end (7), then the other end (8).
  From 9 chairs on, the extra chairs go on the sides (the two end chairs stay). For dragging,
  `seatRing()` treats it as a stadium (straight sides, half-round ends).

### «Kortende»: `ends` and `endSide`
- `table.ends` is 0, 1 or 2 (`normalizeState()` turns anything else into 0). Round tables always
  count 0 (`endSeatsOf()`), and the drawer does not show «Kortende» for them.
- `table.endSide` is `"start"` (top or left, the default) or `"end"` (bottom or right).
- `endSides()`: 2 → both ends; 1 → only the bottom/right end when `endSide === "end"`, else only the
  top/left end.
- The buttons come from `endChoices()`: «Ingen», «Øverst» / «Venstre», «Nederst» / «Høyre»,
  «Begge». Which words show depends on whether the table (or the joined langbord's run) is vertical.
  The value is stored on `seatOwner(table)`, i.e. the lead of a langbord. «Ingen» and «Begge» leave
  `endSide` as it was; only the one-end buttons set it.

### Chairs moved by hand: `seatAngles`
- Dragging a chair (after 6 px of movement): it follows the pointer round its table
  (`placeAround()` on `seatRing()`). On drop, `table.seatAngles[index] = angle` in degrees from the
  centre of `seatRing()` (the table centre, or the middle of the whole run on a joined langbord),
  rounded to 0.1.
- `placeAround()`: round = on the circle; oval = on the stadium; rectangle and joined langbord = slid
  along the edge, turned to face that side.
- While any chair has been moved, the drawer shows «Flyttede stoler» with **«Jevn ut stolene»**,
  which deletes `seatOwner(table).seatAngles`. Turning with ⟲ ⟳ also clears them.
- A plain click on a chair (no drag) is for seat marks and names, not moving: with a mark brush
  picked it toggles `seatMarks[index]`; with no brush (or the note / name brush) it opens the chair
  box (`openSeatEditor()`).

### `seatsOf(table)` – the chairs that count
Returns `[{ pos: { x, y, a }, index, mark }]` (`mark` from `table.seatMarks[index]`). Chairs that
`seatBlocked()` finds inside another member's tabletop or inside the gap band between two members
are dropped. That check only runs for a grouped table that is *not* a joined langbord (a joined
langbord's chairs are already laid along the whole run, so they are never filtered).

`seatsOf(t).length` is the cover count. It is baked into `table.guests` (in `save()` and
`relabelRoom()`), and the chair positions into `table.seatsRender` (in `save()`, floor tables only:
`x`, `y` in room percent, `mark`, `note`, `name`, and `a` rounded to whole degrees), so `print.html`
never redoes the geometry. See [[Printing]]. `seatMarks`, `seatNotes` and `seatNames` are objects
keyed by chair index.

### Clashes and visibility
- `seatClashes()` marks a chair red (class `clash`) when it is within chair × 0.3 of a wall, within
  chair × 0.9 of another table's chair, or within chair × 0.3 of another table's top (`obstacles()`
  is only the floor tables now; halves of the same langbord do not count against each other).
- «Skjul alle stoler» (`state.hideChairs`, the button in the «Bord» tab when no table is selected)
  hides the chairs on the map only (`seatNodes()` returns nothing); «Vis stolene» brings them back.
  The printout has its own toggle, `state.printNoChairs`: the «🪑 med stoler» / «🪑 uten stoler»
  chip in the top bar.
- «Med stoler» in ⚙ Innstillinger under «Vis på kartet» (`state.withChairs`, default on) makes the
  gap and clearance measures include the chairs: `occupiedCm()` adds chair × 1.12 on each side, but
  only for a table that has chairs.

## Langbord: halves, groups and plates

### The model
- A langbord is two (or more) **halves** (`size: "long"`, `kind: "plate"` – the kind name is
  historic and kept for the CSS class) that share `table.group = "g-" + uid()`. The starter tables
  include four halves, i.e. two langbord (`starterTables()`); they start loose in the store.
- **Plates are not tables.** They are inserts, listed in `gapPlates` on a half. (Old plans that had
  plates as tables get them turned back into halves by `normalizeState()`; the old `table.plates`
  field is always `null`.)
- Only halves can be joined: `gapCandidates()` needs both sides to be `size === "long"`, and
  «Sett sammen til langbord» only shows on a loose half. Round, oval and metal tables are never
  joined.

### Order, lead and number
- `groupAxis(members)`: `"y"` when the halves spread at least as much down the room as across,
  else `"x"`. `orderGroup()` sorts along that axis; the first is the **lead**.
- `relabelRoom()` sets `table.lead = !table.group || <is the lead>` (`leadOf()` = first of
  `orderGroup()`). The set is numbered as one table; the other halves copy the lead's label. Outside
  Domino: a langbord (or the oval, or a round/metal table) in the top-middle spot (y ≤ `TOP_MAX` 26 %,
  x 38–62 %) can become 16; of the other automatically numbered langbord the top-most gets 14, and
  further ones get the next free label. In Domino every table, langbord included, is numbered
  1, 2, 3 … from the top (a manual number is kept).
- `lead.groupInfo = { count, gaps, strips }` is rebuilt on every `relabelRoom()` (every other table
  gets `null`), for `print.html`:
  - `gaps` = `groupGaps(members)`: per gap `{ gap (cm), plates, tableId, plate }`, where `plate` is a
    `bestPlate()` suggestion only when nothing is inserted.
  - `strips` = `groupStrips(members)`: each inserted plate as a rectangle in room percent.
- Everything that takes a table – `placeGuest()`, `placeGroup()`, `finishMove()`,
  `guestDropTable()`, `normalizeLead()` – hands a non-lead half over to the lead.

### Chairs on a joined langbord
- `groupSeatLead(table)` returns the lead when the table is on the floor in a set of 2 or more where
  every member is a langbord half; otherwise `null`. `seatOwner(table)` = that lead, or the table
  itself.
- The lead carries every chair along the whole run, the other halves carry none. Guests sit along
  the plates too – the plates are tabletop. `groupRun(lead)` gives the run's axis, start, end,
  length, `across` (the narrowest member) and centre line; side chairs are spread over the full
  length and end chairs stand beyond the two ends.

### Plates in a gap: `gapPlates`
- `gapPlates` lives on the **downstream** half of a pair and lists the plate sizes filling the gap
  above or left of it. The first half's is always `null`. `normalizeState()` keeps only real plate
  sizes, only on grouped floor tables, sets the first half's to `null` and dissolves a group of one.
- `gapWidthOf(table)` = the sum of its plates' widths. **`respaceGroup(groupId, anchorId)`** moves
  the halves so every gap equals exactly its plates and all stand on the anchor's centre line, then
  `fitGroupInRoom()` nudges the whole set back inside the walls. You never measure a gap by hand:
  you drop plates in and the tables move apart.
- **Adding** (`addPlate(a, b, size)`): drag a plate chip from «Bordplater» in the store column
  («Lager / ikke i bruk», shown while «🧰 Verktøy» is on) into a gap; while it is in the air
  `showGapTarget()` outlines the gap it would drop into. `findGap()` picks the nearest half–half gap
  (`gapCandidates()`) whose middle is within `GAP_REACH = 260` cm of the drop point. `addPlate()`
  checks stock, joins the two halves if needed (merging their sets), refuses if they are not
  neighbours (the merge has already happened by then and is not undone), appends the size, respaces
  from the upstream half and renumbers. Messages (in the plate rack note): no gap found → «Plater
  passer bare i langbordet: slipp platen mellom to langbord-halvdeler.»; any `addPlate()` refusal
  (no stock, or not neighbours) → «Alle platene er i bruk.»
- **Removing** (`removePlate()`): click a plate on the map («Klikk for å ta bort»); the gap closes and
  the set is respaced from its first half.
- `clearGapPlates()` (sets `gapPlates = null`): a half that leaves the floor or its set gives its
  plates back to the rack. Dragging a half to the store (`placeTable()`) or pressing «Til lager» also
  clears its label, manual number, name and group; a set left with one half is dissolved, otherwise
  its new first half's plates are cleared and the set respaced.
- «Del langbordet i to» (in the group row of a joined half's drawer) takes the selected half out of
  the set and gives its plates back; a set left with one half is dissolved, otherwise the new first
  half's plates are cleared. Nothing is respaced or moved. «Sett sammen til langbord» (shown only on
  a loose half) calls `pairUp()`; with no free half it shows «Ingen ledig langbord-halvdel å sette
  sammen med.» in the plate rack note.
- Dragging any half of a joined set moves the whole set (`moveGroupBy()`, snapped) and respaces it
  from the dragged half, so the halves never swap and the plates stay put.

### Joined look: `joinLangbord(roomEl)`
Called at the end of `renderRoom()`. For each set whose members are all halves with **no plates**
and that really touch (`gapCm() ≤ 2` cm), the half nodes get the classes `joined`,
`joined-x` / `joined-y`, `join-before` / `join-after`. The CSS in `src/styles.css` removes the inner
rounded corners, the inner border and the shadow, so it reads as one table. With plates in the gap it
stays in parts, so you see where the plates go (see [[Decisions]]).

### Plate stock
- `plateOwned(size)` = `dims[size].n`, rounded and clamped to 0–12 (edited under «Mål»).
- `platesUsed()` counts the sizes in `gapPlates` on floor tables.
- `plateStock(size)` = owned − used (never below 0).
- `renderPlateRack()` shows one line per size, e.g. «liten plate · fyller 37 cm · 2/2 igjen» (with
  « (anslag)» after the cm if that plate is est), with one draggable chip per free plate, or «—»
  when none are left.
- `bestPlate(gap)` suggests plates for a gap with nothing in it: brute force over the **owned**
  stock (plates in use elsewhere are not subtracted), the total nearest the gap either way, ties to
  fewer plates; it "fits" within `PLATE_TOLERANCE = 5` cm. The drawer shows «Mellomrom 40 cm →
  forslag: liten plate = 37 cm — passer», or «(n cm for stor)» / «(n cm for liten)» when it does not
  fit; with no plates owned at all it shows «ingen plate lagt inn». A gap under 5 cm with no plates
  shows «Lukket – ingen plate». With plates in, the line lists them, e.g. «liten plate = 37 cm».

### People → plates: `planPlates(table, people)`
Type how many sit at a langbord and the board picks plates from what is in stock and pulls the
halves apart. Used by «Personer ved langbordet» + «Finn plater» in a half's drawer (2–40), by + / − on
a half, by auto seating for groups of 7+ ([[Auto seating]]), and by the «Jul-oppsett» setup
(`planPlates(julBig, 8)`).

1. `pairUp(table)`: an already joined set returns its halves. Otherwise the nearest loose half on the
   floor within 400 cm, else one from the store (put on the floor with the same rotation and custom
   size). The partner is put end to end (below when the half is vertical, else to the right), a new
   group is made and respaced. No half anywhere → «Ingen ledig langbord-halvdel å sette sammen med.»
2. The plates of every half except the first are set to `[]` (released back to stock).
3. `base` = the halves' total length along the run. `ends = endSeatsOf(lead)`.
   `cover = max(30, cover.d)`. `want = clamp(2, 40, people)`.
4. `perSide = ceil(max(0, want − ends) / 2)`; `need = max(0, perSide × cover − base)`.
5. Only when `need > 0` (otherwise no plates): `bestPlatesAtLeast(need, stock)` with
   `stock = plateStock()` per size: the **smallest** total that is at least `need`, ties to fewer
   plates. If even all free plates are too short, it takes all of them and marks the result short.
6. All plates go into the **first gap** (`members[1].gapPlates`), largest first; respace; fit in room.
7. `length = base + plates`. The lead gets `seatCount = want`, or when short
   `min(want, ends + 2 × floor(length / cover))`.
8. Note in the drawer: «8 personer → liten plate. Bordet blir 2,47 m.» or «For få plater: alle gir
   6,57 m, plass til 20.»

Worked numbers with the default measures (two 105 cm halves end to end, cover 60, full stock, no end
chairs):

| People | Need | Plates | Table |
|---|---|---|---|
| 6 | 0 | ingen plater | 2,10 m |
| 8 | 30 | liten plate | 2,47 m |
| 10 | 90 | stor plate + liten plate | 3,02 m |
| 12 | 150 | ekstra stor plate + medium plate + liten plate | 3,60 m |
| 14 | 210 | 2 × stor plate + 2 × medium plate | 4,20 m |
| 16 | 270 | 4 × medium plate + 2 × liten plate | 4,82 m |
| 21+ | 450+ | all 9 plates (447 cm) – short | 6,57 m, room for 20 |

An odd number plans like the next even one (`perSide` rounds up: 7 → as 8, 9 → as 10), but the
lead's `seatCount` is the number typed. Fewer plates are available when the other langbord already
uses some. The plate counts (`n`) are still the 2026-11-11 count from tape photos of the plate
stack (9 plates in four sizes); if the real stack differs, update «Mål».

## Related
- [[Auto seating]]
- [[Reservations list]]
- [[Printing]]
- [[Storage and data]]
- [[Render loop]]
- [[Decisions]]
- [[Rules]]
- [[Open questions and ideas]]
