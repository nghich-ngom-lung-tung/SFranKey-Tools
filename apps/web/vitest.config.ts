import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(root, "src") },
  },
  test: {
    environment: "jsdom",
    setupFiles: [path.resolve(root, "test/setup.ts")],
    exclude: ["tests/**/*.spec.ts", "node_modules/**", ".next/**"],
    clearMocks: true,
    restoreMocks: true,
  },
});
