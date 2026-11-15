'use strict';
// Last resort: a plain browser tab (no Electron, no phone app). Used to preview the
// phone layout on a computer. Everything lives in this browser's localStorage, which
// only holds ~5 MB, so it's for trying things out — not for keeping real memories.
(function previewStore() {
  if (window.desktopStore || window.baseStore) return;

  const KEY = 'our-little-dates';
  const PHOTO_KEY = 'our-little-dates:photo:';
  const PHOTO_NAME = /^[a-z0-9-]+\.jpg$/;
  const photos = new Map(); // name -> data: url

  const toDataUrl = (bytes) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(new Blob([bytes], { type: 'image/jpeg' }));
  });

  window.baseStore = {
    async load() {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(PHOTO_KEY)) photos.set(k.slice(PHOTO_KEY.length), localStorage.getItem(k));
      }
      const raw = localStorage.getItem(KEY);
      if (raw == null) return null;
      try { return JSON.parse(raw); } catch { return null; }
    },
    async save(data) {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    },
    async where() {
      return 'only in this browser (preview mode) ♡';
    },
    async addPhoto(bytes) {
      const name = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}.jpg`;
      const url = await toDataUrl(bytes);
      try { localStorage.setItem(PHOTO_KEY + name, url); }
      catch { throw new Error('the browser preview is full'); }
      photos.set(name, url);
      return name;
    },
    async tidyPhotos() { return 0; },
    async hasPhoto(name) { return photos.has(name); },
    async readPhoto(name) {
      const url = photos.get(name);
      return url ? Uint8Array.from(atob(url.split(',')[1]), (c) => c.charCodeAt(0)) : null;
    },
    async writePhoto(name, bytes) {
      if (!PHOTO_NAME.test(name) || photos.has(name)) return true;
      const url = await toDataUrl(bytes);
      try { localStorage.setItem(PHOTO_KEY + name, url); } catch { /* preview is full: keep it for this visit only */ }
      photos.set(name, url);
      return true;
    },
    photoUrl: (name) => (PHOTO_NAME.test(name) && photos.get(name)) || '',
  };
})();
