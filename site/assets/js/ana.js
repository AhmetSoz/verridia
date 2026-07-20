/* VERRIDIA — ana sayfa etkileşimleri */
(function () {
  "use strict";

  /* ---- Yükleme perdesi ---- */
  window.addEventListener("load", function () {
    setTimeout(function () {
      var p = document.getElementById("perde");
      if (p) p.classList.add("gitti");
    }, 900);
  });

  /* ---- Üst çubuk ---- */
  var ustbar = document.querySelector(".ustbar");
  function barGuncelle() {
    if (window.scrollY > 40) ustbar.classList.add("dolu");
    else ustbar.classList.remove("dolu");
  }
  window.addEventListener("scroll", barGuncelle, { passive: true });
  barGuncelle();

  /* ---- Hero: başlık scroll'da kaybolur (bulutlar CSS animasyonuyla kendiliğinden dağılır) ---- */
  var hero = document.querySelector(".hero");
  var heroIcerik = document.querySelector(".hero-icerik");
  var ticking = false;
  function paralaks() {
    var y = window.scrollY;
    var h = window.innerHeight;
    var oran = Math.min(y / h, 1.4);
    if (heroIcerik) {
      heroIcerik.style.transform = "translateY(" + oran * 60 + "px)";
      heroIcerik.style.opacity = Math.max(1 - oran * 1.5, 0);
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(paralaks); ticking = true; }
  }, { passive: true });

  /* Hero ekran dışına çıkınca ağır animasyonları durdur (performans) */
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (girisler) {
      girisler.forEach(function (g) {
        hero.classList.toggle("duraklat", !g.isIntersecting);
      });
    }, { threshold: 0.02 }).observe(hero);
  }

  /* ---- Scroll reveal ---- */
  var io = new IntersectionObserver(function (girisler) {
    girisler.forEach(function (g) {
      if (g.isIntersecting) { g.target.classList.add("goster"); io.unobserve(g.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".gizli").forEach(function (el) { io.observe(el); });

  /* ---- Sayaç animasyonu ---- */
  function sayacCalistir(el) {
    var hedef = parseFloat(el.dataset.hedef);
    var ek = el.dataset.ek || "";
    var sure = 1800, baslangic = null;
    function adim(t) {
      if (!baslangic) baslangic = t;
      var oran = Math.min((t - baslangic) / sure, 1);
      var eased = 1 - Math.pow(1 - oran, 3);
      el.textContent = Math.round(hedef * eased).toLocaleString("tr-TR") + ek;
      if (oran < 1) requestAnimationFrame(adim);
    }
    requestAnimationFrame(adim);
  }
  var sayacIo = new IntersectionObserver(function (girisler) {
    girisler.forEach(function (g) {
      if (g.isIntersecting) { sayacCalistir(g.target); sayacIo.unobserve(g.target); }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll(".deger[data-hedef]").forEach(function (el) { sayacIo.observe(el); });

  /* ---- Mekânlar (pin koordinatlarını buradan ayarlayabilirsin: x/y = % cinsinden) ---- */
  var MEKANLAR = [
    { id: "metheris",      ad: "Metheris",        halk: "Hegemonya",  x: 13, y: 40,
      metin: "Aethelian Hegemonyası'nın başkenti. Batı kıyısının fiyortları üzerinde taş, tören ve soğuk ihtişam — Kraliçe Karia'nın tahtı, ve tahtın altında dönen bin entrika." },
    { id: "derin-yuva",    ad: "Derin-Yuva",      halk: "Granitler",  x: 32, y: 30,
      metin: "Granit Klanları'nın Ak-Siper Dağları'nın içine oyduğu başkent. Dağın kalbinde, Dağ'ın Nefesi'nin uğultusuyla yaşayan taş koridorlar." },
    { id: "kartal-yurdu",  ad: "Kartal-Yurdu",    halk: "Sungurlar",  x: 47, y: 24,
      metin: "Sungur klanının dağ kışlağı — kartalların, Rüzgar-Dinleyenler'in ve eski yeminlerin yurdu. Togan'ın büyüdüğü, ve her şeyin başladığı yer." },
    { id: "buyuk-ordugah", ad: "Büyük Ordugâh",   halk: "Azgutlar",   x: 66, y: 30,
      metin: "Azgut ordularının kalbi: bozkırın en büyük çadır-şehri. Han otağının önünde tuğlar dalgalanır — Temujin'in adını kanla ve akılla yazdığı topraklar." },
    { id: "yildiz-orsu",   ad: "Yıldız-Örsü",     halk: "Temürçiler", x: 53, y: 52,
      metin: "Gökten düşen yıldızın açtığı dev krater. Merkezinde Büyük Örs: Temürçi ustalarının, yıldız-demirini dövdüğü, kıvılcımların hiç sönmediği ocak." },
    { id: "eski-kent",     ad: "Eski-Kent",       halk: "Mirasçılar", x: 60, y: 44,
      metin: "Eskiler'in yıkık şehri üzerine taş taş kurulmuş Mirasçı başkenti. Kalbinde Büyük Kütüphane — dünyanın hafızası, ve hafızanın bedeli." },
    { id: "sazlik-taht",   ad: "Sazlık Taht",     halk: "Delta",      x: 71, y: 74,
      metin: "Rivan Deltası'nın yaşayan ağaç-sarayı. Savlak su yolları, fısıltıyla iş gören beyler — ve Fısıltı Ustası Malakor'un uzun gölgesi." },
    { id: "yamali-liman",  ad: "Yamalı Liman",    halk: "Korsanlar",  x: 86, y: 56,
      metin: "Yetim Kıyıları'nın korsan başkenti; yüz enkazdan yamanmış şehir. Enkaz Kraliçesi Zaleena'nın tahtı — ve otuz yıllık bir bayrak hayalinin gerçekleştiği liman." }
  ];

  var sahne = document.getElementById("harita-sahne");
  var grid = document.getElementById("mekan-grid");
  var modal = document.getElementById("mekan-modal");
  var mVideo = document.getElementById("modal-video");
  var mImg = document.getElementById("modal-img");
  var mAd = document.getElementById("modal-ad");
  var mHalk = document.getElementById("modal-halk");
  var mMetin = document.getElementById("modal-metin");

  MEKANLAR.forEach(function (m) {
    // Harita pini
    if (sahne) {
      var pin = document.createElement("button");
      pin.className = "pin";
      pin.style.left = m.x + "%";
      pin.style.top = m.y + "%";
      pin.setAttribute("aria-label", m.ad);
      pin.innerHTML = '<span class="pin-ad">' + m.ad + "</span>";
      pin.addEventListener("click", function () { mekanAc(m); });
      sahne.appendChild(pin);
    }
    // Kart
    if (grid) {
      var kart = document.createElement("div");
      kart.className = "mekan-kart gizli";
      kart.innerHTML =
        '<img loading="lazy" src="assets/img/' + m.id + '.jpg" alt="' + m.ad + '">' +
        '<span class="kart-halk">' + m.halk + "</span>" +
        '<div class="kart-ad">' + m.ad + "</div>";
      kart.addEventListener("click", function () { mekanAc(m); });
      grid.appendChild(kart);
      io.observe(kart);
    }
  });

  function mekanAc(m) {
    mAd.textContent = m.ad;
    mHalk.textContent = m.halk;
    mMetin.textContent = m.metin;
    mImg.src = "assets/img/" + m.id + ".jpg";
    mImg.classList.remove("goster");
    mVideo.src = "assets/video/" + m.id + ".mp4";
    modal.classList.add("acik");
    document.body.classList.add("modal-acik"); /* arka plan animasyonları durur */
    document.body.style.overflow = "hidden";
    mVideo.currentTime = 0;
    var oynat = mVideo.play();
    if (oynat && oynat.catch) oynat.catch(function () { mImg.classList.add("goster"); });
  }
  if (mVideo) {
    mVideo.addEventListener("ended", function () { mImg.classList.add("goster"); });
    mVideo.addEventListener("error", function () { mImg.classList.add("goster"); });
  }
  function mekanKapat() {
    modal.classList.remove("acik");
    document.body.classList.remove("modal-acik");
    document.body.style.overflow = "";
    mVideo.pause();
    mVideo.removeAttribute("src");
    mVideo.load();
  }
  document.getElementById("modal-kapat").addEventListener("click", mekanKapat);
  modal.addEventListener("click", function (e) { if (e.target === modal) mekanKapat(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("acik")) mekanKapat();
  });
})();
