'use strict';

const COSTS = ['free', 'cheap', 'comfy', 'splurge'];
const MAX_STICKERS = 3;
const MAX_PHOTOS = 6;
const PHOTO_NAME = /^[a-z0-9-]+\.jpg$/;
const SEASON_CYCLE = ['auto', 'spring', 'summer', 'autumn', 'winter', 'off'];
const $ = (sel) => document.querySelector(sel);
const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
const stickerById = (id) => STICKERS.find((s) => s.id === id);
const photoUrl = (name) => window.store.photoUrl(name); // desktop, phone and browser each serve photos their own way
const paint = (el, theme) => Object.assign(el.style, theme.style);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const any = (arr) => arr[Math.floor(Math.random() * arr.length)];
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const fmtDate = (iso) => new Date(`${iso}T00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const hash = (s) => { let n = 0; for (const c of s) n = (n * 31 + c.charCodeAt(0)) | 0; return Math.abs(n); };

// Builds elements with textContent (never innerHTML), so anything you type is shown as plain text.
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
  return el;
}

// ---------- data ----------
let data;
const ui = { tab: 'wish', query: '', tag: null, lastPickedId: null };

function blankIdea(extra = {}) {
  return {
    id: uid(), title: '', note: '', who: window.store?.sharing?.me || 'a', tags: [], cost: 0, theme: 'gingham',
    stickers: [], photos: [], done: false, doneDate: '', memory: '', createdAt: Date.now(), ...extra,
  };
}

// A few examples so the board isn't empty on first open; delete them whenever.
// (`example` = untouched; a phone joining your shared board leaves these behind.)
function seed() {
  const t = Date.now();
  const ex = { example: true };
  return {
    version: 1,
    names: { a: 'me', b: 'her' },
    ideas: [
      blankIdea({ ...ex, title: 'clay date', note: 'pottery class or air-dry clay at home, make each other something tiny', who: 'b', tags: ['cozy', 'artsy'], cost: 2, theme: 'strawberry', stickers: ['heart'], createdAt: t }),
      blankIdea({ ...ex, title: 'guinness date', note: 'find the best pint in town and rate the foam', who: 'a', tags: ['night out'], cost: 1, theme: 'pond', stickers: ['mug'], createdAt: t - 1 }),
      blankIdea({ ...ex, title: 'sunset picnic', note: 'blanket, strawberries, a little speaker', who: 'both', tags: ['outside', 'cozy'], cost: 0, theme: 'sky', stickers: ['strawberry', 'balloon'], createdAt: t - 2 }),
    ],
  };
}

// Fills in anything missing, so older saved files keep working after updates.
function normalize(raw) {
  const base = raw && Array.isArray(raw.ideas) ? raw : seed();
  return {
    version: 1,
    names: { a: base.names?.a || 'me', b: base.names?.b || 'her' },
    settings: { season: SEASON_CYCLE.includes(base.settings?.season) ? base.settings.season : 'auto' },
    mochi: { pets: Number(base.mochi?.pets) || 0 },
    ideas: base.ideas.map((i) => ({
      ...blankIdea(), ...i,
      tags: Array.isArray(i.tags) ? i.tags : [],
      stickers: Array.isArray(i.stickers) ? i.stickers.filter(stickerById).slice(0, MAX_STICKERS) : [],
      photos: Array.isArray(i.photos) ? i.photos.filter((p) => PHOTO_NAME.test(p)) : [],
      theme: themeById(i.theme).id,
    })),
  };
}

async function save() {
  try { await window.store.save(data); }
  catch (err) { toast(`couldn't save :( ${err.message}`); }
}
let saveTimer;
function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 700); }

