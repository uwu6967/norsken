/* Norsken – «Til bordplan»: kopierer tid + antall + etternavn til utklippstavla for Reservasjoner → bord. Bokmerke-versjon: se README.md */
(function(){
var out=[];
var last=function(s){s=s.replace(/\s+/g," ").trim();if(!s)return "";if(s.indexOf(",")>0)return s.split(",")[0].trim();var w=s.split(" ");return w[w.length-1];};
document.querySelectorAll("table").forEach(function(t){
var rows=Array.from(t.rows),head=rows.find(function(r){return Array.from(r.cells).some(function(c){return /gjester/i.test(c.textContent);});});
if(!head)return;
var idx=function(re){return Array.from(head.cells).findIndex(function(c){return re.test(c.textContent);});};
var ti=idx(/^\s*tid/i),gi=idx(/gjester/i),ni=idx(/navn|kunde(?!kod)|^\s*gjest\s*$/i);
rows.forEach(function(r){if(r===head||r.cells.length!==head.cells.length)return;
var tm=r.cells[ti].textContent.replace(/\s+/g,"");if(!/^\d{1,2}[:.]\d{2}$/.test(tm))return;
var g=parseInt(r.cells[gi].textContent,10)||2;
var n=ni>=0?last(r.cells[ni].textContent).replace(/\d+/g,"").trim():"";
out.push((tm+" "+g+" "+n).trim());});
});
var txt=out.join("\n");
if(!txt){alert("Fant ingen bookinger her.");return;}
var done=function(){alert(out.length+" bookinger kopiert (tid, antall, etternavn). Lim inn i Bordplan → Reservasjoner.");};
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done,function(){prompt("Kopier:",txt);});}else{prompt("Kopier:",txt);}
})();
