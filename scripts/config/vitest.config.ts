import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./config/jest.setup.cjs'],
    globals: true,
    include: [
      '__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'scripts/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/__tests__/_archive/**',
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      '@components': resolve(__dirname, '../src/components'),
      '@pages': resolve(__dirname, '../src/pages'),
      '@contexts': resolve(__dirname, '../src/contexts'),
      '@services': resolve(__dirname, '../src/services'),
      '@types': resolve(__dirname, '../src/types'),
      '@utils': resolve(__dirname, '../src/utils'),
    },
  },
}); 