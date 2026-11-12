/* Norsken – «Rydd liste»: fjerner tomme rader + Telefon/E-post-kolonnene på ResDiary-utskriften. Bokmerke-versjon: se README.md */
(function(){
var DROP=["telefon","e-post","epost","booket","kundekod","forhånds","forhands"];
document.querySelectorAll("tr.blank").forEach(function(r){r.remove();});
document.querySelectorAll("tr").forEach(function(r){var c=Array.from(r.querySelectorAll("td"));if(c.length&&c.every(function(d){return !d.textContent.trim();}))r.remove();});
document.querySelectorAll("table").forEach(function(t){
var rows=Array.from(t.rows),head=rows.find(function(r){return Array.from(r.cells).some(function(c){return /telefon/i.test(c.textContent);});});
if(!head)return;
var n=head.cells.length,kill=[];
Array.from(head.cells).forEach(function(c,i){var s=c.textContent.toLowerCase().replace(/\s+/g,"");if(DROP.some(function(w){return s.indexOf(w.replace(/\s+/g,""))>=0;}))kill.push(i);});
kill.sort(function(a,b){return b-a;});
rows.forEach(function(r){if(r.cells.length===n)kill.forEach(function(i){r.cells[i].remove();});});
});
})();
