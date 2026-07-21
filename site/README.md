# VERRIDIA WEB SİTESİ

## Açmak
`site/index.html` dosyasına çift tıkla — tarayıcıda açılır. Kurulum yok.
(İnternet varsa Cormorant Garamond fontu yüklenir; yoksa Georgia ile açılır, site yine çalışır.)

## Sayfalar
- **index.html** — sinematik ana sayfa: bulutların aralandığı hero, scroll animasyonları,
  interaktif kıta haritası (8 mekân pini), mekân kartları (tıklayınca geçiş videosu → mekân görseli),
  Dört Yol karakter kartları, kitap CTA.
- **kitap.html** — kitap okuyucu: 3 kitap / 17 kısım / 358 bölüm.
  - Sol ağaç menü (kitap → kısım → bölüm), ☰ ile açılıp kapanır
  - A− / A+ yazı boyutu, ☀/☾ gece–sepya tema
  - ← → klavye ile bölüm geçişi, üstte okuma ilerleme çubuğu
  - Kaldığın bölüm otomatik hatırlanır (localStorage)

## Yeni bölüm ekleyince (ÖNEMLİ)
Romana yeni bölüm yazıldığında siteye yansıtmak için proje kökünde şunu çalıştır:

```
node site/build_kitap.js
```

Bu komut `roman/` klasörünü tarayıp `site/assets/js/kitap-data.js` dosyasını yeniden üretir.
Yeni bir Kısım klasörü açılırsa `site/build_kitap.js` içindeki `YAPI` listesine eklenmeli.

## Dosya düzeni
```
site/
  index.html            ← ana sayfa
  kitap.html            ← okuyucu
  build_kitap.js        ← kitap verisi derleyici (node ile çalışır)
  assets/
    css/stil.css        ← ana sayfa stili
    css/kitap.css       ← okuyucu stili
    js/ana.js           ← ana sayfa etkileşimleri (paralaks, harita, modal)
    js/okuyucu.js       ← okuyucu mantığı
    js/kitap-data.js    ← OTOMATİK ÜRETİLİR — elle düzenleme
    img/                ← harita + mekân görselleri (temiz ASCII adlar)
    video/              ← mekân geçiş videoları (mp4 — GIF'e çevrilmedi, gerek yok)
```

## Harita pinlerinin yeri tutmazsa
Pin koordinatları göz kararı yerleştirildi. `assets/js/ana.js` içindeki `MEKANLAR`
listesinde her mekânın `x` ve `y` değeri yüzde cinsindendir — oradan oynatabilirsin
(ya da bana "Metheris biraz sola" de, ben ayarlarım).

## Kaynak görseller
Orijinaller `haritalar animasyon/` klasöründe duruyor; site kendi kopyasını
`site/assets/img` ve `site/assets/video` altında temiz adlarla kullanır.
Yeni görsel/video eklersen aynı adlandırma kalıbıyla (küçük harf, tire) kopyala.

## Sonraki aşamalar (fikir)
- Külliyat/ansiklopedi sekmesi (halklar, tarih, sözlük)
- "Kitapla açılan harita": okunmamış bölgeler sisli, okudukça açılır
- Bölgeye özel ses ambiyansları
