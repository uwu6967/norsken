/* Norsken – «Last ned liste»: lagrer bookinglista fra ResDiary-utskriften som CSV på PC-en (Nedlastinger). Telefon/e-post tas ikke med. Filen blir bare på PC-en – aldri legg den i repoen. Bokmerke-versjon: se README.md */
(function(){
var DROP=["telefon","mobil","e-post","epost","email","booket","kundekod","forhånds","forhands"];
var clean=function(s){return s.replace(/\s+/g," ").trim();};
var esc=function(s){return /[";\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
var lines=[],count=0,lastHead="";
document.querySelectorAll("table").forEach(function(t){
var rows=Array.from(t.rows),head=rows.find(function(r){return Array.from(r.cells).some(function(c){return /gjester/i.test(c.textContent);});});
if(!head)return;
var keep=[];
Array.from(head.cells).forEach(function(c,i){var s=c.textContent.toLowerCase().replace(/\s+/g,"");if(!DROP.some(function(w){return s.indexOf(w)>=0;}))keep.push(i);});
var ti=Array.from(head.cells).findIndex(function(c){return /^\s*tid/i.test(c.textContent);});
var h=keep.map(function(i){return esc(clean(head.cells[i].textContent));}).join(";");
if(h!==lastHead){lines.push(h);lastHead=h;}
rows.forEach(function(r){
if(r===head||r.cells.length!==head.cells.length)return;
if(ti>=0&&!/^\d{1,2}[:.]\d{2}$/.test(r.cells[ti].textContent.replace(/\s+/g,"")))return;
var v=keep.map(function(i){return esc(clean(r.cells[i].textContent));});
if(!v.join("").trim())return;
lines.push(v.join(";"));count++;
});
});
if(!count){alert("Fant ingen bookinger her. Åpne utskriftssiden i ResDiary (Diary → Print) først.");return;}
var d=new Date(),p=function(n){return String(n).padStart(2,"0");};
var name="resdiary-"+d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"_"+p(d.getHours())+p(d.getMinutes())+".csv";
var blob=new Blob(["﻿"+lines.join("\r\n")+"\r\n"],{type:"text/csv;charset=utf-8"});
var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);
alert(count+" bookinger lagret som "+name+" i Nedlastinger. Filen er bare på denne PC-en.");
})();
