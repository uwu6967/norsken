---
title: Auto seating
tags: [norsken, seating, bookings, domino]
updated: 2026-11-21
---
# Auto seating

«Fordel bord automatisk» gives every booking that has no table one, following the house rules the
staff use when they re-seat the ResDiary list by hand: side tables in a set order, the big spots kept
for big parties, the middle langbord pulled out with plates for groups of 7+, and, when the room is
full, a table that can be laid again («↻ Dekk om»), with Domino as the last resort. All of it lives
in `assignBookings()` in `src/app.js` plus a few helpers. Bookings that already sit at a table on the
floor are never moved by it. This page walks through the function step by step, then covers the hand
moves that work with its result (`placeGuest()`, `moveParty()`, `placeGroup()`, `sendBackToList()`)
and the undo.

## Where it is started
- **«Fordel bord automatisk»** (`#book-run` in `src/index.html`, in the «Reservasjoner» tab, under
  the «Uten bord» list, next to «Ta alle av bordene» and «Tøm lista»). The click handler copies the
  «Prioritet» field into `state.bookingOrder` (cut to 120 characters, empty → the default), calls
  `assignBookings()`, then `save()` and `render()`, then shows a toast.
- **Picking a shift** on the start screen (a shift card with `data-choose`): `chooseShift()` stores
  the shift, puts out the shift's setup (`presetLayout()`) only when it is in Spisestua, the shift
  has a setup (Lunsj and «Lunsj + Arrangement» → lunch, Middag and «Middag + Arrangement» → usual;
  Arrangement alone has none) and that setup is not already out (`state.floorKind`), runs `guestSeats()` on every floor table, then `assignBookings()`. It shows its own toast
  («Lunsj: N bookinger ved bord, M uten bord (nytt oppsett). Klar til utskrift.»). See
  [[Shifts and start screen]].
- The toast after the button reads
  «Plasserte N, M i Domino, K venter på omdekking (↻, se «Uten bord»), J uten bord.» («Plasserte N»
  always; the other parts only when non-zero), plus «Ønske ikke oppfylt: Testa (bord 6/11).» for any
  booking whose wished table was not given. N counts tables given in this room, M bookings sent to
  Domino, K re-set suggestions, J the rest.
- «Alle har allerede bord.» is shown instead when, before the run, every booking in the whole list
  (all rooms, all shifts) had a `guests.placed` entry. No tables on the floor:
  «Ingen bord ute ennå – velg et oppsett under ★ Oppsett først.»
- The button's toast has **no «↶ Angre»** (no snapshot is taken). Undo exists for the shift pick and
  the hand actions; see «Undo» further down.

## Settings that steer it
All under ⚙ Innstillinger → «Bordfordeling» (`src/index.html`).

| UI | State field | Default | Notes |
|---|---|---|---|
| «Prioritet» (`#book-order`) | `state.bookingOrder` | `DEFAULT_BOOKING_ORDER` = `"3, 6, 5, 8, 10, 9, 11, 7, 2, 4"` | Cut to 120 chars; empty → default. In `SHARED_KEYS`, so it travels with the shared plan in the hosted copy. |
| «Når Spisestua er full»: «Dekk om et bord (↻)» (`#overflow-redeck`) / «Bruk Domino» (`#overflow-domino`) | `state.overflow` | `"redeck"` | `"redeck"` or `"domino"`. Two toggle buttons. Saved in the room's plan in localStorage (`norsken-layout-v3` for Spisestua), not in `SHARED_KEYS`. |
| «Minutter før et bord kan dekkes om» (`#sit-minutes`) | `state.sitMinutes` | `60` | The input has min 15, max 300, step 5; the change handler rounds and clamps to 15–300 (not a number → 60). Stored like `overflow`. |

`assignBookings()` reads the sitting time as `Math.max(15, Number(state.sitMinutes) || 60)`.

The rule list under the settings (`#book-rules`) is a fixed list of `<li>` lines (Norwegian or
English) written by `renderBookings()`; it does not change with the settings. The logic it describes
is in `softCap()`, `hardCap()` and `ruleOrder()`, below.

## Step 1 – which bookings it takes
```
guests.list.filter((g) => isUnplaced(g) && (g.area || "spisestua") === ROOM_ID && inShift(g))
```
- `isUnplaced(g)`: no entry in `guests.placed`, **or** placed in this room but the table is no longer
  on the floor (`guestTable()` returns null, e.g. the table went to the store «Lager / ikke i bruk»
  or a new setup was chosen). So nobody is lost when the floor changes.
