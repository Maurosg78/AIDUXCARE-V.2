/// <reference types="node" />
import { defineConfig } from 'vitest/config';
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ESM-compatible __dirname
const __filename = fileURLToPath(typeof import.meta !== 'undefined' && import.meta.url ? import.meta.url : `file://${process.cwd()}/vitest.lowmem.config.ts`);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/shared/utils/logger": path.resolve(__dirname, "./src/test/mocks/logger.ts"),
    },
  },
  test: {
    environment: 'jsdom',
    isolate: false,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    teardownTimeout: 30_000,
    globals: false,
    exclude: ['**/canonical_snapshots/**', '**/node_modules/**'],
    setupFiles: ['test/setup.ts', 'src/test-watchdog.js', './src/test-port-mocks.ts', './src/test-setup.ts', './test/vitest.setup.ts'],
    globalTeardown: './src/test-teardown.ts',
  },
  deps: {
    optimizer: {
      web: { enabled: false },
      ssr: { enabled: false },
    },
  },
});

