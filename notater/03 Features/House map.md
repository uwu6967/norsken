---
title: House map
tags: [norsken, house-map, bookings]
updated: 2026-11-21
---
# House map

«🏠 Norsken» is a pop-up map of the whole club, not just Spisestua: every guest room is a box,
coloured by how many guests are booked there in the chosen shift, so the boss sees at a glance where
the evening is busy (cards in 1772, a private party in Arneberg, a full Spisestua). Tapping a room
lists who is booked there. It reads only the guest list already in the app (the ResDiary «Område» of
each booking, or the table a booking sits at); it changes nothing. All code is in `src/app.js` under
«🏠 Norsken: the whole club as a heat map» (`HOUSE_ROOMS`, `houseRoomOf()`, `houseCounts()`,
`heatColor()`, `renderHouse()`, `openHouse()`, `closeHouse()`), the markup is `#house` in
`src/index.html`, and the styles are the `.house*` rules in `src/styles.css`.

## Opening and closing
- Button `#house-btn` in the top bar: «🏠 Norsken». The word «Norsken» (`#house-btn-text`) is hidden
  by CSS on screens narrower than 2100 px, so usually only 🏠 shows. The button text and the dialog
  title «Norsken» are not translated.
- `openHouse()` clears the open room (`houseOpenRoom = null`), calls `renderHouse()`, shows `#house`
  and focuses the close button.
- Closes with ✕ (`#house-close`, aria-label «Lukk»), a click on the dark backdrop, or Esc.
- Each room box is `tabindex="0" role="button"`; Enter or Space on a focused room acts as a click.
- It is a modal over the whole page (`z-index: 120`). It renders only when opened and when a room is
  tapped; it does not redraw by itself if the guest list changes underneath.

## The drawing: `HOUSE_ROOMS`
The rooms follow the real floor plan as an L (comment: «the L from the floor plan (Danny 2026-11-21):
1772 down to Atheneum, along Akersgata to Spisestua»). Coordinates are in the drawing's own units,
not centimetres. The SVG is `#house-map` with `viewBox="190 690 1360 670"` (x 190–1550,
y 690–1360). Only guest rooms are drawn – no kitchen, office or stairs ([[Decisions]]).

| `id` | `name` | `keys` | x | y | w | h |
|---|---|---|---|---|---|---|
| `r1772` | 1772 | `1772` | 1370 | 710 | 160 | 110 |
| `r1814` | 1814 | `1814` | 1370 | 820 | 160 | 140 |
| `r1818` | 1818 | `1818` | 1370 | 960 | 160 | 170 |
| `bibliotek` | Bibliotek | `bibliotek`, `library` | 1235 | 800 | 130 | 220 |
| `moterom` | Møterom | `møterom`, `moterom`, `møte` | 1140 | 1020 | 130 | 110 |
| `atheneum` | Atheneum | `atheneum`, `ateneum`, `athenaeum` (`atheneum` is listed twice) | 1300 | 1135 | 240 | 175 |
| `kristiania` | Kristiania | `kristiania`, `christiania` | 1140 | 1135 | 160 | 185 |
| `arneberg` | Arneberg | `arneberg` | 985 | 1020 | 155 | 300 |
| `danske` | Danske kjelleret | `danske`, `kjeller` | 838 | 1140 | 147 | 180 |
| `toddy` | Toddy | `toddy` | 632 | 1140 | 206 | 180 |
| `domino` | Domino | `domino` | 472 | 1140 | 160 | 180 |
| `bar` | Bar | `bar` | 472 | 950 | 230 | 185 |
| `spisestua` | Spisestua | `spisestue`, `spisestua` | 210 | 870 | 262 | 470 |

How the L reads: 1772, 1814 and 1818 stack down the right edge; Bibliotek sits to the left of 1814 /
1818 and Møterom below Bibliotek; then the bottom row runs right to left – Atheneum, Kristiania,
Arneberg (tall, reaching up beside Møterom), Danske kjelleret, Toddy, Domino – with Bar above Toddy /
Domino, and Spisestua as the tall room at the far left.

Whether one room is really called «Danske kjelleret» in ResDiary is still open
([[Open questions and ideas]]).

## Which room a booking counts in: `houseRoomOf(g)`
1. **Seated at a table**: if `guests.placed[g.id]` and `guests.room[g.id]` are both set, the booking
   counts in `"domino"` when its room is Domino, otherwise in `"spisestua"` – whatever its Område
   says. (So a booking from another Område placed by hand on a Spisestua table shows in Spisestua.)
2. **Not seated**: `g.area` (default `"spisestua"`). `"spisestua"` and `"domino"` are used as they
   are. `g.area` is set at import by `areaOf()`: any Område containing «spisest» → `spisestua`,
   containing «domino» → `domino`, anything else → `other:<text in lower case>` with the original
   text in `g.areaLabel` ([[ResDiary import]]).
