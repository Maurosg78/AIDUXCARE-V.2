/**
 * Script para verificar que las variables de entorno necesarias estén definidas
 * Se ejecuta antes del build para evitar despliegues con configuraciones incompletas
 * ARQUITECTURA: 100% Firebase (Supabase eliminado completamente)
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

// Cargar variables de entorno de .env.local
const envLocalPath = resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log(`📄 Cargando variables desde: ${envLocalPath}`);
  config({ path: envLocalPath });
} else {
  console.log('⚠️ No se encontró archivo .env.local, usando solo variables de sistema');
}

function checkEnvVars() {
  // Validar configuración Firebase
  const firebaseConfig = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
  };

  // Verificar que todas las variables requeridas estén presentes
  const requiredVars = ['VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_API_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno Firebase faltantes:', missingVars);
    process.exit(1);
  }

  // Mostrar solo información no sensible
  console.log('✅ Configuración Firebase validada correctamente.');
  console.log(`   VITE_FIREBASE_PROJECT_ID: ${process.env.VITE_FIREBASE_PROJECT_ID}`);
  console.log('   VITE_FIREBASE_API_KEY: [PROTEGIDO]');
  console.log('   ✅ Sistema preparado para arquitectura Firebase');
}

// Ejecutar la verificación
checkEnvVars();
