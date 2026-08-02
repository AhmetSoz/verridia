#!/usr/bin/env node
/**
 * Verridia — Kitap derleyici
 * Türkçe romanı ve tamamlanmış İngilizce çeviriyi okur,
 * iki ayrı tarayıcı veri dosyası üretir.
 * Kullanım:  node site/build_kitap.js   (proje kökünden)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_TR = path.join(__dirname, 'assets', 'js', 'kitap-data.js');
const OUT_EN = path.join(__dirname, 'assets', 'js', 'kitap-data-en.js');
const CHECK_ONLY = process.argv.includes('--check');

// Kitap / Kısım yapısı (klasör -> başlık eşlemesi)
const YAPI_TR = [
  {
    kitap: 'Birinci Kitap',
    kisimlar: [
      { dir: 'roman/kisim1', ad: 'Kül ve Kan Yemini' },
      { dir: 'roman/kisim2', ad: 'Kanatların Düşüşü' },
      { dir: 'roman/kisim3', ad: 'Gölgelerin Ordusu' },
      { dir: 'roman/kisim4', ad: 'Kızıl Hafta' },
    ],
  },
  {
    kitap: 'İkinci Kitap',
    kisimlar: [
      { dir: 'roman/kitap2_kisim1', ad: 'Hafızanın Bedeli' },
      { dir: 'roman/kitap2_kisim2', ad: 'Kâhyaların Diyarı' },
      { dir: 'roman/kitap2_kisim3', ad: 'Kazanılan Denge' },
      { dir: 'roman/kitap2_kisim4', ad: 'Bağlı Ufuklar' },
      { dir: 'roman/kitap2_kisim5', ad: 'Aynı Rüzgârın Dört Yönü' },
      { dir: 'roman/kitap2_kisim6', ad: 'Gölgenin Ardındaki Işık' },
      { dir: 'roman/kitap2_kisim7', ad: 'Büyük Uzlaşma' },
      { dir: 'roman/kitap2_kisim8', ad: 'Dört Yol, Ayrı Mühürler' },
    ],
  },
  {
    kitap: 'Üçüncü Kitap',
    kisimlar: [
      { dir: 'roman/kitap3_kisim1', ad: 'Sessiz Taşlar' },
      { dir: 'roman/kitap3_kisim2', ad: 'Kırılan Düğüm' },
      { dir: 'roman/kitap3_kisim3', ad: 'Büyük Döngü' },
      { dir: 'roman/kitap3_kisim4', ad: 'İkinci Anahtar' },
      { dir: 'roman/kitap3_kisim5', ad: 'Tam Seçim' },
    ],
  },
];

const YAPI_EN = [
  {
    kitap: 'Book One',
    alt: 'Crimson Week',
    kisimlar: [
      { dir: 'roman_en/book1/part1', ad: 'The Oath of Ash and Blood' },
      { dir: 'roman_en/book1/part2', ad: 'The Fall of Wings' },
      { dir: 'roman_en/book1/part3', ad: 'Army of Shadows' },
      { dir: 'roman_en/book1/part4', ad: 'Crimson Week' },
    ],
  },
];

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Basit satır-içi markdown: **bold**, *italik*
function inlineMd(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let para = [];
  const flush = () => {
    if (para.length) {
      out.push('<p>' + inlineMd(escapeHtml(para.join(' '))) + '</p>');
      para = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^---\s*$/.test(line)) { flush(); out.push('<div class="sahne-ayrimi"><span>✦</span></div>'); continue; }
    if (/^#\s/.test(line)) { continue; } // ana başlık ayrı işleniyor
    if (/^\*\(.+\)\*\s*$/.test(line)) { continue; } // POV satırı ayrı işleniyor
    if (/^\*\*(.+?)\*\*\s*$/.test(line)) { // iç sahne / çok-POV alt başlıkları
      flush();
      out.push('<h3 class="pov-alt">' + escapeHtml(line.replace(/\*\*/g, '')) + '</h3>');
      continue;
    }
    if (line === '') { flush(); continue; }
    para.push(line);
  }
  flush();
  return out.join('\n');
}

