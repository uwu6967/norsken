---
title: House map
tags: [norsken, house-map, bookings, rooms]
updated: 2026-11-21
---
# House map

«🏠 Norsken» is a pop-up map of the whole club, not just Spisestua: every guest room is a box,
coloured by how many guests are booked there in the chosen shift, so the boss sees at a glance where
the evening is busy (cards in 1772, a private party in Arneberg, a full Spisestua). Tapping a room
lists who is booked there and, since the rooms «innover» got their own table maps, offers a button
to open that room's table map. It reads only the guest list already in the app (the ResDiary
«Område» of each booking, or the room a seated booking sits in); the map itself changes no data. All
code is in `src/app.js` under «🏠 Norsken: the whole club as a heat map» (`HOUSE_ROOMS`,
`houseRoomOf()`, `houseCounts()`, `heatColor()`, `renderHouse()`, `openHouse()`, `closeHouse()`),
plus `ROOM_DEFS` at the top of the file (where the rooms and their boxes are defined) and
`roomMapButton()` near the end. The markup is `#house` in `src/index.html`, and the styles are the
`.house*` rules (and `.house-go`) in `src/styles.css`.

## Opening and closing
- Button `#house-btn` in the top bar: «🏠 Norsken». The word «Norsken» (`#house-btn-text`) is hidden
  by CSS below 2100 px wide (`@media (max-width: 2099px)`), so usually only 🏠 shows. The button
  text, the dialog title «Norsken» (`#house-title`) and the map's `aria-label` «Kart over Norsken»
  are not translated.
- The room tab «Innover ▾» (`#room-innover`, in the top bar's room switch next to «Domino» and
  «Spisestua») also opens the map. It first sets `houseHint = true`, which changes the empty-panel
  text to «Trykk på et rom for å tegne eller endre bordene der.» Nothing sets `houseHint` back to
  `false`, so the hint stays until the page reloads (which every room change does). In English the
  tab reads «Other rooms ▾»; while a salon is open it shows that salon's name plus «▾» and is
  highlighted (class `on`).
- `openHouse()` clears the open room (`houseOpenRoom = null`), calls `renderHouse()`, shows `#house`
  and focuses the close button.
- Closes with ✕ (`#house-close`, aria-label «Lukk»), a click on the dark backdrop (the click target
  is `#house` itself), or Esc.
- Each room box is `tabindex="0" role="button"`; Enter or Space on a focused room (or «Andre rom»
  chip) is turned into a click.
- It is a modal dialog (`role="dialog" aria-modal="true"`) over the whole page (`position: fixed`,
  `z-index: 120`). The card is at most 1180 px wide; the side panel is a 280 px column beside the map,
  and drops under the map below 860 px wide. It renders only when opened and when a room or chip is
  tapped; it does not redraw by itself if the guest list changes underneath.

