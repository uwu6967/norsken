# Norsken

**Bordplanen for Norske Selskab.** Hent dagens bookinger fra ResDiary, få bordene fordelt
og skriv ut – med noen få trykk.

👉 **Åpne Norsken: https://uwu6967.github.io/norsken/**

---

## Hver dag – tre trykk

Første gang på denne PC-en? Gjør **Første gang** lenger ned først.

| | Slik gjør du |
|---|---|
| **1** | I **ResDiary**: trykk **Diary** og så **Print** (sjekk at datoen er riktig). Trykk så **🍽 Til Norsken** på bokmerkelinja – raden øverst i nettleseren, rett under nettadressen. Norsken åpner med dagens bookinger og et vindu med tre steg. |
| **2** | I det vinduet: trykk **Lunsj**, **Middag** eller **Arrangement**. Er det arrangement i dag, ta valget merket **Anbefalt i dag**. Bordene blir lagt ut og gjestene får bord. (Lukket vinduet? Trykk **☀ I dag** øverst.) |
| **3** | Trykk **🖨 Skriv ut**. Utskriftsvinduet kommer opp av seg selv – trykk **Skriv ut** der også. Du får kartet til venstre og gjestelista til høyre, med en rute å krysse av når de kommer. |

Ferdig! Resten er bare hvis du vil endre noe.

**Hvis det stopper opp**
- **Ingen 🍽 Til Norsken-knapp** (ny PC eller annen nettleser): gjør **Første gang** rett under. Det tar ett minutt.
- **«Fant ingen bookinger her»**: du er ikke på utskriftssiden. Trykk **Diary** og **Print** i ResDiary, og trykk knappen igjen.
- **Meldingen nederst sier «… uten bord»**: dra de navnene fra **Uten bord** (fanen **Reservasjoner**) til et ledig bord før du skriver ut.

---

## Første gang (én gang per PC)

1. **Lagre Norsken som bokmerke:** åpne https://uwu6967.github.io/norsken/ og trykk `Ctrl` + `D`
   (eller stjernen ☆ helt til høyre der nettadressen står). Trykk **Ferdig**.
2. **Få ResDiary-knappen:** åpne https://uwu6967.github.io/norsken/bokmerke.html.
   Ser du ikke bokmerkelinja (raden rett under nettadressen)? Trykk `Ctrl` + `Shift` + `B`.
   Hold musa nede på den grønne knappen **🍽 Til Norsken**, dra den opp til bokmerkelinja og slipp. Ikke klikk – dra.

Det er alt. Ingenting å installere.

---

## Nyttig å vite

| Jeg vil … | Gjør slik |
|---|---|
| flytte gjester til et annet bord | Dra navnet til det nye bordet. |
| ta gjester av bordet | Trykk **✕** ved navnet, eller dra navnet tilbake til **Uten bord**. |
| krysse av at gjestene har kommet | Trykk **✓** ved navnet under fanen **Reservasjoner** til venstre. Bordet får en grønn ring når alle ved bordet er kommet. |
| se allergier | Ord som *glutenfri*, *nøtter* og *gravid* i ResDiary-kommentaren blir fargekoder (G, N, Gr …). |
| sette en hel gruppe sammen | Dra overskriften (f.eks. **Onsdagsklubben**) fra «Uten bord» til et bord. |
| skrive ut uten stoler | Trykk **med stoler** ved siden av **Skriv ut**, så det står **uten stoler**. |
| se hele huset | Trykk knappen **🏠 Norsken** øverst: rommene får farge etter hvor mange som er booket der. |
| gi gjestene aperitiffplass i salongene | Slå på **🥂 Aperitiff før pling** på «☀ I dag» før du trykker Middag/Arrangement. Største selskap får plass først. Flytt et selskap i 🥂-lista under **Reservasjoner**. |
| skrive ut aperitiff-arket | Trykk **🖨 Aperitiff-ark** (i 🥂-lista, eller på «☀ I dag»). Salongene og gjestelista kommer på ett A4-ark, med navnene ved bordene. |
| si til gjestene hvor de sitter ved pling | Trykk **🔔 Hvem sitter hvor** under **Reservasjoner**: søk på navnet, så står bordet der. |
| endre bordene i en salong | **Innover ▾** → velg rommet → **✏️ Flytt bord**. Toddy, Bar, Arneberg, Blå værelset og Ateneum er tegnet etter aperitiff-arket fra før. |
| hente bord fra lageret, legge til bord, bordplater | Trykk **🧰 Verktøy**. (Bord på kartet kan du dra rett dit du vil.) |
| angre | Trykk **↶ Angre** i meldingen nederst – rett etterpå, før den forsvinner. |
| begynne på en ny dag | Trykk **🍽 Til Norsken** i ResDiary igjen – den nye lista erstatter den gamle. |

---

## 🔒 Gjestene blir på PC-en

- Knappen i ResDiary leser bare **tid, antall, etternavn, kommentar, område og bordnummer** – aldri telefon eller e-post.
- Lista sendes **ikke** til noen server, ikke til GitHub og ikke til noen andre. Den lagres bare i nettleseren på den PC-en.
- Ingen gjestenavn, telefonnumre, e-poster eller bilder legges ut her på GitHub.

---

<details>
<summary><b>Som utvidelse i Chrome / Edge (valgfritt – de fleste trenger ikke dette)</b></summary>

Last ned **Norsken.zip** fra [siste versjon](https://github.com/uwu6967/norsken/releases/latest).

1. Høyreklikk Norsken.zip → **Pakk ut alle**, og legg mappa et fast sted, f.eks. `Dokumenter\Norsken`.
2. Skriv `chrome://extensions` i adressefeltet (Edge: `edge://extensions`).
3. Slå på **Utviklermodus**.
4. Trykk **Last inn upakket** og velg mappa.
5. Fest Norsken-ikonet (puslespillbrikken øverst til høyre) og klikk det for å åpne bordplanen.

Ny versjon: pakk ut den nye zip-fila i den samme mappa og trykk ↻ på Norsken i `chrome://extensions`.
Ikke trykk **Fjern** – da slettes planene. Merk: **🍽 Til Norsken** åpner alltid nettsiden, ikke utvidelsen.

Uten installering: pakk ut zip-fila og dobbeltklikk **`index.html`**.
</details>

<details>
<summary><b>For den som endrer koden</b></summary>

- Kildekoden ligger i `src/` (`index.html`, `app.js`, `styles.css`, `print.html`) og ResDiary-knappene i `resdiary/`.
- Etter endringer: `python3 tools/build.py` – den lager `index.html`, `print.html`, `bokmerke.html`, `extension/`, `LES-MEG.txt` og bokmerkekodene i `resdiary/README.md`.
- Bokmerkekodene som tekst står i [resdiary/README.md](resdiary/README.md).
- Regler: se [CONTRIBUTING.md](CONTRIBUTING.md). Notatboka for prosjektet ligger i [`notater/`](notater/Start%20here.md) (kan åpnes i Obsidian).
</details>

---

## Rettigheter

© 2026 Daniel Hj. Alle rettigheter forbeholdt. Norsken er ikke åpen kildekode: du kan se koden,
men ikke kopiere, endre, dele eller bruke den andre steder uten skriftlig lov. Se [LICENSE](LICENSE).
