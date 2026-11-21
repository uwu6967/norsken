---
title: Testing
tags: [norsken, testing, playwright]
updated: 2026-11-21
---
# Testing

Norsken has no test suite in the repo: there is no `package.json`, no test folder and no CI test step (the release job only builds and packs, see [[Extension, website and releases]]). Testing means driving a real Chromium with **Playwright for Node** against the **built** files, filling the app with **made-up bookings** through its own functions, and then going through a fixed regression checklist. This is needed because the app is one big classic script with no framework. The bugs that hurt the most (start-up order, the top bar wrapping, a printout spilling onto a second page, a phone layout scrolling sideways) only show up in a real browser at real sizes. Every snippet on this page was run against a build of the current code on 2026-11-21.

## Ground rules

- **Made-up names only:** Testa, Testb, Testc … Never paste a real ResDiary list into a test, and never save screenshots, PDFs or traces that show real guests ([[Rules]], privacy).
- **Keep test scripts, screenshots, PDFs and Playwright profiles outside the repo.** `.gitignore` only covers `*.csv` and `resdiary-*`, so a stray `test.js` or `shot.png` in the repo folder would be committed by the next `git add -A`. And everything on `main` is public on the website.
- **Build first:** `python3 tools/build.py`. Test the root `index.html` (that is the website) and the root `print.html`. Those are what people open, and the build is itself the first test: its `assert`s catch a reformatted print line, changed `?v=` numbers, a second `<script>` in `print.html` or a `//` in a bookmark. See [[Files and build]].
  - For a quick look while working, `src/index.html` also opens straight from disk (it loads `app.js?v=24` and `styles.css?v=23` beside it). But do the final run on the built files.
- **Watch the console, not just exceptions.** `render()` catches errors and logs them with `console.error`. A broken render step leaves a half-drawn page and throws nothing ([[Render loop]]). Listen for both `pageerror` and `console` messages of type `error`. Zero of both is part of every test.

## Setup

- Node.js plus the `playwright` package, and Playwright's Chromium: `npm install playwright` in a folder **outside** the repo, then `npx playwright install chromium`. In scripts: `const { chromium, devices } = require("playwright");`.
- No test runner is needed. A plain Node script run with `node test-norsken.js /path/to/norsken` is enough.
- Open files with `file://` URLs. Build them with `pathToFileURL()` from Node's `url` module, so paths with spaces (or Windows paths) work.

## Things to know before you script anything

- **The start screen covers the page.** On a fresh browser profile (no list), or when the saved list is from another day, the last lines of `src/app.js` call `openToday()`. The «☀ I dag» dialog (`#today`, `role="dialog"`) then lies over everything and catches clicks. **Call `window.closeToday()` first** (pressing Escape works too). Calling `importBookings()` yourself does not open it. Of the import paths, only the ResDiary `message` handler and an old `#import=` link (`importFromHash()`) do.
- **What `page.evaluate` can reach.** `src/app.js` is a classic script, so its function declarations are globals: `closeToday()`, `openToday()`, `presetLayout()`, `importBookings()`, `assignBookings()`, `chooseShift()`, `save()`, `render()`, `guestsOn()`, `installedRelease()` and so on. Top-level `let`/`const` (`state`, `guests`, `SHIFT`, `bookingResult`, `ROOM_ID`, `share`) can be read and assigned **by bare name** inside `page.evaluate`, but they are **not** on `window` (`window.state` is `undefined`).
- **Setting up data:**
  - `presetLayout("usual" | "lunch" | "jul")` puts a ready floor in Spisestua and runs `save()` + `render()`. In Domino it lays out `dominoLayout()` instead.
  - `importBookings(text, source)` replaces the day's list (sets `day` to today), saves and renders, and returns `true` or `false`. `text` has one booking per line, **tab-separated: time, party size, surname, comment, Område, ResDiary table**. That is the same format «🍽 Til Norsken» and «Til bordplan» produce. A CSV with a header row (as from «Last ned liste») also works. See [[ResDiary import]].
  - `assignBookings()` is «Fordel bord automatisk» without the button. It only places unplaced bookings that pass the current shift (`inShift()`). In Spisestua it seats Spisestua's own bookings, sends Område «Domino» bookings (and whatever does not fit) to Domino, and never places bookings for other rooms. It saves the guest list itself but **not** the plan, and it does not render, so call `save(); render();` after it. The outcome is in `bookingResult.rows` (`r.table.label`, `r.room === "domino"` …). See [[Auto seating]].
  - The shift: `SHIFT` is `""` (whole day) on a fresh profile. Set it with `SHIFT = "middag"` **and** `localStorage.setItem("norsken-shift", "middag")`, because `print.html` reads the key, not the variable. Or call `chooseShift("middag")`, which does the boss's one press: lays out the shift's floor if needed, assigns, saves, renders, closes the start screen and shows the toast with «↶ Angre». See [[Shifts and start screen]].
  - Domino: `localStorage.setItem("norsken-room", "domino")`, then `page.reload()` (`ROOM_ID` is read once at start-up, just like the room buttons do).
  - English: `state.lang = "en"; save(); render();`.
