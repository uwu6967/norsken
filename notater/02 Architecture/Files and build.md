---
title: Files and build
tags: [norsken, architecture, build]
updated: 2026-11-21
---
# Files and build

Norsken has no framework, no npm and no bundler. The real code is four files in `src/` and four bookmark scripts in `resdiary/`. `tools/build.py` (Python 3, standard library only) turns those into everything people actually open: the one-file website `index.html`, `print.html`, the bookmark page `bokmerke.html`, the instructions file `LES-MEG.txt`, the Chrome/Edge extension in `extension/`, and the bookmark codes in `resdiary/README.md`. Generated files are committed so staff never have to build anything. Never edit a generated file by hand: the next build overwrites it.

## Source files (edit these)

| Path | What it is |
|---|---|
| `src/index.html` | Page skeleton: top bar (shift switch, room switch «Domino / Spisestua», «☀ I dag», «🧰 Verktøy», «🏠 Norsken», «★ Oppsett», «Skriv ut», «🪑 med stoler», «⚙ Innstillinger»), the dialogs, the left column with the tabs «Bord» / «Reservasjoner» / «Merking», the map `#room`, the tray, the toast and the seat editor. Loads `styles.css?v=23` and `app.js?v=24`. |
| `src/app.js` | The whole app: one classic script (not a module), about 6650 lines. See [[Render loop]] and [[Storage and data]]. |
| `src/styles.css` | All screen CSS. Colours are custom properties on `:root` (`--ink`, `--paper`, `--pine`, `--gold` …). `body.tools-off` hides the tray when «🧰 Verktøy» is off. |
| `src/print.html` | The printout. Self-contained: its own CSS in `<style>` and exactly ONE `<script>`. It reads localStorage itself (see [[Storage and data]]) and copies a few things from `app.js` (`SEAT_MARKS`, `DEFAULT_DIMS`, `EVENT_WORDS`, the shift filter `inShift`). If you change one of those in `app.js`, change `print.html` too. See [[Printing]]. |
| `resdiary/til-norsken.js` | Bookmark «Til Norsken (ett trykk)»: opens `…/norsken/#fra-resdiary` and hands the list over with `postMessage` (every 250 ms, up to 80 tries, until Norsken answers `"norsken-ok"`). Nothing goes in the address. |
| `resdiary/til-bordplan.js` | Bookmark «Til bordplan»: copies the list (tab-separated) to the clipboard. |
| `resdiary/rydd-liste.js` | Bookmark «Rydd liste»: removes empty rows and the phone/e-mail/booked/customer-code/pre-order columns on the ResDiary print page. |
| `resdiary/last-ned-liste.js` | Bookmark «Last ned liste»: saves the list as `resdiary-YYYY-MM-DD_HHMM.csv` in Downloads. |
| `resdiary/README.md` | Hand-written, EXCEPT the block between `<!-- BOKMERKER -->` and `<!-- /BOKMERKER -->`, which the build rewrites. |
| `tools/build.py` | The build (below). |
| `.github/workflows/release.yml` | A release on every push to `main`. See [[Extension, website and releases]]. |
| `README.md`, `CONTRIBUTING.md`, `LICENSE` | Staff instructions (Norwegian), the rules for changes, all rights reserved. |
| `.gitignore` | Ignores `*.csv` and `resdiary-*` (except the `resdiary/` folder): ResDiary exports carry guest names and must stay on the PC. |
| `.nojekyll` | Empty; lets GitHub Pages serve the root files as they are. |

How the ResDiary bookmarks work is on [[ResDiary import]].

## Generated files (do not edit)

| Output | Made from | Notes |
|---|---|---|
| `index.html` (root) | `src/index.html` + `src/styles.css` + `src/app.js` + `src/print.html` | One file: CSS and JS inlined, `print.html` embedded as base64. This is the website. |
| `print.html` (root) | `src/print.html` | Byte-for-byte copy. The website's «Skriv ut» link opens it. |
| `bokmerke.html` | `resdiary/til-norsken.js` | A page with one big green «🍽 Til Norsken» link to drag to the bookmarks bar. No script on the page. |
| `LES-MEG.txt` | the four `resdiary/*.js` | Instructions that go into `Norsken.zip`, with every bookmark as text. Written with Windows line endings (CRLF). |
| `extension/` | `src/*` | The Chrome/Edge extension (Manifest V3). |
| bookmark block in `resdiary/README.md` | the four `resdiary/*.js` | Only the part between the markers. |

`CONTRIBUTING.md`: if you change anything in `src/` or `resdiary/`, run the build and commit everything it produced.

## How to build

```
python3 tools/build.py
```

