import { test, expect } from '@playwright/test';

test.describe('AiDuxCare E2E - Command Centre Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Ir a la página principal
    await page.goto('http://localhost:5174/');
  });

  test('Flujo completo: Login → Command Centre → Crear Cita → Agenda', async ({ page }) => {
    // 1. VERIFICAR PÁGINA PRINCIPAL
    await expect(page.locator('h1')).toContainText('Bienvenido a AiDuxCare');
    await expect(page.locator('button:has-text("🌱 Crear Datos de Prueba")')).toBeVisible();

    // 2. CREAR DATOS DE PRUEBA
    await page.click('button:has-text("🌱 Crear Datos de Prueba")');
    
    // Esperar a que se complete el seed
    await expect(page.locator('text=🎉 Datos de prueba creados exitosamente!')).toBeVisible({ timeout: 30000 });
    
    // 3. VERIFICAR REDIRECCIÓN A VERIFY-EMAIL
    await expect(page.locator('h1')).toContainText('Verificar Email');
    await expect(page.locator('button:has-text("🧪 Saltar Verificación (Solo Desarrollo)")')).toBeVisible();
    
    // 4. SALTAR VERIFICACIÓN
    await page.click('button:has-text("🧪 Saltar Verificación (Solo Desarrollo)")');
    
    // 5. VERIFICAR COMMAND CENTRE
    await expect(page.locator('h1')).toContainText('Centro de Mando');
    await expect(page.locator('text=Dr. Test Clinician')).toBeVisible();
    
    // Verificar las 4 tarjetas principales
    await expect(page.locator('text=Mis Citas de Hoy')).toBeVisible();
    await expect(page.locator('text=Nueva cita')).toBeVisible();
    await expect(page.locator('text=Notas pendientes')).toBeVisible();
    await expect(page.locator('text=Registrar un nuevo paciente')).toBeVisible();
    
    // 6. PROBAR MODAL NUEVA CITA
    await page.click('text=Nueva cita');
    await expect(page.locator('h2:has-text("Nueva cita")')).toBeVisible();
    
    // Verificar que el paciente esté seleccionado
    await expect(page.locator('text=Juan Pérez')).toBeVisible();
    
    // Verificar campos del modal
    await expect(page.locator('label:has-text("Fecha y hora")')).toBeVisible();
    await expect(page.locator('label:has-text("Duración (min)")')).toBeVisible();
    await expect(page.locator('label:has-text("Notas (opcional)")')).toBeVisible();
    
    // 7. CREAR CITA
    await page.click('button:has-text("Crear cita")');
    
    // Verificar que el modal se cierre
    await expect(page.locator('h2:has-text("Nueva cita")')).not.toBeVisible();
    
    // 8. IR A LA AGENDA
    await page.click('text=Mis Citas de Hoy');
    
    // 9. VERIFICAR AGENDA SEMANAL
    await expect(page.locator('text=Agenda Semanal')).toBeVisible();
    await expect(page.locator('text=Semana anterior')).toBeVisible();
    await expect(page.locator('text=Siguiente semana')).toBeVisible();
    
    // Verificar que la cita aparezca en la agenda
    await expect(page.locator('text=Juan Pérez')).toBeVisible();
    
    // 10. VERIFICAR CONTADORES
    await expect(page.locator('text=Notas pendientes0')).toBeVisible();
    
    console.log('✅ E2E Test completado exitosamente');
  });

  test('Verificar funcionalidad de modales', async ({ page }) => {
    // Ir directamente al Command Centre (asumiendo que ya está autenticado)
    await page.goto('http://localhost:5174/command-center');
    
    // Probar modal de notas pendientes
    await page.click('text=Notas pendientes');
    await expect(page.locator('text=Notas Pendientes')).toBeVisible();
    await page.click('button:has-text("Cerrar")');
    
    // Probar modal de crear paciente
    await page.click('text=Registrar un nuevo paciente');
    await expect(page.locator('text=Registrar Nuevo Paciente')).toBeVisible();
    await page.click('button:has-text("Cerrar")');
    
    console.log('✅ Tests de modales completados');
  });

  test('Verificar navegación de agenda', async ({ page }) => {
    // Ir a la página de citas
    await page.goto('http://localhost:5174/appointments');
    
    // Verificar agenda semanal
    await expect(page.locator('text=Agenda Semanal')).toBeVisible();
    
    // Navegar a semana anterior
    await page.click('text=Semana anterior');
    await expect(page.locator('text=Agenda Semanal')).toBeVisible();
    
    // Navegar a semana siguiente
    await page.click('text=Siguiente semana');
    await expect(page.locator('text=Agenda Semanal')).toBeVisible();
    
    console.log('✅ Tests de navegación de agenda completados');
  });
});
