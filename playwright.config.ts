import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  reporter: 'list',
  use: {
    // baseURL será configurado por el workflow o variable de entorno
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5174',
  },
  webServer: {
    // Solo se usa si PLAYWRIGHT_BASE_URL no está configurado
    command: process.env.CI ? undefined : 'pnpm dev',
    port: 5174,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
