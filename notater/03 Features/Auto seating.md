---
title: Auto seating
tags: [norsken, seating, bookings, domino]
updated: 2026-11-21
---
# Auto seating

«Fordel bord automatisk» gives every booking that has no table one, following the house rules the
staff use when they re-seat the ResDiary list by hand: side tables in a set order, the big spots kept
for big parties, the middle langbord pulled out with plates for groups of 7+, and, when the room is
full, either a table that can be laid again («↻ Dekk om») or Domino. All of it lives in
`assignBookings()` in `src/app.js` plus a few helpers. Bookings that already sit at a table are never
moved by it. This page walks through the function step by step, then covers the hand moves that work
with its result (`placeGuest()`, `moveParty()`, `placeGroup()`, `sendBackToList()`) and the undo.

## Where it is started
- **«Fordel bord automatisk»** (`#book-run` in `src/index.html`, in the Reservasjoner tab under
  «Uten bord»). The click handler copies the «Prioritet» field into `state.bookingOrder`, calls
  `assignBookings()`, then `save()` and `render()`, then shows a toast.
- **Picking a shift** on the start screen: `chooseShift()` puts out the shift's setup if needed,
  runs `guestSeats()` on every floor table, then `assignBookings()`. See [[Shifts and start screen]].
- The toast after the button reads
  «Plasserte N, M i Domino, K venter på omdekking (↻, se «Uten bord»), J uten bord.» (each part only
  when non-zero), plus «Ønske ikke oppfylt: Testa (bord 6/11).» for any booking whose wished table
  was not given. If nobody was without a table before the run: «Alle har allerede bord.» No tables on
  the floor: «Ingen bord ute ennå – velg et oppsett under ★ Oppsett først.»
- The button's toast has **no «Angre»** (no snapshot is taken). Undo exists for the shift pick and
  the hand actions; see «Undo» further down.

## Settings that steer it
All under ⚙ Innstillinger → «Bordfordeling» (`src/index.html`).

| UI | State field | Default | Notes |
|---|---|---|---|
| «Prioritet» (`#book-order`) | `state.bookingOrder` | `DEFAULT_BOOKING_ORDER` = `"3, 6, 5, 8, 10, 9, 11, 7, 2, 4"` | Cut to 120 chars. In `SHARED_KEYS`, so it travels with the shared plan in the hosted copy. |
| «Når Spisestua er full»: «Dekk om et bord (↻)» / «Bruk Domino» | `state.overflow` | `"redeck"` | `"redeck"` or `"domino"`. Saved in the room's plan in localStorage, not in `SHARED_KEYS`. |
| «Minutter før et bord kan dekkes om» (`#sit-minutes`) | `state.sitMinutes` | `60` | Input clamps to 15–300 (step 5). Per browser, like `overflow`. |

`assignBookings()` reads the sitting time as `Math.max(15, Number(state.sitMinutes) || 60)`.

The rule list under the settings (`#book-rules`) is plain text written by `renderBookings()`. The
logic it describes is in `softCap()`, `hardCap()` and `ruleOrder()`, below.

## Step 1 – which bookings it takes
```
guests.list.filter((g) => isUnplaced(g) && (g.area || "spisestua") === ROOM_ID && inShift(g))
```
- `isUnplaced(g)`: no entry in `guests.placed`, **or** placed in this room but the table is no longer
  on the floor (`guestTable()` returns null, e.g. the table went to the store or a new setup was
  chosen). So nobody is lost when the floor changes.
- `g.area` is set at import by `areaOf()`: `"spisestua"`, `"domino"` or `"other:<text>"`. A booking
  with no area counts as Spisestua. **Other rooms are never auto-seated**; they are placed by hand
  or with `placeGroup()`.
- `inShift(g)`: only bookings in the current shift (`SHIFT`, localStorage `norsken-shift`). See
  [[Shifts and start screen]].
