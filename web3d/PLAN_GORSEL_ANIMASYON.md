# VERRİDİA 3B — Görsel ve Animasyon Yol Haritası

> Amaç: prosedürel (sıfır varlık dosyası) üretimle, referans olarak alınan karanlık
> ortaçağ görsellerinin ışık ve doku diline ulaşmak; animasyonları "hareket eden
> heykel" seviyesinden "ağırlığı olan canlı" seviyesine çıkarmak.

Her madde **neden** önemli olduğu ve **nasıl** ölçüleceğiyle birlikte yazıldı.
Tahmine göre değil, ekran görüntüsüyle doğrulayarak ilerliyoruz.

---

## 0. Mevcut durumun dürüst teşhisi

| Alan | Durum | Asıl darboğaz |
|---|---|---|
| Işık / atmosfer | İyi | Meşale + ıslak zemin + pus yerinde |
| Malzeme | Orta | Tek düze albedo; aşınma/kir gradyanı yok |
| Sahne yoğunluğu | **Zayıf** | Referanslar tıka basa dolu, bizde 2 yurt + çim |
| Oturma (grounding) | **Zayıf** | AO yok — her şey zemine yapıştırılmış gibi |
| Yürüyüş | İyi | Adım kilidi çözüldü |
| Hızlanma/durma | **Zayıf** | 0'dan 5.4 m/s'ye tek karede sıçrıyor |
| Saldırı | **Zayıf** | Tüm eklemler tek eğride, kinetik zincir yok |
| Kamera | **Zayıf** | Katı yörünge; gecikme, FOV, darbe tepkisi yok |
| Yüz | Orta | Göz kırpma / bakış kaçırma yok |

**Tek cümlelik teşhis:** Işığı çözdük, *madde* ve *ağırlık* eksik.

---

## 1. AŞAMA — Ağırlık ve Oturma  *(bu turda uygulanıyor)*

### 1.1 Ekran-uzayı ortam kapanması (SSAO)
**Neden:** Bir nesnenin gerçek görünmesinin en güçlü tek işareti, zeminle
birleştiği yerin kararmasıdır. Şu an her şey zemine yapıştırılmış çıkartma gibi.

**Nasıl:** Hazır `GTAOPass`/`SSAOPass` sahneyi ikinci kez çizer — 46 bin çim
örneğiyle bu çok pahalı. Bunun yerine **derinlik tamponundan** çalışan kendi
pasımızı yazıyoruz: EffectComposer'ın hedefine `DepthTexture` bağlanır, görüş-uzayı
konum yeniden kurulur, komşu derinliklerden normal türetilir, altın-açı spiraliyle
12 örnek alınır. Sahne tekrar çizilmez → maliyet sabit.

**Ölçüt:** Meşale direğinin dibi, kuklanın ayağı, yurt eteği belirgin şekilde
kararmalı; düz zeminde yapay leke oluşmamalı.

### 1.2 Kinetik zincirli saldırı
**Neden:** Gerçek bir kılıç savurmasında güç *kalçadan bileğe* sırayla akar
(proksimalden distale). Bizde kalça, gövde, omuz, dirsek ve bıçak aynı eğriyi
aynı anda okuyor — bu yüzden "hareket ediyor ama vurmuyor" hissi veriyor.

**Nasıl:** Tek bir usta eğri `savurmaEgrisi(x)`. Her eklem eğriyi **kendi gecikmesiyle**
örnekler:

| Eklem | Gecikme | Anlamı |
|---|---|---|
| Kalça | +0.055 | En önde, hareketi başlatır |
| Gövde | +0.028 | Kalçayı izler |
| Omuz | 0.000 | Referans |
| Dirsek | −0.022 | Geriden gelir |
| Bıçak | −0.045 | En sonda kamçılanır |

Eğrinin dört evresi: **yüklenme** (%30, geriye kıvrılma) → **kesme** (%16, çok hızlı)
→ **aşım** (%16, hedefi geçme) → **toparlanma** (%38, yavaş oturma).