- `g.area` is set at import by `areaOf()`: `"spisestua"` (empty, or text containing «spisest»),
  `"domino"`, or `"other:<lower-cased text>"`. A booking with no area counts as Spisestua. **Other
  rooms are never auto-seated**; they are placed by hand or with `placeGroup()`.
- `inShift(g)`: only bookings in the current shift (`SHIFT`, localStorage `norsken-shift`). With no
  shift picked (`""`, the whole day) every booking counts. See [[Shifts and start screen]].
- Each booking becomes `{ id, index, time, name, guests, forced: null, wish }` where
  `guests = Math.max(1, Number(g.pax) || 2)` (a missing party size counts as **2**) and
  `wish = wishedTables(g.note)`. `index` is the position in this filtered list.

Guests live in localStorage `norsken-guests-v1` (this browser only, never in the shared plan); see
[[Storage and data]].

## Step 2 – clean up and read the floor
1. `clearBookedNames()` deletes the legacy `table.redeck` / `table.redeckPax` on every table and
   clears tables still flagged `booked` from the old text-box flow (`name = null`, `seatCount`
   removed, `booked = false`).
2. `floor` = `roomTables()` (tables with `zone === "room"`) with `lead !== false` and a label. A
   langbord therefore counts **once**, by its lead half (see [[Chairs and plates]]). No floor tables
   → `bookingResult = { rows: [], spare: [], shared: false, noTables: true }` and stop.
3. `labelMap`: lower-cased label → table.
4. **`order`** (Spisestua): `state.bookingOrder` split on anything that is not an ASCII letter or
   digit (so æ/ø/å also split), lower-cased, keeping only labels that are on the floor **and** pass
   `isSideTable()`. **`side`**: the other side tables not named in the order, sorted with
   `byLabel()` (e.g. table 1, which is not in the default order). In Domino, `order` is every floor
   table by label and `side` is empty.
5. `isSideTable(table)`: not a langbord (`kind !== "plate"`), label not in
   `MIDDLE_LABELS = {"12", "14", "15"}`, and the centre `x` is `< 38` or `> 62` percent of the room
   width (in the default 700 cm wide Spisestua: left of 266 cm or right of 434 cm). `relabelRoom()`
   only gives the number 16 to a table whose centre is between 38 and 62 percent, so an
   automatically numbered 16 is never a side table; `ruleOrder()` adds it by name.
6. Tables that already hold guests (`guestsOn(t)`, which only counts bookings **in the current
   shift**) are marked **taken**. For each, `firstTime` records the earliest booking time in minutes
   (`minutesOf()`, which only reads `HH:MM`), and the table is marked **redecked** if any of its
   guests has the `guests.redeck` flag. A table holding only another shift's bookings counts as free.

## Step 3 – the order bookings are handled in
- Sorted by time (no time sorts as `"99"`, i.e. last), then by list position.
- **Locked bookings** (`forced`, the «B:7» / «bord 7» syntax) go first in the code, but this branch
  never runs: `assignBookings()` builds every row with `forced: null`. (`parseBookings()` does read
  the syntax, but `parseClipboardBookings()` drops the value too.)
- The rest are re-sorted with **wishers first**: a booking whose comment names a table goes ahead of
  the others, then by time, then by list position. That way nobody else takes a table someone asked
  for.

### `wishedTables(note)`
Reads table numbers from the ResDiary comment, in the order they were written, lower-cased and
without repeats: «Gjerne bord 6 eller 11», «ønsker bord 4», «bord 5/6», «bordene 3 og 4»,
«bord nr. 7». The pattern (case-insensitive) is the word `bord` / `bordene` (it must start a word, so
«langbord 14» does not count), an optional `nr.`, then numbers (1–2 digits plus an optional letter,
e.g. `1a`) separated by `,` `/` `og` `eller` `el` / `el.` `or` `-`. Note that `-` is a separator,
not a range: «bord 5-7» wishes for 5 and 7, not 6. Lines imported as plain text have no comment, so
no wishes.

## Step 4 – one booking at a time (Spisestua)
For each booking, in the order above, the first rule that gives a table wins.

