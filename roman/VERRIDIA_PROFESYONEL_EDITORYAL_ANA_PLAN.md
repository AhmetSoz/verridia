# VERRIDIA — PROFESYONEL EDİTORYAL ANA PLAN

**Başlangıç tarihi:** 21 Temmuz 2026  
**Ana hedef:** Türkçe ana metni, üç kitap boyunca olay örgüsü ve kanonu kapanmış; dili, baskı yapısı ve okur deneyimi profesyonel yayına hazır bir seri hâline getirmek.  
**Öncelik:** Yalnız kitaplar. Site, video ve oyun geliştirmesi bu planın dışındadır. Site okuyucu verisi yalnız kitap metniyle eşzamanlı kalması gerektiğinde yeniden üretilir.

## 1. Kilit Durumu

| Kitap | Kısım | Dijital bölüm | Güncel kelime | Durum |
|---|---:|---:|---:|---|
| Birinci Kitap — *Kızıl Hafta* | 4 | 53 | 50.123 | Türkçe kaynak kilitli; 15 fasıllık baskı katmanı doğrulandı |
| İkinci Kitap — *Dört Yol, Ayrı Mühürler* | 8 | 182 | 79.066 | Türkçe kaynak kilitli; 50 fasıllık baskı katmanı doğrulandı |
| Üçüncü Kitap — *Tam Seçim* | 5 | 123 | 49.033 | Türkçe kaynak kilitli; 31 fasıllık baskı katmanı doğrulandı |
| **Toplam** | **17** | **358** | **178.250** | Üç kitabın kaynak, baskı, site, kanon, nesir ve editoryal testleri temiz |

## Türkçe kaynak kilidi — 21 Temmuz 2026

- On beş bağımsız tarama kanıtlarıyla kapandı.
- Birinci, İkinci ve Üçüncü Kitabın tek parça baskı derlemeleri kaynaklardan otomatik üretiliyor.
- Baskı fasılları sırasıyla 15, 50 ve 31; her fasıl 650–5.500 kelimelik yayın ritmi sınırında.
- `npm test`, 358 kaynak bölümün kanon, kimlik, ölüm sonrası görünüm, nesir, baskı ve site eşleşmesini doğruluyor.
- Karanlık Varlık, Aldric ve alınanlar, eski Malakor ajanları, Derin-Yosun kıtlığı ve yeni Yamalı Liman sorunları kazara açık değil; sahipleri ve final sınırları kayıtlı kasıtlı açıklardır.

Otomatik kontroller dosya sayısını, kanon sabitlerini, nesir uyarılarını, üç kitabın baskı sırasını ve kaynak–site eşleşmesini denetler. Editoryal kayıtlar sahne işlevi, bilgi sahipliği, sebep-sonuç, zaman, coğrafya, karakter psikolojisi, hazırlık–karşılık ve kasıtlı açıkları ayrıca kilitler.

## 2. “Hiçbir Açık Bırakmamak” Ne Demektir?

Her gizemi açıklamak değildir. Üç tür durum birbirinden ayrılacaktır:

1. **Kapanmış:** Metin soruyu sormuş ve kitap/seri söz verdiği karşılığı vermiştir.
2. **Kasıtlı açık:** Gelecek kitaba veya daha büyük seriye bırakılmıştır; yazar defterinde sahibi, işlevi ve en geç karşılık noktası yazılıdır.
3. **Kazara açık:** Unutulmuş karakter, sonuçsuz karar, çelişkili bilgi, kaybolan nesne, açıklanmayan davranış veya cevapsız bırakıldığı fark edilmeyen gizemdir. Yayın ana metninde bunlardan hiç kalmayacaktır.

Belirsizlik korunabilir; sahipsiz belirsizlik korunamaz.

## 3. Editoryal Yetki ve Değişmez İlkeler

