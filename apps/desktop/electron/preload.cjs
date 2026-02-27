const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pkmShell", {
  getPlatform: () => process.platform,
  loadVaultState: () => ipcRenderer.invoke("vault:load"),
  saveVaultState: (notes) => ipcRenderer.invoke("vault:save", notes),
  saveAttachment: (payload) => ipcRenderer.invoke("vault:attach", payload),
  cloneAttachmentLinks: (payload) => ipcRenderer.invoke("vault:clone-attachments", payload),
  chatWithLlm: (payload) => ipcRenderer.invoke("llm:chat", payload)
});
