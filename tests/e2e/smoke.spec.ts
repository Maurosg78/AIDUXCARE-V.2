import { test, expect } from '@playwright/test';

test('E2E Welcome → Login → Dashboard', async ({ page }) => {
  await page.goto('http://localhost:5174/');
  await expect(page.getByRole('img', { name: /aiduxcare/i })).toBeVisible();
  await page.getByRole('button', { name:/seed/i }).click();
  await page.getByRole('link', { name:/login/i }).click();
  await expect(page).toHaveURL(/\/login/);
  // si hay login fake: completa y navega
  // finalmente:
  await page.goto('http://localhost:5174/command-center');
  await expect(page.getByText(/citas|notas|pacientes/i)).toBeVisible();
});
