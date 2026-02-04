/**
 * Script para verificar que las variables de entorno necesarias estén definidas
 * Versión CommonJS para evitar problemas con tsx
 */
const { config } = require('dotenv');
const { resolve } = require('path');
const fs = require('fs');

// Cargar variables de entorno: .env.local primero, luego .env (VPS / deploy suelen usar .env)
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');
if (fs.existsSync(envLocalPath)) {
  console.log(`📄 Cargando variables desde: ${envLocalPath}`);
  config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log(`📄 Cargando variables desde: ${envPath}`);
  config({ path: envPath });
} else {
  console.log('⚠️ No se encontró .env.local ni .env, usando solo variables de sistema');
}

function checkEnvVars() {
  // Verificar que todas las variables requeridas estén presentes
  const requiredVars = ['VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_API_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    // En CI no tenemos secretos/vars locales: no debe bloquear el pipeline.
    if (process.env.CI) {
      console.warn('⚠️ CI: Variables de entorno Firebase faltantes (no bloqueante):', missingVars);
      return;
    }
    console.error('❌ Variables de entorno Firebase faltantes:', missingVars);
    process.exit(1);
  }

  // Mostrar solo información no sensible
  console.log('✅ Configuración Firebase validada correctamente.');
  console.log(`   VITE_FIREBASE_PROJECT_ID: ${process.env.VITE_FIREBASE_PROJECT_ID}`);
  console.log('   VITE_FIREBASE_API_KEY: [PROTEGIDO]');
  console.log('   ✅ Sistema preparado para arquitectura Firebase');
}

// Ejecutar la verificación y salir inmediatamente
try {
  checkEnvVars();
  process.exit(0);
} catch (error) {
  console.error('❌ Error en verificación de entorno:', error);
  process.exit(1);
}

