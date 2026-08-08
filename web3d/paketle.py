# tek dosya paketleyici: bolum01.js + bolum01.html -> oyna-bolum1.html (+ site/oyna.html)
import io, re, os, shutil, subprocess, sys
calisma = os.path.dirname(os.path.abspath(__file__))
# esbuild'in Windows baslaticisi Unicode calisma yolunu kimi sistemlerde yanlis
# kodluyor (Masaustu -> Masaustu mojibake). 8.3 yol ayni klasore kayipsiz ulasir.
if os.name == "nt":
    import ctypes
    buf = ctypes.create_unicode_buffer(32768)
    if ctypes.windll.kernel32.GetShortPathNameW(calisma, buf, len(buf)):
        calisma = buf.value
os.chdir(calisma)
npx = shutil.which("npx.cmd" if os.name == "nt" else "npx") or "npx"
subprocess.run([npx,"esbuild","./bolum01.js","--bundle","--format=iife","--minify",
                "--outfile=b1bundle.js"], check=True)
b = io.open("b1bundle.js", encoding="utf-8").read().replace("</script", r"<\/script")
h = io.open("bolum01.html", encoding="utf-8").read()
h = re.sub(r'<script type="importmap">.*?</script>', '', h, flags=re.S)
h = h.replace('<script type="module" src="./bolum01.js"></script>', '<script>\n'+b+'\n</script>')
io.open("oyna-bolum1.html", "w", encoding="utf-8").write(h)
shutil.copyfile("oyna-bolum1.html", "../site/oyna.html")          # siteden oynanan sürüm
a = re.sub(r'<!doctype html>|</?html[^>]*>|</?head>|</?body>|<meta charset="utf-8">', '', h, flags=re.I)
io.open("artifact-bolum1.html","w",encoding="utf-8").write(
    "".join(c if ord(c) < 128 else "&#"+str(ord(c))+";" for c in a))
print("oyna-bolum1.html + site/oyna.html:", round(os.path.getsize("oyna-bolum1.html")/1024), "KB")
