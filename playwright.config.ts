import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000, // 60 segundos por test
  expect: {
    timeout: 10000, // 10 segundos para expect
  },
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev:test',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutos para arrancar servidor
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Configuración para CI/CD
  globalSetup: process.env.CI ? undefined : './tests/setup/global-setup.ts',
  globalTeardown: process.env.CI ? undefined : './tests/setup/global-teardown.ts',
});
