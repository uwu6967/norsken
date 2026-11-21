---
title: Pling guide
tags: [norsken, plan, pling]
updated: 2026-11-21
---
# Pling guide

The feature after the [[Aperitif]]: when the pling sounds and everyone walks into Spisestua, the staff
must tell each party where to sit – and on free-seating nights, write down where they sat.
Status: **first version built** (2026-11-21).

## What Danny described (2026-11-21)
- Show who sits where: name, how many, chair by chair.
- Also on free-seating nights (no table booked beforehand).
- Keep track of mixed tables: a table set for 6 that gets 3 from one group and 2 from another.
- Not built yet: chair-by-chair (which chair each person has) – see Later.

## First version
- A big **«🔔 Hvem sitter hvor»** screen (phone first, big text), opened from Reservasjoner and the
  «☀ I dag» screen.
- One row per party: name, people, **→ Bord 6** (or «Domino · bord 1», or its own room such as
  «1772»), «med Testb (2)» on a mixed table, the booked time, allergy codes, and «🥂 Toddy 1» when the
  aperitif is on.
- Sort: **A–Å** (a guest says their name), **Bord for bord**, **🥂 Salong for salong** (walk room by
  room at the pling).
- Search box on top; a big «✓» to tick a party as arrived (the same tick as in Reservasjoner).
- A party without a table (free seating): **«Sett ved bord»** opens big buttons for every table on the
  floor. Tapping one puts the party there, with
  «↶ Angre». A party put on a table that already has people **joins them** – the chairs add up
  (that is the mixed table). «Ikke ved bord» takes it off again.
- The table buttons show who is there already («Testa · 3»), not free chairs – the chair count of a
  table changes with its bookings, so a «free» number would mislead.
- Code: `renderGuide()`, `guidePut()`, `sitKey()` at the end of `src/app.js`; `guestSittings()` groups by
  `sitKey()`; `src/print.html` has the same `sitKey`.
- On an aperitif evening the parties with an aperitif place sit down together at the pling, so parties
  on one table that both had an aperitif place count as one sitting.

## Later
- Colour the chairs on the map per party on a mixed table.
- A chair-by-chair view per table (which chair each person has).

## Related
[[Aperitif]] · [[Reservations list]] · [[Auto seating]] · [[Open questions and ideas]]
