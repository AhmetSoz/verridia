const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const romanRoot = path.join(root, 'roman');
const checkOnly = process.argv.includes('--check');
const requestedBook = process.argv.find((arg) => arg.startsWith('--book='));
const bookFilter = requestedBook ? Number(requestedBook.split('=')[1]) : null;
let failed = false;

function fail(message) {
  console.error(`BASKI HATASI: ${message}`);
  failed = true;
}

function chapterNumber(fileName) {
  const match = /^bolum(\d+)/i.exec(fileName);
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

function wordCount(markdown) {
  return (markdown.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || []).length;
}

function compileManifest(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const seen = new Set();
  const orderedParts = [];
  let fasilCount = 0;

  for (const part of manifest.parts) {
    const directory = path.join(romanRoot, part.directory);
    if (!fs.existsSync(directory)) {
      fail(`Kitap ${manifest.book}: kısım klasörü bulunamadı: ${part.directory}`);
      continue;
    }

    const files = fs.readdirSync(directory)
      .filter((file) => /^bolum\d+.*\.md$/i.test(file))
      .sort((a, b) => chapterNumber(a) - chapterNumber(b));
    const byNumber = new Map(files.map((file) => [chapterNumber(file), file]));
    const partFasillar = [];

    for (const fasil of part.fasillar) {
      fasilCount += 1;
      const scenes = [];
      if (!Number.isInteger(fasil.start) || !Number.isInteger(fasil.end) || fasil.start > fasil.end) {
        fail(`Kitap ${manifest.book} / ${part.title} / ${fasil.title}: geçersiz bölüm aralığı`);
        continue;
      }

      for (let number = fasil.start; number <= fasil.end; number += 1) {
        const file = byNumber.get(number);
        if (!file) {
          fail(`Kitap ${manifest.book} / ${part.title} / ${fasil.title}: ${number}. dijital bölüm bulunamadı`);
          continue;
        }
        const relative = path.posix.join(part.directory, file);
        if (seen.has(relative)) {
          fail(`Kitap ${manifest.book}: bölüm birden fazla fasılda kullanıldı: ${relative}`);
          continue;
        }
        seen.add(relative);
        const markdown = fs.readFileSync(path.join(directory, file), 'utf8');
        scenes.push({ markdown, title: titleFromMarkdown(markdown, file), words: wordCount(markdown) });
      }

      const fasilWords = scenes.reduce((total, scene) => total + scene.words, 0);
      if (fasilWords < 650 || fasilWords > 5500) {
        fail(`Kitap ${manifest.book} / ${part.title} / ${fasil.title}: ${fasilWords} kelimelik fasıl baskı ritmi sınırının dışında (650–5500)`);
      }

      partFasillar.push({ ...fasil, scenes, words: fasilWords });
    }

    for (const file of files) {
      const relative = path.posix.join(part.directory, file);
      if (!seen.has(relative)) {
        fail(`Kitap ${manifest.book}: hiçbir basılı fasıla girmeyen bölüm: ${relative}`);
      }
    }
    orderedParts.push({ ...part, fasillar: partFasillar });
  }

  if (seen.size !== manifest.expectedChapterCount) {
    fail(`Kitap ${manifest.book}: beklenen ${manifest.expectedChapterCount} bölüm yerine ${seen.size} bölüm kapsandı`);
  }
  if (fasilCount !== manifest.expectedFasilCount) {
    fail(`Kitap ${manifest.book}: beklenen ${manifest.expectedFasilCount} fasıl yerine ${fasilCount} fasıl tanımlandı`);
  }

  const lines = [
    `# VERRIDIA — KİTAP ${['', 'I', 'II', 'III'][manifest.book]}: ${manifest.title}`,
    '',
    '> Bu dosya dijital bölüm kaynaklarından otomatik üretilmiştir. Kaynak metinleri doğrudan düzenleyin.',
    ''
  ];
  let globalFasil = 0;

  for (const part of orderedParts) {
    lines.push(`# ${part.id}. Kısım — ${part.title}`, '');
    for (const fasil of part.fasillar) {
      globalFasil += 1;
      lines.push(`## Fasıl ${globalFasil} — ${fasil.title}`, '');
      for (const scene of fasil.scenes) {
        lines.push(sceneMarkdown(scene.markdown, scene.title), '');
      }
    }
  }

  const outputPath = path.join(romanRoot, 'derleme', `VERRIDIA_KITAP${manifest.book}_BASKI.md`);
  const content = `${lines.join('\n').trim()}\n`;
  const fasilWords = orderedParts.flatMap((part) => part.fasillar.map((fasil) => fasil.words));
  return {
    manifest,
    outputPath,
    content,
    chapterCount: seen.size,
    fasilCount,
    minFasilWords: Math.min(...fasilWords),
    maxFasilWords: Math.max(...fasilWords)
  };
}

const manifestPaths = fs.readdirSync(romanRoot)
  .filter((file) => /^KITAP\d+_BASKI_MANIFESTI\.json$/i.test(file))
  .map((file) => path.join(romanRoot, file))
  .filter((file) => {
    if (!bookFilter) return true;
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
    return manifest.book === bookFilter;
  })
  .sort();

if (bookFilter && manifestPaths.length === 0) {
  fail(`${bookFilter}. kitap için baskı manifesti bulunamadı`);
}

const compilations = manifestPaths.map(compileManifest);
if (failed) process.exit(1);

for (const item of compilations) {
  if (checkOnly) {
    if (!fs.existsSync(item.outputPath)) {
      fail(`Kitap ${item.manifest.book}: baskı derlemesi yok; npm run build:baski çalıştırın`);
      continue;
    }
    const current = fs.readFileSync(item.outputPath, 'utf8');
    if (current !== item.content) {
      fail(`Kitap ${item.manifest.book}: baskı derlemesi kaynaklardan eski; npm run build:baski çalıştırın`);
      continue;
    }
    console.log(`BASKI GEÇTİ: Kitap ${item.manifest.book}, ${item.chapterCount} dijital bölüm, ${item.fasilCount} basılı fasıl; fasıl aralığı ${item.minFasilWords}–${item.maxFasilWords} kelime.`);
  } else {
    fs.mkdirSync(path.dirname(item.outputPath), { recursive: true });
    fs.writeFileSync(item.outputPath, item.content, 'utf8');
    console.log(`BASKI ÜRETİLDİ: ${path.relative(root, item.outputPath)} (${item.chapterCount} bölüm / ${item.fasilCount} fasıl; ${item.minFasilWords}–${item.maxFasilWords} kelime)`);
  }
}

if (failed) process.exit(1);
