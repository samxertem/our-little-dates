'use strict';
// ✿ the shared board ✿
// Wraps whichever store this device has (computer, phone, browser) so that, once you two are
// paired, every change also goes up to the shared board and your partner's changes come down.
// Offline first: everything is saved on this device before anything else happens, and syncing
// simply catches up whenever there's internet.
(function syncStore() {
  const cfg = window.SYNC_CONFIG;
  const local = window.desktopStore || window.baseStore; // computer, else phone/browser
  window.store = local; // works without the shared board too (no internet library, no config)
  if (!local || !cfg?.url || !window.supabase?.createClient) return;

  const db = window.supabase.createClient(cfg.url, cfg.key, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'our-little-dates-auth' },
  });
  const META_KEYS = ['names', 'settings', 'mochi'];
  const PHOTO_NAME = /^[a-z0-9-]+\.jpg$/;
  const PAGE = 500;

  // ---------- what we remember about syncing (kept inside the dates file as `_sync`) ----------
  const blankMeta = () => ({
    boardId: null, code: null,
    me: 'a',            // which of the two names is the person holding THIS device (never synced)
    cursor: null,       // server time of the newest change we've pulled
    known: {},          // id -> fingerprint of that idea as last saved/synced (spots edits)
    dirty: {},          // id -> true: changed here, not on the board yet
    tombstones: {},     // id -> { id, deleted, updatedAt }: deleted here, not on the board yet
    metaKnown: '', metaAt: 0, metaDirty: false,
    uploaded: [],       // photo names already on the board
  });
  let meta = blankMeta();
  let current = null;   // the newest data (what the app last saved, or what we last handed it)
  let onRemote = null;  // app's "here's fresh data from your partner" callback
  let status = 'off';   // off | syncing | synced | offline | error
  let statusDetail = '';
  const statusFns = new Set();
  const localPhotos = new Set();

  // Postgres stores json with its keys in its own order, so compare with sorted keys instead.
  const stable = (v) => (Array.isArray(v) ? `[${v.map(stable).join(',')}]`
    : v && typeof v === 'object' ? `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`
      : JSON.stringify(v));
  const fingerprint = (idea) => stable({ ...idea, updatedAt: undefined });
  const metaOf = (d) => Object.fromEntries(META_KEYS.map((k) => [k, d?.[k]]));
  const paired = () => Boolean(meta.boardId);

  function setStatus(s, detail = '') {
    if (s === status && detail === statusDetail) return;
    status = s; statusDetail = detail;
    statusFns.forEach((fn) => { try { fn(s, detail); } catch { /* a bad listener shouldn't stop syncing */ } });
  }

  // ---------- ✿ when you both changed the same date ✿ ----------
  // `mine` is this device's version, `theirs` came from the board. Either one may be a
  // deleted marker: { id, deleted: true, updatedAt }. Every version has `updatedAt` (ms,
  // the device's clock when it was edited). Return the version to keep — one of the two,
  // or a new object combining them (give it a fresh updatedAt if you build a new one).
  function mergeIdea(mine, theirs) {
    // TODO: decide how a clash between the two of you gets settled.
    // For now: whichever edit happened last wins completely.
    return (theirs.updatedAt || 0) > (mine.updatedAt || 0) ? theirs : mine;
  }

  // ---------- noticing changes made on this device ----------
  function noteLocalChanges(data) {
    if (!data?.ideas) return;
    const now = Date.now();
    const seen = new Set();
    for (const idea of data.ideas) {
      seen.add(idea.id);
      const fp = fingerprint(idea);
      if (meta.known[idea.id] !== fp) {
        idea.updatedAt = now; // stamped onto the idea itself, so it travels with it
        meta.known[idea.id] = fp;
        meta.dirty[idea.id] = true;
        delete meta.tombstones[idea.id];
      }
    }
    for (const id of Object.keys(meta.known)) {
      if (seen.has(id)) continue;
      delete meta.known[id];
      meta.tombstones[id] = { id, deleted: true, updatedAt: now };
      meta.dirty[id] = true;
    }
    const m = stable(metaOf(data));
    if (m !== meta.metaKnown) { meta.metaKnown = m; meta.metaAt = now; meta.metaDirty = true; }
  }

  const saveLocal = () => local.save({ ...current, _sync: meta });

  // ---------- signing in (anonymous: no passwords, just "this device") ----------
  async function ensureSession() {
    const { data } = await db.auth.getSession();
    if (data.session) return { fresh: false };
    const { error } = await db.auth.signInAnonymously();
    if (error) throw error;
    return { fresh: true };
  }

  // A brand-new sign-in (app data cleared, reinstall…) isn't on the board yet: rejoin with our code.
  async function ensureMember() {
    const { fresh } = await ensureSession();
    if (!fresh) {
      const { data, error } = await db.from('boards').select('id').eq('id', meta.boardId).maybeSingle();
      if (error) throw error;
      if (data) return;
    }
    const { error } = await db.rpc('join_board', { code: meta.code });
    if (error) throw error;
  }

  // ---------- one round of syncing: fetch → merge → push → photos ----------
  // Fetching is slow and the app may save meanwhile, so nothing is touched while we wait…
  async function fetchRemote() {
    const rows = [];
    let cursor = meta.cursor;
    for (;;) {
      let q = db.from('ideas').select('id, data, deleted, synced_at').eq('board_id', meta.boardId)
        .order('synced_at', { ascending: true }).limit(PAGE);
      if (cursor) q = q.gt('synced_at', cursor);
      const { data: page, error } = await q;
      if (error) throw error;
      rows.push(...page);
      if (page.length) cursor = page[page.length - 1].synced_at;
      if (page.length < PAGE) break;
    }
    const { data: board, error } = await db.from('boards').select('meta, meta_updated_at').eq('id', meta.boardId).maybeSingle();
    if (error) throw error;
    return { rows, cursor, board };
  }

  // …then everything is applied AND handed to the app in one go, with no waiting in between,
  // so a save can never sneak in with an older copy (and make your partner's new date look deleted).
  function applyRemoteAll({ rows, cursor, board }) {
    let changed = false;
    for (const row of rows) changed = applyRemote(row) || changed;
    meta.cursor = cursor;
    if (board && Number(board.meta_updated_at) > meta.metaAt) {
      const theirs = board.meta || {};
      const pets = Math.max(Number(current.mochi?.pets) || 0, Number(theirs.mochi?.pets) || 0); // pets only ever add up
      for (const k of META_KEYS) if (theirs[k] !== undefined) current[k] = theirs[k];
      current.mochi = { ...(current.mochi || {}), pets };
      meta.metaAt = Number(board.meta_updated_at);
      meta.metaKnown = stable(metaOf(current));
      meta.metaDirty = pets !== (Number(theirs.mochi?.pets) || 0);
      changed = true;
    }
    if (changed && onRemote) {
      current = structuredClone(current);
      onRemote(structuredClone(current));
    }
    return changed;
  }

  function applyRemote(row) {
    const id = row.id;
    const theirs = row.deleted ? { id, deleted: true, updatedAt: Number(row.data?.updatedAt) || 0 } : { ...row.data, id };
    const idx = current.ideas.findIndex((i) => i.id === id);
    const mine = idx >= 0 ? current.ideas[idx] : meta.tombstones[id] || null;

    let keep = theirs;
    if (mine && meta.dirty[id]) {
      if (fingerprint(mine) === fingerprint(theirs)) { delete meta.dirty[id]; delete meta.tombstones[id]; } // our own echo
      else keep = mergeIdea(mine, theirs) || theirs;
    }
    if (keep === theirs) { delete meta.dirty[id]; delete meta.tombstones[id]; } else meta.dirty[id] = true;

    if (keep.deleted) {
      if (idx < 0) return false;
      current.ideas.splice(idx, 1);
      delete meta.known[id];
      if (keep !== theirs) meta.tombstones[id] = keep;
      return true;
    }
    const before = idx >= 0 ? fingerprint(current.ideas[idx]) : null;
    if (idx >= 0) current.ideas[idx] = keep; else current.ideas.push(keep);
    meta.known[id] = fingerprint(keep);
    return before !== meta.known[id];
  }

  async function push() {
    const ids = Object.keys(meta.dirty);
    if (ids.length) {
      const sent = {}; // id -> what we sent, so an edit made *while* sending isn't marked as done
      const rows = ids.map((id) => {
        const tomb = meta.tombstones[id];
        if (tomb) { sent[id] = 'deleted'; return { board_id: meta.boardId, id, deleted: true, data: { updatedAt: tomb.updatedAt } }; }
        const idea = current.ideas.find((i) => i.id === id);
        if (!idea) { delete meta.dirty[id]; return null; }
        sent[id] = fingerprint(idea);
        return { board_id: meta.boardId, id, deleted: false, data: structuredClone(idea) };
      }).filter(Boolean);
      for (let i = 0; i < rows.length; i += PAGE) {
        const { error } = await db.from('ideas').upsert(rows.slice(i, i + PAGE), { onConflict: 'board_id,id' });
        if (error) throw error;
      }
      for (const id of Object.keys(sent)) {
        const now = meta.tombstones[id] ? 'deleted' : meta.known[id];
        if (now === sent[id]) { delete meta.dirty[id]; delete meta.tombstones[id]; }
      }
    }
    if (meta.metaDirty) {
      const { error } = await db.from('boards').update({ meta: metaOf(current), meta_updated_at: meta.metaAt }).eq('id', meta.boardId);
      if (error) throw error;
      meta.metaDirty = false;
    }
  }

  // Photos: send ours that the board doesn't have, fetch theirs that this device doesn't have.
  async function syncPhotos() {
    const wanted = [...new Set(current.ideas.flatMap((i) => i.photos || []))].filter((n) => PHOTO_NAME.test(n));
    const uploaded = new Set(meta.uploaded);
    let gotNew = false;
    for (const name of wanted) {
      const path = `${meta.boardId}/${name}`;
      const here = localPhotos.has(name) || (await local.hasPhoto(name));
      if (here) localPhotos.add(name);
      if (here && !uploaded.has(name)) {
        const bytes = await local.readPhoto(name);
        if (!bytes) continue;
        const { error } = await db.storage.from('photos').upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
        if (error && !/exist|duplicate/i.test(error.message)) throw error; // "already there" is fine
        uploaded.add(name);
      } else if (!here) {
        const { data: blob, error } = await db.storage.from('photos').download(path);
        if (error) continue; // not uploaded yet by the other phone — next round
        await local.writePhoto(name, new Uint8Array(await blob.arrayBuffer()));
        localPhotos.add(name);
        uploaded.add(name);
        gotNew = true;
      }
    }
    meta.uploaded = [...uploaded];
    return gotNew;
  }

  let running = false;
  let again = false;
  async function syncNow() {
    if (!paired() || !current) return;
    if (running) { again = true; return; }
    running = true;
    setStatus('syncing');
    try {
      do {
        again = false;
        if (!navigator.onLine) { setStatus('offline'); return; }
        await ensureMember();
        listen();
        applyRemoteAll(await fetchRemote());
        await push();
        const newPhotos = await syncPhotos();
        await saveLocal();
        if (newPhotos && onRemote) onRemote(structuredClone(current)); // re-draw with the arrived photos
      } while (again);
      setStatus('synced');
    } catch (err) {
      console.warn('[sync]', err);
      setStatus(navigator.onLine ? 'error' : 'offline', err?.message || String(err));
    } finally {
      running = false;
    }
  }

  let syncTimer;
  const syncSoon = (ms = 1200) => { clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, ms); };

  // ---------- live updates from your partner ----------
  let channel = null;
  function listen() {
    if (channel || !paired()) return;
    channel = db.channel(`board-${meta.boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas', filter: `board_id=eq.${meta.boardId}` }, () => syncSoon(300))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'boards', filter: `id=eq.${meta.boardId}` }, () => syncSoon(300))
      .subscribe();
  }
  function stopListening() { if (channel) { db.removeChannel(channel); channel = null; } }

  window.addEventListener('online', () => syncSoon(200));
  window.addEventListener('offline', () => paired() && setStatus('offline'));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncSoon(200); });
  setInterval(() => { if (!document.hidden) syncNow(); }, 60_000); // a gentle safety net

  // ---------- the store the app sees: the same one, plus sharing ----------
  window.store = {
    ...local,

    async load() {
      const raw = await local.load();
      if (raw && typeof raw === 'object') {
        if (raw._sync) meta = { ...blankMeta(), ...raw._sync };
        delete raw._sync;
      }
      current = raw;
      if (paired()) { listen(); syncSoon(800); } // first sync after the board is on screen
      return raw;
    },

    async save(data) {
      current = data;
      if (paired()) noteLocalChanges(data);
      const ok = await saveLocal();
      if (paired()) syncSoon();
      return ok;
    },

    async addPhoto(bytes) {
      const name = await local.addPhoto(bytes);
      localPhotos.add(name);
      return name;
    },

    // The app hands us a function to call when your partner's changes arrive.
    subscribe(fn) { onRemote = fn; },

    sharing: {
      get paired() { return paired(); },
      get code() { return meta.code; },
      get me() { return meta.me; },
      get status() { return status; },
      get statusDetail() { return statusDetail; },
      onStatus(fn) { statusFns.add(fn); return () => statusFns.delete(fn); },
      syncNow,

      // Start a shared board from everything on this device.
      async create() {
        await ensureSession();
        const { data, error } = await db.rpc('create_board', { board_meta: metaOf(current) });
        if (error) throw error;
        meta = { ...blankMeta(), boardId: data[0].board_id, code: data[0].invite_code, me: 'a' };
        noteLocalChanges(current); // every idea + the names count as new for the board
        await saveLocal();
        listen();
        await syncNow();
        return meta.code;
      },

      // Join your partner's board. The little example dates on a fresh install are left behind;
      // anything you wrote yourself on this device gets added to the shared board.
      async join(code) {
        await ensureSession();
        const { data: boardId, error } = await db.rpc('join_board', { code });
        if (error) throw error;
        const { data: board, error: e2 } = await db.from('boards').select('invite_code, meta, meta_updated_at').eq('id', boardId).single();
        if (e2) throw e2;
        // On this device "a" meant you; on the shared board you're "b", so your own ideas swap over.
        const swap = { a: 'b', b: 'a' };
        current.ideas = current.ideas.filter((i) => !i.example).map((i) => ({ ...i, who: swap[i.who] || i.who }));
        meta = { ...blankMeta(), boardId, code: board.invite_code, me: 'b' };
        noteLocalChanges(current);
        meta.metaDirty = false; // their names/settings win on joining
        meta.metaAt = 0;
        await saveLocal();
        listen();
        await syncNow();
        if (onRemote) onRemote(structuredClone(current));
        return meta.code;
      },

      // This device stops sharing; its copy of everything stays right here.
      async leave() {
        stopListening();
        try {
          const { data } = await db.auth.getUser();
          if (data?.user) await db.from('board_members').delete().eq('board_id', meta.boardId).eq('user_id', data.user.id);
        } catch { /* offline: the board just keeps a stale member, harmless */ }
        meta = { ...blankMeta(), me: meta.me }; // still the same person, just not sharing
        await saveLocal();
        setStatus('off');
      },
    },
  };
})();
