const fs = require('fs');
const path = require('path');

// 🔍 ANALIZADOR AUTOMÁTICO DE CANDIDATOS A DEPURACIÓN
// Identifica archivos y carpetas que pueden ser movidos a cuarentena

const DEPRECATED_PATTERNS = [
  // Archivos de desarrollo/testing obsoletos
  /\.backup\./,
  /\.old\./,
  /\.test-.*\./,
  /clear-storage\.js/,
  /contrast\.html/,
  /test-speech\.html/,
  /test_vertex\.js/,
  /test_identity\.cjs/,
  /test_firestore\.cjs/,
  /test_prompt\.json/,
  
  // Documentación obsoleta
  /INFORME_.*\.md/,
  /PLAN_NEGOCIOS_.*\.md/,
  /RESUMEN_.*\.md/,
  /CORRECCION_.*\.md/,
  /IMPLEMENTACION_.*\.md/,
  /MIGRACION_.*\.md/,
  /REFACTORIZACION_.*\.md/,
  /HOJA_DE_RUTA_.*\.md/,
  /FLUJO_.*\.md/,
  /CONFIGURACION_.*\.md/,
  /API_CONTRACT\.md/,
  
  // Configs duplicados
  /tailwind\.config\.backup\.js/,
  /tsconfig\.node\.json\s/,
  /router\.backup\.tsx/,
  
  // Directorios obsoletos
  /vertex-test/,
  /cloudfn-hello/,
  /database/,
  /maintenance/,
  /forms/,
  /logs/,
  /deployment/,
  /\.git-backup-emergency/
];

const SUSPICIOUS_DIRS = [
  'vertex-test',
  'cloudfn-hello', 
  'database',
  'maintenance',
  'forms',
  'logs',
  'deployment',
  '.git-backup-emergency-20250605-145244'
];

const SUSPICIOUS_FILES = [
  'temp.txt',
  'deploy-backend.sh',
  'swagger.yaml',
  '.DS_Store',
  '.gcloudignore'
];

function analyzeDirectory(dirPath, prefix = '') {
  const candidates = {
    files: [],
    directories: [],
    suspicious: [],
    totalSize: 0
  };

  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativePath = path.join(prefix, item);
      
      // Skip node_modules, .git, dist
      if (['node_modules', '.git', 'dist'].includes(item)) {
        continue;
      }
      
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        // Analizar directorios sospechosos
        if (SUSPICIOUS_DIRS.includes(item)) {
          candidates.directories.push({
            path: relativePath,
            reason: 'Directorio obsoleto identificado',
            size: getDirSize(fullPath)
          });
        }
        
        // Recursión en subdirectorios
        const subAnalysis = analyzeDirectory(fullPath, relativePath);
        candidates.files.push(...subAnalysis.files);
        candidates.directories.push(...subAnalysis.directories);
        candidates.suspicious.push(...subAnalysis.suspicious);
        candidates.totalSize += subAnalysis.totalSize;
        
      } else {
        candidates.totalSize += stats.size;
        
        // Analizar archivos con patrones sospechosos
        const isDeprecated = DEPRECATED_PATTERNS.some(pattern => pattern.test(item));
        const isSuspicious = SUSPICIOUS_FILES.includes(item);
        
        if (isDeprecated) {
          candidates.files.push({
            path: relativePath,
            reason: 'Coincide con patrón de archivo obsoleto',
            size: stats.size
          });
        } else if (isSuspicious) {
          candidates.suspicious.push({
            path: relativePath,
            reason: 'Archivo sospechoso - revisar manualmente',
            size: stats.size
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error analizando directorio ${dirPath}:`, error.message);
  }
  
  return candidates;
}

function getDirSize(dirPath) {
  let totalSize = 0;
  try {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        totalSize += getDirSize(fullPath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    // Ignorar errores de permisos
  }
  return totalSize;
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateReport() {
  console.log('🔍 INICIANDO ANÁLISIS AUTOMÁTICO DE CANDIDATOS A DEPURACIÓN\n');
  
  const analysis = analyzeDirectory('./');
  
  console.log('STATS: RESUMEN EJECUTIVO:');
  console.log(`• Archivos candidatos: ${analysis.files.length}`);
  console.log(`• Directorios candidatos: ${analysis.directories.length}`);
  console.log(`• Elementos sospechosos: ${analysis.suspicious.length}`);
  console.log(`• Tamaño total analizado: ${formatSize(analysis.totalSize)}\n`);
  
  if (analysis.files.length > 0) {
    console.log('📄 ARCHIVOS CANDIDATOS A MOVER A CUARENTENA:');
    analysis.files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.path}`);
      console.log(`   Razón: ${file.reason}`);
      console.log(`   Tamaño: ${formatSize(file.size)}\n`);
    });
  }
  
  if (analysis.directories.length > 0) {
    console.log('📁 DIRECTORIOS CANDIDATOS A MOVER A CUARENTENA:');
    analysis.directories.forEach((dir, index) => {
      console.log(`${index + 1}. ${dir.path}/`);
      console.log(`   Razón: ${dir.reason}`);
      console.log(`   Tamaño: ${formatSize(dir.size)}\n`);
    });
  }
  
  if (analysis.suspicious.length > 0) {
    console.log('⚠️  ELEMENTOS SOSPECHOSOS (REVISAR MANUALMENTE):');
    analysis.suspicious.forEach((item, index) => {
      console.log(`${index + 1}. ${item.path}`);
      console.log(`   Razón: ${item.reason}`);
      console.log(`   Tamaño: ${formatSize(item.size)}\n`);
    });
  }
  
  // Generar comando de creación de cuarentena
  const allCandidates = [...analysis.files, ...analysis.directories];
  if (allCandidates.length > 0) {
    console.log('🎯 COMANDO SUGERIDO PARA CUARENTENA:');
    console.log('mkdir -p _deprecated');
    allCandidates.forEach(item => {
      console.log(`mv "${item.path}" _deprecated/`);
    });
  }
  
  console.log('\nSUCCESS: Análisis completado. Revisar candidatos antes de proceder.');
}

// Ejecutar análisis
generateReport(); 