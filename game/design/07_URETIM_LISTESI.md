# BİRİNCİ KİTAP — Tam Varlık Üretim Listesi (Ana Kontrol)

Bu belge Kitap 1'in **bütün** görsel varlıklarını listeler: 4 oynanabilir karakter (kişiliğine
uygun skiller + vuruşlar), yardımcılar, düşmanlar/boss'lar, 7 biyom çevre seti, sinematik/UI.
Promt'lar **parti parti** verilir (bunaltmamak için). Üretilen `[x]`, bekleyen `[ ]`.

**Üretim kuralı (hepsinde):** yan görünüş, tek yatay şerit, kareler arası **macenta #FF00FF**
boşluk, ROBOTSEPETİ tıknaz/sevimli piksel stili, ~40px karakter, referans olarak ilgili
karakterin mevcut görselini ekle. Detaylı promt kalıbı: `05_VARLIK_LISTESI.md`.

---

## A. OYNANABİLİR KARAKTERLER (4 POV)

Her karakterin ortak animasyon seti + **kişiye özel skil/silah**. Kanon: her POV kendi diyarında.

### A1. TOGAN — genç Sungur savaşçısı  ·  Silah: **Sungur kılıcı + kısa yay**  ·  Skil: **TAKLA (yuvarlanma)**
Rüzgar-Dinleyen (çevresini "duyar"). Öfkeli genç, kontrolü öğreniyor.
- [x] idle, yürüme, zıpla, düşme
- [x] hafif saldırı (kılıç), ağır saldırı (kılıç), parry, takla, hasar
- [ ] koşu (6-8), iniş (2), sendeleme (3), **ölüm (5)**
- [ ] **yay** çekme+atış (4) + ok
- [ ] tutunma/çekilme (5, kayasız — düzeltilmiş promt verildi)
- [ ] **Rüzgar-Dinleyen** özel (çevreyi duyma — parlama/dalga efekti, sanat opsiyonel)

### A2. TEMÜJİN — genç kurt, stratejist  ·  Silah: **step kılıcı + mızrak/atlı**  ·  Skil: **KURT SIÇRAYIŞI (agresif ileri hamle)**
Ateşleri/karanlığı okur; hesaplı ama vahşi. Mentor: Tek-Göz Orkhon.
- [ ] idle, yürüme, koşu, zıpla, düşme, iniş
- [ ] hafif saldırı (kılıç kombo), ağır saldırı, **kurt sıçrayışı** (ileri atılıp vuruş)
- [ ] parry/savuşturma, hasar, sendeleme, ölüm
- [ ] (opsiyonel) at üstü / kurt yoldaşı

### A3. KARIA — fiyort amirali, 45  ·  Silah: **Gelgit-Çeliği balta/kılıç + zırh**  ·  Skil: **SARSILMAZ SİPER (ağır blok, kaçmaz)**
Kırk beş yaş, çatlak omuz zırhı, pragmatik komutan. Ağır, sağlam, yerinden oynamaz.
- [ ] idle (ağır duruş), yürüme (ağır), zıpla (kısa), düşme
- [ ] hafif saldırı (balta), ağır saldırı (yukarıdan indirme), **sarsılmaz siper** (kalkan/duruş — savuşturur, sekmez)
- [ ] karşı-vuruş (siperden sonra), hasar, sendeleme, ölüm

### A4. ZALEENA — korsan kaptanı  ·  Silah: **pala/eğri kılıç + fırlatma bıçağı**  ·  Skil: **GERİ SEKME (çevik yan/geri adım)**
Gözlemci, çevik, köşede okur. Deniz/güverte.
- [ ] idle, yürüme, koşu, zıpla, düşme, iniş
- [ ] hafif saldırı (pala hızlı kombo), ağır saldırı, **geri sekme** (çevik kaçınma), **fırlatma bıçağı** (uzak)
- [ ] parry, hasar, sendeleme, ölüm

---

