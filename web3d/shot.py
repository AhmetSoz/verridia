from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time
o=Options()
o.add_argument("--headless=new"); o.add_argument("--window-size=1600,900")
o.add_argument("--use-angle=swiftshader"); o.add_argument("--enable-unsafe-swiftshader")
o.add_argument("--disable-gpu-sandbox"); o.add_argument("--no-sandbox")
d=webdriver.Chrome(options=o)
d.get("http://localhost:8781/index.html")
time.sleep(14)
logs=[]
try:
    for e in d.get_log('browser'):
        if e['level']=='SEVERE': logs.append(e['message'][:200])
except: pass
print("HATA:", logs[:3] if logs else "yok")
print("hazir:", d.execute_script("return window.__hazir === true"))
d.save_screenshot("shot.png")
d.quit()
