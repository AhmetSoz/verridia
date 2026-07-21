# VERRIDIA — İKİNCİ KİTAP DERİNLEŞTİRME VE BASKI PLANI

**Başlangıç tarihi:** 21 Temmuz 2026

## Sorun ve Çözüm

İkinci Kitap'ın 182 dijital bölümü başlangıçta toplam 42.053 kelimeydi. Derinleştirme sonunda metin 78.825 kelimeye ulaştı. Dijital bölüm yapısı korunurken basılı okuma için 50 fasıllık otomatik derleme katmanı eklendi.

Çözüm iki katmanlıdır:

- **Kanonik sahne katmanı:** Mevcut 182 dosya korunur ve derinleştirme doğrudan bu dosyalarda yapılır.
- **Basılı okuma katmanı:** Ardışık sahneler, çoğunlukla bir Togan–Temujin–Karia–Zaleena dönüşünü kapsayan fasıllar altında birleştirilir. Aynı metnin ikinci bir kopyası oluşturulmaz; basılı sürüm bu dosyalardan derlenir.

Başlangıç hacmi: **42.053 kelime**  
Hedef hacim: **75–82 bin kelime**  
Tamamlanan hacim: **78.825 kelime**  
Basılı yapı: **8 kısım, 50 fasıl, fasıl içinde açık POV geçişleri**

## Kısım Hedefleri

| Dijital kısım | Mikro bölüm | Başlangıç | Hedef | Basılı fasıl | Derinleştirme odağı |
|---|---:|---:|---:|---:|---|
| Hafızanın Bedeli | 53 | 13.539 | 18.009 | 14 | Ayla/Sed arayışı, Temujin'in kopuşu, iki kraliçenin Delta baskısıyla sınanması |
| Kâhyaların Diyarı | 36 | 7.916 | 16.308 | 9 | Togan–Temujin karşılaşmasının kazanılması, Genç Kurtların bağımsızlığının bedeli |
| Kazanılan Denge | 19 | 4.186 | 7.247 | 5 | Sarris'in düşüşü, ilişkilerin kamusallaşması, kurumların ilk gerçek itirazları |
| Bağlı Ufuklar | 14 | 3.344 | 7.435 | 4 | Kael dosyası, Toruk'un güvenli ifadesi, dört POV buluşmasının gerilimi |
| Aynı Rüzgârın Dört Yönü | 21 | 4.753 | 8.358 | 6 | Kuru Dere'nin işleyişi, Meziyet Programı ve Korgan kanalının yavaş kurulması |
| Gölgenin Ardındaki Işık | 17 | 3.640 | 7.629 | 5 | Malakor'un makam olabileceğine ilişkin kurumsal soruşturma ve Bozan kanıt zinciri |
| Büyük Uzlaşma | 13 | 2.720 | 7.372 | 4 | Togan'ın bedelli güç sınırı, Toruk'un açık ifadesi, Tuz Düzlüğü müzakeresi |
| Dört Yol, Ayrı Mühürler | 9 | 1.955 | 6.467 | 3 | Kuru Dere baskını, Delta kurul oyu, ayrı mühürlü sözleşmeler ve eksik zafer |

## Basılı Fasıl Mantığı

1. Normal dönüşlerde dört ardışık POV sahnesi tek fasıl oluşturur; sahneler kendi POV başlıklarını korur.
2. Ortak buluşma, saldırı, kurul oyu ve kitap finali gibi büyük olaylar bağımsız fasıl olabilir.
3. Bir fasıl yalnız kronolojik komşuluk yüzünden kurulmaz; dört sahnenin aynı soru veya sonucu taşıması gerekir.
4. Dijital bölüm numaraları kanondur. Basılı fasıl numaraları sunum katmanıdır ve olay referanslarında kullanılmaz.
5. Basılı derleme işlemi otomatik olmalı; elle kopyalanmış ikinci roman ağacı oluşturulmayacak.

## Derinleştirme Önceliği

Her mikro bölüm aynı oranda uzatılmayacak.

- **A sınıfı sahneler:** Saldırı, yüzleşme, siyasi karar, ilişki kırılması, güç kullanımı. 700–1.400 kelimeye kadar tam sahne.
- **B sınıfı sahneler:** Hazırlık, soruşturma, yolculuk içinde ilişki değişimi. 450–800 kelime.
- **C sınıfı köprüler:** Zaman geçişi ve sonuç kaydı. 200–450 kelime; gerekirse komşu basılı fasılda kısa tutulur.

## İkinci Kitapta Özellikle Korunacak Sınırlar

- Korgan ve Temujin ani dost olmaz; doksan günlük mutabakat pazarlık, güvensizlik ve çıkış maddeleriyle kazanılır.
- Toruk'un ifadesi zorla alınmaz; güvenli geçiş ve tarafsız kayıt süreci sahnede görünür.
- Karia bir anda vâris seçmez; Meziyet Programı adayları başarısızlık ve itirazla sınar.
- Zaleena'nın kurumları alkışla değil, kaptanların maddi çıkarları ve deniz güvenliği üzerinden meşruiyet kazanır.
- Sungurlar bağımsız taraftır; sözleşmede kendi mühür, meclis ve komuta zincirlerini korur.
- Togan'ın gücü kısa süreli, fiziksel ve bedellidir. Yalan sezme ya da sınırsız Praetorian karşıtı silah biçimine dönüşmez.
- Malakor dosyası tek kötü adamın yenilgisine indirgenmez; makam, hesaplar, aracı ağ ve kayıp görevli ayrı ayrı izlenir.
- Final tek devlet, tek ordu veya aynı gün imzalanmış tek belge kurmaz.

## Denetim

- Her kısım sonunda toplam hacim ve A/B/C sahne dağılımı kaydedilecek.
- `npm.cmd run check:nesir` her yazım grubundan sonra çalışacak.
- Basılı fasıl manifesti tamamlandığında dosya kapsamı ve sırası otomatik denetlenecek.
- Site okuyucusu her büyük geçiş sonunda yeniden üretilecek.

## Tamamlanan Baskı Katmanı

- `KITAP2_BASKI_MANIFESTI.json`, 182 dijital bölümün tamamını 50 basılı fasılda birer kez kapsar.
- `npm.cmd run check:baski`, eksik, çift veya sırası bozuk bölüm bulunmadığını denetler.
- `npm.cmd run build:baski`, tek kaynak ağacından `roman/derleme/VERRIDIA_KITAP2_BASKI.md` dosyasını üretir.
