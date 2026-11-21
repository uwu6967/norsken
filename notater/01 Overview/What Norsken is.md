---
title: What Norsken is
tags: [norsken, overview]
updated: 2026-11-21
---
# What Norsken is

Norsken is a one-page web app that plans the tables for the restaurant at Norske Selskab, a private
club in Oslo. It takes the day's bookings from ResDiary, lays out the tables, gives every party a
table by the house rules, and prints an A4 sheet with the map and a tick list. It runs entirely in the
browser: no server, no login, and the guest list never leaves the PC it was opened on.

## The boss's day – three presses
1. In ResDiary, open **Diary → Print** and press the **«🍽 Til Norsken»** bookmark. The website opens
   with the day's bookings (see [[ResDiary import]]).
2. Press **Lunsj**, **Middag**, **Arrangement** or **Middag + Arrangement** on the start screen. The
   right floor setup is laid out and the parties get tables (see [[Shifts and start screen]] and
   [[Auto seating]]).
3. Press **«🖨 Skriv ut»** (see [[Printing]]).

## Where it runs
- **The website** – https://uwu6967.github.io/norsken/ (GitHub Pages, from `main`). This is what the
  boss uses.
- **The Chrome/Edge extension** – the same app in `extension/`, from the `Norsken.zip` release.
- **The hosted copy** – a shared copy that uses `window.claude` for a shared plan and for printing by
  download. Keep those lines working.
See [[Extension, website and releases]].

## Rooms
- **Spisestua** – the main dining room, tables 1–16: small and big round tables, the oval 16,
  metal tables, langbord built from halves and plates (see [[Chairs and plates]]).
- **Domino** – the room next door, its own map; the last resort when Spisestua is full.
- **The rest of the club** – 1772, 1814, 1818, Bibliotek, Møterom, Atheneum, Kristiania, Arneberg,
  Danske kjelleret, Toddy, Bar – shown in «🏠 Norsken» (see [[House map]]). They have no table maps yet;
  that is the [[Aperitif]] plan.

## Main screens
- Top bar: date, the shift switch (Lunsj · Middag · Arrangement · Alle), Domino/Spisestua, «☀ I dag»,
  «🧰 Verktøy», «🏠 Norsken», «★ Oppsett», «🖨 Skriv ut» + «🪑», «⚙ Innstillinger».
- Left column tabs: **Bord** (the selected table), **Reservasjoner** (see [[Reservations list]]),
  **Merking** (allergy marks per chair).
- Middle: the map. Right (only with «🧰 Verktøy»): the store and the plates.

## Related
[[Start here]] · [[People and how they work]] · [[Files and build]] · [[Decisions]]
