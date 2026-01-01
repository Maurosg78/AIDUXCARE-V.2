import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['test/setupTests.ts'],
    clearMocks: true,
    restoreMocks: true,
    include: ['test/**/*.{test,spec}.{ts,tsx}'],
  },
});