// ---------- ✿ pick one for us ✿ ----------
// Decides which date the shuffle lands on. Gets every idea plus the id of the
// one it landed on last time; return the idea to land on (or null if none fit).
function pickDate(ideas, lastPickedId) {
  // TODO: make this smarter. Right now it's a plain fair coin-flip among
  // the wishlist (ideas: skip the last pick, weight by season or cost).
  const pool = ideas.filter((i) => !i.done);
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

// ---------- seasons ----------
function seasonNow(d = new Date()) {
  const m = d.getMonth(); // 0 = january
  if (m === 11 || m <= 1) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'autumn';
}
const activeSeason = () => (data.settings.season === 'auto' ? seasonNow() : data.settings.season);

function applySeason() {
  const s = activeSeason();
  const cfg = SEASONS[s];
  document.body.style.backgroundImage = cfg ? cfg.bg : APP_BG;
  $('#seasonBtn').replaceChildren(cfg ? `${cfg.icon} ${cfg.label}` : '○ no season',
    ...(data.settings.season === 'auto' ? [h('small', {}, 'auto')] : []));

  // things drifting down the window: petals, sparkles, leaves or snow
  $('#seasonFx').replaceChildren(...(cfg ? Array.from({ length: 16 }, (_, i) => {
    const img = h('img', { class: 'fx-sway', src: cfg.fx[i % cfg.fx.length], alt: '' });
    img.style.width = `${12 + Math.random() * 12}px`;
    img.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
    const fall = h('span', { class: 'fx-fall' }, img);
    const dur = 16 + Math.random() * 14;
    fall.style.left = `${Math.random() * 100}%`;
    fall.style.animationDuration = `${dur}s`;
    fall.style.animationDelay = `${-Math.random() * dur}s`; // start mid-fall, not all at the top
    return fall;
  }) : []));
  Mochi.setSeason(s);
}

$('#seasonBtn').addEventListener('click', () => {
  const i = SEASON_CYCLE.indexOf(data.settings.season);
  data.settings.season = SEASON_CYCLE[(i + 1) % SEASON_CYCLE.length];
  save();
  applySeason();
  const s = data.settings.season;
  toast(s === 'auto' ? `following the calendar: ${seasonNow()} ${SEASONS[seasonNow()].icon}`
    : s === 'off' ? 'seasons off ○' : `it's ${s} now ${SEASONS[s].icon}`);
});

// ---------- board ----------
function whoText(who) {
  if (who === 'both') return 'from us ♡';
  return `from ${data.names[who] || who}`;
}

function visibleIdeas() {
  const q = ui.query.trim().toLowerCase();
  return data.ideas
    .filter((i) => (ui.tab === 'done') === Boolean(i.done))
    .filter((i) => !ui.tag || i.tags.includes(ui.tag))
    .filter((i) => !q || [i.title, i.note, i.memory, ...i.tags].join(' ').toLowerCase().includes(q))
    .sort((x, y) => (ui.tab === 'done'
      ? (y.doneDate || '').localeCompare(x.doneDate || '')
      : y.createdAt - x.createdAt));
}

// the first photo of a date, as a little taped-on polaroid
function polaroid(idea) {
  if (!idea.photos.length) return null;
  const el = h('div', { class: 'polaroid' },
    h('span', { class: 'tape' }),
    h('img', { src: photoUrl(idea.photos[0]), alt: '', draggable: 'false' }),
    idea.photos.length > 1 ? h('span', { class: 'more' }, `+${idea.photos.length - 1}`) : null);
  el.style.setProperty('--tilt', `${(hash(idea.id) % 9) - 4}deg`);
  return el;
}

// Stickers sit on the top edge of a card's label, like they were slapped on.
// Spots + tilt come from the idea's id, so a card always looks the same.
const STICKER_SPOTS = [{ side: 'right', x: 3, lift: 0 }, { side: 'left', x: 5, lift: 16 }, { side: 'right', x: 33, lift: 28 }];
function stickerEls(idea) {
  const base = hash(idea.id);
  return idea.stickers.map((id, n) => {
    const s = stickerById(id);
    if (!s) return null;
    const spot = STICKER_SPOTS[(n + base) % STICKER_SPOTS.length];
    const seed = hash(idea.id + id);
    const img = h('img', { class: 'card-sticker', src: s.url, alt: '', title: s.name, draggable: 'false' });
    img.style[spot.side] = `${spot.x + (seed % 5)}%`;
    img.style.bottom = `calc(100% - 12px + ${spot.lift + (seed % 9)}px)`;
    img.style.setProperty('--r', `${(seed % 31) - 15}deg`);
    return img;
  });
}

function renderCard(idea, index) {
  const blurb = idea.done && idea.memory ? idea.memory : idea.note;
  const card = h('div', {
    class: 'card', role: 'button', tabindex: '0', 'aria-label': idea.title,
    onclick: () => openEditor(idea.id),
    onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEditor(idea.id); } },
  },
  h('span', { class: 'sticker' }, whoText(idea.who)),
  idea.done ? h('span', { class: 'stamp' }, 'done ♡') : null,
  polaroid(idea),
  h('div', { class: 'label' },
    stickerEls(idea),
    h('h3', {}, idea.title),
    blurb ? h('p', {}, blurb) : null,
    h('div', { class: 'meta' },
      h('span', { class: 'cost' }, COSTS[idea.cost] ?? COSTS[0]),
      idea.tags.map((t) => h('span', {}, `#${t}`)),
      idea.done && idea.doneDate ? h('span', { class: 'when' }, fmtDate(idea.doneDate)) : null)));
  paint(card, themeById(idea.theme));
  const heights = idea.photos.length ? [380, 412] : [262, 304, 346]; // varied heights = pinterest feel
  card.style.setProperty('--h', heights[hash(idea.id) % heights.length]); // css scales it down on phones
  card.style.setProperty('--i', Math.min(index, 14));
  return card;
}

