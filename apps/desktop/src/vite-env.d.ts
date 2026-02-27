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
      getGitBackupStatus?: () => Promise<{
        enabled: boolean;
        available: boolean | null;
        repoReady: boolean;
        dirty: boolean;
        busy: boolean;
        lastRunAt: string | null;
        lastCommitAt: string | null;
        lastCommitHash: string;
        lastError: string;
      } | null>;
      setGitBackupEnabled?: (enabled: boolean) => Promise<{
        enabled: boolean;
        available: boolean | null;
        repoReady: boolean;
        dirty: boolean;
        busy: boolean;
        lastRunAt: string | null;
        lastCommitAt: string | null;
        lastCommitHash: string;
        lastError: string;
      } | null>;
      backupVaultToGit?: () => Promise<{
        enabled: boolean;
        available: boolean | null;
        repoReady: boolean;
        dirty: boolean;
        busy: boolean;
        lastRunAt: string | null;
        lastCommitAt: string | null;
        lastCommitHash: string;
        lastError: string;
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
      testLlmConnection?: (payload: {
        provider?: "openai" | "anthropic" | "gemini" | "perplexity" | "openai-compatible" | "ollama";
        baseUrl: string;
        apiKey: string;
      }) => Promise<{
        ok?: boolean;
        detail?: string;
        error?: string;
      } | null>;
      listLlmModels?: (payload: {
        provider?: "openai" | "anthropic" | "gemini" | "perplexity" | "openai-compatible" | "ollama";
        baseUrl: string;
        apiKey: string;
      }) => Promise<{
        models?: string[];
        error?: string;
      } | null>;
    };
  }
}

export {};
