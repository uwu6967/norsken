import base64
import os
d=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src') + os.sep
idx=open(d+'index.html').read()
app=open(d+'app.js').read(); css=open(d+'styles.css').read(); prn=open(d+'print.html').read()
b64=base64.b64encode(prn.encode()).decode()
old='const html = await (await fetch("print.html")).text();'
assert old in app
app=app.replace(old,'const html = window.__NORSKEN_PRINT_SRC__ ? new TextDecoder().decode(Uint8Array.from(atob(window.__NORSKEN_PRINT_SRC__), (ch) => ch.charCodeAt(0))) : await (await fetch("print.html")).text();')
app=app.replace('</script>','<\\/script>'); assert '</script' not in app
link='<link rel="stylesheet" href="styles.css?v=23" />'; assert link in idx
idx=idx.replace(link,'<style>\n'+css+'\n</style>')
tag='<script src="app.js?v=24"></script>'; assert tag in idx
idx=idx.replace(tag,'<script>window.__NORSKEN_PRINT_SRC__ = "'+b64+'";</script>\n    <script>\n'+app+'\n</script>')
out=os.path.join(d, '..', 'index.html')
open(out,'w').write(idx); print('wrote', os.path.normpath(out), len(idx), 'bytes')
# print.html next to index.html: the local «Skriv ut» link opens it
open(os.path.join(d, '..', 'print.html'),'w').write(prn); print('wrote print.html')

# ResDiary bookmarks as PLAIN TEXT (copy/paste as the bookmark's address):
# written into README.md (between the BOKMERKER markers), resdiary/README.md
# and LES-MEG.txt (the instructions file in the download). Source: resdiary/*.js.
import re
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
def bm(name):
    lines = open(os.path.join(root, 'resdiary', name), encoding='utf-8').read().split('\n')
    code = ''.join(l.strip() for l in lines[1:])
    assert '//' not in code.replace('://', ''), name
    return 'javascript:' + code
items = [
    ('rydd-liste.js', 'Rydd liste', 'Fjerner tomme rader og kolonnene Telefon, E-post, Booket den, Kundekoder og Forhåndsbestilling.'),
    ('til-bordplan.js', 'Til bordplan', 'Kopierer tid, antall og etternavn. Lim inn i bordplanen under Reservasjoner → bord.'),
    ('last-ned-liste.js', 'Last ned liste', 'Lagrer lista (tid, gjester, navn, bord, kommentar) som en fil i Nedlastinger. Åpne den i bordplanen under «Dagens liste». Uten telefon, e-post, booket den, kundekoder og forhåndsbestilling. Fila blir bare på PC-en.'),
]
how = 'Lag et nytt bokmerke (høyreklikk bokmerkelinja → Legg til side), gi det navnet, og lim inn koden som nettadresse. Bruk dem på ResDiary → Diary → Print.'
md = '\n'.join([how, ''] + [f'### {t}\n\n{d}\n\n```\n{bm(f)}\n```\n' for f, t, d in items])
def put(path):
    full = os.path.join(root, path)
    text = open(full, encoding='utf-8').read()
    new = re.sub(r'(<!-- BOKMERKER -->).*?(<!-- /BOKMERKER -->)', lambda m: m.group(1) + '\n' + md + '\n' + m.group(2), text, flags=re.S)
    assert '<!-- BOKMERKER -->' in text, path
    open(full, 'w', encoding='utf-8').write(new)
put('README.md'); put(os.path.join('resdiary', 'README.md'))
txt = ['Norsken - bordplan for Spisestua', '',
       '1. Dobbeltklikk index.html: bordplanen åpner i nettleseren.',
       '2. ResDiary-bokmerker: ' + how, '']
for f, t, d in items:
    txt += ['--- ' + t + ' ---', d, '', bm(f), '']
txt += ['Ingenting installeres. Alt blir i nettleseren din.', '']
open(os.path.join(root, 'LES-MEG.txt'), 'w', encoding='utf-8', newline='\r\n').write('\n'.join(txt))
print('wrote bookmarks into README.md, resdiary/README.md, LES-MEG.txt')