## The drawing: `HOUSE_ROOMS` and `ROOM_DEFS`
`HOUSE_ROOMS` is not its own list any more: it is `ROOM_DEFS.map((r) => ({ ...r, name: r.no }))`.
`ROOM_DEFS` (top of `src/app.js`) is the one list of every room where guests sit; each entry also
has its own table map, storage key and shared doc (Spisestua profile `home`, Domino profile
`domino`, the other eleven profile `salong`). Its `x`, `y`, `w`, `h` place the room's box on this
map; the code comment says they are «units of the floor plan, not cm» (the separate `size` field is
the room's size in cm for the room editor and is not used by the map). The comment above
`HOUSE_ROOMS` says the boxes are drawn from Danny's sketch (2026-11-20) and should be moved when a
better drawing comes. The layout follows the L of the real floor plan, 1772 down the right side and
along to Spisestua ([[Decisions]]). The SVG is `#house-map` with `viewBox="190 690 1360 670"`
(x 190–1550, y 690–1360). Only guest rooms are drawn – no kitchen, office or stairs ([[Decisions]]).

The table is in `ROOM_DEFS` order, which is also the order used when matching an Område to a room
(see below):

| `id` | `name` (`no`) | `keys` | x | y | w | h |
|---|---|---|---|---|---|---|
| `spisestua` | Spisestua | `spisestue`, `spisestua` | 210 | 870 | 262 | 470 |
| `domino` | Domino | `domino` | 472 | 1140 | 160 | 180 |
| `bar` | Bar | `bar` | 472 | 950 | 230 | 185 |
| `toddy` | Toddy | `toddy` | 632 | 1140 | 206 | 180 |
| `danske` | Danske kjelleret | `danske`, `kjeller` | 838 | 1140 | 147 | 180 |
| `arneberg` | Arneberg | `arneberg` | 985 | 1020 | 155 | 300 |
| `moterom` | Møterom | `møterom`, `moterom`, `møte` | 1140 | 1020 | 130 | 110 |
| `kristiania` | Kristiania | `kristiania`, `christiania` | 1140 | 1135 | 160 | 185 |
| `atheneum` | Atheneum | `atheneum`, `ateneum`, `athenaeum` | 1300 | 1135 | 240 | 175 |
| `bibliotek` | Bibliotek | `bibliotek`, `library` | 1235 | 800 | 130 | 220 |
| `r1818` | 1818 | `1818` | 1370 | 960 | 160 | 170 |
| `r1814` | 1814 | `1814` | 1370 | 820 | 160 | 140 |
| `r1772` | 1772 | `1772` | 1370 | 710 | 160 | 110 |

The map always shows the Norwegian name (`no`), also in English mode.

How the L reads: 1772, 1814 and 1818 stack down the right edge; Bibliotek sits to the left of 1814
and the top of 1818, and Møterom below and slightly left of Bibliotek; then the bottom row runs right
to left – Atheneum, Kristiania, Arneberg (tall, reaching up beside Møterom), Danske kjelleret, Toddy,
Domino – with Bar above Domino and the left end of Toddy, and Spisestua as the tall room at the far
left.

Whether one room is really called «Danske kjelleret» in ResDiary is still open
([[Open questions and ideas]]).

## Which room a booking counts in: `houseRoomOf(g)`
1. **Seated at a table**: if `guests.placed[g.id]` and `guests.room[g.id]` are both set, the booking
   counts in `"domino"` when `guests.room[g.id]` is `"domino"`, otherwise (any other value) in
   `"spisestua"` – whatever its Område says. (So a booking from another Område placed by hand on a
   Spisestua table shows in Spisestua.)
2. **Not seated**: `g.area` (default `"spisestua"`). `"spisestua"` and `"domino"` are used as they
   are. `g.area` is set at import by `areaOf()`: an empty Område or one containing «spisest» (any
   case) → `spisestua` (label «Spisestua»), one containing «domino» → `domino` (label «Domino»),
   anything else → `other:<text in lower case>` with the original text in `g.areaLabel`
   ([[ResDiary import]]).
3. **Other Område**: the label is `g.areaLabel` (else the area without `other:`), in lower case. The
   first room in `HOUSE_ROOMS` order (the table above) with a key that **equals** the label or is
   **contained in** it wins. Example: «Middag i Arneberg» → `arneberg`.
4. **No match**: the key `other:<label>`. These rooms are not on the drawing and show under
   «Andre rom».

The match is a plain substring test, so a short key such as `bar` matches any Område that contains
those letters (a made-up «Barnas rom» would count in Bar), and order matters when two keys could
match. To teach the map a new spelling, add it to that room's `keys` in `ROOM_DEFS` (lower case).

## Counting: `houseCounts()` and the shift
- Goes through `guests.list` and skips every booking where `inShift(g)` is false. So the map follows
  the shift chosen in the top bar's shift switch (Lunsj · Middag · Arrangement · the combined cards
  «Middag + Arrangement» / «Lunsj + Arrangement» · «Alle»), stored in localStorage `norsken-shift`;
  `""` («Alle») is the whole day. The shift switch is hidden while a salon is open, but the stored
  shift still applies. There are no time buttons in the map itself ([[Decisions]]). See
  [[Shifts and start screen]].
- Per room key it keeps `{ people, bookings, label }`: `people` adds `Number(g.pax) || 0` (a booking
  with no party size adds 0 here – unlike [[Auto seating]], which counts it as 2), `bookings` is the
  list, `label` is the `areaLabel` of the first booking seen (else the key).
- Guests come from localStorage `norsken-guests-v1`, this browser only ([[Storage and data]]).

## Colour: `heatColor(people, most)`
- No guests: `rgba(255,255,255,0.06)` (almost invisible on the dark map background `#2b241d`).
- Otherwise a straight blend from light sand `rgb(240,215,150)` to deep red `rgb(178,34,34)` by
  `t = min(1, people / max(1, most))`, where `most` is the busiest room's count in this shift
  (on-map rooms and «Andre rom» together). The busiest room is always full red.
- Text colour: on an empty room the name is light (`#f6efe3`); on a coloured room it is dark brown
  (`#2a1d12`) until `people / most > 0.55`, then it switches back to light (class `on-dark` on the
  room text; the «Andre rom» chips get `color:#fff` at the same point).