- Each booking becomes `{ id, index, time, name, guests, forced: null, wish }` where
  `guests = Math.max(1, Number(g.pax) || 2)` (a missing party size counts as **2**) and
  `wish = wishedTables(g.note)`.

Guests live in localStorage `norsken-guests-v1` (this browser only, never in the shared plan); see
[[Storage and data]].

## Step 2 – clean up and read the floor
1. `clearBookedNames()` deletes the legacy `table.redeck` / `table.redeckPax` on every table and
   clears tables still flagged `booked` from the old text-box flow (`name = null`, `seatCount`
   removed, `booked = false`).
2. `floor` = `roomTables()` with `lead !== false` and a label. A langbord therefore counts **once**,
   by its lead half (see [[Chairs and plates]]). No floor tables → `bookingResult.noTables` and stop.
3. `labelMap`: lower-cased label → table.
4. **`order`** (Spisestua): `state.bookingOrder` split on anything that is not a letter or digit,
   lower-cased, keeping only labels that are on the floor **and** pass `isSideTable()`.
   **`side`**: the other side tables not named in the order, sorted with `byLabel()` (e.g. table 1,
   which is not in the default order). In Domino, `order` is every floor table by label and `side`
   is empty.
5. `isSideTable(table)`: not a langbord (`kind !== "plate"`), label not in
   `MIDDLE_LABELS = {12, 14, 15}`, and the centre `x` is `< 38` or `> 62` percent of the room width
   (in the 700 cm wide Spisestua: left of 266 cm or right of 434 cm). Table 16 stands in the middle
   band, so it is never a side table; `ruleOrder()` adds it by name.
6. Tables that already hold guests (`guestsOn(t)`) are marked **taken**. For each, `firstTime`
   records the earliest booking time in minutes (`minutesOf()`), and the table is marked
   **redecked** if any of its guests has the `guests.redeck` flag.

## Step 3 – the order bookings are handled in
- Sorted by time (no time sorts as `"99"`, i.e. last), then by list position.
- **Locked bookings** (`forced`, the «B:7» / «bord 7» syntax) go first in the code, but `forced` is
  always `null` for the guest list: `parseBookings()` understands the syntax, yet
  `parseClipboardBookings()` drops the value. In practice this branch does not run.
- The rest are re-sorted with **wishers first**: a booking whose comment names a table goes ahead of
  the others, then by time, then by list position. That way nobody else takes a table someone asked
  for.

### `wishedTables(note)`
Reads table numbers from the ResDiary comment, in the order they were written:
«Gjerne bord 6 eller 11», «ønsker bord 4», «bord 5/6», «bordene 3 og 4», «bord nr. 7». The pattern
is `bord` / `bordene`, an optional `nr.`, then numbers (1–2 digits plus an optional letter, e.g.
`1a`) separated by `,` `/` `og` `eller` `el.` `or` `-`. Note that `-` is a separator, not a range:
«bord 5-7» wishes for 5 and 7, not 6. Lines imported as plain text have no comment, so no wishes.

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
that is taken or too small is simply skipped; the rules take over. A wish for a langbord never fits
(its caps are 0).

### `softCap()` / `hardCap()` – Danny's table rules (2026-11-13, Spisestua)
Soft = comfortable; hard = only when nothing comfortable is left.

| Table | `softCap` | `hardCap` |
|---|---|---|
| any langbord (`kind === "plate"`) | 0 (pulled out for big groups instead, step 4b) | 0 |
| 2 | 2 if round, 4 if the metal rectangle (`size === "rect"`) | same |
| 3 | 6 (the big spot) | 6 |
| 4 | `tableCapacity()` (4 small, 6 big) or 4 if rect | 6, or 4 if rect |
| 5 | 3 (awkward spot) | 6 |
| 1 | 8 when it is the big table (`size === "big"`), else `tableCapacity()` | same |
| other rect tables | 4 | same |
| everything else | `tableCapacity()`: oval 8, big 6, otherwise 4 | same |

