---
title: Storage and data
tags: [norsken, architecture, data]
updated: 2026-11-21
---
# Storage and data

Norsken has no server and no database. Everything is kept in the browser's `localStorage`, under a handful of `norsken-…` keys: one plan per room (the `state` object), one guest list for the whole day (the `guests` object, kept apart from the plan because guest names are confidential), and some small per-browser settings. This page lists every key, the exact shape of `state` and `guests`, how rooms map to keys, and the one exception: the hosted copy can also share the floor plan through a shared store. Read it before adding a field or a key, because `print.html` reads the same keys directly.

## Ground rules

- Every read and write is wrapped in `try/catch`. If storage is blocked (private window), the page still works for that visit and simply forgets.
- Storage belongs to the origin. The website, the extension (`chrome-extension://<id>`, id pinned by the manifest `key`), and a double-clicked `index.html` (`file://`) each have their OWN storage. That is why «★ Oppsett» has «Last ned som fil» / «Åpne oppsett-fil» for moving setups between PCs and copies.
- Guest names live ONLY under `norsken-guests-v1`, never in `state` (comment above `loadGuests()` in `src/app.js`). Names typed by hand onto a table (`table.name`) or onto a chair (`table.seatNames`) DO live in `state` in this browser, but they are stripped before anything is shared (see "Shared plan" below).

## Every localStorage key

Found with `grep localStorage src/app.js src/print.html`.

| Key | Holds | Written by | Read by |
|---|---|---|---|
| `norsken-room` (`ROOM_KEY`) | `"spisestua"` or `"domino"`. Missing or unknown means `"spisestua"`. | the room buttons `[data-room]` (then `location.reload()`) | the `ROOM_ID` IIFE at the top of `app.js` |
| `norsken-layout-v3` (`ROOMS.spisestua.key`) | Spisestua's whole `state` as JSON | `save()`, `applyRemote()`; from Domino: `releaseOtherRoomSeats()` | `loadState()`, `readRoomPlan("spisestua")`, `print.html` |
| `norsken-layout-domino-v1` (`ROOMS.domino.key`) | Domino's whole `state` as JSON | `save()` in Domino; from Spisestua: `clearDominoBooked()`, `overflowToDomino()`, `releaseOtherRoomSeats()` | `loadState()`, `readRoomPlan("domino")`, `print.html` (also `dominoInUse()`) |
| `norsken-guests-v1` (`GUESTS_KEY`) | the `guests` object (below) | `saveGuests()` | `loadGuests()`, `print.html` |
| `norsken-shift` (`SHIFT_KEY`) | `""` (whole day), `"lunsj"`, `"middag"`, `"arrangement"`, `"middag+arrangement"` or `"lunsj+arrangement"`. Anything else is read as `""`. | `setShift()`, `chooseShift()` | the `SHIFT` IIFE, `print.html` |
| `norsken-tools` (`TOOLS_KEY`) | `"1"` = «🧰 Verktøy» on (tray, plates, measures shown); `"0"` or missing = off (`body.tools-off`) | `#tools-btn` click | `toolsOn()` |
| `norsken-tab` | left-column tab: `"table"` («Bord»), `"book"` («Reservasjoner») or `"marks"` («Merking»). Default `"table"`. | the `.tabs` click handler | the `activeTab` IIFE |
| `norsken-presets-v1` (`MINE_KEY`) | saved setups from «★ Oppsett»: `{ spisestua: [...], domino: [...] }`, each entry `{ name, at, tables, fixtures }` | `saveMine()` | `loadMine()` |
| `norsken-undo-spisestua` / `norsken-undo-domino` (`UNDO_KEY`) | `{ label, at, state }`: the whole plan from just before the floor was replaced | `rememberFloor()` (called by `presetLayout()`, `applyLayout()`, «Tomt rom») | `readUndo()`; removed by `undoFloor()` |
| `norsken-update-check` (`UPDATE_KEY`) | `{ at, latest: { n, zip, page, name }, skip }` | `checkForUpdate()`, «Senere» on the update bar | `checkForUpdate()` |

Notes on the table:

