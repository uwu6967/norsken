# Norsken — Spisestua

A table-layout planner for the Norsken dining room (spisestua). Drag tables,
plates, doors and paintings around a to-scale floor plan, mark seats for
allergies and requests, assign reservations to tables, and print an A4 plan.

Live version: https://claude.ai/artifact/RBdn3W3FKaBSeTCLVNaimr

## Files

| File | What it is |
| --- | --- |
| `index.html` | The full app as published: CSS, JS and the print page are all inlined. Open this one. |
| `print.html` | Standalone A4 print / PDF view of the current layout. |
| `app.js` | App script as a separate file. |
| `styles.css` | App stylesheet as a separate file. |

## Running it

Open `index.html` in a browser. Outside claude.ai, the layout is saved in the
browser's `localStorage`. Inside the published artifact, it syncs a shared plan
through the artifact's database (`window.claude.use("db")`).
