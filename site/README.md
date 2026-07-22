# VERRIDIA WEB SİTESİ

## Açmak
`site/index.html` dosyasına çift tıkla — tarayıcıda açılır. Kurulum yok.
(İnternet varsa Cormorant Garamond fontu yüklenir; yoksa Georgia ile açılır, site yine çalışır.)

## Sayfalar
- **index.html** — tam ekran etkileşimli atlas. Masaüstünde imleç bir bölgeye yaklaştırılıp
  tekerlek ileri itildiğinde, ayrıca bir düğmeye veya işaretçiye tıklamadan yolculuk başlar. Harita hedefe
  yaklaşır, bulut geçişi scroll hızına uyumlu biçimde ilerler; tekerlek geri çekildiğinde aynı yol tersine
  oynar ve haritaya döner. Dokunmatik ekranlarda bölgeye dokunup yukarı kaydırmak ilerletir; aşağı
  kaydırmak geri döndürür.
  Her yolculuk, tam ekran bölge arşivi ve kitap CTA'sıyla biter.
  Dünya ile Dört Yol bilgileri haritayı terk etmeden açılan yan panellerdedir.
  Masaüstünde atlas, Verridia'nın mühürleri ve keşif araçlarıyla hazırlanmış fiziksel bir savaş masasının
  üzerinde durur; başlangıç bilgilendirmesi haritayı kaplayan bir arayüz kutusu yerine masaya iliştirilmiş
  küçük bir emir kâğıdı olarak gösterilir. Mobilde okunabilir alanı korumak için harita tam ekran kalır.
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
    js/ana.js           ← atlas kamerası, bölge seçimi, scroll-video ve yan paneller
    js/okuyucu.js       ← okuyucu mantığı
    js/kitap-data.js    ← OTOMATİK ÜRETİLİR — elle düzenleme
    img/                ← harita + mekân görselleri + masa-verridia-v1.webp savaş masası
    video/              ← mekân geçiş videoları (mp4 — GIF'e çevrilmedi, gerek yok)
```

## Harita işaretçilerinin yeri tutmazsa
İşaretçi koordinatları `assets/js/ana.js` içindeki `MEKANLAR` listesinde yüzde cinsinden
`x` ve `y` değerleriyle tutulur. İşaretçilerin görünür simgesi özellikle küçük, dokunma alanı ise
erişilebilirlik için geniş bırakılmıştır; görsel boyutla tıklanabilir alanı birlikte küçültme.

## Kaynak görseller
Orijinaller `haritalar animasyon/` klasöründe duruyor; site kendi kopyasını
`site/assets/img` ve `site/assets/video` altında temiz adlarla kullanır.
Yeni görsel/video eklersen aynı adlandırma kalıbıyla (küçük harf, tire) kopyala. Scroll ile
kare kare sarma için MP4 kullanılıyor; dosyaları GIF'e dönüştürmek kaliteyi düşürür ve boyutu büyütür.

## Sonraki aşamalar (fikir)
- Külliyat/ansiklopedi sekmesi (halklar, tarih, sözlük)
- "Kitapla açılan harita": okunmamış bölgeler sisli, okudukça açılır
- Bölgeye özel ses ambiyansları
