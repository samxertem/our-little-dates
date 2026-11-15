// Copies the app into www/, which Capacitor packs into the Android and iOS apps.
// The page is the same one Electron shows; this only gathers its files in one place:
//   - our own html/css/js + icon
//   - every node_modules/… file index.html links to, moved to vendor/…
//   - fonts trimmed to the subsets we can actually need (Gaegu alone ships 11 MB of Korean)
// Run with: npm run build:web   (cap sync runs it for you via npm run sync)
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'www');
const OWN_FILES = [
  'index.html', 'styles.css', 'icon.png',
  'themes.js', 'stickers.js', 'mochi.js', 'app.js', 'book.js',
  'store-device.js', 'store-preview.js', 'mobile.js',
];

// empty www/ rather than delete it: Windows refuses to remove a folder something has open
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) fs.rmSync(path.join(out, f), { recursive: true, force: true });
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };
for (const f of OWN_FILES) copy(path.join(root, f), path.join(out, f));

// ---------- which characters can show up? ----------
// Anything you might type is covered by latin + latin-ext (that includes ç ğ ı ö ş ü).
// On top of that, every symbol our own code prints (♡ ✿ ✦ ❦ …) must keep its font.
const used = new Set();
for (const f of OWN_FILES.filter((x) => /\.(html|js|css)$/.test(x))) {
  for (const ch of fs.readFileSync(path.join(root, f), 'utf8')) if (ch.codePointAt(0) > 0x7f) used.add(ch.codePointAt(0));
}
const rangesOf = (unicodeRange) => unicodeRange.split(',').map((r) => {
  const [a, b] = r.trim().replace(/^U\+/i, '').split('-');
  return [parseInt(a, 16), parseInt(b ?? a, 16)];
});
const coversUsed = (unicodeRange) => rangesOf(unicodeRange).some(([a, b]) => [...used].some((c) => c >= a && c <= b));

// Keeps the @font-face blocks we need (woff2 only — every phone browser reads it) and copies their files.
function trimFontCss(cssFile, outCssFile) {
  const css = fs.readFileSync(cssFile, 'utf8');
  const kept = [];
  for (const block of css.match(/@font-face\s*{[^}]*}/g) ?? []) {
    const woff2 = block.match(/url\((\.\/files\/[^)]+\.woff2)\)/)?.[1];
    const range = block.match(/unicode-range:\s*([^;]+);/)?.[1];
    if (!woff2) continue;
    const latin = /-latin(-ext)?-\d/.test(woff2);
    if (!latin && !(range && coversUsed(range))) continue;
    copy(path.resolve(path.dirname(cssFile), woff2), path.resolve(path.dirname(outCssFile), woff2));
    kept.push(block.replace(/src:[^;]+;/, `src: url(${woff2}) format('woff2');`));
  }
  fs.mkdirSync(path.dirname(outCssFile), { recursive: true });
  fs.writeFileSync(outCssFile, `${kept.join('\n\n')}\n`);
  return kept.length;
}

// ---------- node_modules links in index.html → vendor/ ----------
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/(["'])node_modules\/([^"']+)\1/g, (_m, q, rel) => {
  const from = path.join(root, 'node_modules', rel);
  const to = path.join(out, 'vendor', rel);
  if (rel.startsWith('@fontsource/') && rel.endsWith('.css')) {
    const n = trimFontCss(from, to);
    console.log(`  font  ${rel}  (${n} subset${n === 1 ? '' : 's'})`);
  } else {
    copy(from, to);
    console.log(`  file  ${rel}`);
  }
  return `${q}vendor/${rel}${q}`;
});
fs.writeFileSync(path.join(out, 'index.html'), html);

const size = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .reduce((n, e) => n + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
console.log(`www/ is ready (${(size(out) / 1024 / 1024).toFixed(1)} MB)`);
