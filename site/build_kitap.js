#!/usr/bin/env node
/**
 * Verridia — Kitap derleyici
 * roman/ altındaki tüm bölüm .md dosyalarını okur,
 * site/assets/js/kitap-data.js olarak tek bir veri dosyası üretir.
 * Kullanım:  node site/build_kitap.js   (proje kökünden)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'assets', 'js', 'kitap-data.js');
const CHECK_ONLY = process.argv.includes('--check');

// Kitap / Kısım yapısı (klasör -> başlık eşlemesi)
const YAPI = [
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
    if (/^\*\*[A-ZÇĞİÖŞÜ ]+\*\*\s*$/.test(line)) { // çok-POV alt başlıkları (**TOGAN** vb.)
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
  const mNo = baslik.match(/^Bölüm\s+(\d+)\s*[—–-]\s*(.+)$/);
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

const data = { kitaplar: [], toplamBolum: 0, toplamKelime: 0 };

for (const kitapDef of YAPI) {
  const kitap = { ad: kitapDef.kitap, kisimlar: [] };
  for (const kisimDef of kitapDef.kisimlar) {
    const dir = path.join(ROOT, kisimDef.dir);
    if (!fs.existsSync(dir)) { console.warn('YOK, atlanıyor:', kisimDef.dir); continue; }
    const files = fs.readdirSync(dir)
      .filter(f => /^bolum\d+.*\.md$/.test(f))
      .sort((a, b) => {
        const na = parseInt(a.match(/^bolum(\d+)/)[1], 10);
        const nb = parseInt(b.match(/^bolum(\d+)/)[1], 10);
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

const js = '// Otomatik üretildi — node site/build_kitap.js\nwindow.VERRIDIA_KITAP = ' +
  JSON.stringify(data) + ';\n';
fs.mkdirSync(path.dirname(OUT), { recursive: true });
if (CHECK_ONLY) {
  const mevcut = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (mevcut !== js) {
    console.error(`GÜNCEL DEĞİL: ${path.relative(ROOT, OUT)} roman dosyalarından geri kalmış. "npm run build:kitap" çalıştır.`);
    process.exitCode = 1;
  } else {
    console.log(`GÜNCEL: ${data.toplamBolum} bölüm, ~${data.toplamKelime.toLocaleString('tr-TR')} kelime.`);
  }
} else {
  fs.writeFileSync(OUT, js, 'utf8');
  console.log(`Tamam: ${data.toplamBolum} bölüm, ~${data.toplamKelime.toLocaleString('tr-TR')} kelime -> ${path.relative(ROOT, OUT)} (${(js.length / 1024 / 1024).toFixed(2)} MB)`);
}
