import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src")
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/*.eval.test.{js,ts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/temp_backup/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/evals/future_evals/**',
      '**/__tests__/future_evals/**'
    ],
    coverage: {
      reporter: ['text-summary', 'html'],
      reportsDirectory: path.resolve(__dirname, '../coverage'),
      provider: 'v8',
      all: false,
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/__mocks__/**',
        '**/evals/**',
        '**/*.eval.test.ts',
        '**/coverage/**',
        '**/dist/**',
        '**/build/**',
        '**/.vite/**'
      ]
    }
  }
}); 