import { chromium, FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando setup global para tests E2E...');

  // Crear directorio de datos de emuladores si no existe
  const emulatorDataDir = join(process.cwd(), 'emulator-data');
  if (!existsSync(emulatorDataDir)) {
    mkdirSync(emulatorDataDir, { recursive: true });
  }

  try {
    // Iniciar emuladores Firebase
    console.log('🔥 Iniciando emuladores Firebase...');
    execSync('firebase emulators:start --only auth,firestore,functions --project aiduxcare-v2-uat-dev --import=./emulator-data --export-on-exit=./emulator-data', {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    // Esperar a que los emuladores estén listos
    console.log('⏳ Esperando a que los emuladores estén listos...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Verificar que los emuladores estén funcionando
    console.log('🔍 Verificando emuladores...');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Verificar Firestore
    await page.goto('http://localhost:4001');
    await page.waitForSelector('text=Firebase Emulator Suite', { timeout: 30000 });
    
    console.log('✅ Emuladores Firebase iniciados correctamente');
    await browser.close();

  } catch (error) {
    console.error('❌ Error iniciando emuladores:', error);
    throw error;
  }
}

export default globalSetup;
