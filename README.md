# Norsken

**Bordplanen for Norske Selskab.** Hent dagens bookinger fra ResDiary, få bordene fordelt
og skriv ut – med noen få trykk.

👉 **Åpne Norsken: https://uwu6967.github.io/norsken/**

---

## Hver dag – tre trykk

| | Slik gjør du |
|---|---|
| **1** | I **ResDiary**: gå til **Diary → Print**, og trykk **🍽 Til Norsken** på bokmerkelinja. Norsken åpner med dagens bookinger. |
| **2** | Trykk **Lunsj**, **Middag** eller **Arrangement** (på arrangementsdager også **Middag + Arrangement**). Bordene blir lagt ut og gjestene får bord. |
| **3** | Trykk **🖨 Skriv ut**. Du får kartet til venstre og gjestelista til høyre, med en rute å krysse av når de kommer. |

Ferdig! Resten er bare hvis du vil endre noe.

---

## Første gang (én gang per PC)

1. **Lagre Norsken som bokmerke:** åpne https://uwu6967.github.io/norsken/ og trykk ☆ i adressefeltet.
2. **Få ResDiary-knappen:** åpne https://uwu6967.github.io/norsken/bokmerke.html og dra den grønne
   knappen **🍽 Til Norsken** opp til bokmerkelinja. (Ser du ikke bokmerkelinja? Trykk `Ctrl` + `Shift` + `B`.)

Det er alt. Ingenting å installere.

---

## Nyttig å vite

| Jeg vil … | Gjør slik |
|---|---|
| flytte gjester til et annet bord | Dra navnet til det nye bordet. |
| ta gjester av bordet | Dra navnet tilbake til lista til venstre. |
| krysse av at gjestene har kommet | Trykk **✓** ved navnet under **Reservasjoner**. Bordet blir grønt. |
| se allergier | Ord som *glutenfri*, *nøtter* og *gravid* i ResDiary-kommentaren blir fargekoder (G, N, Gr …). |
| sette en hel gruppe sammen | Dra overskriften (f.eks. **Onsdagsklubben**) fra «Uten bord» til et bord. |
| skrive ut uten stoler | Trykk **🪑** ved siden av **Skriv ut**. |
| se hele huset | Trykk **🏠 Norsken**: rommene får farge etter hvor mange som er booket der. |
| flytte bord, legge til bord, bordplater | Trykk **🧰 Verktøy**. |
| angre | Trykk **↶ Angre** i meldingen nederst. |
| begynne på en ny dag | Trykk **☀ I dag**. |

---

## 🔒 Gjestene blir på PC-en

- Knappen i ResDiary leser bare **tid, antall, etternavn, kommentar og område** – aldri telefon eller e-post.
- Lista sendes **ikke** til noen server, ikke til GitHub og ikke til noen andre. Den lagres bare i nettleseren på den PC-en.
- Ingen gjestenavn, telefonnumre, e-poster eller bilder legges i denne repoen.

---

<details>
<summary><b>Som utvidelse i Chrome / Edge (valgfritt)</b></summary>

Last ned **Norsken.zip** fra [siste versjon](https://github.com/uwu6967/norsken/releases/latest).

1. Høyreklikk Norsken.zip → **Pakk ut alle**, og legg mappa et fast sted, f.eks. `Dokumenter\Norsken`.
2. Skriv `chrome://extensions` i adressefeltet (Edge: `edge://extensions`).
3. Slå på **Utviklermodus**.
4. Trykk **Last inn upakket** og velg mappa.
5. Fest Norsken-ikonet (puslespillbrikken øverst til høyre) og klikk det for å åpne bordplanen.

Ny versjon: pakk ut den nye zip-fila i den samme mappa og trykk ↻ på Norsken i `chrome://extensions`.
Ikke trykk **Fjern** – da slettes planene.

Uten installering: pakk ut zip-fila og dobbeltklikk **`index.html`**.
</details>

<details>
<summary><b>For den som endrer koden</b></summary>

- Kildekoden ligger i `src/` (`index.html`, `app.js`, `styles.css`, `print.html`) og ResDiary-knappene i `resdiary/`.
- Etter endringer: `python3 tools/build.py` – den lager `index.html`, `print.html`, `bokmerke.html`, `extension/` og `LES-MEG.txt`.
- Bokmerkekodene som tekst står i [resdiary/README.md](resdiary/README.md).
- Regler: se [CONTRIBUTING.md](CONTRIBUTING.md).
</details>

---

## Rettigheter

© 2026 Daniel Hj. Alle rettigheter forbeholdt. Norsken er ikke åpen kildekode: du kan se koden,
men ikke kopiere, endre, dele eller bruke den andre steder uten skriftlig lov. Se [LICENSE](LICENSE).
