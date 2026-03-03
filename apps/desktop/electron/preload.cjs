const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pkmShell", {
  getPlatform: () => process.platform,
  loadVaultState: () => ipcRenderer.invoke("vault:load"),
  saveVaultState: (notes) => ipcRenderer.invoke("vault:save", notes),
  saveAttachment: (payload) => ipcRenderer.invoke("vault:attach", payload),
  cloneAttachmentLinks: (payload) => ipcRenderer.invoke("vault:clone-attachments", payload),
  exportNotePdf: (payload) => ipcRenderer.invoke("vault:export-note-pdf", payload),
  getGitBackupStatus: () => ipcRenderer.invoke("vault:git-status"),
  setGitBackupEnabled: (enabled) => ipcRenderer.invoke("vault:git-set-enabled", enabled),
  setGitBackupSettings: (payload) => ipcRenderer.invoke("vault:git-update-settings", payload),
  backupVaultToGit: () => ipcRenderer.invoke("vault:git-backup"),
  chatWithLlm: (payload) => ipcRenderer.invoke("llm:chat", payload),
  testLlmConnection: (payload) => ipcRenderer.invoke("llm:test-connection", payload),
  listLlmModels: (payload) => ipcRenderer.invoke("llm:list-models", payload)
});
