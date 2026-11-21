---
title: Extension, website and releases
tags: [norsken, architecture, release, extension]
updated: 2026-11-21
---
# Extension, website and releases

Norsken reaches people in four ways. The boss uses **the website** on GitHub Pages. **`Norsken.zip`** works as a **Chrome/Edge extension**, or as a plain `index.html` you double-click. **The hosted copy** shares one floor plan between everyone who opens it. All four run the same `src/app.js`. The only difference is what each environment allows: where localStorage lives, whether new tabs and `window.print()` work, whether the ResDiary button can reach the page, and whether there is a shared store. This page explains how each copy is made, how it gets to people, and how the code changes its behaviour in each place. It also covers `.github/workflows/release.yml`, which makes a release on every push to `main`. Every file named here as an output (root `index.html`, root `print.html`, `bokmerke.html`, `LES-MEG.txt`, everything in `extension/`) is written by `tools/build.py` from `src/` and `resdiary/`. They are never sources. See [[Files and build]].

## The four copies at a glance

| | Website | Extension | `index.html` double-clicked | Hosted copy |
|---|---|---|---|---|
| Where it comes from | committed root files on `main` | `Norsken.zip` from the latest release (built in CI) | the same `Norsken.zip`, unpacked | the built single-file `index.html`, put there by hand |
| Address / storage origin | `https://uwu6967.github.io/norsken/` | `chrome-extension://nelgncobbbjedmbjenkjfcfjegeflpmc/index.html` | `file:///…/index.html` | the host's page |
| «🍽 Til Norsken» from ResDiary | **yes**, the only copy it reaches | no | no | no |
| «🖨 Skriv ut» | link opens `print.html` in a new tab, which prints itself | same (`print.html` + `print.js`) | same (`file://` print page) | downloads `norsken-oppsett-YYYY-MM-DD.html` |
| Update bar | no | yes, when the version is `1.0.<n>` with `n > 0` | no | no |
| Shared plan | no | no | no | yes, layout only |
| Status chip `#sync-status` | hidden | hidden | hidden | shown |

Every copy has its own localStorage, so plans and guest lists do **not** move between them by themselves. Saved setups can be moved by hand: «★ Oppsett» → «Til en annen PC» → «Last ned som fil» (writes `norsken-oppsett-YYYY-MM-DD.json`) and «Åpne oppsett-fil» on the other copy. Guest fields are removed when the file is opened. Keys are listed on [[Storage and data]].

## How the code tells the copies apart

`src/app.js` has no build flags. It checks two things while it runs:

- **`window.claude?.use`**. It only exists in the hosted copy. `connectShare()`, the `#print-btn` click handler and `renderChrome()` (which shows the status chip) check it, and do nothing when it is missing.
- **`chrome?.runtime?.getManifest?.().version`**, read in `installedRelease()`. It returns the last number of the version, or `0`. On a normal web page or a `file://` page there is no `chrome.runtime` (if `chrome` is not defined at all, the `try/catch` gives `0`). An extension built locally has version `1.0.0`, which also gives `0`. Only a zip from the release job (`1.0.<run>`) gives a real number, and only then does `checkForUpdate()` run.

The website's `index.html` carries one build-time patch: the hosted-copy print line reads `window.__NORSKEN_PRINT_SRC__` (see [[Files and build]], step 3). The extension's `app.js` is an unpatched copy of `src/app.js`.

## The website (GitHub Pages)

- **Address:** https://uwu6967.github.io/norsken/. `README.md` links to it («👉 Åpne Norsken»). `LES-MEG.txt` does not name the address; only the «Til Norsken» bookmark code inside it does. [[Decisions]] records that the boss uses the website, which is why one-press import targets it.
- **What it serves:** the files committed on `main`, as they are. The repo has an empty `.nojekyll` so Pages does not run Jekyll over them. The Pages setting (deploy from the `main` branch) lives in the repository settings on GitHub, not in the repo. **Nothing in the workflow deploys the site.** A push to `main` updates it once GitHub has published the new commit.
- **The pages people open:**
  - `index.html`: the whole app in one file. CSS and JS are inlined, and `print.html` is embedded as base64 in `window.__NORSKEN_PRINT_SRC__`.
  - `print.html`: a byte-for-byte copy of `src/print.html`, opened by the «🖨 Skriv ut» link.
  - `bokmerke.html`: the drag-to-install page (below).
