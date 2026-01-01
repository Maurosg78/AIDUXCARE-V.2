#!/usr/bin/env node

/**
 * Script para verificar que estamos usando UAT
 * Uso: node scripts/verify-uat.js
 */

const fs = require('fs');
const path = require('path');

console.log('=== VERIFICACIÓN DE CONFIGURACIÓN UAT ===');

// Leer .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ ERROR: No existe .env.local');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

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

console.log('Project ID:', projectId);
console.log('Auth Domain:', authDomain);

if (projectId === 'aiduxcare-mvp-uat' && authDomain === 'aiduxcare-mvp-uat.firebaseapp.com') {
  console.log('✅ CONFIGURACIÓN CORRECTA: Usando UAT');
  console.log('✅ Puedes proceder con el registro');
} else {
  console.error('❌ ERROR: No estás usando UAT!');
  console.error('Project ID debe ser: aiduxcare-mvp-uat');
  console.error('Auth Domain debe ser: aiduxcare-mvp-uat.firebaseapp.com');
  process.exit(1);
}

console.log('=============================');
