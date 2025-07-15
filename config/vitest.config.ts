import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src")
    }
  },
  // Configuración de cache optimizada
  cacheDir: path.resolve(__dirname, '../node_modules/.vitest'),
  optimizeDeps: {
    include: ['@testing-library/jest-dom', 'vitest']
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, '../src/setupTests.ts')],
    // Configuración optimizada para performance
    // Parallelización optimizada - ajustado para mejor performance
    maxConcurrency: 2,
    // Timeout optimizado
    testTimeout: 8000,
    // Hook timeout optimizado
    hookTimeout: 3000,
    // Configuración jsdom optimizada
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        runScripts: 'dangerously',
        pretendToBeVisual: false,
        includeNodeLocations: false
      }
    },
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
      reportsDirectory: path.resolve(__dirname, '../coverage'),
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