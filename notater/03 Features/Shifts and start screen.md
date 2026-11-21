---
title: Shifts and start screen
tags: [norsken, shifts, start-screen, ui]
updated: 2026-11-21
---
# Shifts and start screen

The restaurant works in parts of the day, so Norsken shows one part at a time: **Lunsj** (ordinary
guests before 15:00), **Middag** (ordinary guests from 15:00) or **Arrangement** (the guests of a fixed
menu, private party, course …), plus the combined «Middag + Arrangement» / «Lunsj + Arrangement» on a
day with an event. The chosen part is the variable `SHIFT`, and it filters the map, the chairs, the
lists, auto seating and the printout. The «☀ I dag» start screen is the boss's way in: get today's
bookings, press one shift card (which lays the right setup and gives out the tables in one go), print.
It opens by itself on a new day (not in a salon). «🧰 Verktøy» hides the store and plates so the everyday
screen stays simple. The logic is in `src/app.js` (the constants in the early block near the top, the
functions in the sections «Lunsj · Middag · Arrangement» and «the new look: shift switch, «I dag» start
screen, tools», `starButton()` just after `importFromHash()`), the markup is the `#today` dialog and the
top bar in `src/index.html`, the look is in `src/styles.css`.

## Constants and stored values

| Name | Value | Notes |
|---|---|---|
| `SHIFT_KEY` | `"norsken-shift"` | localStorage key for the chosen shift (per browser). |
| `SHIFT` | `""`, `"lunsj"`, `"middag"`, `"arrangement"`, `"middag+arrangement"`, `"lunsj+arrangement"` | Read at start-up; any other stored value is read as `""` (= the whole day, «Alle»). |
| `LUNCH_ENDS` | `15 * 60` | Minutes after midnight: before 15:00 is lunch. |
| `EVENT_WORDS` | `/fast meny\|meny for alle\|selskap\|arrangement\|julebord\|bankett\|\bkurs\b\|\bevent\b\|konferanse/i` | What makes a booking part of an arrangement. |
| `TOOLS_KEY` | `"norsken-tools"` | `"1"` = «🧰 Verktøy» on; `"0"` or missing = off. |
| `norsken-pending-shift` | a `SHIFTS` key | In this tab's own storage (forgotten when the tab closes): a shift card pressed in a salon, run once after the reload into Spisestua. |

`SHIFTS` (the list behind the switch and the cards):

| `key` | `no` / `en` | `icon` | `floor` | `combo` | `short` / `shortEn` |
|---|---|---|---|---|---|
| `lunsj` | Lunsj / Lunch | ☀️ | `"lunch"` | – | – |
| `middag` | Middag / Dinner | 🌙 | `"usual"` | – | – |
| `arrangement` | Arrangement / Event | ★ | `null` | – | – |
| `middag+arrangement` | Middag + Arrangement / Dinner + Event | 🌙★ | `"usual"` | `true` | «Middag+★» / «Dinner+★» |
| `lunsj+arrangement` | Lunsj + Arrangement / Lunch + Event | ☀️★ | `"lunch"` | `true` | «Lunsj+★» / «Lunch+★» |

`floor` is the ready setup a card lays out (`presetLayout()` kinds `"usual"` = «Vanlig oppsett»,
`"lunch"` = «Lunsj-oppsett»); `null` keeps the floor as it is.

## What counts as an event: `isEvent(g)`

1. `g.event === true` → event; `g.event === false` → not an event. This is the boss's ★ choice.
2. Otherwise: `EVENT_WORDS` is tested against `g.areaLabel || g.area` and against `g.note`.

So «Fast meny i Spisestue» in Område makes an event: `importBookings()` puts that text first in the comment
(`areaOf()` still gives `area: "spisestua"`, `areaLabel: "Spisestua"`), and «fast meny» matches in the note.
See [[ResDiary import]].

**The ★ button** (`starButton()`): ☆ faded (`.g-star`, opacity 0.35), ★ gold (`.g-star.on`, `#d39b2a`),
on every booking in «Uten bord» and «Bordene». Titles: «Trykk for å merke som del av arrangementet» /
«Del av arrangementet – trykk for å ta bort». A click handler on `document` (capture phase,
`stopPropagation`) sets `g.event = !isEvent(g)`, then `saveGuests()` (the field is kept in the booking in
`norsken-guests-v1`) and `render()`. After one tap the booking has a fixed `true`/`false` and no longer
follows the words; there is no button to go back to automatic. A new import starts fresh.

