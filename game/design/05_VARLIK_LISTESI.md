# VERRİDİA: KIZIL HAFTA — Varlık (Asset) Üretim Listesi

Bu belge, oyunun "çok daha detaylı" hâle gelmesi için **senin AI görsel aracıyla üreteceğin**
tüm varlıkları önceliğe göre sıralar. Kodu, entegrasyonu, animasyon bağlamayı ben yapıyorum.

## Üretim Kuralları (HEPSİNDE geçerli)
1. **Arka plan düz macenta `#FF00FF`** (parlak pembe). Ben bunu şeffafa çeviriyorum.
2. **Yan görünüş** (side-view), karakter sağa bakar. Ben sola çevirmeyi kodda yapıyorum.
3. **Tek animasyon = tek yatay şerit (strip).** Kareler eşit aralıklı, aralarında boşluk.
4. **Aynı karakter, aynı boy/duruş.** Her üretimde referans olarak `asset/togan/togan.png`i ekle.
5. **Ayak çizgisi (taban) sabit.** Karakter havada zıplarken bile aynı ölçekte.
6. **Kenar ışıması / gölge yok**, sade piksel. Işık efektlerini ben ekliyorum.
7. Küçük çöz (ROBOTSEPETİ stilindeki gibi tıknaz/sevimli), gereksiz detay yok.

Kaydetme: her şeriti `asset/togan/` içine anlamlı adla koy (ör. `hafif_saldiri_serit.png`).

---

## TOGAN — KADEME 1 (dövüş hissi, ÖNCE bunlar)

### 1. Hafif Kılıç Saldırısı — 5 kare
```
Yan görünüşü piksel-art savaşçı, sağa bakıyor, kılıçla hızlı YATAY savurma
animasyonu. 5 kare tek yatay şeritte, eşit aralıklı, aralarında boşluk.
Kareler: (1) kılıç geride hazırlık, (2) öne savurma başlangıcı, (3) tam yatay
kesme -kılıç ileri uzanmış-, (4) savurma sonu, (5) toparlanma.
Arka plan düz macenta #FF00FF. Sade, tıknaz sevimli piksel karakter, kenar
ışıması yok. Referans karakter eklendi (togan).
```

### 2. Ağır Kılıç Saldırısı — 6 kare
```
Aynı piksel savaşçı sağa bakıyor, iki elle AĞIR yukarıdan aşağı kılıç darbesi.
6 kare tek yatay şerit, eşit aralıklı. Kareler: (1) kılıç başın üstünde yüklenme,
(2-3) yavaş yükselen hazırlık, (4) güçlü aşağı vuruş, (5) yere/hedefe iniş,
(6) ağır toparlanma. Arka plan düz macenta #FF00FF. Tıknaz sevimli piksel,
kenar ışıması yok. Aynı karakter (togan referans).
```

### 3. Parry / Siper Alma — 3 kare
```
Aynı piksel savaşçı sağa bakıyor, kılıcı dikey kaldırıp gelen darbeyi karşılama
(parry) duruşu. 3 kare tek yatay şerit: (1) kılıcı kaldırma, (2) sağlam siper
duruşu -kılıç önde dikey-, (3) hafif geri savulma. Arka plan macenta #FF00FF.
Tıknaz sevimli piksel. Aynı karakter (togan referans).
```

### 4. Kaçınma / Takla (yuvarlanma) — 6 kare
```
Aynı piksel savaşçı sağa doğru öne TAKLA atıyor (yuvarlanma/dodge roll). 6 kare
tek yatay şerit: ayakta -> öne eğilme -> yere kıvrılma -> tam yuvarlanma (baş aşağı)
-> doğrulma -> ayağa kalkma. Arka plan macenta #FF00FF. Tıknaz sevimli piksel,
kenar ışıması yok. Aynı karakter (togan referans).
```

### 5. Hasar Alma — 2 kare
```
Aynı piksel savaşçı sağa bakıyor, darbe yiyip geriye sarsılıyor. 2 kare tek
yatay şerit: (1) darbe anı -gövde geriye, baş yana-, (2) sendeleyip toparlanma.
Arka plan macenta #FF00FF. Tıknaz sevimli piksel. Aynı karakter (togan referans).
```

---

## TOGAN — KADEME 2 (hareket cilası)