function render() {
  const list = visibleIdeas();
  $('#grid').replaceChildren(...list.map(renderCard));
  $('#wishCount').textContent = data.ideas.filter((i) => !i.done).length;
  $('#doneCount').textContent = data.ideas.filter((i) => i.done).length;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === ui.tab));

  const tags = [...new Set(data.ideas.flatMap((i) => i.tags))].sort();
  if (ui.tag && !tags.includes(ui.tag)) ui.tag = null;
  $('#chips').replaceChildren(...(tags.length ? [
    h('button', { class: `chip${ui.tag ? '' : ' on'}`, type: 'button', onclick: () => { ui.tag = null; render(); } }, 'everything'),
    ...tags.map((t) => h('button', { class: `chip${ui.tag === t ? ' on' : ''}`, type: 'button', onclick: () => { ui.tag = ui.tag === t ? null : t; render(); } }, `#${t}`)),
  ] : []));

  const empty = $('#empty');
  empty.hidden = list.length > 0;
  if (!list.length) {
    empty.textContent = ui.query || ui.tag ? 'nothing matches that… ♡'
      : ui.tab === 'done' ? 'no dates done yet, go make some memories ♡'
        : 'no ideas yet… add the first one with the + ♡';
  }
}

// ---------- overlays ----------
let pickTimer;
function openOverlay(id) { $(id).hidden = false; }
function closeOverlay(el) {
  el.hidden = true;
  if (el.id === 'pickOverlay') { clearTimeout(pickTimer); Mochi.calm(); }
}
document.querySelectorAll('.overlay').forEach((ov) => {
  // Close on a tap/click that both starts *and* ends on the backdrop. Closing on press alone
  // made phones send the rest of the tap to whatever card was underneath ("ghost click").
  let downOnBackdrop = false;
  ov.addEventListener('pointerdown', (e) => { downOnBackdrop = e.target === ov; });
  ov.addEventListener('click', (e) => { if (downOnBackdrop && e.target === ov) closeOverlay(ov); });
  ov.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeOverlay(ov)));
});

function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = h('div', { class: 'toast' }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), 2600);
}

// ---------- photos ----------
// Shrinks the photo (phones take huge ones) to a jpeg and hands it to the store
// (the computer's or the phone's), which keeps it and gives back its file name.
async function importPhoto(file) {
  const bmp = await createImageBitmap(file); // fails for formats Chromium can't read (e.g. HEIC)
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = new OffscreenCanvas(Math.round(bmp.width * scale), Math.round(bmp.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // transparent PNGs get a white background instead of black
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.86 });
  return window.store.addPhoto(new Uint8Array(await blob.arrayBuffer()));
}

// ---------- add / edit ----------
const form = $('#editForm');
let draft;
let importing = 0;

