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
    },
  },
  test: {
    // ✅ BALA DE PLATA: sólo corre tests aquí
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "test/**/*.{test,spec}.{ts,tsx}",
    ],
    
    // ✅ Cinturón y tirantes (exclude como backup)
    watchExclude: IGNORED,
    exclude: [
      ...IGNORED,
      '**/canonical_snapshots/**',
      '**/canonical_snapshots_OLD*/**',
      '**/_deprecated/**',
    ],
    
    // ✅ Evita watch/cuelgue accidental
    watch: false,
    
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
      classNameStrategy: 'non-scoped',
    },
  },
});
