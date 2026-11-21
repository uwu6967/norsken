/* Norsken – «Til Norsken»: ett trykk på ResDiary-utskriften åpner Norsken og gir den dagens bookinger (tid, antall, etternavn, kommentar, område, bord). Lista sendes direkte mellom de to fanene i nettleseren – aldri i adressen, aldri til noen server. Bokmerke-versjon: se README.md */
(function(){
var out=[];
var last=function(s){s=s.replace(/\s+/g," ").trim();if(!s)return "";if(s.indexOf(",")>0)return s.split(",")[0].trim();var w=s.split(" ");return w[w.length-1];};
document.querySelectorAll("table").forEach(function(t){
var rows=Array.from(t.rows),head=rows.find(function(r){return Array.from(r.cells).some(function(c){return /gjester/i.test(c.textContent);});});
if(!head)return;
var idx=function(re){return Array.from(head.cells).findIndex(function(c){return re.test(c.textContent);});};
var ti=idx(/^\s*tid/i),gi=idx(/gjester/i),ni=idx(/navn|kunde(?!kod)|^\s*gjest\s*$/i),ci=idx(/komment|merknad|spesial/i),ai=idx(/omr[åa]de|area/i),bi=idx(/^\s*bord\s*$/i);
if(ni<0)return;
rows.forEach(function(r){if(r===head||r.cells.length!==head.cells.length)return;
var tm=r.cells[ti].textContent.replace(/\s+/g,"");if(!/^\d{1,2}[:.]\d{2}$/.test(tm))return;
if(!r.cells[ni].textContent.trim())return;
var g=parseInt(r.cells[gi].textContent,10)||2;
var n=last(r.cells[ni].textContent).replace(/\d+/g,"").trim();
var k=ci>=0?r.cells[ci].textContent.replace(/\s+/g," ").trim():"";
var a=ai>=0?r.cells[ai].textContent.replace(/\s+/g," ").trim():"",b=bi>=0?r.cells[bi].textContent.replace(/\s+/g," ").trim():"";
out.push([tm,g,n,k,a,b].join("\t"));});
});
var txt=out.join("\n");
if(!txt){alert("Fant ingen bookinger her. Gå til Diary → Print (utskriften) i ResDiary, og trykk knappen igjen.");return;}
var O="https:/"+"/uwu6967.github.io";
var w=window.open(O+"/norsken/#fra-resdiary","norsken");
if(!w){alert("Nettleseren stoppet Norsken-vinduet. Tillat popup-vinduer for ResDiary, og trykk knappen igjen.");return;}
var done=false,n=0;
var ok=function(e){if(e.origin===O&&e.data==="norsken-ok"){done=true;window.removeEventListener("message",ok);}};
window.addEventListener("message",ok);
var t=setInterval(function(){if(done){clearInterval(t);return;}if(++n>80){clearInterval(t);window.removeEventListener("message",ok);alert("Norsken svarte ikke. Vent til Norsken har åpnet, og trykk knappen igjen.");return;}try{w.postMessage({norsken:txt},O);}catch(e){}},250);
})();
