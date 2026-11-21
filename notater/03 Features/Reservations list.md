---
title: Reservations list
tags: [norsken, reservations, bookings, ui]
updated: 2026-11-21
---
# Reservations list

The «Reservasjoner» tab in the left column is where the day's bookings are handled by hand. It has two
lists: «Uten bord» (the bookings without a table, grouped by area) and «Bordene» (every table on the
floor with the bookings at it). From here staff search, drag a name onto a table, drag a whole group
from another room to one table, move a party with «Flytt», tick parties off as they arrive («✓»), mark
a booking as part of the event (★), fix a name, and send guests back to the list. It is all drawn by
`renderReservations()` in `src/app.js`, which runs on every `render()` (through `renderGuests()`). The
bookings themselves live in the `guests` object in localStorage `norsken-guests-v1` (this browser only);
see [[Storage and data]].

## Where it is and what is on it

Tab button `data-tab="book"` («Reservasjoner», «Bookings» in English; label set by `renderTabs()`), pane
`data-pane="book"`, section `#booking-panel` in `src/index.html`. The open tab is remembered in localStorage `norsken-tab`; `importBookings()` switches
to this tab after a new list. Top to bottom:

| Element | Id | What |
|---|---|---|
| «📋 Lim inn fra ResDiary», «Åpne fil» | `#res-paste`, `#guest-file` | Get a list. See [[ResDiary import]]. |
| Note line | `#res-note` | Totals or a hint (below). |
| Search box | `#res-search` | Hidden while there is no list. Placeholder «🔍 Søk navn eller bord». |
| «Uten bord» | `#guest-rack` with `#guest-list` | Bookings without a table. Also the drop zone for sending one booking back. |
| «Fordel bord automatisk» · «Ta alle av bordene» · «Tøm lista» | `#book-run`, `#book-clear`, `#guest-clear` | See «The three buttons». |
| «Bordene» heading | `#res-tables-title` | With the arrival counter. |
| Move hint | `#res-move-note` | Only while «Flytt» waits for a target. |
| «Bordene» list | `#res-tables` | One row per table on the floor. |

All texts are set again on each render in Norwegian or English (`state.lang`).

**Note line** (`#res-note`): with a list, «N bookinger · P ved bord her · E i Domino · U uten bord. Dra
et navn til et bord.» («i Spisestua» when the open room is Domino; the «E i …» part only when non-zero).
`N` and `P` are for the whole day, `U` is the shift's «Uten bord» count. Without a list: «På
ResDiary-utskriften trykker du bokmerket «Til bordplan», og så «Lim inn fra ResDiary» her (eller
Ctrl+V).» (A variable `guestMsg` can override the line, but nothing sets it today.)

## Search (`resQuery`)

- `resQuery` holds the box's text. Typing calls `renderReservations()` only (not a full render). Escape
  in the box clears it. When the list becomes empty, the search is cleared too.
- `guestMatches(g)`: case-insensitive substring match (query trimmed) on the booking's `name`, `time`,
  `note` (the comment) or `areaLabel`. Empty query = everything matches.
- «Uten bord» shows only matching bookings (and the group counts are of the matching ones). If the
  search hides every unplaced booking, the list is simply empty: the texts «Alle har bord.» / «Ingen
  liste ennå.» only show when the shift has no unplaced bookings at all.
- «Bordene» shows a table when its label **equals** the query (case-insensitive, so «6» finds table 6,
  not 16), or any booking at it matches, or its typed name (`table.name`) contains the query. Nothing
  found: «Ingen bord passer søket.» (With no search and no tables on the floor: «Ingen bord ute ennå.»)
- The tables found also light up on the map: class `found` on `#room .table` (gold outline `#e0a63a`).

## «Uten bord» – bookings without a table

**Which bookings**: `guests.list.filter((g) => isUnplaced(g) && inShift(g))`.
- `isUnplaced(g)`: no table in `guests.placed`, or placed in the open room but that table is no longer
  on the floor (sent to the store, or a new setup was laid). So nobody is lost when the floor changes.
- `inShift(g)`: only the chosen shift ([[Shifts and start screen]]).
- **Not** filtered by room: bookings for the other room (Domino / Spisestua) and for other rooms of the
  house are shown too, in their own groups.