- Olay örgüsü, sahne sırası, karakter kararı, ölüm, yara, ilişki, bölüm birleşimi ve anlatım değiştirilebilir; her değişiklik daha güçlü sebep-sonuç ve daha doğru karakter davranışı üretmelidir.
- Rastgele şok, yalnız hacim kazanmak için yan olay ve mevcut kanona sonradan yapıştırılmış güç eklenmez.
- Retcon gerekiyorsa tek cümlede bırakılmaz; önceki hazırlığı, sonraki sonucu, külliyatı, planı, baskı derlemesini ve site verisini birlikte değiştirir.
- İsimler yalnız kanıtlanmış okur karışıklığı veya çeviri sorunu varsa değiştirilir. Karakter adları çevirilerde korunur.
- Bir sahne güzel yazıldığı için değil; kitaba gerekli olduğu için kalır.
- Bir sahne zayıf olduğu için hemen silinmez; önce taşıması gereken dramatik iş belirlenir.
- Türkçe ana metin kilitlenmeden İngilizce veya İspanyolca çeviriye başlanmaz.
- Kaynak bölüm dosyaları esastır. Baskı ve site metni kaynaklardan üretilir; ayrı ve elle yaşatılan roman kopyaları oluşturulmaz.

## 4. Kaynakların Yetki Sırası

Çelişki hâlinde aşağıdaki sıra uygulanır:

1. Onaylanmış Türkçe roman sahnesi,
2. `kulliyat/23_guncel_kanon_karti.md`,
3. olay ve karar defteri,
4. ilgili dünya/kültür/devlet külliyatı,
5. kitap ve kısım planları,
6. tarihsel çalışma notları.

Bir alt kaynak üst kaynakla çelişiyorsa sessizce yorumlanmaz; çelişki kayda alınır ve bütün bağımlı dosyalar tek kararla düzeltilir.

## 5. Çalışma Sırası

### AŞAMA 0 — Güvenli başlangıç ve temel fotoğraf

**Amaç:** Yapılan işi kaybetmeden, hangi metnin incelendiğini kesinleştirmek.

- Mevcut Finn–Suna–Togan/Kaya değişikliklerinin diff ve test sonucu son kez okunacak.
- Kaynak dosya, üretilen dosya ve tarihsel not ayrımı belgelenecek.
- Her kitap için bölüm, kelime, POV ve kısım dağılımı çıkarılacak.
- Editoryal sorunlar `P0–P3` önem derecesiyle kaydedilecek:
  - **P0:** Kanonu veya ana olay örgüsünü bozan çelişki.
  - **P1:** Karakter kararını, finali veya büyük hazırlık-karşılığı zayıflatan sorun.
  - **P2:** Sahne ritmi, tekrar, POV sesi veya açıklık sorunu.
  - **P3:** Yazım, noktalama, küçük sözcük ve biçim sorunu.
- Her aşama ayrı Git kontrol noktası olacak; üretilen dosyalar kaynak metinden sonra güncellenecek.

**Çıkış kapısı G0:** Çalışma alanındaki her değişikliğin kaynağı ve amacı biliniyor; testler temiz; hiçbir dosya yanlışlıkla kapsamda değil.

### AŞAMA 1 — Kanon İncili ve izleme tabloları

**Amaç:** Üç kitap boyunca tek bir doğruluk sistemi kurmak.

Altı bağlayıcı kayıt hazırlanacak:

1. **Karakter matrisi:** ad, yaş, cinsiyet, görünüş, yara, ölüm, ilişki, amaç, korku, sır, değişim, ilk/son görünüm.
2. **Zaman çizelgesi:** gün, ay, mevsim, Kızıl Hafta günü, yolculuk süresi, yara iyileşmesi, haberin ulaşma süresi.
3. **Coğrafya ve lojistik matrisi:** iki yer arası uzaklık, taşıt, normal/acil yolculuk süresi, ikmal ve hava koşulu.
4. **Bilgi sahipliği matrisi:** her önemli gerçeği kim, hangi bölümde, hangi kesinlik düzeyinde biliyor.
5. **Sır ve vaat defteri:** kurulan soru, ilk ipucu, yanlış ihtimal, gelişme, karşılık, kasıtlı açık bırakılacaksa en geç tarih.
6. **Bedel ve sonuç defteri:** ölüm, yara, kayıp, siyasi karar, borç, ihanet ve bunların sonraki görünür etkileri.

Özellikle Kaya'nın cinsiyeti ve geçmişi, Bozan–Korgan ilişkisi, Togan'ın kan yetisi, Finn'in ölümü, Suna'nın kalıcı yarası, Togan'ın anı kaybı, Sungur özerkliği, Malakor makamı ve Dört Bayrak yapısı yeniden çapraz denetlenecek.

