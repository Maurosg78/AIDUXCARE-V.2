#!/usr/bin/env node

/**
 * @fileoverview Script para cambiar entre entornos Firebase
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

const fs = require('fs');
const path = require('path');

const ENV_EXAMPLE_PATH = path.join(__dirname, '..', 'env.example');
const ENV_PATH = path.join(__dirname, '..', '.env');
const ENV_LOCAL_PATH = path.join(__dirname, '..', '.env.local');

/**
 * Extrae variables de entorno de un archivo
 * @param {string} filePath - Ruta del archivo
 * @param {string} prefix - Prefijo para filtrar variables
 * @returns {Object} Variables de entorno
 */
function extractEnvVariables(filePath, prefix = 'VITE_') {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const variables = {};

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      
      if (key.startsWith(prefix)) {
        variables[key] = value;
      }
    }
  });

  return variables;
}

/**
 * Genera contenido de archivo .env
 * @param {Object} variables - Variables de entorno
 * @param {string} environment - Entorno (uat/prod)
 * @returns {string} Contenido del archivo
 */
function generateEnvContent(variables, environment) {
  const header = `# ========================================
# AiDuxCare V.2 - ${environment.toUpperCase()}
# ========================================
# Generado automáticamente por switch-env.js
# Fecha: ${new Date().toISOString()}
# ========================================

`;

  const content = Object.entries(variables)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  return header + content;
}

/**
 * Cambia al entorno especificado
 * @param {string} environment - Entorno (uat/prod)
 */
function switchEnvironment(environment) {
  console.log(`🔄 Cambiando a entorno: ${environment.toUpperCase()}`);

  // Leer variables del archivo de ejemplo
  const allVariables = extractEnvVariables(ENV_EXAMPLE_PATH);
  
  if (Object.keys(allVariables).length === 0) {
    console.error('❌ No se encontraron variables en env.example');
    process.exit(1);
  }

  // Filtrar variables según el entorno
  const targetVariables = {};
  
  Object.entries(allVariables).forEach(([key, value]) => {
    if (environment === 'uat') {
      // Para UAT, usar valores sin comentar
      if (!value.startsWith('#')) {
        targetVariables[key] = value;
      }
    } else if (environment === 'prod') {
      // Para PROD, usar valores comentados (descomentados)
      if (value.startsWith('#')) {
        // Extraer valor de comentario
        const prodValue = value.substring(1).trim();
        if (prodValue.includes('=')) {
          const [prodKey, ...prodValueParts] = prodValue.split('=');
          if (prodKey === key) {
            targetVariables[key] = prodValueParts.join('=');
          }
        }
      }
    }
  });

  // Generar contenido del archivo
  const envContent = generateEnvContent(targetVariables, environment);
  
  // Escribir archivo .env
  fs.writeFileSync(ENV_PATH, envContent);
  
  console.log(`✅ Entorno ${environment.toUpperCase()} configurado en .env`);
  console.log(`📊 Variables configuradas: ${Object.keys(targetVariables).length}`);
  
  // Mostrar configuración actual
  const currentProject = targetVariables.VITE_FIREBASE_PROJECT_ID || 'No configurado';
  console.log(`🏗️  Proyecto Firebase: ${currentProject}`);
}

/**
 * Muestra el estado actual
 */
function showStatus() {
  console.log('📊 Estado actual de entornos:');
  
  const envExists = fs.existsSync(ENV_PATH);
  const envLocalExists = fs.existsSync(ENV_LOCAL_PATH);
  
  if (envExists) {
    const envVars = extractEnvVariables(ENV_PATH);
    const projectId = envVars.VITE_FIREBASE_PROJECT_ID || 'No configurado';
    console.log(`  📁 .env: ${projectId}`);
  } else {
    console.log('  📁 .env: No existe');
  }
  
  if (envLocalExists) {
    const envLocalVars = extractEnvVariables(ENV_LOCAL_PATH);
    const projectId = envLocalVars.VITE_FIREBASE_PROJECT_ID || 'No configurado';
    console.log(`  📁 .env.local: ${projectId}`);
  } else {
    console.log('  📁 .env.local: No existe');
  }
}

// Manejo de argumentos
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log('🔄 Script de cambio de entornos AiDuxCare V.2');
  console.log('');
  console.log('Uso:');
  console.log('  node scripts/switch-env.js uat    - Cambiar a entorno UAT');
  console.log('  node scripts/switch-env.js prod   - Cambiar a entorno PROD');
  console.log('  node scripts/switch-env.js status - Mostrar estado actual');
  console.log('');
  showStatus();
  process.exit(0);
}

if (command === 'status') {
  showStatus();
} else if (command === 'uat' || command === 'prod') {
  switchEnvironment(command);
} else {
  console.error('❌ Comando inválido. Use: uat, prod, o status');
  process.exit(1);
}
