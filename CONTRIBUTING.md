# Regler for endringer

- Ferdige endringer går rett til `main`. Ingen andre grener.
- Hver push til `main` lager en ny release (`.github/workflows/release.yml`) med
  `Norsken.zip` (= mappa `extension/`) og `LES-MEG.txt`. Release-notatene er commit-meldingene,
  så skriv dem enkelt: hva som er endret, og en kort liste.
- Forfatter og committer på hver commit: `uwu6967 <22033341+uwu6967@users.noreply.github.com>`.
- Taushetsplikt: aldri gjestenavn, telefonnumre, e-poster eller bilder i repoen.
- Endrer du noe i `src/` eller `resdiary/`, kjør `python3 tools/build.py` og ta med alt den lager
  (`index.html`, `print.html`, `extension/`, `LES-MEG.txt`, bokmerkekodene i README-ene).
  Den som bruker appen skal aldri trenge å bygge noe.
- `extension/` er Chrome/Edge-utvidelsen (Manifest V3: ingen skript inne i HTML-en, derfor egne
  `app.js` og `print.js`). Zip-fila har filene rett i roten og virker også ved å dobbeltklikke `index.html`.
