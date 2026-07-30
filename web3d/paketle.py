# tek dosya paketleyici: bolum01.js + bolum01.html -> oyna-bolum1.html (+ site/oyna.html)
import io, re, os, shutil, subprocess, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
subprocess.run(["npx","esbuild","bolum01.js","--bundle","--format=iife","--minify",
                "--outfile=b1bundle.js"], check=True, shell=(os.name=="nt"))
b = io.open("b1bundle.js", encoding="utf-8").read().replace("</script", "<\/script")
h = io.open("bolum01.html", encoding="utf-8").read()
h = re.sub(r'<script type="importmap">.*?</script>', '', h, flags=re.S)
h = h.replace('<script type="module" src="./bolum01.js"></script>', '<script>\n'+b+'\n</script>')
io.open("oyna-bolum1.html", "w", encoding="utf-8").write(h)
shutil.copyfile("oyna-bolum1.html", "../site/oyna.html")          # siteden oynanan sürüm
a = re.sub(r'<!doctype html>|</?html[^>]*>|</?head>|</?body>|<meta charset="utf-8">', '', h, flags=re.I)
io.open("artifact-bolum1.html","w",encoding="utf-8").write(
    "".join(c if ord(c) < 128 else "&#"+str(ord(c))+";" for c in a))
print("oyna-bolum1.html + site/oyna.html:", round(os.path.getsize("oyna-bolum1.html")/1024), "KB")
