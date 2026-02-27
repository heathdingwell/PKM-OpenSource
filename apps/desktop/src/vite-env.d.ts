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
      chatWithLlm?: (payload: {
        provider?: "openai" | "anthropic" | "gemini" | "perplexity" | "openai-compatible" | "ollama";
        baseUrl: string;
        apiKey: string;
        model: string;
        temperature?: number;
        messages: Array<{
          role: "system" | "user" | "assistant";
          content: string;
        }>;
      }) => Promise<{
        message?: string;
        error?: string;
      } | null>;
    };
  }
}

export {};