Kök hareketi de eğriye bağlanır: yüklenirken hafif **geri** kayma, keserken **ileri**
patlama. Şu anki sabit ileri itiş bunun yerini alacak.

**Ölçüt:** `__dbg.sabit('hafif1', u)` ile 8 kare alınır; kalçanın tepe noktası
bıçağın tepe noktasından önce gelmeli.

### 1.3 Kamera — yaylı kol
**Neden:** Algılanan animasyon kalitesinin yarısı kameradır. Katı yörünge
kamerası, en iyi animasyonu bile cansız gösterir.

**Nasıl:**
- **Yaylı takip:** kamera hedefe anında yapışmaz, ~0.14 s zaman sabitiyle gelir.
- **Gecikmeli bakış:** bakış noktası ayrı ve daha yavaş (~0.25 s) takip eder.
- **İleriye bakış:** hıza göre bakış noktası hareket yönüne kayar.
- **FOV:** duruşta 52°, koşuda +5°, ağır saldırı yüklenmesinde −3° (sıkışma),
  vuruş anında +6° tekme.
- **Darbe yumruğu:** isabette kamera vuruş yönüne doğru sönümlenerek itilir.
- **Arazi çarpışması:** hedef→kamera doğrusu örneklenir, tepe arkasına geçmez.
- **El kamerası titreşimi:** hızla ölçeklenen çok küçük gürültü.

**Ölçüt:** Yön değiştirirken kamera bir an geride kalmalı; vuruşta hissedilir
ama okunaklılığı bozmayan bir tepme olmalı.

### 1.4 Hızlanma / yavaşlama ve gövde eğimi
**Neden:** Şu an karakter 0'dan tam hıza tek karede geçiyor; bu tek başına
"oyuncak" hissi veriyor.

**Nasıl:** Hız bir ivme ile hedefe yaklaşır (kalkış ~0.22 s, duruş ~0.16 s).
Gövde ivmenin tersine eğilir (kalkışta öne, frende geriye). Duruşta bir adım
"fren adımı" ve hafif yalpalama.

### 1.5 Sahne yoğunluğu — obayı doldur
**Neden:** Referans görsellerin en belirgin özelliği **doluluk**. Boşluk her zaman
"prototip" okunur.

**Nasıl:** Yakın alana (≤ 45 m) örneklenmiş prosedürel eşya:
taşlar, kırık dal ve odun yığınları, kurutma sehpaları, ip gerilmiş çamaşır,
çuval istifleri, su fıçısı, at bağlama kazıkları, semer sehpaları, tezek yığını,
kemik parçaları, çukurlar. Hepsi `InstancedMesh` veya birleştirilmiş geometri.

**Ölçüt:** Varsayılan kamera açısında ekranda en az 25 ayrı siluet kırıcı nesne.

---

## 2. AŞAMA — Madde ve Yüzey

### 2.1 Aşınma ve kir gradyanı (shader enjeksiyonu)
Tek düze albedo plastik okunur. `onBeforeCompile` ile:
- **Dip kiri:** dünya-Y'ye göre alt kısımlar koyulaşır (çamur sıçraması).
- **Kenar aşınması:** yukarı bakan normaller açılır (sürtünmeden parlama).
- **Boşluk kararması:** normal haritanın çukurları koyulaşır.
Üç satır GLSL, her malzemeye bedava derinlik katar.

### 2.2 Yakın alan zemin geometrisi
Arazi 4.5 m çözünürlükte — kameranın 5 m yakınında zemin dümdüz. Oyuncunun
etrafında hareket eden, yüksek çözünürlüklü bir "detay yaması" (ruts, taşlar,
ayak izi çukurları) eklenecek.

### 2.3 Kumaş kıvrımları
Kaftan ve pelerinde kıvrımlar şu an sadece normal haritada. Geometriye gerçek
kıvrım katmanı (dikey V oluklar, dip ağırlığı) eklenecek.

