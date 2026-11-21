---
title: Render loop
tags: [norsken, architecture, rendering]
updated: 2026-11-21
---
# Render loop

`src/app.js` has no framework and no virtual DOM. A single `render()` function redraws the whole screen from `state` and `guests` every time something changes: each part throws away its old DOM (`innerHTML = ""` or a new template string) and builds it again. Pointer dragging goes through one global `drag` object and three window-level handlers (`onMove`, `onUp`, `onCancel`). This page covers the order `render()` works in, the few places that redraw only part of the screen, how start-up runs, the drag system and its drag kinds, and the start-up TDZ trap: a `const`/`let` used during the first render must be declared above that render call. That trap has broken the page twice.

## The rule: mutate, save, render

Nearly every event handler does the same three things:

1. change `state` (the room's plan) and/or `guests` (the day's bookings);
2. `saveGuests()` if `guests` changed, then `save()` (it also bakes print fields and frees chairs; see [[Storage and data]]);
3. `render()`.

Do not patch the DOM by hand in a handler unless it is one of the partial redraws below. The next `render()` would overwrite your change anyway.

## render(): what runs, in order

```js
function render() {
  try {
    renderShell(); renderChrome(); renderMeasurePanel(); renderSeatPalette();
    renderRoom(); renderTray(); renderList();
    /* hide #measure-list unless it has text */
    renderDrawer(); renderPaintingCard(); renderBookings();
    renderGuests(); renderTabs();
    requestAnimationFrame(renderCallouts);
  } catch (error) { console.error(error); }
}
```

| Step | Draws |
|---|---|
| `renderShell()` | Top bar: short date in `#today-date`, the shift buttons in `#shift-switch` (Lunsj · Middag · Arrangement · combos · «Alle», with people counts from `shiftCounts()`), `body.tools-off` from `toolsOn()`, the «🧰 Verktøy» and «☀ I dag» labels. Re-renders the «I dag» dialog with `renderToday()` only if it is open. See [[Shifts and start screen]]. |
| `renderChrome()` | Language-dependent labels everywhere, «🖨 Skriv ut», the «🪑 med stoler / uten stoler» toggle (`state.printNoChairs`), the room tabs, the preset buttons («Lunsj-oppsett» and «Jul-oppsett» are hidden in Domino), «Skjul alle stoler / Vis stolene», `document.title`, the `#hint` text, the Innstillinger toggles, and the sync chip (via `setShareStatus()`) when sharing is in use. |
| `renderMeasurePanel()` | The «Mål» fields in Innstillinger (`FIELDS`); hidden unless `state.showMeasure`. |
| `renderSeatPalette()` | The «Merking» brush row (`SEAT_MARKS` + «Notat» + name brush). |
| `renderRoom()` | The map `#room`, see below. |
| `renderTray()` | The tray: add buttons («+ lite», «+ stort» …), tables in storage, then `renderPlateRack()` (plates left per size, `trayHint`). |
| `renderList()` | The «Målliste» table (kept in the DOM but hidden), `#seat-summary` (marked chairs per table) and `#warnings` (doubled numbers, chair clashes). |
| (inline) | `#measure-list` is hidden unless `#seat-summary` or `#warnings` has text. |
| `renderDrawer()` | The «Bord» panel for `state.selected` (sizes, «Roter», «Til lager», number/name/time fields, langbord group row, chairs, move arrows). Hidden when no floor table is selected. |
| `renderPaintingCard()` | The painting card. Dormant: paintings are no longer drawn. |
| `renderBookings()` | Innstillinger → «Bordfordeling»: overflow buttons, «Minutter før et bord kan dekkes om», the house-rules list. See [[Auto seating]]. |
| `renderGuests()` | Only calls `renderReservations()`: the «Reservasjoner» tab with «Uten bord», «Bordene», search, ticks and «Flytt». See [[Reservations list]]. |
| `renderTabs()` | Which of «Bord» / «Reservasjoner» / «Merking» is shown (`activeTab`). |
| `renderCallouts()` | Names beside the map with lines to their tables or chairs. Runs in the NEXT animation frame, because it measures the laid-out map. |

`renderRoom()` itself, in order: sets the aspect ratio and width (with `oneScreen()` true, the map fills the column height and leaves 340 px for callouts when `calloutMode()` and there are names to show), the doors (`state.fixtures` → `doorButton()`), grid and ruler (if `state.showGrid`), plate strips (`plateInserts()`), chairs (`seatNodes()`, nothing if `state.hideChairs`), table buttons (`tableButton()`), and finally `joinLangbord()`, which draws a closed langbord as one piece.

