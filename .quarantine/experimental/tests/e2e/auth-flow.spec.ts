import { test, expect } from '@playwright/test';

test.describe('Pipeline E2E: Login y Registro', () => {
  const email = 'testuser_owner_1753399027836@example.com';
  const password = 'TestUser2025!';

  test('Login exitoso y acceso a dashboard profesional', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await expect(page).toHaveURL(/login/);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/professional-workflow/);
    await expect(page.locator('text=AiDuxCare')).toBeVisible();
  });

  test('Registro de nuevo usuario y onboarding', async ({ page }) => {
    const newEmail = `testuser_reg_${Date.now()}@example.com`;
    await page.goto('http://localhost:5174/register');
    await expect(page).toHaveURL(/register/);
    await page.fill('input[name="email"]', newEmail);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="especializacion"]', 'Fisioterapia');
    await page.click('button[type="submit"]');
    // Esperar mensaje de verificación de email o redirección
    await expect(page.locator('text=verifica tu email')).toBeVisible({ timeout: 10000 });
  });

  test('Login con error de credenciales', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[name="email"]', 'usuario_inexistente@example.com');
    await page.fill('input[name="password"]', 'claveIncorrecta123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Credenciales incorrectas')).toBeVisible();
  });
}); 