## Which part of the day: `shiftOfTime()` and `inShift()`

- `shiftOfTime(g)`: `minutesOf(g.time) < LUNCH_ENDS` → `"lunsj"`, otherwise `"middag"`. A missing or
  unreadable time (`minutesOf()` wants exactly `H:MM` or `HH:MM`) counts as **middag**.
- `inShift(g, shift = SHIFT)`:
  - `""` → every booking;
  - otherwise the key is split on `+`, and the booking is in if **any** part fits:
    `arrangement` → `isEvent(g)`; `lunsj` / `middag` → `!isEvent(g) && shiftOfTime(g) === part`.

So **Lunsj and Middag are the ordinary guests only**; the event's guests are only in Arrangement or a
combo. Examples:

| Booking | Lunsj | Middag | Arrangement | Middag + Arrangement | Lunsj + Arrangement |
|---|---|---|---|---|---|
| 12:00, ordinary | ✓ | | | | ✓ |
| 19:00, ordinary | | ✓ | | ✓ | |
| 19:00, «fast meny» | | | ✓ | ✓ | ✓ |
| 12:30, «selskap» | | | ✓ | ✓ | ✓ |

(Every event booking is in both combos, whatever its time; the time only decides which combo is
*offered*, see `shiftShown()`.)

Where the filter applies (all through `inShift()`):
- `guestsOn(table)` – so the map, the name labels, the chair counts (`guestSeats()`) and «Bordene» only
  show the shift's bookings; a table used by another shift looks free. `assignBookings()` also uses
  `guestsOn()` to find taken tables, so such a table is free for auto seating too.
- `assignBookings()` – only the shift's bookings are seated, including Domino's own ones
  ([[Auto seating]]).
- «Uten bord» in `renderReservations()` ([[Reservations list]]).
- `houseCounts()` for «🏠 Norsken» ([[House map]]).
- `src/print.html` has its own copy of `EVENT_WORDS`, `isEvent` and `inShift`. Its time test is
  `/^(\d{1,2})[:.](\d{2})/`, so it also accepts `12.00` and ignores anything after the minutes (the import
  paths already turn `.` into `:`). It takes the shift from `window.__NORSKEN_SHIFT__` when set (baked
  into the print file the hosted copy offers as a download), else reads `norsken-shift` itself, without
  checking the value. The arrivals title becomes «Ankomster · Middag» etc. Change both copies together
  ([[Printing]]).

Not filtered by shift: `doubleOf()` (the whole day), `placeGroup()` (all unplaced bookings of the group),
and in the «Reservasjoner» note line (`#res-note`) the booking total and the «ved bord her» count – only
its «uten bord» count follows the shift.

## Counting: `shiftCounts()` and `shiftShown()`

`shiftCounts()` returns, for every `SHIFTS` key and for `""`, `{ b, p }` = number of bookings and
number of people (sum of `pax`, unknown = 0). A booking counts in every key it is in.

`shiftShown(sh, counts)` decides which shifts are offered:
- `lunsj`, `middag`: always.
- `arrangement`: only when `counts.arrangement.b > 0`.
- a combo `<base>+arrangement`: only when there are ordinary bookings in the base
  (`counts[base].b > 0`) **and** at least one event booking whose time is in that base
  (`shiftOfTime(g) === base`). So «Middag + Arrangement» appears only when the event is in the evening,
  «Lunsj + Arrangement» only when it is at lunch.

## The shift switch in the top bar

`#shift-switch` (`<nav class="shift-switch" aria-label="Del av dagen">`), drawn by `renderShell()` on
every `render()`.
- One button (`.shift-tab`, `data-shift="<key>"`) per shift where `shiftShown()` is true **or** it is the
  current `SHIFT`, then «Alle» (`.shift-tab.all`, `data-shift=""`) last.
- Single shifts show icon + name; combos (`.combo`) show the short label «Middag+★» / «Lunsj+★». The
  button title is the full name. When there is a list, each button also shows the people count
  «42 pers» (`counts[key].p`); «Alle» shows the day total as a bare number.
- Current shift: class `on`, `aria-pressed="true"`.
- Under 1800 px wide (the `max-width: 1599px` and `1600px–1799px` rules in `src/styles.css`) the icons
  and the word «pers» are hidden.
