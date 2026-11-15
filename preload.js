// The only bridge between the page and the computer: dates + photos, nothing else.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('store', {
  load: () => ipcRenderer.invoke('dates:load'),
  save: (data) => ipcRenderer.invoke('dates:save', data),
  where: () => ipcRenderer.invoke('dates:where'),
  addPhoto: (jpegBytes) => ipcRenderer.invoke('photos:add', jpegBytes),
  tidyPhotos: (keepNames) => ipcRenderer.invoke('photos:tidy', keepNames),
});