**Order and groups**: sorted by rank, then `areaLabel`, then time. Rank 0 = this room's area
(`ROOM_ID`), 1 = the other of Spisestua/Domino, 2 = `other:` rooms. A heading (`li.res-group`) starts each
area: «Spisestua · 12 bookinger, 31 personer»; for an `other:` room «Møterom · 2 bookinger, 9 personer –
eget rom, ikke på våre bord» (class `other`, purple `#5b4e7a`). One booking reads «1 booking»
(`bookingWord()`). People = sum of `pax` (unknown = 0). The heading's
name is `areaLabel`, else the room's name from `ROOMS`, else «Spisestua». Areas come from `areaOf()`
([[ResDiary import]]).

**Each booking** (`li.guest-item`): time («–» if none), name («–» if none), «Np» (when `pax` is known), the ★ button,
the double-booking chip, the diet chips, and the comment. If auto seating left it waiting for a re-set
table (`guests.redeckHint[id]`), the item gets class `redeck` and a line «↻ Dekk om · bord N blir
ledig først» ([[Auto seating]]). The ★, double and diet chips are explained on
[[Shifts and start screen]] and [[ResDiary import]].

Empty list: «Alle har bord.» (there is a list) or «Ingen liste ennå.».

**Dragging**: press on an item (not on ★) to drag it; see «Dragging» below.

**Group heading drag**: a heading of an `other:` room is draggable (class `draggable`, grab pointer,
« ⠿» after the text, title «Dra til et bord for å sette hele gruppen der»). Dropping it on a table (on the
map or a row in «Bordene») calls `placeGroup(groupKey, table)`: **every** unplaced booking of that area
goes to that one table (a langbord half hands over to its lead half), `guests.room` = the open room,
re-set hints (`guests.redeckHint`) cleared, chairs on that table updated with `guestSeats()`. Toast (8 s)
with «↶ Angre»: «Møterom (9 pers) ved bord 7.» `placeGroup()` filters neither by shift nor by the search
box. Headings of Spisestua and Domino are not draggable
(that would put a whole room on one table; see [[Decisions]]).

## «Bordene» – the tables

**Which tables**: `roomTables()` (tables on the floor), only the ones that carry a label and are not the
non-lead half of a langbord (`t.lead !== false`), sorted by label (`byLabel()`).

**Arrival counter** in the heading: «Bordene · ✓ 5 av 12 kommet (14 av 38 gjester)» – tables, not
bookings: `booked` = tables with bookings here (`guestsOn(t).length`), `inside` = those where
`tableArrived(t)` is true. People are sums of `pax`. With no booked table the heading is just «Bordene».

**Each row** (`li.res-row`, `data-table=<id>`):
- the table number;
- the booking chips (sorted by time), or the table's own typed name, or the button «ledig ✎»;
- meta: «N stoler» (`seatsOf(seatOwner(t)).length`, left out when 0) and `markSummary(t)` – one chip per
  chair mark with «×n» when n > 1, and «✱» (also with «×n») for chair notes ([[Chairs and plates]]);
- actions: «✎» (change name) when there is a booking or a typed name – on a table with bookings it edits
  the earliest booking's name – and «Flytt» when the table has bookings, a typed name or chair marks.
- Classes: `free` (no bookings, no typed name, no chair marks; chair notes alone do not count),
  `moving-from`, `move-target` (during «Flytt»).

**A booking chip** (`guestChip()`, `span.res-guest`): the «✓» arrived button, «↻» if it is a second
sitting (`guests.redeck[id]`), time, name («uten navn» if empty; click to edit), «Np», ★, double chip,
diet chips, «✕» (aria-label «Ta av bordet»; sends this booking back to «Uten bord» with
`unplaceGuest()`), and the comment.

**Which bookings show at a table**: `guestsOn(table)` – placed at it, in the open room, table on the
floor, and in the chosen shift. A table used only by another shift shows «ledig ✎» (its bookings are
hidden).

## «✓ kommet» – ticking arrivals

- The «✓» box on each booking chip toggles `guests.arrived[id] = true` / deletes it, then
  `saveGuests()` and `render()`. Handled by a capture-phase click listener on `#res-tables`.
  Titles: «Trykk når de kommer» / «Kommet – trykk for å angre».