function parseBolum(fp) {
  const md = fs.readFileSync(fp, 'utf8');
  const mTitle = md.match(/^#\s+(.+?)\s*$/m);
  const mPov = md.match(/^\*\((.+?)\)\*\s*$/m);
  let baslik = mTitle ? mTitle[1] : path.basename(fp, '.md');
  // "Bölüm 5 — Karaçul'un Kararı" -> no, başlığı ayır
  let no = null, ad = baslik;
  const mNo = baslik.match(/^(?:Bölüm|Chapter)\s+(\d+)\s*[—–-]\s*(.+)$/i);
  if (mNo) { no = parseInt(mNo[1], 10); ad = mNo[2]; }
  const kelime = md.split(/\s+/).filter(Boolean).length;
  return {
    no,
    ad,
    pov: mPov ? mPov[1] : '',
    kelime,
    html: mdToHtml(md),
  };
}

function veriOlustur(yapi) {
  const data = { kitaplar: [], toplamBolum: 0, toplamKelime: 0 };
  for (const kitapDef of yapi) {
    const kitap = { ad: kitapDef.kitap, alt: kitapDef.alt || '', kisimlar: [] };
    for (const kisimDef of kitapDef.kisimlar) {
      const dir = path.join(ROOT, kisimDef.dir);
      if (!fs.existsSync(dir)) { console.warn('YOK, atlanıyor:', kisimDef.dir); continue; }
      const files = fs.readdirSync(dir)
        .filter(f => /^(?:bolum|chapter)\d+.*\.md$/i.test(f))
        .sort((a, b) => {
          const na = parseInt(a.match(/^(?:bolum|chapter)(\d+)/i)[1], 10);
          const nb = parseInt(b.match(/^(?:bolum|chapter)(\d+)/i)[1], 10);
          return na - nb;
        });
      const kisim = { ad: kisimDef.ad, bolumler: [] };
      for (const f of files) {
        const b = parseBolum(path.join(dir, f));
        if (b.no === null) b.no = kisim.bolumler.length + 1;
        kisim.bolumler.push(b);
        data.toplamBolum++;
        data.toplamKelime += b.kelime;
      }
      kitap.kisimlar.push(kisim);
    }
    data.kitaplar.push(kitap);
  }
  return data;
}

function jsOlustur(data, degisken, eskiUyumluluk) {
  return '// Otomatik üretildi — node site/build_kitap.js\nwindow.' + degisken + ' = ' +
    JSON.stringify(data) + ';\n' + (eskiUyumluluk ? 'window.VERRIDIA_KITAP = window.' + degisken + ';\n' : '');
}

const tr = veriOlustur(YAPI_TR);
const en = veriOlustur(YAPI_EN);
const ciktilar = [
  { out: OUT_TR, data: tr, js: jsOlustur(tr, 'VERRIDIA_KITAP_TR', true), dil: 'TR' },
  { out: OUT_EN, data: en, js: jsOlustur(en, 'VERRIDIA_KITAP_EN', false), dil: 'EN' },
];

fs.mkdirSync(path.dirname(OUT_TR), { recursive: true });
for (const cikti of ciktilar) {
  if (CHECK_ONLY) {
    const mevcut = fs.existsSync(cikti.out) ? fs.readFileSync(cikti.out, 'utf8') : '';
    if (mevcut !== cikti.js) {
      console.error(`GÜNCEL DEĞİL: ${path.relative(ROOT, cikti.out)} kaynak metinden geri kalmış. "npm run build:kitap" çalıştır.`);
      process.exitCode = 1;
    } else {
      console.log(`${cikti.dil} GÜNCEL: ${cikti.data.toplamBolum} bölüm, ~${cikti.data.toplamKelime.toLocaleString(cikti.dil === 'TR' ? 'tr-TR' : 'en-US')} kelime.`);
    }
  } else {
    fs.writeFileSync(cikti.out, cikti.js, 'utf8');
    console.log(`${cikti.dil}: ${cikti.data.toplamBolum} bölüm, ~${cikti.data.toplamKelime.toLocaleString(cikti.dil === 'TR' ? 'tr-TR' : 'en-US')} kelime -> ${path.relative(ROOT, cikti.out)} (${(cikti.js.length / 1024 / 1024).toFixed(2)} MB)`);
  }
}
