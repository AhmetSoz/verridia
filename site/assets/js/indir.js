/* VERRIDIA — PDF indirme (tarayıcının "PDF olarak kaydet" motoruyla) */
(function () {
  "use strict";
  var VERI = window.VERRIDIA_KITAP;
  var kok = document.getElementById("pdf-root");
  var modal = document.getElementById("pdf-modal");
  var hazir = document.getElementById("pdf-hazir");
  if (!VERI || !kok || !modal) return;

  function povChip(p) { return p ? '<div class="pdf-pov">' + p + "</div>" : ""; }

  function kitapHtml(kitap, seriKapak) {
    var h = '<div class="pdf-kapak' + (seriKapak ? " pdf-seri-kapak" : "") + '">' +
            '<div class="pdf-seri">VERRIDIA</div>' +
            '<div class="pdf-kitap-ad">' + kitap.ad + "</div>";
    if (kitap.alt) h += '<div class="pdf-alt">' + kitap.alt + "</div>";
    h += "</div>";
    kitap.kisimlar.forEach(function (kisim, i) {
      h += '<section class="pdf-kisim-bolucu">' +
           '<div class="pdf-kisim-no">' + (i + 1) + ". Kısım</div>" +
           '<div class="pdf-kisim-ad">' + kisim.ad + "</div></section>";
      kisim.bolumler.forEach(function (b) {
        h += '<article class="pdf-bolum">' +
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

    // Ağır DOM'u kurmadan önce ekranın "Hazırlanıyor" yazısını göstermesine izin ver
    setTimeout(function () {
      var html, baslik;
      if (secim === "all") {
        html = '<div class="pdf-kapak pdf-seri-kapak"><div class="pdf-kitap-ad">VERRIDIA</div>' +
               '<div class="pdf-alt">Üçleme — Bütün Kitaplar</div></div>';
        VERI.kitaplar.forEach(function (k) { html += kitapHtml(k, false); });
        baslik = "Verridia — Üçleme";
      } else {
        var k = VERI.kitaplar[+secim];
        html = kitapHtml(k, false);
        baslik = "Verridia — " + k.ad;
      }
      kok.innerHTML = html;

      var eskiBaslik = document.title;
      document.title = baslik; // kaydedilen PDF'in dosya adı bundan gelir

      function temizle() {
        document.title = eskiBaslik;
        kok.innerHTML = "";
        if (hazir) hazir.classList.remove("acik");
        window.removeEventListener("afterprint", temizle);
      }
      window.addEventListener("afterprint", temizle);

      // Yerleşim otursun, sonra yazdır
      setTimeout(function () {
        if (hazir) hazir.classList.remove("acik");
        window.print();
        // afterprint bazı tarayıcılarda gecikir; güvenlik için başlığı da geri al
        setTimeout(temizle, 1500);
      }, secim === "all" ? 400 : 150);
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

  // index.html'den "kitap.html#indir" ile gelinirse pencereyi otomatik aç
  if (location.hash === "#indir") setTimeout(ac, 400);
})();