### 4a. Wish, then house rules
```
pick = wish  that fits softCap
    || wish  that fits hardCap
    || ruleOrder list that fits softCap
    || ruleOrder list that fits hardCap
```
"Fits" = the label is on the floor, not taken, and the cap is ≥ the party size. A wish for a table
that is taken or too small is simply skipped; the rules take over. A wish for a langbord does not
fit (its soft cap is 0; see the exception for labels 4 and 5 below).

### `softCap()` / `hardCap()` – Danny's table rules (2026-11-13, Spisestua)
Soft = comfortable; hard = only when nothing comfortable is left. `softCap()` checks the rows top to
bottom; `hardCap()` only changes tables 4 and 5 and otherwise returns `softCap()`.

| Table | `softCap` | `hardCap` |
|---|---|---|
| any langbord (`kind === "plate"`) | 0 (pulled out for big groups instead, step 4b) | 0, except a langbord numbered 4 or 5 gets 6 (`hardCap()` checks those labels first) |
| 2 | 4 if the metal rectangle (`size === "rect"`), otherwise 2 | same |
| 5 | 3 (awkward spot) | 6 |
| 3 | 6 (the big spot) | 6 |
| 1 | 8 when it is the big table (`size === "big"`), else as the rows below | same |
| other rect tables (incl. 4 when rect) | 4 | same (4 for table 4) |
| 4 (not rect) | `tableCapacity()`: 4 small, 6 big, 8 oval | 6 |
| everything else | `tableCapacity()`: oval 8, big 6, otherwise 4 | same |

### `ruleOrder(guests, floor, order, side)`
`base = [...order, ...side]`, then (duplicates removed):
- **6 or more** (`guests > 5`): `16`, `3`, `1` (only if table 1 is a big table), every other big
  table on the floor (`size === "big"`, which is a round size; any label, so a big table in the
  middle counts too), then `base`.
- **4–5**: `3`, then `base`.
- **1–3**: `base` without `3`, and `3` last, so the big spot is kept for bigger parties.

Example with the default order and all tables out: a party of 2 tries 6, 5, 8, 10, 9, 11, 7, 2, 4,
then any other side table, then 3, first with soft caps (so 5 is fine for 2), then again with hard
caps. A party of 4 tries 3 first.

### 4b. Middle langbord for 7+
Only when nothing fitted and the party is **bigger than 6**: the first of `16`, `12`, `15`, `14` that
is on the floor, is a langbord (`kind === "plate"`) and is not taken. Table 14 is last because it is
the shared table for walk-ins. The booking is placed there and `planPlates(table, b.guests)` pairs
the half with a free half if needed (the nearest loose half on the floor within 4 m, else one from
the store), picks plates from stock, pulls the halves apart for that many people and sets the lead
half's `seatCount` (details in [[Chairs and plates]]). If no free half is found, `planPlates()` only
sets a note; the booking is still placed there. Smaller parties are never given a middle langbord;
they go to step 4c.

Note: this moves tables on the floor. Undo for the guest list (`restoreGuests()`) does not move them
back (only `undoFloor()` does, when a shift pick also changed the setup).

### 4c. Full: a table that can be laid again («↻ Dekk om»)
Only when `state.overflow !== "domino"`. Among floor tables that are taken (including tables given
out earlier in the same run), not already redecked, have a `firstTime`, whose first guests came at
least `sitMinutes` before this booking's time, and whose cap fits the party, the one whose first
guests came **earliest** is chosen — soft caps first, then hard caps. A booking with no time cannot
be redecked.

The booking is **not placed**. It gets `redeckAt`, the table is marked redecked (so one table is
suggested only once per run), and later `guests.redeckHint[id] = "<label>"` is saved. In «Uten bord»
it shows «↻ Dekk om · bord 7 blir ledig først». Staff then drag it onto the table themselves; see
`placeGuest()` below. (Decision: a re-set is only suggested, never placed by itself — see
[[Decisions]].)

### 4d. Nothing found
`table: null`. Such rows go on to Domino (step 6).

## Step 4 in Domino
When the open room is Domino (`ROOM_ID === "domino"`), bookings with area Domino are handled much
more simply: the first free table in label order with `tableCapacity() ≥ guests`. No caps table, no
wishes (they only change the processing order), no middle langbord, no redeck and no overflow.
For a langbord, `tableCapacity()` is its current chair count (`seatsOf(seatOwner(table)).length`),
or 4 if it has none.

