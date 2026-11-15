// Draws the app icon + splash screens as SVG (the pink gingham heart), renders them to PNG,
// and writes them to assets/, where `npx capacitor-assets generate` turns them into every
// size Android and iOS want. Run with: npm run icons
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'assets');
fs.mkdirSync(out, { recursive: true });

const PINK_LINE = 'rgba(243,160,182,.42)'; // same gingham as the "pink gingham" card look
const PAPER = '#fff6f8';

// gingham: vertical + horizontal half-stripes, overlapping into darker squares
function gingham(size, cell) {
  return `
    <defs><pattern id="g" width="${cell}" height="${cell}" patternUnits="userSpaceOnUse">
      <rect width="${cell / 2}" height="${cell}" fill="${PINK_LINE}"/>
      <rect width="${cell}" height="${cell / 2}" fill="${PINK_LINE}"/>
    </pattern></defs>
    <rect width="${size}" height="${size}" fill="${PAPER}"/>
    <rect width="${size}" height="${size}" fill="url(#g)"/>`;
}

// The heart: white die-cut edge, soft shadow and a little shine, centred at (cx, cy).
// `s` = its width in px.
function heart(cx, cy, s) {
  const k = s / 600; // drawn on a 600-wide grid
  const d = 'M300 540 C120 420 0 315 0 190 C0 85 80 10 175 10 C235 10 280 45 300 90 C320 45 365 10 425 10 C520 10 600 85 600 190 C600 315 480 420 300 540 Z';
  const t = `translate(${cx - 300 * k} ${cy - 275 * k}) scale(${k})`;
  return `
    <defs><filter id="sh" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="${18 / k}" stdDeviation="${16 / k}" flood-color="#b8606f" flood-opacity=".30"/>
    </filter></defs>
    <g transform="${t}">
      <path d="${d}" fill="#fff" stroke="#fff" stroke-width="${44}" stroke-linejoin="round" filter="url(#sh)"/>
      <path d="${d}" fill="#f4a3b8"/>
      <path d="${d}" fill="none" stroke="#e8869f" stroke-opacity=".35" stroke-width="6"/>
      <ellipse cx="150" cy="115" rx="52" ry="30" fill="#fff" fill-opacity=".85" transform="rotate(-18 150 115)"/>
    </g>`;
}

const svg = (size, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`;

const files = {
  // iOS + legacy Android: everything in one square (iOS rounds the corners itself)
  'icon-only.png': svg(1024, gingham(1024, 128) + heart(512, 530, 600)),
  // Android adaptive icons: capacitor-assets already insets these layers to the visible
  // area, so the heart is drawn the same size as above (the phone's crop still clears it)
  'icon-background.png': svg(1024, gingham(1024, 128)),
  'icon-foreground.png': svg(1024, heart(512, 530, 600)),
  // splash: the heart on cream, small enough to survive any screen's crop
  'splash.png': svg(2732, `<rect width="2732" height="2732" fill="#fbf5ee"/>${heart(1366, 1380, 640)}`),
  'splash-dark.png': svg(2732, `<rect width="2732" height="2732" fill="#3b2a2e"/>${heart(1366, 1380, 640)}`),
};

for (const [name, markup] of Object.entries(files)) {
  await sharp(Buffer.from(markup)).png().toFile(path.join(out, name));
  console.log(`  assets/${name}`);
}
// a small one for the README / desktop window, replacing the old 256px one
await sharp(Buffer.from(files['icon-only.png'])).resize(512, 512).png().toFile(path.join(root, 'icon.png'));
console.log('  icon.png (512)');
