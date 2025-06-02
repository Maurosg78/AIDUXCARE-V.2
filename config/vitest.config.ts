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
    setupFiles: ['../src/setupTests.ts'],
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
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: '../coverage',
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/evals/**',
        '**/*.eval.test.ts'
      ]
    }
  }
}); 