/* VERRIDIA — kitap okuyucu */
(function () {
  "use strict";
  var VERI = window.VERRIDIA_KITAP;
  if (!VERI) { document.body.innerHTML = "<p style='padding:4rem;text-align:center'>Kitap verisi bulunamadı. Önce <code>node site/build_kitap.js</code> çalıştır.</p>"; return; }

  var POV_RENK = {
    "TOGAN": "#d4a24e", "TEMUJİN": "#7fa5c4", "KARIA": "#b56576", "ZALEENA": "#5fa8a0"
  };

  /* ---- Düz bölüm listesi (gezinme için) ---- */
  var duz = [];
  VERI.kitaplar.forEach(function (kitap, ki) {
    kitap.kisimlar.forEach(function (kisim, si) {
      kisim.bolumler.forEach(function (b, bi) {
        duz.push({ ki: ki, si: si, bi: bi, kitap: kitap.ad, kisim: kisim.ad, bolum: b });
      });
    });
  });

  var mevcut = 0;
  try {
    var kayit = localStorage.getItem("verridia-konum");
    if (kayit !== null) mevcut = Math.min(parseInt(kayit, 10) || 0, duz.length - 1);
  } catch (e) {}

  /* ---- Kenar çubuğu ağacı ---- */
  var kenarIc = document.querySelector(".kenar-ic");
  VERI.kitaplar.forEach(function (kitap, ki) {
    var grup = document.createElement("div");
    grup.className = "kitap-grubu";
    grup.dataset.ki = ki;
    var adi = document.createElement("div");
    adi.className = "kitap-adi";
    adi.innerHTML = "<span>" + kitap.ad + "</span><span class='ok'>▶</span>";
    adi.addEventListener("click", function () { grup.classList.toggle("acik"); });
    grup.appendChild(adi);
    var kisimListe = document.createElement("div");
    kisimListe.className = "kisim-liste";
    kitap.kisimlar.forEach(function (kisim, si) {
      var kg = document.createElement("div");
      kg.className = "kisim-grubu";
      kg.dataset.si = si;
      var ka = document.createElement("div");
      ka.className = "kisim-adi";
      ka.innerHTML = "<span>" + (si + 1) + ". " + kisim.ad + "</span><span class='adet'>" + kisim.bolumler.length + "</span>";
      ka.addEventListener("click", function () { kg.classList.toggle("acik"); });
      kg.appendChild(ka);
      var bl = document.createElement("div");
      bl.className = "bolum-liste";
      kisim.bolumler.forEach(function (b, bi) {
        var satir = document.createElement("a");
        satir.className = "bolum-satir";
        satir.textContent = b.no + ". " + b.ad;
        var indeks = duz.findIndex(function (d) { return d.ki === ki && d.si === si && d.bi === bi; });
        satir.addEventListener("click", function () { git(indeks); kenarMobilKapat(); });
        satir.dataset.indeks = indeks;
        bl.appendChild(satir);
      });
      kg.appendChild(bl);
      kisimListe.appendChild(kg);
    });
    grup.appendChild(kisimListe);
    kenarIc.appendChild(grup);
  });

  /* ---- Bölüm gösterimi ---- */
  var elKisimEtiket = document.getElementById("kisim-etiketi");
  var elBaslik = document.getElementById("bolum-baslik");
  var elPov = document.getElementById("bolum-pov");
  var elGovde = document.getElementById("govde");
  var elKonum = document.getElementById("bar-konum");
  var btnOnceki = document.getElementById("btn-onceki");
  var btnSonraki = document.getElementById("btn-sonraki");

  function git(i, kaydirma) {
    if (i < 0 || i >= duz.length) return;
    mevcut = i;
    var d = duz[i];
    elKisimEtiket.textContent = d.kitap + " · " + (d.si + 1) + ". Kısım — " + d.kisim;
    elBaslik.textContent = "Bölüm " + d.bolum.no + " — " + d.bolum.ad;
    var pov = (d.bolum.pov || "").toUpperCase();
    if (pov) {
      elPov.style.display = "";
      elPov.textContent = pov;
      elPov.style.setProperty("--pov-renk", POV_RENK[pov] || "var(--r-altin)");
    } else {
      elPov.style.display = "none";
    }
    elGovde.innerHTML = d.bolum.html;
    elKonum.textContent = d.kitap + " · " + d.kisim + " · Bölüm " + d.bolum.no;

    // Gezinme butonları
    btnOnceki.disabled = i === 0;
    btnSonraki.disabled = i === duz.length - 1;
    var o = duz[i - 1], s = duz[i + 1];
    btnOnceki.querySelector(".hedef").textContent = o ? "Bölüm " + o.bolum.no + " — " + o.bolum.ad : "—";
    btnSonraki.querySelector(".hedef").textContent = s ? "Bölüm " + s.bolum.no + " — " + s.bolum.ad : "—";

    // Kenar çubuğunda aktif işaretle + ilgili grupları aç
    document.querySelectorAll(".bolum-satir.aktif").forEach(function (e) { e.classList.remove("aktif"); });
    var aktifSatir = document.querySelector(".bolum-satir[data-indeks='" + i + "']");
    if (aktifSatir) {
      aktifSatir.classList.add("aktif");
      var kg = aktifSatir.closest(".kisim-grubu"); if (kg) kg.classList.add("acik");
      var g = aktifSatir.closest(".kitap-grubu"); if (g) g.classList.add("acik");
    }

    try { localStorage.setItem("verridia-konum", String(i)); } catch (e) {}
    if (kaydirma !== false) window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  btnOnceki.addEventListener("click", function () { git(mevcut - 1); });
  btnSonraki.addEventListener("click", function () { git(mevcut + 1); });
  document.addEventListener("keydown", function (e) {
    if (e.target.tagName === "INPUT") return;
    if (e.key === "ArrowLeft") git(mevcut - 1);
    if (e.key === "ArrowRight") git(mevcut + 1);
  });

  /* ---- İlerleme çubuğu ---- */
  var ilerleme = document.getElementById("ilerleme");
  window.addEventListener("scroll", function () {
    var h = document.documentElement;
    var oran = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    ilerleme.style.width = (oran * 100) + "%";
  }, { passive: true });

  /* ---- Araçlar: yazı boyu, tema, kenar ---- */
  var yaziBoyu = 1.32;
  try { yaziBoyu = parseFloat(localStorage.getItem("verridia-boy")) || 1.32; } catch (e) {}
  function boyUygula() {
    document.documentElement.style.setProperty("--yazi-boyu", yaziBoyu + "rem");
    try { localStorage.setItem("verridia-boy", String(yaziBoyu)); } catch (e) {}
  }
  boyUygula();
  document.getElementById("btn-buyut").addEventListener("click", function () {
    yaziBoyu = Math.min(yaziBoyu + 0.08, 1.9); boyUygula();
  });
  document.getElementById("btn-kucult").addEventListener("click", function () {
    yaziBoyu = Math.max(yaziBoyu - 0.08, 0.95); boyUygula();
  });

  var temaBtn = document.getElementById("btn-tema");
  function temaUygula(t) {
    document.body.classList.toggle("sepya", t === "sepya");
    temaBtn.textContent = t === "sepya" ? "☾" : "☀";
    try { localStorage.setItem("verridia-tema", t); } catch (e) {}
  }
  var tema = "gece";
  try { tema = localStorage.getItem("verridia-tema") || "gece"; } catch (e) {}
  temaUygula(tema);
  temaBtn.addEventListener("click", function () {
    tema = document.body.classList.contains("sepya") ? "gece" : "sepya";
    temaUygula(tema);
  });

  var kenar = document.getElementById("kenar");
  document.getElementById("btn-kenar").addEventListener("click", function () {
    if (window.innerWidth <= 900) kenar.classList.toggle("acik-mobil");
    else kenar.classList.toggle("kapali");
  });
  function kenarMobilKapat() {
    if (window.innerWidth <= 900) kenar.classList.remove("acik-mobil");
  }

  /* ---- Başlat ---- */
  git(mevcut, false);
})();