- **Presets**: `layoutSnapshot()` strips `GUEST_FIELDS` = `name`, `booked`, `redeck`, `redeckPax`, `seatNames`, `seatNotes`, `seatMarks`, `seatFromGuest`, `seatBefore`, `seatsRender` from every table, and puts back the table's own chair count (`seatBefore`) when the chairs came from a booking. So a saved setup or its file never carries names. Same name (case-insensitive) replaces the old entry. The export file is `norsken-oppsett-YYYY-MM-DD.json` with `{ norskenPresets: 1, rooms: <the same object> }`; import checks `norskenPresets === 1` and strips `GUEST_FIELDS` again.
- **Undo** holds a full `state` (it may contain typed table names). One level only, per room, survives closing the page.
- **Update check** only does anything in the extension: `installedRelease()` reads the last part of the manifest version (`1.0.<n>`), and returns 0 elsewhere. It asks the GitHub releases API at most every 3 hours (`3 * 60 * 60 * 1000` ms), compares `<n>` with the `-<n>` at the end of the tag, and `skip` remembers a version the user postponed with «Senere».
- **Not localStorage**: the CSV from «Last ned liste» (stays in Downloads), and the hosted copy's print download `norsken-oppsett-YYYY-MM-DD.html` (has the guests baked in).
- **How the list arrives** (details on [[ResDiary import]]): the «Til Norsken» bookmark opens `…/norsken/#fra-resdiary` and hands the list over in memory with `postMessage` (`{ norsken: <text> }`); the page only accepts it from an origin matching `RESDIARY_ORIGIN`, ignores the same text again within 60 s (`lastHandoff`), and answers `"norsken-ok"`. Nothing goes in the address. The older bookmark put the list after `#import=`; `importFromHash()` still reads that, wipes it from the address bar with `history.replaceState`, and shows a toast asking for the new button. After a successful paste import («Lim inn fra ResDiary» or Ctrl+V) the clipboard is overwritten with an empty string.

## Rooms: ROOMS, ROOM_ID and per-room keys

```js
const ROOMS = {
  spisestua: { no: "Spisestua", en: "Dining room", key: "norsken-layout-v3", doc: "plan/current" },
  domino: { no: "Domino", en: "Domino", key: "norsken-layout-domino-v1", doc: "plan/domino" },
};
```

- `ROOM_ID` is a `const` worked out ONCE at load from `norsken-room`. Switching room = `save()`, write `norsken-room`, `location.reload()`. Only the open room's plan is in memory as `state`.
- Per room: `STORAGE_KEY = ROOMS[ROOM_ID].key`, `SHARED_DOC = ROOMS[ROOM_ID].doc`, `UNDO_KEY = norsken-undo-${ROOM_ID}`, and the room's list inside `norsken-presets-v1`.
- NOT per room: `norsken-guests-v1`. There is one guest list for the day; `guests.room[guestId]` says which room a placement belongs to (missing = `"spisestua"`, see `guestRoom()`).
- The other room's plan is edited straight in storage, without `normalizeState()`: `readRoomPlan(id)` returns the parsed plan only if it has tables, else `null`. `overflowToDomino()` starts Domino from `dominoStarter()` if it was never opened.
- Room sizes: Spisestua `dims.room = { w: 700, h: 1360 }` (cm, measured). Domino `DOMINO_ROOM = { w: 500, h: 650 }` (from photos, not measured). A Domino plan with no room size or the old guess 600 × 1000 is moved to `DOMINO_ROOM` by `normalizeState()`.

## The `state` object (one room's plan)

Created by `defaultState()`, loaded by `loadState()` → `normalizeState()`, written whole by `save()`. View settings (language, grid, selection) are saved in the same blob.

| Field | Default | Meaning |
|---|---|---|
| `lang` | `"no"` | `"no"` or `"en"` |
| `selected` | `null` | id of the selected table (persists across reloads) |
| `showGrid` | `true` | «Rutenett» |
| `showMeasure` | `false` | «Mål» panel in Innstillinger |
| `withChairs` | `true` | «Med stoler» in Innstillinger: whether clearance/aisle maths counts the chairs (`occupiedCm()`); it does not hide chairs |
| `dims` | `cloneDims()` of `DEFAULT_DIMS` | every size in cm, see below |
| `tables` | `starterTables()` (Spisestua) or `dominoStarter()` (Domino) | all tables, on the floor and in the tray |
| `fixtures` | Spisestua: `double-1` (left wall, along 24), `double-2` (left, 68), `waitress` (bottom, 50). Domino: none. | the doors drawn on the map |
| `furniture` | `[{ id: "sidebord", size: "sidebord", wall: "bottom", along: 20 }]` | the old fixed table; kept and synced by `syncFurniture()` but no longer drawn |
| `paintings` | 9 paintings from `defaultPaintings()` | `{ id, wall, along, span, name }`; currently not drawn on the map |
| `showPaintings` | `false` | dormant (its button is not in `index.html`) |
| `selectedPainting` | `null` | dormant |
| `bookingsText` | `""` | old free-text bookings box. The textarea is gone and `normalizeState()` now always sets it to `""` ("the old pasted list is not kept any more"); it is not shared. |
| `bookingOrder` | `DEFAULT_BOOKING_ORDER` = `"3, 6, 5, 8, 10, 9, 11, 7, 2, 4"` | «Prioritet» for [[Auto seating]] (max 120 chars) |
| `overflow` | `"redeck"` | when Spisestua is full: `"redeck"` («Dekk om et bord (↻)») or `"domino"` («Bruk Domino») |
| `sitMinutes` | `60` | minutes before a table can be laid again; clamped 15–300 |

