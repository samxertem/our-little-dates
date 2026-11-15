// Electron "main" process: opens the window and reads/writes the dates file + photos.
const { app, BrowserWindow, ipcMain, protocol, net } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');

// Lives in %APPDATA%\our-little-dates\dates.json, so it survives app updates.
const dataPath = () => path.join(app.getPath('userData'), 'dates.json');
// Photos live next to it as plain .jpg files (never inside the json — that would get huge).
const photosDir = () => path.join(app.getPath('userData'), 'photos');
// The only file names we ever create or serve; anything else is refused.
const PHOTO_NAME = /^[a-z0-9-]+\.jpg$/;

// photo://p/<name>.jpg lets the page show a saved photo without seeing the rest of the disk.
protocol.registerSchemesAsPrivileged([
  { scheme: 'photo', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

ipcMain.handle('dates:load', () => {
  const file = dataPath();
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    // Never silently lose your list: keep a copy of the unreadable file.
    fs.copyFileSync(file, file.replace(/\.json$/, `.broken-${Date.now()}.json`));
    return null;
  }
});

ipcMain.handle('dates:save', (_event, data) => {
  const file = dataPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // write to a temp file first, then swap — a crash mid-save can't corrupt the list
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
  return true;
});

ipcMain.handle('dates:where', () => dataPath());

// The page has already shrunk the photo to a jpeg; we just check it really is one and keep it.
ipcMain.handle('photos:add', (_event, bytes) => {
  if (!ArrayBuffer.isView(bytes) || bytes.byteLength > 25e6) throw new Error('that file is too big');
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) throw new Error('not a jpeg');
  fs.mkdirSync(photosDir(), { recursive: true });
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}.jpg`;
  fs.writeFileSync(path.join(photosDir(), name), buf);
  return name;
});

// Photos no date uses anymore (removed, or their date was deleted) are moved into
// photos\unused instead of deleted, so a memory is never lost by accident.
ipcMain.handle('photos:tidy', (_event, keep) => {
  const dir = photosDir();
  if (!Array.isArray(keep) || !fs.existsSync(dir)) return 0;
  const keepSet = new Set(keep);
  const unused = path.join(dir, 'unused');
  let moved = 0;
  for (const name of fs.readdirSync(dir)) {
    if (!PHOTO_NAME.test(name) || keepSet.has(name)) continue;
    fs.mkdirSync(unused, { recursive: true });
    fs.renameSync(path.join(dir, name), path.join(unused, name));
    moved += 1;
  }
  return moved;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1240,
    height: 840,
    minWidth: 760,
    minHeight: 560,
    title: 'our little dates',
    backgroundColor: '#fbf5ee',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    show: !process.env.DATES_SNAPSHOT,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // previews render off-screen, so they work even while the display is asleep
      offscreen: Boolean(process.env.DATES_SNAPSHOT),
    },
  });
  win.loadFile('index.html');

  // Preview helper: `DATES_SNAPSHOT=out.png` saves a screenshot and quits.
  if (process.env.DATES_SNAPSHOT) {
    win.webContents.setFrameRate(30);
    win.webContents.on('console-message', (e) => { if (e.level === 'error' || e.level === 'warning') console.log('[page]', e.message); });
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        if (process.env.DATES_SNAPSHOT_JS) await win.webContents.executeJavaScript(process.env.DATES_SNAPSHOT_JS);
        await new Promise((r) => setTimeout(r, Number(process.env.DATES_SNAPSHOT_WAIT) || 900));
        const img = await win.webContents.capturePage();
        fs.writeFileSync(process.env.DATES_SNAPSHOT, img.toPNG());
        app.quit();
      }, 1200);
    });
  }
}

// previews use a throwaway data folder so they never touch your real list
if (process.env.DATES_SNAPSHOT) app.setPath('userData', path.join(app.getPath('temp'), 'our-little-dates-preview'));

app.whenReady().then(() => {
  protocol.handle('photo', (req) => {
    const name = decodeURIComponent(new URL(req.url).pathname.slice(1));
    const file = path.join(photosDir(), name);
    if (!PHOTO_NAME.test(name) || !fs.existsSync(file)) return new Response('', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
});
app.on('window-all-closed', () => app.quit());