It can run from any folder (all paths are worked out from the script's own location). It prints `wrote …` lines. It needs nothing but Python 3.

## What build.py does, step by step

1. **Reads** `src/index.html`, `src/app.js`, `src/styles.css`, `src/print.html`.
2. **Base64-encodes `print.html`.**
3. **Patches the print fetch in its copy of `app.js`** (root `index.html` only). The line must be exactly
   `const html = await (await fetch("print.html")).text();`
   (there is an `assert`). It becomes a line that decodes `window.__NORSKEN_PRINT_SRC__` when it is set and falls back to `fetch("print.html")`. This exists for the hosted copy, where there is no `print.html` next to the page to fetch (the print button only takes this path when `window.claude?.use` exists; see [[Printing]]). Reformat that line in `src/app.js` and the build stops with an `AssertionError`.
4. **Escapes `</script>`** in the app code as `<\/script>`, then asserts that no `</script` is left, so the inlined script cannot end early.
5. **Inlines the CSS**: replaces `<link rel="stylesheet" href="styles.css?v=23" />` with `<style>…</style>` (asserted).
6. **Inlines the JS**: replaces `<script src="app.js?v=24"></script>` with `<script>window.__NORSKEN_PRINT_SRC__ = "<base64>";</script>` followed by `<script>…app…</script>` (asserted). **If you bump the `?v=` numbers in `src/index.html`, change the two strings in `build.py` as well**, or the build fails.
7. **Writes** root `index.html` and root `print.html`.
8. **Bookmarks** with `bm(name)`: reads `resdiary/<name>`, **drops line 1** (the comment header), strips each remaining line and **joins them with nothing**, asserts there is no `//` other than `://`, and returns `javascript:` + the code. Because lines are glued together:
   - a `//` comment would swallow everything after it, hence the assert (and why `til-norsken.js` writes its origin as `var O="https:/"+"/uwu6967.github.io";`);
   - every statement needs its own `;`.
   The four items, in this order, with title and Norwegian description: `til-norsken.js` «Til Norsken (ett trykk)», `rydd-liste.js` «Rydd liste», `til-bordplan.js` «Til bordplan», `last-ned-liste.js` «Last ned liste». A Markdown block (how-to line, then a `###` heading, description and code block per bookmark) replaces the text between the markers in `resdiary/README.md` (asserted: the marker must exist). The main `README.md` is not touched; it links to `bokmerke.html`.
9. **`LES-MEG.txt`**: title, the two ways to use `Norsken.zip` (extension, or double-click `index.html`), every bookmark (`--- title ---`, description, code), and the extension install/update steps. Written with `newline='\r\n'`.
10. **`bokmerke.html`**: a fixed HTML page (inline CSS, no script) whose draggable link `href` is the HTML-escaped «Til Norsken» bookmark code.
11. **`extension/`** (folder created if missing):
    - copies `src/index.html`, `src/app.js`, `src/styles.css` unchanged (this `app.js` is NOT patched like step 3);
    - splits `print.html`: the body of its single `<script>\n…</script>` goes to `print.js`, and `print.html` gets `<script src="print.js"></script>` instead (asserted: exactly one `<script>`). Manifest V3 forbids inline scripts, which is why the extension has separate `app.js` and `print.js`;
    - writes `background.js`: clicking the toolbar icon opens `index.html` in a new tab;
    - draws `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` in Python (a gold table seen from above with a ring of chair segments, transparent background);
    - writes `manifest.json`: `manifest_version` 3, name «Norsken – bordplan», `version` "1.0.0" (the release job rewrites it to `1.0.<run number>`), action title «Åpne Norsken», service worker `background.js`, and a public `key`. The key pins the extension id, so saved plans (localStorage belongs to the extension's origin) survive when a new version is unpacked into another folder.
    - It never deletes anything in `extension/`. A file dropped from the build stays there until someone removes it.

## Which copy runs where

| Copy | Files | Print button |
|---|---|---|
| Website (GitHub Pages, linked from `README.md`) | root `index.html`, `print.html`, `bokmerke.html` | Plain link: opens `print.html` in a new tab, which reads localStorage. |
| Extension / `Norsken.zip` | everything in `extension/` (+ `LES-MEG.txt`, `LICENSE` in the zip) | Same link. Also works by double-clicking `index.html` in the unpacked folder. |
| The hosted copy | single-file `index.html` | Builds a print file from the embedded `print.html` with `window.__NORSKEN_STATE__`, `__NORSKEN_GUESTS__`, `__NORSKEN_ROOM__`, `__NORSKEN_SHIFT__` baked in, and offers it as the download `norsken-oppsett-YYYY-MM-DD.html`. |

Each copy has its own browser storage (different origins), so plans do not move between them by themselves. See [[Storage and data]].

## Release in one paragraph

Every push to `main` runs `python3 tools/build.py` in CI, copies `extension/` plus `LES-MEG.txt` and `LICENSE` into `Norsken.zip` with the manifest version set to `1.0.${GITHUB_RUN_NUMBER}`, writes release notes from the commit messages since the last `v*` tag, and publishes tag `vYYYY.MM.DD-<run number>` with `Norsken.zip` and `LES-MEG.txt`. CI does NOT commit what it builds. So if you forget to build before pushing, the zip is fresh but the website (which serves the committed root files) is stale. Details: [[Extension, website and releases]].

## Pitfalls

- Changed `src/` but did not build: website out of date (zip is fine).
- Reformatted the `fetch("print.html")` line, or changed `?v=23` / `?v=24`: build assert fails.
- A second `<script>` in `print.html`: build assert fails.
- A `//` comment after line 1 of a `resdiary/*.js` file, or a missing `;`: assert fails, or the bookmark breaks.
- Renamed a localStorage key in `app.js`: `print.html` has the key names hard-coded too.
- Edited `extension/`, root `index.html`, `print.html`, `bokmerke.html` or `LES-MEG.txt` by hand: lost on the next build.

## Related

- [[Start here]]
- [[Storage and data]]
- [[Render loop]]
- [[Extension, website and releases]]
- [[ResDiary import]]
- [[Printing]]
- [[Testing]]
- [[Rules]]