- **Everything on `main` is public on the site**, including `src/`, `extension/` and `notater/` (for example `…/norsken/src/app.js`). This is one more reason the repo must never hold guest data ([[Rules]]).
- **Storage:** localStorage belongs to the origin `https://uwu6967.github.io`. Storage is per origin, not per path, so any other GitHub Pages site under the same account would share it.
- **Printing:** `#print-btn` is a plain `<a href="print.html" target="_blank">`. The new tab is on the same origin, reads the plan and guests from localStorage, and calls `window.print()` 300 ms after `load`. See [[Printing]].
- **ResDiary hand-off:** the «🍽 Til Norsken» bookmark opens `https://uwu6967.github.io/norsken/#fra-resdiary` in a window named `norsken`. It posts `{ norsken: <list> }` to that origin every 250 ms (up to 80 tries) until it gets `"norsken-ok"` back. The page only accepts messages whose origin matches `RESDIARY_ORIGIN` (`https://…resdiary.<tld>`). The list never touches the address. See [[ResDiary import]].
- **Stale-site trap:** CI builds but does **not** commit. If someone pushes a change to `src/` without running `python3 tools/build.py` and committing the outputs, the release zip is fresh but the website still serves the old root `index.html`.

## bokmerke.html: the drag-to-install button

- Made by `tools/build.py` from `resdiary/til-norsken.js`. `bm()` drops line 1 (the comment), strips and joins the remaining lines, and adds `javascript:`. That code is HTML-escaped into the `href` of one big green link, «🍽 Til Norsken».
- The page has inline CSS and **no script**. It shows three steps: show the bookmarks bar (`Ctrl` + `Shift` + `B`, Mac `⌘` + `Shift` + `B`); drag the green button up («Ikke klikk på den her – dra den.»); in ResDiary go to **Diary → Print** and press it. A box «🔒 Gjestene blir på denne PC-en» says which fields are read and that nothing is sent to a server.
- Linked from `README.md` («Første gang», step 2) and from the «☀ I dag» start screen (`#today-setup`, «🔧 Få ResDiary-knappen (gjøres én gang)»). The start screen uses the absolute address `https://uwu6967.github.io/norsken/bokmerke.html`, so the link works from every copy.
- A bookmark holds its own copy of the code. **If `til-norsken.js` changes, every PC must drag the button again.** The older button that put the list after `#import=` still works, but `importFromHash()` wipes the address and shows a toast asking for the new button from `bokmerke.html`.

## The Chrome/Edge extension (`extension/`)

### What is in the folder (all generated)
| File | What it is |
|---|---|
| `manifest.json` | Manifest V3 (below) |
| `background.js` | Service worker. `chrome.action.onClicked` opens `chrome.runtime.getURL("index.html")` in a new tab |
| `index.html`, `app.js`, `styles.css` | Unchanged copies of `src/index.html`, `src/app.js`, `src/styles.css` |
| `print.html`, `print.js` | `src/print.html` split in two: its single inline `<script>` body goes to `print.js`, and the page gets `<script src="print.js"></script>` |
| `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` | Drawn by Python in `build.py`: a gold table seen from above, with a ring of chairs |

`build.py` never deletes anything in `extension/`. A file that is no longer built stays there, and the release job zips it, until someone removes it from git.

