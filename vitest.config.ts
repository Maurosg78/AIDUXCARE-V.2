import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['vitest.setup.ts'],
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.quarantine',
      'legacy',
      'QUARANTINE_*',
      'src/**/*.test.{js,ts,jsx,tsx}',
      'src/**/*.spec.{js,ts,jsx,tsx}',
      'tests/**/*',
      '__tests__/**/*'
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
