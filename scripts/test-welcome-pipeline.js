#!/usr/bin/env node

/**
 * 🎯 Script de Testing: Pipeline de Bienvenida AiDuxCare
 * Prueba completa del flujo: Registro → Verificación → Onboarding → Workflow
 */

import { spawn } from 'child_process';

console.log('🎯 Iniciando Test del Pipeline de Bienvenida');
console.log('========================================\n');

// Configuración
const BASE_URL = 'http://localhost:5173';
const EMULATOR_AUTH_URL = 'http://localhost:9099';
const EMULATOR_FIRESTORE_URL = 'http://localhost:8080';

// Datos de testing
const TEST_USER = {
  email: 'mauricio.test@aiduxcare.com',
  password: 'TestAidux2025!',
  name: 'Dr. Mauricio Test',
  profession: 'Fisioterapeuta',
  specialty: 'Fisioterapia Deportiva'
};

console.log('📋 Datos de Test:');
console.log('- Email:', TEST_USER.email);
console.log('- Nombre:', TEST_USER.name);
console.log('- Profesión:', TEST_USER.profession);
console.log('- Especialidad:', TEST_USER.specialty);
console.log('');

// Funciones de testing
async function checkEmulators() {
  console.log('1️⃣ Verificando emuladores Firebase...');
  
  try {
    const authResponse = await fetch(EMULATOR_AUTH_URL);
    const authStatus = authResponse.ok ? '✅ Auth Emulator' : '❌ Auth Emulator';
    
    const firestoreResponse = await fetch(EMULATOR_FIRESTORE_URL);
    const firestoreStatus = firestoreResponse.ok ? '✅ Firestore Emulator' : '❌ Firestore Emulator';
    
    console.log(`   ${authStatus} (puerto 9099)`);
    console.log(`   ${firestoreStatus} (puerto 8080)`);
    
    if (!authResponse.ok || !firestoreResponse.ok) {
      console.log('\n❌ ERROR: Emuladores no están ejecutándose');
      console.log('💡 Ejecuta: firebase emulators:start --only auth,firestore\n');
      process.exit(1);
    }
    
    console.log('   ✅ Emuladores funcionando correctamente\n');
  } catch (error) {
    console.log('   ❌ Error conectando con emuladores:', error.message);
    process.exit(1);
  }
}

async function checkDevServer() {
  console.log('2️⃣ Verificando servidor de desarrollo...');
  
  try {
    const response = await fetch(BASE_URL);
    if (response.ok) {
      console.log('   ✅ Servidor de desarrollo funcionando (puerto 5173)\n');
    } else {
      throw new Error('Servidor no responde');
    }
  } catch (error) {
    console.log('   ❌ ERROR: Servidor de desarrollo no está ejecutándose');
    console.log('💡 Ejecuta: npm run dev\n');
    process.exit(1);
  }
}

function printPipelineSteps() {
  console.log('3️⃣ Pipeline de Testing Manual:');
  console.log('=============================\n');
  
  console.log('🎯 FLUJO COMPLETO:');
  console.log('WelcomePage → Register → VerifyEmail → Onboarding → Workflow\n');
  
  console.log('📋 PASOS A SEGUIR:');
  console.log('');
  
  console.log('PASO 1: Ir a WelcomePage');
  console.log(`🔗 ${BASE_URL}`);
  console.log('   - Debería ver la página de bienvenida con login/registro');
  console.log('');
  
  console.log('PASO 2: Registrar nuevo usuario');
  console.log('   - Hacer clic en "Registrarse"');
  console.log(`   - Email: ${TEST_USER.email}`);
  console.log(`   - Password: ${TEST_USER.password}`);
  console.log(`   - Nombre: ${TEST_USER.name}`);
  console.log('   - Enviar formulario');
  console.log('');
  
  console.log('PASO 3: Verificación de Email (EMULADOR)');
  console.log('   - NO se enviará email real (modo emulador)');
  console.log('   - El usuario se crea directamente como verificado');
  console.log('   - Debería redirigir a /verify-email');
  console.log('');
  
  console.log('PASO 4: Login después de registro');
  console.log('   - Volver a WelcomePage');
  console.log('   - Hacer login con las mismas credenciales');
  console.log('   - Debería redirigir a /professional-onboarding');
  console.log('');
  
  console.log('PASO 5: Completar Onboarding');
  console.log('   - Completar Información Personal');
  console.log('   - Completar Información Profesional');
  console.log('   - Aceptar Compliance y Seguridad');
  console.log('   - Finalizar onboarding');
  console.log('');
  
  console.log('PASO 6: Acceso a Workflow');
  console.log('   - Debería redirigir a /professional-workflow');
  console.log('   - ¡Pipeline completo funcionando!');
  console.log('');
}

function printDebugInfo() {
  console.log('🔧 INFORMACIÓN DE DEBUG:');
  console.log('========================\n');
  
  console.log('📊 URLs de Monitoreo:');
  console.log(`🔗 App Principal: ${BASE_URL}`);
  console.log(`🔗 Auth Emulator: ${EMULATOR_AUTH_URL}`);
  console.log(`🔗 Firestore Emulator: ${EMULATOR_FIRESTORE_URL}`);
  console.log('');
  
  console.log('🐛 Debugging:');
  console.log('- Abrir DevTools del navegador');
  console.log('- Verificar Console para logs de Firebase');
  console.log('- Verificar Network para llamadas a emuladores');
  console.log('- Verificar Application → Storage para datos locales');
  console.log('');
  
  console.log('📝 Datos Esperados en Firestore:');
  console.log('- Colección: users');
  console.log(`- Documento: [uid del usuario]`);
  console.log('- Datos: perfil profesional, onboarding completado');
  console.log('');
  
  console.log('🚨 Posibles Errores:');
  console.log('- "Auth Emulator not connected": Reiniciar emuladores');
  console.log('- "Network request failed": Verificar puertos');
  console.log('- "Email not verified": Es normal en emulador');
  console.log('- Redirección incorrecta: Verificar rutas en router.tsx');
  console.log('');
}

// Función principal
async function main() {
  try {
    await checkEmulators();
    await checkDevServer();
    printPipelineSteps();
    printDebugInfo();
    
    console.log('✅ LISTO PARA TESTING');
    console.log('=====================\n');
    console.log('🎯 Abre tu navegador y sigue los pasos del pipeline');
    console.log(`🔗 Comenzar en: ${BASE_URL}`);
    console.log('');
    console.log('💡 TIP: Mantén las DevTools abiertas para ver logs en tiempo real');
    
  } catch (error) {
    console.error('❌ Error durante el setup:', error);
    process.exit(1);
  }
}

// Ejecutar
main();