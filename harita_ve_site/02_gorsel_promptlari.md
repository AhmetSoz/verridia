# GÖRSEL ÜRETİM PROMPTLARI
*(GPT Image / benzeri modeller için. Promptlar İngilizce — görsel modeller İngilizce'de çok daha isabetli çalışır; her promptun üstünde Türkçe açıklaması var.)*

## 0. ALTIN KURALLAR (üretmeden önce oku)
1. **Haritaya YAZI YAZDIRMA.** Şehir/bölge adlarını görselde İSTEME — "no text, no labels" de. İsimleri sitede HTML/SVG katmanı olarak biz bindireceğiz: keskin durur, tıklanabilir olur, yazım hatası riski sıfırlanır. (AI görselde yazı neredeyse her zaman bozuk çıkar.)
2. **Stil bloğunu her prompta aynen yapıştır** (aşağıda STYLE BLOCK). Bütün görsellerin aynı filmden fırlamış gibi durması bunun sayesinde olur.
3. Ana haritayı **4:3 ve mümkün olan en yüksek çözünürlükte** üret. Bölge görselleri **16:9** (sinematik).
4. Bölge görseli üretirken, ana haritadan o bölgenin **kırpılmış parçasını referans görsel olarak yükle** (image-to-image) — coğrafya tutarlı kalır.
5. Her üretimden sonra kontrol listesi: kıyı biçimi spec'e uyuyor mu? Dağ ekseni KB–GD mi? Nehir doğru kıvrılıyor mu? Uymuyorsa "keep composition, fix X" diye düzelttir.

---

## STYLE BLOCK (her promptun sonuna eklenecek)
```
STYLE: epic dark fantasy, cinematic realism in the vein of The Lord of the Rings and Game of Thrones production design; painterly photorealism, weathered and lived-in world; muted earthy palette (slate grey, bone, rust red, cold gold, marsh green) with one controlled accent of eerie golden-white light; volumetric fog, dramatic overcast light breaking through clouds; extremely high detail, 8k, no text, no labels, no watermark, no borders, no compass rose with letters.
```

---

## 1. ANA HARİTA (kuş bakışı master — 4:3)

**Türkçe açıklama:** Tüm kıtanın boyalı-gerçekçi ("painted relief") kuş bakışı haritası. Etiketsiz. Spec'teki geometriye birebir uymalı.

```
A vast painted relief map of a fantasy continent seen from directly above, style of a hyper-detailed cinematic atlas (mix of realistic satellite terrain and hand-painted fantasy cartography, like the Game of Thrones title sequence rendered as one still image). North at top. 4:3 composition, the continent fills the frame with narrow ocean margins.

GEOGRAPHY (must follow exactly):
- WEST COAST (left edge to ~18% width): cold, storm-lashed coast shredded into deep black fjords; dark misty pine forests inland; one great grey stone harbor city built in layers on fjord cliffs at 14% from left, 50% from top, with a giant lighthouse.
- A massive snow-capped mountain range runs DIAGONALLY from upper-left (24%, 18%) to lower-middle (39%, 85%), like a stone wall dividing the continent; one single great pass through it at (29%, 53%) with tiny watchtowers.
- CENTER-EAST: an endless pale-yellow steppe. At the exact center (50%, 50%) a huge circular meteor crater with faint red forge-glow and smoke rising from its heart. At (65%, 40%) a half-buried ruined ancient city, grid of broken streets, one domed structure intact. At (57.5%, 67%) a dead grey ash valley with a small black glassy lake. At (70%, 57%) a crescent-shaped nomad camp of thousands of tents with vast bison herds nearby, dust clouds.
- NORTH-CENTER (56%, 20%): an isolated cluster of black, cave-pocked forbidding mountains, no snow, wrong-looking.
- A great river born from the mountain glaciers at (35%, 68%), cutting a deep dark canyon southeast through the steppe, then unraveling into a huge green-brown marsh delta in the SOUTH-EAST corner (70-90% width, 84-100% height), thousands of winding channels, islands, mist; tiny palace-structures woven into giant living trees at (79%, 92%).
- EAST COAST (right 8% of frame): windswept shore guarded by a jagged line of razor reefs just offshore; a city built entirely of stacked shipwrecks at (95%, 53%); a ship graveyard bay at (96%, 58%).
- FAR NORTH (top 8% of frame): the land dies into a colorless grey band, and across the ENTIRE top of the continent runs a faintly curved WALL OF GOLDEN-WHITE LIGHT rising from the earth like a luminous curtain, both ends running into the sea; at (27.5%, 2%) a brighter gate-shaped silhouette within the wall. Beyond the wall: only fog, unknowable.
- SKY DETAIL: in the far upper corner over the northern ocean, a very faint smear of ominous red nebula light in the sky reflection.
- A pale road visible from the harbor city north to the gate, dotted with tiny standing stones; another trade road from the harbor city through the mountain pass to the crater city and the ruined city.

NO text, NO labels, NO legend, NO compass letters.
[STYLE BLOCK]
```

---

## 2. BÖLGE GÖRSELLERİ (zoom bitiş kareleri — 16:9)

*(Her biri, o bölgeye "haritanın içine düşmüş" gibi giren sinematik manzara. Üretirken ana haritadan ilgili kırpımı referans ver.)*

### 2.1 Yıldız-Örsü (Temürçiler)
```
Cinematic aerial view descending into a colossal meteor crater in a pale endless steppe at dusk. Inside the crater: a forge-city of dark stone and iron built in concentric rings around a monumental anvil at the center, rivers of orange forge-light and sparks, smoke columns rising into cold blue evening air, the crater walls forming a natural fortress with one guarded southern gate; tiny figures of smiths, glowing workshops carved into the crater walls; above the rim, the vast empty steppe and a bruised sunset sky.
[STYLE BLOCK]
```

### 2.2 Metheris (Hegemonya)
```
Cinematic aerial view of a grim grey stone capital city built in terraces on black fjord cliffs, permanent sea-mist below; narrow slit windows, thick walls, salt-stained towers; a royal keep carved from the highest rock crowned by a salt-white throne hall; a colossal lighthouse burning cold gold over a naval harbor of dark warships; wooden walkways strung between huge wet pines climbing inland; rain-heavy sky, one shaft of light on the keep.
[STYLE BLOCK]
```

### 2.3 Kartal-Yurdu (Sungurlar)
```
Cinematic view of a steppe-nomad winter settlement in a sheltered mountain-foothill valley at golden dawn: rings of felt tents and low timber halls, herds of goats and steppe horses, smoke from hearth fires; giant eagles with wingspans taller than a man circling thermals above the cliffs, one landing on a warrior's arm on a watch-rock; snow-capped diagonal mountain wall behind, endless pale grassland opening to the east.
[STYLE BLOCK]
```

### 2.4 Büyük Ordugâh (Azgutlar)
```
Cinematic aerial of a vast crescent-shaped nomad war-camp on open steppe under a hard noon sun: thousands of hide tents around a monumental central war-tent of black bison leather, bone-and-horn totems, corrals of huge armored steppe bison, dust clouds of returning raider cavalry, cook-fires, wrestling circles; the grass trampled to red-brown earth for a mile around; heat shimmer, banners of crude black bison silhouettes.
[STYLE BLOCK]
```

### 2.5 Eski-Kent (Mirasçılar)
```
Cinematic view of a half-buried ancient ruined city on the steppe in late afternoon amber light: broken glass-and-metal towers of a lost civilization jutting like ribs from the earth, streets carved with unreadable geometric symbols, and at its heart one intact structure — a great dark library sealed in resin-black stone, faint white fungus-light glowing along its base; robed archivist figures small on the steps; dust motes, profound silence made visible.
[STYLE BLOCK]
```

### 2.6 Sazlık Taht (Rivan Deltası)
```
Cinematic view gliding low over a vast green-brown marsh delta in humid morning light: thousands of winding water channels between mangrove roots, floating reed markets, stilt villages; at the center, palaces GROWN into the trunks of colossal living swamp trees, walkways spiraling their bark, alchemical lanterns in poison-green and silver; mist curling over black water, a silent narrow boat with a hooded figure; dense, dripping, beautiful and sinister.
[STYLE BLOCK]
```

### 2.7 Yamalı Liman (Korsanlar)
```
Cinematic view of a pirate harbor city built entirely from stacked shipwrecks: hulls become houses, masts become bridges, sails become roofs, tar and rust everywhere; crooked taverns leaning over muddy tide-flats; beyond the harbor a line of razor reefs shredding the sea into white foam; storm light, screaming gulls, a lawless carnival of lanterns beginning to glow at dusk; in the bay, a half-sunken ancient war galleon converted into a throne-fortress.
[STYLE BLOCK]
```

### 2.8 Derin-Yuva ve Valerius Geçidi (Granit Klanları)
```
Cinematic view inside a colossal mountain pass between snow-capped granite walls: an ancient road littered with rusted spearheads and arrowstones from an old war, wind singing through the metal; carved into the living rock face, a monumental stone gate with warm hearth-light glowing from window-slits and smoke vents high in the cliff — a hidden city inside the mountain; hardy fur-clad guards on ledges; late cold light, a distant avalanche plume.
[STYLE BLOCK]
```

### 2.9 Işık Seddi ve Şafak Kapısı
```
Cinematic wide shot at the end of the world: a dead colorless plain under low grey sky, dotted with small nameless standing stones, leading to a WALL OF GOLDEN-WHITE LIGHT rising from the earth into the clouds, immaterial yet impassable, stretching horizon to horizon; at its center a brighter colossal gate-shaped silhouette with slowly moving unreadable geometric symbols; one tiny lone rider with an eagle overhead approaching, dwarfed to insignificance; awe, dread, absolute silence.
[STYLE BLOCK]
```

### 2.10 Ek atmosfer kareleri (site için bonus)
- **Kızıl Hafta:** `The same continent map as reference, but the moon huge and BLOOD RED over a black ocean vomiting crimson kelp onto a burning coastline; silhouettes of harvest crews and monsters in the surf... [STYLE BLOCK]`
- **Kül Vahası:** `A dead grey ash valley, skeletal bent trees, a black glassy lake reflecting nothing, absolute stillness... [STYLE BLOCK]`
- **Fısıltı Yolu:** `A narrow sea passage between razor-sharp reef teeth walled in by solid fog, ghost-light diffusing through, the suggestion of a wrong-shaped ship deep in the mist... [STYLE BLOCK]`

---

## 3. ANİMASYON PLANI (senin fikrin + önerilerim)

**Senin plan:** Ana harita = başlangıç karesi → bölge görseli = bitiş karesi → video modeliyle ara doldurma (interpolasyon) → hover'da oynat.

**Önerim — iki aşamalı zoom (daha sağlam ve daha ucuz):**
1. **Aşama 1 (CSS/JS, sıfır maliyet, kusursuz):** Mouse bölgeye gelince, sitede haritanın kendisine gerçek zamanlı zoom yap (transform: scale + translate, spec'teki % koordinatlarına). Bu aşama her zaman akıcı ve nettir, AI bozulması riski yoktur.
2. **Aşama 2 (AI video):** Zoom belli bir eşiği geçince, o bölgenin harita kırpımından → sinematik bölge görseline **crossfade'li kısa video** oynat (senin start-frame/end-frame interpolasyon fikrin tam burada). Böylece AI videosu yalnızca "haritadan dünyaya dalış" anını taşır — en etkileyici an — ve tutarsızlık riski tek geçişe iner.

**Diğer öneriler:**
- Interpolasyon videoları için start frame'i *ekran görüntüsü* olarak değil, master haritanın **yüksek çözünürlüklü kırpımı** olarak ver (aynı pikseller → geçiş pürüzsüz).
- Her bölge videosunu **sessiz 3–4 saniye, loop'suz, tek yönlü** üret; site geri dönüşte videoyu tersten oynatmak yerine CSS zoom-out kullansın (tersten AI videosu hep sırıtır).
- Ses katmanı ayrı: bölgeye girişte kısa ambiyans (Temürçi = çekiç ritmi, Delta = su+böcek, Metheris = çan+martı). Ses, animasyonun yarısıdır.
- İsim etiketleri, sınır çizgileri ve "keşfedilmemiş sis" efekti (henüz kitapta gidilmemiş bölgeleri sisli göster — kitap ilerledikçe site haritası "açılır") → hepsi SVG overlay. **Bu "kitapla birlikte açılan harita" fikri siteyi tek başına özel kılar.**
- Tutarlılık için: ilk üretimde en beğendiğin kareyi "stil çapası" yap; sonraki her üretimde onu referans görsel olarak ekle.

## 4. Üretim Sırası (önerilen)
1. Ana harita (4:3) → spec kontrolü → gerekirse düzelttirme turları.
2. Onaylı master'dan 9 bölge kırpımı al (spec %'lerine göre).
3. Bölge görselleri (2.1→2.9), her birinde kırpım referanslı.
4. Bonus atmosfer kareleri.
5. Interpolasyon videoları (Kling/Runway/Veo vb.) → bana gönder, siteye montaj planını birlikte yaparız.
