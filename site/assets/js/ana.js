/* VERRIDIA — sinematik atlas ve scroll yolculuğu */
(function () {
  "use strict";

  var G = window.gsap || null;
  var azaltHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dokunmatik = window.matchMedia("(pointer: coarse)").matches;
  var ORAN = 1536 / 1024;
  var Z_MAX = dokunmatik ? 2.25 : 2.7;

  function secici(q, kok) { return (kok || document).querySelector(q); }
  function hepsi(q, kok) { return Array.prototype.slice.call((kok || document).querySelectorAll(q)); }
  function sinirla(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function karistir(a, b, t) { return a + (b - a) * t; }
  function yumusak(a, b, n) {
    var t = sinirla((n - a) / (b - a || 1), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function iki(n) { return String(n).padStart(2, "0"); }

  var govde = document.body;
  var perde = secici("#perde");
  var perdeSayac = secici("#perde-sayac");
  var perdeCizgi = perde ? secici(".cizgi", perde) : null;
  var sahne = secici("#sahne");
  var dunya = secici("#dunya");
  var haritaImg = secici("#harita-img");
  var pinKatmani = secici("#pin-katmani");
  var yolculuk = secici("#yolculuk");
  var sabitSahne = secici("#sabit-sahne");
  var video = secici("#gecis-video");
  var poster = secici("#bolge-poster");
  var videoYukleniyor = secici("#video-yukleniyor");
  var detayBolumu = secici("#bolge-detay");
  var detayGorsel = secici("#detay-gorsel");
  var baslikOrtu = secici("#baslik-ortu");
  var h1 = secici("#baslik-h1");

  var levhaSira = secici("#levha-sira");
  var levhaHalk = secici("#levha-halk");
  var levhaAd = secici("#levha-ad");
  var levhaMetin = secici("#levha-metin");
  var levhaMuhur = secici("#levha-muhur");
  var levhaKonum = secici("#levha-konum");
  var secimLevhasi = secici("#secim-levhasi");
  var levhaEylem = secici("#levha-eylem");
  var secimiKaldir = secici("#secimi-kaldir");
  var haritaDurum = secici("#harita-durum");

  var ilerlemeSayi = secici("#ilerleme-sayi");
  var ilerlemeAdim = secici("#ilerleme-adim");
  var bolgeBaslik = secici("#bolge-baslik");
  var bolgeBaslikSira = secici("#bolge-baslik-sira");
  var bolgeBaslikHalk = secici("#bolge-baslik-halk");
  var bolgeBaslikAd = secici("#bolge-baslik-ad");
  var bolgeBaslikKisa = secici("#bolge-baslik-kisa");

  var detaySira = secici("#detay-sira");
  var detayHalk = secici("#detay-halk");
  var detayAd = secici("#detay-ad");
  var detayMetin = secici("#detay-metin");

  var DURUM = {
    etkin: null,
    onizleme: null,
    ilerleme: 0,
    hedefIlerleme: 0,
    yolaCikti: false,
    videoHazir: false,
    videoSure: 8,
    hedefZaman: 0,
    medyaId: null,
    oynatmaBekliyor: false,
    sonGeriSeek: 0,
    donusIstendi: false,
    sonPin: null,
    otomatikSecim: false,
    imlecX: window.innerWidth / 2,
    imlecY: window.innerHeight / 2
  };

  /* ================= Yükleme ================= */
  var sayacDeger = 0;
  var sayacHedef = 86;
  var haritaHazir = false;

  function sayacAdim() {
    if (sayacDeger < sayacHedef) {
      sayacDeger = Math.min(sayacHedef, sayacDeger + Math.max(1, Math.ceil((sayacHedef - sayacDeger) / 8)));
      if (perdeSayac) perdeSayac.textContent = sayacDeger;
      if (perdeCizgi) perdeCizgi.style.setProperty("--w", sayacDeger + "%");
    }
    if (sayacDeger >= 100 && haritaHazir) {
      window.setTimeout(function () { if (perde) perde.classList.add("gitti"); }, 260);
      return;
    }
    window.requestAnimationFrame(sayacAdim);
  }

  function haritaYuklendi() {
    haritaHazir = true;
    sayacHedef = 100;
  }

  if (haritaImg.complete) haritaYuklendi();
  else {
    haritaImg.addEventListener("load", haritaYuklendi, { once: true });
    haritaImg.addEventListener("error", haritaYuklendi, { once: true });
  }
  window.requestAnimationFrame(sayacAdim);

  /* ================= Açılış tipografisi ================= */
  if (h1) {
    var baslikYazi = h1.textContent;
    h1.textContent = "";
    for (var hi = 0; hi < baslikYazi.length; hi++) {
      var harf = document.createElement("span");
      harf.className = "harf";
      harf.style.setProperty("--i", hi);
      harf.textContent = baslikYazi.charAt(hi);
      h1.appendChild(harf);
    }
  }

  var ortuKapandi = false;
  function ortuyuKapat() {
    if (ortuKapandi || !baslikOrtu) return;
    ortuKapandi = true;
    baslikOrtu.classList.add("gitti");
  }
  window.setTimeout(ortuyuKapat, azaltHareket ? 900 : 6200);

  /* ================= Harita pan / zoom motoru ================= */
  var W = 0;
  var H = 0;
  var hedef = { x: 0, y: 0, z: 1 };
  var gercek = { x: 0, y: 0, z: 1 };
  var pinler = [];
  var tutma = null;
  var hizX = 0;
  var hizY = 0;
  var sonT = 0;
  var sonX = 0;
  var sonY = 0;
  var sonAktarX = NaN;
  var sonAktarY = NaN;
  var sonAktarZ = NaN;

  function mobilKaplama() {
    return window.innerWidth / Math.max(1, window.innerHeight) < .82;
  }

  function tabanHesapla(ilk) {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var kapla = mobilKaplama();
    var masaPayi = kapla ? 0 : sinirla(vh * .035, 18, 34);
    var masaYani = kapla ? 0 : sinirla(vw * .145, 118, 260);
    W = kapla
      ? Math.max(vw, vh * ORAN)
      : Math.min(vw - masaYani * 2, (vh - masaPayi * 2) * ORAN);
    H = W / ORAN;
    document.documentElement.style.setProperty("--harita-sol", Math.max(0, (vw - W) / 2).toFixed(1) + "px");
    document.documentElement.style.setProperty("--harita-alt", Math.max(0, (vh - H) / 2).toFixed(1) + "px");
    dunya.style.width = W + "px";
    dunya.style.height = H + "px";
    if (ilk || !DURUM.etkin) haritayiOrtala(ilk);
    else kilitle();
  }

  function haritayiOrtala(ani) {
    if (G) G.killTweensOf(hedef);
    hedef.z = 1;
    hedef.x = (window.innerWidth - W) / 2;
    hedef.y = (window.innerHeight - H) / 2;
    kilitle();
    if (ani) {
      gercek.x = hedef.x;
      gercek.y = hedef.y;
      gercek.z = hedef.z;
    }
  }

  function kilitle() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    hedef.z = sinirla(hedef.z, 1, Z_MAX);
    var w = W * hedef.z;
    var h = H * hedef.z;
    hedef.x = w <= vw ? (vw - w) / 2 : sinirla(hedef.x, vw - w, 0);
    hedef.y = h <= vh ? (vh - h) / 2 : sinirla(hedef.y, vh - h, 0);
  }

  function aktar() {
    var k = tutma ? .34 : .105;
    gercek.x += (hedef.x - gercek.x) * k;
    gercek.y += (hedef.y - gercek.y) * k;
    gercek.z += (hedef.z - gercek.z) * (k * .9);
    if (!Number.isFinite(sonAktarX) || Math.abs(gercek.x - sonAktarX) > .02 || Math.abs(gercek.y - sonAktarY) > .02 || Math.abs(gercek.z - sonAktarZ) > .0001) {
      dunya.style.transform = "translate3d(" + gercek.x.toFixed(2) + "px," + gercek.y.toFixed(2) + "px,0) scale(" + gercek.z.toFixed(5) + ")";
      if (Math.abs(gercek.z - sonAktarZ) > .0001) {
        var ters = 1 / gercek.z;
        for (var i = 0; i < pinler.length; i++) pinler[i].style.setProperty("--pz", ters);
      }
      sonAktarX = gercek.x;
      sonAktarY = gercek.y;
      sonAktarZ = gercek.z;
    }
    if (DURUM.etkin) {
      akisiYumusat();
      videoyuHedefeGotur();
    }
  }

  if (G) {
    G.ticker.add(aktar);
    G.ticker.lagSmoothing(500, 33);
  } else {
    (function dongu() { aktar(); window.requestAnimationFrame(dongu); })();
  }

  function yakinlas(yeniZ, mx, my) {
    if (DURUM.etkin) return;
    var z = sinirla(yeniZ, 1, Z_MAX);
    if (mx === undefined) {
      mx = window.innerWidth / 2;
      my = window.innerHeight / 2;
    }
    hedef.x = mx - (mx - hedef.x) * (z / hedef.z);
    hedef.y = my - (my - hedef.y) * (z / hedef.z);
    hedef.z = z;
    kilitle();
  }

  sahne.addEventListener("wheel", function (e) {
    if (DURUM.etkin) return;
    e.preventDefault();
    ortuyuKapat();
    DURUM.imlecX = e.clientX;
    DURUM.imlecY = e.clientY;

    if (e.deltaY >= 0) {
      yakinlas(hedef.z * Math.exp(-e.deltaY * .00115), e.clientX, e.clientY);
      return;
    }

    var kayit = DURUM.onizleme || enYakinHedef(e.clientX, e.clientY, true);
    if (!kayit) return;
    mekanSec(kayit.m, kayit.sira, kayit.pin, true);
    var ilkAdim = sinirla(Math.abs(e.deltaY) * 2.15, 72, 260);
    window.requestAnimationFrame(function () {
      window.scrollBy({ top: ilkAdim, behavior: "auto" });
    });
  }, { passive: false });

  /* Fiziksel tekerlek: ileri itmek yaklaşır, geri çekmek uzaklaştırır. */
  window.addEventListener("wheel", function (e) {
    if (!DURUM.etkin) return;
    e.preventDefault();
    var adim = sinirla(-e.deltaY * 1.45, -440, 440);
    if (Math.abs(adim) < .5) return;
    window.scrollBy({ top: adim, behavior: "auto" });
  }, { passive: false, capture: true });

  sahne.addEventListener("pointerdown", function (e) {
    if (DURUM.etkin || e.target.closest(".pin")) return;
    if (G) G.killTweensOf(hedef);
    tutma = { px: e.clientX, py: e.clientY, bx: hedef.x, by: hedef.y, tasindi: false };
    hizX = 0;
    hizY = 0;
    sonT = performance.now();
    sonX = e.clientX;
    sonY = e.clientY;
    sahne.classList.add("tutuluyor");
    sahne.setPointerCapture(e.pointerId);
  });

  sahne.addEventListener("pointermove", function (e) {
    if (!tutma || DURUM.etkin) return;
    var dx = e.clientX - tutma.px;
    var dy = e.clientY - tutma.py;
    if (Math.abs(dx) + Math.abs(dy) > 4) tutma.tasindi = true;
    hedef.x = tutma.bx + dx;
    hedef.y = tutma.by + dy;
    kilitle();
    var t = performance.now();
    var dt = t - sonT;
    if (dt > 12) {
      hizX = (e.clientX - sonX) / dt * 16;
      hizY = (e.clientY - sonY) / dt * 16;
      sonT = t;
      sonX = e.clientX;
      sonY = e.clientY;
    }
    if (tutma.tasindi) ortuyuKapat();
  });

  function tutmayiBirak() {
    if (tutma && tutma.tasindi && G && (Math.abs(hizX) > 2 || Math.abs(hizY) > 2)) {
      G.to(hedef, {
        x: hedef.x + hizX * 15,
        y: hedef.y + hizY * 15,
        duration: 1.05,
        ease: "power3.out",
        onUpdate: kilitle
      });
    }
    tutma = null;
    sahne.classList.remove("tutuluyor");
  }
  sahne.addEventListener("pointerup", tutmayiBirak);
  sahne.addEventListener("pointercancel", tutmayiBirak);

  secici("#zoom-arti").addEventListener("click", function () { yakinlas(hedef.z * 1.42); ortuyuKapat(); });
  secici("#zoom-eksi").addEventListener("click", function () { yakinlas(hedef.z / 1.42); });
  secici("#zoom-sifirla").addEventListener("click", function () { if (!DURUM.etkin) haritayiOrtala(false); });

  tabanHesapla(true);

  /* ================= Bölgeler ================= */
  var MEKANLAR = [
    {
      id: "metheris", ad: "Metheris", halk: "Hegemonya", x: 11.3, y: 60.5,
      konum: "Batı Kıyısı", muhur: "✦", renk: "#8f6d36",
      kisa: "Hegemonya'nın taş başkenti — fiyortların üzerinde soğuk ihtişam.",
      metin: "Aethelian Hegemonyası'nın başkenti. Batı kıyısının fiyortları üzerinde taş, tören ve soğuk ihtişam. Sarayın koridorlarında unvanlar fısıltıyla el değiştirir; Kraliçe Karia, kanla korunan bu tahtı liyakatle yeniden kurmaya yemin etti. Kuzey Sefer Yolu buradan başlar — Işık Seddi'ne otuz beş günlük yol."
    },
    {
      id: "derin-yuva", ad: "Derin-Yuva", halk: "Granitler", x: 39.7, y: 66.5,
      konum: "Ak-Siper Dağları", muhur: "▲", renk: "#6f716b",
      kisa: "Granit Klanları'nın dağın kalbine oyduğu başkent.",
      metin: "Ak-Siper Dağları'nın içine, kaya damarlarını izleyerek oyulmuş taş koridorlar şehri. Geceleri vadilerde Dağ'ın Nefesi uğuldar. Granitler, Valerius Geçidi'nin anahtarını ellerinde tutar — kıtanın iki yarısı ancak onların izniyle birbirine bağlanır."
    },
    {
      id: "kartal-yurdu", ad: "Kartal-Yurdu", halk: "Sungurlar", x: 46.2, y: 57,
      konum: "Batı Bozkırı", muhur: "◆", renk: "#81552c",
      kisa: "Sungurların dağ kışlağı — kartalların ve eski yeminlerin yurdu.",
      metin: "Sungur klanının yurdu: kartal tüneklerinin, Rüzgâr-Dinleyenler'in ve kadim yeminlerin toprağı. Togan bu avlularda kılıç salladı, Burkut'u burada eğitti — ve buradan ayrılırken arkasında hem bir mezar hem bir sır bıraktı."
    },
    {
      id: "yildiz-orsu", ad: "Yıldız-Örsü", halk: "Temürçiler", x: 51.1, y: 49.5,
      konum: "Merkez Krateri", muhur: "✶", renk: "#9a5129",
      kisa: "Gökten düşen yıldızın krateri; Temürçi ustalarının ocağı.",
      metin: "Fersahlarca genişlikte dairesel bir krater — gökten düşen yıldızın açtığı yara. Merkezinde Büyük Örs durur: Temürçi ustaları yıldız-demirini burada döver. Tek girişini Örs Muhafızları tutar; kıvılcımlar, söylenceye göre, hiç sönmemiştir."
    },
    {
      id: "eski-kent", ad: "Eski-Kent", halk: "Mirasçılar", x: 65.1, y: 36,
      konum: "Kuzeydoğu", muhur: "⌘", renk: "#5e6865",
      kisa: "Eskiler'in yıkıntıları üzerine kurulu Mirasçı başkenti.",
      metin: "Eskiler'in yıkık şehrinin üzerine taş taş kurulmuş Mirasçı başkenti. Kalbinde, yosun katkılı reçineyle mühürlenmiş Büyük Kütüphane — dünyanın hafızası. Kapıları gün batımında kendiliğinden kapanır; bazı raflar hâlâ kimsenin okuyamadığı dillerde fısıldar."
    },
    {
      id: "buyuk-ordugah", ad: "Büyük Ordugâh", halk: "Azgutlar", x: 68.7, y: 53.5,
      konum: "Solgun Bozkırlar", muhur: "┼", renk: "#7b4b2c",
      kisa: "Azgut ordularının kalbi — bozkırın en büyük çadır-şehri.",
      metin: "Bozkırın en büyük çadır-şehri: on binlerce otağ, tuğlar ve at kokusu. Han otağının önünde ordular yemin eder. Temujin'in adı bu topraklarda önce sürgünle, sonra zaferle anıldı — Dört Bayrak İttifakı'nın doğu direği burada durur."
    },
    {
      id: "sazlik-taht", ad: "Sazlık Taht", halk: "Delta", x: 93.5, y: 79.5,
      konum: "Rivan Deltası", muhur: "≈", renk: "#4f6b58",
      kisa: "Delta'nın yaşayan ağaç-sarayı — fısıltının başkenti.",
      metin: "Rivan Deltası'nın kalbinde, yaşayan ağaçlardan örülmüş saray. Savlak su yolları arasında beyler fısıltıyla iş görür; hiçbir söz karşılıksız, hiçbir iyilik hesapsız değildir. Her fısıltının ucu eninde sonunda Fısıltı Ustası Malakor'a çıkar."
    },
    {
      id: "yamali-liman", ad: "Yamalı Liman", halk: "Korsanlar", x: 93.4, y: 62,
      konum: "Yetim Kıyıları", muhur: "⚓", renk: "#3e6370",
      kisa: "Korsan başkenti — yüz enkazdan yamanmış şehir.",
      metin: "Yetim Kıyıları'nın başkenti: yüz batık gemiden yamanmış iskeleler, direkler ve çatılar. Enkaz Kraliçesi Zaleena burada hüküm sürer — Kaptanlar Konseyi'nin sesi, otuz yıllık bir bayrak hayalinin sahibi. Şimdi denizin dibinde sabırla atan yeşil bir ışığın bekçisi."
    }
  ];

  function levhayiVarsayilanaDondur() {
    secimLevhasi.classList.remove("bolge-hazir");
    secimLevhasi.style.removeProperty("--levha-vurgu");
    levhaSira.textContent = "08 BÖLGE";
    levhaHalk.textContent = "VERRIDIA ATLASI";
    levhaAd.textContent = "Bir bölge seç";
    levhaMuhur.textContent = "◇";
    levhaKonum.textContent = "KUZEY MÜHÜRLÜ";
    levhaMetin.textContent = dokunmatik
      ? "Gitmek istediğin bölgeye dokun; ardından yukarı kaydır. Aşağı kaydırdığında aynı yoldan haritaya dönersin."
      : "İmleci gitmek istediğin bölgeye yaklaştır. Tekerleği ileri ittiğinde harita seni bulutların arasından o toprağa götürecek.";
    levhaEylem.textContent = dokunmatik ? "Bölgeye dokun · yukarı kaydır" : "İmleci yaklaştır · tekerleği ileri it";
  }

  function levhayiDoldur(m, sira, gecici) {
    secimLevhasi.classList.add("bolge-hazir");
    secimLevhasi.style.setProperty("--levha-vurgu", m.renk);
    levhaSira.textContent = "BÖLGE " + iki(sira);
    levhaHalk.textContent = m.halk;
    levhaAd.textContent = m.ad;
    levhaMuhur.textContent = m.muhur;
    levhaKonum.textContent = m.konum.toLocaleUpperCase("tr-TR");
    levhaMetin.textContent = gecici
      ? m.kisa
      : m.kisa + (dokunmatik
        ? " Yukarı kaydırdıkça yol ilerler; aşağı kaydırdığında haritaya dönersin."
        : " Tekerleği ileri ittikçe yol ilerler; geri çektiğinde haritaya dönersin.");
    levhaEylem.textContent = gecici
      ? (dokunmatik ? "Dokun · yukarı kaydır" : "Tekerleği ileri it · yola çık")
      : (dokunmatik ? "Yukarı kaydır · aşağı dön" : "İleri it · geri çek");
  }

  function enYakinHedef(x, y, sinirsiz) {
    var enIyi = null;
    var enKisa = Infinity;
    for (var i = 0; i < pinler.length; i++) {
      var rect = pinler[i].getBoundingClientRect();
      var dx = x - (rect.left + rect.width / 2);
      var dy = y - (rect.top + rect.height / 2);
      var uzaklik = Math.sqrt(dx * dx + dy * dy);
      if (uzaklik < enKisa) {
        enKisa = uzaklik;
        enIyi = pinler[i]._kayit;
      }
    }
    var esik = sinirla(Math.min(window.innerWidth, window.innerHeight) * .3, 125, 265);
    return sinirsiz || enKisa <= esik ? enIyi : null;
  }

  function onizlemeyiAyarla(kayit) {
    if (DURUM.etkin || DURUM.onizleme === kayit) return;
    DURUM.onizleme = kayit || null;
    pinler.forEach(function (p) { p.classList.toggle("hazir", !!kayit && p === kayit.pin); });
    if (!kayit) {
      levhayiVarsayilanaDondur();
      haritaDurum.textContent = dokunmatik ? "Bölgeye dokun · Yukarı kaydır" : "İmleci yaklaştır · Tekerleği ileri it";
      return;
    }
    levhayiDoldur(kayit.m, kayit.sira, true);
    haritaDurum.textContent = kayit.m.ad + (dokunmatik ? " · Yukarı kaydır" : " · İleri iterek yaklaş");
    medyayiOnYukle(kayit.m);
  }

  MEKANLAR.forEach(function (m, index) {
    var pin = document.createElement("button");
    var etiket = document.createElement("span");
    pin.type = "button";
    pin.className = "pin";
    pin.style.left = m.x + "%";
    pin.style.top = m.y + "%";
    pin.setAttribute("aria-label", m.ad + " bölgesini seç");
    pin.setAttribute("aria-pressed", "false");
    pin.dataset.mekan = m.id;
    pin._kayit = { m: m, sira: index + 1, pin: pin };
    etiket.className = "pin-numara";
    etiket.textContent = iki(index + 1) + " · " + m.ad;
    pin.appendChild(etiket);

    pin.addEventListener("mouseenter", function () {
      if (!DURUM.etkin) onizlemeyiAyarla(pin._kayit);
    });
    pin.addEventListener("focus", function () {
      if (!DURUM.etkin) onizlemeyiAyarla(pin._kayit);
    });
    pin.addEventListener("blur", function () {
      if (!DURUM.etkin && dokunmatik) onizlemeyiAyarla(null);
    });
    pin.addEventListener("click", function () {
      mekanSec(m, index + 1, pin, false);
    });
    pinKatmani.appendChild(pin);
    pinler.push(pin);
  });

  var onizlemeKaresi = 0;
  sahne.addEventListener("pointermove", function (e) {
    DURUM.imlecX = e.clientX;
    DURUM.imlecY = e.clientY;
    if (dokunmatik || DURUM.etkin || tutma || onizlemeKaresi) return;
    onizlemeKaresi = window.requestAnimationFrame(function () {
      onizlemeKaresi = 0;
      onizlemeyiAyarla(enYakinHedef(DURUM.imlecX, DURUM.imlecY, false));
    });
  }, { passive: true });
  sahne.addEventListener("pointerleave", function () {
    if (!dokunmatik && !DURUM.etkin && !tutma) onizlemeyiAyarla(null);
  });

  /* ================= Scroll ile video sarma ================= */
  function videoZamanla(zaman) {
    DURUM.hedefZaman = sinirla(zaman, 0, Math.max(.01, DURUM.videoSure - .02));
  }

  function videoyuOynat() {
    if (DURUM.oynatmaBekliyor || !video.paused) return;
    DURUM.oynatmaBekliyor = true;
    var istek = video.play();
    if (istek && istek.then) {
      istek.catch(function () {
        if (!video.seeking) {
          try { video.currentTime = DURUM.hedefZaman; } catch (hata) { /* sessiz */ }
        }
      }).finally(function () { DURUM.oynatmaBekliyor = false; });
    } else DURUM.oynatmaBekliyor = false;
  }

  function videoyuHedefeGotur() {
    if (!DURUM.etkin || !DURUM.videoHazir || azaltHareket) return;
    var simdi = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    var fark = DURUM.hedefZaman - simdi;

    if (fark > .07) {
      if (fark > .72 && !video.seeking) {
        try { video.currentTime = Math.max(simdi, DURUM.hedefZaman - .28); } catch (hata) { /* sessiz */ }
      }
      video.playbackRate = sinirla(.75 + Math.max(0, fark) * 1.25, .75, 3.25);
      videoyuOynat();
      return;
    }

    if (fark < -.045) {
      if (!video.paused) video.pause();
      var zaman = performance.now();
      if (!video.seeking && zaman - DURUM.sonGeriSeek > 62) {
        DURUM.sonGeriSeek = zaman;
        try { video.currentTime = DURUM.hedefZaman; } catch (hata) { /* sessiz */ }
      }
      return;
    }

    if (!video.paused) video.pause();
  }

  function haritaKamerasiniIlerlet(p) {
    if (!DURUM.etkin) return;
    var q = yumusak(0, .27, p);
    var z = karistir(1, dokunmatik ? 1.72 : 2.08, q);
    hedef.z = z;
    hedef.x = window.innerWidth / 2 - W * (DURUM.etkin.x / 100) * z;
    hedef.y = window.innerHeight / 2 - H * (DURUM.etkin.y / 100) * z;
    kilitle();
  }

  function ilerlemeyiUygula(p) {
    if (!DURUM.etkin) return;
    p = sinirla(p, 0, 1);
    DURUM.ilerleme = p;
    document.documentElement.style.setProperty("--ilerleme", p.toFixed(4));

    var erken = p > .17;
    govde.classList.toggle("gecis-ilerledi", erken);
    govde.classList.toggle("gecis-sonunda", p > .94);
    govde.classList.toggle("sahne-bitti", p > .998);
    haritaKamerasiniIlerlet(p);

    var haritaOpak;
    var videoOpak;
    var posterOpak;
    var baslikP;

    if (azaltHareket) {
      haritaOpak = 1 - yumusak(.16, .42, p);
      videoOpak = 0;
      posterOpak = yumusak(.18, .54, p);
      baslikP = yumusak(.36, .68, p);
    } else {
      haritaOpak = 1 - yumusak(.18, .31, p);
      videoOpak = yumusak(.2, .32, p) * (1 - yumusak(.84, .965, p));
      posterOpak = yumusak(.83, .965, p);
      baslikP = yumusak(.66, .84, p);
    }

    sahne.style.opacity = haritaOpak.toFixed(3);
    video.style.opacity = videoOpak.toFixed(3);
    video.style.transform = "scale(" + karistir(1.026, 1, p).toFixed(4) + ")";
    poster.style.opacity = posterOpak.toFixed(3);
    poster.style.transform = "scale(" + karistir(1.035, 1, posterOpak).toFixed(4) + ")";
    bolgeBaslik.style.opacity = baslikP.toFixed(3);
    bolgeBaslik.style.transform = "translateY(" + ((1 - baslikP) * 35).toFixed(2) + "px)";

    if (!azaltHareket) {
      var videoP = yumusak(.18, .9, p);
      videoZamanla(videoP * DURUM.videoSure);
    }

    if (!DURUM.videoHazir && !azaltHareket && p > .19 && p < .84) videoYukleniyor.classList.add("goster");
    else videoYukleniyor.classList.remove("goster");

    var yuzde = Math.round(p * 100);
    ilerlemeSayi.textContent = iki(yuzde);
    if (p < .2) ilerlemeAdim.textContent = "YAKLAŞMA";
    else if (p < .68) ilerlemeAdim.textContent = "BULUT GEÇİDİ";
    else if (p < .9) ilerlemeAdim.textContent = "İNİŞ";
    else ilerlemeAdim.textContent = "VARIŞ";

    if (DURUM.yolaCikti && DURUM.hedefIlerleme <= .001 && p <= .003) {
      DURUM.donusIstendi = false;
      DURUM.yolaCikti = false;
      window.setTimeout(secimiBitir, 40);
    }
  }

  function akisiYumusat() {
    if (!DURUM.etkin) return;
    var fark = DURUM.hedefIlerleme - DURUM.ilerleme;
    if (Math.abs(fark) < .00045) {
      if (DURUM.ilerleme !== DURUM.hedefIlerleme) ilerlemeyiUygula(DURUM.hedefIlerleme);
      return;
    }
    var oran = azaltHareket ? 1 : (fark > 0 ? .145 : .19);
    ilerlemeyiUygula(DURUM.ilerleme + fark * oran);
  }

  function scrollIlerlemesiniOku() {
    if (!DURUM.etkin) return;
    var mesafe = Math.max(1, yolculuk.offsetHeight - window.innerHeight);
    DURUM.hedefIlerleme = sinirla(window.scrollY / mesafe, 0, 1);
    if (DURUM.hedefIlerleme > .012) DURUM.yolaCikti = true;
    if (azaltHareket) ilerlemeyiUygula(DURUM.hedefIlerleme);
  }

  var scrollKaresi = 0;
  window.addEventListener("scroll", function () {
    if (!DURUM.etkin || scrollKaresi) return;
    scrollKaresi = window.requestAnimationFrame(function () {
      scrollKaresi = 0;
      scrollIlerlemesiniOku();
    });
  }, { passive: true });

  function metinleriDoldur(m, sira) {
    levhayiDoldur(m, sira, false);
    bolgeBaslikSira.textContent = "BÖLGE " + iki(sira);
    bolgeBaslikHalk.textContent = m.halk;
    bolgeBaslikAd.textContent = m.ad;
    bolgeBaslikKisa.textContent = m.kisa;
    detaySira.textContent = "BÖLGE " + iki(sira);
    detayHalk.textContent = m.halk;
    detayAd.textContent = m.ad;
    detayMetin.textContent = m.metin;
  }

  var onYuklemeZamani = 0;
  function medyayiOnYukle(m) {
    if (azaltHareket || DURUM.etkin || DURUM.medyaId === m.id) return;
    window.clearTimeout(onYuklemeZamani);
    onYuklemeZamani = window.setTimeout(function () {
      if (DURUM.etkin || !DURUM.onizleme || DURUM.onizleme.m.id !== m.id) return;
      DURUM.videoHazir = false;
      DURUM.medyaId = m.id;
      video.src = "assets/video/" + m.id + ".mp4";
      video.preload = "auto";
      video.load();
    }, 180);
  }

  function medyayiHazirla(m) {
    DURUM.videoSure = 8;
    DURUM.hedefZaman = 0;
    DURUM.oynatmaBekliyor = false;
    poster.src = "assets/img/" + m.id + ".jpg";
    poster.alt = m.ad + " bölgesinin görünümü";
    detayGorsel.src = "assets/img/" + m.id + ".jpg";
    detayGorsel.alt = m.ad + " bölgesi";
    if (azaltHareket) return;
    if (DURUM.medyaId !== m.id) {
      DURUM.videoHazir = false;
      DURUM.medyaId = m.id;
      video.src = "assets/video/" + m.id + ".mp4";
      video.preload = "auto";
      video.load();
    } else {
      DURUM.videoHazir = video.readyState >= 1;
      if (DURUM.videoHazir) {
        DURUM.videoSure = Number.isFinite(video.duration) ? video.duration : 8;
        try { video.currentTime = 0; } catch (hata) { /* metadata bekleniyor */ }
      }
    }
  }

  video.addEventListener("loadedmetadata", function () {
    DURUM.videoSure = Number.isFinite(video.duration) ? video.duration : 8;
    DURUM.videoHazir = true;
    video.pause();
    videoYukleniyor.classList.remove("goster");
    videoZamanla(yumusak(.18, .9, DURUM.ilerleme) * DURUM.videoSure);
  });
  video.addEventListener("canplay", function () {
    DURUM.videoHazir = true;
    videoYukleniyor.classList.remove("goster");
  });
  video.addEventListener("error", function () {
    DURUM.videoHazir = false;
    videoYukleniyor.classList.remove("goster");
  });

  function mekanSec(m, sira, pin, otomatik) {
    ortuyuKapat();
    panelleriKapat();
    if (window.scrollY > 2) window.scrollTo(0, 0);

    if (DURUM.etkin && DURUM.etkin.id === m.id) return;

    DURUM.etkin = m;
    DURUM.onizleme = pin ? pin._kayit : null;
    DURUM.ilerleme = 0;
    DURUM.hedefIlerleme = 0;
    DURUM.yolaCikti = false;
    DURUM.sonPin = pin;
    DURUM.otomatikSecim = !!otomatik;
    DURUM.donusIstendi = false;
    pinler.forEach(function (p) {
      var secili = p === pin;
      p.classList.remove("hazir");
      p.classList.toggle("secili", secili);
      p.setAttribute("aria-pressed", secili ? "true" : "false");
    });

    metinleriDoldur(m, sira);
    medyayiHazirla(m);
    haritayiOrtala(false);
    secimiKaldir.hidden = false;
    haritaDurum.textContent = dokunmatik ? "Yukarı kaydırarak yaklaş · Aşağı kaydırarak dön" : "İleri iterek yaklaş · Geri çekerek dön";
    govde.classList.add("yolculuk-secili", "yolculuk-aktif");
    detayBolumu.setAttribute("aria-hidden", "false");
    sabitSahne.scrollTop = 0;
    sabitSahne.scrollLeft = 0;
    window.requestAnimationFrame(function () {
      sabitSahne.scrollTop = 0;
      sabitSahne.scrollLeft = 0;
    });
    ilerlemeyiUygula(0);
    try { history.replaceState(null, "", "#" + m.id); } catch (hata) { /* file protokolünde sessiz kal */ }
  }

  function secimiBitir() {
    if (!DURUM.etkin) return;
    var otomatikti = DURUM.otomatikSecim;
    if (window.scrollY > 2) window.scrollTo(0, 0);
    govde.classList.remove("yolculuk-secili", "yolculuk-aktif", "gecis-ilerledi", "gecis-sonunda", "sahne-bitti");
    detayBolumu.setAttribute("aria-hidden", "true");
    pinler.forEach(function (p) {
      p.classList.remove("hazir");
      p.classList.remove("secili");
      p.setAttribute("aria-pressed", "false");
    });
    video.pause();
    try { video.currentTime = 0; } catch (hata) { /* sessiz */ }
    video.style.opacity = "0";
    poster.style.opacity = "0";
    sahne.style.opacity = "1";
    bolgeBaslik.style.opacity = "0";
    videoYukleniyor.classList.remove("goster");
    DURUM.etkin = null;
    DURUM.onizleme = null;
    DURUM.ilerleme = 0;
    DURUM.hedefIlerleme = 0;
    DURUM.yolaCikti = false;
    DURUM.oynatmaBekliyor = false;
    DURUM.otomatikSecim = false;
    document.documentElement.style.setProperty("--ilerleme", "0");
    levhayiVarsayilanaDondur();
    secimiKaldir.hidden = true;
    haritaDurum.textContent = dokunmatik ? "Bölgeye dokun · Yukarı kaydır" : "İmleci yaklaştır · Tekerleği ileri it";
    haritayiOrtala(false);
    try { history.replaceState(null, "", location.pathname + location.search); } catch (hata) { /* sessiz */ }
    if (DURUM.sonPin && !otomatikti) {
      DURUM.sonPin.focus({ preventScroll: true });
      levhayiVarsayilanaDondur();
    }
  }

  function haritayaDon() {
    if (!DURUM.etkin) return;
    DURUM.donusIstendi = true;
    if (azaltHareket) {
      window.scrollTo(0, 0);
      secimiBitir();
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  secimiKaldir.addEventListener("click", secimiBitir);
  secici("#gecisi-atla").addEventListener("click", function () {
    if (!DURUM.etkin) return;
    window.scrollTo({ top: detayBolumu.offsetTop + 2, behavior: azaltHareket ? "auto" : "smooth" });
  });
  secici("#haritaya-don").addEventListener("click", haritayaDon);
  secici(".marka").addEventListener("click", function (e) {
    if (!DURUM.etkin) return;
    e.preventDefault();
    haritayaDon();
  });

  /* ================= Yan paneller ================= */
  var paneller = {
    dunya: secici("#panel-dunya"),
    dortyol: secici("#panel-dortyol")
  };
  var panelOrtu = secici("#panel-ortu");
  var sayacCalisti = false;
  var panelAcici = null;

  function panelAc(ad, acici) {
    if (!paneller[ad]) return;
    panelAcici = acici || null;
    Object.keys(paneller).forEach(function (anahtar) {
      var acik = anahtar === ad;
      paneller[anahtar].classList.toggle("acik", acik);
      paneller[anahtar].setAttribute("aria-hidden", acik ? "false" : "true");
    });
    hepsi("[data-panel]").forEach(function (btn) {
      btn.setAttribute("aria-expanded", btn.dataset.panel === ad ? "true" : "false");
    });
    govde.classList.add("panel-acik");
    panelOrtu.tabIndex = 0;
    ortuyuKapat();
    if (ad === "dunya" && !sayacCalisti) {
      sayacCalisti = true;
      hepsi("#panel-dunya .deger[data-hedef]").forEach(sayacCalistir);
    }
    var kapat = secici(".panel-kapat", paneller[ad]);
    if (kapat) {
      window.setTimeout(function () {
        if (paneller[ad].classList.contains("acik")) kapat.focus({ preventScroll: true });
      }, 40);
    }
  }

  function panelleriKapat(odagiDondur) {
    Object.keys(paneller).forEach(function (anahtar) {
      paneller[anahtar].classList.remove("acik");
      paneller[anahtar].setAttribute("aria-hidden", "true");
    });
    hepsi("[data-panel]").forEach(function (btn) { btn.setAttribute("aria-expanded", "false"); });
    govde.classList.remove("panel-acik");
    panelOrtu.tabIndex = -1;
    if (odagiDondur !== false && panelAcici) panelAcici.focus({ preventScroll: true });
    panelAcici = null;
  }

  hepsi("[data-panel]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var ad = btn.dataset.panel;
      if (paneller[ad].classList.contains("acik")) panelleriKapat(true);
      else panelAc(ad, btn);
    });
  });
  hepsi(".panel-kapat").forEach(function (btn) { btn.addEventListener("click", function () { panelleriKapat(true); }); });
  panelOrtu.addEventListener("click", function () { panelleriKapat(true); });

  function sayacCalistir(el) {
    var son = parseFloat(el.dataset.hedef);
    var ek = el.dataset.ek || "";
    var sure = azaltHareket ? 1 : 1400;
    var baslangic = null;
    function adim(t) {
      if (!baslangic) baslangic = t;
      var oran = Math.min((t - baslangic) / sure, 1);
      var kolay = 1 - Math.pow(1 - oran, 3);
      el.textContent = Math.round(son * kolay).toLocaleString("tr-TR") + ek;
      if (oran < 1) window.requestAnimationFrame(adim);
    }
    window.requestAnimationFrame(adim);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Tab" && govde.classList.contains("panel-acik")) {
      var aktifPanel = secici(".panel.acik");
      var odaklanabilirler = aktifPanel ? hepsi("button, a[href], [tabindex]:not([tabindex='-1'])", aktifPanel) : [];
      if (odaklanabilirler.length) {
        var ilk = odaklanabilirler[0];
        var son = odaklanabilirler[odaklanabilirler.length - 1];
        if (e.shiftKey && document.activeElement === ilk) {
          e.preventDefault();
          son.focus();
        } else if (!e.shiftKey && document.activeElement === son) {
          e.preventDefault();
          ilk.focus();
        }
      }
      return;
    }
    if (e.key !== "Escape") return;
    if (govde.classList.contains("panel-acik")) panelleriKapat();
    else if (DURUM.etkin) haritayaDon();
  });

  /* ================= Yeniden boyutlandırma ================= */
  var yenidenKaresi = 0;
  window.addEventListener("resize", function () {
    if (yenidenKaresi) return;
    yenidenKaresi = window.requestAnimationFrame(function () {
      yenidenKaresi = 0;
      tabanHesapla(false);
      scrollIlerlemesiniOku();
    });
  });

  /* ================= Hassas işaretçi imleci ================= */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var imlecNokta = document.createElement("div");
    var imlecHalka = document.createElement("div");
    imlecNokta.className = "imlec-nokta";
    imlecHalka.className = "imlec-halka";
    document.body.appendChild(imlecNokta);
    document.body.appendChild(imlecHalka);
    var hx = -100;
    var hy = -100;
    var nx = -100;
    var ny = -100;
    var masaHareketKaresi = 0;
    document.addEventListener("mousemove", function (e) {
      nx = e.clientX;
      ny = e.clientY;
      if (azaltHareket || masaHareketKaresi) return;
      masaHareketKaresi = window.requestAnimationFrame(function () {
        masaHareketKaresi = 0;
        var masaX = ((nx / Math.max(1, window.innerWidth)) - .5) * -7;
        var masaY = ((ny / Math.max(1, window.innerHeight)) - .5) * -5;
        sabitSahne.style.setProperty("--masa-x", masaX.toFixed(2) + "px");
        sabitSahne.style.setProperty("--masa-y", masaY.toFixed(2) + "px");
      });
    });
    (function imlecDongu() {
      hx += (nx - hx) * .17;
      hy += (ny - hy) * .17;
      imlecNokta.style.transform = "translate3d(" + nx + "px," + ny + "px,0)";
      imlecHalka.style.transform = "translate3d(" + hx + "px," + hy + "px,0)";
      window.requestAnimationFrame(imlecDongu);
    })();
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest("a, button, .pin")) govde.classList.add("imlec-buyu");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest("a, button, .pin")) govde.classList.remove("imlec-buyu");
    });
  }

  /* URL ile doğrudan bölge açma */
  window.addEventListener("load", function () {
    var id = location.hash.replace(/^#/, "");
    if (!id) return;
    var index = MEKANLAR.findIndex(function (m) { return m.id === id; });
    if (index < 0) return;
    window.setTimeout(function () { mekanSec(MEKANLAR[index], index + 1, pinler[index]); }, 450);
  }, { once: true });
})();