## B. YARDIMCILAR / NPC'LER
- [x] **Burkut** (Togan'ın kartalı) — tünek
- [ ] **Kaya** (Togan'ın süt ablası, usta; tahta kılıç) — idle, yürü, tahta-kılıç saldırısı, **kayarak atılma** (skil). PROMT: aşağıda, ilk parti.
- [ ] **Tek-Göz Orkhon** (Temüjin'in mentoru) — idle, yürü, konuşma
- [ ] **Korgan** (obabaşı/lider) — idle, yürü
- [ ] **Tek-Kol Roric** (korsan, kancalı) — idle, konuşma
- [ ] Kaptanlar/tayfa, saray subayları, obalı halk (jenerik köylü/asker idle+yürü setleri, 2-3 çeşit)
- [ ] **Melira** (Togan'ın geçmişi — anı/hayalet, sinematik) 

## C. DÜŞMANLAR & BOSS'LAR
- [x] **Pas-Çene** (Rust-Jaw) — yürü, telegraf, vuruş, sersem, ölüm
- [ ] **Damgalılar** (Branded — Gölge-Örtü) — yürü, saldırı, ölüm
- [ ] **Gölge Ordusu** askerleri (2-3 çeşit) — Kızıl Hafta
- [ ] **Yedi Lord** (Karia bölümü, saray) — konuşma/duruş + 1-2 boss
- [ ] Biyom düşmanları: fiyort yağmacıları, deniz canavarı (Zaleena boss "Derinliklerin Efendisi"), dağ yaratığı (Temüjin "Vadinin Sonu" boss)
- [ ] **Kapı** varlıkları / Işığın Duvarı bekçisi (final)

## D. ÇEVRE / BİYOMLAR (her biri: zemin seti + yapılar/ağaç + proplar + arka plan)
- [x] **A Bozkır — Kartal-Yurdu**: arka plan, zemin, çadır/kukla/kazık/ateş/çalı
- [x] **B Gölge-Örtü ormanı**: arka plan + zemin/ağaç/prop (kullanıcı üretti, bağlanacak)
- [ ] **C Fiyort / Tuzlu Taht**: soğuk taş zemin, fiyort kayalık arka plan, demirhane, tuz-taht sarayı içi, gemi rıhtımı, Kuzey Feneri
- [ ] **D Deniz / Gemi / Liman**: gemi güvertesi (zemin), yelken/direk, liman rıhtımı, meyhane (Çatlak Kurukafa) içi, deniz+enkaz arka planı
- [ ] **E Sisli Diyar / Taş-Sis Şehri**: sisli taş sokak zemini, taş binalar, şehir arka planı
- [ ] **F Dağ Etekleri / Vadi**: kayalık yamaç zemini, çam ağaçları, uçurum, dağ arka planı
- [ ] **G Ölü Topraklar / Kapı / Işığın Duvarı**: çatlak çorak zemin, kadim Kapı yapısı, ışık duvarı, çorak arka plan

## E. SİNEMATİK / UI
- [x] Başlık ekranı (Verridia: Kızıl Hafta)
- [ ] **Konuşma portreleri** (büyük yüz büstü) — her ana karakter + Kaya, Korgan, Roric, Yedi Lord vb. (diyalog kutusunda görünür → çok daha sinematik)
- [ ] Bölüm-arası kart/kapak görselleri (4 kısım için)
- [ ] İkonlar (Can/Denge/İrade simgeleri, silah ikonları, harita)
- [ ] Kızıl Hafta gökyüzü olayı (Kızıl Sürü büyür — sinematik arka plan varyasyonu)

---

## ÜRETİM SIRASI (parti parti)
1. **Kaya** (talim düellosu — açılışı tamamlar) ← ŞİMDİ
2. Togan eksikleri (ölüm, yay, tutunma) + Gölge-Örtü bağlama
3. **Konuşma portreleri** (Togan, Kaya — sinematik sıçraması)
4. Temüjin tam set + Bozkır düşman (Temüjin bölümü oynanır)
5. Karia + Fiyort biyomu · Zaleena + Deniz biyomu
6. Diğer biyomlar (Sisli Şehir, Dağ, Kapı) + boss'lar
7. Kızıl Hafta finali varlıkları

> Her parti bittiğinde bu listede `[x]`le, sıradaki partinin promt'larını veririm.
