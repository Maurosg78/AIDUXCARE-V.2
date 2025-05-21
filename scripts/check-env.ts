/**
 * Script para verificar que las variables de entorno necesarias estén definidas
 * Se ejecuta antes del build para evitar despliegues con configuraciones incompletas
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
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
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
    console.error('\n❌ ERROR: Faltan variables de entorno requeridas:');
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

  // Verificar si las URLs de Supabase son válidas
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      new URL(supabaseUrl);
    } catch (e) {
      console.error('\n❌ ERROR: La URL de Supabase no es válida:');
      console.error(`   ${supabaseUrl}`);
      console.error('\nDebe ser una URL completa, incluyendo https://\n');
      process.exit(1);
    }
}

  // Verificar si las claves tienen un formato razonable
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (supabaseKey && supabaseKey.length < 20) {
    console.warn('\n⚠️ ADVERTENCIA: La clave de Supabase parece demasiado corta.');
    console.warn('Verifica que sea la clave correcta.');
  }

  // Todo está bien
  console.log('\n✅ Todas las variables de entorno requeridas están configuradas correctamente.');
  console.log(`   VITE_SUPABASE_URL: ${supabaseUrl}`);
  
  // No mostrar la clave completa por seguridad
  if (supabaseKey) {
    const maskedKey = supabaseKey.substring(0, 5) + '...' + 
      supabaseKey.substring(supabaseKey.length - 5);
    console.log(`   VITE_SUPABASE_ANON_KEY: ${maskedKey}`);
  }
  
  console.log('\n');
}

// Ejecutar la verificación
checkEnvVars(); 