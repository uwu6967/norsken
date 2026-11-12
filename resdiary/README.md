# ResDiary-bokmerker

Tre bokmerker for utskriftssiden i ResDiary (Diary → Print). Lag dem slik:
høyreklikk bokmerkelinja → **Legg til side** → gi den et navn → lim inn koden under som **URL**.

## Rydd liste

Fjerner tomme rader og kolonnene **Telefon** og **E-postadresse**.
Vil du fjerne flere kolonner, legg overskriftsordet til i `DROP`-lista
(f.eks. `"kundekoder"`, `"forhånds"`).

```
javascript:(function(){var DROP=["telefon","e-post","epost"];document.querySelectorAll("tr.blank").forEach(function(r){r.remove();});document.querySelectorAll("tr").forEach(function(r){var c=Array.from(r.querySelectorAll("td"));if(c.length&&c.every(function(d){return !d.textContent.trim();}))r.remove();});document.querySelectorAll("table").forEach(function(t){var rows=Array.from(t.rows),head=rows.find(function(r){return Array.from(r.cells).some(function(c){return /telefon/i.test(c.textContent);});});if(!head)return;var n=head.cells.length,kill=[];Array.from(head.cells).forEach(function(c,i){var s=c.textContent.toLowerCase().replace(/\s+/g,"");if(DROP.some(function(w){return s.indexOf(w.replace(/\s+/g,""))>=0;}))kill.push(i);});kill.sort(function(a,b){return b-a;});rows.forEach(function(r){if(r.cells.length===n)kill.forEach(function(i){r.cells[i].remove();});});});})();
```

Lesbar kode: [rydd-liste.js](rydd-liste.js)

## Til bordplan

Kopierer bookingene som **tid + antall**, uten navn (NDA), til utklippstavla.
Lim dem inn i bordplanen under **Reservasjoner → bord** og trykk **Fordel bord**.

```
javascript:(function(){var out=[];document.querySelectorAll("table").forEach(function(t){var rows=Array.from(t.rows),head=rows.find(function(r){return Array.from(r.cells).some(function(c){return /gjester/i.test(c.textContent);});});if(!head)return;var idx=function(re){return Array.from(head.cells).findIndex(function(c){return re.test(c.textContent);});};var ti=idx(/^\s*tid/i),gi=idx(/gjester/i),bi=idx(/^\s*bord\s*$/i);rows.forEach(function(r){if(r===head||r.cells.length!==head.cells.length)return;var tm=r.cells[ti].textContent.replace(/\s+/g,"");if(!/^\d{1,2}[:.]\d{2}$/.test(tm))return;var g=parseInt(r.cells[gi].textContent,10)||2;out.push(tm+" "+g);});});var txt=out.join("\n");if(!txt){alert("Fant ingen bookinger her.");return;}var done=function(){alert(out.length+" bookinger kopiert (bare tid + antall, ingen navn). Lim inn i Bordplan → Reservasjoner.");};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done,function(){prompt("Kopier:",txt);});}else{prompt("Kopier:",txt);}})();
```

Lesbar kode: [til-bordplan.js](til-bordplan.js)

## Last ned liste

Lagrer bookinglista som en **CSV-fil på PC-en** (mappen Nedlastinger), f.eks.
`resdiary-2026-11-12_1730.csv`. Med tid, gjester, navn, bord og kommentarer.
**Telefon og e-post tas ikke med.** Åpnes i Excel.

Filen har gjestenavn, så den skal **bare ligge på PC-en**: aldri i repoen, i
bordplan-artefakten eller i en chat (NDA). `.gitignore` stopper `*.csv`.

```
javascript:(function(){var DROP=["telefon","mobil","e-post","epost","email"];var clean=function(s){return s.replace(/\s+/g," ").trim();};var esc=function(s){return /[";\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};var lines=[],count=0,lastHead="";document.querySelectorAll("table").forEach(function(t){var rows=Array.from(t.rows),head=rows.find(function(r){return Array.from(r.cells).some(function(c){return /gjester/i.test(c.textContent);});});if(!head)return;var keep=[];Array.from(head.cells).forEach(function(c,i){var s=c.textContent.toLowerCase().replace(/\s+/g,"");if(!DROP.some(function(w){return s.indexOf(w)>=0;}))keep.push(i);});var ti=Array.from(head.cells).findIndex(function(c){return /^\s*tid/i.test(c.textContent);});var h=keep.map(function(i){return esc(clean(head.cells[i].textContent));}).join(";");if(h!==lastHead){lines.push(h);lastHead=h;}rows.forEach(function(r){if(r===head||r.cells.length!==head.cells.length)return;if(ti>=0&&!/^\d{1,2}[:.]\d{2}$/.test(r.cells[ti].textContent.replace(/\s+/g,"")))return;var v=keep.map(function(i){return esc(clean(r.cells[i].textContent));});if(!v.join("").trim())return;lines.push(v.join(";"));count++;});});if(!count){alert("Fant ingen bookinger her. Åpne utskriftssiden i ResDiary (Diary → Print) først.");return;}var d=new Date(),p=function(n){return String(n).padStart(2,"0");};var name="resdiary-"+d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"_"+p(d.getHours())+p(d.getMinutes())+".csv";var blob=new Blob(["﻿"+lines.join("\r\n")+"\r\n"],{type:"text/csv;charset=utf-8"});var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);alert(count+" bookinger lagret som "+name+" i Nedlastinger. Filen er bare på denne PC-en.");})();
```

Lesbar kode: [last-ned-liste.js](last-ned-liste.js)

> Alle tre går bare på siden i nettleseren din. Ingenting sendes noe sted.
