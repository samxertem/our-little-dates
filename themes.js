// ✿ card looks ✿
// Every pattern is a tiny SVG "tile" drawn from code and repeated as a CSS
// background, so there are no image files to manage. To add a new look,
// add one entry to THEMES at the bottom.
(() => {
  'use strict';

  const svg = (w, h, body, extra = '') =>
    `url("data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' ${extra}>${body}</svg>`
    )}")`;
  const g = (x, y, s, r, body) =>
    `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${body}</g>`;

  // ---------- little doodles ----------
  const dot = (x, y, r, fill, op = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${op}"/>`;

  const star = (x, y, r, fill, rot = 0) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2 + (rot * Math.PI) / 180;
      const rr = i % 2 ? r * 0.48 : r;
      pts.push(`${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${fill}" stroke-width="${(r * 0.3).toFixed(1)}" stroke-linejoin="round"/>`;
  };

  const HEART = 'M0 6C-8 0-8-6-4-6C-2-6 0-4 0-3C0-4 2-6 4-6C8-6 8 0 0 6Z';
  const heart = (x, y, s, fill, r = 0) => g(x, y, s, r, `<path d="${HEART}" fill="${fill}"/>`);
  const heartLine = (x, y, s, stroke, r = 0) =>
    g(x, y, s, r, `<path d="${HEART}" fill="none" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round"/>`);

  const sparkle = (x, y, s, fill) => g(x, y, s, 0, `<path d="M0-6Q1-1 6 0Q1 1 0 6Q-1 1-6 0Q-1-1 0-6Z" fill="${fill}"/>`);

  const blossom = (x, y, s, petal, center) => {
    let b = '';
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 * Math.PI) / 180 - Math.PI / 2;
      b += `<circle cx="${(Math.cos(a) * 3.4).toFixed(2)}" cy="${(Math.sin(a) * 3.4).toFixed(2)}" r="2.7" fill="${petal}"/>`;
    }
    return g(x, y, s, 0, b + `<circle r="1.7" fill="${center}"/>`);
  };

  const strawberry = (x, y, s, r) => {
    const seeds = [[-3, -1], [2, -3], [5, 1], [-1, 4], [3, 6], [-5, 3], [0, 9]]
      .map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx=".8" ry="1.2" fill="#ffe8a3"/>`).join('');
    return g(x, y, s, r, `
      <path d="M0-8C8-9 12-3 9 4C7 9 3 13 0 13C-3 13-7 9-9 4C-12-3-8-9 0-8Z" fill="#f26b80"/>
      <path d="M-6-4C-7-1-6 2-5 4" stroke="#ff9fb0" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      ${seeds}
      <path d="M0-8L-7-11L-3-8.5L-4-14L0-10L4-14L3-8.5L7-11Z" fill="#7cbf7f" stroke="#7cbf7f" stroke-width="1.4" stroke-linejoin="round"/>`);
  };

  const leaf = (x, y, s, r, fill) =>
    g(x, y, s, r, `<path d="M0 0C3-6 10-6 12 0C10 6 3 6 0 0Z" fill="${fill}"/><path d="M1 0H10" stroke="#ffffff" stroke-width=".8" opacity=".6"/>`);

  const bow = (x, y, s, color) => g(x, y, s, 0, `
    <g fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0 0C-3-6-11-7-11-1C-11 4-4 3 0 0Z"/><path d="M0 0C3-6 11-7 11-1C11 4 4 3 0 0Z"/>
      <path d="M-1 1C-3 6-5 9-7 12"/><path d="M1 1C3 6 5 9 7 12"/>
    </g><circle r="2" fill="${color}"/>`);

  const cloud = (x, y, s, fill, shadow) => {
    const blob = (dy, c) => `<g fill="${c}" transform="translate(0 ${dy})"><circle cx="-9" cy="2" r="6"/><circle cx="0" cy="-3" r="8.5"/><circle cx="9" cy="1" r="6.5"/><rect x="-15" y="1" width="30" height="7.5" rx="3.75"/></g>`;
    return g(x, y, s, 0, (shadow ? blob(2, shadow) : '') + blob(0, fill));
  };

  const daisy = (x, y, s, stem = false) => {
    let p = stem ? `<path d="M0 3V15" stroke="#8fbf86" stroke-width="1.4" stroke-linecap="round"/>` : '';
    for (let i = 0; i < 10; i++) p += `<ellipse cx="0" cy="-4.6" rx="1.7" ry="3.6" fill="#fffdf6" transform="rotate(${i * 36})"/>`;
    return g(x, y, s, 0, p + `<circle r="2.4" fill="#f7c64a"/>`);
  };

  const bunny = (x, y, s) => g(x, y, s, 0, `
    <g stroke="#cbb8a6" stroke-width="1.1" fill="#fffdf9">
      <ellipse cx="-3.5" cy="-14" rx="2.8" ry="7.5" transform="rotate(-12 -3.5 -14)"/>
      <ellipse cx="3.5" cy="-14" rx="2.8" ry="7.5" transform="rotate(12 3.5 -14)"/>
      <ellipse cx="0" cy="7" rx="10" ry="8"/>
      <circle cx="0" cy="-3" r="8"/>
    </g>
    <ellipse cx="-3.5" cy="-15" rx="1.1" ry="4" fill="#f7c3cb" transform="rotate(-12 -3.5 -14)"/>
    <ellipse cx="3.5" cy="-15" rx="1.1" ry="4" fill="#f7c3cb" transform="rotate(12 3.5 -14)"/>
    <path d="M-4.6-3.4q1.2 1.1 2.4 0M2.2-3.4q1.2 1.1 2.4 0" stroke="#7a6052" stroke-width="1" fill="none" stroke-linecap="round"/>
    <ellipse cx="-5.2" cy="-.4" rx="1.8" ry="1" fill="#f7b5c0"/><ellipse cx="5.2" cy="-.4" rx="1.8" ry="1" fill="#f7b5c0"/>`);

  const catFace = (x, y, s, r, line) => {
    const head = 'M-10 3C-11-3-10-8-8-12L-3.5-7.5C-1-8.3 1-8.3 3.5-7.5L8-12C10-8 11-3 10 3C9 9-9 9-10 3Z';
    return g(x, y, s, r, `
      <path d="${head}" fill="#fffaf3"/>
      <path d="M3.5-7.5L8-12C9.5-9 10-6 10-3C7-3 4.5-5 3.5-7.5Z" fill="#f3cfa6"/>
      <path d="${head}" fill="none" stroke="${line}" stroke-width="1.2" stroke-linejoin="round"/>
      <circle cx="-4" cy="0" r="1" fill="#6e5550"/><circle cx="4" cy="0" r="1" fill="#6e5550"/>
      <path d="M-2 2.6q1 1 2 0q1 1 2 0" stroke="#6e5550" stroke-width=".9" fill="none" stroke-linecap="round"/>
      <ellipse cx="-6.4" cy="2.6" rx="1.6" ry=".9" fill="#f7b5c0"/><ellipse cx="6.4" cy="2.6" rx="1.6" ry=".9" fill="#f7b5c0"/>`);
  };

  const tulip = (x, y, s, color) => g(x, y, s, 0, `
    <path d="M0 0V12" stroke="#9cc49a" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M0 8C-3 5-6 6-6 6C-5 9-2 10 0 10Z" fill="#9cc49a"/>
    <path d="M-4.5 0C-5.5-5-3.5-8.5-2.5-8.5L0-5.5L2.5-8.5C3.5-8.5 5.5-5 4.5 0C3.5 3-3.5 3-4.5 0Z" fill="${color}"/>`);

  const envelope = (x, y, s, r, line) => g(x, y, s, r, `
    <rect x="-8" y="-5.5" width="16" height="11" rx="2" fill="#fffaf3" stroke="${line}" stroke-width="1.1"/>
    <path d="M-7.5-4.5L0 1L7.5-4.5" fill="none" stroke="${line}" stroke-width="1.1" stroke-linejoin="round"/>
    <g transform="translate(0 2.5) scale(.32)"><path d="${HEART}" fill="#f4a3b8"/></g>`);

  const lilypad = (x, y, r, fill, rot) =>
    `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0L${r} ${-r * 0.18}A${r} ${r} 0 1 0 ${r} ${r * 0.18}Z" fill="${fill}"/></g>`;
  const ripple = (x, y, rx, ry, op = 0.28) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="#ffffff" stroke-width="1.4" opacity="${op}"/>`;

  const duck = (x, y, s, r) => g(x, y, s, r, `
    <ellipse cx="2" cy="5" rx="9" ry="11" fill="#4f7d60" opacity=".35"/>
    <ellipse cx="-4" cy="10" rx="2" ry="3" fill="#f4a25a"/><ellipse cx="4" cy="10" rx="2" ry="3" fill="#f4a25a"/>
    <ellipse cx="0" cy="3" rx="8" ry="10" fill="#fdfbf2"/>
    <circle cx="0" cy="-8" r="5.5" fill="#fdfbf2"/>
    <path d="M-2.2-12.8L0-16.5L2.2-12.8Z" fill="#f4a25a" stroke="#f4a25a" stroke-linejoin="round"/>`);

  const frog = (x, y, s) => g(x, y, s, 0, `
    <ellipse rx="6.5" ry="5.5" fill="#a3d18c"/>
    <circle cx="-3.5" cy="-4.5" r="2.4" fill="#a3d18c"/><circle cx="3.5" cy="-4.5" r="2.4" fill="#a3d18c"/>
    <circle cx="-3.5" cy="-4.8" r=".9" fill="#3d4a3a"/><circle cx="3.5" cy="-4.8" r=".9" fill="#3d4a3a"/>
    <path d="M-2 .5q2 1.6 4 0" stroke="#3d4a3a" stroke-width=".8" fill="none" stroke-linecap="round"/>`);

  const moon = (x, y, s, fill) => g(x, y, s, 0, `<path d="M0-8A8 8 0 1 0 8 0A6 6 0 0 1 0-8Z" fill="${fill}"/>`);
  const planet = (x, y, s, fill, ring) => g(x, y, s, 0, `
    <circle r="5" fill="${fill}"/>
    <ellipse rx="9.5" ry="2.6" fill="none" stroke="${ring}" stroke-width="1.3" transform="rotate(-20)"/>`);
  const tuft = (x, y, s, c) => g(x, y, s, 0,
    `<path d="M-3 0q1-4 0-6M0 0q0-5 1-8M3 0q0-4 2-5" stroke="${c}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`);
  const birds = (x, y, s, c) => g(x, y, s, 0,
    `<path d="M-4 0q2-2 4 0q2-2 4 0" stroke="${c}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`);

  // retro computer window for the y2k look
  const retroWin = (x, y, w, h, bar, r) => g(x, y, 1, r, `
    <rect x="${-w / 2 + 2}" y="${-h / 2 + 2}" width="${w}" height="${h}" rx="3" fill="#d9b3d6" opacity=".55"/>
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="3" fill="#fffafd" stroke="#c9a4d8" stroke-width="1.2"/>
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="8" rx="3" fill="${bar}"/>
    <rect x="${w / 2 - 7}" y="${-h / 2 + 2}" width="4.5" height="4" rx="1" fill="#fff"/>
    <rect x="${w / 2 - 13}" y="${-h / 2 + 2}" width="4.5" height="4" rx="1" fill="#fff"/>
    <rect x="${-w / 2 + 4}" y="${-h / 2 + 13}" width="${w * 0.55}" height="2.5" rx="1.2" fill="#ead6ef"/>
    <rect x="${-w / 2 + 4}" y="${-h / 2 + 19}" width="${w * 0.35}" height="2.5" rx="1.2" fill="#ead6ef"/>`);
  const pixelHeart = (x, y, p, fill) => {
    const rows = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
    let out = '';
    rows.forEach((row, j) => [...row].forEach((c, i) => {
      if (c === 'X') out += `<rect x="${x + i * p}" y="${y + j * p}" width="${p}" height="${p}" fill="${fill}"/>`;
    }));
    return out;
  };

  // pixel meadow: chunky grass + pixel flowers
  const pixelFlower = (x, y, p, petal) =>
    `<rect x="${x}" y="${y - p}" width="${p}" height="${p}" fill="${petal}"/>` +
    `<rect x="${x - p}" y="${y}" width="${p}" height="${p}" fill="${petal}"/>` +
    `<rect x="${x + p}" y="${y}" width="${p}" height="${p}" fill="${petal}"/>` +
    `<rect x="${x}" y="${y + p}" width="${p}" height="${p}" fill="${petal}"/>` +
    `<rect x="${x}" y="${y}" width="${p}" height="${p}" fill="#f7d24a"/>`;

  // film grain, for the vintage sky
  const grain = (op) =>
    `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${op} 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/>`;

  // big fluffy cumulus made of many overlapping puffs, lit from the top-left
  const cumulus = (x, y, s) => {
    const puffs = [[-34, 8, 16], [-18, -6, 20], [2, -16, 24], [22, -6, 19], [38, 8, 15], [-6, 10, 18], [16, 12, 16], [-24, 16, 12], [30, 18, 11]];
    const shade = puffs.map(([a, b, r]) => `<circle cx="${a + 3}" cy="${b + 4}" r="${r}" fill="#c9d8e4"/>`).join('');
    const light = puffs.map(([a, b, r]) => `<circle cx="${a}" cy="${b}" r="${r}" fill="#f6f2ea"/>`).join('');
    const glow = puffs.map(([a, b, r]) => `<circle cx="${a - 4}" cy="${b - 5}" r="${r * 0.55}" fill="#ffffff" opacity=".7"/>`).join('');
    return g(x, y, s, 0, shade + light + glow);
  };

  // ---------- seasonal doodles ----------
  const PETAL = 'M0 0C-3-2-3.6-6-2-8.4L0-7.2L2-8.4C3.6-6 3-2 0 0Z';
  const sakura = (x, y, s, fill, r = 0) => {
    let p = '';
    for (let i = 0; i < 5; i++) p += `<path d="${PETAL}" fill="${fill}" transform="rotate(${i * 72})"/>`;
    return g(x, y, s, r, `${p}<circle r="1.7" fill="#f58fa8"/>`);
  };
  const petal = (x, y, s, r, fill) => g(x, y, s, r, `<path d="${PETAL}" fill="${fill}"/>`);
  const twig = (x, y, s, r) => g(x, y, s, r,
    `<path d="M0 0C6-2 12-1 18-5M9-1.5C11 2 14 3 16 3" stroke="#b98a72" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);

  const MAPLE = 'M0-9L2-4L6-6L5-1L9 0L4 3L5 7L0 5L-5 7L-4 3L-9 0L-5-1L-6-6L-2-4Z';
  const maple = (x, y, s, r, fill) => g(x, y, s, r,
    `<path d="M0 4V11" stroke="${fill}" stroke-width="1.3" stroke-linecap="round"/><path d="${MAPLE}" fill="${fill}" stroke="${fill}" stroke-width="1.4" stroke-linejoin="round"/>`);
  const acorn = (x, y, s, r) => g(x, y, s, r,
    `<ellipse cy="2" rx="4.2" ry="5.2" fill="#d79a5c"/><path d="M-5.2-1C-5-5.5 5-5.5 5.2-1Z" fill="#9a6a45"/><path d="M0-4.5V-7" stroke="#9a6a45" stroke-width="1.2" stroke-linecap="round"/>`);
  const mushroom = (x, y, s) => g(x, y, s, 0,
    `<path d="M-2.5 0H2.5L3 7H-3Z" fill="#fbf1e2"/><path d="M-8 1C-8-6 8-6 8 1Z" fill="#e8705f"/>` +
    `<circle cx="-3.5" cy="-2" r="1.2" fill="#fff"/><circle cx="2.5" cy="-3" r="1" fill="#fff"/><circle cx="5" cy="-.5" r=".8" fill="#fff"/>`);

  const melon = (x, y, s, r) => g(x, y, s, r,
    `<path d="M-10 0A10 10 0 0 0 10 0Z" fill="#7dbb6c"/><path d="M-8.3 0A8.3 8.3 0 0 0 8.3 0Z" fill="#fff6e8"/><path d="M-7.2 0A7.2 7.2 0 0 0 7.2 0Z" fill="#f47c8c"/>` +
    [[-3.6, 2.2], [0, 3.6], [3.6, 2.2], [-1.6, 5.2], [1.8, 5.2]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx=".55" ry=".95" fill="#5a3a3e"/>`).join(''));
  const sun = (x, y, s, fill) => {
    let rays = '';
    for (let i = 0; i < 8; i++) rays += `<path d="M0-7.6V-10.4" stroke="${fill}" stroke-width="1.6" stroke-linecap="round" transform="rotate(${i * 45})"/>`;
    return g(x, y, s, 0, `${rays}<circle r="5.4" fill="${fill}"/>`);
  };

  const snowflake = (x, y, s, c) => {
    let arms = '';
    for (let i = 0; i < 6; i++) arms += `<path d="M0 0V-8M0-5L-2.2-7M0-5L2.2-7" stroke="${c}" stroke-width="1.3" stroke-linecap="round" fill="none" transform="rotate(${i * 60})"/>`;
    return g(x, y, s, 0, `${arms}<circle r="1.3" fill="${c}"/>`);
  };
  const mitten = (x, y, s, r, fill) => g(x, y, s, r,
    `<path d="M-4 6V-2C-4-7 4-7 4-2V6Z" fill="${fill}"/><path d="M3.4.5C7-1 8 3.5 4 4.5Z" fill="${fill}"/><rect x="-4.8" y="5" width="9.6" height="3.2" rx="1.2" fill="#fffaf3"/>`);
  const scarf = (x, y, s, r) => g(x, y, s, r,
    `<path d="M-10 0C-4 3 4 3 10 0L10.5 3C4 6-4 6-10.5 3Z" fill="#e8798c"/><path d="M5 3L7 9.5L10 8.5L8.5 2.5Z" fill="#e8798c"/>`);

  // ---------- tiles ----------
  const strawberryTile = svg(160, 160,
    strawberry(38, 44, 1.35, -18) + strawberry(120, 114, 1.15, 16) + strawberry(138, 30, .75, 32) +
    leaf(72, 132, .9, -30, '#a8d3a0') + leaf(20, 74, .7, 200, '#a8d3a0') +
    blossom(104, 52, 1.1, '#ffffff', '#f7cf5a') + blossom(36, 124, .9, '#ffffff', '#f7cf5a') +
    bow(80, 88, .85, '#f3a0b3') + sparkle(150, 74, .55, '#f6a5b8') + sparkle(14, 100, .5, '#f6a5b8') +
    dot(72, 18, 1.6, '#f6b6c4') + dot(96, 148, 1.6, '#f6b6c4') + heart(150, 148, .45, '#f6a5b8'));

  const starColors = ['#e2475e', '#2aa198', '#f4c542', '#5b86e5', '#f08a3c', '#2f8f6d', '#c45bd6'];
  const starSpots = [[20, 24, 7, -8], [78, 14, 5, 12], [128, 34, 8, 20], [50, 70, 6, -15], [104, 86, 7, 5], [20, 118, 8, 18], [70, 128, 5, -20], [132, 132, 6, 10], [140, 78, 4, 0]];
  const starTile = svg(150, 150,
    starSpots.map(([x, y, r, rot], i) => star(x, y, r, starColors[i % starColors.length], rot)).join('') +
    sparkle(92, 48, .9, '#fff7c2') + sparkle(30, 84, .6, '#ffffff') + sparkle(112, 116, .7, '#fff7c2'));

  const kittyLine = '#c6a196';
  const kittyTile = svg(170, 170,
    catFace(40, 46, 1.3, -6, kittyLine) + catFace(124, 120, 1.15, 10, kittyLine) +
    heartLine(118, 36, .9, '#e9a3b1', 12) + heart(56, 128, .65, '#f4b3c2', -10) +
    tulip(150, 62, .9, '#f4a3b8') + tulip(20, 92, .8, '#f7c88a') +
    sparkle(90, 86, .6, '#f2c3cd') + envelope(82, 150, .9, -8, kittyLine) +
    star(150, 154, 3.5, '#f6d38a') + dot(96, 20, 1.5, '#e9c2b6') + dot(16, 150, 1.5, '#e9c2b6'));

  const pondTile = svg(190, 190,
    `<ellipse cx="120" cy="80" rx="40" ry="14" fill="#7aa58a" opacity=".45"/><ellipse cx="40" cy="150" rx="30" ry="10" fill="#7aa58a" opacity=".4"/>` +
    ripple(62, 72, 24, 10) + ripple(62, 72, 36, 15, .16) + duck(62, 66, 1.05, -18) +
    lilypad(146, 36, 11, '#6d9c7c', 30) + lilypad(150, 142, 10, '#78a986', 200) + lilypad(28, 168, 7, '#6d9c7c', 110) +
    frog(150, 140, .75) + ripple(150, 142, 18, 7, .2) +
    dot(110, 22, 1.6, '#ffffff', .35) + dot(20, 40, 1.2, '#ffffff', .3) + dot(98, 170, 1.4, '#ffffff', .3) + dot(172, 92, 1.1, '#ffffff', .3));

  const meadowTile = svg(210, 210,
    cloud(46, 34, 1, '#fffdf8', '#e7dccb') + cloud(160, 92, .8, '#fffdf8', '#e7dccb') +
    moon(182, 26, .55, '#f2d48f') + bunny(70, 152, 1) + tulip(144, 168, .9, '#f4a3b8') + tulip(166, 174, .8, '#f9c98d') +
    tuft(30, 186, 1, '#a9c79a') + tuft(112, 190, .9, '#a9c79a') + tuft(194, 150, .8, '#a9c79a') +
    heart(110, 40, .45, '#f2b2bf') + sparkle(28, 100, .5, '#e9c46a') + birds(118, 120, .8, '#c9b8a6'));

  const galaxyTile = svg(150, 150,
    sparkle(24, 30, .9, '#fff4f6') + sparkle(110, 20, .6, '#ffe3a8') + sparkle(80, 96, 1, '#ffffff') + sparkle(20, 122, .6, '#ffe3a8') +
    moon(126, 82, .9, '#ffeec8') + planet(48, 68, .8, '#f8c4d0', '#fff1f4') + star(132, 136, 3, '#fff1f4') +
    dot(60, 20, 1, '#ffffff', .8) + dot(96, 50, .8, '#ffffff', .7) + dot(140, 46, 1, '#ffffff', .6) + dot(56, 132, .9, '#ffffff', .8) + dot(98, 140, 1.1, '#ffffff', .6) + dot(10, 70, .8, '#ffffff', .7));

  const skyTile = svg(220, 210,
    cloud(50, 40, 1.4, '#ffffff', '#d4ebf0') + cloud(168, 88, 1, '#ffffff', '#d4ebf0') + cloud(84, 116, .7, '#ffffff', '#d4ebf0') +
    birds(150, 36, 1, '#ffffff') + birds(170, 46, .7, '#ffffff') +
    daisy(28, 178, .9, true) + daisy(80, 170, .7, true) + daisy(132, 184, 1, true) + daisy(188, 174, .8, true));

  const daisyTile = svg(160, 160,
    daisy(36, 40, 1.2) + daisy(122, 112, 1) + daisy(130, 28, .6) + heart(112, 56, .55, '#f4a9b9', 10) + heart(40, 128, .5, '#f4a9b9', -10) +
    dot(80, 84, 1.8, '#f3d77f') + dot(20, 92, 1.4, '#f3d77f') + dot(84, 150, 1.4, '#f3d77f') + sparkle(76, 20, .55, '#f0c96b'));

  const y2kTile = svg(200, 200,
    retroWin(62, 58, 64, 44, '#f6a6c8', -4) + retroWin(150, 140, 54, 38, '#b8a6ef', 5) +
    pixelHeart(140, 26, 3, '#f58fb5') + pixelHeart(24, 150, 2.5, '#a9c3f5') +
    star(170, 80, 6, '#a9c3f5', 10) + star(36, 112, 5, '#f7c6dc', -10) + star(96, 178, 4, '#fff1a8', 0) +
    sparkle(108, 108, .8, '#ffffff') + sparkle(188, 186, .6, '#c9b6f2') + sparkle(14, 20, .6, '#c9b6f2') +
    heartLine(100, 20, .7, '#d79ad3', 8));

  const pixelTile = (() => {
    const p = 6; // one "pixel"
    const greens = ['#7fbf5e', '#88c766', '#74b456', '#8fcd6c'];
    let out = '';
    // scattered lighter/darker grass pixels on a 24x24 grid
    for (let j = 0; j < 24; j++) for (let i = 0; i < 24; i++) {
      const n = (i * 73 + j * 151 + i * j * 7) % 23;
      if (n < 6) out += `<rect x="${i * p}" y="${j * p}" width="${p}" height="${p}" fill="${greens[n % 4]}"/>`;
    }
    const flowers = [[3, 4, '#fffdf2'], [15, 3, '#f7b6d0'], [9, 10, '#fffdf2'], [20, 11, '#fff1a1'], [4, 17, '#c9b6f2'], [14, 19, '#fffdf2'], [21, 21, '#f7b6d0']];
    flowers.forEach(([i, j, c]) => { out += pixelFlower(i * p, j * p, p, c); });
    return svg(144, 144, out, 'shape-rendering="crispEdges"');
  })();

  const cloudTile = svg(320, 300, cumulus(90, 90, 1.5) + cumulus(240, 220, 1.2) + cumulus(250, 50, .6) + grain(.12));
  const grainOnly = svg(160, 160, grain(.14));

  const sakuraTile = svg(180, 180,
    twig(10, 70, 1.6, -12) + sakura(37, 55, 1.2, '#ffd6df') + sakura(22, 64, .75, '#ffe6ec') +
    sakura(128, 118, 1.35, '#ffd6df') + sakura(150, 36, .95, '#ffe6ec') + sakura(48, 140, 1, '#ffd6df') +
    petal(96, 84, .8, 40, '#f8bfcd') + petal(164, 92, .7, -30, '#f8bfcd') + petal(20, 110, .7, 110, '#ffd6df') +
    petal(98, 162, .8, 200, '#f8bfcd') + petal(104, 24, .6, 160, '#f8bfcd') +
    heart(84, 128, .45, '#f6a5b8') + sparkle(168, 162, .5, '#f6a5b8') + dot(112, 62, 1.4, '#f6b6c4'));

  const summerTile = svg(180, 180,
    melon(44, 40, 1.6, -14) + melon(132, 120, 1.4, 18) + sun(142, 34, 1, '#f8d36a') + sun(34, 134, .7, '#f8d36a') +
    heart(92, 84, .55, '#f6a5b8') + heart(160, 170, .4, '#f6a5b8') + sparkle(84, 150, .7, '#ffffff') + sparkle(100, 20, .55, '#ffffff') +
    dot(170, 82, 1.6, '#ffffff') + dot(16, 86, 1.4, '#ffffff') + dot(70, 112, 1.2, '#f9b8c4'));

  const autumnTile = svg(190, 190,
    maple(40, 42, 1.6, -18, '#e9894f') + maple(140, 120, 1.4, 22, '#d8634c') + maple(152, 36, 1, 40, '#f0b84f') + maple(56, 150, 1.1, -40, '#f0b84f') +
    acorn(100, 78, 1.3, 14) + acorn(22, 104, 1, -20) + mushroom(108, 162, 1.3) + mushroom(174, 172, .9) +
    leaf(88, 18, .8, 30, '#d9a35f') + dot(174, 84, 1.6, '#e8b98a') + dot(80, 118, 1.4, '#e8b98a') + heart(18, 176, .45, '#e98f7a'));

  const winterTile = svg(180, 180,
    catFace(46, 52, 1.3, -6, kittyLine) + scarf(46, 63, 1.3, -6) +
    mitten(140, 46, 1.2, 14, '#f4a3b8') + mitten(116, 150, 1, -12, '#a9c3f5') +
    snowflake(128, 104, 1.1, '#ffffff') + snowflake(30, 130, .9, '#ffffff') + snowflake(162, 160, .7, '#ffffff') + snowflake(90, 20, .6, '#ffffff') +
    heart(80, 96, .5, '#f4b3c2') + dot(20, 20, 1.6, '#ffffff') + dot(64, 168, 1.8, '#ffffff') + dot(170, 96, 1.4, '#ffffff') + dot(100, 60, 1.2, '#ffffff'));

  // ---------- the looks ----------
  const gingham = (c, size) =>
    [`linear-gradient(90deg, ${c} 50%, transparent 50%)`, `linear-gradient(${c} 50%, transparent 50%)`, size];

  const [gA, gB] = gingham('rgba(243,160,182,.42)');
  const [sA, sB] = gingham('rgba(247,150,186,.45)');
  const [yA, yB] = gingham('rgba(214,170,232,.30)');

  window.THEMES = [
    { id: 'gingham', name: 'pink gingham', style: { backgroundColor: '#fff6f8', backgroundImage: `${gA}, ${gB}`, backgroundSize: '30px 30px' } },
    { id: 'strawberry', name: 'strawberries & bows', style: { backgroundColor: '#fdecef', backgroundImage: strawberryTile, backgroundSize: '205px 205px' } },
    { id: 'starry', name: 'star stickers', style: { backgroundColor: '#ffe6ee', backgroundImage: `${starTile}, ${sA}, ${sB}`, backgroundSize: '185px 185px, 34px 34px, 34px 34px' } },
    { id: 'kitty', name: 'kitty doodles', style: { backgroundColor: '#f6eee4', backgroundImage: kittyTile, backgroundSize: '245px 245px' } },
    { id: 'y2k', name: 'y2k desktop', style: { backgroundColor: '#fdf0f7', backgroundImage: `${y2kTile}, ${yA}, ${yB}`, backgroundSize: '250px 250px, 26px 26px, 26px 26px' } },
    { id: 'pond', name: 'duck pond', style: { backgroundColor: '#8db79b', backgroundImage: pondTile, backgroundSize: '255px 255px' } },
    { id: 'pixel', name: 'pixel meadow', style: { backgroundColor: '#82c461', backgroundImage: pixelTile, backgroundSize: '144px 144px' } },
    { id: 'meadow', name: 'bunny meadow', style: { backgroundColor: '#f3ece0', backgroundImage: meadowTile, backgroundSize: '290px 290px' } },
    { id: 'daisy', name: 'butter daisies', style: { backgroundColor: '#fcf3d4', backgroundImage: daisyTile, backgroundSize: '215px 215px' } },
    {
      id: 'galaxy', name: 'pink galaxy', style: {
        backgroundColor: '#e98aa3',
        backgroundImage: `${galaxyTile}, radial-gradient(ellipse 60% 40% at 30% 25%, rgba(255,214,224,.6), transparent 70%), radial-gradient(ellipse 50% 35% at 75% 65%, rgba(255,200,215,.55), transparent 70%), radial-gradient(ellipse 70% 30% at 40% 95%, rgba(206,90,126,.35), transparent 70%)`,
        backgroundSize: '190px 190px, 100% 100%, 100% 100%, 100% 100%',
      },
    },
    { id: 'sky', name: 'daisy sky', style: { backgroundColor: '#a9d3df', backgroundImage: `${skyTile}, linear-gradient(180deg, #86c1d6 0%, #b9dde3 60%, #e6f1e4 100%)`, backgroundSize: '290px 277px, 100% 100%' } },
    { id: 'clouds', name: 'vintage clouds', style: { backgroundColor: '#3f74a0', backgroundImage: `${cloudTile}, ${grainOnly}, linear-gradient(180deg, #2f6390 0%, #4f86b3 55%, #7fa8c8 100%)`, backgroundSize: '320px 300px, 160px 160px, 100% 100%' } },
    // seasonal looks (new ideas lean towards the current season's one)
    { id: 'sakura', name: 'cherry blossoms', season: 'spring', style: { backgroundColor: '#fdebf0', backgroundImage: sakuraTile, backgroundSize: '220px 220px' } },
    { id: 'melon', name: 'watermelon summer', season: 'summer', style: { backgroundColor: '#dff1d9', backgroundImage: summerTile, backgroundSize: '215px 215px' } },
    { id: 'autumn', name: 'autumn leaves', season: 'autumn', style: { backgroundColor: '#f8e5cc', backgroundImage: autumnTile, backgroundSize: '230px 230px' } },
    { id: 'snowcat', name: 'snowy kitties', season: 'winter', style: { backgroundColor: '#dde9f4', backgroundImage: winterTile, backgroundSize: '220px 220px' } },
  ];

  // faint doodles behind the whole app
  const bgCommon = sparkle(100, 30, .6, '#efdcca') + dot(70, 80, 1.5, '#f0dcd6') + heartLine(34, 116, .55, '#efd3d6', 14);
  window.APP_BG = svg(140, 140,
    heartLine(30, 34, .8, '#efd3d6', -10) + bgCommon + star(110, 104, 3.5, '#f3e3c9', 12));

  // ---------- seasons ----------
  // Each season swaps the faint background doodles and has a few things that drift down the window.
  const faint = (body) => `<g opacity=".3">${body}</g>`;
  const drift = (body) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='-12 -12 24 24'>${body}</svg>`)}`;
  window.SEASONS = {
    spring: {
      label: 'spring', icon: '✿',
      bg: svg(140, 140, faint(sakura(30, 34, .9, '#f2a7bb') + sakura(108, 104, .7, '#f2a7bb')) + bgCommon),
      fx: [drift(petal(0, 4, 1.2, 0, '#f7b7c7')), drift(petal(0, 4, 1.2, 0, '#fbd0db'))],
    },
    summer: {
      label: 'summer', icon: '☀︎',
      bg: svg(140, 140, faint(sun(30, 34, .8, '#f3c95a') + melon(108, 104, .9, 10)) + bgCommon),
      fx: [drift(sparkle(0, 0, 1.6, '#f2cf72')), drift(heart(0, 0, 1.2, '#f6b3c3'))],
    },
    autumn: {
      label: 'autumn', icon: '❦',
      bg: svg(140, 140, faint(maple(30, 34, .9, -15, '#e9894f') + acorn(108, 104, .9, 12)) + bgCommon),
      fx: [drift(maple(0, -1, 1, 0, '#e9894f')), drift(maple(0, -1, 1, 0, '#d8634c')), drift(maple(0, -1, 1, 0, '#f0b84f'))],
    },
    winter: {
      label: 'winter', icon: '❄︎',
      bg: svg(140, 140, faint(snowflake(30, 34, 1, '#7fa6cc') + mitten(108, 104, .8, 10, '#f4a3b8')) + bgCommon),
      fx: [drift(snowflake(0, 0, 1.3, '#a9c6df')), drift(dot(0, 0, 3, '#c6dbec'))],
    },
  };

  // faint paper texture for the pages of the book
  window.PAPER_GRAIN = svg(160, 160,
    `<filter id="p"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .4  0 0 0 0 .35  0 0 0 .08 0"/></filter><rect width="100%" height="100%" filter="url(#p)"/>`);
})();
