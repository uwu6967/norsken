---
title: Render loop
tags: [norsken, architecture, rendering]
updated: 2026-11-21
---
# Render loop

`src/app.js` has no framework and no virtual DOM. One `render()` function redraws the whole screen from `state` (the room's plan) and `guests` (the day's bookings) every time something changes: each part throws away its old DOM (`innerHTML = ""` or a new template string) and builds it again. Pointer dragging goes through one global `drag` object and three window-level handlers (`onMove`, `onUp`, `onCancel`). This page covers the order `render()` works in, the few places that redraw only part of the screen, how start-up runs, the drag system and its drag kinds, and the start-up TDZ trap: a top-level `const`/`let` that is read during the first render must be declared above that render call. The trap broke the page once (fixed in commit a0d01fa), and the current code has one more open case (`RIG_SIZES`, see below).

## The rule: mutate, save, render

Nearly every event handler does the same three things:

1. change `state` and/or `guests`;
2. `saveGuests()` if `guests` changed (writes `norsken-guests-v1`), then `save()` (writes the room's plan, and on the way frees chairs with `releaseEmptySeats()` and bakes `w`, `h`, `guests` and `seatsRender` onto every table for `print.html`; see [[Storage and data]] and [[Printing]]);
3. `render()`.

Do not patch the DOM by hand in a handler unless it is one of the partial redraws below. The next `render()` overwrites your change anyway.

## render(): what runs, in order

```js
function render() {
  try {
    renderShell(); renderRig(); renderChrome(); renderMeasurePanel(); renderSeatPalette();
    renderRoom(); renderTray(); renderList();
    /* hide #measure-list unless #seat-summary or #warnings has text */
    renderDrawer(); renderPaintingCard(); renderBookings();
    renderGuests(); renderTabs();
    requestAnimationFrame(renderCallouts);
  } catch (error) { console.error(error); }
}
```

| Step | Draws |
|---|---|
| `renderShell()` | Top bar: the short date in `#today-date` (long date as its `title`); the shift buttons in `#shift-switch`: the entries of `SHIFTS` that `shiftShown()` allows (Arrangement only when there are event bookings, a combo such as «Middag + Arrangement» only on a day with an event in that part of the day; the chosen `SHIFT` is always shown), then «Alle». People counts from `shiftCounts()` appear only when there is a guest list. Also `body.salon` (from `IS_SALON`), the `#room-innover` label («Innover ▾», or the salon's name), `body.tools-off` when `toolsOn()` is false (`norsken-tools` is not `"1"`), the `#today-btn-text` («I dag») and `#tools-btn-text` («Verktøy») labels. Re-renders the «I dag» dialog with `renderToday()` only if it is open. See [[Shifts and start screen]]. |
| `renderRig()` | The full-screen room editor («✏️ Flytt bord»). Toggles `body.rig` and shows `#rig-head` and `#rig-panel` only while `RIG` is true; otherwise returns at once. The panel shows the room-size step (a salon whose `state.sized` is false), the selected floor table's controls (`rigTable()`), or the add buttons built from `RIG_SIZES`. |
| `renderChrome()` | Language-dependent labels everywhere: «🖨 Skriv ut» (in a salon its link becomes `print.html?room=<id>`), the «🪑 med stoler / uten stoler» print toggle (`state.printNoChairs`), the room tabs (`[data-room]`), the preset buttons «Vanlig oppsett», «Lunsj-oppsett» and «Jul-oppsett» (the last two are hidden outside Spisestua, so in Domino and every salon), «Skjul alle stoler / Vis stolene», `document.title` (`Norsken — <room name>`), the `#hint` text, the Innstillinger toggles (`#measure-btn`, `#grid-btn`, `#chairs-btn`), and the sync chip via `setShareStatus()` when the share status is not `"local"` or the hosted copy offers `window.claude.use`. |
| `renderMeasurePanel()` | The «Mål i cm» fields in Innstillinger, one per entry in `FIELDS`; the panel is hidden unless `state.showMeasure`. |
| `renderSeatPalette()` | The «Merking av plasser» brush row: «Ingen», one brush per `SEAT_MARKS` entry, «Notat», «Navn på stol». |
| `renderRoom()` | The map `#room`, see below. |
| `renderTray()` | The store («Lager / ikke i bruk»): the add buttons («+ lite», «+ stort», «+ ovalt», «+ metallbord», «+ langbord»), the tables in storage, then `renderPlateRack()` («Bordplater»: plates left per size, and `trayHint` when set). |
| `renderList()` | The «Målliste» table (still built, but `#list-title` and `#list-body` are `hidden` in `src/index.html`), `#seat-summary` (marked chairs and chair notes per table) and `#warnings`. `#warnings` now only shows doubled table numbers; chair clashes and tight gaps are still computed there but not listed (clashing chairs still get the `.clash` class on the map, from `seatNodes()`). |
| (inline) | `#measure-list` is hidden unless `#seat-summary` or `#warnings` has text. |
| `renderDrawer()` | The «Bord» panel for `state.selected`: sizes, «Roter» (hidden for round tables), «Til lager», number field with auto, people −/+/auto, the time field (`timeField()`), name field, for round tables the ⟲ ⟳ chair turn (15° steps), «Jevn ut stolene» when chairs were moved by hand, ends, for langbord the plate plan and custom size, the langbord group row, and the move arrows. Hidden when nothing is selected or the selected table is not on the floor (`zone !== "room"`). |
| `renderPaintingCard()` | The painting card. Dormant: hidden unless `state.showPaintings` is on and a painting is selected; paintings are no longer drawn. |
| `renderBookings()` | Innstillinger → «Bordfordeling»: the «Prioritet (bord i rekkefølge)» label, the overflow buttons «Dekk om et bord (↻)» / «Bruk Domino» (`state.overflow`), «Minutter før et bord kan dekkes om» (`state.sitMinutes`, default 60), and the house-rules list `#book-rules`. See [[Auto seating]]. |
| `renderGuests()` | Only calls `renderReservations()`: the «Reservasjoner» tab with «Uten bord», «Bordene», search, the «✓» ticks and «Flytt». See [[Reservations list]]. |
| `renderTabs()` | Which of «Bord» / «Reservasjoner» / «Merking» is shown (`activeTab` = `"table"`, `"book"` or `"marks"`). |
| `renderCallouts()` | Names beside the map with lines to their tables or chairs. Runs in the NEXT animation frame, because it measures the laid-out map. Draws nothing unless `calloutMode()`. |

`renderRoom()` itself, in order: toggles `.no-grid`, sets the aspect ratio, then the width in one of three ways: with `RIG` on, from the window size minus the `#rig-head` and `#rig-panel` heights (also written to the CSS variables `--rig-head` and `--rig-panel`); with `oneScreen()` true, from the `.stage` height, leaving 340 px for callouts when `calloutMode()` and there are names to show, minimum 160 px; otherwise a CSS `min()` that subtracts 340 px in callout mode. Then the doors (`state.fixtures` → `doorButton()`), grid and ruler (if `state.showGrid`), plate strips (`plateInserts()`), chairs (`seatNodes()`, which returns nothing if `state.hideChairs`), table buttons (`tableButton()`), and finally `joinLangbord()`, which marks the halves of a langbord so it is drawn as one piece.

Not called from `render()`: `renderMine()` (when «★ Oppsett» opens or its list changes), `refreshUndo()`, `renderHouse()` (the «🏠 Norsken» dialog, see [[House map]]), `renderToday()` (from `openToday()`, or from `renderShell()` while the dialog is open), `renderSeatEditorMarks()` (the chair box).

## Partial redraws

| Where | What it redraws | Why |
|---|---|---|
| Typing a name in «Bordene» | `liveRedrawMap()` = `renderRoom()` + `requestAnimationFrame(renderCallouts)` | the text box keeps focus and the caret stays put while the map follows each key |
| Search box `#res-search` (typing, or Escape to clear) | `renderReservations()` only | same reason |
| Clicking a tab | `renderTabs()` only (and stores the tab in `norsken-tab`) | nothing else changes |
| Window resize | full `render()`, debounced 120 ms (`calloutTimer`) | callouts and map size depend on layout |
| Window resize while `RIG` is on | `renderRoom()` at once (a second resize listener, in addition to the debounced one) | the editor's map must fit the phone screen |
| Sync status | `setShareStatus()` writes `#sync-status` directly | async status from the shared store |
| Painting name typing | `save()` and sets the node's `title`; full `render()` on `change` | dormant feature |

## Layout-dependent rendering

- `oneScreen()` = `matchMedia("(min-width: 1100px) and (min-height: 620px)")`: everything on one screen, lists scroll inside their own boxes (the same media query is used in `src/styles.css`).
- `calloutMode()` = `.room-wrap` is at least 620 px wide. Then names go beside the map (callouts) and the table only shows its number; otherwise the name is printed inside the table button.
- In the `oneScreen()` branch `renderRoom()` reads the `.stage` height and padding, so a hidden or zero-size stage gives a tiny map (the 160 px minimum).

## Gotchas when writing render code

- **`render()` swallows errors.** A throw in any step is logged with `console.error` and every LATER step of that pass is skipped. The page looks half-drawn but nothing pops up. Always keep the console open while testing ([[Testing]]).
- **Two-tap buttons.** The hosted copy cannot show `confirm()`, so `armed(button, question)` swaps the button text for a question such as «Sikker? Trykk igjen» for 4 s and sets `data-armed="1"`. Render code that sets such a button's text must skip it while armed; existing code checks `dataset.armed !== "1"` for `#preset-btn`, `#lunch-btn`, `#jul-btn`, `#book-clear`, `#guest-clear`.
- **Missing elements.** Some ids the code mentions are no longer in `src/index.html` (`paintings-btn`, `book-text`, `set-room-title`), so those lookups use `?.` or a null check. Many others are used without a check (for example `#lang-btn`, `#measure-btn`, `#grid-btn`, `#chairs-btn`, `#room`, `#label-row`, `#drawer-measure`, `#measure-fields`, `#add-row`, `#brush-row` get top-level `addEventListener` calls). Removing one of those from `src/index.html` throws during start-up and stops the rest of the script.
- **Listeners.** Delegated listeners on fixed containers (for example `#room`, `#res-tables`, `#label-row`, `#drawer-measure`, `#brush-row`, `#shift-switch`, `.tabs`, `#today`, `#rig-head`, `#rig-panel`, `document`) are attached once at load. Per-element `pointerdown` listeners are attached to the fresh elements on every render. Two capture-phase click handlers call `stopPropagation()`: `[data-arrived]` (the «✓» tick) on `#res-tables`, and `[data-event]` (the ☆/★ star) on `document`.

## Start-up order

`app.js` is one classic script that runs top to bottom once:

1. Constants: `ROOM_DEFS`, `ROOMS`, `ROOM_KEY`, `SALON_KEY`, `ROOM_ID` (a salon kept for this browser tab under `norsken-room-salong`, else `norsken-room` from localStorage, else `"spisestua"`), `IS_SALON`, `STORAGE_KEY`, `DOMINO_ROOM`, `DEFAULT_BOOKING_ORDER`, `LABELS`, `DIMS_VERSION`, `DEFAULT_DIMS`, `SIZES`, `PLATES`, `SIZE_KINDS`, `isPlate`, `i18n`, `PAINTING_WALLS`, with the helper functions between them.
2. `let state = loadState();` → `normalizeState()` → `defaultState()`.
3. The early block straight after it: `landedId`, `activeTab` (from `norsken-tab`), `GUESTS_KEY`, `guests = loadGuests()`, `guestMsg`, `moveFrom`, `resQuery`, `SHIFT_KEY`, `LUNCH_ENDS`, `EVENT_WORDS`, `SHIFTS`, `TOOLS_KEY`, `SHIFT`, `timeUnlock`, `RIG_KEY`, `RIG` (true when `norsken-rig` is `"1"` in this tab's storage), `rigUndo`, `houseHint`, `DIET_WORDS`, `resEdit`, `dragJustEnded`, `markDragEnded()`, `pasteArmed`, `drag`.
4. Helpers, the shared-plan constants (`SHARED_DOC`, `SHARED_KEYS`, `CLIENT_ID`, `share`), seating and plate logic, `SEAT_MARKS`, the drag functions plus the window listeners, most of the render functions, the debounced resize listener, then the event handlers for the settings, drawer and map. (Where a render function sits does not matter: function declarations are hoisted. What matters is which `const`/`let` it reads.)
5. **The first render**, at top level partway down the file, just before the «vanlig oppsett» section:
   ```js
   syncFurniture();
   clampAll();
   relabelRoom();
   save();
   render();
   ```
6. Everything after it: presets (`presetLayout()`), the guest-list functions, the print button, `connectShare()`, the room switch, the settings panel, overflow settings, `checkForUpdate()` plus a 3-hour `setInterval`, «Jul-oppsett», «★ Oppsett», «Angre» (`refreshUndo()`), tabs, «Reservasjoner», the house map, shifts, «☀ I dag», the `message` listener for the ResDiary handoff, `importFromHash()` (old `#import=` links; also on `hashchange`) followed by the check that opens «I dag» (`openToday()`) when not in a salon and there is no list or the list is from another day. After that come the ☆/★ capture handler, `offerTableUndo()`, the room editor (`RIG_SIZES`, `goRoom()`, the `rig…` functions, `renderRig()`, the `#rig-head`/`#rig-panel`/`#rig-open` listeners and the `RIG` resize listener), the «Innover ▾» button, «📤 Send bordkart» (`SITE`, `packMaps()`, then a top-level `importMapsFromHash()` call for `#kart=` links, also on `hashchange`), and at the very end the shift picked in a salon (`norsken-pending-shift` → `chooseShift()`) and `roomMapButton()`.

Anything that happens later (a click, a snapshot from the shared store, a `postMessage`, a timer, `requestAnimationFrame`) runs after the whole script has finished, when every declaration exists.

## The TDZ trap (read this before adding a top-level const or let)

Function declarations are hoisted: `function foo() {}` can be called from anywhere, even above its line. `const` and `let` are NOT usable until their line has run. Before that they are in the "temporal dead zone", and reading them throws `ReferenceError: Cannot access 'X' before initialization`. The same goes for arrow functions stored in a `const` (such as `isPlate`).

The first `render()` (step 5) runs while the script is still being evaluated. So **every top-level `const`/`let` that any render function, `save()`, or anything they call reads must be declared ABOVE that first `render()` call.** In practice, put it in the early block right after `let state = loadState()`. And if `defaultState()` or `normalizeState()` needs it, it must be above `let state` itself.

### Known cases

1. **`DEFAULT_BOOKING_ORDER`** sits near the very top, with the comment "Up here because defaultState() needs it before the rest of the file has run". `defaultState()` runs at `let state = loadState()`, long before the booking code where the constant would naturally live. It has been placed there since the first commit (c268dfb, 2026-11-12); whether it ever broke the page before that is unclear.
2. **`timeUnlock` and `DIET_WORDS`** (commit a0d01fa, 2026-11-20, "Fixes: nobody gets lost …"). Both were declared next to their features, far below the first `render()`. With a saved guest list (bookings with comments, or a booked table selected), the first render reached `dietChips()` → `dietTags()` → `DIET_WORDS` (from `renderReservations()`) or `timeField()` → `timeUnlock` (from `renderDrawer()`) and threw. `render()` caught it, so `renderGuests()`/`renderTabs()` never finished. Symptom in the release notes (built from commit messages by `.github/workflows/release.yml`): "after opening the page again, «Uten bord» could be empty and the list not shown until you clicked something". The click caused a second render, after the script had finished, so it "fixed itself". The fix moved both declarations up into the early block.
3. **`RIG_SIZES` — open in the current code.** It is declared in the room-editor section, far below the first `render()`, but `renderRig()` (the second step of `render()`) reads it whenever `RIG` is true and the panel is not on the room-size step: in Spisestua or Domino, or in a salon whose size is set. `RIG` comes from `norsken-rig` in the tab's storage, which `goRoom(id, true)` (the «Neste rom ›» button) sets right before `location.reload()`, and which survives a plain reload while the editor is open. On that start-up the first render throws `Cannot access 'RIG_SIZES' before initialization` in `renderRig()`, so `renderChrome()`, `renderRoom()` and every later step are skipped. Seen with a headless Chrome on `src/index.html` (`norsken-rig` set to `"1"`, then reload). Fix: move `RIG_SIZES` up into the early block next to `RIG_KEY`/`RIG`.

A related trap with the same root: `normalizeState()` runs before `state` exists, so it must not call `room()`, `centerCm()`, `orderGroup()` or anything else that reads `state`. Its `try/catch` would turn that `ReferenceError` into `defaultState()`, and the first `save()` would then overwrite the saved layout (the code comment inside `normalizeState()` warns about this).

### Declared late, but safe today

These top-level declarations come after the first `render()`, and are safe only because nothing reads them during the first render: `toastTimer`, `toastUndo`, `RELEASES_API`, `UPDATE_KEY`, `MINE_KEY`, `GUEST_FIELDS`, `UNDO_KEY`, `SEAT_DATA`, `HOUSE_ROOMS`, `houseOpenRoom`, `RESDIARY_ORIGIN`, `lastHandoff`, `SITE`. (`RIG_SIZES` is also late, and is NOT safe; see above.) Watch especially:

- `GUEST_FIELDS` is read by `layoutOnly()`, which `sharedPayload()`/`applyRemote()` call. Those only run after `connectShare()` has connected (async), and `scheduleShare()` returns early while `share.db` is unset (or `share.ready`/`share.canWrite` is false). If sharing ever ran synchronously inside `save()`, the first `save()` would throw.
- `UNDO_KEY` is read by `rememberFloor()`, which `presetLayout()` calls first. Laying out a preset during start-up would throw.
- `toastTimer` is read by `showToast()`. Showing a toast during the first render would throw.
- `HOUSE_ROOMS` is read by `houseRoomOf()` via `houseCounts()`. Fine while only `renderHouse()` uses it; calling it from a step of `render()` would throw.

### How to check

- Reload with a saved guest list (with comments such as «glutenfri») and a booked table selected, keep the console open, and look for "Cannot access … before initialization".
- Also reload while the room editor («✏️ Flytt bord») is open, in Spisestua and in a salon whose size is set.
- Check without clicking anything: «Uten bord» and «Bordene» are filled, only one tab pane is visible, callouts are drawn.
- Quick scan: `awk 'NR > <line of the first render()> && /^(const|let) /' src/app.js` lists the late declarations; for each new one, make sure nothing on the render path uses it.

## The drag system

One global `let drag = null` (declared in the early block) holds the drag in progress.

**Start**: `startDrag(event, target, el)` ignores non-primary buttons (`if (event.button) return`), calls `preventDefault()` and `setPointerCapture()`, and sets

```js
drag = { kind, id, size, sub, pointerId, startX, startY, lastX, lastY, moved: false, touch, el };
```

`touch` is `event.pointerType === "touch"` (a finger; see the table drop below). `onMove` later adds `ghost` or `angle`.

Tables, plates, doors (and the dormant paintings and furniture) start a drag on `pointerdown` and again on `mousedown` (ignored if a drag already exists), as a fallback for browsers or test tools that only send mouse events. Chairs, callouts, «Uten bord» items, the guest chips in «Bordene» and the group headings only listen to `pointerdown`.

**Window listeners** (attached once): `pointermove` and `mousemove` → `onMove` (with `{ passive: false }`), `pointerup` and `mouseup` → `onUp`, `pointercancel` → `onCancel`. `samePointer()` ignores events from another pointer.

**`onMove`**: nothing happens until the pointer has moved **6 px** (`dist < 6`). A table with `fixed` set («🔒 Står fast») never moves. Then:

- kind `seat`: no ghost. The chair itself slides around its table (`seatRing()`, `placeAround()`), and the angle goes into `drag.angle`;
- every other kind: the element is cloned as a `.drag-ghost` (`position: fixed`, `z-index: 80`, no pointer events) that follows the pointer;
- feedback per kind: `table` → `#tray` gets `.drop` while over it; `plate` → `showGapTarget()` outlines the gap (`#gap-target`); `callout` → `showCalloutTarget()`; a drag that can send guests back (`dropBackTable(drag)`) → `#leftcol` gets `.drop-back`; `guest`/`guestgroup` → the visible tab pane scrolls 14 px per move when within 60 px of its top or bottom, and the table under the pointer (`guestDropTable()` or a «Bordene» row via `resRowTable()`) gets `.guest-target`.

**`finishDrag(x, y)`** (from `onUp`, or from `onCancel` with the last position if the drag had moved; an unmoved cancel just calls `cleanupDrag()`), in this order:

1. `seat`: `cleanupDrag()`; unmoved (or no angle) = do nothing more (the click that follows marks the chair or opens the chair box). Moved = `table.seatAngles[seatIndex] = angle` (rounded to 0.1°), `save()`, `render()`, and `seatDragJustEnded` swallows the click that follows.
2. `cleanupDrag()` (ghosts removed, `#tray.drop` cleared, `drag = null`), `.drop-back` cleared.
3. **Drop-back**: a moved `table`, or a moved `callout` with `sub !== "seat"`, whose table has guests and is dropped on `#leftcol` → `sendBackToList()`: the guests go back to «Uten bord», the table stays where it is, with «Angre» in the message.
4. `painting`, `fixture`, `furniture`, `callout`, `guestgroup`, `guest`, `plate` (each described below).
5. `table`: unmoved = `finishMove()` if «Flytt» is waiting (`moveFrom`), else `selectTable()`. Moved: with `RIG` on, a floor table dropped outside the map is pulled back 4 px inside the map's edge (it stops at the wall). A floor table dragged by a finger (`touch`) and let go outside the map but not on the tray stays where it was, with the message «Bordet ble stående. Bruk «Til lager» for å ta det bort.». Otherwise `placeTable()`; a floor table that ended in the store gets `offerTableUndo()` («Bordet er satt på lager.» with «Angre»). Then the `landed` CSS class for 450 ms (`landedId`), `state.selected` = that table, `save()`, `render()`.

**Drag kinds**

| `kind` | Started from | Target fields | On drop |
|---|---|---|---|
| `table` | `tableButton()`: floor and tray tables | `id` | `placeTable()`: onto the map → `zone = "room"`, snapped centre; a part of a langbord already on the floor moves its whole group (`moveGroupBy()` + `respaceGroup()`). Anywhere else → back to the tray: `label`, `manual`, `name`, `group` cleared, its plates back on the rack (`clearGapPlates()`), the rest of the group re-spaced or dissolved. Then `relabelRoom()`. |
| `plate` | chips in `renderPlateRack()` | `size` = plate size | nothing if dropped outside the map; else `findGap()` at the drop point. No gap → `trayHint = plateNeedsTwo`; `addPlate()` fails (none left) → `plateNoneLeft`; otherwise the plate is added and the gap's first table is selected. See [[Chairs and plates]]. |
| `seat` | `seatNodes()` chairs | `id` = table id, `size` = seat index | sets `seatAngles` (above) |
| `callout` | `renderCallouts()` name labels | `id` = table id, `sub` = `"table"` or `"seat"`, `size` = seat index | `dropCallout()`: a chair name goes to the chair it is dropped on, or to the first chair of that table without a name; the two chairs exchange all of `SEAT_DATA` (`seatMarks`, `seatNotes`, `seatNames`) via `swapSeatEntry()`. A table name → `moveParty()`: the guests move, and if the target already has guests the two parties swap (with their chair data, `name` and `booked`). |
| `guest` | «Uten bord» items and guest chips in «Bordene» | `id` = guest id | `placeGuest()` on the table or row under the pointer (the only party at its table takes everything along via `moveParty()`); dropped on `#guest-rack` → `unplaceGuest()` |
| `guestgroup` | the heading of an `other:` area group in «Uten bord» (a group booked for another room) | `id` = area key | `placeGroup()`: every unplaced booking of that area to one table |
| `fixture` | `doorButton()` | `id` | `moveFixture()` along its wall (8–88 % on the left wall, 18–82 % on the others) |
| `painting` | `paintingButton()` | `id` | `movePainting()` if moved, then select it. Dormant: never drawn now. |
| `furniture` | `furnitureButton()` | `id` | `moveFurniture()`. Dormant: never drawn now. |

**Click after drag**: a drag ends with a `click` event too. `markDragEnded()` sets `dragJustEnded` until the next tick (`setTimeout(…, 0)`); it is called after a drop-back and after a moved `callout`, `guest` or `guestgroup` drop. The callout and `#res-tables` click handlers check it. Chairs use `seatDragJustEnded` the same way (checked in the `#room` click handler).

**Drag and sharing**: `pushShare()` waits while `drag` is set (it reschedules), and snapshots from other devices are not applied during a drag (`!drag` in the `onSnapshot` handler), so a remote update never yanks a table out from under the pointer. See [[Storage and data]].

## Related

- [[Files and build]]
- [[Storage and data]]
- [[Printing]]
- [[Testing]]
- [[Reservations list]]
- [[Auto seating]]
- [[Chairs and plates]]
- [[Shifts and start screen]]
- [[House map]]
- [[Decisions]]
- [[Change log]]