Fields not in `defaultState()`, added later by code:

| Field | Set by | Meaning |
|---|---|---|
| `floorKind` | `presetLayout()` | `"usual"`, `"lunch"` or `"jul"`: which ready setup is on the floor. `chooseShift()` lays a new setup only if this differs from the shift's `floor` (see [[Shifts and start screen]]). |
| `hideChairs` | «Skjul alle stoler» / «Vis stolene» (`#chairs-toggle`) | hides chairs on the screen map (`seatNodes()` returns nothing). The printout does not look at it. |
| `printNoChairs` | «🪑 med stoler / uten stoler» (`#print-chairs`) | `print.html` draws no chairs when true |
| `brush` | the «Merking» palette | `null`, a seat-mark key (`"gluten"`, `"laktose"` …), `"note"` or `"seatname"` |

### dims

`DEFAULT_DIMS` (cm): `room {w:700,h:1360}`, `small {d:115}`, `big {d:135}`, `oval {w:90,l:165}`, `rect {w:80,l:120}`, `long {w:90,l:105}` (one langbord half), plates `plateS {w:37,l:90,n:2}`, `plateM {w:49.5,l:90,n:4}`, `plateL {w:55.5,l:90,n:2}`, `plateXL {w:64,l:90,n:1}` (`w` = how much gap it fills, `n` = how many exist), `sidebord {w:60,l:178}`, `chairBig {d:54}`, `chairSmall {d:45}`, `cover {d:60}`, `aisle: 90`, `snap: 10`, and `est` (true = still a guess, shown as «anslag»). `v` is `DIMS_VERSION` (now **11**).

`mergeDims(saved)`: saved sizes win, EXCEPT a size still marked `est` when the saved `v` differs from `DIMS_VERSION`; then the newer placeholder wins. A number someone typed under «Mål» (which sets `est[size] = false`) is never overwritten. **Bump `DIMS_VERSION` whenever you change a placeholder.** Two one-off moves: `v < 8` (small 132 → 130, plateM.n 2 → 4) and `v < 11` (small 130 → 115, big 150 → 135, oval 100×180 → 90×165), each only if the old number is still there. More on sizes: [[Chairs and plates]].

### A table

`makeTable(size, zone)` creates `{ id, label: "", zone, x: 50, y: 50, rotated: false, plates: null, gapPlates: null, seatTurn }` and `applySize()` adds `size` and `kind`.

| Field | Meaning |
|---|---|
| `id` | `t-<base36 time>-<6 random chars>` from `uid()` |
| `size` | `"small"`, `"big"`, `"oval"`, `"rect"` or `"long"` (`SIZES`) |
| `kind` | derived from `SIZE_KINDS`: small and big → `"round"`, oval → `"oval"`, rect → `"rect"`, long → `"plate"` (the langbord half is kind `"plate"`, a name kept for the CSS class); `"furniture"` for the sidebord |
| `zone` | `"room"` (on the floor) or `"tray"` (storage) |
| `x`, `y` | centre in **percent** of room width/height (cm only via `centerCm()`) |
| `rotated` | boolean |
| `label` | the number shown, set by `relabelRoom()`; `""` in the tray |
| `manual` | a hand-typed number such as `"1a"`, or `null` |
| `lead` | set by `relabelRoom()`: false for every langbord half except the one that carries the number |
| `group` | `g-<uid>` shared by the halves of one langbord, else absent/`null` |
| `gapPlates` | plate sizes dropped in the gap ABOVE this table, e.g. `["plateM","plateS"]`; only grouped floor tables, never the first in the group |
| `custom` | `{ w, l }` cm for one langbord half (clamped `w` 30–400, `l` 50–900), else `null` |
| `seatTurn` | degrees the chair ring is turned; `makeTable()` gives 30 to an oval and 45 to everything else; if missing on load, 45 for an unrotated round table, else 0 |
| `seatCount` | chair count set by hand or by a booking (1–40); absent = default |
| `seatFromGuest`, `seatBefore` | chairs were set from a booking's size; `seatBefore` is what to go back to |
| `ends`, `endSide` | end chairs on rectangles: `ends` is `0`, `1` or `2`; with `1`, `endSide: "end"` means the bottom/right end, anything else the top/left |
| `seatAngles` | `{ seatIndex: degrees }` chairs dragged by hand |
| `seatMarks`, `seatNotes`, `seatNames` | objects keyed by seat index: mark key, note text, name on that chair |
| `name` | a name typed on a table without a booking (max 28 chars) |
| `booked`, `redeck`, `redeckPax` | older fields: `clearBookedNames()` clears them and `print.html` still reads `redeck`/`redeckPax`, and `tableButton()` / `renderCallouts()` still show `table.redeck`, but nothing in today's `src/app.js` sets `booked` to true or assigns `table.redeck` / `table.redeckPax` (unclear if still needed; the live «↻» state is `guests.redeck` and `guests.redeckHint`) |
| `plates` | always `null` (old field) |