- **The printout is another page in the same context.** `print.html` reads localStorage, so open it in `context.newPage()` of the **same** browser context. A new context starts empty. Stub `window.print` with `addInitScript` **before** the page loads: `print.html` calls `window.print()` 300 ms after `load`. With the stub, the test can see the call happened, and a visible browser does not stop at the print dialog.

## A basic test script

```js
// test-norsken.js – keep OUTSIDE the repo. Run: node test-norsken.js /path/to/norsken
const { chromium, devices } = require("playwright");
const path = require("path");
const { pathToFileURL } = require("url");

const REPO = path.resolve(process.argv[2] || ".");
const file = (name) => pathToFileURL(path.join(REPO, name)).href;

// made-up bookings: time, people, surname, comment, Område, ResDiary table (tab-separated)
const LIST = [
  "12:00\t2\tTesta\t\tSpisestue\t",
  "18:00\t2\tTestb\tglutenfri\tSpisestue\t",
  "18:30\t4\tTestc\tGjerne bord 6\tSpisestue\t",
  "19:00\t6\tTestd\tjulebord fast meny\tSpisestue\t",
  "19:00\t3\tTeste\tnøtteallergi\tDomino\t",
  "19:30\t8\tTestf\t\tOnsdagsklubben\t",
].join("\n");

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  // print.html calls window.print() 300 ms after load: count the calls instead
  await context.addInitScript(() => {
    window.print = () => { window.__printed = (window.__printed || 0) + 1; };
  });
  const errors = [];
  const watch = (p, tag) => {
    p.on("pageerror", (e) => errors.push(`${tag} pageerror: ${e.message}`));
    p.on("console", (m) => m.type() === "error" && errors.push(`${tag} console: ${m.text()}`));
  };

  const page = await context.newPage();
  watch(page, "app");
  await page.goto(file("index.html"));
  const rows = await page.evaluate((list) => {
    closeToday();                 // the «☀ I dag» screen covers the page on a fresh profile
    presetLayout("usual");        // «Vanlig oppsett» (saves + renders)
    importBookings(list, "test"); // the day's list (saves + renders)
    SHIFT = "middag";             // or: chooseShift("middag")
    localStorage.setItem("norsken-shift", SHIFT); // print.html reads the shift from here
    assignBookings();             // «Fordel bord automatisk», no toast
    save();
    render();
    return bookingResult.rows.map((r) => [r.name, r.table ? r.table.label : null, r.room || ""]);
  }, LIST);
  console.log(rows);

  // the printout: second page, SAME context (same localStorage)
  const sheet = await context.newPage();
  watch(sheet, "print");
  await sheet.goto(file("print.html"));
  await sheet.waitForFunction(() => window.__printed > 0);
  const pdf = await sheet.pdf({ preferCSSPageSize: true });
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  const landscape = await sheet.evaluate(() => document.documentElement.classList.contains("with-list"));
  console.log("with list (A4 landscape):", landscape, "PDF pages:", pages); // expect true, 1

  // phone
  const phone = await browser.newContext({ ...devices["iPhone 13"] });
  const mobile = await phone.newPage();
  watch(mobile, "phone");
  await mobile.goto(file("index.html"));
  await mobile.evaluate(() => closeToday());
  console.log("sideways scroll on phone:", await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth)); // expect false

  console.log(errors.length ? errors : "no errors");
  await browser.close();
})();
```

To use the real print button instead of opening `print.html` yourself: `const [sheet] = await Promise.all([context.waitForEvent("page"), page.click("#print-btn")]);`. The `addInitScript` on the context covers the new tab too.

## Regression checklist (before every push)

Run these on the built files with made-up names. Any `pageerror` or console error fails the run.

### 1. The build
`python3 tools/build.py` finishes with its `wrote …` lines and no `AssertionError`, and `git status` shows the regenerated `index.html`, `print.html`, `extension/` … ready to commit with the change.

### 2. Reload test (the TDZ trap)
The first `render()` runs while `src/app.js` is still loading. A top-level `const`/`let` declared below it, but used on the render path, throws «Cannot access '…' before initialization». This has broken the page twice ([[Render loop]]). Test a reload with a saved list **with comments that hit the diet words** («glutenfri», «nøtter») and **a booked table selected**:

```js
await page.evaluate(() => {
  const booked = state.tables.find((t) => t.zone === "room" && guestsOn(t).length);
  state.selected = booked ? booked.id : null;
  save();
  render();
});
errors.length = 0;
await page.reload();
const after = await page.evaluate(() => ({
  startScreen: !document.getElementById("today").hidden,      // false: the list is today's
  unplaced: document.querySelectorAll("#guest-list li").length, // «Uten bord»
  tables: document.querySelectorAll("#res-tables li").length,   // «Bordene»
}));
```

Pass: `errors` is empty, «Bordene» is filled, and so is «Uten bord» when some booking has no table. All of this must hold **without clicking anything**: a click causes a second render and hides the bug.

### 3. The top bar on one row at 1280, 1366, 1600 and 1920 px
Use a list that makes the bar as long as it gets: include an event booking (e.g. comment «julebord fast meny» at 19:00) so the combined tab «Middag+★» shows, and pick a shift so the tabs show their counts. Then:

```js
for (const width of [1280, 1366, 1600, 1920]) {
  await page.setViewportSize({ width, height: 900 });
  console.log(width, await page.evaluate(() => {
    const tops = [".brand", "#shift-switch", ".room-switch", ".topbar-actions"]
      .map((s) => document.querySelector(s).getBoundingClientRect().top);
    return {
      height: Math.round(document.querySelector(".topbar").getBoundingClientRect().height),
      spread: Math.round(Math.max(...tops) - Math.min(...tops)), // one row: a few px
      sideways: document.documentElement.scrollWidth > innerWidth, // must be false
    };
  }));
}
```

On 2026-11-21 one row measured `height` 72 / 75 / 78 / 82 px and `spread` 6–8 px at the four widths. At **1279 px** the bar is meant to wrap: `@media (max-width: 1279px)` in `src/styles.css` gives the shift buttons their own row. There it measured 130 px high with a spread of 58 px. Above 1279 px, a jump like that is a regression. The relevant breakpoints in `src/styles.css` are 1279, 1365, 1599, 1600–1799 and 2099 px. [[Rules]]: «The top bar fits one row from 1280 px wide».

### 4. The printout fits one page
With the list from the basic script, and again with a **long** made-up list (40+ bookings, a few long comments, some in Domino so the Domino map joins the sheet):
- `document.documentElement.classList.contains("with-list")` is `true` (A4 landscape, list beside the map).
- `page.pdf({ preferCSSPageSize: true })` gives **exactly 1 page** (count as in the basic script). `preferCSSPageSize` makes the PDF use the sheet's own `@page` size.
- Optionally save the PDF outside the repo and look at it: names on the tables, nothing cut off.
- `fitList()` in `print.html` shrinks the list in steps of 0.04 until it fits beside the map, and stops at a zoom of 0.48. With 44 made-up bookings it reached `0.48` and still made one page. `document.querySelector("section.list").style.zoom` at `0.48` means the list is at its limit.
- If you changed `print.html`, or a constant it copies from `app.js` (`SEAT_MARKS`, `DEFAULT_DIMS`, `EVENT_WORDS`, the shift rule), compare screen and paper. See [[Printing]].