### 2.4 Yurt detayı
Sarkma, gergi ipleri, yama parçaları, kapı keçesi, baca halkası, duman.

---

## 3. AŞAMA — Canlılık

### 3.1 Ayak IK
Eğimli zeminde ayaklar araziye oturur; iki kemikli analitik çözüm (uyluk 0.44,
baldır 0.42), pelvis erişilemeyen ayağa göre alçalır.

### 3.2 Yerinde dönüş ve yan adım
Karakter şu an her zaman hareket yönüne bakıyor. Kilitlenmede yan adım ve geri
adım döngüleri; yerinde dönüşte ayak çaprazlama.

### 3.3 Yüz mikro hareketleri
Göz kırpma (rastgele 2.4–5.6 s), bakış kaçırma (saccade), konuşurken çene,
zorlanmada kaş çatma, nefes nefese kalma.

### 3.4 Pelerin zincir simülasyonu
Pelerin tek parça yerine 3 iç içe segment; her biri kendi yayıyla gecikir →
kamçı etkisi, gerçek kumaş hissi.

### 3.5 Yönlü hasar tepkileri
Vuruşun geldiği yöne göre 4 farklı sarsılma; blokta kalkan itmesi; parry'de
bilek bükülmesi.

---

## 4. AŞAMA — Dövüş derinliği

- Ağır saldırı: iki elli tepeden indirme, zeminde toz halkası
- Yön tuşuyla saldırı varyasyonu (ileri = saplama, yan = geniş savurma)
- Kombo iptali (dodge cancel) ve pencere göstergesi
- Kaya'nın gerçek yapay zekâsı: mesafe tutma, feint, karşı saldırı
- Duruş kırılması (posture break) ve ölümcül darbe

---

## 5. Ölçme disiplini

Her pas sonunda:
1. `python web3d/paketle.py` → tek dosya
2. Başsız Chrome + SwiftShader → konsol hatası **sıfır** olmalı
3. `__dbg.sabit(eylem, u)` ile animasyon kare kare kontak sayfası
4. `__dbg.bak(mesafe, yükseklik, açı)` ile yakın çekim
5. Ekran görüntüsüne bakılmadan "düzeldi" denmez

---

## Uygulama sırası

| Sıra | İş | Durum |
|---|---|---|
| 1 | SSAO | ✅ (A/B: %5.9 piksel) |
| 2 | Kinetik zincirli saldırı | ✅ (kalça .38 → omuz .44 → bıçak .50) |
| 3 | Yaylı kamera | ✅ |
| 4 | Hızlanma/yavaşlama | ✅ |
| 5 | Sahne yoğunluğu | ✅ |
| 6 | Aşınma/kir + albedo shader'ı | ✅ |
| 7 | Yakın alan zemin detayı | ✅ (dikişsiz kenar) |
| 8 | Pelerin zinciri (3 segment) | ✅ |
| 9 | Göz kırpma / bakış kaçırma | ✅ |
| 10 | Ayak IK + arazi eğimi | ✅ (eğimde ayaklar farklı yükseklikte) |
| 11 | Kaya düello YZ'si | ✅ (yaklaşma + savurma ölçüldü) |
| 12 | SMAA / ortam haritası / DOF / ışık hiyerarşisi | ✅ |
| 13 | Zırh + miğfer (lamel sistemi) | ✅ |
| 14 | **Performans: statik birleştirme** | ✅ **1232 → 347 çizim** |
| 15 | 3'lü kombo + bitirici, saplama, riposte | ✅ (zincir ölçüldü) |
| 16 | Blok darbesi, yeni takla, ağır çekim, sinematik giriş | ✅ |

## Sıradaki (henüz yapılmadı)
- Duruş kırılması (posture break) ve ölümcül darbe animasyonu
- Kaya'ya gerçek can/denge göstergesi ve ölüm
- Bölüm 1'in kalan sahneleri: Anya Ana, Meclis Çadırı, Şafak, Ayrılış
- At binme (Bozkır) ve Bölüm 2 (Temüjin POV)
