---
title: Change log
tags: [norsken, log]
updated: 2026-11-21
---
# Change log

What changed, day by day, in plain words. The full notes are the commit messages (they are also the
release notes on GitHub). Add a line here with every change. Newest first.

## 2026-11-23
- New «🖨 Aperitiff-ark»: each salon with its map and its own pling list (party → dinner table), the A–Å
  guest list for the door with big tick boxes, free tables and walk-in lines. Always one page.
- The bar PC (1024 × 768): the PC layout with everything on one screen, the top bar in one row, names
  beside the map. (Start screen and dialogs: being checked.)
- The bar PC, screen by screen: «☀ I dag» fits with all three steps; event days keep one top row (also
  fixes ⚙ pushed off the screen on 1280–1439 px laptops); toast moved off the list; chair box smaller;
  «Hvem sitter hvor», ⚙ and ★ keep their title and ✕ while the list scrolls; the room editor's buttons
  side by side; «Åpne Domino» readable in «🏠 Norsken»; the «Ctrl+V» hint no longer hidden.
- Fixes from a review: salons that an older version saved empty now get their ready layout (a room
  switched off for the aperitif stays off); the aperitif and the sheet read the salons the same way; a
  «$'» in a booking comment no longer breaks the downloaded printout in the hosted copy.
- Salons drawn from the staff's aperitif sheet: Toddy, Bar, Arneberg, Blå værelset (= Kristiania),
  Ateneum – fireplaces 🔥, window, sofas, bar counter. Ready to use without drawing anything.
- «🖨 Aperitiff-ark»: the paper sheet printed filled in – names at the salon tables and the
  Gjesteliste with time, 🥂 place and dinner table, plus blank lines for walk-ins.
- No chairs drawn in salons; a salon still showing its suggestion prints correctly.

## 2026-11-21
- Aperitif fixes from a review: no two parties on one table after changing shift; a moved pling
  takes away places that no longer fit; a hand choice moves the whole party and can be undone;
  «Slå av» can be undone; guests without a dinner table show their 🥂 place on paper; renamed salon
  tables show the new name; a table with 0 chairs is not used; lunch never gets aperitif places.
- «🔔 Hvem sitter hvor»: a big list for the pling – name, people, table, who they share it with,
  🥂 salon; sort A–Å, table by table or salon by salon; search; ✓ when they arrive. A party without a
  table is put on one with two taps; on a table with people it joins them and the chairs add up.
- «🥂 Aperitiff før pling»: the boss's one press also finds a salon table for each party before the
  pling (biggest first; own table, then extra chairs, then a shared place; never a reserved table). Change
  a place by hand in Reservasjoner; «– ingen –» keeps a party out. Printout shows «🥂 Bar 3» under the
  dinner table and the pling time in the title. In the room editor: «🔗 Kan deles» and «⛔ Reservert».
- Room maps: 19 fixes from a review (salon shows only the table map; Angre covers drags; no stray oval
  from a map link; new tables never stack; a smaller room keeps tables inside; and more).
- Toddy suggestion (sofa groups 4+3, small table, grand piano); «Ekstra stoler»; furniture that is not
  a table («🎹 Flygel»); Domino laid out as Danny walks in from Spisestua.
- Rooms «innover»: every room of the club has its own table map; the «Innover ▾» button and «🏠 Norsken»
  open them; a full-screen editor for the phone («✏️ Flytt bord»); «📤 Send bordkart» to another PC.
- Phone: a finger sliding off the map no longer sends a table to storage; «Til lager» and a drag to
  storage can be undone; «Hummeraften» no longer shows the shellfish code.
- Privacy: list handed over between tabs (not in the address); shared plan = layout only; old shared
  data deleted; clipboard emptied after paste; table number escaped.
- Shared notebook `notater/` (this vault).
- README rewritten as a short guide; rights in the name Daniel Hj; history cleaned so only `uwu6967`
  shows.
- `bokmerke.html`: drag the green «🍽 Til Norsken» button to the bookmarks bar – no code to copy.
- «Middag + Arrangement» (and «Lunsj + Arrangement») in one press; Lunsj/Middag mean ordinary guests.
- New look: «☀ I dag» start screen, shift switch Lunsj · Middag · Arrangement · Alle, «🧰 Verktøy»,
  one-click import from ResDiary («Til Norsken»).
- «🏠 Norsken» redrawn from the real floor plan; then simplified (no question, no time buttons).
- Langbord with no plates drawn as one table; the oval in the store no longer a tiny dot; drag a whole
  group (e.g. Onsdagsklubben) to one table.

## 2026-11-20
- «🏠 Norsken»: the whole club as a heat map.
- Printout grouped by room; double bookings marked; print with or without chairs; long lists shrink to
  one page.
- «↶ Angre» for the guest list.
- Fixes: «Uten bord» empty after reload (start-up order), bookings lost when their table left the
  floor, chairs not going back, langbord name box, Domino counts on paper, saved setups keeping party
  chairs.
- Table wishes from comments («Gjerne bord 6 eller 11») tried first.
- Allergy codes from comments, in the list, beside the map and on paper.
- Search in Reservasjoner; «✓ x av y kommet»; tick off guests when they arrive.
- Fixed a missing bracket in the styles that had switched off the chair box and some list styles.

## 2026-11-19
- Every booking on the printout (also «Uten bord»); a typed table name no longer hides bookings;
  changing Tidspunkt updates the chairs; «Fordel bord» keeps the other room's «dekk om» notes.

## 2026-11-18
- All rights reserved.
- Several bookings on one table = one party with the right chairs; short labels; groups by name.
- «Tidspunkt» in the table box, locked behind «🔒 Endre».
- Drag a booking from the map back to the list.
- Printout: map left, guest list with tick boxes right; counts on top; no «Trenger plate»; names not cut.
- «Skjul alle stoler» in the Bord tab.
- Chairs follow the booking; «Navn» shows the guest.
- Område from ResDiary keeps Spisestue, Domino and other rooms apart.
- Re-set («↻ Dekk om») only suggested; chair box on double-click; the oval seats 8; edit names in the
  table list.

## 2026-11-16
- New Reservasjoner tab: paste from ResDiary, drag names, move guests.

## 2026-11-14
- Everything on one screen; «Oppsett» button with Vanlig/Lunsj/Jul and «Mine oppsett»; «Angre» for the
  floor; chairs follow the oval's round ends.

## 2026-11-13
- Website on GitHub Pages; Chrome/Edge extension (one download, keeps plans on update, tells about new
  versions); one-page printout with Domino beside Spisestua; drag chairs around their table; choose
  which end people sit at; plates only for the langbord; table rules for «Fordel bord»; «Dekk om»;
  names beside the map; all settings in one place; empty ResDiary subtotal rows removed.

## 2026-11-12
- First version: Spisestua plan, ResDiary bookmarks («Til bordplan», «Last ned liste», «Rydd liste»),
  automatic releases, guests dragged from the list onto tables, Domino as a second room (last resort),
  seat marks incl. Veganer and Pescetarianer.

## Related
[[Decisions]] · [[Start here]]
