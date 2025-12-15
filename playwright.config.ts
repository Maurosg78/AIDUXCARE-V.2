import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  reporter: 'list',
  use: {
    // baseURL será configurado por el workflow o variable de entorno
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5174',
  },
  // Solo usar webServer si no hay un servidor externo corriendo (local dev)
  webServer: process.env.CI ? undefined : {
    command: 'pnpm dev',
    port: 5174,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
