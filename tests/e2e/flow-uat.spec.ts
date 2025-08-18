import { test, expect } from '@playwright/test';

test.describe('AiDuxCare UAT Flow', () => {
  test('Flujo completo: Login → Command Centre → Dashboard', async ({ page }) => {
    // 1. Abrir página de login
    await page.goto('http://localhost:5174/login');
    await expect(page.getByRole('heading', { name: /bienvenido a aiduxcare/i })).toBeVisible();
    
    // 2. Completar login (usuario de prueba UAT)
    await page.getByLabel('Correo electrónico').fill('test@aiduxcare.com');
    await page.getByLabel('Contraseña').fill('test123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // 3. Verificar redirección a command-center
    await expect(page).toHaveURL(/\/command-center/);
    await expect(page.getByText(/citas|notas|pacientes/i)).toBeVisible();
    
    // 4. Verificar contadores visibles
    await expect(page.getByText(/citas de hoy/i)).toBeVisible();
    await expect(page.getByText(/notas pendientes/i)).toBeVisible();
    await expect(page.getByText(/pacientes activos/i)).toBeVisible();
    
    // 5. Crear paciente
    await page.getByRole('button', { name: /crear paciente/i }).click();
    await expect(page.getByText(/nuevo paciente/i)).toBeVisible();
    
    await page.getByLabel('Nombre').fill('Juan');
    await page.getByLabel('Apellido').fill('Pérez');
    await page.getByLabel('Email').fill('juan.perez@test.com');
    await page.getByRole('button', { name: /guardar/i }).click();
    
    // 6. Verificar que el modal se cierra
    await expect(page.getByText(/nuevo paciente/i)).not.toBeVisible();
    
    // 7. Crear cita
    await page.getByRole('button', { name: /nueva cita/i }).click();
    await expect(page.getByText(/nueva cita/i)).toBeVisible();
    
    await page.getByLabel('Paciente').click();
    await page.getByText('Juan Pérez').click();
    await page.getByLabel('Fecha').fill(new Date().toISOString().split('T')[0]);
    await page.getByLabel('Hora').fill('10:00');
    await page.getByRole('button', { name: /guardar/i }).click();
    
    // 8. Verificar que el modal se cierra
    await expect(page.getByText(/nueva cita/i)).not.toBeVisible();
    
    // 9. Crear nota
    await page.getByRole('button', { name: /notas pendientes/i }).click();
    await expect(page.getByText(/notas pendientes/i)).toBeVisible();
    
    await page.getByRole('button', { name: /nueva nota/i }).click();
    await page.getByLabel('Título').fill('Nota de prueba');
    await page.getByLabel('Contenido').fill('Contenido de la nota de prueba');
    await page.getByRole('button', { name: /guardar/i }).click();
    
    // 10. Verificar que el modal se cierra
    await expect(page.getByText(/nueva nota/i)).not.toBeVisible();
    
    // 11. Cerrar sesión
    await page.getByRole('button', { name: /cerrar sesión/i }).click();
    
    // 12. Verificar redirección a login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /bienvenido a aiduxcare/i })).toBeVisible();
  });
});
