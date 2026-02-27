import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@evernote-os/vault-core": resolve(__dirname, "../../packages/vault-core/src/index.ts"),
      "@evernote-os/doc-engine": resolve(__dirname, "../../packages/doc-engine/src/index.ts"),
      "@evernote-os/indexer": resolve(__dirname, "../../packages/indexer/src/index.ts"),
      "@evernote-os/ui-features": resolve(__dirname, "../../packages/ui-features/src/index.ts")
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"]
  }
});
