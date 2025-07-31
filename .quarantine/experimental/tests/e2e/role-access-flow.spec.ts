import { test, expect } from '@playwright/test';

const users = [
  { email: 'testuser_owner_1753399027836@example.com', password: 'TestUser2025!', role: 'OWNER', dashboard: /professional-workflow/ },
  { email: 'testuser_physician_1753399034162@example.com', password: 'TestUser2025!', role: 'PHYSICIAN', dashboard: /professional-workflow/ },
  { email: 'testuser_admin_1753399033331@example.com', password: 'TestUser2025!', role: 'ADMIN', dashboard: /admin/ },
  { email: 'testuser_nurse_1753399038838@example.com', password: 'TestUser2025!', role: 'NURSE', dashboard: /professional-workflow/ },
  { email: 'testuser_receptionist_1753399033529@example.com', password: 'TestUser2025!', role: 'RECEPTIONIST', dashboard: /professional-workflow/ },
  { email: 'testuser_psychologist_1753399036185@example.com', password: 'TestUser2025!', role: 'PSYCHOLOGIST', dashboard: /professional-workflow/ },
  { email: 'testuser_dermatologist_1753399035115@example.com', password: 'TestUser2025!', role: 'DERMATOLOGIST', dashboard: /professional-workflow/ },
];

test.describe('E2E: Acceso y protección de rutas por rol', () => {
  for (const user of users) {
    test(`Login y acceso correcto para rol ${user.role}`, async ({ page }) => {
      await page.goto('http://localhost:5174/login');
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(user.dashboard);
      await expect(page.url()).toMatch(user.dashboard);
    });
  }
}); 