- Ticked: the box turns green (`#2f7a4f`), the name is struck through.
- `tableArrived(table)`: a table counts as arrived when it has bookings and **all** of them are ticked.
  Then the table on the map gets a green ring and a «✓» badge (`#room .table.arrived`), and its name
  label beside the map fades (opacity 0.6) with a green border and its number on green (`.callout.arrived`).
- The printout shows ticked bookings with a «✓» in their box ([[Printing]]).
- A new import starts with no ticks.

## Changing a name by hand

- Click a booking's name (`data-edit-name`) or the row's «✎» → `startResEdit(kind, id)` opens an input in
  place (`resEdit = { kind, id, orig }`). Not while «Flytt» is waiting. The «✎» on a row with bookings
  edits the earliest booking (`kind: "guest"`); on a row with only a typed name it edits the table.
- `kind: "guest"`: changes the booking's `name` (cut to 40 characters, not trimmed) in `guests`, then
  `saveGuests()`.
- `kind: "table"`: for a table without a booking. Sets `table.name` (trimmed, max 28 characters, empty =
  `null`) and `table.booked = false` (a typed name, so «Fjern navn» / a new list leave it alone). This
  name lives on the table in the room's plan (`state`), not in the guest list.
- A free table shows «ledig ✎»; clicking it starts typing a name onto that table.
- Every key press updates the map at once (`liveRedrawMap()` = `renderRoom()`, then `renderCallouts()` on
  the next animation frame); the list is not redrawn, so the typing position stays put.
- Enter = done. Escape = put back the original (`orig`). Leaving the field = done (if focus moves to
  another control inside `#res-tables`, editing just ends and that click goes through).

## «Flytt» – moving a party

1. «Flytt» on a row → `startMove(tableId)` sets `moveFrom`. The button turns into «Avbryt», the other
   rows get class `move-target`, the map gets class `moving`, and `#res-move-note` says «Flytter bord 6:
   klikk på bordet de skal til (på kartet eller i lista).» with an «Avbryt» button.
2. Click another row, or click a table on the map → `finishMove(target)` (a langbord half hands over to
   its lead half) → `moveParty(from, target)`.
3. Cancel: «Avbryt» (on the row or in the note) or Escape.

While waiting, pressing «Flytt» on *another* row does not finish the move: the click handler checks
`[data-move]` before the row, so that row becomes the new source (`startMove()` again).

`moveParty(from, to)`: all bookings at `from` (as `guestsOn()` sees them, so only the chosen shift) go
to `to`; if `to` had bookings, they go to `from` – the two **swap**. The guest-related table data swaps with them: `seatMarks`, `seatNotes`, `seatNames`, `name`,
`booked`. The tables themselves stay where they are. Chairs are recounted on both. Toast (5 s): «Flyttet
fra bord 6 til 9.» or «Bord 6 og 9 byttet gjester.». There is no «Angre» for «Flytt» (doing it again
moves them back). The swap toast is chosen only by whether `to` had bookings; a typed name or chair
marks on `to` still swap, but the toast then says «Flyttet …».

## Dragging

All drags use the shared drag system (`startDrag()` on pointerdown, `onMove()` on the window's
pointermove, `onUp()` → `finishDrag()` on release; see [[Render loop]]). A drag starts after the pointer
has moved 6 px; a ghost copy of the item (class `drag-ghost`) follows the pointer. The click that follows
a drag is ignored by the «Bordene» list and the map's name labels (`markDragEnded()` / `dragJustEnded`).

### A booking onto a table
- From «Uten bord» (an item) or from «Bordene» (a booking chip; not when pressing ✕, ✓, ★ or the name
  input). Drag kind `"guest"`.
- Target: a table on the map (`guestDropTable()`; a langbord half hands over to its lead half) or a row in
  «Bordene» (`resRowTable()`). The target table **on the map** gets class `guest-target` (outline in
  `--pine`), also while the pointer is over its row; the row itself is not highlighted.
- Near the top or bottom edge (60 px) of the open left pane (`.leftcol .tab-pane:not([hidden])`) the list
  scrolls by itself (14 px per move). This also applies to group-heading drags.