**Çıkış kapısı G1:** Aynı gerçek iki dosyada farklı anlatılmıyor; kasıtlı belirsizliklerin tamamı etiketli; kazara açık uç listesi çıkarılmış.

### AŞAMA 2 — Üç kitaplık büyük mimari ve Üçüncü Kitap sonu

**Amaç:** İlk iki kitabı son kez cilalamadan önce serinin nereye gittiğini kesinleştirmek.

- Serinin ana dramatik sorusu tek cümlede yazılacak.
- Her kitabın kendi vaadi, doruk noktası, bedeli ve kapanış durumu belirlenecek.
- Dört ana POV için başlangıç–yanlış inanç–sınav–geri dönüşsüz karar–kitap sonu değişimi çıkarılacak.
- Yan karakterler “işlev” değil “amaç ve sonuç” üzerinden denetlenecek.
- Üçüncü Kitabın bir seri finali mi yoksa daha büyük seride bir cilt finali mi olduğu bağlayıcı karara dönüştürülecek.
- Üçüncü Kitap finalinden geriye doğru hazırlık haritası kurulacak.
- Şu açık hatların her biri için `bu kitapta kapanır / sonraya kalır / dönüşür` kararı verilecek:
  - Büyük Döngü'nün aktif fazı,
  - Yeşil-Göz Sable ve özgür iradesi,
  - Togan'ın tam seçimi,
  - Malakor–Ferrin–Coren–Amara zinciri,
  - Sube ve Temir'in Karakçı sonrası durumu,
  - Işık Seddi,
  - deniz taşı ve Sessiz Taşlar,
  - Karanlık Varlık'ın ne kadarının açıklanacağı.
- Kitap 3 planlarındaki tekrar, eski başlık ve ara taslak kalıntıları temizlenecek.

**Çıkış kapısı G2:** Üçüncü Kitabın son sahnesi ve ana karakterlerin son durumu biliniyor; önceki kitaplara eklenmesi gereken bütün hazırlıklar listeli.

### AŞAMA 3 — Üçüncü Kitabın tamamlanması

**Amaç:** Mevcut 75 bölümü ve onaylı iki final kısmını baştan sona tam bir romana dönüştürmek.

- Önce mevcut üç kısmın 75 bölümü sahne kartlarına ayrılacak.
- Her sahne için şu alanlar doldurulacak: POV, zaman, yer, istek, direnç, dönüş, bedel, yeni bilgi, karakterin bildiği şey, hazırlık/karşılık, sonraki durum.
- “Büyük Döngü” hattı 24. bölümde aktif fazın ilk kalıcı kaybıyla kapandı.
- Kalan kısım ve bölümler, finalden geriye doğru tasarlanacak.
- Her dört POV yalnız sırayla görünmek için değil, aynı ana çatışmaya farklı ve vazgeçilmez bir baskı uygulamak için kullanılacak.
- Taslak tamamlanınca hacim, sahnenin ihtiyacına göre oluşacak; yalnız hedef sayıya ulaşmak için metin şişirilmeyecek. Önceki 75–85 bin kelime tahmini bağlayıcı değildir.
- Yeni bölüm yazıldıkça kanon ve açık uç defteri aynı anda güncellenecek.

**Çıkış kapısı G3:** Üçüncü Kitabın başından sonuna tam metni var; geçici not, “sonra karar verilecek” olay veya sahipsiz gizem yok.

### AŞAMA 4 — Birinci Kitap yapısal ve içerik editörlüğü

**Amaç:** Okurun Verridia'ya girişini, serinin geri kalanına söz veren güçlü ve kendi başına tatmin edici bir romana dönüştürmek.

