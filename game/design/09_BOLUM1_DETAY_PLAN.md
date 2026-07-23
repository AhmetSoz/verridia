# BÖLÜM 1 — DETAYLI UYGULAMA PLANI (her sahne, her hareket, her tetik)

Kaynak: `roman/kisim1/bolum01_togan.md`. Oyun bu bölümü **Kartal-Yurdu'nda kesintisiz oynanan
bir sabah** olarak sunar. Oyuncu soldan sağa ilerler; her mekân bir sahneyi tetikler.
**Duygusal yay:** talimde aşağılanma → Anya'nın kederi/bilgeliği → mecliste görev↔intikam
çatışması → şafakta firar kararı → obayı terk. Togan, Melira'nın yasıyla görevini bırakır.

## Global sistemler (kurulu)
- **Diyalog:** portreli (konuşanın yüzü solda), otomatik akar + Space/E ile hızlandır/ilerlet.
  Diyalogda kamera yukarı kalkar (kutu karakteri kapatmaz).
- **Kontrol kilidi:** sinematik/diyalog boyunca oyuncu kilitli.
- **Sahne tetikleyici:** belirli alana yürüyünce sahne başlar (Area2D, `body_entered`).
- **Kamera:** Togan'a kilitli, bölüm sınırları içinde; sinematikte taban ofseti yukarı.

---

## SAHNE 1 — SESSİZ TALİM (Kaya)  ✅ KURULDU
**Mekân:** talim alanı (sol). **Karakter:** Togan, Kaya (tahta kılıç), Burkut (kazıkta), kukla.
**Öğretilen oynanış:** hareket · saldırı (J/K) · parry (L) · dodge (Shift) / takla (çift Shift) · düşme.
**Beat:**
1. Togan kuklaya 3 **ağır** vuruş (auto). Anlatı (kitabın ilk satırları).
2. Kaya gölgeden çıkar → yürür → tahta kılıç verir. Diyalog.
3. **FAZ A (SALDIR J/K):** Togan saldırır, Kaya **kayarak çekilir**. "Bu öfke bir Azgut'un... Rüzgar-Dinleyen'i öldürür."
4. **Devrilme:** büyük vuruş → Kaya yana kayar → Togan **sırtüstü düşer (dusme)**, "kalk" diyene dek yerde.
5. "Sungur kılıcı değil / Ayağa kalk / Düşmek talimin sonu değil." Togan kalkar.
6. **Üç iz** dersi.
7. **FAZ B (SAVUŞTUR L):** Kaya **art arda** vurur, 3 başarı, tempo artar. "İşte! Durma!"
8. "Demek hâlâ duyabiliyorsun / Neyi / Senden başka birini."
9. "Karşında kim var? ...mezara koyamadığın biri mi?" → Kaya yorgun gider.
10. Togan: "Bir hayalet neresinden vurulur?" → ateş kokusu hook → **kontrol serbest.**

## SAHNE 2 — ANA ATEŞ (Anya Ana)  ✅ SANAT HAZIR · diyalog kurulu · görsel kuruluyor
**Mekân:** ana ateş (x~430). **Karakter:** Anya Ana (ateşte **oturur** — sprite+portre bağlandı), Togan,
arka planda 2 çocuk (opsiyonel). **Tetik:** Togan ateşe (x~430) yürüyünce.
**Beat (kitaba sadık, yazıldı):** kâse uzatma → "Savaşçı aç karnına kılıç sallamaz" → baba rüyası
("gökyüzüne bakmayı unuttu") → Melira → "Kor-Ateşler'den ayıran ne kaldı?" → "Baban kızgın değildi."
**Yapılacak cila:** ateşi büyüt/canlandır, 2 oynayan çocuk ekle, Anya'ya kâse-uzatma anı.
**Duygu:** keder, bilgelik, suçluluk.

