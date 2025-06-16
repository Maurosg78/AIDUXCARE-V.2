#!/usr/bin/env node

/**
 * 🔧 REFACTOR INTERVALS - FASE 3
 * Script para refactorizar automáticamente los setInterval restantes
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 REFACTOR INTERVALS - FASE 3');
console.log('==================================================\n');

const filesToRefactor = [
  'src/components/professional/ProfessionalAudioProcessor.tsx',
  'src/components/professional/ProfessionalAudioCapture.tsx',
  'src/components/RealTimeAudioCapture.tsx',
  'src/shared/components/Audio/AudioListener.tsx'
];

filesToRefactor.forEach(filePath => {
  console.log(`🔧 Refactorizando: ${filePath}`);
  
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Archivo no encontrado: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // 1. Añadir import de useInterval si no existe
  if (!content.includes('useInterval')) {
    const importLine = `import { useInterval } from '@/hooks/useInterval';`;
    
    // Encontrar dónde insertar el import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLastImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLastImport + 1) + importLine + '\n' + content.slice(endOfLastImport + 1);
      console.log(`✅ Añadido import useInterval en ${filePath}`);
    }
  }
  
  // 2. Reemplazar patrones setInterval comunes
  const intervalPatterns = [
    // Patrón 1: setInterval con clearInterval en useEffect
    {
      search: /setInterval\(\s*\(\)\s*=>\s*{([^}]+)},\s*(\d+)\)/g,
      replace: 'useInterval(() => {$1}, $2)'
    },
    // Patrón 2: Variables que almacenan setInterval
    {
      search: /(\w+)\.current\s*=\s*setInterval\(/g,
      replace: '// REFACTORIZADO: useInterval('
    }
  ];
  
  let modified = false;
  intervalPatterns.forEach(pattern => {
    if (pattern.search.test(content)) {
      content = content.replace(pattern.search, pattern.replace);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Refactorizado: ${filePath}`);
  } else {
    console.log(`⚠️ No se encontraron patrones para refactorizar en: ${filePath}`);
  }
});

console.log('\n==================================================');
console.log('🎉 REFACTORIZACIÓN COMPLETADA');
console.log('=================================================='); 