import { test, expect } from '@playwright/test';

test.describe('AiDuxCare E2E - WelcomePage Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5175/');
  });

  test('WelcomePage institucional se carga correctamente', async ({ page }) => {
    // Verificar que estamos en la ruta raíz
    await expect(page).toHaveURL('http://localhost:5175/');
    
    // Verificar elementos de la WelcomePage institucional
    await expect(page.locator('h1')).toContainText('Bienvenido a AiDuxCare');
    await expect(page.locator('img[alt="AiDuxCare Logo"]')).toBeVisible();
    await expect(page.locator('button:has-text("Crear Datos de Prueba")')).toBeVisible();
    await expect(page.locator('button:has-text("Iniciar Sesión")')).toBeVisible();
    
    // Verificar características principales
    await expect(page.locator('text=Seguridad Total')).toBeVisible();
    await expect(page.locator('text=IA Avanzada')).toBeVisible();
    await expect(page.locator('text=Eficiencia')).toBeVisible();
  });

  test('Botón de seed funciona correctamente', async ({ page }) => {
    // Hacer clic en el botón de seed
    await page.click('button:has-text("Crear Datos de Prueba")');
    
    // Verificar que el proceso de seed comience
    await expect(page.locator('text=Creando datos de prueba...')).toBeVisible({ timeout: 10000 });
    
    // Esperar a que se complete el seed
    await expect(page.locator('text=Datos de prueba creados exitosamente!')).toBeVisible({ timeout: 30000 });
    
    // Verificar redirección al Command Centre
    await expect(page).toHaveURL('http://localhost:5175/command-center');
  });

  test('Navegación a login funciona', async ({ page }) => {
    // Hacer clic en el botón de login
    await page.click('button:has-text("Iniciar Sesión")');
    
    // Verificar redirección a página de login
    await expect(page).toHaveURL('http://localhost:5175/login');
    
    // Verificar que se muestre el formulario de login
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Flujo completo: WelcomePage → Seed → Command Centre', async ({ page }) => {
    // 1. Verificar WelcomePage
    await expect(page.locator('h1')).toContainText('Bienvenido a AiDuxCare');
    
    // 2. Crear datos de prueba
    await page.click('button:has-text("Crear Datos de Prueba")');
    await expect(page.locator('text=Datos de prueba creados exitosamente!')).toBeVisible({ timeout: 30000 });
    
    // 3. Verificar redirección al Command Centre
    await expect(page).toHaveURL('http://localhost:5175/command-center');
    
    // 4. Verificar elementos del Command Centre
    await expect(page.locator('h1')).toContainText('Centro de Mando');
    await expect(page.locator('text=Dr. Test Clinician')).toBeVisible();
    
    console.log('✅ Test E2E completado exitosamente');
  });
});