- 53 bölüm için gereklilik ve sahne kartı denetimi.
- İlk 50 sayfada karakter, dünya, çatışma ve okuma vaadinin açıklığı.
- Dört ayrı coğrafyanın bilgi dökmeden anlaşılması.
- POV geçişlerinde merak ve duygusal ivme.
- Togan'ın ayrılışının ahlaki bedeli; Temujin'in hırsının erken gölgesi; Karia'nın tahta giden yolu; Zaleena'nın Roric'le güç ilişkisi.
- Finn'in kitap boyunca görünürlüğü ve ölümünün yeterli hazırlığı.
- Kaya'nın ilk tanıtımından itibaren kadın, süt abla, savaşçı ve siyasi özne kimliğinin karışmayacak kadar açık olması.
- Kızıl Hafta doruğunun dört hatta da yeterli hacim ve sonuç taşıması.
- Kitap 2'ye açılan kapıların kendi finalini gölgelememesi.
- 50 bin kelimelik hacim tür ortalamasına yetişmek için değil, eksik dramatik sahne varsa büyütülecek.

**Çıkış kapısı G4:** Kitap 1 kendi başına tamamlanmış hissettiriyor; seri vaatlerini kuruyor; her ana kararın hazırlığı ve sonucu var.

### AŞAMA 5 — İkinci Kitap yapısal ve içerik editörlüğü

**Amaç:** 182 mikro bölümün dijital hızını korurken 50 fasıllık basılı romanda parçalı veya bürokratik hissettirmemesini sağlamak.

- Dijital bölüm sırası ile basılı fasıl ritmi birlikte okunacak.
- Her 50 fasıl için ana soru, iç gerilim ve kapanış darbesi belirlenecek.
- Kısa köprü sahneleri tekrar, rapor özeti ve sahte ilerleme açısından denetlenecek.
- Kurumlaşma ve sözleşme sahnelerinde siyasi fikir ile kişisel bedel dengelenecek.
- Togan–Temujin ilk karşılaşmasının birikimi ve karşılığı ölçülecek.
- Korgan–Temujin yakınlaşması aşamalı ve güvensiz kalacak.
- Karia ve Zaleena'nın kurumları kolay başarıya dönüşmeyecek; itiraz ve maddi sonuç korunacak.
- Suna'nın yarası ile Togan'ın anı kaybının final boyunca görünür sonucu korunacak.
- Finaldeki ayrı mühürlerin hukuki açıklığı kadar duygusal karşılığı da bulunacak.

**Çıkış kapısı G5:** Dijital ve basılı iki okuma biçimi de doğal; final yalnız belge özeti değil, karakterler için geri dönülmez bir sonuç.

### AŞAMA 6 — Üçüncü Kitap yapısal editörlüğü

**Amaç:** Yeni tamamlanan metni ilk iki kitapla aynı sertlikte sınamak.

- Kaya ve Karakçı ölümlerinin ucuz şok veya yalnız motivasyon aracına dönüşmemesi.
- Temujin'in gri kararlarının siyasi ve kişisel sonucunun sürmesi.
- Togan'ın suçluluğunun pasif tekrar yerine kararlarını değiştirmesi.
- Karia ve Zaleena'nın kurdukları kurumların gerçek kriz altında sınanması.
- Kozmik tehdidin kuralları açıklanırken bilinmeyenin dehşetinin korunması.
- Finalin hem bu kitabın ana çatışmasını kapatması hem kasıtlı seri açıklarını dürüstçe bırakması.

**Çıkış kapısı G6:** Kitap 3 önceki kitapların karşılığını veriyor; yeni çatışmaları yalnız büyütmüyor, seçilmiş olanları sonuçlandırıyor.

## 6. Üç Kitap Boyunca Yapılacak 15 Bağımsız Tarama

Aynı metin körlemesine on beş kez okunmayacak. Her taramada yalnız bir soru ailesine odaklanılacak; böylece gözün alışıp hatayı atlaması önlenecek.

