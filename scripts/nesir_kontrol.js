#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const YALNIZ_YENI = process.argv.includes("--yalniz-yeni");
const DIZIN_ARG = process.argv.find((arg) => arg.startsWith("--dizin="));
const TEK_DIZIN = DIZIN_ARG?.slice("--dizin=".length).replace(/\\/g, "/");

const TUM_DENETLENEN_KISIMLAR = [
  {
    dizin: "roman/kisim1",
    asgariKelime: 450,
    ozelAltSinirlar: {
      "bolum01_togan.md": 600,
      "bolum02_temujin.md": 600,
      "bolum03_karia.md": 600,
      "bolum04_zaleena.md": 600,
    },
  },
  { dizin: "roman/kisim2", asgariKelime: 220, ozelAltSinirlar: {} },
  { dizin: "roman/kisim3", asgariKelime: 300, ozelAltSinirlar: {} },
  { dizin: "roman/kisim4", asgariKelime: 300, ozelAltSinirlar: {} },
  { dizin: "roman/kitap2_kisim1", asgariKelime: 180, ozelAltSinirlar: {} },
  { dizin: "roman/kitap2_kisim2", asgariKelime: 180, ozelAltSinirlar: {} },
  { dizin: "roman/kitap2_kisim3", asgariKelime: 180, ozelAltSinirlar: {} },
  { dizin: "roman/kitap2_kisim4", asgariKelime: 180, ozelAltSinirlar: {} },
  { dizin: "roman/kitap2_kisim5", asgariKelime: 180, ozelAltSinirlar: {} },
  { dizin: "roman/kitap2_kisim6", asgariKelime: 180, ozelAltSinirlar: {} },
  { dizin: "roman/kitap2_kisim7", asgariKelime: 180, ozelAltSinirlar: {} },
  { dizin: "roman/kitap2_kisim8", asgariKelime: 180, ozelAltSinirlar: {} },
  { dizin: "roman/kitap3_kisim1", asgariKelime: 180, ozelAltSinirlar: {} },
  { dizin: "roman/kitap3_kisim2", asgariKelime: 180, ozelAltSinirlar: {} },
  { dizin: "roman/kitap3_kisim3", asgariKelime: 180, ozelAltSinirlar: {} },
  { dizin: "roman/kitap3_kisim4", asgariKelime: 450, ozelAltSinirlar: {} },
  { dizin: "roman/kitap3_kisim5", asgariKelime: 450, ozelAltSinirlar: {} },
];

const ILK_FILTRE = YALNIZ_YENI
  ? TUM_DENETLENEN_KISIMLAR.filter(({ dizin }) => /kitap3_kisim[45]$/u.test(dizin))
  : TUM_DENETLENEN_KISIMLAR;

const DENETLENEN_KISIMLAR = TEK_DIZIN
  ? ILK_FILTRE.filter(({ dizin }) => dizin === TEK_DIZIN)
  : ILK_FILTRE;

if (TEK_DIZIN && DENETLENEN_KISIMLAR.length === 0) {
  console.error(`Denetlenecek dizin bulunamadı: ${TEK_DIZIN}`);
  process.exit(1);
}

const POV_ADLARI = [
  ["_togan.md", "TOGAN"],
  ["_temujin.md", "TEMUJİN"],
  ["_karia.md", "KARIA"],
  ["_zaleena.md", "ZALEENA"],
  ["_kisim_kapanisi.md", "KAPANIŞ"],
  ["_kapanis.md", "KAPANIŞ"],
  ["_dortyol.md", "TOGAN / TEMUJİN / KARİA / ZALEENA"],
  ["_kitap2_finali.md", "KAPANIŞ"],
];

const DENETLENEN_BOLUMLER = DENETLENEN_KISIMLAR.flatMap(
  ({ dizin, asgariKelime, ozelAltSinirlar }) => {
    const tamDizin = path.join(ROOT, dizin);
    if (!fs.existsSync(tamDizin)) return [];

    return fs
      .readdirSync(tamDizin)
      .filter((dosya) => /^bolum\d+_[a-z0-9_]+\.md$/iu.test(dosya))
      .sort((a, b) => a.localeCompare(b, "tr"))
      .map((dosya) => {
        const kucukDosya = dosya.toLocaleLowerCase("tr");
        const pov = POV_ADLARI.find(([sonEk]) => kucukDosya.includes(sonEk.slice(0, -3)))?.[1];
        return [
          path.posix.join(dizin, dosya),
          pov,
          ozelAltSinirlar[dosya] ?? asgariKelime,
        ];
      });
  },
);

const KESIN_UYARILAR = [
  [/\bhenüz değil\b/giu, '"henüz değil" dramatik eki'],
  [/(?:sesinde|gözlerinde|yüzünde)[^.!?\n]{0,60}\bvardı\b/giu, "soyut duygu etiketi"],
  [/\b(?:hiç\s+)?kimsenin\s+(?:görmediği|duymadığı|bilmediği|fark etmediği)\b/giu, "yapay tanık cümlesi"],
];

const hatalar = [];
const rapor = [];

for (const [goreli, pov, asgariKelime] of DENETLENEN_BOLUMLER) {
  const tam = path.join(ROOT, goreli);
  const metin = fs.readFileSync(tam, "utf8");
  const kelime = (metin.match(/[\p{L}\p{N}'’]+/gu) || []).length;
  const uzunTire = (metin.match(/—/g) || []).length;
  const cumleler = metin.split(/[.!?]+(?:\s+|$)|\r?\n+/u).filter(Boolean);
  const azamiVirgul = cumleler.reduce(
    (azami, cumle) => Math.max(azami, (cumle.match(/,/g) || []).length),
    0,
  );

  if (!pov) hatalar.push(`${goreli}: dosya adından POV belirlenemedi`);
  else if (!metin.includes(`*(${pov}`)) hatalar.push(`${goreli}: POV başlığı ${pov} değil`);
  if (kelime < asgariKelime) hatalar.push(`${goreli}: bölüm yanlışlıkla kısalmış olabilir (${kelime} kelime; alt sınır ${asgariKelime})`);
  if (uzunTire > 2) hatalar.push(`${goreli}: uzun tire sayısı ${uzunTire}; nesir sınırı 2`);
  if (azamiVirgul > 4) hatalar.push(`${goreli}: bir cümlede ${azamiVirgul} virgül var; nesir sınırı 4`);

  for (const [desen, ad] of KESIN_UYARILAR) {
    desen.lastIndex = 0;
    if (desen.test(metin)) hatalar.push(`${goreli}: ${ad}`);
  }

  rapor.push({ dosya: path.join(path.basename(path.dirname(goreli)), path.basename(goreli)), pov, kelime, uzunTire, azamiVirgul });
}

console.table(rapor);

if (hatalar.length) {
  console.error("\nNESİR KONTROLÜ BAŞARISIZ:");
  for (const hata of hatalar) console.error(`- ${hata}`);
  process.exit(1);
}

console.log("NESİR KONTROLÜ GEÇTİ.");
