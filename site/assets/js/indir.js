/* VERRIDIA — PDF indirme: koyu tema + tıklanabilir İçindekiler
   (tarayıcının "PDF olarak kaydet" motoruyla; iç bağlantılar PDF'te çalışır) */
(function () {
  "use strict";
  var VERI = window.VERRIDIA_KITAP;
  var kok = document.getElementById("pdf-root");
  var modal = document.getElementById("pdf-modal");
  var hazir = document.getElementById("pdf-hazir");
  if (!VERI || !kok || !modal) return;

  var POV_SINIF = { "TOGAN": "pov-togan", "TEMUJİN": "pov-temujin", "KARIA": "pov-karia", "ZALEENA": "pov-zaleena" };

  function povChip(p) {
    if (!p) return "";
    var s = POV_SINIF[p.toUpperCase()] || "";
    return '<div class="pdf-pov ' + s + '">' + p + "</div>";
  }
  function bid(bi, ki, no) { return "vb-" + bi + "-" + ki + "-" + no; }

  /* Soldaki menünün karşılığı: tıklanabilir içindekiler */
  function icindekilerHtml(kitap, bi) {
    var h = '<section class="pdf-icindekiler">' +
            '<div class="pdf-ic-baslik">İÇİNDEKİLER</div>' +
            '<div class="pdf-ic-sus">✦ ✦ ✦</div>';
    kitap.kisimlar.forEach(function (kisim, ki) {
      h += '<div class="pdf-ic-kisim"><span class="no">' + (ki + 1) + '. KISIM</span> ' + kisim.ad + '</div><ul>';
      kisim.bolumler.forEach(function (b) {
        h += '<li><a href="#' + bid(bi, ki, b.no) + '"><span class="b-no">' + b.no + ".</span> " + b.ad + "</a></li>";
      });
      h += "</ul>";
    });
    return h + "</section>";
  }

  function kitapHtml(kitap, bi) {
    var h = '<div class="pdf-kapak">' +
            '<div class="pdf-seri">VERRIDIA</div>' +
            '<div class="pdf-kitap-ad">' + kitap.ad + "</div>" +
            (kitap.alt ? '<div class="pdf-alt">' + kitap.alt + "</div>" : "") +
            "</div>";
    h += icindekilerHtml(kitap, bi);
    kitap.kisimlar.forEach(function (kisim, ki) {
      h += '<section class="pdf-kisim-bolucu">' +
           '<div class="pdf-kisim-no">' + (ki + 1) + ". Kısım</div>" +
           '<div class="pdf-kisim-ad">' + kisim.ad + "</div></section>";
      kisim.bolumler.forEach(function (b) {
        h += '<article class="pdf-bolum" id="' + bid(bi, ki, b.no) + '">' +
             '<div class="pdf-bolum-no">Bölüm ' + b.no + "</div>" +
             '<h2 class="pdf-bolum-ad">' + b.ad + "</h2>" +
             povChip(b.pov) +
             '<div class="pdf-govde">' + b.html + "</div></article>";
      });
    });
    return h;
  }

  function yazdir(secim) {
    if (hazir) hazir.classList.add("acik");
    kapat();

    setTimeout(function () {
      var html, baslik;
      if (secim === "all") {
        html = '<div class="pdf-kapak pdf-seri-kapak"><div class="pdf-seri">VERRIDIA</div>' +
               '<div class="pdf-kitap-ad">VERRIDIA</div>' +
               '<div class="pdf-alt">Üçleme — Bütün Kitaplar</div></div>';
        VERI.kitaplar.forEach(function (k, bi) { html += kitapHtml(k, bi); });
        baslik = "Verridia — Üçleme";
      } else {
        var bi = +secim;
        html = kitapHtml(VERI.kitaplar[bi], bi);
        baslik = "Verridia — " + VERI.kitaplar[bi].ad;
      }
      kok.innerHTML = html;

      var eskiBaslik = document.title;
      document.title = baslik; // kaydedilen PDF'in dosya adı

      function temizle() {
        document.title = eskiBaslik;
        kok.innerHTML = "";
        if (hazir) hazir.classList.remove("acik");
        window.removeEventListener("afterprint", temizle);
      }
      window.addEventListener("afterprint", temizle);

      setTimeout(function () {
        if (hazir) hazir.classList.remove("acik");
        window.print();
        setTimeout(temizle, 1500);
      }, secim === "all" ? 450 : 150);
    }, 30);
  }

  function ac() { modal.hidden = false; }
  function kapat() { modal.hidden = true; }

  var btn = document.getElementById("btn-pdf");
  if (btn) btn.addEventListener("click", ac);
  var kapatBtn = document.getElementById("pdf-kapat");
  if (kapatBtn) kapatBtn.addEventListener("click", kapat);
  modal.addEventListener("click", function (e) { if (e.target === modal) kapat(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) kapat(); });
  document.querySelectorAll(".pdf-secenekler button").forEach(function (b) {
    b.addEventListener("click", function () { yazdir(b.dataset.kitap); });
  });

  if (location.hash === "#indir") setTimeout(ac, 400);
})();
