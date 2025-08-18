import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';

async function globalTeardown(config: FullConfig) {
  console.log('🛑 Ejecutando teardown global...');

  try {
    // Detener emuladores Firebase
    console.log('🔥 Deteniendo emuladores Firebase...');
    execSync('pkill -f "firebase emulators"', { stdio: 'pipe' });
    
    // Esperar un momento para asegurar que se detengan
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Emuladores Firebase detenidos correctamente');

  } catch (error) {
    console.warn('⚠️ Advertencia al detener emuladores:', error);
    // No fallar el teardown por errores menores
  }
}

export default globalTeardown;
