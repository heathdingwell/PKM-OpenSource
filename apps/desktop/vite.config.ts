import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@pkm-os/vault-core": resolve(__dirname, "../../packages/vault-core/src/index.ts"),
      "@pkm-os/doc-engine": resolve(__dirname, "../../packages/doc-engine/src/index.ts"),
      "@pkm-os/indexer": resolve(__dirname, "../../packages/indexer/src/index.ts"),
      "@pkm-os/ui-features": resolve(__dirname, "../../packages/ui-features/src/index.ts")
    }
  },
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks: {
          tiptap: [
            "@tiptap/react",
            "@tiptap/starter-kit",
            "@tiptap/extension-link",
            "@tiptap/extension-placeholder",
            "@tiptap/extension-task-item",
            "@tiptap/extension-task-list",
            "@tiptap/extension-underline"
          ],
          markdown: ["markdown-it", "markdown-it-task-lists", "turndown"]
        }
      }
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"]
  }
});