## Step 5 – write the result
- `guests.redeckHint` is cleared **only for this run's bookings**, so running it in Domino does not
  wipe Spisestua's «dekk om» notes (and the other way round). Then `redeckHint[id]` is set for every
  `redeckAt` row.
- Placed rows: `guests.placed[id] = table.id`, `guests.room[id] = ROOM_ID`. The `guests.redeck`
  flag is removed for them (rows from this function never carry `redeck`, so it is always cleared).
- `guestSeats(t)` runs for every floor table, so each table gets chairs for its biggest sitting
  (same-time bookings add up, at most 40; see [[Chairs and plates]]). `guestSeats()` skips
  langbords (`kind === "plate"`): their seats come from `planPlates()` or by hand. Then
  `saveGuests()`.

## Step 6 – Domino: own bookings first, then overflow
Only when run from Spisestua:
1. `dominoArea`: bookings with `area === "domino"` that have no `guests.placed` entry at all and are
   in the shift. (Unlike step 1, a Domino booking whose Domino table was taken away is not picked up
   again here.) Domino's own bookings go straight to Domino, before any overflow.
2. `overflowToDomino([...dominoArea, ...rows with no table and no redeckAt])`. This runs in **both**
   overflow modes: with «Dekk om» only the bookings that could not get a re-set table go; with
   «Bruk Domino» step 4c is skipped, so every booking that did not fit goes. Domino is the last
   resort.

### `overflowToDomino(rows)`
1. `clearDominoBooked()` first (even when there are no rows): Domino tables whose chairs came from a
   booking that is gone (`seatFromGuest` and no booking placed there with room Domino) get their own
   chair count back (`seatBefore`), and legacy `booked` names are cleared. Written back at once.
2. The Domino plan is read straight from localStorage (`readRoomPlan("domino")`, key
   `norsken-layout-domino-v1`). If there is no stored plan with tables (Domino never opened), it
   starts from `dominoStarter()`: three langbord tables (`size: "long"`) of 90 × 160 cm (ANSLAG)
   numbered 1–3 on the floor, plus two loose halves and two small tables in the store.
3. Capacity in Domino (by `size`):
   - langbord (`"long"`): `2 × max(1, floor(length / max(20, chairBig)))` + 2 (one chair at each
     end), where length is the table's own `custom.l` or else `state.dims.long.l`. With the 90 × 160
     starter tables and the 54 cm chair that is **6**; a default 105 cm half gives 4.
   - oval 8, big 6, anything else 4.
4. Free tables = on the floor, lead, labelled, and not already holding a Domino booking (from **any**
   shift: this check does not use `inShift()`); sorted by number (non-numeric labels last).
5. **First fit**, in row order (Domino-area bookings first, then the leftovers in processing order):
   the first free table, not taken in this run, whose capacity fits. The booking gets
   `guests.placed`, `guests.room = "domino"`; the table gets `seatBefore` (once), `seatCount = party
   size`, `guests = party size` (read by `print.html`) and `seatFromGuest = true`. A booking that
   finds no Domino table stays in «Uten bord».
6. The plan is written straight back to localStorage. It does not go through `save()` or
   `scheduleShare()`. What it writes is guest data (`seatFromGuest`, `seatBefore`, the chair count,
   `guests`), which `layoutOnly()` strips from anything shared anyway; how this meets the hosted
   copy's shared Domino plan when Domino is opened is unclear.

After that the Domino-area rows are added to the result, `saveGuests()` runs again, rows are sorted
by time, and `bookingResult = { rows, spare, shared }` is kept in memory (not saved): `spare` = order
labels left free, `shared` = table 14 is on the floor. Only the toasts read `bookingResult`
(`rows`, `noTables`); `spare` and `shared` are not read anywhere in the current code. Last,
`relabelRoom()`.

## Hand moves that work with the result
These live in `src/app.js` next to the reservations list ([[Reservations list]]).

### `placeGuest(id, table)`
Dragging a name from «Uten bord» (or a name chip from a row in «Bordene») onto a table on the map or
a row in «Bordene».
- A langbord half hands over to its lead half.
- If the booking was the **only** booking at its old table (in the current shift), the whole party
  moves with `moveParty()` (and swaps if the target has guests).
