'use strict';
// ✿ our little book ✿
// A flip-through scrapbook of your dates. Every sheet of paper is a "leaf" with
// two faces: its front shows on the right-hand side, and once it's turned, its
// back shows on the left — exactly like a real book. Turning a page is just
// rotating that leaf 180° around the spine (see .leaf in styles.css).

// ---------- what goes in the book ----------
// Gets every idea; returns the ones that get a spread (photo page + words page)
// in the order they should appear in the book.
function buildBook(ideas) {
  // TODO: this decides the story the book tells (ideas: favourites first, group by season).
  // For now: every date you've done, oldest first.
  return ideas
    .filter((i) => i.done)
    .sort((a, b) => (a.doneDate || '').localeCompare(b.doneDate || '') || a.createdAt - b.createdAt);
}

const book = { leaves: [], cur: 0, z: 0, swipedAt: 0 };
const FLIP_MS = 900;
const longDate = (iso) => new Date(`${iso}T00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const monthYear = (iso) => new Date(`${iso}T00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
const tilt = (seed, max) => (seed % (max * 2 + 1)) - max;

function stickerImg(id, cls, style) {
  const s = stickerById(id);
  if (!s) return null;
  const img = h('img', { class: cls, src: s.url, alt: '', draggable: 'false' });
  for (const [k, v] of Object.entries(style || {})) img.style.setProperty(k, v); // works for --custom props too
  return img;
}

// ---------- pages ----------
const pg = (cls, ...kids) => h('div', { class: `pg ${cls}` }, ...kids);
const pageNum = (n) => h('span', { class: 'bk-num' }, String(n));

function coverFront() {
  return h('div', { class: 'cover' },
    h('div', { class: 'cover-stitch' }),
    h('p', { class: 'cover-kicker' }, 'vol. 1'),
    h('h2', { class: 'cover-title' }, 'our little', h('br'), 'book'),
    stickerImg('smooch', 'cover-sticker'),
    h('p', { class: 'cover-names' }, `${data.names.a} ♡ ${data.names.b}`),
    h('p', { class: 'cover-hint' }, 'tap to open'));
}

function coverBack() {
  return h('div', { class: 'cover' },
    h('div', { class: 'cover-stitch' }),
    stickerImg('paw', 'cover-sticker small'),
    h('p', { class: 'cover-kicker' }, 'to be continued ♡'));
}

function endpaper(withPlate) {
  const el = h('div', { class: 'endpaper' },
    withPlate ? h('div', { class: 'bookplate' },
      h('small', {}, 'this book belongs to'),
      h('strong', {}, `${data.names.a} & ${data.names.b}`),
      stickerImg('peek', 'bookplate-sticker')) : null);
  paint(el, themeById('kitty'));
  return el;
}

function titlePage(entries) {
  const first = entries.find((e) => e.doneDate);
  return pg('bk-center',
    stickerImg('heart', 'bk-hero'),
    h('h2', { class: 'bk-big' }, 'our little book'),
    h('p', { class: 'bk-sub' }, entries.length
      ? `${entries.length} date${entries.length === 1 ? '' : 's'} so far${first ? ` · since ${monthYear(first.doneDate)}` : ''}`
      : 'the first page is waiting for you ♡'),
    h('p', { class: 'bk-small' }, 'turn the page →'));
}

function photoPage(idea, n) {
  const seed = hash(idea.id);
  const shown = idea.photos.slice(0, 3);
  const body = shown.length
    ? shown.map((p, i) => {
      const fig = h('figure', { class: `bk-photo n${shown.length} p${i}` },
        h('span', { class: 'tape' }),
        h('img', { src: photoUrl(p), alt: '', draggable: 'false' }),
        i === 0 ? h('figcaption', {}, idea.title) : null);
      fig.style.setProperty('--tilt', `${tilt(seed + i * 7, 5)}deg`);
      return fig;
    })
    : [(() => {
      const card = h('div', { class: 'bk-postcard' }, h('span', {}, idea.title));
      paint(card, themeById(idea.theme));
      card.style.setProperty('--tilt', `${tilt(seed, 4)}deg`);
      return card;
    })(), h('p', { class: 'bk-nophoto' }, 'no photos yet — add some in the editor ♡')];
  const more = idea.photos.length > 3 ? h('p', { class: 'bk-more' }, `+ ${idea.photos.length - 3} more in the editor`) : null;
  const stickers = idea.stickers.map((id, i) => stickerImg(id, `bk-sticker s${i}`, { '--r': `${tilt(hash(idea.id + id), 14)}deg` }));
  return pg('bk-photos', ...body, more, ...stickers, pageNum(n));
}

function wordsPage(idea, n) {
  const washi = h('span', { class: 'washi' });
  paint(washi, themeById(idea.theme));
  const words = idea.done ? (idea.memory || idea.note) : idea.note;
  return pg('bk-words',
    washi,
    h('p', { class: 'bk-date' }, idea.done && idea.doneDate ? longDate(idea.doneDate) : 'someday…'),
    h('h3', { class: 'bk-title' }, idea.title),
    h('div', { class: 'bk-meta' },
      h('span', { class: 'who' }, whoText(idea.who)),
      h('span', { class: 'cost' }, COSTS[idea.cost] ?? COSTS[0]),
      idea.tags.map((t) => h('span', {}, `#${t}`))),
    h('div', { class: 'bk-lines' }, words || 'no words needed ♡'),
    idea.done && idea.memory && idea.note ? h('p', { class: 'bk-plan' }, `the plan was: ${idea.note}`) : null,
    pageNum(n));
}

function endPage(entries) {
  return pg('bk-center',
    stickerImg('moon', 'bk-hero'),
    h('h2', { class: 'bk-big' }, 'to be continued…'),
    h('p', { class: 'bk-sub' }, entries.length ? 'so many more pages to fill ♡' : 'go on a date and it will show up here ♡'));
}

function wishPage() {
  const wish = data.ideas.filter((i) => !i.done).sort((a, b) => b.createdAt - a.createdAt);
  return pg('bk-wish',
    h('h3', { class: 'bk-title' }, 'still on our list ♡'),
    wish.length
      ? h('ul', { class: 'bk-list' }, ...wish.slice(0, 9).map((i) => h('li', {}, i.title)),
        wish.length > 9 ? h('li', { class: 'muted' }, `…and ${wish.length - 9} more`) : null)
      : h('p', { class: 'bk-sub' }, 'the list is empty… dream up some new dates ♡'),
    stickerImg('letter', 'bk-sticker s2', { '--r': '8deg' }));
}

// ---------- building + turning ----------
// Faces in reading order. Even index = a right-hand page (front of a leaf),
// odd index = a left-hand page (back of a leaf). Leaf k = faces 2k and 2k+1.
function buildFaces() {
  const entries = buildBook(data.ideas);
  const faces = [coverFront(), endpaper(true), titlePage(entries)];
  entries.forEach((idea, i) => faces.push(photoPage(idea, 2 + i * 2), wordsPage(idea, 3 + i * 2)));
  faces.push(endPage(entries), wishPage(), endpaper(false), endpaper(false), coverBack());
  if (faces.length % 2) faces.splice(faces.length - 1, 0, endpaper(false)); // keep the back cover on a back face
  return faces;
}

function setZ(leaf, i, flipped) {
  leaf.style.zIndex = String(flipped ? i + 1 : book.leaves.length - i);
}

function turn(dir) {
  const L = book.leaves.length;
  let i;
  if (dir > 0 && book.cur < L) { i = book.cur; book.cur += 1; } else if (dir < 0 && book.cur > 0) { book.cur -= 1; i = book.cur; } else return;
  const leaf = book.leaves[i];
  const flipped = dir > 0;
  leaf.style.zIndex = String(1000 + ++book.z); // the moving page sits on top while it turns
  leaf.classList.toggle('flipped', flipped);
  clearTimeout(leaf.settle);
  leaf.settle = setTimeout(() => setZ(leaf, i, flipped), FLIP_MS);
  layout();
}

function layout() {
  const L = book.leaves.length;
  const el = $('#book');
  el.dataset.state = book.cur === 0 ? 'closed' : book.cur === L ? 'back' : 'open';
  book.leaves.forEach((leaf, i) => leaf.classList.toggle('top', i === book.cur || i === book.cur - 1));
  $('#bookPrev').disabled = book.cur === 0;
  $('#bookNext').disabled = book.cur === L;
  $('#bookCount').textContent = book.cur === 0 ? 'cover' : book.cur === L ? 'the end ♡' : `${book.cur} / ${L - 1}`;
}

function openBook() {
  const faces = buildFaces();
  book.leaves = [];
  for (let k = 0; k < faces.length; k += 2) {
    const leaf = h('div', { class: 'leaf' },
      h('div', { class: 'face face-front' }, faces[k]),
      h('div', { class: 'face face-back' }, faces[k + 1]));
    leaf.addEventListener('click', () => {
      if (Date.now() - book.swipedAt < 400) return; // that tap was the end of a swipe, already turned
      turn(leaf.classList.contains('flipped') ? -1 : 1);
    });
    book.leaves.push(leaf);
  }
  book.cur = 0;
  book.leaves.forEach((leaf, i) => setZ(leaf, i, false));
  const el = $('#book');
  el.style.setProperty('--paper-grain', PAPER_GRAIN);
  el.replaceChildren(...book.leaves);
  layout();
  openOverlay('#bookOverlay');
}

$('#bookBtn').addEventListener('click', openBook);
$('#bookPrev').addEventListener('click', () => turn(-1));
$('#bookNext').addEventListener('click', () => turn(1));
// Swipe like a real book: drag right-to-left for the next page, left-to-right to go back.
// Works with a finger, a pen or a mouse; mostly-vertical drags are left alone (they scroll long memories).
// Listens on the whole overlay: on a phone the closed book is narrow, you shouldn't have to aim.
let swipe = null;
const bookOverlay = $('#bookOverlay');
bookOverlay.addEventListener('pointerdown', (e) => { if (e.isPrimary) swipe = { x: e.clientX, y: e.clientY, t: e.timeStamp }; });
bookOverlay.addEventListener('pointerup', (e) => {
  if (!swipe || !e.isPrimary) return;
  const dx = e.clientX - swipe.x;
  const dy = e.clientY - swipe.y;
  const quick = e.timeStamp - swipe.t < 700;
  swipe = null;
  if (!quick || Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
  book.swipedAt = Date.now();
  turn(dx < 0 ? 1 : -1);
});
bookOverlay.addEventListener('pointercancel', () => { swipe = null; });

document.addEventListener('keydown', (e) => {
  if ($('#bookOverlay').hidden) return;
  if (e.key === 'ArrowRight') turn(1);
  if (e.key === 'ArrowLeft') turn(-1);
});