function renderSeg(sel, options, current, onPick) {
  $(sel).replaceChildren(...options.map(([value, label]) => h('button', {
    type: 'button', class: `seg-btn${value === current ? ' on' : ''}`,
    onclick: () => { onPick(value); renderSeg(sel, options, value, onPick); },
  }, label)));
}

function renderSwatches() {
  $('#swatches').replaceChildren(...THEMES.map((t) => {
    const b = h('button', {
      type: 'button', class: `swatch${t.id === draft.theme ? ' on' : ''}`, title: t.name, 'aria-label': t.name,
      onclick: () => { draft.theme = t.id; renderSwatches(); paint($('#banner'), t); },
    });
    paint(b, t);
    return b;
  }));
}

function renderStickerTray() {
  $('#stickerTray').replaceChildren(...STICKERS.map((s) => {
    const on = draft.stickers.includes(s.id);
    return h('button', {
      type: 'button', class: `stk${on ? ' on' : ''}`, title: s.name, 'aria-label': s.name, 'aria-pressed': on ? 'true' : 'false',
      onclick: () => toggleSticker(s.id),
    }, h('img', { src: s.url, alt: '', draggable: 'false' }));
  }));
  $('#stickerCount').textContent = `${draft.stickers.length} / ${MAX_STICKERS}`;
}

function toggleSticker(id) {
  if (draft.stickers.includes(id)) draft.stickers = draft.stickers.filter((x) => x !== id);
  else if (draft.stickers.length >= MAX_STICKERS) { toast(`${MAX_STICKERS} stickers per card max — tap one to peel it off ♡`); return; }
  else draft.stickers = [...draft.stickers, id];
  renderStickerTray();
}

function renderPhotoTray() {
  const tiles = draft.photos.map((p, i) => h('div', { class: 'thumb' },
    h('img', {
      src: photoUrl(p), alt: '', draggable: 'false', title: i ? 'make this the cover photo' : 'cover photo',
      onclick: () => { draft.photos = [p, ...draft.photos.filter((x) => x !== p)]; renderPhotoTray(); },
    }),
    i === 0 ? h('span', { class: 'thumb-cover' }, 'cover') : null,
    h('button', {
      type: 'button', class: 'thumb-x', title: 'remove photo', 'aria-label': 'remove photo',
      onclick: () => { draft.photos = draft.photos.filter((x) => x !== p); renderPhotoTray(); },
    }, '×')));
  for (let i = 0; i < importing; i++) tiles.push(h('div', { class: 'thumb loading' }));
  if (draft.photos.length + importing < MAX_PHOTOS) {
    tiles.push(h('button', { type: 'button', class: 'thumb add', onclick: () => $('#photoInput').click() },
      h('span', {}, '+'), h('small', {}, 'add photos')));
  }
  $('#photoTray').replaceChildren(...tiles);
}

async function addPhotos(files) {
  const target = draft;
  const imgs = [...files].filter((f) => f.type.startsWith('image/'));
  if (!imgs.length) { toast("those don't look like photos ♡"); return; }
  const room = MAX_PHOTOS - target.photos.length - importing;
  if (room <= 0) { toast(`${MAX_PHOTOS} photos per date max ♡`); return; }
  if (imgs.length > room) toast(`only room for ${room} more — ${MAX_PHOTOS} photos per date max`);
  for (const f of imgs.slice(0, room)) {
    importing += 1;
    renderPhotoTray();
    try { target.photos.push(await importPhoto(f)); }
    catch { toast(`couldn't read ${f.name} :( try a jpg or png`); }
    finally { importing -= 1; if (target === draft) renderPhotoTray(); }
  }
}

$('#photoInput').addEventListener('change', (e) => { addPhotos(e.target.files); e.target.value = ''; });
// drop photos anywhere on the editor
form.addEventListener('dragover', (e) => { e.preventDefault(); form.classList.add('dropping'); });
form.addEventListener('dragleave', (e) => { if (!form.contains(e.relatedTarget)) form.classList.remove('dropping'); });
form.addEventListener('drop', (e) => { e.preventDefault(); form.classList.remove('dropping'); addPhotos(e.dataTransfer.files); });
// …and never let a stray drop navigate the whole window away to the image
['dragover', 'drop'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault()));

