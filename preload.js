// The only bridge between the page and the computer: dates + photos, nothing else.
// (the shared board talks to the internet from the page itself, see store-sync.js)
const { contextBridge, ipcRenderer } = require('electron');

// Exposed as desktopStore (read-only, Electron's rule); store-sync.js builds window.store on top.
contextBridge.exposeInMainWorld('desktopStore', {
  load: () => ipcRenderer.invoke('dates:load'),
  save: (data) => ipcRenderer.invoke('dates:save', data),
  where: () => ipcRenderer.invoke('dates:where'),
  addPhoto: (jpegBytes) => ipcRenderer.invoke('photos:add', jpegBytes),
  tidyPhotos: (keepNames) => ipcRenderer.invoke('photos:tidy', keepNames),
  hasPhoto: (name) => ipcRenderer.invoke('photos:has', name),
  readPhoto: (name) => ipcRenderer.invoke('photos:read', name),
  writePhoto: (name, jpegBytes) => ipcRenderer.invoke('photos:write', name, jpegBytes),
  // where the page can show a saved photo from (served by main.js)
  photoUrl: (name) => `photo://p/${name}`,
});
