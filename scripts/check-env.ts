#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

// Verificar variables críticas
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`⚠️  Variables de entorno faltantes: ${missingVars.join(', ')}`);
  console.warn('El proyecto puede no funcionar correctamente en producción');
} else {
  console.log('✅ Variables de entorno críticas verificadas');
}

// Verificar que estamos en el directorio correcto
if (!process.env.VITE_FIREBASE_PROJECT_ID) {
  console.warn('⚠️  VITE_FIREBASE_PROJECT_ID no encontrado, usando configuración por defecto');
}

console.log('🚀 Verificación de entorno completada');
