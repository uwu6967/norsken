---
title: Storage and data
tags: [norsken, architecture, data]
updated: 2026-11-21
---
# Storage and data

Norsken has no server and no database. Everything is kept in the browser's `localStorage`, under a handful of `norsken-…` keys: one plan per room (the `state` object; Spisestua, Domino and each of the eleven salons has its own key), one guest list for the whole day (the `guests` object, kept apart from the plan because guest names are confidential), and some small per-browser settings. Three more small keys live in the browser's per-tab storage, so they are forgotten when the tab closes. This page lists every key, the exact shape of `state` and `guests`, how rooms map to keys, and the two ways a plan leaves the browser: the hosted copy can share the floor plan through a shared store, and «📤 Send bordkart» packs the salon maps into a link. Read it before adding a field or a key, because `src/print.html` reads the same keys directly. (`print.html` at the repo root and `extension/print.html` are generated from it by `tools/build.py`; never edit those.)

## Ground rules

- Reads and writes are wrapped in `try/catch`. If storage is blocked (private window), the page still works for that visit and simply forgets. One exception: `importMapsFromHash()` reads the backup copy of each salon key (`backup[key] = localStorage.getItem(key)`) without a guard.
- Storage belongs to the origin. The website, the extension (`chrome-extension://<id>`, id pinned by the public `key` that `tools/build.py` writes into `extension/manifest.json`), and a double-clicked built `index.html` (`file://`) each have their OWN storage. That is why «★ Oppsett» has «Last ned som fil» / «Åpne oppsett-fil» for moving setups between PCs and copies, and «📤 Send bordkart» for the salon maps.
- Guest names live ONLY under `norsken-guests-v1`, never in `state` (comment above `loadGuests()` in `src/app.js`: «Guest names are NDA data»). Names typed by hand onto a table (`table.name`) or onto a chair (`table.seatNames`) DO live in `state` in this browser, but they are stripped before anything is shared, saved as a setup or put in a map link (see "Shared plan" below).

## Every storage key

Found by searching `src/app.js` and `src/print.html` for `localStorage` and for the per-tab store (or simply for `norsken-`).

### localStorage (per browser)

