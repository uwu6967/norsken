# ResDiary-bokmerker

To bokmerker for utskriftssiden i ResDiary (Diary → Print). Lag dem slik:
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

> Begge går bare på siden i nettleseren din. Ingenting sendes noe sted.
