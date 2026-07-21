# VERRIDIA — EDİTORYAL DENETİM PANOSU

**Yetki tarihi:** 21 Temmuz 2026  
**Kaynak kapsamı:** 3 kitap · 17 kısım · 358 dijital bölüm · 178.222 kelime  
**Amaç:** Türkçe ana metnin yapısal, kanonik, psikolojik ve dilsel kilit durumunu tek yerde izlemek.

## Durum anahtarı

- **TEMİZ:** Tarama yapıldı; açık sorun yok.
- **DÜZELTİLDİ:** Sorun bulundu, kaynak metin ve bağımlı kayıtlar eşitlendi.
- **KASITLI AÇIK:** Üçleme içinde kapanmaması bilinçli; sahibi ve işlevi kayıtlı.
- **BEKLİYOR:** Henüz ayrı tarama yapılmadı.

## Çıkış kapıları

| Kapı | Kapsam | Durum | Kanıt |
|---|---|---|---|
| G0 | Kaynak/üretilen dosya ayrımı, sayısal fotoğraf | TEMİZ | `npm test`; kaynaklar `roman/`, üretilen site verisi ve baskı derlemesi ayrı |
| G1 | Kimlik, zaman, coğrafya, bilgi, vaat ve bedel kayıtları | TEMİZ | Bu klasördeki 01–04 matrisleri |
| G2 | Üçleme mimarisi ve final kararı | TEMİZ | `kulliyat/23_guncel_kanon_karti.md`, Kitap 3 Kısım 5 |
| G3 | Üçüncü Kitap tam metni | TEMİZ | 5 kısım, 123 bölüm; geçici bölüm yok |
| G4 | Birinci Kitap yapısal edit | TEMİZ | 53 bölüm; Finn, Kaya, Kızıl Hafta ve dört POV karşılıkları çaprazlandı |
| G5 | İkinci Kitap yapısal edit | TEMİZ | 182 bölüm; 50 fasıllık baskı manifesti doğrulanıyor |
| G6 | Üçüncü Kitap yapısal edit | TEMİZ | 123 bölüm; Kaya/Karakçı/Sable/Malakor/Hasat sonuç zinciri doğrulandı |
| G7 | 15 bağımsız tarama | TEMİZ | `05_TARAMA_KAYDI.md` |
| G8 | Satır ve kopya editörlüğü | TEMİZ | `check:nesir` 358/358; dört POV ses profili kilitli |
| G9 | Baskı ana dosyaları ve temiz yayın okuması | TEMİZ | 15 + 50 + 31 fasıl; kaynak–baskı birebir eşleşme testi temiz |
| G10 | Türkçe ana metin kilidi | TEMİZ | 358 bölüm; `npm test` tam geçti; 21 Temmuz 2026 |

## Bu turda bulunan önemli sorunlar

| Önem | Sorun | Karar | Durum |
|---|---|---|---|
| P1 | Karia ile Zaleena'nın POV ses profilleri yazım anayasasında ters başlıklara bağlanmıştı | Karia `kurum/kanıt/yetki`, Zaleena `iş/deniz/lojistik` olarak düzeltildi ve kanon testine bağlandı | DÜZELTİLDİ |
| P1 | Sube bazı ara kayıtlarda Sungur büyücüsü ve Kaya seferinin sağ kalanı sayılmıştı | Sube Azgut/Genç Kurt haber ağı kurucusu; Karakçı hattında gönüllü aracı ve açık tanık | DÜZELTİLDİ |
| P1 | Kaya'nın ölümü bazı özetlerde ekibin merkeze inmesi ve `bunu bana borçlusun` sözüyle anlatılıyordu | Ekip durdurma kuralına uydu; ölüm geri çekilmede oldu; son söz yalnız `Togan. Yaşa.` | DÜZELTİLDİ |
| P1 | Karakçı'nın ölüm nedeni Temujin'in kararına kesin bağlanıyordu | Katil ve kesin sebep bilinmiyor; gizli temasın hedef yaratmış olabileceği açık risk | DÜZELTİLDİ |
| P1 | Togan'ın yetisi uzaktan mühür, niyet ve tehlike sezgisine genişliyordu | Yalnız Akıntı'yla değişmiş maddeye sınırlı bedensel tepki; yanıldığı kör deneyler metinde | DÜZELTİLDİ |
| P1 | “Dört Bayrak” eski özetlerde aynı belgeyi imzalayan dört üyeli federasyon sanılıyordu | Kurucu dört bozkır mührü ve iki bağlı protokol ayrıldı; ad siyasi/tematik şemsiye | DÜZELTİLDİ |
| P1 | Kitap 3 Kısım 3'te Karia hattı altı ay, Zaleena hattı üç ay ilerlemiş görünüyordu | Meziyet ara denetimi üçüncü aya çekildi; iki etkin kurul ve dokuz hazırlık dosyası yapıldı | DÜZELTİLDİ |
| P2 | Sarıkavak ve Neris isim/yer sicilinde yoktu | Harita ve isim siciline eklendi | DÜZELTİLDİ |
| P1 | Neris bir sahnede Amara'nın elçisi olarak tanıtılmıştı | Yamalı Liman'ın dış denetim arşivcisi kimliği sahnede ve sicilde düzeltildi | DÜZELTİLDİ |
| P2 | Site kelime sayacı redaksiyon sonrası eski değerdeydi | 178.222 kaynak kelime / sitede 178 bin olarak yeniden üretildi | DÜZELTİLDİ |

## Kasıtlı açıklar

| Açık | Sahibi | Neden kapanmıyor | Üçleme finalindeki sınır |
|---|---|---|---|
| Karanlık Varlık'ın kimliği ve bütünü | Yazar katmanı | Sonraki seri için kozmik rezerv | Etkin Hasat bağı kesildi; varlık açıklanmadı |
| Aldric ve alınanların kesin akıbeti | Perren/Togan hattı | Togan'ın gerçek seçiminin bedeli cevaplardan vazgeçmek | Bilinen Sed yolu kapandı; akıbet doğrulanmadı |
| Eski Malakor ajanları | Siyasi sonuç hattı | Makamın tasfiyesi bütün eski suçluları yok etmez | Makam, bütçe ve otomatik halefiyet geri dönmez |
| Derin-Yosun sonrası kıtlık | Dünya/siyaset hattı | Zaferin uzun vadeli bedeli | Kriz başladı; mucizevi çözüm verilmedi |
| Yeni Yamalı Liman'ın mülkiyet düzeni | Zaleena hattı | Yeniden kuruluş sonraki dünyevi çatışma | Eski mülkiyet otomatik ayrıcalık sağlamaz |

## Kilit sonrası işler

1. Kaynağı yeniden açmadan önce değişikliğin hangi kapıyı etkilediğini bu panoya kaydetmek.
2. Mümkün olduğunda dış beta/son okur geri bildirimini ayrı listelemek; tekrar eden somut sorun yoksa kilitli metni keyfî biçimde oynatmamak.
3. İngilizce ve İspanyolca çeviri için ortak terim, özel ad ve POV ses rehberini hazırlamak.
