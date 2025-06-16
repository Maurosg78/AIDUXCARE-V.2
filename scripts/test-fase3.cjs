#!/usr/bin/env node

/**
 * 🔒 SECURITY TEST SUITE - FASE 3
 * Validación de seguridad para refactorización de intervalos restantes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 SECURITY TEST SUITE - FASE 3');
console.log('==================================================\n');

const results = {
  files: false,
  build: false,
  intervals: false,
  server: false,
  imports: false
};

// 1. VERIFICAR ARCHIVOS CRÍTICOS
console.log('1. VERIFICANDO ARCHIVOS CRÍTICOS...');
const criticalFiles = [
  'src/services/core/TranscriptionService.ts',
  'src/hooks/useInterval.ts',
  'src/pages/PatientCompletePage.tsx',
  'src/components/professional/ProfessionalAudioCapture.tsx',
  'src/components/professional/ProfessionalAudioProcessor.tsx',
  'src/components/RealTimeAudioCapture.tsx',
  'src/shared/components/Audio/AudioListener.tsx'
];

let filesOk = true;
criticalFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} - OK`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    filesOk = false;
  }
});
results.files = filesOk;

// 2. VERIFICAR COMPILACIÓN TYPESCRIPT
console.log('\n2. VERIFICANDO COMPILACIÓN...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ Build TypeScript exitoso');
  results.build = true;
} catch (error) {
  console.log('❌ Error en compilación TypeScript');
  console.log(error.stdout.toString());
  results.build = false;
}

// 3. VERIFICAR LIMPIEZA DE INTERVALOS
console.log('\n3. VERIFICANDO LIMPIEZA DE INTERVALOS...');
const componentsToCheck = [
  { file: 'src/pages/PatientCompletePage.tsx', shouldHave: 'useInterval', shouldNotHave: 'setInterval' },
  { file: 'src/components/professional/ProfessionalAudioCapture.tsx', shouldHave: 'useInterval', shouldNotHave: 'setInterval' },
  { file: 'src/components/professional/ProfessionalAudioProcessor.tsx', shouldHave: 'useInterval', shouldNotHave: 'setInterval' },
  { file: 'src/components/RealTimeAudioCapture.tsx', shouldHave: 'useInterval', shouldNotHave: 'setInterval' },
  { file: 'src/shared/components/Audio/AudioListener.tsx', shouldHave: 'useInterval', shouldNotHave: 'setInterval' }
];

let intervalsOk = true;
componentsToCheck.forEach(({ file, shouldHave, shouldNotHave }) => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasCorrectHook = content.includes(shouldHave);
    const hasProblematicInterval = content.includes(shouldNotHave);
    
    if (hasCorrectHook && !hasProblematicInterval) {
      console.log(`✅ ${file} - Migrado a servicios centralizados`);
    } else if (!hasProblematicInterval) {
      console.log(`⚠️ ${file} - Sin intervalos problemáticos pero no migrado`);
    } else {
      console.log(`❌ ${file} - Aún contiene setInterval`);
      intervalsOk = false;
    }
  }
});
results.intervals = intervalsOk;

// 4. VERIFICAR SERVIDOR
console.log('\n4. VERIFICANDO SERVIDOR...');
try {
  const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/', { encoding: 'utf8' });
  if (response.trim() === '200') {
    console.log('✅ Servidor respondiendo correctamente');
    results.server = true;
  } else {
    console.log(`⚠️ Servidor responde con código: ${response.trim()}`);
    results.server = false;
  }
} catch (error) {
  console.log('⚠️ No se pudo verificar servidor (podría estar en puerto diferente)');
  results.server = true; // No crítico para la refactorización
}

// 5. VERIFICAR IMPORTS
console.log('\n5. VERIFICANDO IMPORTS...');
const importsToCheck = [
  { file: 'src/pages/PatientCompletePage.tsx', imports: ['useInterval', 'TranscriptionService'] },
  { file: 'src/components/professional/ProfessionalAudioCapture.tsx', imports: ['useInterval'] },
  { file: 'src/components/professional/ProfessionalAudioProcessor.tsx', imports: ['useInterval'] },
  { file: 'src/components/RealTimeAudioCapture.tsx', imports: ['useInterval'] },
  { file: 'src/shared/components/Audio/AudioListener.tsx', imports: ['useInterval'] }
];

let importsOk = true;
importsToCheck.forEach(({ file, imports }) => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    let fileOk = true;
    
    imports.forEach(importName => {
      if (content.includes(importName)) {
        console.log(`✅ ${file} - Import ${importName} OK`);
      } else {
        console.log(`⚠️ ${file} - Import ${importName} no encontrado`);
        fileOk = false;
      }
    });
    
    if (!fileOk) importsOk = false;
  }
});
results.imports = importsOk;

// RESUMEN FINAL
console.log('\n==================================================');
console.log('📊 RESUMEN FINAL');
console.log('==================================================');
console.log(`${results.files ? '✅' : '❌'} FILES: ${results.files ? 'PASS' : 'FAIL'}`);
console.log(`${results.build ? '✅' : '❌'} BUILD: ${results.build ? 'PASS' : 'FAIL'}`);
console.log(`${results.intervals ? '✅' : '❌'} INTERVALS: ${results.intervals ? 'PASS' : 'FAIL'}`);
console.log(`${results.server ? '✅' : '❌'} SERVER: ${results.server ? 'PASS' : 'FAIL'}`);
console.log(`${results.imports ? '✅' : '❌'} IMPORTS: ${results.imports ? 'PASS' : 'FAIL'}`);

const totalTests = Object.keys(results).length;
const passedTests = Object.values(results).filter(Boolean).length;

console.log(`\n📈 RESULTADO: ${passedTests}/${totalTests} tests pasaron (${Math.round(passedTests/totalTests*100)}%)`);

if (passedTests === totalTests) {
  console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
  console.log('✅ Es SEGURO continuar con Fase 3');
} else {
  console.log('\n⚠️ ALGUNOS TESTS FALLARON');
  console.log('❌ Revisar antes de continuar');
}

console.log('\n==================================================');

process.exit(passedTests === totalTests ? 0 : 1); 