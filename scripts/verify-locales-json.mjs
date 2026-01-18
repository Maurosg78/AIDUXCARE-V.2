#!/usr/bin/env node
/**
 * Verificación de JSON locales
 * Valida que src/locales/en.json y src/locales/es.json sean JSON válidos
 * 
 * Uso: node scripts/verify-locales-json.mjs
 * Exit code: 0 si válido, 1 si inválido
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const localeFiles = [
  'src/locales/en.json',
  'src/locales/es.json'
];

let hasErrors = false;

console.log('🔍 Verificando JSON de locales...\n');

for (const localeFile of localeFiles) {
  const filePath = join(rootDir, localeFile);
  
  try {
    // Leer archivo
    const content = readFileSync(filePath, 'utf-8');
    
    // Parsear JSON
    const parsed = JSON.parse(content);
    
    // Verificar que sea un objeto (no array, no primitivo)
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      console.error(`❌ ${localeFile}: El JSON debe ser un objeto, no un array o primitivo`);
      hasErrors = true;
      continue;
    }
    
    // Verificar keys duplicadas (JSON.parse las ignora silenciosamente)
    // Revisar manualmente el contenido si hay sospecha
    const keys = Object.keys(parsed);
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      console.error(`❌ ${localeFile}: Keys duplicadas detectadas (JSON.parse las ignora)`);
      hasErrors = true;
      continue;
    }
    
    console.log(`✅ ${localeFile}: JSON válido (${keys.length} keys)`);
    
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`❌ ${localeFile}: Error de sintaxis JSON`);
      console.error(`   ${error.message}`);
      
      // Mostrar contexto alrededor del error si es posible
      if (error.message.includes('position')) {
        const match = error.message.match(/position (\d+)/);
        if (match) {
          const pos = parseInt(match[1], 10);
          try {
            const content = readFileSync(filePath, 'utf-8');
            const start = Math.max(0, pos - 50);
            const end = Math.min(content.length, pos + 50);
            console.error(`   Contexto (posición ${pos}):`);
            console.error(`   ...${content.substring(start, end)}...`);
          } catch {
            // Ignore if no se puede leer
          }
        }
      }
    } else {
      console.error(`❌ ${localeFile}: Error al leer archivo`);
      console.error(`   ${error.message}`);
    }
    hasErrors = true;
  }
}

console.log();

if (hasErrors) {
  console.error('❌ Validación falló. Corrige los errores antes de continuar.');
  process.exit(1);
} else {
  console.log('✅ Todos los archivos de locales son JSON válidos.');
  process.exit(0);
}
