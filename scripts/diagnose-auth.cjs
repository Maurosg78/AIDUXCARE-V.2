/**
 * Script de diagnóstico para Firebase Authentication
 * Verifica configuración y estado de autenticación
 */

const { config } = require('dotenv');
const { resolve } = require('path');
const fs = require('fs');

// Cargar variables de entorno
const envLocalPath = resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  config({ path: envLocalPath });
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

console.log('🔍 DIAGNÓSTICO DE FIREBASE AUTH');
console.log('================================\n');

console.log('📋 Configuración Firebase:');
console.log(`   Project ID: ${firebaseConfig.projectId}`);
console.log(`   Auth Domain: ${firebaseConfig.authDomain}`);
console.log(`   API Key: ${firebaseConfig.apiKey ? '[CONFIGURADO]' : '❌ FALTANTE'}\n`);

// Verificar que todas las variables estén presentes
const missingVars = [];
if (!firebaseConfig.apiKey) missingVars.push('VITE_FIREBASE_API_KEY');
if (!firebaseConfig.authDomain) missingVars.push('VITE_FIREBASE_AUTH_DOMAIN');
if (!firebaseConfig.projectId) missingVars.push('VITE_FIREBASE_PROJECT_ID');

if (missingVars.length > 0) {
  console.error('❌ Variables faltantes:', missingVars.join(', '));
  process.exit(1);
}

console.log('✅ Todas las variables de entorno están configuradas\n');

// Verificar URL de autenticación
const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`;
console.log('🔗 URL de autenticación:');
console.log(`   ${authUrl.substring(0, 80)}...\n`);

// Verificar que el proyecto sea UAT
if (!firebaseConfig.projectId.includes('uat')) {
  console.warn('⚠️ ADVERTENCIA: El proyecto no parece ser UAT');
  console.warn(`   Proyecto actual: ${firebaseConfig.projectId}`);
  console.warn('   Se recomienda usar un proyecto UAT para desarrollo\n');
}

console.log('📝 PRÓXIMOS PASOS:');
console.log('   1. Verifica que el usuario existe en Firebase Console:');
console.log(`      https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/users`);
console.log('   2. Verifica que la contraseña sea correcta');
console.log('   3. Si el usuario no existe, créalo en Firebase Console o regístrate');
console.log('   4. Si el usuario existe pero no puede iniciar sesión, verifica:');
console.log('      - Que el email esté verificado');
console.log('      - Que la contraseña sea correcta');
console.log('      - Que el usuario no esté deshabilitado\n');

console.log('✅ Diagnóstico completado');

