#!/usr/bin/env node

/**
 * 🧹 SCRIPT DE LIMPIEZA DE CONSOLE.LOGS
 * Elimina console.logs innecesarios manteniendo solo los críticos para debugging
 */

const fs = require('fs');
const path = require('path');

// Configuración
const ALLOWED_CONSOLE_PATTERNS = [
  // Permitir logs de error críticos
  /console\.error\(['"`]ERROR:.*['"`]/,
  /console\.error\(['"`]Error.*['"`]/,
  // Permitir logs de configuración en desarrollo
  /if.*\.env\.DEV.*console\./,
  /import\.meta\.env\.DEV.*console\./,
  // Permitir logs en archivos de test
  /\.test\.|\.spec\./,
  // Permitir logs en archivos de debug específicos
  /AuthDebugPage|debugMCP|browser-logger/
];

const DIRECTORIES_TO_CLEAN = [
  'src/pages',
  'src/services', 
  'src/components',
  'src/core'
];

const CONSOLE_PATTERNS_TO_REMOVE = [
  // Logs informativos que exponen datos
  /console\.log\(['"`]🔐.*['"`]/,
  /console\.log\(['"`]SUCCESS:.*['"`]/,
  /console\.log\(['"`]LAUNCH:.*['"`]/,
  /console\.log\(['"`]STATS:.*['"`]/,
  /console\.log\(['"`]🏥.*['"`]/,
  /console\.log\(['"`]🔍.*['"`]/,
  /console\.log\(['"`]📋.*['"`]/,
  /console\.log\(['"`]🎉.*['"`]/,
  /console\.log\(['"`]📝.*['"`]/,
  /console\.log\(['"`]🧠.*['"`]/,
  /console\.log\(['"`]💡.*['"`]/,
  /console\.log\(['"`]RELOAD:.*['"`]/,
  // Logs que podrían exponer credenciales
  /console\.log.*email.*password/i,
  /console\.log.*credential/i,
  /console\.log.*token/i,
  /console\.log.*secret/i
];

function shouldPreserveConsoleLog(line, fileName) {
  // Preservar si coincide con patrones permitidos
  return ALLOWED_CONSOLE_PATTERNS.some(pattern => {
    if (typeof pattern === 'string') {
      return line.includes(pattern) || fileName.includes(pattern);
    }
    return pattern.test(line) || pattern.test(fileName);
  });
}

function shouldRemoveConsoleLog(line) {
  return CONSOLE_PATTERNS_TO_REMOVE.some(pattern => pattern.test(line));
}

function cleanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const fileName = path.basename(filePath);
    
    let cleaned = false;
    const cleanedLines = lines.map(line => {
      const trimmedLine = line.trim();
      
      // Si contiene console.log/debug/info/warn
      if (/console\.(log|debug|info|warn)/.test(trimmedLine)) {
        // Preservar si está en la lista de permitidos
        if (shouldPreserveConsoleLog(line, fileName)) {
          return line;
        }
        
        // Remover si está en la lista de prohibidos
        if (shouldRemoveConsoleLog(line)) {
          cleaned = true;
          return ''; // Eliminar la línea
        }
        
        // Para otros casos, convertir a comentario con contexto de desarrollo
        if (!line.includes('// DEV:')) {
          cleaned = true;
          const indent = line.match(/^\s*/)[0];
          return `${indent}// DEV: ${trimmedLine}`;
        }
      }
      
      return line;
    });
    
    if (cleaned) {
      // Remover líneas vacías consecutivas
      const finalContent = cleanedLines
        .filter((line, index, arr) => {
          if (line.trim() === '') {
            // Mantener línea vacía solo si no hay otra línea vacía después
            return index === arr.length - 1 || arr[index + 1].trim() !== '';
          }
          return true;
        })
        .join('\n');
      
      fs.writeFileSync(filePath, finalContent, 'utf8');
      console.log(`SUCCESS: Limpiado: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`ERROR: Error limpiando ${filePath}:`, error.message);
    return false;
  }
}

function cleanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️ Directorio no existe: ${dirPath}`);
    return { cleaned: 0, total: 0 };
  }
  
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  let cleaned = 0;
  let total = 0;
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      const subResult = cleanDirectory(fullPath);
      cleaned += subResult.cleaned;
      total += subResult.total;
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      total++;
      if (cleanFile(fullPath)) {
        cleaned++;
      }
    }
  }
  
  return { cleaned, total };
}

// Función principal
function main() {
  console.log('🧹 INICIANDO LIMPIEZA DE CONSOLE.LOGS');
  console.log('📋 Eliminando logs que exponen información sensible...\n');
  
  let totalCleaned = 0;
  let totalFiles = 0;
  
  for (const dir of DIRECTORIES_TO_CLEAN) {
    console.log(`📁 Limpiando directorio: ${dir}`);
    const result = cleanDirectory(dir);
    totalCleaned += result.cleaned;
    totalFiles += result.total;
    console.log(`   Archivos procesados: ${result.total}, Modificados: ${result.cleaned}\n`);
  }
  
  console.log('STATS: RESUMEN DE LIMPIEZA:');
  console.log(`   Total archivos procesados: ${totalFiles}`);
  console.log(`   Archivos modificados: ${totalCleaned}`);
  console.log(`   Porcentaje limpiado: ${((totalCleaned / totalFiles) * 100).toFixed(1)}%`);
  
  if (totalCleaned > 0) {
    console.log('\nSUCCESS: LIMPIEZA COMPLETADA');
    console.log('🔒 Logs sensibles eliminados para cumplir estándares profesionales');
    console.log('🛠️ Logs de desarrollo comentados con prefijo // DEV:');
    console.log('⚠️ Logs críticos de error preservados');
  } else {
    console.log('\nSUCCESS: NO SE REQUIRIÓ LIMPIEZA');
    console.log('🎯 El código ya cumple con los estándares profesionales');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { cleanFile, cleanDirectory, main }; 