function openEditor(id) {
  const existing = id ? data.ideas.find((i) => i.id === id) : null;
  const seasonal = THEMES.filter((t) => t.season === activeSeason());
  draft = existing ? structuredClone(existing)
    : blankIdea({ theme: (seasonal.length && Math.random() < 0.5 ? any(seasonal) : any(THEMES)).id, done: ui.tab === 'done' });

  const f = form.elements;
  f.title.value = draft.title;
  f.note.value = draft.note;
  f.tags.value = draft.tags.join(', ');
  f.done.checked = draft.done;
  f.doneDate.value = draft.doneDate;
  f.memory.value = draft.memory;
  $('#doneFields').hidden = !draft.done;
  $('#bannerLabel').textContent = draft.title || 'new date idea';
  paint($('#banner'), themeById(draft.theme));
  form.classList.remove('dropping');

  renderSeg('#whoSeg', [['a', data.names.a], ['b', data.names.b], ['both', 'both of us']], draft.who, (v) => { draft.who = v; });
  renderSeg('#costSeg', COSTS.map((c, i) => [i, c]), draft.cost, (v) => { draft.cost = v; });
  renderSwatches();
  renderStickerTray();
  renderPhotoTray();

  const del = $('#deleteBtn');
  del.hidden = !existing;
  del.classList.remove('armed');
  del.textContent = 'delete';

  openOverlay('#editOverlay');
  form.scrollTop = 0;
  // on touch screens, jumping into the title would pop the keyboard over the whole editor
  if (!matchMedia('(pointer: coarse)').matches) f.title.focus();
}

form.elements.title.addEventListener('input', (e) => { $('#bannerLabel').textContent = e.target.value || 'new date idea'; });
form.elements.done.addEventListener('change', (e) => {
  $('#doneFields').hidden = !e.target.checked;
  if (e.target.checked && !form.elements.doneDate.value) form.elements.doneDate.value = today();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = form.elements;
  const title = f.title.value.trim();
  if (!title) { f.title.focus(); return; }
  if (importing) { toast('one sec, still adding photos…'); return; }
  const wasDone = Boolean(data.ideas.find((i) => i.id === draft.id)?.done);

  delete draft.example; // once you've edited it, it's yours
  Object.assign(draft, {
    title,
    note: f.note.value.trim(),
    tags: [...new Set(f.tags.value.split(',').map((t) => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean))],
    done: f.done.checked,
    doneDate: f.done.checked ? (f.doneDate.value || today()) : f.doneDate.value,
    memory: f.memory.value.trim(),
  });

  const idx = data.ideas.findIndex((i) => i.id === draft.id);
  if (idx >= 0) data.ideas[idx] = draft; else data.ideas.push(draft);
  save();
  closeOverlay($('#editOverlay'));
  render();
  if (draft.done && !wasDone) {
    toast('moved to done & loved — and into our book ♡');
    Mochi.cheer(draft.photos.length ? 'a new page for our book ♡' : 'yay!! add a photo for our book ♡');
  }
});

$('#deleteBtn').addEventListener('click', (e) => {
  const btn = e.currentTarget;
  if (!btn.classList.contains('armed')) { btn.classList.add('armed'); btn.textContent = 'sure? tap again'; return; }
  data.ideas = data.ideas.filter((i) => i.id !== draft.id);
  save();
  closeOverlay($('#editOverlay'));
  render();
  toast('poof, gone');
});

// ---------- pick one for us ----------
function showPick(idea) {
  const card = $('#pickCard');
  paint(card, themeById(idea.theme));
  $('#pickTitle').textContent = idea.title;
  $('#pickNote').textContent = idea.note;
  $('#pickPhoto').replaceChildren(...[polaroid(idea)].filter(Boolean));
  $('#pickStickers').replaceChildren(...stickerEls(idea).filter(Boolean));
  card.classList.remove('bump');
  void card.offsetWidth; // restart the animation
  card.classList.add('bump');
}

