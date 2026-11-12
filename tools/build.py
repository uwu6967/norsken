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

# bokmerker.html: drag-to-bookmark-bar page for the ResDiary bookmarklets,
# so nobody has to copy/paste code. Built from resdiary/*.js (first line = comment).
import html as _h
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
def bm(name):
    lines = open(os.path.join(root, 'resdiary', name), encoding='utf-8').read().split('\n')
    code = ''.join(l.strip() for l in lines[1:])
    assert '//' not in code.replace('://', '') and '%' not in code, name
    return _h.escape('javascript:' + code, quote=True)
items = [
    ('rydd-liste.js', 'Rydd liste', 'Fjerner tomme rader og kolonnene Telefon, E-post, Booket den, Kundekoder og Forhåndsbestilling.'),
    ('til-bordplan.js', 'Til bordplan', 'Kopierer tid + antall (ingen navn). Lim inn i bordplanen under Reservasjoner → bord.'),
    ('last-ned-liste.js', 'Last ned liste', 'Lagrer lista (tid, gjester, navn, bord, kommentar) som CSV i Nedlastinger. Åpne den i bordplanen under «Dagens liste». Uten telefon, e-post, booket den, kundekoder og forhåndsbestilling. Filen blir bare på PC-en.'),
]
cards = '\n'.join(
    f'<li><a class="bm" href="{bm(f)}">{_h.escape(t)}</a><p>{_h.escape(d)}</p></li>' for f, t, d in items)
page = f'''<!doctype html>
<html lang="no">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Norsken – ResDiary-bokmerker</title>
<style>
body {{ margin: 0; background: #f3ebe0; color: #1d1812; font: 16px/1.5 system-ui, sans-serif; }}
main {{ max-width: 640px; margin: 0 auto; padding: 24px 16px 40px; }}
h1 {{ font-family: Georgia, serif; margin: 0 0 4px; }}
ol.steps {{ padding-left: 20px; }}
ul.list {{ list-style: none; padding: 0; display: grid; gap: 14px; }}
ul.list li {{ background: #fffaf3; border-radius: 14px; padding: 14px 16px; box-shadow: 0 6px 20px rgba(40,28,16,.12); }}
ul.list p {{ margin: 8px 0 0; color: #6d6258; font-size: 0.92rem; }}
a.bm {{ display: inline-block; background: #2f4a3c; color: #fff; text-decoration: none; font-weight: 600;
        border-radius: 999px; padding: 8px 16px; cursor: grab; }}
.note {{ color: #6d6258; font-size: 0.9rem; }}
</style>
</head>
<body>
<main>
<h1>ResDiary-bokmerker</h1>
<ol class="steps">
<li>Vis bokmerkelinja: <b>Ctrl + Shift + B</b>.</li>
<li><b>Dra</b> en grønn knapp opp på bokmerkelinja (ikke klikk den her).</li>
<li>Åpne ResDiary → Diary → <b>Print</b>, og klikk bokmerket.</li>
</ol>
<ul class="list">
{cards}
</ul>
<p class="note">Alt skjer bare i nettleseren din. Ingenting sendes noe sted.</p>
</main>
</body>
</html>
'''
open(os.path.join(root, 'bokmerker.html'), 'w', encoding='utf-8').write(page)
print('wrote bokmerker.html')
