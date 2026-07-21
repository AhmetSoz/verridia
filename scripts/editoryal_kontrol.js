const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const romanRoot = path.join(root, 'roman');
const sourceDirs = [
  'kisim1', 'kisim2', 'kisim3', 'kisim4',
  'kitap2_kisim1', 'kitap2_kisim2', 'kitap2_kisim3', 'kitap2_kisim4',
  'kitap2_kisim5', 'kitap2_kisim6', 'kitap2_kisim7', 'kitap2_kisim8',
  'kitap3_kisim1', 'kitap3_kisim2', 'kitap3_kisim3', 'kitap3_kisim4', 'kitap3_kisim5'
];
const errors = [];

function chapterNumber(fileName) {
  const match = /^bolum(\d+)/i.exec(fileName);
  return match ? Number(match[1]) : null;
}

function filesIn(directory) {
  const full = path.join(romanRoot, directory);
  return fs.readdirSync(full)
    .filter((file) => /^bolum\d+.*\.md$/i.test(file))
    .sort((a, b) => chapterNumber(a) - chapterNumber(b))
    .map((file) => ({
      directory,
      file,
      relative: path.posix.join('roman', directory, file),
      number: chapterNumber(file),
      text: fs.readFileSync(path.join(full, file), 'utf8')
    }));
}

const chapters = sourceDirs.flatMap(filesIn);

if (chapters.length !== 358) {
  errors.push(`Kaynak bölüm sayısı 358 yerine ${chapters.length}.`);
}

for (const chapter of chapters) {
  if (!/^# Bölüm \d+\s+—\s+/u.test(chapter.text)) {
    errors.push(`${chapter.relative}: standart bölüm başlığı yok.`);
  }
  if (/\b(?:TODO|TBD|FIXME|PLACEHOLDER)\b/iu.test(chapter.text)) {
    errors.push(`${chapter.relative}: geçici üretim notu bulundu.`);
  }
  if (/^\*\([^\n]*devam edecek[^\n]*\)\*\s*$/imu.test(chapter.text)) {
    errors.push(`${chapter.relative}: yayıma sızan 'devam edecek' kapanışı bulundu.`);
  }
  const straightQuotes = (chapter.text.match(/"/g) || []).length;
  if (straightQuotes % 2 !== 0) {
    errors.push(`${chapter.relative}: kapanmayan düz konuşma tırnağı bulundu.`);
  }
  const openingQuotes = (chapter.text.match(/“/g) || []).length;
  const closingQuotes = (chapter.text.match(/”/g) || []).length;
  if (openingQuotes !== closingQuotes) {
    errors.push(`${chapter.relative}: açılan ve kapanan eğik konuşma tırnakları eşit değil.`);
  }
  if (/�|\u0000/u.test(chapter.text)) {
    errors.push(`${chapter.relative}: bozuk kodlama karakteri bulundu.`);
  }
  const paragraphs = chapter.text.split(/\r?\n\s*\r?\n/).map((item) => item.trim());
  for (let index = 1; index < paragraphs.length; index += 1) {
    if (paragraphs[index].length > 30 && paragraphs[index] === paragraphs[index - 1]) {
      errors.push(`${chapter.relative}: art arda yinelenen paragraf bulundu.`);
      break;
    }
  }
}

const allSource = chapters.map((item) => item.text).join('\n');
const banned = [
  [/Amara['’]nın elçisi Neris/iu, `Neris, Amara'nın elçisi değil Yamalı Liman dış denetçisidir.`],
  [/bunu bana borçlusun/iu, `Kaya'nın kanon dışı eski son sözü bulundu.`],
  [/Ucuz yönetimin bedelini Karakçı ödedi/iu, `Karakçı'nın ölümünü kesin nedene bağlayan eski cümle bulundu.`],
  [/Korgan[^\n.]{0,50}Bozan['’]ın oğlu/iu, `Korgan, Bozan'ın oğlu değildir.`],
  [/Sube[^\n.]{0,70}(?:Sungur büyücüsü|Kaya['’]nın sefer)/iu, `Sube'nin kimliği eski kanonla karıştırıldı.`]
];

for (const [pattern, message] of banned) {
  if (pattern.test(allSource)) errors.push(message);
}

function assertNoActiveAppearance(name, directories, minimumChapter = 1) {
  const active = new RegExp(`\\b${name}\\s+(?:dedi|sordu|bağırdı|fısıldadı|yanıtladı|cevap verdi|gülümsedi|ayağa kalktı|yürüdü|elini|başını|baktı)`, 'iu');
  for (const chapter of chapters) {
    if (!directories.includes(chapter.directory) || chapter.number < minimumChapter) continue;
    if (active.test(chapter.text)) {
      errors.push(`${chapter.relative}: ${name}, ölümünden sonra etkin karakter gibi görünüyor.`);
    }
  }
}

assertNoActiveAppearance('Finn', sourceDirs.filter((item) => /^kitap[23]_kisim/.test(item)));
assertNoActiveAppearance('Kaya', ['kitap3_kisim2', 'kitap3_kisim3', 'kitap3_kisim4', 'kitap3_kisim5']);
assertNoActiveAppearance('Karakçı', ['kitap3_kisim3', 'kitap3_kisim4', 'kitap3_kisim5']);
assertNoActiveAppearance('Boran', ['kitap3_kisim5'], 9);

const propaganda = fs.readFileSync(path.join(romanRoot, 'kitap3_kisim5', 'bolum17_temujin.md'), 'utf8');
if (!/Dört Bayrak ordusunun/iu.test(propaganda) || !/üstünü çizdi/iu.test(propaganda)) {
  errors.push(`Dört Bayrak propaganda cümlesinin metin içindeki reddi kayboldu.`);
}

const siteBuilder = fs.readFileSync(path.join(root, 'site', 'build_kitap.js'), 'utf8');
if (!/kitap2_kisim2', ad: 'Kâhyaların Diyarı'/u.test(siteBuilder)) {
  errors.push(`Kitap 2 ikinci kısım başlığı sitede 'Kâhyaların Diyarı' değil.`);
}

const requiredRecords = [
  'editoryal/00_DENETIM_PANOSU.md',
  'editoryal/01_KARAKTER_MATRISI.md',
  'editoryal/02_ZAMAN_COGRAFYA_LOJISTIK.md',
  'editoryal/03_BILGI_SAHIPLIGI.md',
  'editoryal/04_VAAT_KARSILIK_BEDEL.md',
  'editoryal/05_TARAMA_KAYDI.md',
  'KITAP1_BASKI_MANIFESTI.json',
  'KITAP2_BASKI_MANIFESTI.json',
  'KITAP3_BASKI_MANIFESTI.json'
];

for (const relative of requiredRecords) {
  if (!fs.existsSync(path.join(romanRoot, relative))) {
    errors.push(`Gerekli yayın kaydı yok: roman/${relative}`);
  }
}

if (errors.length) {
  console.error(`EDİTORYAL KONTROL BAŞARISIZ (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`EDİTORYAL KONTROL GEÇTİ: ${chapters.length} bölüm; kimlik, ölüm sonrası görünüm, geçici not ve yayın başlığı kilitleri temiz.`);