Baked fields, written so `print.html` never redoes the geometry:

- `save()`: `w`, `h` (percent of the room; nothing in `src/` reads them today), `guests` (number of chairs, `null` in the tray), `seatsRender` = `[{ x, y, mark, note, name, a }]` in percent.
- `relabelRoom()`: `label`, `lead`, `guests`, and on each group's lead `groupInfo = { count, gaps, strips }` (`print.html` draws plates from `strips`).

If the printout needs something new, bake it here rather than teaching `print.html` the maths.

### Loading and migration: normalizeState()

`normalizeState(parsed)` is pure and runs BEFORE `state` exists (at `let state = loadState()`) and again for every remote update and for «Angre». No tables → `defaultState()`. Otherwise: defaults spread under the saved fields, Domino fixtures always reset, paintings normalized, the sidebord moved to the bottom wall once (`migrateFurniture()`), `dims` via `mergeDims()`, booleans forced, `bookingsText` emptied, `bookingOrder` ≤ 120 (empty → default), a plan older than dims v10 with no oval table gets one (a round table 16 on the floor becomes the oval and a copy of it goes to the tray; otherwise an oval is added to the tray), and per table: plate sizes turned into `"long"`, unknown sizes into `"small"`, `kind` recomputed, `ends` forced to 0/1/2, `custom` clamped, `plates = null`, `gapPlates` filtered; a group of one is dissolved and the first table in each group loses its `gapPlates`.

Any exception inside returns `defaultState()`, which silently wipes the layout. That is why it must not call anything that reads `state` (`room()`, `centerCm()`, `orderGroup()` …); the comment in the code says so. See the TDZ section on [[Render loop]].

### What save() does

`save()` runs `releaseEmptySeats(state.tables)` (chairs given to a party go back when nobody sits there), bakes the fields above, writes the WHOLE `state` to `STORAGE_KEY`, and calls `scheduleShare()`.

## The `guests` object (the day's bookings)

```js
{
  file: "",       // where the list came from: "ResDiary", "utklippstavla"/"clipboard", or a file name
  day: "2026-11-21", // dayKey(): `${year}-${month+1}-${date}`, no zero padding
  list: [ /* bookings */ ],
  placed: {},     // guestId -> tableId
  room: {},       // guestId -> "spisestua" or "domino" (missing = "spisestua")
  redeck: {},     // guestId -> true: a second sitting at a table already used («↻»)
  redeckHint: {}, // guestId -> table label: waiting in «Uten bord» for that table to be laid again
  arrived: {},    // guestId -> true: ticked «✓» when they came
}
```

One booking in `list` (built in `importBookings()`):

| Field | Meaning |
|---|---|
| `id` | `g<base36 Date.now()><index>` from `newGuestId()` |
| `time` | `"HH:MM"` |
| `name` | last name, max 40 chars |
| `pax` | number of guests, or `null` |
| `note` | the ResDiary comment (max 200 from the paste/bookmark path, 120 from the CSV path); if Område had extra words, such as «Fast meny i Spisestue», those come first, joined with ` · ` |
| `area` | `"spisestua"`, `"domino"` or `"other:<område in lower case>"` (`areaOf()`) |
| `areaLabel` | the Område as shown: «Spisestua», «Domino», or the original text |
| `rd` | ResDiary's own «Bord» column. Stored, not read anywhere today. |
| `event` | only after a ★ tap: `true`/`false` overrides the automatic check in `isEvent()` |

Life cycle:

