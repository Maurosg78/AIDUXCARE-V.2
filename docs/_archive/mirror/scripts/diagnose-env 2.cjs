#!/usr/bin/env node

/**
 * Script para diagnosticar variables de entorno
 * Uso: node scripts/diagnose-env.cjs
 */

const fs = require('fs');
const path = require('path');

console.log('=== DIAGNÓSTICO DE VARIABLES DE ENTORNO ===');

// 1. Verificar archivo .env.local
console.log('1. Verificando .env.local...');
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const lines = content.split('\n');
  
  console.log('   Contenido de .env.local:');
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#')) {
      if (line.includes('VITE_FIREBASE_PROJECT_ID')) {
        console.log(`   ✅ ${line}`);
      } else if (line.includes('VITE_FIREBASE_AUTH_DOMAIN')) {
        console.log(`   ✅ ${line}`);
      } else if (line.includes('VITE_FIREBASE_API_KEY')) {
        console.log(`   ✅ ${line.substring(0, 30)}...`);
      } else {
        console.log(`   📝 ${line}`);
      }
    }
  }
} else {
  console.error('   ❌ No existe .env.local');
}

// 2. Verificar si hay otros archivos de entorno
console.log('\n2. Verificando otros archivos de entorno...');
const envFiles = ['.env', '.env.local.example'];
for (const file of envFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('aiduxcare-mvp-prod')) {
      console.error(`   ❌ ${file} contiene PROD`);
    } else if (content.includes('aiduxcare-mvp-uat')) {
      console.log(`   ✅ ${file} contiene UAT`);
    } else {
      console.log(`   ⚠️  ${file} no especifica proyecto`);
    }
  }
}

// 3. Verificar directorio quarantine
console.log('\n3. Verificando archivos en cuarentena...');
const quarantinePath = path.join(__dirname, '..', 'quarantine');
if (fs.existsSync(quarantinePath)) {
  const files = fs.readdirSync(quarantinePath);
  for (const file of files) {
    const filePath = path.join(quarantinePath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('aiduxcare-mvp-prod')) {
      console.log(`   📁 ${file}: PROD (en cuarentena)`);
    }
  }
}

console.log('\n✅ DIAGNÓSTICO COMPLETADO');
console.log('📝 PRÓXIMOS PASOS:');
console.log('   1. Recarga la página en el navegador');
console.log('   2. Verifica en consola los logs de DEBUGGING FIREBASE CONFIG');
console.log('   3. Si las variables están vacías, hay un problema de carga');
console.log('=============================');
