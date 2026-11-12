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
