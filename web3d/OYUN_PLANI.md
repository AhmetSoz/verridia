# VERRİDİA — 3B Hikâye Oyunu (web / ThreeJS)

Kitabı okumak istemeyen de hikâyeyi yaşasın. **Oyun kitabı birebir takip eder**, bölüm bölüm.

## Temel ilke: her bölümün kendi oynanışı var
Sabit bir tür yok. Bölüm neyi anlatıyorsa oynanış ona göre kurulur:

| Oynanış türü | Ne zaman | Örnek bölüm |
|---|---|---|
| **3. şahıs aksiyon** | Tek karakter dövüşü, keşif, diyalog | B1 Sessiz Talim (Togan–Kaya) |
| **Ordu komutası** | Cephe savaşları, süvari hücumu, ok yağmuru | Kızıl Hafta savaşları |
| **Sinematik** | Kanonun değişemeyeceği anlar, yas, karar | Melira anısı, Kapı'nın açılışı |
| **Gerilim/sızma** | Gizlenerek ilerleme, pusu | Gölge-Örtü, Damgalılar |
| **Deniz/güverte** | Zaleena bölümleri | Kaptanlar Konseyi, Paslı Gelgit |
| **Meclis/karar** | Harita başında tartışma, plan okuma | Han çadırı meclisi |
| **At sürme** | Yol, kaçış, ayrılış | Kartal-Yurdu'ndan ayrılış |

Aynı bölümün içinde de mod değişebilir: talim (aksiyon) → ateş başı (diyalog) → meclis (karar) → şafak (at sürme).

## Sanat yönü
**%100 prosedürel.** Hiçbir model/doku/ses dosyası yok; her şey kod:
arazi (FBM), gökyüzü shader (Tek Göz + Kızıl Sürü), çim (instancing + rüzgâr),
karakterler (eklemli kutu-geometri + rotasyon animasyonu), yurt/kukla/ateş, parçacıklar, post-process.

Stil: **temiz düşük-poli + güçlü ışık ve siluet.** Yakın plan gerçekçilik hedeflenmez;
dram ölçekten, ışıktan ve kompozisyondan gelir.

## Teknik iskelet
- `bolum01.js` — Bölüm 1 sahnesi (şu an oynanabilir)
- `main.js` — savaş sahnesi prototipi (ordu komutası türü için temel)
- Ortak parçalar ileride `src/dunya.js` (arazi/gök/ışık), `src/insan.js` (karakter), `src/diyalog.js` olarak ayrılacak
- Her bölüm: kendi sahnesi + kendi oynanış modu + kitaptan gelen diyalog dizisi

## Karakter sistemi (`Insan`)
Eklem hiyerarşisi: `pelvis > govde > bas`, `kol.ust > kol.alt > kılıç`, `bacak.ust > bacak.alt`.
Animasyon rotasyonla üretilir: yürüme/koşu döngüsü, nefes bekleme, kılıç savurma.
Yeni karakter = yeni renk paleti (Togan mavi-çelik, Kaya dun-yeşil). Sıfır asset.

## Bölüm 1 — Sessiz Talim (BİTTİ, oynanabilir)
Kartal-Yurdu, şafaktan önce. Togan kuklaya **üç kez** vurunca (kitaptaki gibi) Kaya gelir,
"Demiri değil, kendini yoruyorsun" der, **üç iz** dersini verir.
Kontroller: WASD yürü · Shift koş · sol tık kılıç · E konuş · sürükle kamera.

## Sıradaki
1. **B1 devamı** — Kaya ile gerçek talim düellosu (savuştur/dodge), sonra ana ateş (Anya Ana),
   Han çadırı meclisi, şafak/ayrılış (at sürme).
2. **B2 Temüjin** — bozkırda farklı POV, farklı oynanış.
3. **Ordu komutası modu** — `main.js` savaş sahnesini komuta edilebilir hale getirmek.