### manifest.json
- `manifest_version: 3`, `name` «Norsken – bordplan», `version` `"1.0.0"` (the release job rewrites it), `description` «Bordplan for Spisestua og Domino. Klikk ikonet for å åpne den.»
- `action.default_title` «Åpne Norsken», with the four icons. `background.service_worker` is `background.js`.
- **No `permissions`, no `host_permissions`, no content scripts.** The extension only opens its own page. The update check is a normal `fetch` to `api.github.com`, which allows cross-origin requests.
- **`key`** (public key only, no secret). It fixes the extension id at `nelgncobbbjedmbjenkjfcfjegeflpmc`, the same on every PC and in both Chrome and Edge. Without a key, Chrome gives an unpacked extension an id based on its folder path. Unpacking a new version into another folder would then mean a new id, a new origin, and **empty plans**. With the key, localStorage at `chrome-extension://nelgncobbbjedmbjenkjfcfjegeflpmc` survives updates.

### No inline scripts
The Manifest V3 extension pages' content security policy blocks inline `<script>` and inline event handlers. So:
- `src/index.html` loads the app only with `<script src="app.js?v=24"></script>`, and has no `onclick=`-style attributes. Keep it that way. Wire events in `src/app.js`.
- `src/print.html` must keep **exactly one** `<script>` (asserted by `build.py`), so the build can move it to `print.js`.
- No `eval` / `new Function`. Inline `style="…"` attributes are fine; `print.html` uses them.
- The Google Fonts stylesheet loads in the extension too. Offline, the fonts fall back.

### Installing and updating (as written in `LES-MEG.txt` and `README.md`)
1. Download `Norsken.zip` from the latest release, right-click → «Pakk ut alle», and keep the folder in a fixed place, e.g. `Dokumenter\Norsken` (not in Downloads).
2. `chrome://extensions` (Edge: `edge://extensions`) → turn on «Utviklermodus» → «Last inn upakket» → pick the folder with `manifest.json`.
3. Pin it. Chrome: the puzzle piece, then the pin. Edge: the puzzle piece, then the eye. Click the icon to open the planner.
- **New version:** unpack the new zip into the **same** folder (replace the old files), then press ↻ on Norsken in `chrome://extensions`, or «Oppdater nå» on the update bar. Plans stay.
- **Never press «Fjern»**. Removing the extension deletes its storage, so the plans are lost.

### What the extension cannot do
- It never receives «🍽 Til Norsken» (the bookmark always opens the website; `README.md` says so too). Use «Til bordplan» + «Lim inn fra ResDiary», or «Last ned liste» + «Åpne fil». See [[ResDiary import]].
- It has no shared plan.

### Double-clicking `index.html` from the zip
The same files run as a `file://` page. Printing works: the link opens the `file://` `print.html`, and Chromium gives `file://` pages one shared localStorage. There is no update check (no `chrome.runtime`) and no ResDiary hand-off. `LES-MEG.txt` recommends the extension, «da virker «Skriv ut» best».

## Update check (extension only)

Code: the block «update check (only in the Chrome/Edge extension)» in `src/app.js`, with `installedRelease()`, `checkForUpdate()` and `showUpdateBar()`. An unpacked extension cannot update itself, so the page asks GitHub.

- `RELEASES_API = "https://api.github.com/repos/uwu6967/norsken/releases/latest"`. The request is sent with `Accept: application/vnd.github+json` and `cache: "no-store"`.
- Memo in localStorage **`norsken-update-check`** (`UPDATE_KEY`): `{ at, latest: { n, zip, page, name }, skip }`.
- `checkForUpdate()` runs once at start-up and then every 3 hours (`setInterval`). It only fetches when there is no memo or the memo is older than 3 h. Its `force` parameter is never passed.
- The release number is read from the tag: the `-(\d+)$` at the end of `tag_name` (e.g. `v2026.11.21-71` → `71`). `zip` is the `browser_download_url` of the asset named `Norsken.zip`, or else the release page `html_url`.
- If the request fails or comes back not-OK, it quietly returns and tries again next time. The bar shows only when `latest.n > installedRelease()` and `memo.skip !== latest.n`.
- The bar (`#update-bar` in `src/index.html`, above the top bar) reads «**Ny versjon av Norsken er klar** (nr. N, du har nr. M). 1) Trykk «Last ned». 2) Pakk ut og kopier filene inn i Norsken-mappa di (erstatt de gamle). 3) Trykk «Oppdater nå». Planene dine blir liggende.» It is in English when `state.lang === "en"`. Its buttons:
  - «Last ned» (`#update-download`) links to the zip. The default `href` in the HTML is `…/releases/latest`.
  - «Oppdater nå» (`#update-reload`) calls `save()`, then `chrome.runtime.reload()`, which picks up the new files from the folder. It falls back to `location.reload()`.
  - «Senere» (`#update-later`) hides the bar and sets `memo.skip = n`, so it only asks again when an even newer release comes.
