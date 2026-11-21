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
It opens by itself on a new day. «🧰 Verktøy» hides the store and plates so the everyday screen stays
simple. Everything is in `src/app.js` (section «Lunsj · Middag · Arrangement» and «the new look») and
the `#today` dialog in `src/index.html`.

## Constants and stored values

| Name | Value | Notes |
|---|---|---|
| `SHIFT_KEY` | `"norsken-shift"` | localStorage key for the chosen shift (per browser). |
| `SHIFT` | `""`, `"lunsj"`, `"middag"`, `"arrangement"`, `"middag+arrangement"`, `"lunsj+arrangement"` | Read at start-up; any other stored value is read as `""` (= the whole day, «Alle»). |
| `LUNCH_ENDS` | `15 * 60` | Minutes after midnight: before 15:00 is lunch. |
| `EVENT_WORDS` | `/fast meny\|meny for alle\|selskap\|arrangement\|julebord\|bankett\|\bkurs\b\|\bevent\b\|konferanse/i` | What makes a booking part of an arrangement. |
| `TOOLS_KEY` | `"norsken-tools"` | `"1"` = «🧰 Verktøy» on; `"0"` or missing = off. |

`SHIFTS` (the list behind the switch and the cards):

| `key` | `no` / `en` | `icon` | `floor` | `combo` | `short` |
|---|---|---|---|---|---|
| `lunsj` | Lunsj / Lunch | ☀️ | `"lunch"` | – | – |
| `middag` | Middag / Dinner | 🌙 | `"usual"` | – | – |
| `arrangement` | Arrangement / Event | ★ | `null` | – | – |
| `middag+arrangement` | Middag + Arrangement / Dinner + Event | 🌙★ | `"usual"` | `true` | «Middag+★» |
| `lunsj+arrangement` | Lunsj + Arrangement / Lunch + Event | ☀️★ | `"lunch"` | `true` | «Lunsj+★» |

`floor` is the ready setup a card lays out (`presetLayout()` kinds `"usual"` = «Vanlig oppsett»,
`"lunch"` = «Lunsj-oppsett»); `null` keeps the floor as it is.

## What counts as an event: `isEvent(g)`

1. `g.event === true` → event; `g.event === false` → not an event. This is the boss's ★ choice.
2. Otherwise: `EVENT_WORDS` is tested against `g.areaLabel || g.area` and against `g.note`.

So «Fast meny i Spisestue» in Område makes an event: the import puts that text first in the comment
(the booking still sits in Spisestua), and «fast meny» matches. See [[ResDiary import]].

**The ★ button** (`starButton()`): ☆ grey, ★ gold (`.g-star.on`, `#d39b2a`), on every booking in
«Uten bord» and «Bordene». Titles: «Trykk for å merke som del av arrangementet» / «Del av
arrangementet – trykk for å ta bort». A click handler on `document` (capture phase, `stopPropagation`)
sets `g.event = !isEvent(g)`, then `saveGuests()` and `render()`. After one tap the booking has a fixed
`true`/`false` and no longer follows the words; there is no button to go back to automatic. A new import
starts fresh.

## Which part of the day: `shiftOfTime()` and `inShift()`

- `shiftOfTime(g)`: `minutesOf(g.time) < LUNCH_ENDS` → `"lunsj"`, otherwise `"middag"`. A missing or
  unreadable time (`minutesOf()` wants `H:MM` or `HH:MM`) counts as **middag**.
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
  show the shift's bookings; a table used by another shift looks free.
- `assignBookings()` – only the shift's bookings are seated, including Domino's own ones
  ([[Auto seating]]).
- «Uten bord» in `renderReservations()` ([[Reservations list]]).
- `houseCounts()` for «🏠 Norsken» ([[House map]]).
- `src/print.html` has its own copy of `EVENT_WORDS`, `isEvent` and `inShift` (it also accepts `12.00`)
  and reads `norsken-shift` itself; the list title gets « · Middag» etc. Change both ([[Printing]]).

Not filtered by shift: `doubleOf()` (the whole day), `placeGroup()` (all unplaced bookings of the group),
and the totals in the «Reservasjoner» note line.

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

`#shift-switch` (`<nav aria-label="Del av dagen">`), drawn by `renderShell()` on every `render()`.
- One button per shift where `shiftShown()` is true **or** it is the current `SHIFT`, then «Alle»
  (`data-shift=""`) last.
- Single shifts show icon + name; combos show the short label «Middag+★» / «Lunsj+★». When there is a
  list, each button also shows the people count «42 pers» (`counts[key].p`); «Alle» shows the day total.
- Current shift: class `on`, `aria-pressed="true"`.
- Under 1600 px wide the icons and the word «pers» are hidden (CSS).
- Click → `setShift(key)`: sets `SHIFT`, saves `norsken-shift`, runs `guestSeats()` on every table on
  the floor (chairs follow the shown bookings), `save()`, `render()`. Toast (3 s): «Viser bare middag.»
  (the name lower-cased, e.g. «Viser bare middag + arrangement.») or «Viser hele dagen.» for «Alle».
- The switch **only changes the view**. It does not lay a setup or seat anyone; that is what the cards
  on «☀ I dag» do.

Also in the top bar: `#today-date` shows a short date (`nb-NO`, weekday/day/month short) with the long
date as its title.

## The «☀ I dag» start screen

A modal dialog `#today` in `src/index.html` with three numbered steps. `openToday()` = `renderToday()` and
show; `closeToday()` hides it. While it is open, `renderShell()` re-renders it on every `render()`, so it
updates as soon as a list arrives.

