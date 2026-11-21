---
title: People and how they work
tags: [norsken, people, workflow]
updated: 2026-11-21
---
# People and how they work

Who uses Norsken, how a day at the restaurant goes, and how Danny (who owns the project) likes the
work done. Read this before designing anything: the app is judged by whether the boss and the older
colleagues can use it without help.

## People
- **Danny** – waitress at the restaurant, owns the project (GitHub `uwu6967`; the rights are in the
  name *Daniel Hj*). Tests everything on the floor, often on the phone, and reports with screenshots.
  Writes quickly and informally in English mixed with Norwegian – read for the intent.
- **The boss** – not technical, uses **the website**. Wants one button: import the day, pick
  Lunsj / Middag / Arrangement, print.
- **Older colleagues** – need big buttons, few words, Norwegian text, nothing hidden behind gestures.

## How Danny likes the work
- Keep answers short, then build. Show the result (a screenshot) rather than describing it.
- Make it simple for older people. Prefer one press over two, a visible button over a hidden trick.
- Every destructive action has «↶ Angre».
- Push finished work straight to `main` (see [[Rules]]).
- Real guest lists, names and photos that Danny shows while explaining are **never** saved, copied
  into tests or committed. Rebuild the situation with made-up names (Testa, Testb …).

## How a day works at the club
- Bookings live in **ResDiary**. The print view (Diary → Print) has: time, party size, name, comment,
  **Område** (area) and ResDiary's own table, plus phone/e-mail columns we never read.
- Område values seen: *Spisestue*, *Domino*, *Fast meny i Spisestue*, *Møterom*, *Bibliotek*, *Bar*,
  *1772*, *1814*, *1818*, *Onsdagsklubben*, and others. «Fast meny i Spisestue» sits in Spisestua.
- **Lunch** is before 15:00, **dinner** from 15:00.
- **Arrangements** (fixed menu, private party, course, julebord, theme nights such as a lobster
  evening …): guests often first sit in the other rooms with an aperitif, and around 18:00 a bell
  («pling») sends them to their table. See [[Aperitif]].
- Card players (bridge) book 1772, 1814 or 1818, sometimes before dinner in Spisestua; the same name in
  two rooms at the same time is usually a double booking.
- **Onsdagsklubben** and similar groups sit together; several 1-person bookings can be one table.
- Guests may ask for a table in the comment («Gjerne bord 6 eller 11»).
- Comments carry allergies and diets (glutenfri, nøtter, skalldyr, gravid, vegetar …).

## Related
[[What Norsken is]] · [[Rules]] · [[Decisions]] · [[Aperitif]]