- Click → `setShift(key)`: sets `SHIFT`, saves `norsken-shift`, runs `guestSeats()` on every table on
  the floor (`roomTables()`; chairs follow the shown bookings), `save()`, `render()`. Toast (3 s):
  «Viser bare middag.» (the name lower-cased, e.g. «Viser bare middag + arrangement.») or «Viser hele
  dagen.» for «Alle».
- The switch **only changes the view**. It does not lay a setup or seat anyone; that is what the cards
  on «☀ I dag» do.

Also in the top bar: `#today-date` shows a short date (`nb-NO`, weekday/month short, day numeric) with the
long date as its title.

## The «☀ I dag» start screen

A full-screen modal `<div class="today" id="today" role="dialog" aria-modal="true" hidden>` in
`src/index.html`, with an `<ol class="today-steps">` of three numbered steps. `openToday()` =
`renderToday()` and show; `closeToday()` hides it. While it is open, `renderShell()` re-renders it on
every `render()`, so it updates as soon as a list arrives.

### When it opens
- **By itself at start-up**: right after the `importFromHash()` handling in `src/app.js` (not at the very
  end of the file), if `importFromHash()` returned `false`, the room is not a salon (`!IS_SALON`) and
  `!guests.list.length || guests.day !== dayKey()` – no list yet, or the list is from another day.
  `dayKey()` is the local date as `` `${year}-${month + 1}-${day}` `` without zero padding
  (e.g. `2026-11-21`, but `2026-1-5` in January); `importBookings()` stores it in `guests.day`.
- After a successful «🍽 Til Norsken» handoff, and after an old `#import=` link (even when nothing could
  be read from it) ([[ResDiary import]]).
- By the «☀ I dag» button (`#today-btn`) in the top bar.

### How it closes
✕ (`#today-close`), a click on the dark backdrop (the `#today` element itself), Escape, «👀 Se på kartet
først» (`#today-look`), «🖨 Skriv ut» (`#today-print`: closes, then clicks the normal print link
`#print-btn` «Skriv ut / PDF»), or picking a shift card.

### What `renderToday()` shows
- Kicker: today's long date (`todayText()`, `nb-NO`). Title by the hour: before 12 «God morgen», before
  17 «God dag», else «God kveld».
- **1 «Hent dagens bookinger»** – note: with no list, «Raskest: trykk bokmerket «Til Norsken» på
  ResDiary-utskriften. Eller kopier med «Til bordplan» og trykk knappen under.»; with a list, «N bookinger
  i lista (i dag).» or, for an old list, «N bookinger i lista – fra en tidligere dag? Lim inn dagens for å
  starte på nytt.» Below: the link «🔧 Få ResDiary-knappen (gjøres én gang per PC)» (`#today-setup`) to
  `https://uwu6967.github.io/norsken/bokmerke.html` (new tab), «📋 Lim inn fra ResDiary» (`#today-paste`,
  just clicks `#res-paste`) and «Åpne fil» (hidden input `#today-file`, accepts `.csv`/`.txt` →
  `importBookings()`). The step gets class `done` when there is a list: the number circle turns a lighter
  green (`#2f7a4f`); no tick is drawn (the `::after` rule has empty content).
- **2 «Velg»** – the shift cards in `#today-shifts` (below).
- **3 «Skriv ut»** – «🖨 Skriv ut» and «👀 Se på kartet først».
- With no list, steps 2 and 3 get class `off`: opacity 0.45 and `pointer-events: none`, so they cannot be
  pressed.

Note: when any booking is already placed (which is always true after a shift card has run), «📋 Lim inn fra
ResDiary» asks «Bytte ut dagens liste? Trykk igjen» via `armed()` – but that text appears on `#res-paste`
in the Reservasjoner tab, not on the start screen button, so on the start screen the first press seems to
do nothing; a second press within 4 s goes through.

### The shift cards
- Cards: `SHIFTS.filter((sh) => !sh.combo || shiftShown(sh, counts))` – Lunsj, Middag and Arrangement
  are always there; a combo only when `shiftShown()` allows it. Combos are sorted **first**, drawn wide
  (`.shift-card.wide`) with the badge «Anbefalt i dag».
- Each card (`<button class="shift-card" data-choose="<key>">`): icon, name, «N bookinger · P gjester»
  («1 booking» for one), or «Ingen bookinger» – then the card gets class `empty` and is `disabled`. The
  current shift has class `on`.