| No | Tarama | Aranan hata |
|---:|---|---|
| 1 | Kimlik ve fiziksel süreklilik | yaş, cinsiyet, akrabalık, görünüş, yara, ölüm, kullanılan el, hayvan ve eşya |
| 2 | Zaman | gün, gece, mevsim, iyileşme, haber ve olay sırası |
| 3 | Coğrafya ve yolculuk | mesafe, rota, taşıt, hava, ikmal, imkânsız hız |
| 4 | Bilgi sahipliği | karakterin öğrenmediği şeyi bilmesi veya öğrendiğini unutması |
| 5 | Sebep–sonuç | olayın yalnız plan istediği için gerçekleşmesi; kararın sonuç bırakmaması |
| 6 | Karakter amacı ve psikoloji | motivasyon sıçraması, kolay ikna, kişiliğe aykırı karar |
| 7 | Güç ve kozmoloji kuralları | Togan'ın yetisi, Akıntı, Sed, taşlar, bedel ve sınır ihlali |
| 8 | Siyaset ve kurumlar | yetki, mühür, özerklik, komuta, hukuk ve kurul kararlarının çelişmesi |
| 9 | Ekonomi ve lojistik | asker, gemi, erzak, para, ilaç, nüfus ve üretim kapasitesi |
| 10 | Vaat–ipucu–karşılık | unutulan gizem, hazırlıksız sürpriz, fazla açık foreshadowing |
| 11 | Kayıp ve sonuç | ölüm/yara/ihanetin sonraki kitapta unutulması veya kolay iyileşmesi |
| 12 | Yapı ve tempo | gereksiz sahne, eksik sahne, tekrar eden kurul/toplantı/yolculuk ritmi |
| 13 | POV ve ses | anlatıcı taşması, dört POV'un aynı cümlelerle düşünmesi |
| 14 | Diyalog ve alt metin | bilgi dökümü, herkesin veciz konuşması, çağdaş veya yapay çeviri tonu |
| 15 | Türkçe, kopya ve biçim | gramer, noktalama, sözcük tekrarı, klişe, tire, başlık ve baskı tutarlılığı |

Her taramanın sonunda bulunan sorunlar dosya ve bölüm düzeyinde kaydedilecek; “gözden geçirildi” tek başına tamamlanma kanıtı sayılmayacak.

## 7. Satır Editörlüğü

Yapısal metin kilitlendikten sonra üç kitap sırayla satır satır işlenecek:

1. Anlatı cümlesinin doğal Türkçe akışı,
2. İngilizce söz dizimi ve dramatik tersine çevirme izleri,
3. soyut duygu etiketi yerine somut davranış,
4. gereksiz benzetme ve süslü cümle,
5. filtre fiilleri ve dolaylı anlatım,
6. paragraf ritmi ve cümle uzunluğu,
7. tekrar eden kelime, hareket, kapanış ve imge,
8. karaktere özgü iç ses,
9. diyalog kimliği ve alt metin,
10. sahne sonunda açıklama fazlası.

Bir cümle tek başına güzel olduğu hâlde sahnenin ritmini bozuyorsa değiştirilecek. Diyaloglar da dokunulmaz değildir; karakter niyeti korunarak doğallık, alt metin ve ses için düzenlenebilir.

## 8. Kopya Editörlüğü ve Son Okuma

- Yazım ve noktalama standardı tekleştirilecek.
- Özel adlara gelen ekler, birleşik kelimeler, sayı ve tarih yazımı denetlenecek.
- Büyük/küçük harf, unvan, kurum, tür ve yaratık adları sözlüğe bağlanacak.
- Tırnak, italik, düşünce, mektup, kayıt ve bölüm ayraçları tek biçime getirilecek.
- Kitap başından sonuna “temiz okuma” yapılacak; bu turda yeniden yazım değil yalnız kanıtlanabilir hata düzeltilecek.
- Son düzeltmeden sonra değiştirilmiş her sayfa tekrar okunacak; düzeltmenin yeni hata üretmediği doğrulanacak.

## 9. Okur Deneyimi Denetimi

Üç ayrı okuma merceği kullanılacak:

1. **İlk kez okuyan:** Kim kimdir, neden önemlidir, nerede geçiyor, neyi merak etmeliyim?
2. **Fantastik/politik roman okuru:** Dünya kuralları, entrika, bedel, şaşırtıcılık ve karakter ahlakı yeterince güçlü mü?
3. **Çeviri editörü:** Cümle, isim, unvan, kelime oyunu ve kültürel kavram başka dilde yanlış anlaşılmaya açık mı?

Mümkün olan son aşamada metni daha önce görmemiş en az bir insan okurun geri bildirimi alınacak. Geri bildirim otomatik uygulanmayacak; tekrar eden okur sorunu kanıt sayılacak.

## 10. Yayın Ana Dosyaları

Her kitap için ayrı teslim paketi üretilecek:

