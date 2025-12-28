/// <reference types="node" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ESM-compatible __dirname
const __filename = fileURLToPath(typeof import.meta !== 'undefined' && import.meta.url ? import.meta.url : `file://${process.cwd()}/vitest.config.ts`);
const __dirname = dirname(__filename);

const IGNORED = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.git/**",
  "**/.idea/**",
  "**/.vscode/**",
  "**/canonical_snapshots/**",
  "**/canonical_snapshots_OLD*/**",
  "**/docs/**",
  "**/backups/**",
  "**/*.bak",
  "**/*.backup",
  "**/*.orig",
  "**/*.rej",
  // Exclude Playwright tests (they run with their own runner)
  "**/tests/e2e/**",
  "**/test/tests/e2e/**",
  "**/*.spec.e2e.*",
  "**/*.pw.*",
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/shared/utils/logger": path.resolve(__dirname, "./src/test/mocks/logger.ts"),
    },
  },
  server: {
    fs: {
      deny: [
        '**/canonical_snapshots/**',
        '**/canonical_snapshots_OLD*/**',
      ],
    },
  },
  optimizeDeps: {
    force: false,
    entries: [],
    exclude: ['idb', '@firebase/app', '@firebase/auth'],
  },
  test: {
    // ✅ BALA DE PLATA: sólo corre tests aquí
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "test/**/*.{test,spec}.{ts,tsx}",
    ],

    // ✅ Cinturón y tirantes (exclude como backup)
    exclude: [
      ...IGNORED,
      '**/canonical_snapshots/**',
      '**/canonical_snapshots_OLD*/**',
      '**/_deprecated/**',
    ],

    // ✅ Evita watch/cuelgue accidental
    watch: false,

    environment: 'jsdom', // Use jsdom for React component tests
    globals: false, // Desactivado: causa hang con --pool=forks
    setupFiles: ['src/test-watchdog.js', './src/test-port-mocks.ts', './src/test-setup.ts', './test/vitest.setup.ts'],
    // @ts-expect-error - globalTeardown is supported in runtime but not in type definitions for this Vitest version
    globalTeardown: './src/test-teardown.ts',
    testTimeout: 10_000, // 10 seconds max per test (timeout corto para diagnóstico)
    hookTimeout: 10_000, // 10 seconds max for hooks
    teardownTimeout: 5_000, // 5 seconds max for teardown
    isolate: false,
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    deps: {
      optimizer: {
        web: { enabled: false },
        ssr: { enabled: false },
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.*',
        '**/*.d.ts',
        '**/test-setup.ts',
        '**/*.test.*',
        '**/*.spec.*',
        '**/__tests__/**',
        '**/__mocks__/**',
        'docs/**',
        'canonical_snapshots/**',
        'canonical_snapshots_OLD*/**',
        'backups/**',
        'scripts/**',
        'tests/**',
      ],
      thresholds: {
        lines: 0, // Start with 0%, increase gradually
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
  },
  // Skip CSS/PostCSS processing in tests - use simple config
  css: {
    modules: {
      // classNameStrategy removed - not supported in this version
    },
  },
});