- Drop → `placeGuest(id, table)`:
  - already at that table: nothing;
  - the booking was the **only** party at its old table: `moveParty()` – everything goes with it, and if
    the new table had guests the two swap;
  - otherwise it is placed (`guests.placed`, `guests.room` = open room). If the table already has other
    bookings **and this booking** carries a re-set hint from auto seating (`guests.redeckHint[id]`), it
    becomes a second sitting (`guests.redeck[id] = true`, «↻»); otherwise any old `guests.redeck[id]` is
    removed. The hint is cleared. Chairs are recounted on both tables.
  - No toast and no «Angre».

### Back to the list
- **One booking**: drag its chip from «Bordene» onto the «Uten bord» box (`#guest-rack`), or press its
  «✕». Both call `unplaceGuest(id)`: placement, room and second-sitting flag are removed, chairs
  recounted. No toast, no «Angre».
- **A whole table's guests, from the map**: drag the table itself, or its name label beside the map (not
  a chair's name label), onto the left column (`#leftcol`). This works only when the table has bookings in
  view, i.e. `guestsOn()` is not empty (`dropBackTable()`). While hovering, the left column gets a dashed gold outline
  (`.leftcol.drop-back`, `#d8b46a`). On drop, `sendBackToList(table)` takes every booking at that table
  back to «Uten bord»; the table stays where it is and gets its own chairs back. Toast (8 s) with
  «↶ Angre»: «Testa, Testb er tilbake i listen (bord 6 er ledig).»

## The three buttons

- **«Fordel bord automatisk»** (`#book-run`): first reads the «Prioritet» field (`#book-order`, into
  `state.bookingOrder`), then `assignBookings()` seats the bookings without a table that belong to the
  open room's area (`area === ROOM_ID`) and the chosen shift. Result toast (7 s), no «Angre». With no
  tables on the floor: «Ingen bord ute ennå – velg et oppsett under ★ Oppsett først.» All rules are on
  [[Auto seating]].
- **«Ta alle av bordene»** (`#book-clear`): hidden unless some booking is placed. Asks with a second tap
  «Sikker? Trykk igjen» (`armed()`, 4 s). Takes every booking placed in the open room off its table (in
  Spisestua also the ones placed in Domino) – **not** filtered by shift. Then `clearBookedNames()` clears
  booking names (`booked: true`) and re-set marks from the tables (in Spisestua also
  `clearDominoBooked()`), chairs are recounted and `bookingResult` is reset. Toast «Alle er tatt av
  bordene.» (12 s) with «↶ Angre».
- **«Tøm lista»** (`#guest-clear`): hidden when there is no list. Second tap «Sikker? Trykk igjen» (4 s).
  Empties the whole guest list (`guests = { file: "", list: [], placed: {}, room: {}, redeck: {} }`),
  gives tables in this room (`guestSeats()`) and in the other of Spisestua/Domino
  (`releaseOtherRoomSeats()`) their own chairs back. Toast «Lista er tømt.» (12 s) with «↶ Angre».

## Undo at a glance

| Action | «↶ Angre»? |
|---|---|
| `sendBackToList()` (drag from the map to the list) | yes, 8 s – `restoreGuests()` |
| `placeGroup()` (group heading) | yes, 8 s |
| «Ta alle av bordene», «Tøm lista» | yes, 12 s |
| Picking a shift on «☀ I dag» | yes, 10 s (floor and guests) |
| `placeGuest()`, `unplaceGuest()` / ✕, «Flytt», ✓, ★, name edits | no |
| «Fordel bord automatisk» | no |
| a new import | no – it replaces the list («📋 Lim inn fra ResDiary» asks «Bytte ut dagens liste? Trykk igjen» first when some booking is placed) |

`guestSnapshot()` is a deep copy of `guests`; `restoreGuests(snap)` puts it back, saves, recounts chairs
on every table on the floor and shows «Tilbake som før.» (4 s).

## Related
- [[ResDiary import]]
- [[Shifts and start screen]]
- [[Auto seating]]
- [[Chairs and plates]]
- [[Storage and data]]
- [[Render loop]]
- [[Printing]]
- [[House map]]
- [[Decisions]]
