---
title: ResDiary import
tags: [norsken, resdiary, import, bookings]
updated: 2026-11-21
---
# ResDiary import

Norsken does not talk to ResDiary. The day's bookings come in through four small bookmark scripts
(bookmarklets) in `resdiary/` that run on ResDiary's own print page (**Diary → Print**) in the browser,
read the booking table there and hand it to Norsken: in one press («🍽 Til Norsken»), through the
clipboard («Til bordplan»), or as a file on the PC («Last ned liste»). A fourth one («Rydd liste») only
tidies the print page itself. Inside the app, `parseClipboardBookings()` turns the text into bookings,
`importBookings()` replaces the day's list with them, `areaOf()` works out the room, and two helpers mark
allergies (`dietTags()`) and possible double bookings (`doubleOf()` / `doubleChip()`). This page covers
the whole road from the ResDiary page to the list in «Reservasjoner». The bookmarks never read phone
numbers or e-mail addresses, and the list never goes to a server.

## The four bookmarks (`resdiary/`)

All four are plain `(function(){ … })();` scripts. They only work on the ResDiary print page; anywhere
else they find no table and say so.

| File | Name in the bookmark bar | What it does | Output |
|---|---|---|---|
| `resdiary/til-norsken.js` | «Til Norsken (ett trykk)» – on `bokmerke.html` the big green «🍽 Til Norsken» link | Reads the bookings and opens the Norsken website, then hands the list over in memory | Nothing saved anywhere; the list goes tab-to-tab with `postMessage` |
| `resdiary/til-bordplan.js` | «Til bordplan» | Reads the same fields and copies them | Tab-separated text on the clipboard |
| `resdiary/last-ned-liste.js` | «Last ned liste» | Saves the table (minus private columns) | `resdiary-YYYY-MM-DD_HHMM.csv` in Downloads |
| `resdiary/rydd-liste.js` | «Rydd liste» | Removes empty rows and private columns **on the ResDiary page** | Nothing; the page itself changes |

The texts staff see for each bookmark are in the `items` list in `tools/build.py`.

### How «Til Norsken» and «Til bordplan» read the page

The two scripts share the same reading code, line for line:

1. Go through every `<table>` on the page. The header row is the first row with a cell that matches
   `/gjester/i`. A table without such a row is skipped.
2. Find the columns by their header text:

| Field | Header must match | Notes |
|---|---|---|
| time | `/^\s*tid/i` | There is no check that this column exists; the scripts assume it does. |
| party size | `/gjester/i` | `parseInt(…) \|\| 2` – a missing or unreadable number becomes **2**. |
| name | `/navn\|kunde(?!kod)\|^\s*gjest\s*$/i` | A table without a name column is skipped. `kunde(?!kod)` keeps «Kundekoder» out. |
| comment | `/komment\|merknad\|spesial/i` | Optional; whitespace collapsed. |
| area (Område) | `/omr[åa]de\|area/i` | Optional. |
| ResDiary table | `/^\s*bord\s*$/i` | Optional. |

3. Skip the header row, every row with a different number of cells than the header, every row whose
   time cell (spaces removed) does not match `/^\d{1,2}[:.]\d{2}$/`, and every row with an empty name.
4. Keep **only the last name**: if the name has a comma after the first character, the part before the
   comma («Testa, Kari» → «Testa»), otherwise the last word («Kari Testa» → «Testa»). Digits are removed.
5. Write one line per booking: `time ⇥ party ⇥ last name ⇥ comment ⇥ area ⇥ table`, lines joined with `\n`.

Phone, e-mail and every other column are simply never looked up, so they cannot end up in the text.
If nothing was found: alert «Fant ingen bookinger her. Gå til Diary → Print (utskriften) i ResDiary, og
trykk knappen igjen.»

### «Til Norsken» – one press

After reading the page (above), `til-norsken.js`:

