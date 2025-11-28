import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const IGNORED = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.git/**",
  "**/.idea/**",
  "**/.vscode/**",
  "**/canonical_snapshots/**",
  "**/docs/**",
  "**/backups/**",
  "**/*.bak",
  "**/*.backup",
  "**/*.orig",
  "**/*.rej",
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    watchExclude: IGNORED,
    environment: 'jsdom', // Use jsdom for React component tests
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    testTimeout: 30000, // 30 seconds max per test
    hookTimeout: 30000, // 30 seconds max for hooks
    teardownTimeout: 30000, // 30 seconds max for teardown
    pool: 'forks', // Use separate processes instead of threads
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially to avoid file system issues
      },
    },
    isolate: true, // Isolate each test file
  },
  // Skip CSS/PostCSS processing in tests - use simple config
  css: {
    modules: {
      classNameStrategy: 'non-scoped',
    },
  },
});