3. **Other Område**: the label is `g.areaLabel` (else the area without `other:`), in lower case. The
   first room in `HOUSE_ROOMS` order with a key that **equals** the label or is **contained in** it
   wins. Example: «Middag i Arneberg» → `arneberg`.
4. **No match**: the key `other:<label>`. These rooms are not on the drawing and show under
   «Andre rom».

The match is a plain substring test, so a short key such as `bar` matches any Område that contains
those letters, and order matters when two keys could match. To teach the map a new spelling, add it
to that room's `keys` (lower case).

## Counting: `houseCounts()` and the shift
- Goes through `guests.list` and skips every booking where `inShift(g)` is false. So the map follows
  the shift chosen in the top bar's shift switch (Lunsj · Middag · Arrangement · combined · «Alle»),
  stored in localStorage `norsken-shift`; `""` («Alle») is the whole day. There are no time buttons
  in the map itself ([[Decisions]]). See [[Shifts and start screen]].
- Per room key it keeps `{ people, bookings, label }`: `people` adds `Number(g.pax) || 0` (a booking
  with no party size adds 0 here – unlike [[Auto seating]], which counts it as 2), `bookings` is the
  list, `label` is the `areaLabel` of the first booking seen (else the key).
- Guests come from localStorage `norsken-guests-v1`, this browser only ([[Storage and data]]).

## Colour: `heatColor(people, most)`
- No guests: `rgba(255,255,255,0.06)` (almost invisible on the dark map).
- Otherwise a straight blend from light sand `rgb(240,215,150)` to deep red `rgb(178,34,34)` by
  `t = min(1, people / most)`, where `most` is the busiest room's count in this shift. The busiest
  room is always full red.
- Above `t > 0.55` the text switches to light (class `on-dark` on the room text; the «Andre rom»
  chips get `color:#fff`).

## Drawing: `renderHouse()`
For each room in `HOUSE_ROOMS` an SVG `<g class="house-room" data-house-room="<id>">` with:
- a `<rect>` (`rx="10"`) filled with `heatColor()`; the open room gets class `open` (thick yellow
  outline `#ffd36b`);
- the name, sized to fit: a two-word name is split on two lines when the box is under 200 wide
  («Danske kjelleret»); font size `max(18, min(34, w × 0.9 / (longest line × 0.58)))`;
- when anyone is booked, a second line «N pers» («N ppl» in English) at
  `min(40, font size × 1.15)`.

The class `quiet` (dashed, faint) is supported by the code and CSS, but no room in `HOUSE_ROOMS` sets
`quiet` now.

## The side panel (`#house-side`)
From top to bottom:
1. «Gjester: N» – every guest in the shift, all rooms together.
2. «Andre rom» – only when some bookings matched no room. One chip per `other:` key, sorted by most
   guests first, coloured with the same `heatColor()`, text «<Område> · N». A chip is clickable like a
   room. (The code comment here still says «1772, 1814, 1818 …» – those are on the drawing now.)
3. **The open room**, after a tap: «<room> · N gjester», then its bookings sorted by time (no time
   last), one line each: **time** · name · «Np». An open room with no bookings: «Ingen booket her.»
   Nothing open: «Trykk på et rom for å se hvem som er booket der.»

Tapping the open room (or chip) again closes it (`houseOpenRoom` toggles).

Under the map, `#house-note`: «Farge = hvor mange gjester som er booket i rommet. Rødt er der det er
flest.» – or, when the guest list is empty, «Lim inn dagens liste under Reservasjoner først.»

The names come from the local guest list and are shown on screen only; nothing from the map is saved
or shared.

## Leftovers in the CSS
`.house-times` (and `.house-times .chip.active`) style the time buttons that were removed; no element
uses them now.

## Changing the map
- Move or resize a room: change its `x`, `y`, `w`, `h` in `HOUSE_ROOMS`. Keep it inside the
  `viewBox` in `src/index.html`, or widen the `viewBox` too.
- A new room: add an entry with a unique `id`, the display `name` and lower-case `keys`. Mind the
  order if its keys could also match another room's Område.
- Then run `python3 tools/build.py` ([[Files and build]]) and test with made-up bookings
  ([[Testing]]).
- The planned aperitif tables would use these same rooms ([[Aperitif]]).

## Related
- [[ResDiary import]]
- [[Shifts and start screen]]
- [[Reservations list]]
- [[Storage and data]]
- [[Auto seating]]
- [[Aperitif]]
- [[Decisions]]
- [[Open questions and ideas]]
- [[Files and build]]
- [[Testing]]