- The small note, then « · » and the floor note:

| Card | Note | Floor note |
|---|---|---|
| combo | «alle i begge» | «Vanlig oppsett» / «Lunsj-oppsett» |
| Lunsj | «før 15:00», plus «, uten arrangementet» on an event day | «Lunsj-oppsett» |
| Middag | «fra 15:00», plus «, uten arrangementet» on an event day | «Vanlig oppsett» |
| Arrangement | «fast meny, selskap …» | «Beholder gulvet som det er» |

  "Event day" = `counts.arrangement.b > 0`.

### `chooseShift(key)` – one press does it all
0. **In a salon** (`IS_SALON`): nothing is seated there. The key is put in this tab's storage as
   `norsken-pending-shift` and `goRoom("spisestua")` reloads into Spisestua; near the end of `src/app.js` a
   small start-up block reads and removes the key and, when not in a salon and the key is a real `SHIFTS`
   key, calls `chooseShift(key)` there.
1. `before = guestSnapshot()` (deep copy of `guests`).
2. `SHIFT = key`, saved to `norsken-shift`.
3. **Setup**: if the shift has a `floor`, the room is **Spisestua** (`ROOM_ID === "spisestua"`) and
   `state.floorKind !== sh.floor`, then `presetLayout(sh.floor)` lays out «Vanlig oppsett» or
   «Lunsj-oppsett». `presetLayout()` first saves the old floor with `rememberFloor()` (localStorage
   `norsken-undo-<room>`) and at the end sets `state.floorKind` (saved with the room's plan). If the floor
   is already that kind, it is left alone – hand changes made after the setup are kept. In Domino, and for
   Arrangement, the floor is never changed.
   `state.floorKind` is only written by `presetLayout()`. «Tomt rom» replaces the state with
   `defaultState()`, which has no `floorKind`, so the next card lays its setup again; loading one of the
   saved setups («★ Oppsett», `applyLayout()`) does **not** clear it, so a card may then leave that floor
   alone.
4. `guestSeats()` on every table on the floor, then `assignBookings()` for the shift's bookings without a
   table ([[Auto seating]]), `save()`, `render()`, `closeToday()`.
5. Toast (10 s) with «↶ Angre»: «Middag: 23 bookinger ved bord, 2 uten bord (nytt oppsett). Klar til
   utskrift.» – «, N uten bord» only when some are left, « (nytt oppsett)» only when a setup was laid.
   «ved bord» counts rows of `bookingResult.rows` that got a table (this includes ones sent to Domino);
   «uten bord» the rest (including ones waiting for a re-set table).
6. **Angre**: if a setup was laid, `undoFloor()` brings back the floor from before (toast «Gulvet er
   tilbake slik det var.»), then `restoreGuests(before)` puts every placement back; its toast «Tilbake som
   før.» replaces the first one at once. The chosen `SHIFT` itself stays.

## «🧰 Verktøy» – the tools toggle

- `#tools-btn` in the top bar. `toolsOn()` is `localStorage["norsken-tools"] === "1"`, so **off by
  default**. A click writes the opposite (`"0"`/`"1"`) and calls `render()`.
- `renderShell()` sets `body.tools-off` when off, and on the button class `active` and `aria-pressed`.
  Title: «Vis lager, bordplater og mål».
- CSS (`src/styles.css`): `body.tools-off .board > .tray { display: none !important; }` hides the tray –
  «Lager / ikke i bruk» (the store, with its add row) and «Bordplater» (plates). On screens at least
  1100 × 620 px the board becomes two columns (`minmax(300px, 380px) minmax(0, 1fr)`) so the map gets the
  room.
- Only the tray is hidden. The measures (Mål) are in «⚙ Innstillinger» and are not affected, although the
  button's title mentions them.
- Under 2100 px wide (`max-width: 2099px`) the four small top-bar buttons «🧰 Verktøy», «🏠 Norsken»,
  «★ Oppsett» (`#mine-btn`) and «⚙ Innstillinger» show only their icon.

## Related
- [[ResDiary import]]
- [[Reservations list]]
- [[Auto seating]]
- [[Chairs and plates]]
- [[Printing]]
- [[House map]]
- [[Storage and data]]
- [[Render loop]]
- [[Decisions]]
