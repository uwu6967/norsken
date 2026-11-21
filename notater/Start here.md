---
title: Start here
tags: [norsken, index]
updated: 2026-11-21
---
# Start here

This folder is the shared notebook for **Norsken**, the table planner for the restaurant at Norske
Selskab. Open the folder `notater/` as a vault in Obsidian. Everything here is plain Markdown, so it
also reads fine on GitHub.

**Before you change anything:** read [[Rules]], [[Decisions]] and [[People and how they work]].
**After you change something:** add a line to [[Change log]], update the page for the feature you
touched, and write any new decision in [[Decisions]]. Keep the notebook true – a wrong note is worse
than no note.

## Map of the notebook

### 01 Overview
- [[What Norsken is]] – the app in one page: rooms, bookings, the boss's three presses.
- [[People and how they work]] – who uses it, how the restaurant works, how Danny likes to work.

### 02 Architecture
- [[Files and build]] – `src/` is the source; `tools/build.py` makes everything else.
- [[Storage and data]] – every localStorage key, the shape of `state` and `guests`.
- [[Render loop]] – how a screen update happens, the drag system, the start-up trap.
- [[Extension, website and releases]] – the website, the Chrome/Edge extension, automatic releases.
- [[Testing]] – how to test with Playwright and made-up names.

### 03 Features
- [[ResDiary import]] – the «🍽 Til Norsken» button and the other bookmarks.
- [[Shifts and start screen]] – Lunsj · Middag · Arrangement, «☀ I dag».
- [[Auto seating]] – «Fordel bord automatisk» and the house rules.
- [[Chairs and plates]] – chairs that follow the party, langbord and plates.
- [[Reservations list]] – «Uten bord», «Bordene», ticks, search, groups.
- [[Printing]] – the A4 printout.
- [[House map]] – «🏠 Norsken», the whole club as a heat map.

### 04 Rules and decisions
- [[Rules]] – what must always hold (privacy, commits, building).
- [[Decisions]] – what was decided and why, newest first.

### 05 Plans
- [[Aperitif]] – next big feature: aperitif tables in the other rooms.
- [[Open questions and ideas]]

### 06 Log
- [[Change log]] – what changed, day by day.
