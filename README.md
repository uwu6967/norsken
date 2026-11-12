# Norsken

Bordplan for Spisestua på Norske Selskab: legg ut bordene, se klaring for servitørene,
regn ut hvilke bordplater langbordet trenger, merk allergier per plass og skriv ut på A4.

**Live:** https://claude.ai/artifact/RBdn3W3FKaBSeTCLVNaimr (felles plan, lagres for alle med lenka)

`index.html` her er hele appen i én fil. Åpner du den rett fra disk eller på GitHub Pages,
lagres planen bare i den nettleseren (ikke den felles planen).

## Last ned og bruk (ingen installering)

1. Last ned **Norsken.zip** fra [siste release](https://github.com/uwu6967/norsken/releases/latest) og pakk den ut.
   (Hver oppdatering blir en ny release, med liste over hva som er endret.)
2. Dobbeltklikk **`index.html`**: bordplanen åpner i nettleseren. Den lagres i den nettleseren.
3. ResDiary-bokmerkene: dobbeltklikk **`bokmerker.html`** (ligger i zip-en og som egen fil i releasen) og dra de grønne knappene opp på
   bokmerkelinja.

Det er alt. Resten av filene trenger du ikke røre.

## Det den gjør

- **Rommet** i ekte mål (7,00 × 13,60 m), dører, vinduer, sidebordet, rutenett per meter.
- **Bord:** lite (Ø130), stort (Ø150), ovalt (16), langbord (to halvdeler som trekkes fra hverandre).
- **Vanlig oppsett** og **Lunsj-oppsett** med ett trykk.
- **Langbord + plater:** skriv antall personer, så velger den de korteste platene dere faktisk har
  (liten 37 ×2, medium 49,5 ×4, stor 55,5 ×2, ekstra stor 64 ×1) og trekker bordet ut.
- **Stoler** vender mot bordet, kan snus (⟲ ⟳), og blir røde hvis de kolliderer.
- **Klaring:** advarsel når det er under 90 cm mellom stolryggene.
- **Merking per plass:** gluten, laktose, nøtter, skalldyr, diabetes, gravid, vegetar, annet,
  gult **Ønske**, og **✎ Notat** med fritekst. Totalen vises og kommer med på utskriften.
- **Reservasjoner → bord:** én booking per linje (`12:30 2`, `B:7` låser bord). Fordeler etter
  husets vane: sidebordene 3, 6, 5, 8, 10, 9, 11, 7, 2, 4 først, aldri midten, over 5 personer → 16.
- **Dagens liste:** åpne lista fra bokmerket «Last ned liste» og dra hvert navn til et bord selv.
  Navnene blir bare i nettleseren på den PC-en (ikke i den felles planen), og kommer med på utskriften.
- **Skriv ut / PDF** på A4.

## Mål som fortsatt er anslag

Merket «ANSLAG» i appen til noen måler dem (endres under **Mål**):

- én langbord-halvdel (bredde × lengde) — nå 90 × 105
- ovalt bord 16 — nå 100 × 180
- plass per person langs langbordet — nå 60 cm
- sidebordet (lengde), de gamle små stolene

## Mapper

| | |
|---|---|
| `index.html` | **ferdig app** i én fil, bare åpne den |
| `print.html` | utskriftssiden (åpnes fra «Skriv ut / PDF») |
| `bokmerker.html` | **ResDiary-bokmerkene**, dra dem til bokmerkelinja |
| `src/` | kildekoden: `index.html`, `app.js`, `styles.css`, `print.html` |
| `tools/build.py` | bygger `index.html` fra `src/` |
| `resdiary/` | bokmerkene for ResDiary-utskriften |

Bare for den som endrer koden (du trenger ikke dette): etter endringer i `src/` eller
`resdiary/` lager denne `index.html` og `bokmerker.html` på nytt:

```
python3 tools/build.py
```

## Personvern

Ingen gjestenavn, telefonnumre eller e-poster i denne repoen. Ikke legg inn bilder av
bookinglister eller bordplaner med navn.
