---
title: Decisions
tags: [norsken, decisions]
updated: 2026-11-21
---
# Decisions

What was decided, and why. Newest first. When something here changes, write the new decision
on top and say what it replaces – don't delete the old one.

## 2026-11-21
- **Mixed tables**: a party put on a table from «🔔 Hvem sitter hvor» **joins** the party there (one
  sitting, chairs add up) – it is never a swap like a drag on the map. Stored as `guests.sat`. Parties
  that had an aperitif place also count as one sitting at their dinner table (they sit down together at
  the pling); the table still shows the earliest booked time. Same rule on the printout.
- **How aperitif places are given** (`assignAperitif()` in `src/app.js`): it runs inside the boss's
  one press when «🥂 Aperitiff» is on (switched on by itself when a comment or Område says aperitiff,
  velkomstdrink, hummer-/krepseaften). Only Spisestua/Domino bookings that arrive **before the pling**
  (default 18:00, set with − / + in 15-minute steps). «Alle før pling» or «Bare arrangementet». Bookings on the same
  dinner table at the same time drink together. **Biggest party first**; each gets the smallest own table
  that fits, then a table with extra chairs, then a «🔗 Kan deles» table in a room that has one. A
  «⛔ Reservert» table (Arneberg's first fireplace for the board) is never given out. A place set by
  hand is kept on the next run; «– ingen –» keeps a party out. Shown on the printout under the dinner
  table – still one A4 page.
- **Aperitif rooms** (Danny): every room except Spisestua, Domino, Bibliotek, the card rooms 1772/1814/1818
  and Danske kjelleret (no seating). The boss chooses who gets a spot; **biggest parties first**. Pling
  around 18:00. One party per table, except shared places such as **the fireplace in Arneberg** – and the
  first fireplace in Arneberg is **reserved for the board** when they are there.
- **Every room has its own table map** (`ROOM_DEFS`); salons are plain rooms – no presets, no position
  numbering, a number given at creation is kept. A salon picked in a tab is remembered for that tab only.
- **The room editor** is full-screen with big buttons; a drop outside the room stops at the wall;
  «🔒 Står fast» tables cannot be dragged; «Ta bort» remembers the spot.
- **Salon maps go to another PC by link** («📤 Send bordkart») – layout only, never guests.
- **The guest list never travels in a web address.** «🍽 Til Norsken» opens the website and hands the
  list over in memory (`postMessage`), accepted only from a ResDiary page; ResDiary gets «norsken-ok»
  back. *Replaces:* the `#import=` address, which a privacy review showed stays in the browser history
  (and can be synced) even after the address bar is wiped. Old buttons still work but ask for the new one.
- **The hosted copy shares the layout only** – no names, chair notes, allergy marks, typed table names
  or chairs set by a booking. Each device keeps its own guest fields; a remote layout merges into them.
  The old stored shared plan was deleted (unread) so nothing guest-related is left there.
- **The old pasted list (`bookingsText`) is not kept**, and the clipboard is emptied after a pasted import.
- **Shared notebook** in `notater/` (Obsidian vault) for everything about the project – features,
  rules, decisions, plans. Kept neutral and free of guest data.
- **History cleaned** so GitHub shows only `uwu6967`: commit messages and old file versions rewritten,
  old releases replaced by one fresh release. The branches other than `main` are **kept**.
- **The hosted copy stays working** (its `window.claude` lines stay), even though GitHub is otherwise
  clean.
- **Rights in the name «Daniel Hj»**, all rights reserved.
- **README is a short guide** in Norwegian: three daily steps, first-time setup, «Jeg vil …» table,
  «Hvis det stopper opp». Bookmark codes moved to `resdiary/README.md`.
- **Bookmark by dragging**: `bokmerke.html` has one big green «🍽 Til Norsken» button to drag to the
  bookmarks bar – no code to copy. Linked from the «☀ I dag» screen.
- **Shifts mean ordinary guests**: Lunsj and Middag are the ordinary guests; Arrangement is the event's
  guests; «Middag + Arrangement» (and «Lunsj + Arrangement») is both, shown only when the event is in
  that part of the day, first on the start screen and marked «Anbefalt i dag». *Replaces:* the first
  version where Middag also contained the event guests.
- **Arrangement is found** from Område or comment words (fast meny, selskap, arrangement, julebord,
  kurs …), and the boss can change it per booking with ☆/★.
- **Lunch ends at 15:00.**
- **The boss uses the website**, so one-click import targets https://uwu6967.github.io/norsken/.
- **New look**: «☀ I dag» start screen (opens by itself on a new day), shift switch in the top bar,
  store/plates hidden behind «🧰 Verktøy», small buttons icon-only on laptops.
- **One-click import** via `#import=` in the address, wiped at once with `history.replaceState`.
- **«🏠 Norsken» map** follows the real floor plan as an L: 1772 → 1814 → 1818 down the right, then
  along Akersgata to Spisestua. Only guest rooms; no kitchen/office/stairs. No title question and no
  time buttons – it always shows the whole day (of the chosen shift).
- **Aperitif seating** is wanted for **any** arrangement, not one event type. See [[Aperitif]].
- **Langbord with no plates is drawn as one table**; with plates it stays in parts.
- **A whole group** from another room (e.g. Onsdagsklubben) can be dragged to one table by its heading.
  Not for Spisestua (would put everyone on one table).

## 2026-11-20
- **Printout grouped by room**: Spisestua, Domino, then the other rooms alphabetically.
- **Double booking** is red only when the same name is booked under 1½ hours apart; otherwise a quiet
  «↔ også …» note (cards first, dinner later is normal).
- **Print with or without chairs** is its own button (🪑) and does not follow the on-screen
  «Skjul alle stoler».
- **A long list shrinks** to keep the printout on one page.
- **«Fast meny i Spisestue»** sits in Spisestua, and the words are put first in the comment.
- **Table wishes** in comments («Gjerne bord 6 eller 11») are tried first; bookings with a wish are
  placed before the others; unmet wishes are named in the message.
- **Allergy/diet words** in comments become the same colour codes as chair marks – only a hint,
  nothing is marked on a chair by itself.
- **«✓ kommet»** tick per booking; the table gets a green ring when everyone has arrived.
- **«↶ Angre»** also for the guest list (Ta alle av bordene, Tøm lista, name dragged back).
- **A booking whose table left the floor** goes back to «Uten bord» instead of being lost.

## 2026-11-18
- **Chairs follow the booking**, also on tables with a set number of chairs; the table gets its own
  number back when empty. Bookings **at the same time** on one table are one party: chairs add up.
- **Printout is A4 landscape** when there is a guest list: map left, list right with tick boxes and
  comments. No «Trenger plate» on paper. Long names shrink instead of breaking mid-word.
- **«Tidspunkt» in the table box is locked** behind «🔒 Endre» so it isn't changed by accident.
- **Drag a booking back** to the left column to take it off a table.
- **Re-set («↻ Dekk om») is only suggested**, never placed by itself.
- **Område decides the room**: Spisestue → Spisestua, Domino → Domino, every other area is its own room
  and is never put on our tables by «Fordel bord».
- **The oval table seats up to 8.**
- **All rights reserved** (not open source).

## Before 2026-11-18
- Domino is the last resort: Spisestua fills first.
- Everything on one screen on a PC; phones scroll.
- No chairs until a table has people.
- One download (`Norsken.zip`) that is both the extension and a double-click app.
- Website on GitHub Pages.

## Related
[[Rules]] · [[Change log]] · [[Open questions and ideas]]
