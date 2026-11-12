/* Norsken – «Til bordplan»: kopierer tid + antall (ingen navn) til utklippstavla for Reservasjoner → bord. Bokmerke-versjon: se README.md */
(function(){
var out=[];
document.querySelectorAll("table").forEach(function(t){
var rows=Array.from(t.rows),head=rows.find(function(r){return Array.from(r.cells).some(function(c){return /gjester/i.test(c.textContent);});});
if(!head)return;
var idx=function(re){return Array.from(head.cells).findIndex(function(c){return re.test(c.textContent);});};
var ti=idx(/^\s*tid/i),gi=idx(/gjester/i),bi=idx(/^\s*bord\s*$/i);
rows.forEach(function(r){if(r===head||r.cells.length!==head.cells.length)return;
var tm=r.cells[ti].textContent.replace(/\s+/g,"");if(!/^\d{1,2}[:.]\d{2}$/.test(tm))return;
var g=parseInt(r.cells[gi].textContent,10)||2;out.push(tm+" "+g);});
});
var txt=out.join("\n");
if(!txt){alert("Fant ingen bookinger her.");return;}
var done=function(){alert(out.length+" bookinger kopiert (bare tid + antall, ingen navn). Lim inn i Bordplan → Reservasjoner.");};
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done,function(){prompt("Kopier:",txt);});}else{prompt("Kopier:",txt);}
})();
