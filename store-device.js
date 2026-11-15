'use strict';
// On a phone or tablet there's no Electron preload, so this builds the same little
// store bridge on top of the app's private storage on the device. Same promises, same
// photoUrl, so app.js never knows which one it's talking to (store-sync.js picks it up).
(function deviceStore() {
  const cap = window.Capacitor;
  if (window.desktopStore || window.baseStore || !cap?.isNativePlatform?.()) return;

  const fs = cap.registerPlugin('Filesystem');
  const DIR = 'DATA'; // the app's own private folder: survives updates, gone only on uninstall
  const DATES = 'dates.json';
  const TMP = 'dates.json.tmp';
  const PHOTOS = 'photos';
  const PHOTO_NAME = /^[a-z0-9-]+\.jpg$/;
  let photoBase = ''; // web-viewable address of the photos folder, worked out in load()

  const at = (path) => ({ path, directory: DIR });
  const exists = (path) => fs.stat(at(path)).then(() => true, () => false);
  const readText = async (path) => (await fs.readFile({ ...at(path), encoding: 'utf8' })).data;

  // The plugin wants binary as base64; FileReader does that without choking on big photos.
  const toBase64 = (bytes) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(new Blob([bytes], { type: 'image/jpeg' }));
  });

  const randomHex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');

  // Not every platform lets rename overwrite, so clear the way first if it refuses.
  async function move(from, to) {
    try { await fs.rename({ from, to, directory: DIR }); }
    catch {
      if (await exists(to)) await fs.deleteFile(at(to));
      await fs.rename({ from, to, directory: DIR });
    }
  }

  window.baseStore = {
    async load() {
      const { uri } = await fs.getUri(at(PHOTOS));
      photoBase = cap.convertFileSrc(uri);

      // a save that got interrupted mid-swap leaves only the .tmp behind, which is still a full copy
      const file = (await exists(DATES)) ? DATES : (await exists(TMP)) ? TMP : null;
      if (!file) return null;
      const raw = await readText(file);
      try {
        return JSON.parse(raw);
      } catch {
        // Never silently lose your list: keep a copy of the unreadable file.
        await fs.writeFile({ ...at(`dates.broken-${Date.now()}.json`), data: raw, encoding: 'utf8' });
        return null;
      }
    },

    async save(data) {
      // write a temp file first, then swap — a crash mid-save can't corrupt the list
      await fs.writeFile({ ...at(TMP), data: JSON.stringify(data, null, 2), encoding: 'utf8' });
      await move(TMP, DATES);
      return true;
    },

    async where() {
      return 'inside the app on this device ♡';
    },

    async addPhoto(bytes) {
      if (!(bytes instanceof Uint8Array) || bytes.byteLength > 25e6) throw new Error('that file is too big');
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new Error('not a jpeg');
      const name = `${Date.now().toString(36)}-${randomHex(4)}.jpg`;
      await fs.writeFile({ ...at(`${PHOTOS}/${name}`), data: await toBase64(bytes), recursive: true });
      return name;
    },

    // Same promise as on the computer: photos nothing uses are moved to photos/unused, never deleted.
    async tidyPhotos(keep) {
      if (!Array.isArray(keep) || !(await exists(PHOTOS))) return 0;
      const keepSet = new Set(keep);
      const { files } = await fs.readdir(at(PHOTOS));
      let moved = 0;
      for (const f of files) {
        if (f.type !== 'file' || !PHOTO_NAME.test(f.name) || keepSet.has(f.name)) continue;
        if (!moved) await fs.mkdir({ ...at(`${PHOTOS}/unused`), recursive: true }).catch(() => {});
        await move(`${PHOTOS}/${f.name}`, `${PHOTOS}/unused/${f.name}`);
        moved += 1;
      }
      return moved;
    },

    // for the shared board: send a photo, keep one that came from the other phone
    async hasPhoto(name) { return PHOTO_NAME.test(name) && exists(`${PHOTOS}/${name}`); },
    async readPhoto(name) {
      if (!PHOTO_NAME.test(name) || !(await exists(`${PHOTOS}/${name}`))) return null;
      const { data } = await fs.readFile(at(`${PHOTOS}/${name}`)); // base64
      return Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    },
    async writePhoto(name, bytes) {
      if (!PHOTO_NAME.test(name)) throw new Error('bad photo name');
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new Error('not a jpeg');
      if (await exists(`${PHOTOS}/${name}`)) return true; // photos never change
      await fs.writeFile({ ...at(`${PHOTOS}/${name}`), data: await toBase64(bytes), recursive: true });
      return true;
    },

    photoUrl: (name) => (photoBase && PHOTO_NAME.test(name) ? `${photoBase}/${name}` : ''),
  };
})();