| Key | Holds | Written by | Read by |
|---|---|---|---|
| `norsken-room` (`ROOM_KEY`) | `"spisestua"` or `"domino"`. Missing, unknown or a salon id means `"spisestua"`. Salons are never stored here. | `goRoom()` (from the `[data-room]` buttons, the house map's «Åpne …» button, and `chooseShift()` in a salon); `goRoom()` saves first and then calls `location.reload()` | the `ROOM_ID` IIFE at the top of `src/app.js` |
| `norsken-layout-v3` (`ROOMS.spisestua.key`) | Spisestua's whole `state` as JSON | `save()`, `applyRemote()`; from Domino: `releaseOtherRoomSeats()` | `loadState()`, `readRoomPlan("spisestua")` (from `releaseOtherRoomSeats()` in Domino), `print.html` |
| `norsken-layout-domino-v1` (`ROOMS.domino.key`) | Domino's whole `state` as JSON | `save()` / `applyRemote()` in Domino; from Spisestua: `clearDominoBooked()`, `overflowToDomino()`, `releaseOtherRoomSeats()` | `loadState()`, `readRoomPlan("domino")`, `print.html` (also its `dominoInUse()`) |
| `norsken-layout-<id>-v1` (salons, e.g. `norsken-layout-bar-v1`, `norsken-layout-r1818-v1`) | that salon's whole `state` as JSON | `save()` / `applyRemote()` in that salon; `importMapsFromHash()` (a `#kart=` link), and the «Angre» on its toast | `loadState()`, `packMaps()`, `roomMapButton()`, `print.html?room=<id>` |
| `norsken-guests-v1` (`GUESTS_KEY`) | the `guests` object (below) | `saveGuests()` | `loadGuests()`, `print.html` (also its `dominoInUse()`) |
| `norsken-shift` (`SHIFT_KEY`) | `""` (whole day), `"lunsj"`, `"middag"`, `"arrangement"`, `"middag+arrangement"` or `"lunsj+arrangement"`. Anything else is read as `""`. | `setShift()`, `chooseShift()` | the `SHIFT` IIFE, `print.html` |
| `norsken-tools` (`TOOLS_KEY`) | `"1"` = «🧰 Verktøy» on (store, plates, measures shown); `"0"` or missing = off (`renderShell()` sets `body.tools-off`) | `#tools-btn` click | `toolsOn()` |
| `norsken-tab` | left-column tab: `"table"` («Bord»), `"book"` («Reservasjoner») or `"marks"` («Merking»). Default `"table"`. | the `.tabs` click handler | the `activeTab` IIFE |
| `norsken-presets-v1` (`MINE_KEY`) | saved setups from «★ Oppsett», keyed by room id: `{ spisestua: [...], domino: [...], <salon id>: [...] }`, each entry `{ name, at, tables, fixtures }` | `saveMine()` | `loadMine()` |
| `norsken-undo-<room id>` (`UNDO_KEY`, e.g. `norsken-undo-spisestua`, `norsken-undo-domino`) | `{ label, at, state }`: the whole plan from just before the floor was replaced | `rememberFloor()` (called by `presetLayout()`, `applyLayout()`, «Tomt rom» `#reset-btn`) | `readUndo()`; removed by `undoFloor()` |
| `norsken-update-check` (`UPDATE_KEY`) | `{ at, latest: { n, zip, page, name } or null, skip }` | `checkForUpdate()`, «Senere» on the update bar | `checkForUpdate()`, the «Senere» handler |

### Per-tab storage (forgotten when the tab closes)

| Key | Holds | Written by | Read by |
|---|---|---|---|
| `norsken-room-salong` (`SALON_KEY`) | id of the salon open in this tab. A salon is remembered per tab so a new tab (the boss's ResDiary button) always starts in Spisestua. | `goRoom()` (set for a salon, removed for Spisestua/Domino) | the `ROOM_ID` IIFE (checked BEFORE `norsken-room`) |
| `norsken-rig` (`RIG_KEY`) | `"1"` while the full-screen room editor «✏️ Flytt bord» is open | `goRoom(id, true)`, `#rig-open`; removed by «Ferdig» (`rigAction("done")`) and `goRoom(id)` | the `RIG` IIFE |
| `norsken-pending-shift` | a shift key chosen on the «☀ I dag» screen while a salon was open | `chooseShift()` in a salon, which then calls `goRoom("spisestua")` | an IIFE at the end of `src/app.js`, which removes it and runs `chooseShift()` in Spisestua |

Notes on the tables:

- **Presets**: `layoutSnapshot()` strips `GUEST_FIELDS` = `name`, `booked`, `redeck`, `redeckPax`, `seatNames`, `seatNotes`, `seatMarks`, `seatFromGuest`, `seatBefore`, `seatsRender` from every table, and puts back the table's own chair count (`seatBefore`) when the chairs came from a booking. So a saved setup or its file never carries names. The setup name is cut to 40 characters; the same name (case-insensitive) replaces the old entry. The export file is `norsken-oppsett-YYYY-MM-DD.json` with `{ norskenPresets: 1, rooms: <the same object> }`; import checks `norskenPresets === 1`, walks every id in `ROOMS`, and strips `GUEST_FIELDS` again.
- **Undo** holds a full `state` (it may contain typed table names). One level only, per room, survives closing the page. `undoFloor()` runs it through `normalizeState()` and keeps this device's `lang`, `showGrid`, `showMeasure`, `withChairs`, `brush`.
- **Update check** only does anything in the extension: `installedRelease()` reads the last part of the manifest version (`1.0.<n>`), and returns 0 elsewhere. It asks the GitHub releases API at most every 3 hours (`3 * 60 * 60 * 1000` ms; also a `setInterval` with the same period), compares `<n>` with the `-<n>` at the end of the tag, links the `Norsken.zip` asset (else the release page), and `skip` remembers a version the user postponed with «Senere».
- **Not in storage**: the CSV from «Last ned liste» (`resdiary-YYYY-MM-DD_HHMM.csv`, stays in Downloads), the setup file above, the hosted copy's print download `norsken-oppsett-YYYY-MM-DD.html` (has `state` and `guests` baked in as `window.__NORSKEN_STATE__` / `__NORSKEN_GUESTS__`), and the «📤 Send bordkart» link (below).
- **How the list arrives** (details on [[ResDiary import]]): the «Til Norsken» bookmark opens `…/norsken/#fra-resdiary` and hands the list over in memory with `postMessage` (`{ norsken: <text> }`); the page only accepts it from an origin matching `RESDIARY_ORIGIN`, ignores the same text again within 60 s (`lastHandoff`), and answers `"norsken-ok"`. Nothing goes in the address (`importFromHash()` also wipes `#fra-resdiary`). The older bookmark put the list after `#import=`; `importFromHash()` still reads that, wipes it from the address bar with `history.replaceState`, and shows a toast asking for the new button. After a successful paste import («Lim inn fra ResDiary» or Ctrl+V) the clipboard is overwritten with an empty string.

## Rooms: ROOM_DEFS, ROOMS, ROOM_ID and per-room keys

`ROOM_DEFS` at the top of `src/app.js` lists 13 rooms. Each entry has `id`, `no`, `en`, `profile`, `keys` (words matched against Område on the house map, `houseRoomOf()`), `x`/`y`/`w`/`h` (position on the «🏠 Norsken» map, in map units, not cm), and for salons `apero` and `size` (first guess of the room in cm). The code comment says: «The ids are storage keys: never rename them.»

| id | profile | key | shared doc |
|---|---|---|---|
| `spisestua` | `"home"` (house rules, presets, position numbering) | `norsken-layout-v3` | `plan/current` |
| `domino` | `"domino"` (overflow room) | `norsken-layout-domino-v1` | `plan/domino` |
| `bar`, `toddy`, `danske`, `arneberg`, `moterom`, `kristiania`, `atheneum`, `bibliotek`, `r1818`, `r1814`, `r1772` | `"salong"` (plain rooms; see [[Aperitif]]) | `norsken-layout-<id>-v1` | `plan/<id>` |

`ROOMS` is built from `ROOM_DEFS`: it adds `name: r.no`, and `key` / `doc` default to `` `norsken-layout-${r.id}-v1` `` / `` `plan/${r.id}` `` when the entry has none (only Spisestua and Domino set them).

- `ROOM_ID` is a `const` worked out ONCE at load: the per-tab `norsken-room-salong` if it names a salon, else `norsken-room` if it names a non-salon room, else `"spisestua"`. `IS_SALON` = that room's profile is `"salong"`. Switching room = `goRoom(id)`: `save()`, write the right key, `location.reload()`. Only the open room's plan is in memory as `state`.
- Per room: `STORAGE_KEY = ROOMS[ROOM_ID].key`, `SHARED_DOC = ROOMS[ROOM_ID].doc`, `UNDO_KEY = norsken-undo-${ROOM_ID}`, and the room's list inside `norsken-presets-v1`.
- NOT per room: `norsken-guests-v1`. There is one guest list for the day; `guests.room[guestId]` says which room a placement belongs to (missing = `"spisestua"`, see `guestRoom()`).
- The other room's plan (Spisestua ↔ Domino) is edited straight in storage, without `normalizeState()`: `readRoomPlan(id)` returns the parsed plan only if it has tables, else `null`. `overflowToDomino()` starts Domino as `{ tables: dominoStarter() }` if it was never opened; the missing fields are filled by `normalizeState()` the first time Domino is opened. `releaseOtherRoomSeats()` does nothing in a salon.
- Room sizes: Spisestua `dims.room = { w: 700, h: 1360 }` (cm, measured). Domino `DOMINO_ROOM = { w: 500, h: 650 }` (from photos, not measured); a Domino plan with no room size or the old guess 600 × 1000 is moved to `DOMINO_ROOM` by `normalizeState()`. A salon starts at its `ROOM_DEFS` `size` (fallback 500 × 500); the room editor changes it in steps of 50 cm, clamped 200–3000.

## The `state` object (one room's plan)

Created by `defaultState()`, loaded by `loadState()` → `normalizeState()`, written whole by `save()`. View settings (language, grid, selection) are saved in the same blob.

| Field | Default | Meaning |
|---|---|---|
| `lang` | `"no"` | `"no"` or `"en"` |
| `selected` | `null` | id of the selected table (persists across reloads) |
| `showGrid` | `true` | «Rutenett» in «Innstillinger» |
| `showMeasure` | `false` | «Mål» panel in «Innstillinger» |
| `withChairs` | `true` | «Med stoler» in «Innstillinger»: whether clearance/aisle maths counts the chairs (`occupiedCm()`); it does not hide chairs on the screen, but `print.html` leaves chairs out of its clearance maths when it is false |
| `dims` | `cloneDims()` of `DEFAULT_DIMS`; `room` replaced by `DOMINO_ROOM` in Domino and by the `ROOM_DEFS` `size` in a salon | every size in cm, see below |
| `tables` | Spisestua `starterTables()` (8 small, 6 big, 1 oval, 2 rect, 4 long, all in the tray); Domino `dominoStarter()`; a salon `[]` | all tables, on the floor and in the tray |
| `apero` | salons only: `ROOM_DEFS` `apero !== false`; `undefined` elsewhere | «🥂 Brukes til aperitiff» in the room editor |
| `sized` | salons only: `false`; `undefined` elsewhere | the room size has been confirmed in the room editor (`rigAction("sized")`; `importMapsFromHash()` sets it `true`) |
| `fixtures` | Spisestua: `double-1` (left wall, along 24), `double-2` (left, 68), `waitress` (bottom, 50). Every other room: none. | the doors drawn on the map (`doorButton()`) |
| `furniture` | `[{ id: "sidebord", size: "sidebord", wall: "bottom", along: 20 }]`; `[]` in a salon | the old fixed table; kept and synced by `syncFurniture()` but no longer drawn |
| `paintings` | Spisestua: 9 paintings from `defaultPaintings()`; elsewhere `[]` | `{ id, wall, along, span, name }`; currently not drawn on the map |
| `showPaintings` | `false` | dormant (its button `#paintings-btn` is not in `src/index.html`) |
| `selectedPainting` | `null` | dormant |
| `bookingsText` | `""` | old free-text bookings box. The textarea is gone and `normalizeState()` now always sets it to `""` («the old pasted list is not kept any more»); it is not shared. |
| `bookingOrder` | `DEFAULT_BOOKING_ORDER` = `"3, 6, 5, 8, 10, 9, 11, 7, 2, 4"` | «Prioritet» for [[Auto seating]] (max 120 chars; empty → default) |
| `overflow` | `"redeck"` | when Spisestua is full: `"redeck"` («Dekk om et bord (↻)») or `"domino"` («Bruk Domino») |
| `sitMinutes` | `60` | «Minutter før et bord kan dekkes om»; clamped 15–300 when typed |

Fields not in `defaultState()`, added later by code:

| Field | Set by | Meaning |
|---|---|---|
| `floorKind` | `presetLayout()` (not in Domino) | `"usual"`, `"lunch"` or `"jul"`: which ready setup is on the floor. `chooseShift()` lays a new setup only in Spisestua and only if this differs from the shift's `floor` (see [[Shifts and start screen]]). |
| `hideChairs` | «Skjul alle stoler» / «Vis stolene» (`#chairs-toggle`) | hides chairs on the screen map (`seatNodes()` returns nothing). `print.html` does not read it, although the comment above the click handler says the printout follows it. |
| `printNoChairs` | «🪑 med stoler» / «🪑 uten stoler» (`#print-chairs`) | `print.html` draws no chairs when true |
| `brush` | the «Merking» palette | `null`, a seat-mark key from `SEAT_MARKS` (`"gluten"`, `"laktose"`, `"notter"`, `"skalldyr"`, `"diabetes"`, `"gravid"`, `"vegetar"`, `"veganer"`, `"pescetar"`, `"annet"`, `"onske"`), `"note"` or `"seatname"` |

### dims

`DEFAULT_DIMS` (cm): `room {w:700,h:1360}`, `small {d:115}`, `big {d:135}`, `oval {w:90,l:165}`, `rect {w:80,l:120}`, `long {w:90,l:105}` (one langbord half), plates `plateS {w:37,l:90,n:2}`, `plateM {w:49.5,l:90,n:4}`, `plateL {w:55.5,l:90,n:2}`, `plateXL {w:64,l:90,n:1}` (`w` = how much gap it fills, `n` = how many exist), `sidebord {w:60,l:178}`, `chairBig {d:54}`, `chairSmall {d:45}`, `cover {d:60}`, `aisle: 90`, `snap: 10`, and `est` (true = still a guess, shown as «anslag»; true today for `long`, `sidebord`, `rect`, `chairSmall`, `cover`, `oval`). `v` is `DIMS_VERSION` (now **11**).

`mergeDims(saved)`: saved sizes win, EXCEPT a size not marked as measured (`saved.est[size] !== false`) when the saved `v` differs from `DIMS_VERSION`; then the newer placeholder wins. `room`, `aisle` and `snap` are always taken from the saved plan. A number someone typed under «Mål» (which sets `est[size] = false`) is never overwritten. **Bump `DIMS_VERSION` whenever you change a placeholder.** Two one-off moves: `v < 8` (small 132 → 130, plateM.n 2 → 4) and `v < 11` (small 130 → 115, big 150 → 135, oval 100×180 → 90×165), each only if the old number is still there. More on sizes: [[Chairs and plates]].

### A table

`makeTable(size, zone = "tray")` creates `{ id, label: "", zone, x: 50, y: 50, rotated: false, plates: null, gapPlates: null, seatTurn }` and `applySize()` adds `size` and `kind`.

| Field | Meaning |
|---|---|
| `id` | `t-<base36 time>-<6 random chars>` from `uid()` |
| `size` | `"small"`, `"big"`, `"oval"`, `"rect"` or `"long"` (`SIZES`) |
| `kind` | derived from `SIZE_KINDS`: small and big → `"round"`, oval → `"oval"`, rect → `"rect"`, long → `"plate"` (the langbord half is kind `"plate"`, a name kept for the CSS class); `"furniture"` for the sidebord |
| `zone` | `"room"` (on the floor) or `"tray"` (storage) |
| `x`, `y` | centre in **percent** of room width/height (cm only via `centerCm()`) |
| `rotated` | boolean |
| `label` | the number shown, set by `relabelRoom()`; «Til lager» resets it to `""` (a salon table taken away in the room editor keeps its number) |
| `manual` | a hand-typed number such as `"1a"`, or `null`. Salon tables get one when they are made (`nextTableNumber()`) |
| `lead` | set by `relabelRoom()`: false for every langbord half except the one that carries the number |
| `group` | `` `g-${uid()}` `` (so `g-t-…`) shared by the halves of one langbord, else absent/`null` |
| `gapPlates` | plate sizes dropped in the gap ABOVE this table, e.g. `["plateM","plateS"]`; only grouped floor tables, never the first in the group |
| `custom` | `{ w, l }` cm for one langbord half (clamped `w` 30–400, `l` 50–900), else `null` |
| `seatTurn` | degrees the chair ring is turned; `makeTable()` gives 30 to an oval and 45 to everything else; if missing on load, 45 for an unrotated round table, else 0 |
| `seatCount` | chair count set by hand, by a booking, by a ready setup or by the room editor; `seatCount()` caps it at 40. Missing or 0 = no chairs (`ROUND_DEFAULT_SEATS` and `OVAL_DEFAULT_SEATS` are 0, and every other kind also gets 0) |
| `seatFromGuest`, `seatBefore` | chairs were set from a booking's size; `seatBefore` is what to go back to |
| `ends`, `endSide` | end chairs (ignored on round tables, `endSeatsOf()`): `ends` is `0`, `1` or `2`; with `1`, `endSide: "end"` means the bottom/right end, anything else the top/left |
| `seatAngles` | `{ seatIndex: degrees }` chairs dragged by hand |
| `seatMarks`, `seatNotes`, `seatNames` | objects keyed by seat index: mark key, note text, name on that chair |
| `name` | a name typed on a table without a booking (max 28 chars) |
| `fixed` | `true` = «🔒 Står fast» in the room editor: the table cannot be dragged |
| `home` | `{ x, y, rotated }` in cm: where a salon table stood when «Ta bort» took it away in the room editor; `rigPutBack()` puts it back there and deletes the field |
| `booked`, `redeck`, `redeckPax` | older fields: `clearBookedNames()` clears them and `print.html` still reads `redeck`/`redeckPax`, and `tableButton()` / `renderCallouts()` / `renderRoom()` still show `table.redeck`, but nothing in today's `src/app.js` sets `booked` to true or assigns `table.redeck` / `table.redeckPax` (unclear if still needed; the live «↻» state is `guests.redeck` and `guests.redeckHint`) |
| `plates` | always `null` (old field) |

Baked fields, written so `print.html` never redoes the geometry:

- `save()`: `w`, `h` (percent of the room; nothing in `src/` reads them today), `guests` (number of chairs, `null` in the tray), `seatsRender` = `[{ x, y, mark, note, name, a }]` in percent (`null` in the tray).
- `relabelRoom()`: `label`, `lead`, `guests`, and on each group's lead `groupInfo = { count, gaps, strips }` (`print.html` draws plates from `strips`).
- `overflowToDomino()` also writes `guests` on the Domino table it picks.

If the printout needs something new, bake it here rather than teaching `print.html` the maths.

### Loading and migration: normalizeState()

`normalizeState(parsed)` is pure and runs BEFORE `state` exists (at `let state = loadState()`) and again for every remote update (`applyRemote()`), for «Angre» (`undoFloor()`), and after a `#kart=` link in a salon. No tables → `defaultState()` (except that a salon keeps an empty `tables` array). Otherwise: defaults spread under the saved fields; `fixtures` reset to `defaultFixtures()` when empty or in any room but Spisestua; paintings normalized (`normalizePaintings()`); `furniture` reset when empty or in a salon, else the sidebord moved to the bottom wall once (`migrateFurniture()`); `dims` via `mergeDims()` (plus the Domino room fix above); `showGrid`, `withChairs`, `showMeasure`, `showPaintings` forced to booleans; `bookingsText` emptied; `bookingOrder` ≤ 120 (empty → default); a plan older than dims v10 with no oval table gets one (a small or big table labelled 16 on the floor becomes the oval and a copy of it goes to the tray; otherwise an oval is added to the tray); and per table: plate sizes turned into `"long"`, unknown sizes into `"small"`, `kind` recomputed, `rotated` forced to a boolean, `ends` forced to 0/1/2, `seatTurn` filled in if missing, `custom` clamped, `plates = null`, `gapPlates` filtered to real plate sizes on grouped floor tables; a group of one is dissolved and the first table in each group loses its `gapPlates`.

Any exception inside returns `defaultState()`, which silently wipes the layout on the next `save()`. That is why it must not call anything that reads `state` (`room()`, `centerCm()`, `orderGroup()` …); the comment in the code says so. See the TDZ section on [[Render loop]].

### What save() does

`save()` runs `releaseEmptySeats(state.tables)` (chairs given to a party go back when nobody sits there, or when the table is in the tray), bakes the fields above, writes the WHOLE `state` to `STORAGE_KEY`, and calls `scheduleShare()`.

## The `guests` object (the day's bookings)

```js
{
  file: "",       // where the list came from: "ResDiary", "utklippstavla"/"clipboard", or a file name
  day: "2026-11-21", // dayKey(): `${year}-${month+1}-${date}`, no zero padding
  list: [ /* bookings, sorted by time */ ],
  placed: {},     // guestId -> tableId
  room: {},       // guestId -> ROOM_ID when it was placed: in practice "spisestua" or "domino" (missing = "spisestua")
  redeck: {},     // guestId -> true: a second sitting at a table already used («↻»)
  redeckHint: {}, // guestId -> table label: waiting in «Uten bord» for that table to be laid again
  arrived: {},    // guestId -> true: ticked «✓» when they came
}
```

Salons hide «Reservasjoner», «Merking», the shift switch and «☀ I dag» (`body.salon` in `src/styles.css`), so placements are made in Spisestua or Domino.

One booking in `list` (built in `importBookings()`):

| Field | Meaning |
|---|---|
| `id` | `g<base36 Date.now()><index>` from `newGuestId()` |
| `time` | `"HH:MM"` (zero-padded) from the paste/bookmark path; the CSV path keeps the file's text with `.` turned into `:` |
| `name` | last name, max 40 chars |
| `pax` | number of guests, or `null` (the paste/bookmark path uses 2 when the number is missing) |
| `note` | the ResDiary comment (max 200 from the paste/bookmark path, 120 from the CSV path); if Område had extra words, such as «Fast meny i Spisestue», those come first, joined with ` · ` |
| `area` | `"spisestua"`, `"domino"` or `"other:<område in lower case>"` (`areaOf()`; an empty Område counts as Spisestua) |
| `areaLabel` | the Område as shown: «Spisestua», «Domino», or the original text |
| `rd` | ResDiary's own «Bord» column. Stored, not read anywhere today. |
| `event` | only after a ★ tap: `true`/`false` overrides the automatic check in `isEvent()` |

Life cycle:

- `loadGuests()` fills missing maps with `{}`; its empty fallback is `{ file: "", list: [], placed: {}, room: {}, redeck: {} }`, so code always uses `guests.redeckHint?.` / `guests.arrived?.` or creates the map first.
- `importBookings()` replaces everything: `{ file, day: dayKey(), list, placed: {}, room: {}, redeck: {} }`. `arrived` and `redeckHint` start empty.
- «Tøm lista» (`#guest-clear`) sets `{ file: "", list: [], placed: {}, room: {}, redeck: {} }`.
- A placement only counts while its table is on the floor in the open room (`guestTable()`, `guestsOn()`, `isUnplaced()`), so a booking whose table went to the tray is back in «Uten bord». `guestsOn()` also only counts bookings in the shown shift (`inShift()`).
- «Angre» for list changes uses `guestSnapshot()` (deep copy) and `restoreGuests()`.
- The «☀ I dag» screen opens at load when the list is empty or `guests.day !== dayKey()` (not in a salon).

Pattern for any change: mutate `guests`, then `saveGuests()`, then `save()` (chair counts depend on guests), then `render()`.

## Shared plan (hosted copy only)

`connectShare()` runs at load. Without `window.claude?.use` it does nothing and storage stays local. In the hosted copy it opens the shared store (`window.claude.use("db")`) and listens to the doc `SHARED_DOC` (`plan/current`, `plan/domino` or `plan/<salon id>`). If the store cannot be opened, the status is «Bare på denne enheten».

- Doc body: `{ plan: <JSON string>, writer: CLIENT_ID, at: <ms> }`. `CLIENT_ID` is random per page load.
- Only `SHARED_KEYS` are shared: `tables`, `fixtures`, `furniture`, `dims`, `paintings`, `bookingOrder`. `norsken-guests-v1` is never shared.
- `sharedPayload()` sends `layoutOnly(state.tables)`: a copy of the tables with every `GUEST_FIELDS` entry removed (`name`, `booked`, `redeck`, `redeckPax`, `seatNames`, `seatNotes`, `seatMarks`, `seatFromGuest`, `seatBefore`, `seatsRender`) plus `guests`, and with a booking's chair count swapped back to the table's own (`seatBefore`). So typed names, chair notes and allergy marks stay on the device.
- `applyRemote()` runs the incoming tables through `layoutOnly()` too, then copies this device's own guest fields back onto tables with the same `id` (and its booking-given `seatCount`), drops any `bookingsText`, and writes the result to `STORAGE_KEY`.
- First snapshot: a plan in the store replaces the local one (`applyRemote()`); an empty store gets this device's plan (`pushShare()`). 10 s without an answer → keep working, status «Ikke lagret – prøver igjen».
- `scheduleShare()` debounces `pushShare()` by 700 ms. Nothing is pushed while a drag is running (it reschedules), or if the body equals the last one sent. A permission error (message matching `/perm|denied|forbid|role|level/i`) sets `share.canWrite = false` («Kun visning»); other errors retry after 4 s.
- Later snapshots from other writers are applied unless a drag is running. `applyRemote()` keeps this device's `lang`, `showGrid`, `showMeasure`, `withChairs`, `brush`, `showPaintings`, `selectedPainting`, and `selected` if that table still exists.
- Caveat: `overflow`, `sitMinutes`, `floorKind`, `hideChairs`, `printNoChairs` and, in a salon, `apero` and `sized` are neither shared nor kept, so a remote update resets them to the `defaultState()` values (or `undefined`) on that device. Unclear whether that is intended.
- Status chip `#sync-status`: «Kobler til…», «Lagrer…», «Delt plan · HH:MM», «Kun visning», «Ikke lagret – prøver igjen», «Bare på denne enheten».

## Salon maps by link: «📤 Send bordkart»

Each browser keeps its own salon maps, so `packMaps()` (button `#maps-send` in «★ Oppsett») packs every salon that has tables into `{ norskenMaps: 1, maps: { <salon id>: { tables: layoutOnly(...), room: dims.room, apero } } }`. The JSON is deflated (`CompressionStream("deflate-raw")`, prefix `z`) or left raw (prefix `j`), base64url-encoded, and put after `#kart=` on the website address (`SITE`). The link is shared with `navigator.share`, copied to the clipboard, or shown in a `prompt`. No guest fields go in it.

`importMapsFromHash()` (at load and on `hashchange`) wipes the hash, checks `norskenMaps === 1`, and for each salon id writes `tables`, `dims.room` (fallback 500 × 500), `apero` and `sized: true` into that salon's key, keeping the plan's other fields. The old values are kept in memory so the toast's «Angre» can put them back.

## What print.html reads

`src/print.html` reads storage itself, with the key names written out (`roomKey()`): the room's plan, chosen by `?room=<id>` (any room id it knows; anything else → Spisestua). The plain «Skriv ut» link from Spisestua and Domino has no `?room=`, so it always prints Spisestua and adds Domino beside it in an `<iframe>` (`print.html?room=domino&embed=1`) when `dominoInUse()` finds bookings, names or chairs there; a salon's link adds `?room=<id>`. For Spisestua and Domino it also reads the other room's plan, `norsken-guests-v1` and `norsken-shift`; a salon prints its map only and reads neither the other plan nor the guests. In the hosted print file it uses `window.__NORSKEN_STATE__`, `__NORSKEN_GUESTS__`, `__NORSKEN_ROOM__`, `__NORSKEN_SHIFT__` instead (and skips the Domino side map).

From `state` it uses `tables`, `lang`, `withChairs`, `printNoChairs`, `fixtures`, `dims`; from tables `id`, `label`, `guests`, `name`, `lead`, `group`, `groupInfo`, `gapPlates`, `seatsRender`, `seatCount`, `redeck`, `redeckPax`, `size`, `kind`, `custom`, `rotated`, `x`, `y`, `zone`; from guests `list`, `placed`, `room`, `redeck`, `redeckHint`, `arrived`, and on each booking `id`, `time`, `name`, `pax`, `note`, `area`, `areaLabel`, `event`. Renaming any of these breaks the printout. See [[Printing]].

## Related

- [[Files and build]]
- [[Render loop]]
- [[Extension, website and releases]]
- [[Auto seating]]
- [[Chairs and plates]]
- [[ResDiary import]]
- [[Shifts and start screen]]
- [[Reservations list]]
- [[House map]]
- [[Aperitif]]
- [[Printing]]
- [[Rules]]
- [[Open questions and ideas]]
