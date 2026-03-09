const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pkmShell", {
  getPlatform: () => process.platform,
  loadVaultState: () => ipcRenderer.invoke("vault:load"),
  saveVaultState: (notes) => ipcRenderer.invoke("vault:save", notes),
  saveAttachment: (payload) => ipcRenderer.invoke("vault:attach", payload),
  cloneAttachmentLinks: (payload) => ipcRenderer.invoke("vault:clone-attachments", payload),
  exportNotePdf: (payload) => ipcRenderer.invoke("vault:export-note-pdf", payload),
  getVaultPath: () => ipcRenderer.invoke("vault:path"),
  revealVault: () => ipcRenderer.invoke("vault:reveal"),
  pickVaultFolder: () => ipcRenderer.invoke("vault:pick"),
  relaunchApp: () => ipcRenderer.invoke("vault:relaunch"),
  openUrl: (url) => ipcRenderer.invoke("shell:open-url", url),
  writeClipboard: (text) => ipcRenderer.invoke("clipboard:write", text),
  getGitBackupStatus: () => ipcRenderer.invoke("vault:git-status"),
  setGitBackupEnabled: (enabled) => ipcRenderer.invoke("vault:git-set-enabled", enabled),
  setGitBackupSettings: (payload) => ipcRenderer.invoke("vault:git-update-settings", payload),
  backupVaultToGit: () => ipcRenderer.invoke("vault:git-backup"),
  chatWithLlm: (payload) => ipcRenderer.invoke("llm:chat", payload),
  testLlmConnection: (payload) => ipcRenderer.invoke("llm:test-connection", payload),
  listLlmModels: (payload) => ipcRenderer.invoke("llm:list-models", payload),
  readwiseTest: (token) => ipcRenderer.invoke("readwise:test", token),
  readwiseSync: (payload) => ipcRenderer.invoke("readwise:sync", payload),
  readwiseStatus: () => ipcRenderer.invoke("readwise:status"),
  runGeminiCli: (payload) => ipcRenderer.invoke("cli:gemini", payload),
  runCodexCli: (payload) => ipcRenderer.invoke("cli:codex", payload),
  buildEmbeddingIndex: (payload) => ipcRenderer.invoke("embed:index", payload),
  semanticSearch: (payload) => ipcRenderer.invoke("embed:search", payload),
  getEmbeddingStatus: () => ipcRenderer.invoke("embed:status"),
  onAppMenuAction: (listener) => {
    if (typeof listener !== "function") {
      return undefined;
    }
    const wrapped = (_event, actionId) => listener(actionId);
    ipcRenderer.on("app:menu-action", wrapped);
    return () => {
      ipcRenderer.removeListener("app:menu-action", wrapped);
    };
  }
});
