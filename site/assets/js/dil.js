/* VERRIDIA — ortak Türkçe / English dil seçimi */
(function () {
  "use strict";

  var ANAHTAR = "verridia-dil";
  var etkinDil = "tr";

  function normalize(dil) { return dil === "en" ? "en" : "tr"; }

  function ilkDil() {
    try {
      var sorgu = new URL(window.location.href).searchParams.get("lang");
      if (sorgu === "tr" || sorgu === "en") return sorgu;
      return normalize(localStorage.getItem(ANAHTAR));
    } catch (e) {
      return "tr";
    }
  }

  function statikMetinleriUygula(dil) {
    document.documentElement.lang = dil;
    if (document.body && document.body.getAttribute("data-title-" + dil)) {
      document.title = document.body.getAttribute("data-title-" + dil);
    }
    document.querySelectorAll("[data-tr][data-en]").forEach(function (el) {
      el.textContent = el.getAttribute("data-" + dil);
    });
    ["title", "aria-label", "placeholder"].forEach(function (nitelik) {
      var ad = nitelik.replace("aria-label", "aria");
      document.querySelectorAll("[data-" + ad + "-tr][data-" + ad + "-en]").forEach(function (el) {
        el.setAttribute(nitelik, el.getAttribute("data-" + ad + "-" + dil));
      });
    });
    document.querySelectorAll("[data-dil-sec]").forEach(function (btn) {
      var aktif = btn.getAttribute("data-dil-sec") === dil;
      btn.classList.toggle("aktif", aktif);
      btn.setAttribute("aria-pressed", aktif ? "true" : "false");
    });
  }

  function adresiGuncelle(dil) {
    try {
      var adres = new URL(window.location.href);
      adres.searchParams.set("lang", dil);
      history.replaceState(null, "", adres.pathname + adres.search + adres.hash);
    } catch (e) { /* file protokolünde tercih yine localStorage'da kalır */ }
  }

  function ayarla(dil, ilkAcilis) {
    dil = normalize(dil);
    var degisti = etkinDil !== dil;
    etkinDil = dil;
    try { localStorage.setItem(ANAHTAR, dil); } catch (e) {}
    statikMetinleriUygula(dil);
    if (!ilkAcilis) adresiGuncelle(dil);
    if (degisti || ilkAcilis) {
      window.dispatchEvent(new CustomEvent("verridia:dil", { detail: { dil: dil } }));
    }
  }

  etkinDil = ilkDil();
  window.VerridiaDil = {
    get: function () { return etkinDil; },
    set: function (dil) { ayarla(dil, false); },
    text: function (tr, en) { return etkinDil === "en" ? en : tr; }
  };

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-dil-sec]");
    if (btn) ayarla(btn.getAttribute("data-dil-sec"), false);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { ayarla(etkinDil, true); }, { once: true });
  } else {
    ayarla(etkinDil, true);
  }
})();
