const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('mathkidDesktop', Object.freeze({
  saveBackup: text => ipcRenderer.invoke('mathkid:save-backup', text),
  openBackup: () => ipcRenderer.invoke('mathkid:open-backup'),
}));
