/// <reference types="vite/client" />

declare global {
  interface Window {
    evernoteShell?: {
      getPlatform: () => string;
      loadVaultState?: () => Promise<unknown>;
      saveVaultState?: (notes: unknown) => Promise<boolean>;
    };
  }
}

export {};
