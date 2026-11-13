# Norsken

Bordplan for Spisestua på Norske Selskab: legg ut bordene, se klaring for servitørene,
regn ut hvilke bordplater langbordet trenger, merk allergier per plass og skriv ut på A4.

**Live:** https://claude.ai/artifact/RBdn3W3FKaBSeTCLVNaimr (felles plan, lagres for alle med lenka)

`index.html` her er hele appen i én fil. Åpner du den rett fra disk eller på GitHub Pages,
lagres planen bare i den nettleseren (ikke den felles planen).

## Norsken som utvidelse i Chrome / Edge (anbefalt)

Bordplanen åpner som en egen side når du klikker Norsken-ikonet, og «Skriv ut / PDF» virker.
Planer og gjestenavn blir bare i nettleseren på den PC-en.

1. Last ned **Norsken-utvidelse.zip** fra [siste release](https://github.com/uwu6967/norsken/releases/latest) og pakk den ut.
2. Skriv `chrome://extensions` i adressefeltet (Edge: `edge://extensions`).
3. Slå på **Utviklermodus** (Developer mode).
4. Trykk **Last inn upakket** (Load unpacked) og velg mappa `Norsken-utvidelse`.
5. Klikk puslespillbrikken øverst til høyre og fest Norsken (nåla). Klikk Norsken-ikonet for å åpne bordplanen.

Ny versjon: pakk ut den nye zip-fila over den gamle mappa og trykk ↻ på Norsken i `chrome://extensions`. Planene dine blir liggende.

## Last ned og bruk (ingen installering)

1. Last ned **Norsken.zip** fra [siste release](https://github.com/uwu6967/norsken/releases/latest) og pakk den ut.
   (Hver oppdatering blir en ny release, med liste over hva som er endret.)
2. Dobbeltklikk **`index.html`**: bordplanen åpner i nettleseren. Den lagres i den nettleseren.
3. ResDiary-bokmerkene: kopier kodene under (står også i `LES-MEG.txt` i zip-en).

Det er alt. Resten av filene trenger du ikke røre.

## ResDiary-bokmerker

<!-- BOKMERKER -->
Lag et nytt bokmerke (høyreklikk bokmerkelinja → Legg til side), gi det navnet, og lim inn koden som nettadresse. Bruk dem på ResDiary → Diary → Print.

### Rydd liste

Fjerner tomme rader og kolonnene Telefon, E-post, Booket den, Kundekoder og Forhåndsbestilling.

```
javascript:(function(){var DROP=["telefon","e-post","epost","booket","kundekod","forhånds","forhands"];document.querySelectorAll("tr.blank").forEach(function(r){r.remove();});document.querySelectorAll("tr").forEach(function(r){var c=Array.from(r.querySelectorAll("td"));if(c.length&&c.every(function(d){return !d.textContent.trim();}))r.remove();});document.querySelectorAll("table").forEach(function(t){var rows=Array.from(t.rows),head=rows.find(function(r){return Array.from(r.cells).some(function(c){return /telefon/i.test(c.textContent);});});if(!head)return;var n=head.cells.length,kill=[];Array.from(head.cells).forEach(function(c,i){var s=c.textContent.toLowerCase().replace(/\s+/g,"");if(DROP.some(function(w){return s.indexOf(w.replace(/\s+/g,""))>=0;}))kill.push(i);});kill.sort(function(a,b){return b-a;});rows.forEach(function(r){if(r.cells.length===n)kill.forEach(function(i){r.cells[i].remove();});});});})();
```

### Til bordplan

Kopierer tid, antall og etternavn. Lim inn i bordplanen under Reservasjoner → bord.

```
javascript:(function(){var out=[];var last=function(s){s=s.replace(/\s+/g," ").trim();if(!s)return "";if(s.indexOf(",")>0)return s.split(",")[0].trim();var w=s.split(" ");return w[w.length-1];};document.querySelectorAll("table").forEach(function(t){var rows=Array.from(t.rows),head=rows.find(function(r){return Array.from(r.cells).some(function(c){return /gjester/i.test(c.textContent);});});if(!head)return;var idx=function(re){return Array.from(head.cells).findIndex(function(c){return re.test(c.textContent);});};var ti=idx(/^\s*tid/i),gi=idx(/gjester/i),ni=idx(/navn|kunde(?!kod)|^\s*gjest\s*$/i);rows.forEach(function(r){if(r===head||r.cells.length!==head.cells.length)return;var tm=r.cells[ti].textContent.replace(/\s+/g,"");if(!/^\d{1,2}[:.]\d{2}$/.test(tm))return;if(ni>=0&&!r.cells[ni].textContent.trim())return;var g=parseInt(r.cells[gi].textContent,10)||2;var n=ni>=0?last(r.cells[ni].textContent).replace(/\d+/g,"").trim():"";out.push((tm+" "+g+" "+n).trim());});});var txt=out.join("\n");if(!txt){alert("Fant ingen bookinger her.");return;}var done=function(){alert(out.length+" bookinger kopiert (tid, antall, etternavn). Lim inn i Bordplan → Reservasjoner.");};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done,function(){prompt("Kopier:",txt);});}else{prompt("Kopier:",txt);}})();
```

### Last ned liste

Lagrer lista (tid, gjester, navn, bord, kommentar) som en fil i Nedlastinger. Åpne den i bordplanen under «Dagens liste». Uten telefon, e-post, booket den, kundekoder og forhåndsbestilling. Fila blir bare på PC-en.

```
javascript:(function(){var DROP=["telefon","mobil","e-post","epost","email","booket","kundekod","forhånds","forhands"];var clean=function(s){return s.replace(/\s+/g," ").trim();};var esc=function(s){return /[";\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};var lines=[],count=0,lastHead="";document.querySelectorAll("table").forEach(function(t){var rows=Array.from(t.rows),head=rows.find(function(r){return Array.from(r.cells).some(function(c){return /gjester/i.test(c.textContent);});});if(!head)return;var keep=[];Array.from(head.cells).forEach(function(c,i){var s=c.textContent.toLowerCase().replace(/\s+/g,"");if(!DROP.some(function(w){return s.indexOf(w)>=0;}))keep.push(i);});var ti=Array.from(head.cells).findIndex(function(c){return /^\s*tid/i.test(c.textContent);});var ni=Array.from(head.cells).findIndex(function(c){return /navn|kunde(?!kod)|^\s*gjest\s*$/i.test(c.textContent);});var h=keep.map(function(i){return esc(clean(head.cells[i].textContent));}).join(";");if(h!==lastHead){lines.push(h);lastHead=h;}rows.forEach(function(r){if(r===head||r.cells.length!==head.cells.length)return;if(ti>=0&&!/^\d{1,2}[:.]\d{2}$/.test(r.cells[ti].textContent.replace(/\s+/g,"")))return;if(ni>=0&&!r.cells[ni].textContent.trim())return;var v=keep.map(function(i){return esc(clean(r.cells[i].textContent));});if(!v.join("").trim())return;lines.push(v.join(";"));count++;});});if(!count){alert("Fant ingen bookinger her. Åpne utskriftssiden i ResDiary (Diary → Print) først.");return;}var d=new Date(),p=function(n){return String(n).padStart(2,"0");};var name="resdiary-"+d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"_"+p(d.getHours())+p(d.getMinutes())+".csv";var blob=new Blob(["﻿"+lines.join("\r\n")+"\r\n"],{type:"text/csv;charset=utf-8"});var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);alert(count+" bookinger lagret som "+name+" i Nedlastinger. Filen er bare på denne PC-en.");})();
```

<!-- /BOKMERKER -->

## Det den gjør

- **To rom:** Spisestua og Domino (rommet ved siden av). Domino er siste utvei: «Fordel bord» fyller Spisestua først og sender bare det som ikke får plass til Domino. Bytt rom med knappene øverst.
- **Rutenett** per meter.
- **Bord:** lite (Ø130), stort (Ø150), ovalt (16), metallbord (firkant, 4 personer, uten plater), langbord (to halvdeler som trekkes fra hverandre).
- **Vanlig oppsett** og **Lunsj-oppsett** med ett trykk.
- **Langbord + plater:** skriv antall personer, så velger den de korteste platene dere faktisk har
  (liten 37 ×2, medium 49,5 ×4, stor 55,5 ×2, ekstra stor 64 ×1) og trekker bordet ut.
- **Stoler** vender mot bordet, kan snus (⟲ ⟳), og blir røde hvis de kolliderer.
- **Klaring:** advarsel når det er under 90 cm mellom stolryggene.
- **Merking per plass:** gluten, laktose, nøtter, skalldyr, diabetes, gravid, vegetar, annet,
  veganer, pescetarianer, gult **Ønske**, og **✎ Notat** med fritekst. Totalen vises og kommer med på utskriften.
- **Reservasjoner → bord:** én booking per linje (`12:30 2`, `B:7` låser bord). Fordeler etter
  husets vane: sidebordene 3, 6, 5, 8, 10, 9, 11, 7, 2, 4 først, aldri midten, over 5 personer → 16.
- **Dagens liste:** åpne lista fra bokmerket «Last ned liste» og dra hvert navn til et bord selv.
  Navnene blir bare i nettleseren på den PC-en (ikke i den felles planen), og kommer med på utskriften.
- **Dekk om (↻):** når Spisestua er full, får sene bookinger et bord igjen etter at de første gjestene har sittet en stund (60 min, kan endres). Eller velg «Bruk Domino» i innstillingene.
- **Navn ved siden av kartet:** på stor skjerm står navnene i margen med en strek til bordet – eller til stolen, med «Navn på stol».
- **Ingen stoler** før dere legger til personer (+ / −, «Fordel bord» eller Dagens liste).
- **Skriv ut / PDF** på A4.
- **⚙ Innstillinger:** alle innstillinger på ett sted (språk, rutenett, stoler, malerier, prioritet for bordfordeling, mål, tomt rom).

## Mål som fortsatt er anslag

Merket «ANSLAG» i appen til noen måler dem (endres under **Mål**):

- én langbord-halvdel (bredde × lengde) — nå 90 × 105
- ovalt bord 16 — nå 100 × 180
- plass per person langs langbordet — nå 60 cm
- sidebordet (lengde), de gamle små stolene

## Mapper

| | |
|---|---|
| `extension/` | **Norsken-utvidelsen** (Chrome/Edge), lages av `tools/build.py` |
| `index.html` | **ferdig app** i én fil, bare åpne den |
| `print.html` | utskriftssiden (åpnes fra «Skriv ut / PDF») |
| `LES-MEG.txt` | kort bruksanvisning + bokmerkekodene |
| `src/` | kildekoden: `index.html`, `app.js`, `styles.css`, `print.html` |
| `tools/build.py` | bygger `index.html` fra `src/` |
| `resdiary/` | bokmerkene for ResDiary-utskriften |

Bare for den som endrer koden (du trenger ikke dette): etter endringer i `src/` eller
`resdiary/` lager denne `index.html`, `print.html`, `LES-MEG.txt` og bokmerkekodene på nytt:

```
python3 tools/build.py
```

## Personvern

Ingen gjestenavn, telefonnumre eller e-poster i denne repoen. Ikke legg inn bilder av
bookinglister eller bordplaner med navn.