- The version (`1.0.<run>`) and the tag (`…-<run>`) both end in the same GitHub run number. That is what makes the comparison work. Keep the two in step if the workflow changes.

## Automatic releases (`.github/workflows/release.yml`)

**When:** every push to `main`, and by hand ("Run workflow", `workflow_dispatch`). `permissions: contents: write`. `concurrency: { group: release, cancel-in-progress: false }`, so quick pushes queue and each one still gets its own release.

**Steps (job `release`, `ubuntu-latest`):**
1. `actions/checkout@v4` with `fetch-depth: 0` (full history and tags, needed for the notes).
2. `python3 tools/build.py`.
3. **Package:** `mkdir -p dist/Norsken`, copy `extension/.` plus `LES-MEG.txt` and `LICENSE` into it, then `sed` `"version": "1.0.0"` → `"version": "1.0.${GITHUB_RUN_NUMBER}"` in `dist/Norsken/manifest.json` (and `grep` it into the log). Zip from inside the folder, so **the files sit at the root of `Norsken.zip`** (no folder inside a folder). That is why the zip works both as an extension folder and as a double-click app. `LES-MEG.txt` is also copied to `dist/` as its own asset.
4. **Release notes** (`notes.md`): `PREV` = the newest `v*` tag by creation date, range `PREV..HEAD`. The text starts with «## Last ned» (two bullets: what `Norsken.zip` and `LES-MEG.txt` are), then «## Endringer» with `git log --no-merges --reverse --format='- **%s**%n%n%w(0,2,2)%b'` piped through `cat -s`. Each commit becomes a bold subject line followed by its body, indented two spaces. With no earlier tag, the only line is «- Alt fra før er samlet i denne versjonen.»
5. **Publish** with `gh release create` (token `github.token`): tag `v$(date -u +%Y.%m.%d)-${GITHUB_RUN_NUMBER}`, title `Norsken DD.MM.YYYY (#N)`, assets `dist/Norsken.zip` and `dist/LES-MEG.txt`, `--target "$GITHUB_SHA"`, `--notes-file notes.md`, `--latest`.

