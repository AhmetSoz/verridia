#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const KITAPLAR = [
  {
    ad: "Kitap 1",
    beklenenKisim: 4,
    beklenenBolum: 53,
    dizinler: ["kisim1", "kisim2", "kisim3", "kisim4"],
  },
  {
    ad: "Kitap 2",
    beklenenKisim: 8,
    beklenenBolum: 182,
    dizinler: [
      "kitap2_kisim1", "kitap2_kisim2", "kitap2_kisim3", "kitap2_kisim4",
      "kitap2_kisim5", "kitap2_kisim6", "kitap2_kisim7", "kitap2_kisim8",
    ],
  },
  {
    ad: "Kitap 3",
    beklenenKisim: 3,
    beklenenBolum: 71,
    dizinler: ["kitap3_kisim1", "kitap3_kisim2", "kitap3_kisim3"],
  },
];

const hatalar = [];
const sonuclar = [];

function oku(goreli) {
  return fs.readFileSync(path.join(ROOT, goreli), "utf8");
}

function bolumDosyalari(dizinler) {
  return dizinler.flatMap((dizin) => {
    const tam = path.join(ROOT, "roman", dizin);
    if (!fs.existsSync(tam)) {
      hatalar.push(`Eksik roman dizini: roman/${dizin}`);
      return [];
    }
    return fs.readdirSync(tam)
      .filter((ad) => /^bolum\d+.*\.md$/i.test(ad))
      .map((ad) => path.join(tam, ad));
  });
}

let toplamBolum = 0;
let toplamKelime = 0;
const tumBolumler = [];

for (const kitap of KITAPLAR) {
  const dosyalar = bolumDosyalari(kitap.dizinler);
  const kelime = dosyalar.reduce((toplam, dosya) => {
    const metin = fs.readFileSync(dosya, "utf8");
    return toplam + (metin.match(/\S+/g) || []).length;
  }, 0);

  if (kitap.dizinler.length !== kitap.beklenenKisim) {
    hatalar.push(`${kitap.ad}: kısım sayısı ${kitap.dizinler.length}, beklenen ${kitap.beklenenKisim}`);
  }
  if (dosyalar.length !== kitap.beklenenBolum) {
    hatalar.push(`${kitap.ad}: bölüm sayısı ${dosyalar.length}, beklenen ${kitap.beklenenBolum}`);
  }

  toplamBolum += dosyalar.length;
  toplamKelime += kelime;
  tumBolumler.push(...dosyalar);
  sonuclar.push({ kitap: kitap.ad, kisim: kitap.dizinler.length, bolum: dosyalar.length, kelime });
}

if (toplamBolum !== 306) hatalar.push(`Toplam bölüm ${toplamBolum}, kilitli kanon 306`);

const index = oku("kulliyat/00_INDEX.md");
const karakter = oku("kulliyat/21_karakter_kutugu.md");
const seri = oku("kulliyat/22_seri_kutusu.md");
const kart = oku("kulliyat/23_guncel_kanon_karti.md");
const nesir = oku("roman/TURKCE_NESIR_ANAYASASI.md");
const ilkKisimPlani = oku("roman/00_PLAN_kisim1.md");
const zaleenaIlkBolum = oku("roman/kisim1/bolum04_zaleena.md");
const siteIndex = oku("site/index.html");
const siteReadme = oku("site/README.md");

