#!/usr/bin/env node

/**
 * Script de verificación profunda para UAT
 * Uso: node scripts/deep-verify.cjs
 */

const fs = require('fs');
const path = require('path');

console.log('=== VERIFICACIÓN PROFUNDA UAT ===');

// 1. Verificar archivos de entorno
console.log('1. Verificando archivos de entorno...');
const envFiles = [
  '.env.local',
  '.env',
  '.env.local.example'
];

for (const file of envFiles) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('aiduxcare-mvp-uat')) {
      console.log(`   ✅ ${file}: Configurado para UAT`);
    } else if (content.includes('aiduxcare-mvp-prod')) {
      console.error(`   ❌ ${file}: Configurado para PROD`);
    } else {
      console.log(`   ⚠️  ${file}: No especifica proyecto`);
    }
  } else {
    console.log(`   ⚠️  ${file}: No existe`);
  }
}

// 2. Verificar directorio quarantine
console.log('\n2. Verificando archivos en cuarentena...');
const quarantinePath = './quarantine';
if (fs.existsSync(quarantinePath)) {
  const files = fs.readdirSync(quarantinePath);
  console.log(`   📁 Archivos en cuarentena: ${files.length}`);
  for (const file of files) {
    console.log(`      - ${file}`);
  }
} else {
  console.log('   ✅ No hay directorio de cuarentena');
}

// 3. Verificar configuración actual
console.log('\n3. Verificando configuración actual...');
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const lines = content.split('\n');
  
  let projectId = null;
  let authDomain = null;
  
  for (const line of lines) {
    if (line.startsWith('VITE_FIREBASE_PROJECT_ID=')) {
      projectId = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_FIREBASE_AUTH_DOMAIN=')) {
      authDomain = line.split('=')[1].trim();
    }
  }
  
  console.log(`   Project ID: ${projectId}`);
  console.log(`   Auth Domain: ${authDomain}`);
  
  if (projectId === 'aiduxcare-mvp-uat' && authDomain === 'aiduxcare-mvp-uat.firebaseapp.com') {
    console.log('   ✅ CONFIGURACIÓN CORRECTA');
  } else {
    console.error('   ❌ CONFIGURACIÓN INCORRECTA');
    process.exit(1);
  }
} else {
  console.error('   ❌ No existe .env.local');
  process.exit(1);
}

// 4. Verificar que no hay procesos de desarrollo corriendo
console.log('\n4. Verificando procesos de desarrollo...');
try {
  const { execSync } = require('child_process');
  const result = execSync('ps aux | grep vite | grep -v grep', { stdio: 'pipe' });
  if (result.toString().trim()) {
    console.log('   ⚠️  Hay procesos de Vite corriendo:');
    console.log(result.toString());
  } else {
    console.log('   ✅ No hay procesos de Vite corriendo');
  }
} catch (e) {
  console.log('   ✅ No hay procesos de Vite corriendo');
}

console.log('\n✅ VERIFICACIÓN COMPLETADA');
console.log('📝 PRÓXIMOS PASOS:');
console.log('   1. Ejecuta: npm run dev');
console.log('   2. Ve a: http://localhost:5174/register');
console.log('   3. Verifica en consola que aparece UAT');
console.log('=============================');
