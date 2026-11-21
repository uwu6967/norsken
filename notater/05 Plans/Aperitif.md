---
title: Aperitif
tags: [norsken, plan, aperitif]
updated: 2026-11-21
---
# Aperitif

The next big feature: seating parties for the **aperitif** in the other rooms of the club before they
go to their dinner table. Status: **steps 0–3 built** (2026-11-21). Next: guiding guests at the pling (see
[[Open questions and ideas]]).

## What Danny described
- On arrangement days (any arrangement – a lobster evening, julebord, courses, private parties …)
  guests arrive and first sit in the salons with an aperitif.
- Around 18:00 a bell («pling») sends them to their table in Spisestua.
- So a party needs **two places**: an aperitif spot in another room for a time window, and its dinner
  table. Tables in the other rooms must be **reserved** too, not only in Spisestua.
- The tables in the other rooms («innover» – everywhere that is not Spisestua) are not known yet.
  Danny must be able to **place them herself, room by room, on a phone**. Some tables move a bit,
  some are taken out and moved when needed.

## Chosen plan (2026-11-21)
Picked after comparing three designs (smallest-that-works, boss-simplicity, robust data model). Core of
the small design, with the phone editor of the boss-simplicity design.

**Step 0 – phone safety (done):** a finger sliding off the map no longer stores a table; «Til lager»
and drag-to-store have «↶ Angre»; «Hummeraften» no longer lights the shellfish code.

**Step 1 – a table map for every room «innover» (done)**
- `ROOM_DEFS` at the top of `src/app.js` replaces the two-entry `ROOMS` and the late `HOUSE_ROOMS`
  (same ids as the house map: `bar`, `bibliotek`, `r1772`, `r1814`, `r1818`, `moterom`, `atheneum`,
  `kristiania`, `arneberg`, `danske`, `toddy`). Profiles: Spisestua `home`, Domino `domino`, the rest
  `salong` (plain rooms: no presets, no house numbering rules, numbers given at creation and kept).
  Storage keys `norsken-layout-<id>-v1`, shared docs `plan/<id>` – layout only.
- Room bar: Domino · Spisestua · **Innover ▾** (opens «🏠 Norsken», tap a room → «✏️ Lag bordkart»).
  A salon picked in a tab is remembered for that tab only, so the boss's ResDiary button always lands
  in Spisestua.
- Full-screen phone editor «✏️ Flytt bord»: room size in 0.5 m steps the first time; «+ Lite rundt /
  Stort rundt / Ovalt / Firkant / Langt»; a new table lands in the middle, selected; drops stop at the
  wall; ← ↑ ↓ → nudges; «Plasser − / +» = capacity; «⟳ Snu»; «🔒 Står fast»; «Ta bort» to a Lager strip
  that remembers the spot; «Neste rom ›»; «Ferdig»; «↶ Angre».
- Getting the maps to the boss's PC (each browser has its own storage): «📤 Send bordkart» (a link or
  the setup file; the maps hold no guest data).

**Step 2 – a second place per booking (done):** `guests.ap` (aperitif table + room), next to the dinner place
(`guests.placed`/`guests.room` stay the dinner table). Built as `guests.ap = {on, suggested, who,
pling, placed: {booking: "salon:table"}, label: {booking: "Toddy 1"}, skip}` – in the browser only.

**Step 3 – auto seating + print (done):** `assignAperitif()` runs inside the boss's one press (Middag,
Arrangement, Middag + Arrangement) when «🥂 Aperitiff før pling 18:00» is on (suggested by words like
aperitiff, velkomstdrink, hummer-/krepseaften). Parties sharing a dinner table drink together. The A4
sheet stays one page; each row gets «🥂 Bar 3» under the dinner table, the title «· pling 18:00».

## Rooms as Danny described them (2026-11-21)
- **Toddy** (in from the reception door, windows straight ahead): by the windows, left and right, a sofa
  against the wall, a small oval table and two big armchairs – 4 people, up to 3 more chairs can be
  added (fixed). By the door, left: a small round table – 2 (at most 4). By the door, right: the grand
  piano (no seats). Built in as Toddy's ready suggestion («⭐ Legg ut forslaget»).
- **Domino** (in from Spisestua): one table to the right by the window, two to the left, the opening to
  the bar in the middle. Used for Domino's «Vanlig oppsett».
- **Arneberg**: the fireplace sofa groups can be shared; the first fireplace is reserved for the board
  when they are there.

## What exists to build on
- Each room's plan is stored per room (Spisestua, Domino) – see [[Storage and data]].
- «🏠 Norsken» already has every guest room of the club as a box (see [[House map]]).
- «Fordel bord» rules and placements per booking (see [[Auto seating]]).
- Shifts, including Arrangement (see [[Shifts and start screen]]).

## How it works now
- «☀ I dag»: the «🥂 Aperitiff før pling» switch, the pling time (− / +) and «Alle før pling /
  Bare arrangementet».
  Then one press (Middag, Arrangement, Middag + Arrangement) seats dinner **and** aperitif.
- Reservasjoner (Spisestua) has a «🥂 Aperitiff» list: «Fordel aperitiff», «Tøm», «Slå av», and a
  menu per party to move it or choose «– ingen –». A menu choice is «by hand»: kept on every new run,
  moves the whole party, and can be undone. «Slå av» keeps the places (undo switches it on again).
- Each run: hand places stay, all other places are given out fresh (see [[Decisions]]).
- Room editor: «🔗 Kan deles» (more parties may share, e.g. a fireplace) and «⛔ Reservert» (never
  given out).
- Room editor, per room: «🥂 Brukes til aperitiff: ja/nei». Starts as «nei» for Bibliotek,
  1772/1814/1818 and Danske; a map saved before this setting existed follows that default.
- Only salons that have a table map count. Spisestua and Domino are never used.

## Answered questions
- Rooms: see [[Decisions]] (2026-11-21). Spot: a table per party, shared only where marked.
- Pling: 18:00 by default, changeable, remembered. Who: the boss picks «Alle» or «Bare arrangement».
- Printout: one sheet, «🥂 Bar 3» under the dinner table.

## Related
[[Open questions and ideas]] · [[House map]] · [[Auto seating]] · [[Decisions]]