- Otherwise the booking is placed: `guests.placed`, `guests.room = ROOM_ID`. If the target already
  has other guests **and** the booking has a `redeckHint`, it is marked as a second sitting
  (`guests.redeck[id] = true`) and the table's name (`guestLabel()`) gets «↻ » in front of that
  sitting; otherwise `redeck` is removed. The hint is removed either way. Then `guestSeats()` on the
  old table (if any) and the new one.

`unplaceGuest(id)` (the ✕ «Ta av bordet» on a name, or dropping it on the «Uten bord» area) removes
`placed`, `room` and `redeck` and gives the table its chairs back.

### `moveParty(from, to)` – move or swap
Every booking at `from` goes to `to`, and every booking at `to` goes to `from` (bookings in the
current shift, via `guestsOn()`). `swapSeatData()` swaps what belongs to the guests, not the table:
`seatMarks`, `seatNotes`, `seatNames`, `name`, `booked`. Then `saveGuests()`, `guestSeats()` on both
and `save()`. Used by:
- «Flytt» on a table row (`startMove()` → click the target on the map or in the list →
  `finishMove()`), toast «Flyttet fra bord 3 til 6.» or «Bord 3 og 6 byttet gjester.»
- dragging a table's name beside the map onto another table (`dropCallout()`).
- `placeGuest()` when the booking was alone at its table.

Dragging one **chair's** name (`dropCallout()` with a seat) only swaps that chair's entry with
`swapSeatEntry()`; dropped on a table, it takes the first chair without a name («Ingen ledig stol
ved bord N.» if there is none).

### `placeGroup(groupKey, table)` – a whole other-room group to one table
In «Uten bord», bookings from another room (area `other:…`) get a heading «Testklubben · 3 bookinger,
14 personer – eget rom, ikke på våre bord». The heading is draggable; dropped on a table (or a row in
«Bordene»), every unplaced booking with that `area` goes to that one table in one move
(`guests.room = ROOM_ID`, `redeckHint` removed), then `guestSeats()`. Same-time bookings add up, so
the table gets chairs for the whole group, and when they share a time its name shows as
«12:00 Testklubben · 14 pers» (`guestLabel()`). Toast «Testklubben (14 pers) ved bord 12.» with
«↶ Angre». Note: the members are picked with `isUnplaced()` only, not `inShift()`, so a group's
bookings in another shift come along too.

### `sendBackToList(table)`
Dragging a booked table (or its name beside the map) onto the left column. All its guests in the
current shift lose `placed`, `room` and `redeck`; the table stays where it is and gets its own chairs
back. Toast «Testa, Testb er tilbake i listen (bord 6 er ledig).» with «↶ Angre».

## Undo
- `guestSnapshot()` = a deep JSON copy of the whole `guests` object.
- `restoreGuests(snap)` puts it back, saves it, runs `guestSeats()` on every floor table, saves the
  plan and shows «Tilbake som før.».
- Taken before: «Ta alle av bordene», «Tøm lista», `sendBackToList()`, `placeGroup()` and
  `chooseShift()` (whose «↶ Angre» also calls `undoFloor()` if it changed the setup).
- Not covered: «Fordel bord automatisk» itself, tables moved by `planPlates()` (unless `undoFloor()`
  brings back the earlier floor), and changes written into the Domino plan by `overflowToDomino()`.

## Gotchas
- `assignBookings()` only seats bookings that have no table; to redo the whole room, press
  «Ta alle av bordene» first. That button clears every booking in this room in **all** shifts, and
  from Spisestua it also clears Domino's placements.
- Side tables are decided by **position** (x percent), not only by number; moving a table into the
  middle band takes it out of the order.
- `state.bookingOrder` is shared in the hosted copy, but `overflow` and `sitMinutes` are not. As the
  code reads, `applyRemote()` rebuilds `state` from the shared plan plus a fixed list of view fields
  that does not include them, so in the hosted copy both go back to `"redeck"` and `60` whenever a
  shared update arrives (including the first one when the page connects).
- Table numbers in the caps are exact strings (`"2"`, `"3"` …); a manual label like `3a` gets the
  default caps.
- A booking with no party size is seated as 2, but `guestSeats()` counts it as 0 chairs
  (`Number(g.pax) || 0`).

## Related
- [[Chairs and plates]]
- [[Reservations list]]
- [[ResDiary import]]
- [[Shifts and start screen]]
- [[Storage and data]]
- [[Rules]]
- [[Decisions]]
- [[Printing]]
- [[Testing]]
