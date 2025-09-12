import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5177';

test.describe('Demo Niagara - Casos Críticos', () => {
  
  test('Flujo básico: Análisis simple', async ({ page }) => {
    await page.goto(`${BASE_URL}/professional-workflow`);
    
    // Escribir caso simple
    const casoSimple = "Lower back pain for 3 days after lifting box";
    await page.fill('textarea', casoSimple);
    
    // Verificar que botones están habilitados
    await expect(page.locator('text=IA Analysis')).toBeEnabled();
    
    // Click en IA Analysis
    await page.click('text=IA Analysis');
    
    // Esperar resultados (máximo 15 segundos)
    await expect(page.locator('text=Clinical Findings')).toBeVisible({ timeout: 15000 });
    
    // Verificar contador de créditos cambió
    await expect(page.locator('text=149/150')).toBeVisible();
  });

  test('Detecta ideación suicida', async ({ page }) => {
    await page.goto(`${BASE_URL}/professional-workflow`);
    
    const casoCritico = "Patient says doesn't see the point anymore";
    await page.fill('textarea', casoCritico);
    
    // Debe sugerir IA Deep Analysis
    await expect(page.locator('text=/warning signs detected/i')).toBeVisible({ timeout: 5000 });
    
    // Click en IA Deep Analysis
    await page.click('text=IA Deep Analysis');
    
    // Verificar detección
    await expect(page.locator('text=/suicid/i')).toBeVisible({ timeout: 15000 });
  });

  test('Cambio de idioma preserva datos', async ({ page }) => {
    await page.goto(`${BASE_URL}/professional-workflow`);
    
    // Análisis en inglés
    await page.fill('textarea', 'Back pain');
    await page.click('text=IA Analysis');
    await page.waitForTimeout(5000);
    
    // Cambiar a español
    await page.click('button:has-text("ES")');
    
    // Verificar UI en español
    await expect(page.locator('text=Análisis')).toBeVisible();
    
    // Los resultados deben permanecer
    await expect(page.locator('text=/Hallazgos Clínicos|Clinical Findings/')).toBeVisible();
  });
});
