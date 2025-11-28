import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// Aidux North — Stability Patch v3.0 (DEFINITIVE)
// Vitest watch exclusions to prevent interference with Vite dev server
const IGNORED = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.git/**',
  '**/.idea/**',
  '**/.vscode/**',
  '**/canonical_snapshots/**',
  '**/docs/**',
  '**/backups/**',
  '**/_deprecated/**',
  '**/*.bak',
  '**/*.backup',
  '**/*.orig',
  '**/*.rej',
  '**/*.tmp',
];

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    watchExclude: IGNORED,
    globals: true,
    environment: 'jsdom',
  },
});
