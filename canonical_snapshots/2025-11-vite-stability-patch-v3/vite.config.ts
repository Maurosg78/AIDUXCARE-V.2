import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// Aidux North — Stability Patch v3.0 (DEFINITIVE)
// Comprehensive watch exclusions to prevent HMR loops
// This eliminates ALL test, snapshot, fixture, and deprecated file watching
const ignoredWatchGlobs = [
  '**/node_modules/**',
  '**/dist/**',
  '**/coverage/**',
  '**/backups/**',
  '**/canonical_snapshots/**',
  '**/docs/**',
  '**/.git/**',
  '**/playwright-report/**',
  '**/test-results/**',
  '**/*.bak',
  '**/*.backup',
  '**/*.backup.*',
  '**/*.orig',
  '**/*.rej',
  '**/*.tmp',
  // TESTS & SNAPSHOTS — CRITICAL: This is what's causing the reloads
  '**/__tests__/**',
  '**/__test__/**',
  '**/test/**',
  '**/tests/**',
  '**/snapshots/**',
  '**/__snapshots__/**',
  '**/__fixtures__/**',
  '**/fixtures/**',
  '**/src/**/__tests__/**',
  '**/src/**/__test__/**',
  '**/src/**/__fixtures__/**',
  '**/src/**/__snapshots__/**',
  '**/src/**/?(*.)+(spec|test).[tj]s?(x)',
  '**/src/**/?(*.)+(spec|test).[tj]s?(x)?',
  // Deprecated code that shouldn't trigger reloads
  '**/_deprecated/**',
  '**/src/_deprecated/**',
  // Config files that trigger unnecessary reloads
  '**/tailwind.config.*',
  '**/postcss.config.*',
  '**/tsconfig*.json',
  '**/.eslintrc*',
  '**/.prettierrc*',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  // Additional stability patterns
  '**/.vite/**',
  '**/.cache/**',
  '**/.idea/**',
  '**/.vscode/**',
];

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    watch: {
      ignored: ignoredWatchGlobs,
      usePolling: false,
      followSymlinks: false,
      interval: 1000,
      binaryInterval: 3000,
    },
    hmr: {
      overlay: true,
      clientPort: 5173,
    },
    fs: {
      strict: true,
      allow: ['.'],
    },
  },
  optimizeDeps: {
    entries: ['src/main.tsx'],
    exclude: ['@vite/client', '@vite/env'],
  },
  // Prevent CSS from triggering full reloads
  css: {
    devSourcemap: false,
  },
});
