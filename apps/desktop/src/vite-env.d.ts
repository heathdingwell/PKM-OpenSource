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
      cloneAttachmentLinks?: (payload: {
        sourceNotePath: string;
        targetNotePath: string;
        markdown: string;
      }) => Promise<{
        markdown: string;
        copied?: number;
      } | null>;
    };
  }
}

export {};
