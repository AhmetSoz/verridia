/* VERRIDIA — tam ekran harita deneyimi */
(function () {
  "use strict";

  /* ================= Yükleme perdesi (sayaçlı) ================= */
  var perde = document.getElementById("perde");
  var perdeSayac = document.getElementById("perde-sayac");
  var perdeCizgi = perde ? perde.querySelector(".cizgi") : null;
  var sayacDeger = 0;
  var sayacHedef = 0;
  var yuklendi = false;

  function sayacAdim() {
    if (sayacDeger < sayacHedef) {
      sayacDeger = Math.min(sayacDeger + Math.ceil((sayacHedef - sayacDeger) / 7) , sayacHedef);
      if (perdeSayac) perdeSayac.textContent = sayacDeger;
      if (perdeCizgi) perdeCizgi.style.setProperty("--w", sayacDeger + "%");
    }
    if (sayacDeger >= 100 && yuklendi) {
      setTimeout(function () { perde.classList.add("gitti"); }, 350);
      return;
    }
    requestAnimationFrame(sayacAdim);
  }
  // Harita yüklenene kadar 88'e kadar akıcı say, yüklenince 100'e tamamla
  sayacHedef = 88;
  requestAnimationFrame(sayacAdim);

  /* ================= Sahne: pan / zoom motoru (GSAP süzülme fiziği) ================= */
  var sahne = document.getElementById("sahne");
  var dunya = document.getElementById("dunya");
  var haritaImg = document.getElementById("harita-img");
  var ORAN = 1536 / 1024; // harita en-boy oranı (3:2)
  var G = window.gsap || null;

  var W = 0, H = 0;                        // taban boyut (z=1, ekranı tam kaplar)
  var hedef = { x: 0, y: 0, z: 1 };        // istenen durum
  var gercek = { x: 0, y: 0, z: 1 };       // ekrana çizilen durum (hedefe süzülür)
  var Z_MAX = 3.4;
  var pinler = [];

  function tabanHesapla() {
    var vw = window.innerWidth, vh = window.innerHeight;
    W = Math.max(vw, vh * ORAN);
    H = W / ORAN;
    dunya.style.width = W + "px";
    dunya.style.height = H + "px";
    kilitle();
  }
  function kilitle() {
    var vw = window.innerWidth, vh = window.innerHeight;
    hedef.z = Math.min(Z_MAX, Math.max(1, hedef.z));
    hedef.x = Math.min(0, Math.max(vw - W * hedef.z, hedef.x));
    hedef.y = Math.min(0, Math.max(vh - H * hedef.z, hedef.y));
  }
  // Süzülme döngüsü: gercek, hedefe her karede yaklaşır (yağ gibi akma hissi)
  function aktar() {
    var k = tutma ? 0.35 : 0.11; // sürüklerken sıkı, bırakınca yumuşak
    gercek.x += (hedef.x - gercek.x) * k;
    gercek.y += (hedef.y - gercek.y) * k;
    gercek.z += (hedef.z - gercek.z) * (k * 0.9);
    dunya.style.transform = "translate3d(" + gercek.x + "px," + gercek.y + "px,0) scale(" + gercek.z + ")";
    var pz = 1 / gercek.z;
    for (var i = 0; i < pinler.length; i++) pinler[i].style.setProperty("--pz", pz);
  }
  if (G) { G.ticker.add(aktar); G.ticker.lagSmoothing(500, 33); }
  else { (function dongu() { aktar(); requestAnimationFrame(dongu); })(); }

  function yakinlas(hedefZ, mx, my) {
    var yeniZ = Math.min(Z_MAX, Math.max(1, hedefZ));
    if (mx === undefined) { mx = window.innerWidth / 2; my = window.innerHeight / 2; }
    hedef.x = mx - (mx - hedef.x) * (yeniZ / hedef.z);
    hedef.y = my - (my - hedef.y) * (yeniZ / hedef.z);
    hedef.z = yeniZ;
    kilitle();
  }

  // Tekerlek: yumuşak zoom
  sahne.addEventListener("wheel", function (e) {
    e.preventDefault();
    yakinlas(hedef.z * Math.exp(-e.deltaY * 0.0016), e.clientX, e.clientY);
    ortuGizle();
  }, { passive: false });

  // Sürükleme + bırakınca ATALET (kayarak durma)
  var tutma = null;
  var hizX = 0, hizY = 0, sonT = 0, sonX = 0, sonY = 0;
  sahne.addEventListener("pointerdown", function (e) {
    if (e.target.closest(".pin")) return;
    if (G) G.killTweensOf(hedef);
    tutma = { px: e.clientX, py: e.clientY, bx: hedef.x, by: hedef.y, tasindi: false };
    hizX = 0; hizY = 0; sonT = performance.now(); sonX = e.clientX; sonY = e.clientY;
    sahne.classList.add("tutuluyor");
    sahne.setPointerCapture(e.pointerId);
  });
  sahne.addEventListener("pointermove", function (e) {
    if (!tutma) return;
    var dx = e.clientX - tutma.px, dy = e.clientY - tutma.py;
    if (Math.abs(dx) + Math.abs(dy) > 4) tutma.tasindi = true;
    hedef.x = tutma.bx + dx; hedef.y = tutma.by + dy;
    kilitle();
    // hız ölçümü (atalet için)
    var t = performance.now(), dt = t - sonT;
    if (dt > 12) {
      hizX = (e.clientX - sonX) / dt * 16;
      hizY = (e.clientY - sonY) / dt * 16;
      sonT = t; sonX = e.clientX; sonY = e.clientY;
    }
    if (tutma.tasindi) ortuGizle();
  });
  function tutmaBirak() {
    if (tutma && tutma.tasindi && G && (Math.abs(hizX) > 2 || Math.abs(hizY) > 2)) {
      // Atalet: bırakınca kayarak yavaşla
      G.to(hedef, {
        x: hedef.x + hizX * 16,
        y: hedef.y + hizY * 16,
        duration: 1.1,
        ease: "power3.out",
        onUpdate: kilitle
      });
    }
    tutma = null; sahne.classList.remove("tutuluyor");
  }
  sahne.addEventListener("pointerup", tutmaBirak);
  sahne.addEventListener("pointercancel", tutmaBirak);

  // Zoom butonları
  document.getElementById("zoom-arti").addEventListener("click", function () { yakinlas(hedef.z * 1.45); ortuGizle(); });
  document.getElementById("zoom-eksi").addEventListener("click", function () { yakinlas(hedef.z / 1.45); });
  document.getElementById("zoom-sifirla").addEventListener("click", function () {
    if (G) G.killTweensOf(hedef);
    hedef.z = 1;
    hedef.x = (window.innerWidth - W) / 2;
    hedef.y = (window.innerHeight - H) / 2;
    kilitle();
  });

  window.addEventListener("resize", tabanHesapla);

  // Harita görseli yüklenince perdeyi kaldır
  function haritaHazir() {
    yuklendi = true; sayacHedef = 100;
  }
  if (haritaImg.complete) haritaHazir();
  else { haritaImg.addEventListener("load", haritaHazir); haritaImg.addEventListener("error", haritaHazir); }
  tabanHesapla();
  // Başlangıçta ortala (hem hedef hem gercek — zıplama olmasın)
  hedef.x = gercek.x = (window.innerWidth - W) / 2;
  hedef.y = gercek.y = (window.innerHeight - H) / 2;
  kilitle(); gercek.x = hedef.x; gercek.y = hedef.y;

  /* ================= Başlık örtüsü ================= */
  var ortu = document.getElementById("baslik-ortu");
  var ortuGitti = false;
  function ortuGizle() {
    if (ortuGitti || !ortu) return;
    ortuGitti = true;
    ortu.classList.add("gitti");
  }
  // 7 sn sonra kendiliğinden de kaybolur
  setTimeout(ortuGizle, 7000);
  // Başlık harflerini böl
  var h1 = document.getElementById("baslik-h1");
  if (h1) {
    var yazi = h1.textContent; h1.textContent = "";
    for (var i = 0; i < yazi.length; i++) {
      var s = document.createElement("span");
      s.className = "harf"; s.style.setProperty("--i", i);
      s.textContent = yazi[i];
      h1.appendChild(s);
    }
  }

  /* ================= Mekânlar — GERÇEK koordinatlar (haritaya göre, % cinsinden) ================= */
  var MEKANLAR = [
    { id: "metheris",      ad: "Metheris",      halk: "Hegemonya",  x: 8.6,  y: 61.5,
      metin: "Aethelian Hegemonyası'nın başkenti. Batı kıyısının fiyortları üzerinde taş, tören ve soğuk ihtişam — Kraliçe Karia'nın tahtı, ve tahtın altında dönen bin entrika." },
    { id: "derin-yuva",    ad: "Derin-Yuva",    halk: "Granitler",  x: 36,   y: 68.5,
      metin: "Granit Klanları'nın Ak-Siper Dağları'nın içine oyduğu başkent. Dağın kalbinde, Dağ'ın Nefesi'nin uğultusuyla yaşayan taş koridorlar." },
    { id: "kartal-yurdu",  ad: "Kartal-Yurdu",  halk: "Sungurlar",  x: 39.5, y: 60,
      metin: "Sungur klanının dağ kışlağı — kartalların, Rüzgar-Dinleyenler'in ve eski yeminlerin yurdu. Togan'ın büyüdüğü, ve her şeyin başladığı yer." },
    { id: "yildiz-orsu",   ad: "Yıldız-Örsü",   halk: "Temürçiler", x: 43.3, y: 52.5,
      metin: "Gökten düşen yıldızın açtığı dev krater. Merkezinde Büyük Örs: Temürçi ustalarının, yıldız-demirini dövdüğü, kıvılcımların hiç sönmediği ocak." },
    { id: "eski-kent",     ad: "Eski-Kent",     halk: "Mirasçılar", x: 54.8, y: 36.5,
      metin: "Eskiler'in yıkık şehri üzerine taş taş kurulmuş Mirasçı başkenti. Kalbinde Büyük Kütüphane — dünyanın hafızası, ve hafızanın bedeli." },
    { id: "buyuk-ordugah", ad: "Büyük Ordugâh", halk: "Azgutlar",   x: 59.8, y: 56.5,
      metin: "Azgut ordularının kalbi: bozkırın en büyük çadır-şehri. Han otağının önünde tuğlar dalgalanır — Temujin'in adını kanla ve akılla yazdığı topraklar." },
    { id: "sazlik-taht",   ad: "Sazlık Taht",   halk: "Delta",      x: 70.3, y: 82,
      metin: "Rivan Deltası'nın yaşayan ağaç-sarayı. Savlak su yolları, fısıltıyla iş gören beyler — ve Fısıltı Ustası Malakor'un uzun gölgesi." },
    { id: "yamali-liman",  ad: "Yamalı Liman",  halk: "Korsanlar",  x: 72.8, y: 64.5,
      metin: "Yetim Kıyıları'nın korsan başkenti; yüz enkazdan yamanmış şehir. Enkaz Kraliçesi Zaleena'nın tahtı — ve otuz yıllık bir bayrak hayalinin gerçekleştiği liman." }
  ];

  var modal = document.getElementById("mekan-modal");
  var mVideo = document.getElementById("modal-video");
  var mImg = document.getElementById("modal-img");
  var mAd = document.getElementById("modal-ad");
  var mHalk = document.getElementById("modal-halk");
  var mMetin = document.getElementById("modal-metin");

  MEKANLAR.forEach(function (m) {
    var pin = document.createElement("button");
    pin.className = "pin";
    pin.style.left = m.x + "%";
    pin.style.top = m.y + "%";
    pin.setAttribute("aria-label", m.ad);
    pin.innerHTML = '<span class="pin-ad">' + m.ad + "</span>";
    pin.addEventListener("click", function () { mekanAc(m); });
    dunya.appendChild(pin);
    pinler.push(pin);
  });
  // Pinler bulutlar dağılırken süzülerek belirsin
  if (G) G.from(pinler, { scale: 0, opacity: 0, duration: .7, ease: "back.out(2.2)", stagger: .09, delay: 4.2 });

  function mekanAc(m) {
    ortuGizle();
    mAd.textContent = m.ad;
    mHalk.textContent = m.halk;
    mMetin.textContent = m.metin;
    mImg.src = "assets/img/" + m.id + ".jpg";
    mImg.classList.remove("goster");
    mVideo.src = "assets/video/" + m.id + ".mp4";
    modal.classList.add("acik");
    document.body.classList.add("modal-acik");
    mVideo.currentTime = 0;
    var oynat = mVideo.play();
    if (oynat && oynat.catch) oynat.catch(function () { mImg.classList.add("goster"); });
  }
  mVideo.addEventListener("ended", function () { mImg.classList.add("goster"); });
  mVideo.addEventListener("error", function () { mImg.classList.add("goster"); });
  function mekanKapat() {
    modal.classList.remove("acik");
    document.body.classList.remove("modal-acik");
    mVideo.pause();
    mVideo.removeAttribute("src");
    mVideo.load();
  }
  document.getElementById("modal-kapat").addEventListener("click", mekanKapat);
  modal.addEventListener("click", function (e) { if (e.target === modal) mekanKapat(); });

  /* ================= Yan paneller ================= */
  var paneller = {
    dunya: document.getElementById("panel-dunya"),
    dortyol: document.getElementById("panel-dortyol")
  };
  var sayacCalisti = false;
  function panelAc(ad) {
    Object.keys(paneller).forEach(function (k) { paneller[k].classList.toggle("acik", k === ad); });
    ortuGizle();
    if (ad === "dunya" && !sayacCalisti) {
      sayacCalisti = true;
      document.querySelectorAll("#panel-dunya .deger[data-hedef]").forEach(sayacCalistir);
    }
  }
  function panelKapatHepsi() {
    Object.keys(paneller).forEach(function (k) { paneller[k].classList.remove("acik"); });
  }
  document.querySelectorAll("[data-panel]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var ad = btn.dataset.panel;
      if (paneller[ad].classList.contains("acik")) panelKapatHepsi();
      else panelAc(ad);
    });
  });
  document.querySelectorAll(".panel-kapat").forEach(function (btn) {
    btn.addEventListener("click", panelKapatHepsi);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (modal.classList.contains("acik")) mekanKapat();
      else panelKapatHepsi();
    }
  });

  function sayacCalistir(el) {
    var hedef = parseFloat(el.dataset.hedef);
    var ek = el.dataset.ek || "";
    var sure = 1600, baslangic = null;
    function adim(t) {
      if (!baslangic) baslangic = t;
      var oran = Math.min((t - baslangic) / sure, 1);
      var eased = 1 - Math.pow(1 - oran, 3);
      el.textContent = Math.round(hedef * eased).toLocaleString("tr-TR") + ek;
      if (oran < 1) requestAnimationFrame(adim);
    }
    requestAnimationFrame(adim);
  }

  /* ================= Kalibrasyon modu (K tuşu) =================
     K'ye bas → haritada bir noktaya tıkla → %koordinat panoya kopyalanır.
     Pin yerlerini düzeltmek için bana bu değerleri gönder. */
  var kalibrasyon = false;
  document.addEventListener("keydown", function (e) {
    if (e.key.toLowerCase() === "k" && !e.repeat) {
      kalibrasyon = !kalibrasyon;
      sahne.style.outline = kalibrasyon ? "3px dashed #e8c987" : "";
      console.log("Kalibrasyon:", kalibrasyon ? "AÇIK — haritaya tıkla" : "kapalı");
    }
  });
  sahne.addEventListener("click", function (e) {
    if (!kalibrasyon || (tutma && tutma.tasindi)) return;
    var px = ((e.clientX - x) / (W * z) * 100).toFixed(1);
    var py = ((e.clientY - y) / (H * z) * 100).toFixed(1);
    var metin = "x: " + px + ", y: " + py;
    console.log("KOORDİNAT →", metin);
    if (navigator.clipboard) navigator.clipboard.writeText(metin).catch(function () {});
    alert("Koordinat kopyalandı: " + metin);
  });

  /* ================= Özel imleç ================= */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var nokta = document.createElement("div"); nokta.className = "imlec-nokta";
    var halka = document.createElement("div"); halka.className = "imlec-halka";
    document.body.appendChild(nokta); document.body.appendChild(halka);
    var hx = -100, hy = -100, nx = -100, ny = -100;
    document.addEventListener("mousemove", function (e) { nx = e.clientX; ny = e.clientY; });
    (function imlecDongu() {
      hx += (nx - hx) * 0.18; hy += (ny - hy) * 0.18;
      nokta.style.transform = "translate3d(" + nx + "px," + ny + "px,0)";
      halka.style.transform = "translate3d(" + hx + "px," + hy + "px,0)";
      requestAnimationFrame(imlecDongu);
    })();
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest("a, button, .pin, .sekme")) document.body.classList.add("imlec-buyu");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest("a, button, .pin, .sekme")) document.body.classList.remove("imlec-buyu");
    });
  }
})();
