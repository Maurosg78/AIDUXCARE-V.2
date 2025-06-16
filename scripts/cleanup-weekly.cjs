const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 🧹 SCRIPT DE LIMPIEZA SEMANAL AUTOMATIZADA
// Ejecuta limpieza preventiva para mantener el codebase limpio

console.log('🧹 INICIANDO LIMPIEZA SEMANAL AUTOMATIZADA\n');

const FORBIDDEN_PATTERNS = [
  // Archivos temporales y backups
  /\.backup\./,
  /\.old\./,
  /\.temp\./,
  /\.bak$/,
  /\.orig$/,
  /\.rej$/,
  /\.tmp$/,
  /\.cache$/,
  /-copy\./,
  /_deprecated\./,
  
  // Patrones de desarrollo temporal
  /^temp-/,
  /^test-.*\.html$/,
  /^clear-.*\.js$/,
  /^debug-/,
  /^example-/,
  
  // Documentación temporal
  /^INFORME_.*\.md$/,
  /^PLAN_.*\.md$/,
  /^RESUMEN_.*\.md$/,
  /^IMPLEMENTACION_.*\.md$/,
  /^MIGRACION_.*\.md$/,
  /^CORRECCION_.*\.md$/,
  /^HOJA_DE_RUTA_.*\.md$/,
  /^FLUJO_.*\.md$/,
  /^CONFIGURACION_.*\.md$/,
  
  // Archivos de sistema
  /\.DS_Store$/,
  /Thumbs\.db$/,
  /desktop\.ini$/
];

const FORBIDDEN_DIRECTORIES = [
  'temp',
  'backup',
  'old',
  'deprecated',
  'archive',
  '_deprecated',
  'test-*',
  'example-*',
  'debug-*'
];

function findProblematicFiles(dir, basePath = '') {
  const problematic = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);
      
      // Skip node_modules y .git
      if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') {
        continue;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Verificar directorios prohibidos
        if (FORBIDDEN_DIRECTORIES.some(pattern => {
          if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
            return regex.test(item);
          }
          return item === pattern;
        })) {
          problematic.push({
            type: 'directory',
            path: relativePath,
            reason: 'Directorio prohibido'
          });
        } else {
          // Recursión en subdirectorios permitidos
          problematic.push(...findProblematicFiles(fullPath, relativePath));
        }
      } else {
        // Verificar archivos prohibidos
        if (FORBIDDEN_PATTERNS.some(pattern => pattern.test(item))) {
          problematic.push({
            type: 'file',
            path: relativePath,
            reason: 'Patrón de archivo prohibido'
          });
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ No se pudo leer directorio: ${dir}`);
  }
  
  return problematic;
}

function performCleanup() {
  console.log('🔍 Buscando archivos problemáticos...\n');
  
  const problematic = findProblematicFiles('.');
  
  if (problematic.length === 0) {
    console.log('✅ EXCELENTE: No se encontraron archivos problemáticos');
    console.log('✅ El codebase cumple con todas las políticas de limpieza');
    return true;
  }
  
  console.log(`🚨 ENCONTRADOS ${problematic.length} ELEMENTOS PROBLEMÁTICOS:\n`);
  
  // Mostrar problemas encontrados
  problematic.forEach((item, index) => {
    console.log(`${index + 1}. ${item.type.toUpperCase()}: ${item.path}`);
    console.log(`   Razón: ${item.reason}\n`);
  });
  
  // En modo automático, solo reportar (no eliminar automáticamente)
  console.log('📋 ACCIONES RECOMENDADAS:');
  console.log('1. Revisar manualmente los elementos listados');
  console.log('2. Eliminar o mover a ubicación apropiada');
  console.log('3. Ejecutar nuevamente para verificar');
  
  return false;
}

function generateCleanupReport() {
  const report = {
    timestamp: new Date().toISOString(),
    buildStatus: 'unknown',
    cleanupStatus: 'pending',
    recommendations: []
  };
  
  try {
    // Verificar build
    console.log('🔧 Verificando estado del build...');
    execSync('npm run build', { stdio: 'pipe' });
    report.buildStatus = 'success';
    console.log('✅ Build exitoso');
  } catch (error) {
    report.buildStatus = 'failed';
    console.log('❌ Build falló');
    report.recommendations.push('Corregir errores de build antes de continuar');
  }
  
  // Realizar limpieza
  const cleanupSuccess = performCleanup();
  report.cleanupStatus = cleanupSuccess ? 'clean' : 'issues_found';
  
  if (!cleanupSuccess) {
    report.recommendations.push('Eliminar archivos problemáticos identificados');
  }
  
  // Guardar reporte
  fs.writeFileSync('cleanup-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Reporte guardado en: cleanup-report.json');
  
  return report;
}

// Ejecutar limpieza
try {
  const report = generateCleanupReport();
  
  console.log('\n📊 RESUMEN DE LIMPIEZA SEMANAL:');
  console.log(`• Timestamp: ${report.timestamp}`);
  console.log(`• Build Status: ${report.buildStatus}`);
  console.log(`• Cleanup Status: ${report.cleanupStatus}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n📋 RECOMENDACIONES:');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    process.exit(1); // Exit con error para CI/CD
  } else {
    console.log('\n🎉 LIMPIEZA COMPLETADA EXITOSAMENTE');
    process.exit(0);
  }
  
} catch (error) {
  console.error('❌ Error durante la limpieza:', error.message);
  process.exit(1);
} 