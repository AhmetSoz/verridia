from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time, os, pathlib
o=Options(); o.add_argument("--headless=new"); o.add_argument("--window-size=1200,700")
o.add_argument("--use-angle=swiftshader"); o.add_argument("--enable-unsafe-swiftshader"); o.add_argument("--no-sandbox")
d=webdriver.Chrome(options=o)
d.get(pathlib.Path("oyna-bolum1.html").resolve().as_uri())
time.sleep(14)
sev=[e['message'][:140] for e in d.get_log('browser') if e['level']=='SEVERE']
print("file:// HATA:", sev[:2] if sev else "yok")
print("file:// hazir:", d.execute_script("return window.__hazir===true"))
d.quit()