### `ruleOrder(guests, floor, order, side)`
`base = [...order, ...side]`, then (duplicates removed):
- **6 or more** (`guests > 5`): `16`, `3`, `1` (only if table 1 is a big table), every other big
  round table on the floor (any label, so a big table in the middle counts too), then `base`.
- **4–5**: `3`, then `base`.
- **1–3**: `base` without `3`, and `3` last, so the big spot is kept for bigger parties.

Example with the default order: a party of 2 tries 6, 5, 8, 10, 9, 11, 7, 2, 4, then any other side
table, then 3, first with soft caps (so 5 is fine for 2), then again with hard caps. A party of 4
tries 3 first.

### 4b. Middle langbord for 7+
Only when nothing fitted and the party is **bigger than 6**: the first of `16`, `12`, `15`, `14` that
is on the floor, is a langbord (`kind === "plate"`) and is not taken. Table 14 is last because it is
the shared table for walk-ins. The booking is placed there and
`planPlates(table, b.guests)` pairs the half with a free half if needed, picks plates from stock and
pulls the halves apart for that many people (details in [[Chairs and plates]]). Smaller parties are
never given a middle langbord; they go to step 4c.

Note: this moves tables on the floor. Undo for the guest list (`restoreGuests()`) does not move
them back.

### 4c. Full: a table that can be laid again («↻ Dekk om»)
Only when `state.overflow !== "domino"`. Among floor tables that are taken, not already redecked,
have a `firstTime`, and whose first guests came at least `sitMinutes` before this booking's time
(and whose cap fits the party), the one whose first guests came **earliest** is chosen — soft caps
first, then hard caps. A booking with no time cannot be redecked.

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
  (see [[Chairs and plates]]), then `saveGuests()`.

## Step 6 – Domino: own bookings first, then overflow
Only when run from Spisestua:
1. `dominoArea`: bookings with `area === "domino"` that are not placed anywhere and are in the
   shift. Domino's own bookings go straight to Domino, before any overflow.
2. `overflowToDomino([...dominoArea, ...rows with no table and no redeckAt])`. This runs in **both**
   overflow modes: with «Dekk om» only the bookings that could not get a re-set table go; with
   «Bruk Domino» step 4c is skipped, so every booking that did not fit goes. Domino is the last
   resort.

### `overflowToDomino(rows)`
1. `clearDominoBooked()` first: Domino tables whose chairs came from a booking that is gone get their
   own chair count back (`seatBefore`), and legacy `booked` names are cleared. Written back at once.
2. The Domino plan is read straight from localStorage (`readRoomPlan("domino")`, key
   `norsken-layout-domino-v1`). If Domino was never opened, it starts from `dominoStarter()`: three
   langbord tables of 90 × 160 cm (ANSLAG) numbered 1–3 on the floor, plus two loose halves and two
   small tables in the store.
3. Capacity in Domino:
   - langbord: `2 × max(1, floor(length / max(20, chairBig)))` + 2 (one chair at each end). With the
     90 × 160 starter tables and a 54 cm chair that is **6**; a default 105 cm half gives 4.
   - oval 8, big 6, anything else 4.
4. Free tables = on the floor, lead, labelled, and not already holding a Domino booking; sorted by
   number (non-numeric labels last).
5. **First fit**, in row order (Domino-area bookings first, then the leftovers in processing order):
   the first free table whose capacity fits. The booking gets `guests.placed`, `guests.room = "domino"`;
   the table gets `seatBefore` (once), `seatCount = party size`, `guests = party size` (read by
   `print.html`) and `seatFromGuest = true`. A booking that finds no Domino table stays in «Uten bord».
6. The plan is written straight back to localStorage. It does not go through `save()` or
   `scheduleShare()`; how the hosted copy's shared Domino plan picks this up is unclear.

After that the Domino-area rows are added to the result, `saveGuests()` runs again, rows are sorted
by time, and `bookingResult = { rows, spare, shared }` is kept in memory (not saved): `spare` = order
labels left free, `shared` = table 14 is on the floor. Last, `relabelRoom()`.

