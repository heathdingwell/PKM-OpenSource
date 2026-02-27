const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("evernoteShell", {
  getPlatform: () => process.platform,
  loadVaultState: () => ipcRenderer.invoke("vault:load"),
  saveVaultState: (notes) => ipcRenderer.invoke("vault:save", notes)
});
