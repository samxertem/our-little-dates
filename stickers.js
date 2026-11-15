// ✿ cat sticker pack ✿
// Every sticker is a little SVG drawn from code (just like the card looks in
// themes.js) and turned into a data: URL. The white die-cut edge and the soft
// shadow are added in CSS (see --diecut in styles.css), so the art stays simple.
// To add a sticker, add one entry to the list at the bottom.
(() => {
  'use strict';

  const url = (body) =>
    `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>${body}</svg>`)}`;
  const at = (x, y, s, r, body) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${body}</g>`;

  const LINE = '#6e5550';
  const HEART = 'M0 6C-8 0-8-6-4-6C-2-6 0-4 0-3C0-4 2-6 4-6C8-6 8 0 0 6Z';
  const FUR = {
    cream: { fur: '#fffaf3', line: LINE, ear: '#f7c3cb', patch: '#f6c28b' },
    orange: { fur: '#f9c995', line: '#7a5446', ear: '#f5a9a6', stripe: '#eba366' },
    grey: { fur: '#dcdfe6', line: '#5f5866', ear: '#f2b8c4', stripe: '#b9bdcb' },
    black: { fur: '#4d4249', line: '#2d2529', ear: '#e9a0b2', eye: '#ffd76e' },
  };

  // ---------- cat parts (head is ~40 wide, centred on its eyes) ----------
  const HEAD = 'M-19 4C-20-6-18-14-15-21L-7-13C-2.5-14.5 2.5-14.5 7-13L15-21C18-14 20-6 19 4C18 13-18 13-19 4Z';
  const head = (c, { eyes = 'open', patch = false } = {}) => {
    let s = `<path d="${HEAD}" fill="${c.fur}"/>`;
    if (patch && c.patch) s += `<path d="M7-13L15-21C17.5-15 19-9 19-4C13-4 9-8 7-13Z" fill="${c.patch}"/>`;
    if (c.stripe) s += `<path d="M-3-13v3.5M0-13.6v4.2M3-13v3.5" stroke="${c.stripe}" stroke-width="1.8" stroke-linecap="round"/>`;
    s += `<path d="M-14-17.5L-9.5-13.2L-14.3-10.6ZM14-17.5L9.5-13.2L14.3-10.6Z" fill="${c.ear}" stroke="${c.ear}" stroke-width="1" stroke-linejoin="round"/>`;
    s += `<path d="${HEAD}" fill="none" stroke="${c.line}" stroke-width="2.2" stroke-linejoin="round"/>`;
    if (eyes === 'happy') {
      s += `<path d="M-9.6 1q2.6-3.4 5.2 0M4.4 1q2.6-3.4 5.2 0" stroke="${c.line}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
    } else if (eyes === 'sleep') {
      s += `<path d="M-9.6-.4q2.6 2.6 5.2 0M4.4-.4q2.6 2.6 5.2 0" stroke="${c.line}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
    } else if (c.eye) {
      s += `<circle cx="-7" cy="0" r="2.9" fill="${c.eye}"/><circle cx="7" cy="0" r="2.9" fill="${c.eye}"/>` +
        `<ellipse cx="-7" cy="0" rx="1.1" ry="2.3" fill="${c.line}"/><ellipse cx="7" cy="0" rx="1.1" ry="2.3" fill="${c.line}"/>`;
    } else {
      s += `<ellipse cx="-7" cy="0" rx="2.1" ry="2.5" fill="${c.line}"/><ellipse cx="7" cy="0" rx="2.1" ry="2.5" fill="${c.line}"/>` +
        `<circle cx="-6.2" cy="-.9" r=".8" fill="#fff"/><circle cx="7.8" cy="-.9" r=".8" fill="#fff"/>`;
    }
    s += `<path d="M-1.3 2.6h2.6l-1.3 1.4z" fill="#f08ca0" stroke="#f08ca0" stroke-width=".8" stroke-linejoin="round"/>`;
    s += `<path d="M-3.2 4.6q1.6 1.8 3.2 0q1.6 1.8 3.2 0" stroke="${c.line}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    s += `<ellipse cx="-12" cy="4.6" rx="2.8" ry="1.6" fill="#f7a8b8" opacity=".85"/><ellipse cx="12" cy="4.6" rx="2.8" ry="1.6" fill="#f7a8b8" opacity=".85"/>`;
    return s;
  };
  const paw = (x, y, c, r = 0) => at(x, y, 1, r,
    `<ellipse rx="6.2" ry="4.6" fill="${c.fur}" stroke="${c.line}" stroke-width="2"/>` +
    `<path d="M-1.8 4.4v-2.2M1.8 4.4v-2.2" stroke="${c.line}" stroke-width="1.2" stroke-linecap="round"/>`);
  // a thick outlined stroke: line colour underneath, fur on top
  const tail = (d, c) =>
    `<path d="${d}" fill="none" stroke="${c.line}" stroke-width="10" stroke-linecap="round"/>` +
    `<path d="${d}" fill="none" stroke="${c.fur}" stroke-width="5.6" stroke-linecap="round"/>`;
  const heart = (x, y, s, fill, stroke) =>
    at(x, y, s, 0, `<path d="${HEART}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${(1.6 / s).toFixed(2)}" stroke-linejoin="round"` : ''}/>`);
  const shine = (x, y, rx, ry, r = -30) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".7" transform="rotate(${r} ${x} ${y})"/>`;
  const zz = (x, y, s) => at(x, y, s, 0, `<path d="M0 0h7l-7 8h7" fill="none" stroke="${LINE}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`);
  const twinkle = (x, y, s, fill) => at(x, y, s, 0, `<path d="M0-6Q1-1 6 0Q1 1 0 6Q-1 1-6 0Q-1-1 0-6Z" fill="${fill}"/>`);

  // ---------- the stickers ----------
  const art = {
    loaf: () => {
      const c = FUR.orange;
      return tail('M80 82C92 82 94 68 86 62', c) +
        `<path d="M14 86C10 62 26 46 50 46C74 46 90 62 86 86Z" fill="${c.fur}" stroke="${c.line}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<path d="M19 66h6M17 73h7M81 66h-6M83 73h-7" stroke="${c.stripe}" stroke-width="2.2" stroke-linecap="round"/>` +
        at(50, 50, 1.12, 0, head(c)) + paw(39, 85, c) + paw(61, 85, c);
    },

    sleepy: () => {
      const c = FUR.grey;
      return `<ellipse cx="56" cy="64" rx="34" ry="22" fill="${c.fur}" stroke="${c.line}" stroke-width="2.4"/>` +
        `<path d="M62 45q2.5 5 0 10M72 46q2.5 5 0 10M82 51q2 4-.5 8" stroke="${c.stripe}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
        at(31, 58, .95, -14, head(c, { eyes: 'sleep' })) +
        tail('M88 70C86 88 56 92 36 84', c) +
        zz(68, 18, 1) + zz(81, 8, .7);
    },

    box: () => {
      const c = FUR.cream;
      const kraft = '#a9774c';
      return `<path d="M20 52L80 52L74 45L26 45Z" fill="#b98455"/>` +
        at(50, 40, 1.05, 0, head(c, { patch: true })) +
        `<path d="M18 52H82L78 92H22Z" fill="#eab884" stroke="${kraft}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<path d="M18 52L6 42L28 38L33 52Z" fill="#f3c995" stroke="${kraft}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="M82 52L94 42L72 38L67 52Z" fill="#f3c995" stroke="${kraft}" stroke-width="2.2" stroke-linejoin="round"/>` +
        paw(37, 53, c) + paw(63, 53, c) + heart(50, 73, 1.25, '#f58fa8');
    },

    heart: () => {
      const c = FUR.black;
      return `<ellipse cx="50" cy="70" rx="24" ry="20" fill="${c.fur}" stroke="${c.line}" stroke-width="2.4"/>` +
        at(50, 38, 1.05, 0, head(c)) +
        heart(50, 71, 3.2, '#f58fa8', '#d9667f') + shine(37, 61, 4.5, 2.6) +
        paw(33, 59, c, -25) + paw(67, 59, c, 25);
    },

    strawberry: () => {
      const seeds = [[-6.5, -3], [6.5, -3], [-8, 4], [8, 4], [-4, 9], [4, 9], [0, 11.5]]
        .map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx=".6" ry=".95" fill="#ffe3a3"/>`).join('');
      return at(50, 52, 3, 0,
        `<path d="M-7.5-6L-6.6-12L-2.6-8.2ZM7.5-6L6.6-12L2.6-8.2Z" fill="#f26b80" stroke="#c94a62" stroke-width=".7" stroke-linejoin="round"/>` +
        `<path d="M0-8C8-9 12-3 9 4C7 9 3 13 0 13C-3 13-7 9-9 4C-12-3-8-9 0-8Z" fill="#f26b80" stroke="#c94a62" stroke-width=".75"/>` +
        `<path d="M-6.5-3.5C-7.6-.5-7 2.5-6 4.5" stroke="#ff9fb0" stroke-width=".9" fill="none" stroke-linecap="round"/>` + seeds +
        `<path d="M0-8L-5.6-10.4L-2.8-8.2L-3.4-12.2L0-9.6L3.4-12.2L2.8-8.2L5.6-10.4Z" fill="#7cbf7f" stroke="#5c9e60" stroke-width=".55" stroke-linejoin="round"/>` +
        `<ellipse cx="-3.2" cy="1.4" rx=".85" ry="1.05" fill="#5a3a3e"/><ellipse cx="3.2" cy="1.4" rx=".85" ry="1.05" fill="#5a3a3e"/>` +
        `<path d="M-1.2 3.2q.6.7 1.2 0q.6.7 1.2 0" stroke="#5a3a3e" stroke-width=".45" fill="none" stroke-linecap="round"/>` +
        `<ellipse cx="-5.4" cy="3" rx="1.3" ry=".7" fill="#ffb7c4"/><ellipse cx="5.4" cy="3" rx="1.3" ry=".7" fill="#ffb7c4"/>`);
    },

    boba: () =>
      `<path d="M58 36L68 6" stroke="${LINE}" stroke-width="10" stroke-linecap="round"/><path d="M58 36L68 6" stroke="#f58fa8" stroke-width="5.6" stroke-linecap="round"/>` +
      `<path d="M30 34L33 15L45 25ZM70 34L67 15L55 25Z" fill="#fff6ee" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M33 27L34.5 19.5L40 24ZM67 27L65.5 19.5L60 24Z" fill="#f7c3cb"/>` +
      `<path d="M24 40Q24 22 50 22Q76 22 76 40Z" fill="#fff6ee" stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<path d="M28 42L72 42L66 90Q50 95 34 90Z" fill="#f2dcc2" stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<rect x="22" y="37" width="56" height="7" rx="3.5" fill="#f7c3cb" stroke="${LINE}" stroke-width="2.2"/>` +
      [[38, 84], [46, 87], [54, 87], [62, 83], [43, 79], [56, 79]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.3" fill="#6e4a40"/><circle cx="${x - 1}" cy="${y - 1.1}" r=".9" fill="#fff" opacity=".5"/>`).join('') +
      `<ellipse cx="42" cy="58" rx="2.2" ry="2.6" fill="${LINE}"/><ellipse cx="58" cy="58" rx="2.2" ry="2.6" fill="${LINE}"/>` +
      `<circle cx="42.8" cy="57" r=".8" fill="#fff"/><circle cx="58.8" cy="57" r=".8" fill="#fff"/>` +
      `<path d="M46.8 63q1.6 1.8 3.2 0q1.6 1.8 3.2 0" stroke="${LINE}" stroke-width="1.5" fill="none" stroke-linecap="round"/>` +
      `<ellipse cx="35.5" cy="63" rx="3" ry="1.7" fill="#f7a8b8"/><ellipse cx="64.5" cy="63" rx="3" ry="1.7" fill="#f7a8b8"/>`,

    balloon: () => {
      const c = FUR.grey;
      return `<path d="M56 54C62 46 64 42 70 36" fill="none" stroke="${LINE}" stroke-width="1.6" stroke-linecap="round"/>` +
        heart(70, 22, 2.4, '#f7a9c0', '#e07f99') + shine(62, 14, 3.4, 2) +
        tail('M54 88C68 92 68 76 58 74', c) +
        `<ellipse cx="40" cy="83" rx="18" ry="12" fill="${c.fur}" stroke="${c.line}" stroke-width="2.4"/>` +
        at(37, 62, .84, 0, head(c, { eyes: 'happy' })) +
        paw(56, 58, c, -35) + paw(32, 92, c);
    },

    paw: () =>
      `<ellipse cx="50" cy="54" rx="38" ry="36" fill="#fffaf3" stroke="${LINE}" stroke-width="2.4"/>` +
      `<path d="M50 54C62 54 69 64 67 72C65 79 57 79 50 77C43 79 35 79 33 72C31 64 38 54 50 54Z" fill="#f7a8b8"/>` +
      `<ellipse cx="29" cy="44" rx="6.5" ry="8" fill="#f7a8b8" transform="rotate(-25 29 44)"/>` +
      `<ellipse cx="42.5" cy="32" rx="7" ry="8.5" fill="#f7a8b8" transform="rotate(-8 42.5 32)"/>` +
      `<ellipse cx="57.5" cy="32" rx="7" ry="8.5" fill="#f7a8b8" transform="rotate(8 57.5 32)"/>` +
      `<ellipse cx="71" cy="44" rx="6.5" ry="8" fill="#f7a8b8" transform="rotate(25 71 44)"/>` +
      shine(44, 61, 4, 2.2, -20) + heart(50, 68, .55, '#fff'),

    letter: () => {
      const c = FUR.cream;
      return at(50, 42, 1, 0, head(c, { patch: true })) +
        `<rect x="14" y="48" width="72" height="44" rx="5" fill="#fdf3e4" stroke="${LINE}" stroke-width="2.4"/>` +
        `<path d="M16 51L50 74L84 51" fill="none" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>` +
        heart(50, 75, 1.15, '#f26b80') + paw(34, 49, c) + paw(66, 49, c);
    },

    smooch: () =>
      heart(50, 22, 1.8, '#f58fa8') + heart(30, 20, .8, '#f9b8c8') + heart(70, 18, .7, '#f9b8c8') +
      at(30, 63, .92, 12, head(FUR.cream, { eyes: 'happy', patch: true })) +
      at(70, 63, .92, -12, head(FUR.orange, { eyes: 'happy' })),

    mug: () => {
      const c = FUR.cream;
      const mug = '#cfe6c9';
      return `<path d="M72 58C86 58 86 80 72 80" fill="none" stroke="${LINE}" stroke-width="10"/><path d="M72 58C86 58 86 80 72 80" fill="none" stroke="${mug}" stroke-width="5.4"/>` +
        at(46, 46, 1, 0, head(c, { eyes: 'happy' })) +
        `<path d="M20 51H72V82Q72 92 62 92H30Q20 92 20 82Z" fill="${mug}" stroke="${LINE}" stroke-width="2.4" stroke-linejoin="round"/>` +
        paw(33, 52, c) + paw(59, 52, c) + heart(46, 73, 1.2, '#f6a5b8') +
        at(80, 26, .9, 10, `<path d="${HEART}" fill="none" stroke="#f2a7b8" stroke-width="2" stroke-linejoin="round"/>`) +
        at(87, 12, .6, -8, `<path d="${HEART}" fill="none" stroke="#f2a7b8" stroke-width="2.4" stroke-linejoin="round"/>`);
    },

    moon: () => {
      const c = FUR.grey;
      return at(44, 54, 4.8, 0, `<path d="M0-8A8 8 0 1 0 8 0A6 6 0 0 1 0-8Z" fill="#f9dc8a" stroke="#e2b356" stroke-width=".45"/>`) +
        `<circle cx="28" cy="70" r="3" fill="#f3c86c" opacity=".6"/><circle cx="40" cy="80" r="2" fill="#f3c86c" opacity=".6"/><circle cx="20" cy="54" r="1.8" fill="#f3c86c" opacity=".6"/>` +
        tail('M80 52C88 58 82 66 74 62', c) +
        `<ellipse cx="68" cy="46" rx="14" ry="9" fill="${c.fur}" stroke="${c.line}" stroke-width="2.2"/>` +
        at(57, 40, .58, -10, head(c, { eyes: 'sleep' })) +
        twinkle(86, 16, .9, '#f6c94f') + twinkle(18, 20, .7, '#f6c94f') + twinkle(90, 84, .6, '#f6c94f') + zz(74, 14, .6);
    },

    camera: () => {
      const c = FUR.orange;
      return at(50, 38, 1, 0, head(c)) +
        `<rect x="36" y="50" width="16" height="10" rx="3" fill="#f6a7ba" stroke="${LINE}" stroke-width="2.2"/>` +
        `<rect x="24" y="56" width="52" height="34" rx="7" fill="#f6a7ba" stroke="${LINE}" stroke-width="2.4"/>` +
        `<circle cx="50" cy="73" r="11" fill="#fff" stroke="${LINE}" stroke-width="2.2"/><circle cx="50" cy="73" r="6" fill="#7a6f86"/><circle cx="47.6" cy="70.6" r="1.8" fill="#fff"/>` +
        `<rect x="63" y="61" width="8" height="5" rx="1.5" fill="#fff3b0" stroke="${LINE}" stroke-width="1.4"/>` +
        paw(25, 70, c, 80) + paw(75, 70, c, -80);
    },

    peek: () => {
      const c = FUR.cream;
      return at(50, 58, 1.5, 0, head(c, { patch: true })) +
        `<rect x="6" y="72" width="88" height="15" rx="7.5" fill="#f7c3cb" stroke="${LINE}" stroke-width="2.4"/>` +
        heart(50, 79.5, .55, '#fff') +
        at(28, 73, 1.35, 0, paw(0, 0, c)) + at(72, 73, 1.35, 0, paw(0, 0, c));
    },
  };

  const NAMES = {
    loaf: 'bread loaf', sleepy: 'nap time', box: 'box cat', heart: 'big love', strawberry: 'strawbaby',
    boba: 'boba cat', balloon: 'balloon', paw: 'beans', letter: 'love letter', smooch: 'smooch',
    mug: 'cozy mug', moon: 'moon nap', camera: 'say cheese', peek: 'peekaboo',
  };

  window.STICKERS = Object.entries(art).map(([id, draw]) => ({ id, name: NAMES[id] || id, url: url(draw()) }));

  // a plain white paw for confetti bursts
  window.PAW_WHITE = url(
    `<g fill="#fff"><path d="M50 52C64 52 72 64 70 73C68 81 58 81 50 79C42 81 32 81 30 73C28 64 36 52 50 52Z"/>` +
    `<ellipse cx="25" cy="42" rx="8" ry="10" transform="rotate(-25 25 42)"/><ellipse cx="41" cy="27" rx="8.5" ry="10.5" transform="rotate(-8 41 27)"/>` +
    `<ellipse cx="59" cy="27" rx="8.5" ry="10.5" transform="rotate(8 59 27)"/><ellipse cx="75" cy="42" rx="8" ry="10" transform="rotate(25 75 42)"/></g>`);
})();
