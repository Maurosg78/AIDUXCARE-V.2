#!/usr/bin/env node

/**
 * Script para limpiar configuración y reiniciar
 * Uso: node scripts/clean-and-restart.cjs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== LIMPIEZA Y REINICIO COMPLETO ===');

try {
  // 1. Detener todos los procesos de desarrollo
  console.log('1. Deteniendo procesos de desarrollo...');
  try {
    execSync('pkill -f "vite"', { stdio: 'ignore' });
    execSync('pkill -f "node.*dev"', { stdio: 'ignore' });
  } catch (e) {
    console.log('   ✅ Procesos detenidos');
  }

  // 2. Limpiar cache
  console.log('2. Limpiando cache...');
  try {
    execSync('rm -rf node_modules/.vite', { stdio: 'ignore' });
    execSync('rm -rf .vite', { stdio: 'ignore' });
    console.log('   ✅ Cache limpiado');
  } catch (e) {
    console.log('   ✅ Cache ya estaba limpio');
  }

  // 3. Verificar configuración UAT
  console.log('3. Verificando configuración UAT...');
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('aiduxcare-mvp-uat')) {
      console.log('   ✅ Configuración UAT correcta');
    } else {
      console.error('   ❌ ERROR: Configuración incorrecta');
      console.error('   Debe usar aiduxcare-mvp-uat');
      process.exit(1);
    }
  } else {
    console.error('   ❌ ERROR: No existe .env.local');
    process.exit(1);
  }

  // 4. Verificar que no hay procesos en puerto 5174
  console.log('4. Verificando puerto 5174...');
  try {
    const result = execSync('lsof -ti:5174', { stdio: 'pipe' });
    if (result.toString().trim()) {
      console.log('   ⚠️  Puerto 5174 ocupado, matando procesos...');
      execSync('lsof -ti:5174 | xargs kill -9', { stdio: 'ignore' });
    }
  } catch (e) {
    console.log('   ✅ Puerto 5174 libre');
  }

  console.log('✅ LIMPIEZA COMPLETADA');
  console.log('📝 PRÓXIMOS PASOS:');
  console.log('   1. Elimina el usuario de PROD en Firebase Console');
  console.log('   2. Ejecuta: npm run dev');
  console.log('   3. Ve a: http://localhost:5174/register');
  console.log('   4. Registra con tu email institucional');
  console.log('=============================');

} catch (error) {
  console.error('❌ Error durante la limpieza:', error.message);
  process.exit(1);
}