function burst() {
  const card = $('#pickCard');
  for (let i = 0; i < 15; i++) {
    const a = (Math.PI * 2 * i) / 15;
    const s = i % 3 === 0 ? h('span', { class: 'burst paw' }) : h('span', { class: 'burst' }, i % 3 === 1 ? '♡' : '✦');
    if (i % 3 === 0) s.style.backgroundImage = `url("${PAW_WHITE}")`;
    s.style.setProperty('--dx', `${Math.cos(a) * (140 + Math.random() * 60)}px`);
    s.style.setProperty('--dy', `${Math.sin(a) * (170 + Math.random() * 60)}px`);
    s.style.setProperty('--rot', `${Math.random() * 90 - 45}deg`);
    card.append(s);
    setTimeout(() => s.remove(), 1100);
  }
}

function startPick() {
  const pool = data.ideas.filter((i) => !i.done);
  const winner = pickDate(data.ideas, ui.lastPickedId);
  if (!pool.length || !winner) { toast('add some wishlist ideas first ♡'); return; }

  clearTimeout(pickTimer);
  openOverlay('#pickOverlay');
  Mochi.watch();
  $('#pickActions').hidden = true;
  $('#pickKicker').textContent = 'shuffling…';
  $('#pickCard').classList.remove('landed');

  const steps = 14 + Math.floor(Math.random() * 6);
  let step = 0;
  let prev = null;
  const tick = () => {
    if (step >= steps) {
      showPick(winner);
      $('#pickCard').classList.add('landed');
      $('#pickKicker').textContent = 'how about…';
      $('#pickActions').hidden = false;
      ui.lastPickedId = winner.id;
      burst();
      Mochi.cheer();
      return;
    }
    let shown = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) while (shown === prev) shown = pool[Math.floor(Math.random() * pool.length)];
    prev = shown;
    showPick(shown);
    step += 1;
    pickTimer = setTimeout(tick, 55 + step * step * 1.8); // slows down like a wheel
  };
  tick();
}

$('#pickBtn').addEventListener('click', startPick);
$('#pickAgain').addEventListener('click', startPick);
$('#pickYes').addEventListener('click', () => {
  closeOverlay($('#pickOverlay'));
  toast('yay, have the best time ♡');
  Mochi.cheer('have fun!! bring me a souvenir');
});

// ---------- names ----------
$('#namesBtn').addEventListener('click', async () => {
  const f = $('#namesForm').elements;
  f.a.value = data.names.a;
  f.b.value = data.names.b;
  openOverlay('#namesOverlay');
  f.a.focus();
  $('#whereHint').textContent = `your dates are saved in: ${await window.store.where()}`;
});
$('#namesForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target.elements;
  data.names = { a: f.a.value.trim() || 'me', b: f.b.value.trim() || 'her' };
  save();
  closeOverlay($('#namesOverlay'));
  render();
});

// ---------- toolbar & keys ----------
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => { ui.tab = t.dataset.tab; render(); }));
$('#search').addEventListener('input', (e) => { ui.query = e.target.value; render(); });
$('#fab').addEventListener('click', () => openEditor(null));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const open = [...document.querySelectorAll('.overlay')].filter((o) => !o.hidden).pop();
    if (open) closeOverlay(open);
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') { e.preventDefault(); openEditor(null); }
});

// ---------- start ----------
(async function init() {
  let raw = null;
  let loadFailed = false;
  try { raw = await window.store.load(); } catch (err) { loadFailed = true; toast(`couldn't open saved dates: ${err.message}`); }
  data = normalize(raw);
  if (!raw && !loadFailed) save(); // first run: write the examples (never overwrite after a failed read)
  // only after a good read: photos no date uses anymore get moved to photos\unused (never deleted)
  if (Array.isArray(raw?.ideas)) window.store.tidyPhotos(data.ideas.flatMap((i) => i.photos)).catch(() => {});

  Mochi.setPets(data.mochi.pets);
  Mochi.onPet = (n) => { data.mochi.pets = n; saveSoon(); };
  applySeason();
  render();

  // the shared board: your partner's changes arrive here (only once you've paired up)
  window.store.subscribe?.((fresh) => {
    data = normalize(fresh);
    Mochi.setPets(data.mochi.pets);
    applySeason();
    render();
  });
})();