- kilitli Türkçe kaynak metin,
- basılı fasıl/bölüm manifesti,
- tek parça baskı metni,
- içindekiler ve ön/arka metinler,
- karakter ve terim sözlüğü,
- spoiler kontrollü kısa kitap özeti,
- kapak arkası metni,
- EPUB ve PDF üretimine uygun temiz dosya,
- son kelime/bölüm/POV raporu,
- açık bırakılan seri sırlarının yalnız yazara ait listesi.

Birinci Kitap için baskı katmanı sıfırdan kurulacak. İkinci Kitabın mevcut 50 fasıllık manifesti nihai ritim okumasından sonra kilitlenecek. Üçüncü Kitabın basılı yapısı tam metin bittikten sonra belirlenecek.

## 11. Çeviriye Hazırlık

Türkçe üç kitap kilitlendikten sonra:

- Türkçe–İngilizce–İspanyolca isim ve terim rehberi,
- çevrilmeyecek özel adlar listesi,
- POV ses rehberi,
- unvan, kurum, yaratık ve büyü karşılıkları,
- kültürel açıklama gerektiren kavramlar,
- Börü/Boru ve Kael/Kaelan gibi görsel-fonetik karışıklık listesi hazırlanacak.

İspanyolca metin İngilizce çevirinin çevirisi olmayacak; Türkçe ana metin ve ortak rehber esas alınacak.

## 12. Otomasyon ve Test Geliştirmeleri

Mevcut kontrollere aşamalı olarak şunlar eklenecek:

- ölü karakterin sonraki canlı sahnede görünmesi,
- yaş/cinsiyet/akrabalık sabitleri,
- bölüm ve plan tekrarları,
- basılı manifestte eksik veya çift sahne,
- aynı isim ve fazla benzer isim uyarıları,
- zaman damgası ve POV başlığı kapsamı,
- yasaklı/geçici taslak ifadeleri (`TODO`, `sonra`, `isim henüz konmadı` gibi),
- site ve baskı metninin kaynakla eşleşmesi,
- kelime, bölüm ve kısım sayılarının tek raporda doğrulanması.

Otomatik test edebî karar vermez; unutmayı ve mekanik çelişkiyi azaltır. Her otomatik sonuç insan bağlamıyla okunacaktır.

## 13. Bir Kitabın “Tamamlandı” Sayılma Şartları

Bir kitap ancak aşağıdakilerin tamamı sağlanınca kilitlenir:

- Ana çatışması sonuçlanmış ve karakterlerde geri dönülmez değişim bırakmış.
- Bütün sahnelerin isteği, direnci ve dönüşü var; köprü sahneler bilinçli kısa.
- Kazara açık uç, açıklanmamış motivasyon ve hazırlıksız büyük sürpriz yok.
- Karakter, zaman, coğrafya, bilgi, güç ve siyasi süreklilik taramaları temiz.
- Dört POV'un sesi ayırt edilebilir.
- Satır ve kopya editörlüğü tamamlanmış.
- Baskı yapısı baştan sona okunmuş.
- Otomatik testler geçiyor.
- Son düzeltmeden sonra temiz okuma yapılmış.
- Üretilen baskı/site dosyaları kaynak metinle eşleşiyor.

## 14. Uygulama Önceliği

Profesyonel sıra şöyledir:

1. Mevcut değişiklikleri kapat ve temel fotoğrafı al.
2. Kanon İncili ile izleme matrislerini kur.
3. Üç kitaplık mimariyi ve Üçüncü Kitap sonunu kilitle.
4. Üçüncü Kitabı tamamla.
5. Birinci, İkinci ve Üçüncü Kitabı yapısal olarak sırayla düzenle.
6. On beş çapraz taramayı üç kitap boyunca uygula.
7. Satır editörlüğü ve kopya editörlüğünü yap.
8. Baskı ana dosyalarını üret ve temiz okuma yap.
9. Türkçe ana metni kilitle.
10. Ancak bundan sonra çeviri hazırlığına geç.

Bu sıra önemlidir. Üçüncü Kitabın sonu bilinmeden Birinci Kitabı baskıya kilitlemek, sonradan gerekli olacak ipuçlarını ve karakter hazırlıklarını kaçırma riski taşır.