## SAHNE 3 — MECLİS (Han Börü)  ⏳ SANAT HAZIR · kurulacak
**Mekân:** **Han çadırı içi** (ayrı arka plan `han_cadiri.png` — kararma geçişiyle iç mekâna geçilir).
**Karakter:** Börü (Han, harita başında — idle+portre), Ozan (bone-rod, harita gösterir — idle+portre),
ihtiyarlar (jenerik), Anya da mecliste. **Tetik:** çadıra/x'e yürüyünce → iç mekâna fade.
**Beat (kitaba sadık):**
- Harita + taş bizonlar. Ozan doğu/batı gösterir; "Bizi batıya çağırıp doğudan vurabilir."
- Börü: "Korgan'ın yerinde ne yapardın?" → Togan **dalar** (Melira yangını flash: kırmızı vinyet + ses).
- Ozan: "Han seninle konuşuyor. Aklın nerede?" → Togan: "Bir yıl önceki yangında..."
- Togan planı okur: "Geçit yem. Korgan şafakta sığlıktan gelir; batıya çekmiş gibi doğudan vurur."
- Börü: "**Senin ilk görevin bu oba. Bu yemin.** Babam seni kendi oğlundan ayırmadı."
**Oynanış:** diyalog + harita üstünde bakış; kanon değişmez (planı Togan söyler).

## SAHNE 4 — ŞAFAK / KAÇIŞ  ⏳ kısmen sanat · kurulacak
**Mekân:** Togan çadırı + oba, **şafak** (bg `safak_bozkir.png`'e döner — zaman atlar).
**Karakter:** Togan, **nomad çocuk** (eyer kayışı — idle hazır). **Tetik:** meclisten çıkınca.
**Beat (kitaba sadık):**
- Oba savaşa hazırlanır (arka planda hareket). Togan **gizlice heybe** toplar (kuru et, tulum,
  Melira'nın kemik tokası). "Bağışlayın beni. Yapamıyorum."
- Çocuk eyer kayışıyla gelir → Togan bağlar → "Kaya'nın sözünü dinle" (doğruyu söylemez).
**Oynanış:** obada yürü · çocukla etkileşim (E) · heybeyi al.
**Küçük eksik:** heybe/toka propları (istenebilir).

## SAHNE 5 — AYRILIŞ (at Bozkır)  ⏳ SANAT HAZIR · kurulacak
**Mekân:** at çiti → açık bozkır (şafak). **Karakter:** Togan, **Bozkır** (at — idle + **binili idle/koşu** hazır), Burkut.
**Beat (kitaba sadık):**
- Togan kılıç/yay kuşanır → çite gider. Bozkır burnunu göğsüne dayar. "Gidiyoruz, dostum."
- **Biner** (idle→binili). Son çadırı geçince durur, bakar; ateşler kül rengi sönüyor.
- Dizgin çevirir → **dörtnala** açılır. Son ateş tepe ardına gömülünce **Burkut kuzeye havalanır.**
- **BÖLÜM BİTER** → Bölüm 2 köprüsü (kapanış kartı: "Birinci Bölüm sonu").
**Oynanış:** ata bin · dörtnala uzaklaş (yatay sürüş) · Burkut uçar.

---

## GEÇİŞLER
- 1→2: yürüyerek (aynı mekân, ateşe doğru).
- 2→3: çadıra giriş → **kararma** → Han çadırı iç mekânı.
- 3→4: çıkış → **şafak** bg (zaman atlar).
- 4→5: çite yürü → ata bin → bozkıra açıl → kapanış.

## ASSET DURUMU
**Var:** Togan (tam moveset), Kaya (tam), Burkut, kukla, Anya (oturuş+portre), Börü (idle+portre),
Ozan (idle+portre), çocuk (idle), at (idle + binili idle/koşu), arka planlar (bozkır/Han çadırı/şafak),
portreler (Togan/Kaya/Anya/Börü/Ozan). **Eksik/opsiyonel:** heybe+kemik toka propları, 2 oynayan
çocuk sahnesi, jenerik ihtiyar/köylü kalabalığı, ses/müzik.

## SIRADAKİ UYGULAMA (ben, sırayla)
1. **Sahne 2 cilası** (Anya kâse, ateş büyüt, çocuklar).
2. **Sahne 3** — Han çadırı iç mekân sahnesi (Börü/Ozan yerleşimi, meclis diyaloğu, Melira flash).
3. **Sahne 4** — şafak geçişi + çocuk + heybe + firar diyaloğu.
4. **Sahne 5** — biniş + dörtnala ayrılış + Burkut + kapanış kartı.

> Bu belge Bölüm 1'in tam iskeleti. Her sahne buradaki beat'lere göre, kitaba birebir kurulur.