### 5. Phone (`devices["iPhone 13"]`)
`browser.newContext({ ...devices["iPhone 13"] })` gives a 390 × 664 viewport with touch and mobile mode (it runs fine in Chromium although the descriptor names WebKit).
- The start screen opens by itself on the fresh profile and closes. Everything stays inside the width: `scrollWidth > innerWidth` is `false`.
- `locator.tap()` works (the descriptor turns on touch).
- **Drags:** `page.mouse` sends `pointerType: "mouse"` even in a phone context. To test a finger, send pointer events with `pointerType: "touch"`. Send `pointerdown` on the element and `pointermove` / `pointerup` on `window`, where the app's drag listeners are. `startDrag()` tolerates synthetic pointers.

  ```js
  await page.evaluate((id) => {
    const el = document.querySelector(`#room .table[data-id="${id}"]`);
    const b = el.getBoundingClientRect();
    const x = b.x + b.width / 2, y = b.y + b.height / 2;
    const ev = (type, cx, cy) => new PointerEvent(type, { bubbles: true, cancelable: true,
      pointerId: 7, pointerType: "touch", isPrimary: true, button: 0, clientX: cx, clientY: cy });
    el.dispatchEvent(ev("pointerdown", x, y));
    for (let i = 1; i <= 10; i += 1) window.dispatchEvent(ev("pointermove", x, y - i * 60));
    window.dispatchEvent(ev("pointerup", x, y - 600)); // ends above the map
  }, tableId);
  ```

  Pass: a floor table dragged by a finger off the map (and not onto the tray) stays on the floor (`zone === "room"`), with the toast «Bordet ble stående. Bruk «Til lager» for å ta det bort.» (the `touch` flag set in `startDrag()` and checked in `finishDrag()`).

### 6. Start screen and one-press flow
In a fresh context «☀ I dag» opens by itself. After `importBookings()`, `chooseShift("middag")` closes it, and the toast says «Middag: N bookinger ved bord …». `page.keyboard.press("Escape")` also closes it.

## Testing the other copies

### The extension
Load `extension/` into a persistent profile (kept outside the repo) and open its pages by id:

```js
const ext = path.join(REPO, "extension");
const ctx = await chromium.launchPersistentContext("/tmp/norsken-profile", {
  channel: "chromium", // the full Chromium; needed to load extensions headless
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});
const worker = ctx.serviceWorkers()[0] || (await ctx.waitForEvent("serviceworker"));
const id = new URL(worker.url()).host; // nelgncobbbjedmbjenkjfcfjegeflpmc (fixed by the manifest key)
```

Then open `chrome-extension://<id>/index.html` and `chrome-extension://<id>/print.html` (stub `window.print` the same way). Check for no errors: a content-security-policy error here means an inline script or `on…=` attribute slipped in. A locally built extension has version `1.0.0`, so `installedRelease()` returns `0` and no update bar appears.

### The update bar
On a `file://` page, fake both the installed version and GitHub:

```js
await context.route("https://api.github.com/**", (route) => route.fulfill({
  status: 200, contentType: "application/json",
  headers: { "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify({ tag_name: "v2026.11.21-99", name: "Norsken 21.11.2026 (#99)",
    html_url: "https://example.invalid/release",
    assets: [{ name: "Norsken.zip", browser_download_url: "https://example.invalid/Norsken.zip" }] }),
}));
await page.addInitScript(() => {
  window.chrome = { runtime: { getManifest: () => ({ version: "1.0.71" }), reload: () => { window.__reloaded = true; } } };
});
await page.goto(file("extension/index.html"));
```

Expect `#update-bar` visible with «Ny versjon av Norsken er klar (nr. 99, du har nr. 71) …» and «Last ned» pointing at the fake zip. The answer is remembered for 3 hours in `norsken-update-check`, so use a fresh context or remove that key between runs.

### The hosted copy
Use the **built** root `index.html`. Its print source is embedded; from `src/` the hosted print path calls `fetch("print.html")`, which fails on `file://`. Stub `window.claude` before load:

```js
await page.addInitScript(() => {
  const store = {};
  window.__store = store;
  const db = { doc: (name) => ({
    set: async (v) => { store[name] = v; },
    onSnapshot: (cb) => { setTimeout(() => cb({ data: () => store[name] || null }), 50); },
  }) };
  window.claude = { use: async (cap) => (cap === "db" ? db : cap === "downloads" ? { save: async (f) => { window.__saved = f; } } : null) };
});
```

After importing made-up bookings and seating them (wait about 1.5 s for the 700 ms write delay), expect:
- `#sync-status` shows «Delt plan · HH:MM»;
- `window.__store["plan/current"]` exists and **contains none of the test names**: the shared plan is layout only;
- clicking `#print-btn` opens no tab, and `window.__saved.filename` is `norsken-oppsett-YYYY-MM-DD.html`, with `__NORSKEN_STATE__` (and the names) baked into `window.__saved.data`.

Return `null` for `"db"` to see «Bare på denne enheten». Make `set()` throw `{ code: "permission-denied" }` to see «Kun visning». See [[Extension, website and releases]].

## Not covered here

- The real ResDiary page and the full «🍽 Til Norsken» hand-off. The page only accepts `postMessage` from a ResDiary origin, so it cannot come from a `file://` test. To test what the hand-off does, call `importBookings(text, "ResDiary"); openToday();`, which is exactly what the `message` handler runs. A fake ResDiary page served through `context.route()` might work but has not been tried.
- Real printers and paper. The PDF check stands in for them, so print one real sheet after big changes to [[Printing]].
- The Pages deploy and the release job. Check those on GitHub after the push.

## Related
- [[Files and build]]
- [[Render loop]]
- [[Storage and data]]
- [[Printing]]
- [[Auto seating]]
- [[Shifts and start screen]]
- [[ResDiary import]]
- [[Extension, website and releases]]
- [[Rules]]
- [[Change log]]
