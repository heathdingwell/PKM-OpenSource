/// <reference types="vite/client" />

declare global {
  interface Window {
    pkmShell?: {
      getPlatform: () => string;
      loadVaultState?: () => Promise<unknown>;
      saveVaultState?: (notes: unknown) => Promise<boolean>;
      saveAttachment?: (payload: {
        notePath: string;
        fileName: string;
        base64: string;
      }) => Promise<{
        relativePath: string;
        storedPath: string;
        sizeBytes: number;
      } | null>;
    };
  }
}

export {};
