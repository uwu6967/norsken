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
       'Enklest: bruk Norsken-utvidelsen i Chrome/Edge (se nederst).',
       'Uten installering: dobbeltklikk index.html (se under).',
       '',
       '1. Dobbeltklikk index.html: bordplanen åpner i nettleseren.',
       '2. ResDiary-bokmerker: ' + how, '']
for f, t, d in items:
    txt += ['--- ' + t + ' ---', d, '', bm(f), '']
txt += ['index.html trenger ingen installering. Alt blir i nettleseren din.', '']
txt += ['Slik installerer du Norsken-utvidelsen (Chrome eller Edge):', '  1. Last ned Norsken-utvidelse.zip fra siste release.', '  2. Høyreklikk zip-fila -> «Pakk ut alle» og legg mappa et fast sted,', '     f.eks. Dokumenter\\Norsken-utvidelse (ikke i Nedlastinger).', '  3. Skriv chrome://extensions i adressefeltet (Edge: edge://extensions).', '  4. Slå på «Utviklermodus» (Developer mode).', '  5. Trykk «Last inn upakket» (Load unpacked) og velg mappa der manifest.json ligger.', '  6. Chrome: klikk puslespillbrikken øverst til høyre og fest Norsken (nåla).', '     Edge: klikk puslespillbrikken og så øyet (Vis på verktøylinjen).', '     Klikk Norsken-ikonet for å åpne bordplanen.', '  Ny versjon: pakk ut den nye zip-fila og legg filene inn i den samme mappa', '  (erstatt de gamle), og trykk ↻ på Norsken i chrome://extensions.', '  Planene dine blir liggende. Ikke trykk «Fjern» – da slettes planene.', '']

open(os.path.join(root, 'LES-MEG.txt'), 'w', encoding='utf-8', newline='\r\n').write('\n'.join(txt))
print('wrote bookmarks into README.md, resdiary/README.md, LES-MEG.txt')

# ---------------------------------------------------------------------------
# Chrome / Edge extension (extension/): the same planner as its own full page,
# with a working print button. Manifest V3 forbids inline scripts, so the app
# runs from the src files and the printout's script moves to print.js.
# Load it with chrome://extensions -> Developer mode -> Load unpacked.
import json, re, shutil, struct, zlib
ext = os.path.join(root, 'extension')
os.makedirs(ext, exist_ok=True)
src = os.path.join(root, 'src')
shutil.copyfile(os.path.join(src, 'index.html'), os.path.join(ext, 'index.html'))
shutil.copyfile(os.path.join(src, 'app.js'), os.path.join(ext, 'app.js'))
shutil.copyfile(os.path.join(src, 'styles.css'), os.path.join(ext, 'styles.css'))
m = re.search(r'<script>\n(.*?)</script>', prn, re.S)
assert m and prn.count('<script>') == 1
open(os.path.join(ext, 'print.js'), 'w', encoding='utf-8').write(m.group(1))
open(os.path.join(ext, 'print.html'), 'w', encoding='utf-8').write(prn.replace(m.group(0), '<script src="print.js"></script>'))
open(os.path.join(ext, 'background.js'), 'w', encoding='utf-8').write(
    '// Click the Norsken icon: open the planner in its own tab.\n'
    'chrome.action.onClicked.addListener(() => {\n'
    '  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });\n'
    '});\n')

def png(size):
    # a gold table seen from above, a ring of chairs, on a transparent square
    rows = []
    c = (size - 1) / 2
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            d = ((x - c) ** 2 + (y - c) ** 2) ** 0.5 / (size / 2)
            if d <= 0.62:
                px = (196, 165, 116, 255)   # table
            elif d <= 0.70:
                px = (47, 74, 60, 255)      # edge
            elif 0.80 <= d <= 0.98:
                ang = __import__('math').atan2(y - c, x - c)
                on = (int(((ang + 3.1416) / (2 * 3.1416)) * 8 + 0.5) % 2) == 0
                px = (47, 74, 60, 255) if on else (0, 0, 0, 0)
            else:
                px = (0, 0, 0, 0)
            row += bytes(px)
        rows.append(bytes(row))
    raw = zlib.compress(b''.join(rows), 9)
    chunk = lambda t, data: struct.pack('>I', len(data)) + t + data + struct.pack('>I', zlib.crc32(t + data) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)) + chunk(b'IDAT', raw) + chunk(b'IEND', b'')

icons = {}
for n in (16, 32, 48, 128):
    open(os.path.join(ext, f'icon{n}.png'), 'wb').write(png(n))
    icons[str(n)] = f'icon{n}.png'
manifest = {
    'manifest_version': 3,
    'name': 'Norsken – bordplan',
    'version': '1.0.0',
    'description': 'Bordplan for Spisestua og Domino. Klikk ikonet for å åpne den.',
    'action': {'default_title': 'Åpne Norsken', 'default_icon': icons},
    'icons': icons,
    'background': {'service_worker': 'background.js'},
    # Public key only (no secret): it pins the extension id, so saved plans
    # stay even if a new version is unpacked into another folder.
    'key': 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyax5M42OnxhFuxFrrbqz46GeJtKMkSPAck47JZXD8CEZj3SpCZGDZo5oINDPzxiNMtqA3Fn/ti3nxstQc++r49DYYOpBUpPtqjBvY52Kq16xi9nj/QZTcREE5mPsHcACloJd5cQ+shOeatjpjcw1kOu20A/3vt9Ml5zVfm92tKP6MSCylfXXZg4zmR98f18mCAb8WaaoWtuAK9ays3UCf9rxDyX/sy86dlI38OEi8R7uXx32JsqTDnK1D+cpJ/n9iYjJgZinfMEF5O4kJEKpw8xcvRubEFXWjTjD6zXUPrRqukX00wBBe8iAXhEsd005fqc6n4PnnWN5rzJ3dARF3wIDAQAB',
}
open(os.path.join(ext, 'manifest.json'), 'w', encoding='utf-8').write(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print('wrote extension/')