- `loadGuests()` fills missing maps with `{}`; its empty fallback is `{ file: "", list: [], placed: {}, room: {}, redeck: {} }`, so code always uses `guests.redeckHint?.` / `guests.arrived?.` or creates the map first.
- `importBookings()` replaces everything: `{ file, day: dayKey(), list, placed: {}, room: {}, redeck: {} }`. `arrived` and `redeckHint` start empty.
- «Tøm lista» sets `{ file: "", list: [], placed: {}, room: {}, redeck: {} }`.
- A placement only counts while its table is on the floor in the open room (`guestTable()`, `guestsOn()`, `isUnplaced()`), so a booking whose table went to the tray is back in «Uten bord».
- «Angre» for list changes uses `guestSnapshot()` (deep copy) and `restoreGuests()`.
- The «☀ I dag» screen opens at load when the list is empty or `guests.day !== dayKey()`.

Pattern for any change: mutate `guests`, then `saveGuests()`, then `save()` (chair counts depend on guests), then `render()`.

## Shared plan (hosted copy only)

`connectShare()` runs at load. Without `window.claude?.use` it does nothing and storage stays local. In the hosted copy it opens the shared store (`window.claude.use("db")`) and listens to the doc `SHARED_DOC` (`plan/current` or `plan/domino`).

- Doc body: `{ plan: <JSON string>, writer: CLIENT_ID, at: <ms> }`. `CLIENT_ID` is random per page load.
- Only `SHARED_KEYS` are shared: `tables`, `fixtures`, `furniture`, `dims`, `paintings`, `bookingOrder`. `norsken-guests-v1` is never shared.
- `sharedPayload()` sends `layoutOnly(state.tables)`: a copy of the tables with every `GUEST_FIELDS` entry removed (`name`, `booked`, `redeck`, `redeckPax`, `seatNames`, `seatNotes`, `seatMarks`, `seatFromGuest`, `seatBefore`, `seatsRender`) plus `guests`, and with a booking's chair count swapped back to the table's own (`seatBefore`). So typed names, chair notes and allergy marks stay on the device.
- `applyRemote()` runs the incoming tables through `layoutOnly()` too, then copies this device's own guest fields back onto tables with the same `id` (and its booking-given `seatCount`), and drops any `bookingsText`.
- First snapshot: a plan in the store replaces the local one (`applyRemote()`); an empty store gets this device's plan (`pushShare()`). 10 s without an answer → keep working, status «Ikke lagret – prøver igjen».
- `scheduleShare()` debounces `pushShare()` by 700 ms. Nothing is pushed while a drag is running, or if the body equals the last one sent. A permission error sets `share.canWrite = false` («Kun visning»); other errors retry after 4 s.
- Later snapshots from other writers are applied unless a drag is running. `applyRemote()` keeps this device's `lang`, `showGrid`, `showMeasure`, `withChairs`, `brush`, `showPaintings`, `selectedPainting`, and `selected` if that table still exists.
- Caveat: `overflow`, `sitMinutes`, `floorKind`, `hideChairs` and `printNoChairs` are neither shared nor kept, so a remote update resets them to the `defaultState()` values (or `undefined`) on that device. Unclear whether that is intended.
- Status chip `#sync-status`: «Kobler til…», «Lagrer…», «Delt plan · HH:MM», «Kun visning», «Ikke lagret – prøver igjen», «Bare på denne enheten».

## What print.html reads

`print.html` reads storage itself, with the key names written out: the room's plan (`norsken-layout-v3` or `norsken-layout-domino-v1`, chosen by `?room=`), the other room's plan, `norsken-guests-v1` and `norsken-shift`. In the hosted print file it uses `window.__NORSKEN_STATE__`, `__NORSKEN_GUESTS__`, `__NORSKEN_ROOM__`, `__NORSKEN_SHIFT__` instead. From `state` it uses `tables`, `lang`, `withChairs`, `printNoChairs`, `fixtures`, `dims`; from tables `label`, `guests`, `name`, `lead`, `group`, `groupInfo`, `seatsRender`, `seatCount`, `redeck`, `redeckPax`, `size`, `kind`, `custom`, `rotated`, `x`, `y`, `zone`; from guests `list`, `placed`, `room`, `redeck`, `redeckHint`, `arrived`. Renaming any of these breaks the printout. See [[Printing]].

## Related

- [[Files and build]]
- [[Render loop]]
- [[Auto seating]]
- [[Chairs and plates]]
- [[ResDiary import]]
- [[Shifts and start screen]]
- [[Reservations list]]
- [[Printing]]
- [[Rules]]
- [[Open questions and ideas]]
