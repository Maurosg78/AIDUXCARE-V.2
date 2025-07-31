import { test, expect } from '@playwright/test';
import fetch from 'node-fetch';

test.describe('E2E: Auditoría de logs en Firestore', () => {
  const email = 'testuser_owner_1753399027836@example.com';
  const password = 'TestUser2025!';

  test('Login exitoso y registro de evento en Firestore', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/professional-workflow/);
    // Esperar a que el evento se registre
    await page.waitForTimeout(1000);
    // Consultar logs de auditoría (ajusta la URL según tu API o script)
    const res = await fetch('http://localhost:5001/audit-logs?type=login_success&email=' + email);
    const logs = await res.json();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].type).toBe('login_success');
  });

  test('Intento de acceso denegado queda registrado', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/professional-workflow/);
    await page.goto('http://localhost:5174/admin');
    await page.waitForTimeout(1000);
    const res = await fetch('http://localhost:5001/audit-logs?type=access_denied&email=' + email);
    const logs = await res.json();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].type).toBe('access_denied');
  });
}); 