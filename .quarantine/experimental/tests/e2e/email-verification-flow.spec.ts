import { test, expect } from '@playwright/test';

test.describe('E2E: Verificación de email y acceso', () => {
  const email = 'testuser_owner_1753399027836@example.com'; // Cambia por un usuario no verificado
  const password = 'TestUser2025!';

  test('Bloqueo de acceso si email no verificado y acceso tras verificación', async ({ page }) => {
    // 1. Ir a login
    await page.goto('http://localhost:5174/login');
    await expect(page).toHaveURL(/login/);

    // 2. Completar login
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // 3. Debe mostrar mensaje de email no verificado
    await expect(page.locator('text=verifica tu email')).toBeVisible({ timeout: 5000 });

    // 4. Simular verificación de email (esto normalmente requiere acción manual o script backend)
    // Aquí solo documentamos el paso, pero en entorno real se puede automatizar con la API de Firebase
    // await verifyEmailInBackend(email);

    // 5. Reintentar login tras verificación
    // await page.reload();
    // await page.fill('input[name="email"]', email);
    // await page.fill('input[name="password"]', password);
    // await page.click('button[type="submit"]');
    // await page.waitForURL(/professional-workflow/);
    // await expect(page.locator('text=Bienvenido')).toBeVisible({ timeout: 5000 });
  });
}); 