Not called from `render()`: `renderMine()` (when «★ Oppsett» opens or changes), `refreshUndo()`, `renderHouse()` (the «🏠 Norsken» dialog, see [[House map]]), `renderToday()` (from `openToday()`, or from `renderShell()` while open).

## Partial redraws

| Where | What it redraws | Why |
|---|---|---|
| Typing a name in «Bordene» | `liveRedrawMap()` = `renderRoom()` + `requestAnimationFrame(renderCallouts)` | the text box keeps focus and the caret stays put while the map follows each key |
| Search box `#res-search` | `renderReservations()` only | same reason |
| Clicking a tab | `renderTabs()` only | nothing else changes |
| Window resize | full `render()`, debounced 120 ms (`calloutTimer`) | callouts and map size depend on layout |
| Sync status | `setShareStatus()` writes `#sync-status` directly | async status from the shared store |
| Painting name typing | sets the node's `title`; full `render()` on `change` | dormant feature |

## Layout-dependent rendering

- `oneScreen()` = `matchMedia("(min-width: 1100px) and (min-height: 620px)")`: everything on one screen, lists scroll inside their own boxes.
- `calloutMode()` = `.room-wrap` is at least 620 px wide. Then names go beside the map (callouts) and the table only shows its number; otherwise the name is printed inside the table button.
- `renderRoom()` reads the `.stage` height and padding, so a hidden or zero-size stage gives a tiny map (minimum width 160 px).

## Gotchas when writing render code

- **`render()` swallows errors.** A throw in any step is logged with `console.error` and every LATER step of that pass is skipped. The page looks half-drawn but nothing pops up. Always keep the console open while testing ([[Testing]]).
- **Two-tap buttons.** `armed(button, question)` swaps the button text for «Sikker? Trykk igjen» (or similar) for 4 s and sets `data-armed="1"`. Render code that sets such a button's text must skip it while armed; existing code checks `dataset.armed !== "1"` (`#preset-btn`, `#lunch-btn`, `#jul-btn`, `#book-clear`, `#guest-clear`).
- **Missing elements.** Some ids the code mentions are no longer in `index.html` (`paintings-btn`, `book-text`, `set-room-title`), so those lookups use `?.` or a null check. Many others are used without a check at the top level (for example `#lang-btn`, `#measure-btn`, `#grid-btn`, `#chairs-btn`, `#room`, `#label-row`, `#drawer-measure`, `#measure-fields`, `#add-row`, `#brush-row`). Removing one of those from `src/index.html` throws during start-up and stops the rest of the script.
- **Listeners.** Delegated listeners on fixed containers (`#room`, `#res-tables`, `#label-row`, `#drawer-measure`, `#today`, `document`) are attached once at load. Per-element `pointerdown` listeners are attached to the fresh elements on every render. Two capture-phase click handlers call `stopPropagation()`: `[data-arrived]` (the «✓» tick) on `#res-tables`, and `[data-event]` (the ☆/★ star) on `document`.

## Start-up order

`app.js` is one classic script that runs top to bottom once:

1. Constants: `ROOMS`, `ROOM_KEY`, `ROOM_ID` (read from storage), `STORAGE_KEY`, `DOMINO_ROOM`, `DEFAULT_BOOKING_ORDER`, `LABELS`, `DIMS_VERSION`, `DEFAULT_DIMS`, `SIZES`, `PLATES`, `SIZE_KINDS`, `isPlate`, `i18n`.
2. `let state = loadState();` → `normalizeState()` → `defaultState()`.
3. The early block straight after it: `activeTab`, `GUESTS_KEY`, `guests = loadGuests()`, `guestMsg`, `moveFrom`, `resQuery`, `SHIFT_KEY`, `LUNCH_ENDS`, `EVENT_WORDS`, `SHIFTS`, `TOOLS_KEY`, `SHIFT`, `timeUnlock`, `DIET_WORDS`, `resEdit`, `dragJustEnded`, `markDragEnded()`, `pasteArmed`, `drag`.
4. Helpers, the shared-plan constants (`SHARED_DOC`, `SHARED_KEYS`, `CLIENT_ID`, `share`), seating and plate logic, `SEAT_MARKS`, the drag functions plus the window listeners, the render functions, then the event handlers for the settings, drawer and map.
5. **The first render**, at top level partway down the file, just before the «vanlig oppsett» section:
   ```js
   syncFurniture();
   clampAll();
   relabelRoom();
   save();
   render();
   ```
6. Everything after it: presets (`presetLayout()`), the guest-list functions, the print button, `connectShare()`, the room switch, the settings panel, overflow settings, `checkForUpdate()` plus a 3-hour `setInterval`, «Jul-oppsett», «★ Oppsett», «Angre» (`refreshUndo()`), tabs, «Reservasjoner», the house map, shifts, «☀ I dag», the `message` listener for the ResDiary handoff, and at the very end `importFromHash()` (old `#import=` links) followed by the check that opens «I dag» (`openToday()`) when there is no list or the list is from another day.