1. Opens `https://uwu6967.github.io/norsken/#fra-resdiary` in a window named `"norsken"` (so pressing
   again reuses the same Norsken tab). The address is written as `"https:/"+"/uwu6967.github.io"`; the
   reason is not stated in the code (the build's `//` check would also accept `https://`).
2. If the browser blocked the window: alert «Nettleseren stoppet Norsken-vinduet. Tillat popup-vinduer
   for ResDiary, og trykk knappen igjen.»
3. Every 250 ms it posts `{ norsken: <text> }` to that window, with the website origin as target, until
   the page answers with the message `"norsken-ok"` from that same origin. After 80 tries (about 20 s)
   it gives up: alert «Norsken svarte ikke. Vent til Norsken har åpnet, og trykk knappen igjen.»

**The list is never put in the address.** It only exists in the two browser tabs. (The first version
of this button opened the site with the list after `#import=`. Some older notes still say so; that is
the *old* button. The current `til-norsken.js` uses `#fra-resdiary` + `postMessage`. See [[Decisions]],
2026-11-21, and `importFromHash()` below.)

It always opens **the website**. A local `index.html` or the Chrome/Edge extension never receives the
list from this button; there, use «Til bordplan» + «Lim inn fra ResDiary» or «Åpne fil». See
[[Extension, website and releases]].

### «Til bordplan» – copy

Same reading as above, then `navigator.clipboard.writeText(text)`. On success: alert «N bookinger kopiert
(tid, antall, etternavn, kommentar, område). Trykk «Lim inn fra ResDiary» i Bordplan → Reservasjoner.»
If the clipboard is not available or refuses, it falls back to `prompt("Kopier:", text)` so the text can be
copied by hand.

### «Last ned liste» – file

Works differently from the two above: it keeps **every column except the private ones**.

- `DROP = ["telefon","mobil","e-post","epost","email","booket","kundekod","forhånds","forhands"]`. A
  header (lower-cased, all whitespace removed) that contains any of these is dropped with its column.
- Rows are kept like above (same cell count, a valid time if there is a «Tid» column, a name if there is a
  name column), plus a row must not be all empty. Names are **not** cut to the last name.
- Separator `;`; a cell with `;`, `"` or a line break is quoted (`"` doubled). The header line is written
  again only when it differs from the previous table's.
- File: UTF-8 with BOM, CRLF line ends, named `resdiary-YYYY-MM-DD_HHMM.csv` (date and time of the
  press). Alert: «N bookinger lagret som <fil> i Nedlastinger. Filen er bare på denne PC-en.» Nothing
  found: «Fant ingen bookinger her. Åpne utskriftssiden i ResDiary (Diary → Print) først.»

The file has full guest names. It must stay on the PC: `.gitignore` blocks `*.csv`, and it must never be
committed or sent anywhere (see [[Rules]]).

### «Rydd liste» – tidy the print page

For printing straight from ResDiary. It changes only the open ResDiary page:
- removes every `tr.blank` row and every row whose `<td>` cells are all empty;
- in each table that has a header cell matching `/telefon/i`, removes the columns whose header contains
  one of `["telefon","e-post","epost","booket","kundekod","forhånds","forhands"]` (note: no `mobil` /
  `email` here, unlike «Last ned liste»), from every row with the header's cell count.

Nothing is copied, saved or sent.

### How the bookmark codes are made

`tools/build.py`, function `bm(name)`: reads the file, **drops the first line** (the `/* … */` comment),
strips and joins all other lines with no separator, and puts `javascript:` in front. It asserts that no
`//` is left (after removing `://`), because a `//` comment would swallow the rest of the one-line
bookmark. So in `resdiary/*.js`:
- the first line must be the comment and nothing else;
- no `//` comments, and every line must end where a statement can end (lines are glued together).

The build writes the codes into `resdiary/README.md` (only between `<!-- BOKMERKER -->` and
`<!-- /BOKMERKER -->`), into `LES-MEG.txt`, and `til-norsken.js` alone into `bokmerke.html` as the drag
link «🍽 Til Norsken». These are generated; edit `resdiary/*.js` and run `python3 tools/build.py`. See
[[Files and build]].

## How the list gets into the app

There are four doors. All of them end in `importBookings(text, source)` in `src/app.js`.

| Door | Code | `source` saved in `guests.file` |
|---|---|---|
| «🍽 Til Norsken» handoff | the `message` listener near the end of `src/app.js` | `"ResDiary"` |
| «📋 Lim inn fra ResDiary» (`#res-paste` in Reservasjoner, `#today-paste` on «☀ I dag», which just clicks `#res-paste`) or Ctrl+V | `#res-paste` click handler, `paste` listener | `"utklippstavla"` (`"clipboard"` in English) |
| «Åpne fil» (`#guest-file`, `#today-file`; accepts `.csv,.txt`) | `change` handlers | the file name |
| an old `#import=` link | `importFromHash()` | `"ResDiary"` |

### The handoff listener

- Accepts a message only if `event.data.norsken` is a string **and** `event.origin` matches
  `RESDIARY_ORIGIN = /^https:\/\/([a-z0-9-]+\.)*resdiary\.[a-z.]{2,6}$/i`. Anything else is ignored.
- `lastHandoff = { text, at }`: the same text again within 60 000 ms is not imported again (the bookmark
  keeps posting until it hears back).
- A fresh text goes to `importBookings(text, "ResDiary")`; if that succeeds, `openToday()` shows the
  «☀ I dag» screen so the boss can pick Lunsj / Middag / Arrangement. See [[Shifts and start screen]].
- It always answers `"norsken-ok"` to `event.source` (with `event.origin` as target), also for a repeat,
  so the bookmark stops.

### `importFromHash()` and the address wipe

Runs once at the very end of `src/app.js` and on every `hashchange`.
- `#fra-resdiary` (the current button): the hash is removed with
  `history.replaceState(null, "", location.pathname + location.search)`; returns `false`.
- `#import=<text>` (the **old** button, which put the list in the address): the text is
  `decodeURIComponent(hash.slice(8))`; the address is wiped **before** importing, with the same
  `history.replaceState` (fallback `location.hash = ""`). Then `importBookings(text, "ResDiary")`,
  `openToday()`, and a 15 s toast: «Denne ResDiary-knappen er gammel. Hent den nye på bokmerke.html –
  den holder lista utenfor nettleserhistorikken.» Returns `true`.
- Why the new button: an address can stay in the browser history (and its sync) even after the address bar
  is wiped. See [[Decisions]].
- When it returns `false`, the start-up check opens «☀ I dag» if the list is empty or from another day.

### Paste details

- If any booking already sits at a table, «Lim inn fra ResDiary» first asks with a second tap
  (`armed()`): «Bytte ut dagens liste? Trykk igjen» (4 s). The other doors do not ask.
- It reads `navigator.clipboard.readText()`. After a successful import the clipboard is overwritten with
  `""`, so the list does not stay there.
- If the browser will not hand over the clipboard, `pasteArmed` is set and a toast says «Trykk Ctrl+V nå
  for å lime inn lista.» (12 s). The `paste` listener then takes the next Ctrl+V. It also takes any
  Ctrl+V while the «Reservasjoner» tab is open. Pastes into an `input`, `textarea` or editable element
  are left alone.

## Parsing: `parseClipboardBookings(text)`

Strips a leading BOM, then tries three formats in order.

**1. A file or table with a header row.** If the first three lines match `/gjester|antall|pax/i` **and**
`/\btid\b|\btime\b/i`, the text is treated as CSV/TSV: tab-separated if those lines have more tabs than
semicolons (tabs are then turned into `;`). It goes to `guestsFromCsv()`; if that finds anything, that
is the result.

**2. Tab lines from the bookmarks.** Each line with a tab is split into **six fields**:
`[time, pax, name, comment, area, rd]`.
- time: `.` becomes `:`; must match `/^\d{1,2}:\d{2}$/` or the line is skipped; padded to `HH:MM`.
- A line with **no name, no comment and no area** is one of ResDiary's total rows, not a booking – skipped.
- `pax`: `parseInt || 2`. `name`: trimmed, max 40 characters. `note` (the comment): whitespace collapsed,
  max 200. `area`, `rd` (the ResDiary table number): trimmed.

**3. Free text.** Any other line goes through `parseBookings()`, which accepts things like
«12:00, 2, Testa» or «kl. 12.00 – 2 pers» (time, a number 1–40 as party size, default 2, the rest is the
name, max 40). The comment is empty.

Finally `dropSubtotals()` runs over the result.

### `guestsFromCsv(text)`

Used for the «Last ned liste» file and for a copied table with headers.
- `parseCsv()` picks `;` or `,` by which is more common in the first line (`;` on a tie), handles quotes
  and `""`, collapses whitespace, and drops empty rows.
- A header row is any row with a cell matching `/gjester|antall|pax/i` and a cell matching `/^tid|time/i`.
  Rows before the first header are ignored; a later header replaces the earlier one.
- Columns: time `/^tid|^time/i`, party `/gjester|antall|pax|covers|personer/i`, ResDiary table
  `/^bord|^table/i`, comment `/komment|merknad|notat|note|spesial|ønske/i`, area `/omr[åa]de|area/i`,
  name `/navn|name|kunde|gjest(?!er)/i` (not one of the others); if no name column, the first column that
  is none of the others.
- A row with neither name nor time is skipped. `pax` is `parseInt || null` (**not** 2 here), name max 40,
  comment max **120**. The name is kept whole (the file has full names).
- Result: `dropSubtotals()`, then sorted by time (no time sorts last as `"99"`).

### `dropSubtotals(list, nameOf, paxOf)`

ResDiary prints a subtotal per time slot (a time and a number, no name). A nameless line is dropped when
its number equals the sum of the named bookings at the same time; any other nameless line is kept.

## `importBookings(text, source)`: the new day's list

1. Parse with `parseClipboardBookings()`.
2. For each booking, the **«Fast meny i Spisestue» rule**: if the area text is not exactly
   `spisestue|spisestua|domino` (any case) but contains `spisest` or `domino`, the area text is put
   **first in the comment**, joined with « · » («Fast meny i Spisestue · glutenfri»). Such a booking sits in
   Spisestua (see `areaOf()` below), but the extra words matter – «fast meny» is what makes it an
   arrangement ([[Shifts and start screen]]).
3. Each booking becomes `{ id, time, name, pax, rd, note, area, areaLabel }`; `id` is from `newGuestId(i)`
   = `g<Date.now() in base 36><i>`; `pax` is `null` when unknown.
4. Nothing found: toast «Fant ingen bookinger. Bruk «Til bordplan» på ResDiary-utskriften først.» (9 s),
   returns `false`, the old list stays.
5. Otherwise it **replaces the whole guest list**: `clearBookedNames()` takes booking names off the
   tables, then `guests = { file: source, day: dayKey(), list (sorted by time), placed: {}, room: {},
   redeck: {} }`. All placements, «✓ kommet» ticks, ★ choices and re-set hints of the old list are gone.
   There is no «Angre» for an import.
6. `saveGuests()` (localStorage `norsken-guests-v1`), `guestSeats()` on every table that had guests (chairs
   go back), `releaseOtherRoomSeats()` (same for the other room's stored plan), switch to the
   «Reservasjoner» tab, `save()`, `render()`.
7. Toast «N bookinger klare. Dra dem til bordene, eller trykk «Fordel bord automatisk».» (8 s).
   Returns `true`.

Nothing is placed by the import itself. Placing happens when a shift is picked on «☀ I dag», with
«Fordel bord automatisk» ([[Auto seating]]) or by hand ([[Reservations list]]). The shape of `guests`
is on [[Storage and data]].

## Areas: `areaOf(text)`

Turns ResDiary's «Område» into the room the booking belongs to.

| Område text | `area` | `areaLabel` |
|---|---|---|
| empty, or contains `spisest` (any case) | `"spisestua"` | `"Spisestua"` |
| contains `domino` | `"domino"` | `"Domino"` |
| anything else (e.g. «Møterom») | `"other:" + text.toLowerCase()` | the text as written |

`other:` rooms are never auto-seated and are shown as their own group in «Uten bord»; their heading can
be dragged to put the whole group on one table ([[Reservations list]]). The «🏠 Norsken» map matches
`areaLabel` against its room list ([[House map]]).

## Allergies and diets: `dietTags()` and `DIET_WORDS`

`dietTags(text)` tests the booking comment against `DIET_WORDS` and returns the matching keys. If none
match but the comment contains `allerg` or `intoleran`, it returns `["annet"]`. `dietChips(text)` draws
each key as a small chip with the code and colour of the matching chair mark (`SEAT_MARKS`, via
`markOf()`), title = the mark's name.

| Key | Pattern in the comment (case-insensitive) | Chip |
|---|---|---|
| `gluten` | `glut[e]?n\|c[øo]liaki\|coeliac\|celiac` | G |
| `laktose` | `lakto\|lacto\|melkeallerg\|melkefri\|melkeprotein` | L |
| `notter` | `n[øo]tt\|peanut\|pean[øo]tt\|mandel\|nut allerg\|nuts\b` | N |
| `skalldyr` | `skalldyr\|skjell\|reke\|krabbe\|hummer\|shellfish\|bl[øo]tdyr` | S |
| `diabetes` | `diabet` | D |
| `gravid` | `gravid\|pregnan` | Gr |
| `veganer` | `vegan` | Vg |
| `vegetar` | `vegetar` | V |
| `pescetar` | `pesc\|pesk` | P |
| `annet` | (fallback: `allerg\|intoleran`, nothing above) | A |

- Shown on: every booking in «Uten bord», every booking chip in «Bordene», and the name labels beside the
  map (`renderCallouts()` collects the tags of all guests at a table).
- It is only a hint. **Nothing is marked on a chair by itself**; chair marks are set by hand
  ([[Chairs and plates]]).
- `src/print.html` has its own copy (`DIET_WORDS`, `dietTagsOf()`, `SEAT_MARKS`). Change one, change both
  ([[Printing]]).

## Double bookings: `doubleOf()` and `doubleChip()`

- `doubleOf(g)`: the other bookings in the whole day's list with the same name (lower-cased, whitespace
  collapsed). Empty names never match. Not filtered by shift or room.
- `doubleChip(g, en)`: nothing when there is no other booking. Otherwise each other booking is shown as
  «<areaLabel or Spisestua> <time>», and:
  - if any other booking is **under 90 minutes** away (`Math.abs(minutes) < 90`), or either time is
    missing/unreadable: a **red** chip (`.g-double`, background `#b42318`) «⚠ dobbel? Spisestua 19:00»,
    title «Booket to ganger nesten samtidig – også: …». Probably booked twice by mistake.
  - otherwise: a quiet outlined chip (`.g-also`) «↔ Domino 12:00», title «Samme navn, en annen booking».
    Often a card player in another room who also has a table here.
- Because the bookmarks keep only the last name, two different parties with the same last name also get
  the chip. It is a prompt to check, not a verdict.
- `src/print.html` repeats the rule in `clashes()` / `doubleNote()` («⚠ dobbeltbooking?», «↔ også»).

## Privacy, in short

- The bookmarks read only time, party size, last name, comment, area and ResDiary table – never phone
  or e-mail. «Last ned liste» drops phone/mobile/e-mail/booked/customer-code/pre-order columns.
- The handoff happens in memory between two tabs; nothing goes in the address or to a server.
- Names live only in localStorage `norsken-guests-v1`, never in the shared plan ([[Storage and data]]).
- The clipboard is emptied after a paste import.
- The CSV from «Last ned liste» stays on the PC; `*.csv` is ignored by git. See [[Rules]].

## Related
- [[Shifts and start screen]]
- [[Reservations list]]
- [[Auto seating]]
- [[Storage and data]]
- [[Files and build]]
- [[Extension, website and releases]]
- [[Printing]]
- [[House map]]
- [[Rules]]
- [[Decisions]]
