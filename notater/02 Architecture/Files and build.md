---
title: Files and build
tags: [norsken, architecture, build]
updated: 2026-11-21
---
# Files and build

Norsken has no framework, no npm and no bundler. The real code is four files in `src/` and four bookmark scripts in `resdiary/`. `tools/build.py` (Python 3, standard library only) turns those into everything people actually open: the one-file website `index.html`, `print.html`, the bookmark page `bokmerke.html`, the instructions file `LES-MEG.txt`, the Chrome/Edge extension in `extension/`, and the bookmark codes in `resdiary/README.md`. Generated files are committed so staff never have to build anything (`CONTRIBUTING.md`: «Den som bruker appen skal aldri trenge å bygge noe»). Never edit a generated file by hand: the next build overwrites it.

## Source files (edit these)

| Path | What it is |
|---|---|
| `src/index.html` | Page skeleton. Top bar: the update bar `#update-bar` («Last ned» / «Oppdater nå» / «Senere»), the shift switch `#shift-switch` (filled by `app.js`), the room switch «Domino» / «Spisestua» / «Innover ▾», then «☀ I dag», «🧰 Verktøy», «🏠 Norsken», «★ Oppsett», the print link `#print-btn` (written «Skriv ut / PDF» in the HTML; `renderChrome()` relabels it «🖨 Skriv ut»), «🪑 med stoler» (toggles to «uten stoler»), «⚙ Innstillinger» and the sync chip `#sync-status`. Dialogs: the «I dag» start screen `#today`, the house map `#house`, «Oppsett» `#mine-panel`, «Innstillinger» `#settings`. The left column with the tabs «Bord» / «Reservasjoner» / «Merking», the map `#room`, the tray `#tray` («Lager / ikke i bruk» and «Bordplater»), the toast `#toast` (with «↶ Angre»), the seat editor `#seat-editor` and the painting card `#painting-card`. Loads `styles.css?v=23` and `app.js?v=24`; Google Fonts (Fraunces, Outfit) come from the network. |
| `src/app.js` | The whole app: one classic script (not a module), about 6,760 lines. See [[Render loop]] and [[Storage and data]]. |
| `src/styles.css` | All the app's CSS. Colours are custom properties on `:root` (`--ink`, `--paper`, `--pine`, `--gold` …). `body.tools-off` hides the tray when «🧰 Verktøy» is off (`toolsOn()` in `app.js`, localStorage `norsken-tools` = `"1"` means on). Two small `@media print` blocks only hide the top bar, tray, drawer and settings if someone prints the app page itself; the real printout is `print.html`. |
| `src/print.html` | The printout. Self-contained: its own CSS in `<style>` and exactly ONE bare `<script>` tag. It reads localStorage itself (`norsken-layout-v3`, `norsken-layout-domino-v1`, `norsken-layout-<id>-v1`, `norsken-guests-v1`, `norsken-shift`; see [[Storage and data]]) unless the hosted copy has baked in `window.__NORSKEN_STATE__` and friends. It keeps its own copies of things from `app.js`: `ROOM_NAMES` (the ids and names of `ROOM_DEFS`), `roomKey()` (the storage-key rule of `ROOMS`), `SEAT_MARKS`, `DIET_WORDS`, `DEFAULT_DIMS`, `PLATES`, `EVENT_WORDS` / `isEvent`, and the shift filter `inShift` (with the 15:00 lunch cut-off written inline instead of `LUNCH_ENDS`). If you change one of those in `app.js`, change `print.html` too. See [[Printing]]. |
| `resdiary/til-norsken.js` | Bookmark «Til Norsken (ett trykk)»: opens `https://uwu6967.github.io/norsken/#fra-resdiary` in a window named `norsken` and hands the list over with `postMessage({norsken: <text>})` (every 250 ms, up to 80 tries, until Norsken answers `"norsken-ok"`). `app.js` only accepts the message from a ResDiary origin (`RESDIARY_ORIGIN`). Nothing goes in the address. |
| `resdiary/til-bordplan.js` | Bookmark «Til bordplan»: copies the list (tab-separated: time, guests, last name, comment, area, ResDiary table) to the clipboard, or shows it in a `prompt` if the clipboard is not available. |
| `resdiary/rydd-liste.js` | Bookmark «Rydd liste»: removes empty rows, and in tables with a «Telefon» header removes the phone/e-mail/booked/customer-code/pre-order columns on the ResDiary print page. |
| `resdiary/last-ned-liste.js` | Bookmark «Last ned liste»: saves the list as `resdiary-YYYY-MM-DD_HHMM.csv` (semicolon-separated, UTF-8 with BOM, CRLF) as a browser download. Columns whose header matches phone, mobile, e-mail, booked, customer code or pre-order are left out. |
| `resdiary/README.md` | Hand-written, EXCEPT the block between `<!-- BOKMERKER -->` and `<!-- /BOKMERKER -->`, which the build rewrites. |
| `tools/build.py` | The build (below). |
| `.github/workflows/release.yml` | A release on every push to `main` (and when started by hand, `workflow_dispatch`). See [[Extension, website and releases]]. |
| `README.md`, `CONTRIBUTING.md`, `LICENSE` | Staff instructions (Norwegian), the rules for changes (Norwegian), and the licence: all rights reserved, not open source. |
| `.gitignore` | Ignores `*.csv` and `resdiary-*` (except the `resdiary/` folder): ResDiary exports carry guest names and must stay on the PC. Also `.DS_Store`, `Thumbs.db`, `*.pyc`, `__pycache__/`. |
| `.nojekyll` | Empty; tells GitHub Pages not to run Jekyll, so the root files are served as they are. |
| `notater/` | This notebook. The build does not touch it. |

