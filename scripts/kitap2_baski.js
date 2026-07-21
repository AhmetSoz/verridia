const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const romanRoot = path.join(root, 'roman');
const manifestPath = path.join(romanRoot, 'KITAP2_BASKI_MANIFESTI.json');
const outputPath = path.join(romanRoot, 'derleme', 'VERRIDIA_KITAP2_BASKI.md');

function fail(message) {
  console.error(`BASKI MANİFESTİ HATASI: ${message}`);
  process.exitCode = 1;
}

function chapterNumber(fileName) {
  const match = /^bolum(\d+)/.exec(fileName);
  return match ? Number(match[1]) : null;
}

function titleFromMarkdown(markdown, fallback) {
  const line = markdown.split(/\r?\n/).find((item) => item.startsWith('# '));
  return line ? line.replace(/^#\s+/, '').trim() : fallback;
}

function sceneMarkdown(markdown, fallback) {
  const lines = markdown.trim().split(/\r?\n/);
  const titleIndex = lines.findIndex((item) => item.startsWith('# '));
  if (titleIndex >= 0) {
    lines[titleIndex] = `### ${lines[titleIndex].replace(/^#\s+/, '').trim()}`;
  } else {
    lines.unshift(`### ${fallback}`);
  }
  return lines.join('\n');
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const seen = new Set();
const orderedScenes = [];
let fasilCount = 0;

for (const part of manifest.parts) {
  const directory = path.join(romanRoot, part.directory);
  if (!fs.existsSync(directory)) {
    fail(`Kısım klasörü bulunamadı: ${part.directory}`);
    continue;
  }

  const files = fs.readdirSync(directory)
    .filter((file) => /^bolum\d+.*\.md$/i.test(file))
    .sort((a, b) => chapterNumber(a) - chapterNumber(b));
  const byNumber = new Map(files.map((file) => [chapterNumber(file), file]));
  const partScenes = [];

  for (const fasil of part.fasillar) {
    fasilCount += 1;
    const fasilScenes = [];
    if (!Number.isInteger(fasil.start) || !Number.isInteger(fasil.end) || fasil.start > fasil.end) {
      fail(`${part.title} / ${fasil.title}: geçersiz bölüm aralığı`);
      continue;
    }

    for (let number = fasil.start; number <= fasil.end; number += 1) {
      const file = byNumber.get(number);
      if (!file) {
        fail(`${part.title} / ${fasil.title}: ${number}. dijital bölüm bulunamadı`);
        continue;
      }
      const relative = path.posix.join(part.directory, file);
      if (seen.has(relative)) {
        fail(`Bölüm birden fazla fasılda kullanıldı: ${relative}`);
        continue;
      }
      seen.add(relative);
      const markdown = fs.readFileSync(path.join(directory, file), 'utf8');
      fasilScenes.push({ relative, markdown, title: titleFromMarkdown(markdown, file) });
    }

    partScenes.push({ ...fasil, scenes: fasilScenes });
  }

  for (const file of files) {
    const relative = path.posix.join(part.directory, file);
    if (!seen.has(relative)) {
      fail(`Hiçbir basılı fasıla girmeyen bölüm: ${relative}`);
    }
  }

  orderedScenes.push({ ...part, fasillar: partScenes });
}

if (seen.size !== manifest.expectedChapterCount) {
  fail(`Beklenen ${manifest.expectedChapterCount} bölüm yerine ${seen.size} bölüm kapsandı`);
}
if (fasilCount !== manifest.expectedFasilCount) {
  fail(`Beklenen ${manifest.expectedFasilCount} fasıl yerine ${fasilCount} fasıl tanımlandı`);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

if (process.argv.includes('--check')) {
  console.log(`BASKI MANİFESTİ GEÇTİ: ${seen.size} dijital bölüm, ${fasilCount} basılı fasıl, ${manifest.parts.length} kısım.`);
  process.exit(0);
}

const lines = [
  `# VERRIDIA — KİTAP II: ${manifest.title}`,
  '',
  '> Bu dosya dijital bölüm kaynaklarından otomatik üretilmiştir. Kaynak metinleri doğrudan düzenleyin.',
  ''
];
let globalFasil = 0;

for (const part of orderedScenes) {
  lines.push(`# ${part.id}. Kısım — ${part.title}`, '');
  for (const fasil of part.fasillar) {
    globalFasil += 1;
    lines.push(`## Fasıl ${globalFasil} — ${fasil.title}`, '');
    for (const scene of fasil.scenes) {
      lines.push(sceneMarkdown(scene.markdown, scene.title), '');
    }
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${lines.join('\n').trim()}\n`, 'utf8');
console.log(`BASKI DERLEMESİ ÜRETİLDİ: ${path.relative(root, outputPath)} (${seen.size} bölüm / ${fasilCount} fasıl)`);