## Drawing: `renderHouse()`
For each room in `HOUSE_ROOMS` an SVG `<g class="house-room" data-house-room="<id>">` with:
- a `<rect>` (`rx="10"`) filled with `heatColor()`; the open room gets class `open` (thick yellow
  outline `#ffd36b`, `stroke-width: 7` – the same as keyboard focus);
- the name (class `hr-name`), sized to fit: a name of more than one word is split one word per line
  when the box is under 200 wide («Danske kjelleret»); font size
  `max(18, min(34, w × 0.9 / (longest line × 0.58)))`;
- when anyone is booked, a second line (class `hr-count`) «N pers» («N ppl» in English) at font size
  `min(40, font size × 1.15)`.

The class `quiet` (dashed, faint) is supported by the code and CSS, but no room in `ROOM_DEFS` sets
`quiet` now.

## The side panel (`#house-side`)
From top to bottom:
1. «Gjester: N» – every guest in the shift, all rooms together.
2. «Andre rom» – only when some bookings matched no room. One chip (`.house-chip`) per `other:` key,
   sorted by most guests first, coloured with the same `heatColor()`, text «<Område> · N». A chip is
   clickable like a room; the open chip gets an orange outline (`#e0a63a`). (The code comment here
   still says «rooms … not on the drawing yet (1772, 1814, 1818 …)» – those are on the drawing now.)
3. **The room-map button** (`roomMapButton()`, class `house-go`), only when a room on the drawing is
   open (an `other:` chip gets none):
   - Spisestua / Domino: «Åpne <room>» («Open <room>»); no button when that room is the one already
     open behind the map.
   - A salon: «✏️ Bordkart for <room> · N bord» when its saved map has tables (N = tables with
     `zone === "room"`, read from the room's own layout key `norsken-layout-<id>-v1`, or from the
     current state when it is the open room), else «✏️ Lag bordkart for <room>».
   - Clicking calls `goRoom(id, rig)`: it saves, remembers the room (a salon per tab, in the
     browser's per-tab storage `sessionStorage`, key `norsken-room-salong`; Spisestua / Domino per
     browser in localStorage `norsken-room`), for a salon also turns on the room editor (per-tab key
     `norsken-rig` = `"1"`), and reloads the page.
4. **The open room**, after a tap: «<room> · N gjester», then its bookings sorted by time (no time
   last), one line each: the time in bold (or «–»), the name (or «–»), and «Np» dimmed. An open room
   with no bookings: «Ingen booket her.» Nothing open: «Trykk på et rom for å se hvem som er booket
   der.» (or the «Innover» hint above).

Tapping the open room (or chip) again closes it (`houseOpenRoom` toggles).

Under the map, `#house-note`: «Farge = hvor mange gjester som er booket i rommet. Rødt er der det er
flest.» – or, when the guest list is empty, «Lim inn dagens liste under Reservasjoner først.»

The names come from the local guest list and are shown on screen only; nothing from the map is saved
or shared.

## Leftovers in the CSS
`.house-times` (and `.house-times .chip`, `.house-times .chip.active`, each `.active` rule written
twice) style the time buttons that were removed; no element uses them now.

## Changing the map
- Move or resize a room's box: change its `x`, `y`, `w`, `h` in `ROOM_DEFS`. Keep it inside the
  `viewBox` in `src/index.html`, or widen the `viewBox` too.
- A new room means a new `ROOM_DEFS` entry, which is also a new table map with its own storage key
  (`norsken-layout-<id>-v1` unless `key` is given) and shared doc (`plan/<id>` unless `doc` is
  given). Give it a unique `id` (the code says the ids are storage keys: never rename them), `no`,
  `en`, `profile`, lower-case `keys`, the box and a `size`. Mind the order if its keys could also
  match another room's Område.
- Then run `python3 tools/build.py` ([[Files and build]]) and test with made-up bookings
  ([[Testing]]).
- The same rooms are the salons used for the aperitif (`apero` in `ROOM_DEFS`, «🥂 Brukes til
  aperitiff» in the room editor) ([[Aperitif]]).

## Related
- [[ResDiary import]]
- [[Shifts and start screen]]
- [[Reservations list]]
- [[Printing]]
- [[Storage and data]]
- [[Auto seating]]
- [[Aperitif]]
- [[Decisions]]
- [[Open questions and ideas]]
- [[Files and build]]
- [[Testing]]