How the ResDiary bookmarks work is on [[ResDiary import]].

## Generated files (do not edit)

| Output | Made from | Notes |
|---|---|---|
| `index.html` (root) | `src/index.html` + `src/styles.css` + `src/app.js` + `src/print.html` | One file: CSS and JS inlined, `print.html` embedded as base64. This is the website. |
| `print.html` (root) | `src/print.html` | Unchanged copy. The website's print link opens it. |
| `bokmerke.html` | `resdiary/til-norsken.js` | A page with one big green «🍽 Til Norsken» link to drag to the bookmarks bar. No script on the page. |
| `LES-MEG.txt` | the four `resdiary/*.js` + text in `build.py` | Instructions that go into `Norsken.zip` (and are attached to each release on their own), with every bookmark as text. Written with Windows line endings (CRLF). |
| `extension/` | `src/index.html`, `src/app.js`, `src/styles.css`, `src/print.html` + files written by `build.py` | The Chrome/Edge extension (Manifest V3). |
| bookmark block in `resdiary/README.md` | the four `resdiary/*.js` | Only the part between the markers. |

`CONTRIBUTING.md`: if you change anything in `src/` or `resdiary/`, run the build and commit everything it produced.

## How to build

```
python3 tools/build.py
```

It can run from any folder (all paths are worked out from the script's own location). It prints `wrote …` lines (`wrote <path> <n> bytes`, `wrote print.html`, `wrote bokmerke.html`, `wrote bookmarks into resdiary/README.md, LES-MEG.txt`, `wrote extension/`). It needs nothing but Python 3.

## What build.py does, step by step

1. **Reads** `src/index.html`, `src/app.js`, `src/styles.css`, `src/print.html`.
2. **Base64-encodes `print.html`** (UTF-8).
3. **Patches the print fetch in its copy of `app.js`** (root `index.html` only). The line must be exactly
   `const html = await (await fetch("print.html")).text();`
   (there is an `assert`). It becomes a line that decodes `window.__NORSKEN_PRINT_SRC__` (via `atob` and `TextDecoder`) when it is set and falls back to `fetch("print.html")`. This exists for the hosted copy, where there is no `print.html` next to the page to fetch (the print button only takes this path when `window.claude?.use` exists; see [[Printing]]). Reformat that line in `src/app.js` and the build stops with an `AssertionError`.
4. **Escapes `</script>`** in the app code as `<\/script>`, then asserts that no `</script` is left, so the inlined script cannot end early.
5. **Inlines the CSS**: replaces `<link rel="stylesheet" href="styles.css?v=23" />` with `<style>…</style>` (asserted).
6. **Inlines the JS**: replaces `<script src="app.js?v=24"></script>` with `<script>window.__NORSKEN_PRINT_SRC__ = "<base64>";</script>` followed by `<script>…app…</script>` (asserted). **If you bump the `?v=` numbers in `src/index.html`, change the two strings in `build.py` as well**, or the build fails.
7. **Writes** root `index.html` and root `print.html`.
8. **Bookmarks** with `bm(name)`: reads `resdiary/<name>`, **drops line 1** (the comment header), strips each remaining line and **joins them with nothing**, asserts there is no `//` once every `://` is removed, and returns `javascript:` + the code. Because lines are glued together:
   - a `//` comment would swallow everything after it, hence the assert (a URL such as `https://…` passes, because `://` is removed before the check; `til-norsken.js` still writes its origin as `var O="https:/"+"/uwu6967.github.io";` — why is unclear, the assert would accept it either way);
   - every statement needs its own `;`;
   - anything on line 1 is thrown away, so line 1 must be the comment and nothing else.
   The four items, in this order, with title and Norwegian description: `til-norsken.js` «Til Norsken (ett trykk)», `rydd-liste.js` «Rydd liste», `til-bordplan.js` «Til bordplan», `last-ned-liste.js` «Last ned liste». A Markdown block (how-to line, then a `###` heading, description and code block per bookmark) replaces the text between the markers in `resdiary/README.md` (asserted: the `<!-- BOKMERKER -->` marker must exist). The main `README.md` is not touched; it links to `bokmerke.html`.
9. **`LES-MEG.txt`**: title «Norsken - bordplan for Spisestua», the two ways to use `Norsken.zip` (extension, or double-click `index.html`), every bookmark (`--- title ---`, description, code), and the extension install/update steps (ending with «Ikke trykk «Fjern» – da slettes planene.»). Written as UTF-8 with `newline='\r\n'`.
10. **`bokmerke.html`**: a fixed HTML page (inline CSS, no script) whose draggable link `href` is the HTML-escaped «Til Norsken» bookmark code.
11. **`extension/`** (folder created if missing):
    - copies `src/index.html`, `src/app.js`, `src/styles.css` unchanged (this `app.js` is NOT patched like step 3);
    - splits `print.html`: the body of its `<script>\n…</script>` goes to `print.js`, and `print.html` gets `<script src="print.js"></script>` instead (asserted: the text `<script>` occurs exactly once, and it must be followed by a newline for the match). Manifest V3 forbids inline scripts, which is why the extension has separate `app.js` and `print.js`;
    - writes `background.js`: clicking the toolbar icon opens `index.html` in a new tab;
    - draws `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` in Python (a gold table seen from above with a dark green edge and a ring of chair segments, transparent background);
    - writes `manifest.json`: `manifest_version` 3, name «Norsken – bordplan», `version` "1.0.0" (the release job rewrites it to `1.0.<run number>`), description «Bordplan for Spisestua og Domino. Klikk ikonet for å åpne den.», action title «Åpne Norsken», service worker `background.js`, and a public `key`. The key pins the extension id, so saved plans (localStorage belongs to the extension's origin) survive when a new version is unpacked into another folder.
    - It never deletes anything in `extension/`. A file dropped from the build stays there until someone removes it.

## Which copy runs where

| Copy | Files | Print button |
|---|---|---|
| Website (GitHub Pages, linked from `README.md`) | root `index.html`, `print.html`, `bokmerke.html` | Plain link: opens `print.html` in a new tab, which reads localStorage. |
| Extension / `Norsken.zip` | everything in `extension/` (+ `LES-MEG.txt`, `LICENSE` in the zip) | Same link. Also works by double-clicking `index.html` in the unpacked folder. |
| The hosted copy | single-file `index.html` | Asks for `window.claude.use("downloads")`; if that is not available it only shows a toast that printing does not work there. Otherwise it calls `save()`, builds a print file from the embedded `print.html` with `window.__NORSKEN_STATE__`, `__NORSKEN_GUESTS__`, `__NORSKEN_ROOM__`, `__NORSKEN_SHIFT__` baked in before the first `<script>`, and offers it as the download `norsken-oppsett-YYYY-MM-DD.html` (UTC date). |

Each copy has its own browser storage (different origins), so plans do not move between them by themselves. See [[Storage and data]].

## Release in one paragraph

Every push to `main` (or a manual run) runs `python3 tools/build.py` in CI, copies `extension/` plus `LES-MEG.txt` and `LICENSE` into `Norsken.zip` (files at the root of the zip, no folder inside) with the manifest version set to `1.0.${GITHUB_RUN_NUMBER}`, writes release notes from the commit messages since the last `v*` tag (no merges, oldest first; «Alt fra før er samlet i denne versjonen.» when there is no tag yet), and publishes tag `vYYYY.MM.DD-<run number>` (UTC date) as the latest release, titled `Norsken DD.MM.YYYY (#<run number>)`, with `Norsken.zip` and `LES-MEG.txt`. CI does NOT commit what it builds, and there is no Pages step in the workflow. So if you forget to build before pushing, the zip is fresh but the website (which serves the committed root files) is stale. Details: [[Extension, website and releases]].

## Pitfalls

- Changed `src/` or `resdiary/` but did not build: website and `bokmerke.html` out of date (zip and `LES-MEG.txt` in the release are fine).
- Reformatted the `fetch("print.html")` line, or changed `?v=23` / `?v=24`: build assert fails.
- A second bare `<script>` in `print.html`: build assert fails (and the hosted copy bakes its data in before the first `<script>`).
- A `//` comment after line 1 of a `resdiary/*.js` file: assert fails. A missing `;` or code on line 1: the bookmark breaks.
- Renamed a localStorage key in `app.js`: `print.html` has the key names hard-coded too.
- Edited `extension/`, root `index.html`, `print.html`, `bokmerke.html`, `LES-MEG.txt` or the bookmark block in `resdiary/README.md` by hand: lost on the next build.

## Related

- [[Start here]]
- [[Storage and data]]
- [[Render loop]]
- [[Extension, website and releases]]
- [[ResDiary import]]
- [[Printing]]
- [[Shifts and start screen]]
- [[Testing]]
- [[Rules]]
