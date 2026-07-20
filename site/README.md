# VERRIDIA SİTESİ — KULLANIM

## Açmak
`index.html` dosyasına çift tıkla — tarayıcıda açılır. (Kurulum yok, internet gerekmez.)

## Dosyaları nereye koyacaksın (İSİMLER AYNEN BÖYLE OLMALI)

```
site/
  index.html
  assets/
    harita.jpg                ← onaylanan ana harita (jpg/png/webp olabilir)
    bolge/
      metheris.jpg            ← bölge görselleri (16:9 üretilenler)
      yildiz-orsu.jpg
      kartal-yurdu.jpg
      buyuk-ordugah.jpg
      eski-kent.jpg
      sazlik-taht.jpg
      yamali-liman.jpg
      valerius-gecidi.jpg
      isik-seddi.jpg
    video/
      metheris.mp4            ← bulut geçiş videoları (aynı adlar, .mp4)
      yildiz-orsu.mp4
      ... (diğerleri aynı kalıp)
```

- Dosya adlarında Türkçe karakter ve boşluk YOK (yukarıdaki adları aynen kullan).
- Bir şey eksikse site bozulmaz: video yoksa sis geçişiyle açılır, bölge görseli yoksa "bekleniyor" yazar, harita yoksa yönerge gösterir. Dosyayı attıkça sayfayı yenile.

## Ne yapıyor şu an
- Tam ekran harita: sürükleyerek gezinme + tekerlekle sinematik zoom.
- 9 altın nokta (bölgeler): üzerine gelince isim, tıklayınca bulut videosu → bölge sayfası (görsel + külliyattan tanıtım metni).
- "Haritaya Dön" ile sisin içinden geri dönüş.

## Nokta yerleri tutmazsa (KALİBRASYON)
Haritan üretildiği için nokta konumlarını göz kararı yerleştirdim. Düzeltmek için:
1. Sitede **K** tuşuna bas (kalibrasyon açılır).
2. Haritada doğru yere tıkla → koordinat panoya kopyalanır (ör. `x:46.2, y:58.9`).
3. Bana "metheris şurası: x:.., y:.." diye gönder — ben günceller ya da `index.html` içinde REGIONS listesinde kendin değiştirirsin.

## Sonraki aşamalar (planlı)
- Külliyat/ansiklopedi sekmesi (halklar, tarih, sözlük).
- Kitap sekmesi (bölümler yayınlandıkça).
- "Kitapla açılan harita": okunmamış bölgeler sisli başlar, kitap ilerledikçe açılır.
- Ses ambiyansları (bölgeye girince: Temürçi çekiç ritmi, Delta su sesi...).
