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
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"]
  }
});