### When it opens
- **By itself at start-up**: at the very end of `src/app.js`, if `importFromHash()` returned `false` and
  `!guests.list.length || guests.day !== dayKey()` – no list yet, or the list is from another day.
  `dayKey()` is the local date as `` `${year}-${month + 1}-${day}` `` without zero padding
  (e.g. `2026-11-21`); `importBookings()` stores it in `guests.day`.
- After a successful «🍽 Til Norsken» handoff and after an old `#import=` link ([[ResDiary import]]).
- By the «☀ I dag» button (`#today-btn`) in the top bar.

### How it closes
✕ (`#today-close`), a click on the dark backdrop, Escape, «👀 Se på kartet først», «🖨 Skriv ut» (closes,
then clicks the normal print button `#print-btn`), or picking a shift card.

### What `renderToday()` shows
- Kicker: today's long date (`todayText()`, `nb-NO`). Title by the hour: before 12 «God morgen», before
  17 «God dag», else «God kveld».
- **1 «Hent dagens bookinger»** – note: with no list, «Raskest: trykk bokmerket «Til Norsken» på
  ResDiary-utskriften. Eller kopier med «Til bordplan» og trykk knappen under.»; with a list, «N bookinger
  i lista (i dag).» or, for an old list, «N bookinger i lista – fra en tidligere dag? Lim inn dagens for å
  starte på nytt.» Below: the link «🔧 Få ResDiary-knappen (gjøres én gang per PC)» to
  `https://uwu6967.github.io/norsken/bokmerke.html` (new tab), «📋 Lim inn fra ResDiary» (`#today-paste`,
  just clicks `#res-paste`) and «Åpne fil» (`#today-file`, `.csv`/`.txt` → `importBookings()`). The step
  gets class `done` (a tick) when there is a list.
- **2 «Velg»** – the shift cards in `#today-shifts` (below).
- **3 «Skriv ut»** – «🖨 Skriv ut» and «👀 Se på kartet først».
- With no list, steps 2 and 3 get class `off` (dimmed).

Note: when bookings are already placed, «📋 Lim inn fra ResDiary» asks «Bytte ut dagens liste? Trykk
igjen» – but that text appears on `#res-paste` in the Reservasjoner tab, not on the start screen button,
so on the start screen the first press seems to do nothing; a second press within 4 s goes through.

### The shift cards
- Cards: `SHIFTS.filter((sh) => !sh.combo || shiftShown(sh, counts))` – Lunsj, Middag and Arrangement
  are always there; a combo only when `shiftShown()` allows it. Combos are sorted **first**, drawn wide
  (`.shift-card.wide`) with the badge «Anbefalt i dag».
- Each card (`data-choose="<key>"`): icon, name, «N bookinger · P gjester» («1 booking» for one), or
  «Ingen bookinger» – then the card is `disabled`. The current shift has class `on`.
- The small note, then « · » and the floor note:

| Card | Note | Floor note |
|---|---|---|
| combo | «alle i begge» | «Vanlig oppsett» / «Lunsj-oppsett» |
| Lunsj | «før 15:00», plus «, uten arrangementet» on an event day | «Lunsj-oppsett» |
| Middag | «fra 15:00», plus «, uten arrangementet» on an event day | «Vanlig oppsett» |
| Arrangement | «fast meny, selskap …» | «Beholder gulvet som det er» |

  "Event day" = `counts.arrangement.b > 0`.

### `chooseShift(key)` – one press does it all
1. `before = guestSnapshot()` (deep copy of `guests`).
2. `SHIFT = key`, saved to `norsken-shift`.
3. **Setup**: if the shift has a `floor`, the room is **Spisestua** (`ROOM_ID === "spisestua"`) and
   `state.floorKind !== sh.floor`, then `presetLayout(sh.floor)` lays out «Vanlig oppsett» or
   «Lunsj-oppsett». `presetLayout()` first saves the old floor with `rememberFloor()` (localStorage
   `norsken-undo-<room>`) and sets `state.floorKind`. If the floor is already that kind, it is left alone –
   hand changes made after the setup are kept. In Domino, and for Arrangement, the floor is never changed.
4. `guestSeats()` on every table on the floor, then `assignBookings()` for the shift's bookings without a
   table ([[Auto seating]]), `save()`, `render()`, `closeToday()`.
5. Toast (10 s) with «↶ Angre»: «Middag: 23 bookinger ved bord, 2 uten bord (nytt oppsett). Klar til
   utskrift.» – «, N uten bord» only when some are left, « (nytt oppsett)» only when a setup was laid.
   «ved bord» counts rows of `bookingResult.rows` that got a table (this includes ones sent to Domino);
   «uten bord» the rest (including ones waiting for a re-set table).
6. **Angre**: if a setup was laid, `undoFloor()` brings back the floor from before (toast «Gulvet er
   tilbake slik det var.»), then `restoreGuests(before)` puts every placement back (toast «Tilbake som
   før.»). The chosen `SHIFT` itself stays.

## «🧰 Verktøy» – the tools toggle

- `#tools-btn` in the top bar. `toolsOn()` is `localStorage["norsken-tools"] === "1"`, so **off by
  default**. A click writes the opposite (`"0"`/`"1"`) and calls `render()`.
- `renderShell()` sets `body.tools-off` when off, and on the button class `active` and `aria-pressed`.
  Title: «Vis lager, bordplater og mål».
- CSS (`src/styles.css`): `body.tools-off .board > .tray { display: none !important; }` hides the tray –
  «Lager / ikke i bruk» (the store) and «Bordplater» (plates). On screens at least 1100 × 620 px the board
  becomes two columns (`minmax(300px, 380px) minmax(0, 1fr)`) so the map gets the room.
- Only the tray is hidden. The measures (Mål) are in «⚙ Innstillinger» and are not affected, although the
  button's title mentions them.
- Under 1600 px wide the small top-bar buttons («🧰», «🏠», «★», «⚙») show only their icon.

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