## Hand moves that work with the result
These live in `src/app.js` next to the reservations list ([[Reservations list]]).

### `placeGuest(id, table)`
Dragging a name from «Uten bord» (or from one table) onto a table on the map or a row in «Bordene».
- A langbord half hands over to its lead half.
- If the booking was the **only** party at its old table, the whole party moves with
  `moveParty()` (and swaps if the target has guests).
- Otherwise the booking is placed: `guests.placed`, `guests.room = ROOM_ID`. If the target already
  has other guests **and** the booking has a `redeckHint`, it is marked as a second sitting
  (`guests.redeck[id] = true`) and the table's name gets «↻ » in front of that sitting. The hint is
  removed either way. Then `guestSeats()` on both tables.

`unplaceGuest(id)` (the × on a name, or dropping it on the «Uten bord» area) removes `placed`, `room`
and `redeck` and gives the table its chairs back.

### `moveParty(from, to)` – move or swap
Every booking at `from` goes to `to`, and every booking at `to` goes to `from`. `swapSeatData()`
swaps what belongs to the guests, not the table: `seatMarks`, `seatNotes`, `seatNames`, `name`,
`booked`. Then `guestSeats()` on both and `save()`. Used by:
- «Flytt» on a table row (`startMove()` → click the target → `finishMove()`), toast
  «Flyttet fra bord 3 til 6.» or «Bord 3 og 6 byttet gjester.»
- dragging a table's name beside the map onto another table (`dropCallout()`).
- `placeGuest()` when the party was alone at its table.

Dragging one **chair's** name (`dropCallout()` with a seat) only swaps that chair's entry with
`swapSeatEntry()`; dropped on a table, it takes the first chair without a name.

### `placeGroup(groupKey, table)` – a whole other-room group to one table
In «Uten bord», bookings from another room (area `other:…`) get a heading «Testklubben · 3 bookinger,
14 personer – eget rom, ikke på våre bord». The heading is draggable; dropped on a table (or a row in
«Bordene»), every unplaced booking with that `area` goes to that one table in one move
(`guests.room = ROOM_ID`, `redeckHint` removed), then `guestSeats()`. Same-time bookings add up, so
the table gets chairs for the whole group, and its name shows as «12:00 Testklubben · 14 pers»
(`guestLabel()`). Toast «Testklubben (14 pers) ved bord 12.» with «Angre». Note: the members are
picked with `isUnplaced()` only, not `inShift()`, so a group's bookings in another shift come along
too.

### `sendBackToList(table)`
Dragging a booked table (or its name beside the map) onto the left column. All its guests lose
`placed`, `room` and `redeck`; the table stays where it is and gets its own chairs back. Toast
«Testa, Testb er tilbake i listen (bord 6 er ledig).» with «Angre».

## Undo
- `guestSnapshot()` = a deep JSON copy of the whole `guests` object.
- `restoreGuests(snap)` puts it back, saves, runs `guestSeats()` on every floor table, saves the
  plan and shows «Tilbake som før.».
- Taken before: «Ta alle av bordene», «Tøm lista», `sendBackToList()`, `placeGroup()` and
  `chooseShift()` (which also calls `undoFloor()` if it changed the setup).
- Not covered: «Fordel bord automatisk» itself, tables moved by `planPlates()`, and changes written
  into the Domino plan by `overflowToDomino()`.

## Gotchas
- `assignBookings()` only seats bookings that have no table; to redo the whole room, press
  «Ta alle av bordene» first.
- Side tables are decided by **position** (x percent), not only by number; moving a table into the
  middle band takes it out of the order.
- `state.bookingOrder` is shared in the hosted copy, but `overflow` and `sitMinutes` are per browser.
- Table numbers in the caps are exact strings (`"2"`, `"3"` …); a manual label like `3a` gets the
  default caps.

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