Anything that happens later (a click, a snapshot from the shared store, a `postMessage`, a timer, `requestAnimationFrame`) runs after the whole script has finished, when every declaration exists.

## The TDZ trap (read this before adding a top-level const or let)

Function declarations are hoisted: `function foo() {}` can be called from anywhere, even above its line. `const` and `let` are NOT usable until their line has run. Before that they are in the "temporal dead zone", and reading them throws `ReferenceError: Cannot access 'X' before initialization`. The same goes for arrow functions stored in a `const` (such as `isPlate`).

The first `render()` (step 5) runs while the script is still being evaluated. So **every top-level `const`/`let` that any render function, `save()`, or anything they call reads must be declared ABOVE that first `render()` call.** In practice, put it in the early block right after `let state = loadState()`. And if `defaultState()` or `normalizeState()` needs it, it must be above `let state` itself.

### The two times it bit

1. **`DEFAULT_BOOKING_ORDER`** sits near the very top, with the comment "Up here because defaultState() needs it before the rest of the file has run". `defaultState()` runs at `let state = loadState()`, long before the booking code where the constant would naturally live.
2. **`timeUnlock` and `DIET_WORDS`** (commit a0d01fa, 2026-11-20, "Fixes: nobody gets lost …"). Both were declared next to their features, far below the first `render()`. With a saved guest list (bookings with comments, or a booked table selected), the first render reached `dietChips()` → `dietTags()` → `DIET_WORDS` (from `renderReservations()`) or `timeField()` → `timeUnlock` (from `renderDrawer()`) and threw. `render()` caught it, so `renderGuests()`/`renderTabs()` never finished. Symptom in the release notes: "after opening the page again, «Uten bord» could be empty and the list not shown until you clicked something". The click caused a second render, after the script had finished, so it "fixed itself". The fix moved both declarations up into the early block.

A related trap with the same root: `normalizeState()` runs before `state` exists, so it must not call `room()`, `centerCm()`, `orderGroup()` or anything else that reads `state`. Its `try/catch` would turn that `ReferenceError` into `defaultState()` and silently wipe the saved layout (the code comment inside `normalizeState()` warns about this).

### Declared late, but safe today

These top-level constants come after the first `render()`, and are safe only because nothing reads them during the first render: `toastTimer`, `toastUndo`, `RELEASES_API`, `UPDATE_KEY`, `MINE_KEY`, `GUEST_FIELDS`, `UNDO_KEY`, `SEAT_DATA`, `HOUSE_ROOMS`, `houseOpenRoom`, `RESDIARY_ORIGIN`, `lastHandoff`. Watch especially:

- `GUEST_FIELDS` is read by `layoutOnly()`, which `sharedPayload()`/`applyRemote()` call. Those only run after `connectShare()` has connected (async), and `scheduleShare()` returns early while `share.db` is unset. If sharing ever ran synchronously inside `save()`, the first `save()` would throw.
- `UNDO_KEY` is read by `rememberFloor()` → `presetLayout()`. Laying out a preset during start-up would throw.
- `toastTimer` is read by `showToast()`. Showing a toast during the first render would throw.

### How to check

- Reload with a saved guest list (with comments such as «glutenfri») and a booked table selected, keep the console open, and look for "Cannot access … before initialization".
- Check without clicking anything: «Uten bord» and «Bordene» are filled, only one tab pane is visible, callouts are drawn.
- Quick scan: `awk 'NR > <line of the first render()> && /^(const|let) /' src/app.js` lists the late declarations; for each new one, make sure nothing on the render path uses it.

## The drag system

One global `let drag = null` (declared in the early block) holds the drag in progress.

**Start**: `startDrag(event, target, el)` ignores non-primary buttons (`if (event.button) return`), calls `preventDefault()` and `setPointerCapture()`, and sets

```js
drag = { kind, id, size, sub, pointerId, startX, startY, lastX, lastY, moved: false, el };
```

Most elements start a drag on `pointerdown` and again on `mousedown` (ignored if a drag already exists), as a fallback for browsers or test tools that only send mouse events. Chairs, callouts and the guest list items only listen to `pointerdown`.

**Window listeners** (attached once): `pointermove` and `mousemove` → `onMove` (with `{ passive: false }`), `pointerup` and `mouseup` → `onUp`, `pointercancel` → `onCancel`. `samePointer()` ignores events from another pointer.

**`onMove`**: nothing happens until the pointer has moved **6 px** (`dist < 6`). Then:

- kind `seat`: no ghost. The chair itself slides around its table (`seatRing()`, `placeAround()`), and the angle goes into `drag.angle`;
- every other kind: the element is cloned as a `.drag-ghost` (`position: fixed`, `z-index: 80`, no pointer events) that follows the pointer;
- feedback per kind: `table` → `#tray` gets `.drop` while over it; `plate` → `showGapTarget()` outlines the gap (`#gap-target`); `callout` → `showCalloutTarget()`; a drag that can send guests back (`dropBackTable(drag)`) → `#leftcol` gets `.drop-back`; `guest`/`guestgroup` → the visible tab pane scrolls 14 px per move when within 60 px of its top or bottom, and the table under the pointer (`guestDropTable()` or a «Bordene» row via `resRowTable()`) gets `.guest-target`.

**`finishDrag(x, y)`** (from `onUp`, or from `onCancel` with the last position if the drag had moved; an unmoved cancel just calls `cleanupDrag()`), in this order:

1. `seat`: unmoved = do nothing (the click that follows marks the chair or opens the seat editor). Moved = `table.seatAngles[seatIndex] = angle` (rounded to 0.1°), `save()`, `render()`, and `seatDragJustEnded` swallows the click that follows.
2. `cleanupDrag()` (ghosts removed, `#tray.drop` cleared, `drag = null`), `.drop-back` cleared.
3. **Drop-back**: a moved `table`, or a moved `callout` with `sub !== "seat"`, whose table has guests and is dropped on `#leftcol` → `sendBackToList()`: the guests go back to «Uten bord», the table stays where it is.
4. `painting`, `fixture`, `furniture`, `callout`, `guestgroup`, `guest`, `plate` (each described below).
5. `table`: unmoved = `finishMove()` if «Flytt» is waiting (`moveFrom`), else `selectTable()`. Moved = `placeTable()`, the `landed` CSS class for 450 ms (`landedId`), select it, `save()`, `render()`.

**Drag kinds**

| `kind` | Started from | Target fields | On drop |
|---|---|---|---|
| `table` | `tableButton()`: floor and tray tables | `id` | `placeTable()`: onto the map → `zone = "room"`, snapped centre; a langbord part moves its whole group (`moveGroupBy()` + `respaceGroup()`). Anywhere else → back to the tray: `label`, `manual`, `name`, `group` cleared, its plates back on the rack, the rest of the group re-spaced or dissolved. Then `relabelRoom()`. |
| `plate` | chips in `renderPlateRack()` | `size` = plate size | `findGap()` at the drop point. No gap → `trayHint = plateNeedsTwo`; none left → `plateNoneLeft`; otherwise `addPlate()` and the gap's first table is selected. See [[Chairs and plates]]. |
| `seat` | `seatNodes()` chairs | `id` = table id, `size` = seat index | sets `seatAngles` (above) |
| `callout` | `renderCallouts()` name labels | `id` = table id, `sub` = `"table"` or `"seat"`, `size` = seat index | `dropCallout()`: a chair name moves to another chair, or the first free chair of a table, or swaps (`swapSeatEntry()` over `SEAT_DATA` = `seatMarks`, `seatNotes`, `seatNames`); a table name → `moveParty()`, which swaps if the target already has guests. |
| `guest` | «Uten bord» items and guest chips in «Bordene» | `id` = guest id | `placeGuest()` on the table or row under the pointer; dropped on `#guest-rack` → `unplaceGuest()` |
| `guestgroup` | the heading of an `other:` area group in «Uten bord» (e.g. a club meeting in another room) | `id` = area key | `placeGroup()`: every unplaced booking of that area to one table |
| `fixture` | `doorButton()` | `id` | `moveFixture()` along its wall |
| `painting` | `paintingButton()` | `id` | `movePainting()` and select. Dormant: never drawn now. |
| `furniture` | `furnitureButton()` | `id` | `moveFurniture()`. Dormant: never drawn now. |

**Click after drag**: a drag ends with a `click` event too. `markDragEnded()` sets `dragJustEnded` until the next tick (`setTimeout(…, 0)`), and the callout and `#res-tables` click handlers check it. Chairs use `seatDragJustEnded` the same way.

**Drag and sharing**: `pushShare()` waits while `drag` is set (it reschedules), and snapshots from other devices are not applied during a drag, so a remote update never yanks a table out from under the pointer. See [[Storage and data]].

## Related

- [[Files and build]]
- [[Storage and data]]
- [[Testing]]
- [[Reservations list]]
- [[Auto seating]]
- [[Chairs and plates]]
- [[Shifts and start screen]]
- [[House map]]
- [[Decisions]]
- [[Change log]]