Example: run 71 on 2026-11-21 gave tag `v2026.11.21-71`, title «Norsken 21.11.2026 (#71)», and a zip whose manifest says `1.0.71`.

**What it does not do:** commit the built files, deploy the website, or run any tests.

**Things to know:**
- **Commit messages are the release notes** (`CONTRIBUTING.md`). Write them in plain words for the boss: a title and a short list of what changed for the user. Every push is a release, so ten small pushes make ten releases. The update bar offers only the newest.
- The `sed` only matches the exact text `"version": "1.0.0"` as `build.py` writes it (`json.dumps(…, indent=2)`). If the version or format in `build.py` changes, the zip silently keeps the wrong version, and the update check compares the wrong numbers. The `grep` only prints the line; it does not fail the job.
- The dates in the tag and title are UTC.

## The hosted copy

A copy of the app that runs inside a host page offering `window.claude`. It is the only copy where everyone shares one floor plan: the code comment says «so the boss and every waitress see the SAME plan». It runs the built single-file `index.html`. [[Rules]] says to update it by hand after a push (with `print.html`, `src/app.js` and `src/styles.css` beside it) and to **keep the `window.claude` lines**. Nothing in the repo or the workflow deploys it, and the repo does not say where it is hosted (unclear). [[Decisions]] (2026-11-21): the hosted copy stays working.

### Shared plan (`connectShare()`, `pushShare()`, `applyRemote()`)
- On start-up `connectShare()` calls `window.claude.use("db")`. If that gives nothing, the chip says «Bare på denne enheten» and the page works on localStorage only.
- The plan is stored in the doc `SHARED_DOC = ROOMS[ROOM_ID].doc`: `plan/current` for Spisestua, `plan/domino` for Domino. A doc looks like `{ plan: <JSON string>, writer: CLIENT_ID, at: Date.now() }`. `CLIENT_ID` is a random id per page load.
- **First snapshot:** if the doc has a `plan`, it is applied. If the store is empty, this device's layout becomes the plan. If no snapshot comes within 10 s, the page carries on and the chip shows the error text.
- **Writing:** `save()` → `scheduleShare()` → `pushShare()` after 700 ms. It waits while a drag is going on and skips if nothing changed. A permission-like error (`/perm|denied|forbid|role|level/i`) switches to read-only, «Kun visning». Any other error shows «Ikke lagret – prøver igjen» and retries after 4 s.
- **Only the layout is shared:** `SHARED_KEYS = ["tables", "fixtures", "furniture", "dims", "paintings", "bookingOrder"]`, with the tables passed through `layoutOnly()`. That removes every field in `GUEST_FIELDS` (`name`, `booked`, `redeck`, `redeckPax`, `seatNames`, `seatNotes`, `seatMarks`, `seatFromGuest`, `seatBefore`, `seatsRender`) and `guests`, and puts back a chair count that a booking had set. The guest list (`norsken-guests-v1`) is never shared.
- **Receiving:** `applyRemote()` ignores its own echo and ignores snapshots that arrive during a drag. It keeps this person's view settings (`lang`, `showGrid`, `showMeasure`, `withChairs`, `brush`, `showPaintings`, `selectedPainting`) and the selection if that table still exists. It merges this device's guest fields back onto the same table ids, drops `bookingsText`, runs `normalizeState()`, writes localStorage and re-renders.
- **Status chip `#sync-status`:** «Kobler til…», «Lagrer…», «Delt plan · HH:MM», «Kun visning», «Ikke lagret – prøver igjen», «Bare på denne enheten» (English versions when the language is English).

### Printing by download
The hosted frame blocks new tabs and `window.print()`. When `window.claude?.use` exists, the `#print-btn` click handler:
- prevents the link and asks for `window.claude.use("downloads")`. With none, it shows the toast «Utskrift virker ikke på denne nettsiden. Bruk Norsken-utvidelsen (eller versjonen du lastet ned) og trykk «Skriv ut» der.»
- otherwise runs `save()`, takes the print page's source (`__NORSKEN_PRINT_SRC__` in the built file, else `fetch("print.html")`), and bakes in `window.__NORSKEN_STATE__`, `__NORSKEN_GUESTS__`, `__NORSKEN_ROOM__` and `__NORSKEN_SHIFT__`.
- saves the result as `norsken-oppsett-YYYY-MM-DD.html`, with the toast «Utskriften er lastet ned (…). Åpne fila – da kommer utskriften opp av seg selv.» A refusal with code `"declined"` is silent.

That file contains guest names, but only on the PC that downloaded it. Details on [[Printing]]. `prompt()` and `alert()` do not work in the hosted page either, which is why the app uses `showToast()` for messages.

## When you change something here

- Run `python3 tools/build.py` and commit everything it writes before you push. Otherwise the website goes stale.
- Test the built files, including the extension and the hosted-copy paths, as described on [[Testing]].
- After the push: check that the new release has both `Norsken.zip` and `LES-MEG.txt`, and that the website shows the change once Pages has published it.
- If you touched the update check, the version `sed` or the tag format, make sure the last number of the version and of the tag still match.
- Add a line to [[Change log]].

## Related
- [[Files and build]]
- [[Storage and data]]
- [[Printing]]
- [[ResDiary import]]
- [[Shifts and start screen]]
- [[Testing]]
- [[Rules]]
- [[Decisions]]
- [[What Norsken is]]
- [[Start here]]