### 6. Nefes Alan Bekleme (idle) — 4 kare
```
Aynı piksel savaşçı sağa bakıyor, ayakta hafifçe nefes alıp veren sakin bekleme.
4 kare tek yatay şerit, çok ince yukarı-aşağı hareket. Arka plan macenta #FF00FF.
Tıknaz sevimli piksel. Aynı karakter (togan referans).
```

### 7. Yürüme/Koşu — 8 kare  (elimizde 4 var, 8'e çıkaralım)
```
Aynı piksel savaşçı sağa koşuyor, akıcı bacak döngüsü. 8 kare tek yatay şerit,
eşit aralıklı, tam bir adım döngüsü. Arka plan macenta #FF00FF. Tıknaz sevimli
piksel. Aynı karakter (togan referans).
```

### 8. Zıplama & Düşme & İniş — 6 kare
```
Aynı piksel savaşçı sağa bakıyor, zıplama dizisi. 6 kare tek yatay şerit:
(1) çömelme -zıplama hazırlığı-, (2) yerden fırlama, (3) yükselirken,
(4) tepe noktası, (5) düşerken, (6) yere iniş çömelmesi. Arka plan macenta
#FF00FF. Tıknaz sevimli piksel. Aynı karakter (togan referans).
```

### 9. Kenara Tutunma & Çekilme — 5 kare  (KODU HAZIR, kare bekliyor)
```
Aynı piksel savaşçı sağa bakıyor, bir kayanın/çıkıntının kenarına tutunup
yukarı çekiliyor. 5 kare tek yatay şerit: (1) tek elle kenara asılı sallanma,
(2) iki elle tutunma, (3) kendini yukarı çekme, (4) diz kenara çıkma,
(5) kenarın üstünde doğrulma. Arka plan macenta #FF00FF. Tıknaz sevimli
piksel. Aynı karakter (togan referans).
```

---

## TOGAN — KADEME 3 (durum & ikinci silah)

### 10. Ölüm — 5 kare
```
Aynı piksel savaşçı sağa bakıyor, yenilip yere yığılma. 5 kare tek yatay şerit:
ayakta sendeleme -> dize çökme -> öne düşme -> yerde -> hareketsiz. Arka plan
macenta #FF00FF. Tıknaz sevimli piksel. Aynı karakter (togan referans).
```

### 11. Yay (ikinci silah) — 4 kare
```
Aynı piksel savaşçı sağa bakıyor, yay çekip ok atma. 4 kare tek yatay şerit:
(1) yayı kaldırma, (2) oku gerdirme -yay tam gergin-, (3) bırakma anı,
(4) toparlanma. Arka plan macenta #FF00FF. Tıknaz sevimli piksel. Aynı
karakter (togan referans). Ayrıca tek bir "ok" görseli de üret (küçük, yatay).
```

---

## PAS-ÇENE (düşman) — şu an tek kare, canlandıralım

### D1. Bekleme + Yürüme — 6 kare
```
Yan görünüş paslı zırhlı çürümüş yaratık düşman (Pas-Çene), sağa bakıyor.
6 kare tek yatay şerit: 2 kare hafif nefes/sallanma bekleme + 4 kare ağır
tehditkâr yürüme döngüsü. Arka plan macenta #FF00FF. Tıknaz piksel, kaba ve
tehditkâr. (Referans: asset/pas-çene/Pas-Çene.png)
```

### D2. Saldırı Telegrafı + Vuruş — 5 kare
```
Aynı Pas-Çene düşman sağa bakıyor, saldırı. 5 kare tek yatay şerit: (1-2)
kolunu geriye yükleyip DURAKSAMA -parry uyarısı-, (3) öne savurma, (4) tam
vuruş uzanması, (5) toparlanma. Arka plan macenta #FF00FF. Tıknaz piksel.
(Referans: Pas-Çene)
```

### D3. Sendeleme + Ölüm — 5 kare
```
Aynı Pas-Çene düşman, dengesi bozulup çöküyor. 5 kare tek yatay şerit: (1)
sersem geriye sendeleme, (2) diz üstü, (3) öne devrilme, (4-5) dağılıp yere
yığılma. Arka plan macenta #FF00FF. Tıknaz piksel. (Referans: Pas-Çene)
```

---

## ÇEVRE / ORTAM (KADEME 4 — sonra)
Gölge-Örtü ormanı için döşeme (tile) seti: zemin/toprak, platform kenarı,
ağaç gövdesi, kaya, çalı, arka-orman katmanı. Bunları ayrı bir istede
detaylandıracağım; şimdilik gri-kutu zeminle çalışıyoruz.
