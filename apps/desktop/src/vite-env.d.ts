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
      exportNotePdf?: (payload: {
        title: string;
        html: string;
      }) => Promise<{
        ok: boolean;
        path?: string;
        error?: string;
      } | null>;
      getVaultPath?: () => Promise<string>;
      revealVault?: () => Promise<{ ok: boolean } | null>;
      pickVaultFolder?: () => Promise<{ cancelled: boolean; vaultPath?: string } | null>;
      relaunchApp?: () => Promise<unknown>;
      openUrl?: (url: string) => Promise<{ ok: boolean; error?: string } | null>;
      writeClipboard?: (text: string) => Promise<{ ok: boolean } | null>;
      getGitBackupStatus?: () => Promise<{
        enabled: boolean;
        commitPrefix: string;
        autosaveDelayMs: number;
        autoPush: boolean;
        pushRemote: string;
        pushBranch: string;
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
        commitPrefix: string;
        autosaveDelayMs: number;
        autoPush: boolean;
        pushRemote: string;
        pushBranch: string;
        available: boolean | null;
        repoReady: boolean;
        dirty: boolean;
        busy: boolean;
        lastRunAt: string | null;
        lastCommitAt: string | null;
        lastCommitHash: string;
        lastError: string;
      } | null>;
      setGitBackupSettings?: (payload: {
        commitPrefix?: string;
        autosaveDelayMs?: number;
        autoPush?: boolean;
        pushRemote?: string;
        pushBranch?: string;
      }) => Promise<{
        enabled: boolean;
        commitPrefix: string;
        autosaveDelayMs: number;
        autoPush: boolean;
        pushRemote: string;
        pushBranch: string;
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
        commitPrefix: string;
        autosaveDelayMs: number;
        autoPush: boolean;
        pushRemote: string;
        pushBranch: string;
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
          content:
            | string
            | Array<
                | { type: "text"; text: string }
                | { type: "image_url"; image_url: { url: string } }
                | { type: "image"; source: { type: string; media_type: string; data: string } }
              >;
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
      readwiseTest?: (token: string) => Promise<{ ok?: boolean; error?: string } | null>;
      readwiseSync?: (payload: { token: string; fullSync?: boolean }) => Promise<{
        ok?: boolean;
        error?: string;
        notes?: Array<{ bookId: number; noteName: string; noteContent: string; coverImageUrl?: string }>;
        bookCount?: number;
      } | null>;
      readwiseStatus?: () => Promise<{ lastSyncAt: string | null; bookCount: number } | null>;
      runGeminiCli?: (payload: { noteTitle: string; noteContent: string; prompt?: string }) => Promise<{
        ok?: boolean;
        command?: string;
        tmpFile?: string;
      } | null>;
      runCodexCli?: (payload: { noteTitle: string; noteContent: string; task?: string }) => Promise<{
        ok?: boolean;
        command?: string;
        tmpFile?: string;
      } | null>;
      buildEmbeddingIndex?: (payload: {
        notes: Array<{ id: string; title: string; content: string; hash: string }>;
        provider?: "openai" | "anthropic" | "gemini" | "perplexity" | "openai-compatible" | "ollama";
        baseUrl: string;
        apiKey: string;
        model: string;
      }) => Promise<{ ok?: boolean; generated?: number; total?: number; error?: string } | null>;
      semanticSearch?: (payload: {
        query: string;
        provider?: "openai" | "anthropic" | "gemini" | "perplexity" | "openai-compatible" | "ollama";
        baseUrl: string;
        apiKey: string;
        model: string;
        topK?: number;
      }) => Promise<{
        ok?: boolean;
        results?: Array<{ id: string; title?: string; score: number }>;
        error?: string;
      } | null>;
      getEmbeddingStatus?: () => Promise<{ ok?: boolean; count: number } | null>;
      onAppMenuAction?: (listener: (actionId: string) => void) => (() => void) | void;
    };
  }
}

export {};
