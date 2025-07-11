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
  // Variables críticas de Firebase para funcionamiento básico
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missingVars: string[] = [];

  // Verificar cada variable requerida
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Si hay variables faltantes, mostrar error y terminar el proceso
  if (missingVars.length > 0) {
    console.error('\n❌ ERROR: Faltan variables de entorno requeridas para Firebase:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPara solucionar este error:');
    console.error('1. Crea un archivo .env.local con estas variables, o');
    console.error('2. Configura estas variables en el panel de Vercel');
    console.error('\nNo se puede continuar sin estas variables.\n');
    
    // Terminar el proceso con código de error
    process.exit(1);
  }

  // Verificar formato básico de las claves de Firebase
  const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY;
  if (firebaseApiKey && firebaseApiKey.length < 20) {
    console.warn('\n⚠️ ADVERTENCIA: La API Key de Firebase parece demasiado corta.');
    console.warn('Verifica que sea la clave correcta.');
  }

  // Todo está bien - Configuración Firebase validada
  console.log('\n✅ Configuración Firebase validada correctamente.');
  console.log(`   VITE_FIREBASE_PROJECT_ID: ${process.env.VITE_FIREBASE_PROJECT_ID}`);
  
  // Mostrar API key parcialmente por seguridad
  if (firebaseApiKey) {
    const maskedKey = firebaseApiKey.substring(0, 8) + '...' + 
      firebaseApiKey.substring(firebaseApiKey.length - 8);
    console.log(`   VITE_FIREBASE_API_KEY: ${maskedKey}`);
  }
  
  console.log('   ✅ Sistema preparado para arquitectura Firebase\n');
}

// Ejecutar la verificación
checkEnvVars();