const zorunluIfadeler = [
  [index, "2. KİTAP TAMAMLANDI (8 Kısım, 182 bölüm)", "Ana indeks Kitap 2 sayısı"],
  [index, "3. KİTAP DEVAM EDİYOR (3 Kısım, 71 bölüm yazıldı)", "Ana indeks Kitap 3 sayısı"],
  [karakter, "8 Kısım, 182 bölüm tamamlandı", "Karakter Kütüğü Kitap 2 sayısı"],
  [seri, "8 Kısım, 182 bölüm", "Seri Kutusu Kitap 2 sayısı"],
  [kart, "Kaya kadındır, yaklaşık 35 yaşındadır", "Kaya kimlik kilidi"],
  [kart, "Bozan Han, Korgan'ın babası değil selefidir", "Bozan ilişki kilidi"],
  [nesir, "Dört POV'un Ses Profili", "Türkçe nesir standardı"],
  [ilkKisimPlani, "Zaleena'nın ilk bölümü, Karia'nın ilk bölümündeki Metheris sabahından 17 gün sonra geçer", "Faelan yolculuk zaman kilidi"],
  [ilkKisimPlani, "Börü ~35 yaşında ve yirmi yıla yaklaşan bir süredir Han'dır", "Börü hüküm süresi kilidi"],
  [zaleenaIlkBolum, "ZALEENA — ON YEDİ GÜN SONRA", "Zaleena bölüm zaman işareti"],
  [siteReadme, "3 kitap / 15 kısım / 306 bölüm", "Site README sayısı"],
];

for (const [metin, ifade, ad] of zorunluIfadeler) {
  if (!metin.includes(ifade)) hatalar.push(`${ad} eksik: "${ifade}"`);
}

const sayacBolum = siteIndex.match(/data-hedef="(\d+)"[^>]*>0<\/div><div class="ad">Bölüm/);
const sayacKelime = siteIndex.match(/data-hedef="(\d+)" data-ek=" bin"[^>]*>0<\/div><div class="ad">Kelime/);
const yuvarlakBin = Math.round(toplamKelime / 1000);
if (!sayacBolum || Number(sayacBolum[1]) !== toplamBolum) {
  hatalar.push(`Site bölüm sayacı romanla eşleşmiyor; beklenen ${toplamBolum}`);
}
if (!sayacKelime || Number(sayacKelime[1]) !== yuvarlakBin) {
  hatalar.push(`Site kelime sayacı romanla eşleşmiyor; beklenen ${yuvarlakBin} bin`);
}

const yasakIliski = [
  /babası\s+Bozan/iu,
  /Bozan Han\s*\(Korgan'ın babası\)/iu,
];

for (const dosya of tumBolumler) {
  const metin = fs.readFileSync(dosya, "utf8");
  for (const desen of yasakIliski) {
    if (desen.test(metin)) {
      hatalar.push(`Yasak Bozan ilişkisi: ${path.relative(ROOT, dosya)}`);
    }
  }
}

const kayaRetconKontrolleri = [
  ["roman/kisim2/bolum05_temujin.md", "omzunda süzülen bir adam"],
  ["roman/kisim2/bolum05_temujin.md", "esir düşmüştü bu adam"],
  ["roman/kisim3/bolum02_temujin.md", "adamın gözlerinde"],
  ["roman/kisim3/bolum02_temujin.md", "bu adamın sadakati"],
  ["roman/kitap3_kisim1/bolum25_togan.md", "kırk yıldır bozkırın"],
  ["roman/kitap3_kisim1/bolum27_karia.md", "bozkırlı, yaşlı bir kadını"],
];

for (const [dosya, yasak] of kayaRetconKontrolleri) {
  if (oku(dosya).includes(yasak)) hatalar.push(`Kaya retconu geri dönmüş: ${dosya} → ${yasak}`);
}

if (oku("roman/kisim1/bolum01_togan.md").includes("ayın soluk kızıl lekesi")) {
  hatalar.push("Kızıl Sürü yeniden yanlışlıkla Tek Göz'ün yüzeyine taşınmış: roman/kisim1/bolum01_togan.md");
}

console.table(sonuclar);
console.log(`Toplam: ${toplamBolum} bölüm, yaklaşık ${toplamKelime.toLocaleString("tr-TR")} kelime`);

if (hatalar.length) {
  console.error("\nKANON KONTROLÜ BAŞARISIZ:");
  for (const hata of hatalar) console.error(`- ${hata}`);
  process.exit(1);
}

console.log("KANON KONTROLÜ GEÇTİ.");
