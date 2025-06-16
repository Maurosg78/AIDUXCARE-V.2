#!/usr/bin/env node

/**
 * 🔒 TESTING RÁPIDO - FASE 1 & 2
 * Verificación de integridad después de refactorizaciones
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function log(level, message) {
  const symbols = { info: '🔍', success: '✅', error: '❌', warning: '⚠️' };
  console.log(`${symbols[level]} ${message}`);
}

function testCriticalFiles() {
  console.log('\n1. VERIFICANDO ARCHIVOS CRÍTICOS...');
  
  const criticalFiles = [
    'src/services/core/TranscriptionService.ts',
    'src/hooks/useInterval.ts', 
    'src/pages/SimpleConsultationPage.tsx',
    'src/pages/WelcomePage.tsx'
  ];

  let allExist = true;
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log('success', `${file} - OK`);
    } else {
      log('error', `${file} - FALTANTE`);
      allExist = false;
    }
  });
  
  return allExist;
}

function testBuild() {
  console.log('\n2. VERIFICANDO COMPILACIÓN...');
  
  try {
    execSync('npm run build > /dev/null 2>&1');
    log('success', 'Build TypeScript exitoso');
    return true;
  } catch (error) {
    log('error', 'Error en compilación TypeScript');
    return false;
  }
}

function testIntervals() {
  console.log('\n3. VERIFICANDO LIMPIEZA DE INTERVALOS...');
  
  const files = ['src/pages/SimpleConsultationPage.tsx', 'src/pages/WelcomePage.tsx'];
  let cleanupOK = true;
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Verificar que usan servicios centralizados
      if (file.includes('SimpleConsultation')) {
        if (content.includes('TranscriptionService') && content.includes('useInterval')) {
          log('success', `${file} - Migrado a servicios centralizados`);
        } else {
          log('warning', `${file} - Migración incompleta`);
          cleanupOK = false;
        }
      }
      
      if (file.includes('Welcome')) {
        if (content.includes('useInterval')) {
          log('success', `${file} - Usando hook useInterval`);
        } else {
          log('warning', `${file} - No usa hook centralizado`);
          cleanupOK = false;
        }
      }
    }
  });
  
  return cleanupOK;
}

function testServer() {
  console.log('\n4. VERIFICANDO SERVIDOR...');
  
  try {
    const result = execSync('curl -s http://localhost:3001 -w "%{http_code}" -o /dev/null 2>/dev/null || echo "000"', { encoding: 'utf8' });
    const statusCode = result.trim();
    
    if (statusCode === '200') {
      log('success', 'Servidor respondiendo correctamente');
      return true;
    } else {
      log('warning', `Servidor responde con código: ${statusCode}`);
      return false;
    }
  } catch (error) {
    log('error', 'No se puede conectar al servidor');
    return false;
  }
}

function testImports() {
  console.log('\n5. VERIFICANDO IMPORTS...');
  
  const files = [
    { file: 'src/pages/SimpleConsultationPage.tsx', needs: ['TranscriptionService', 'useInterval'] },
    { file: 'src/pages/WelcomePage.tsx', needs: ['useInterval'] }
  ];
  
  let importsOK = true;
  files.forEach(({ file, needs }) => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      needs.forEach(importName => {
        if (content.includes(importName)) {
          log('success', `${file} - Import ${importName} OK`);
        } else {
          log('error', `${file} - Falta import ${importName}`);
          importsOK = false;
        }
      });
    }
  });
  
  return importsOK;
}

// EJECUTAR TESTS
console.log('🔒 SECURITY TEST SUITE - FASE 1 & 2');
console.log('=' .repeat(50));

const results = {
  files: testCriticalFiles(),
  build: testBuild(),
  intervals: testIntervals(),
  server: testServer(),
  imports: testImports()
};

// RESUMEN
console.log('\n' + '=' .repeat(50));
console.log('📊 RESUMEN FINAL');
console.log('=' .repeat(50));

const passed = Object.values(results).filter(r => r === true).length;
const total = Object.keys(results).length;

Object.entries(results).forEach(([test, result]) => {
  const status = result ? '✅' : '❌';
  console.log(`${status} ${test.toUpperCase()}: ${result ? 'PASS' : 'FAIL'}`);
});

console.log(`\n📈 RESULTADO: ${passed}/${total} tests pasaron (${Math.round(passed/total*100)}%)`);

if (passed === total) {
  console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
  console.log('✅ Es SEGURO continuar con Fase 3');
} else {
  console.log('\n⚠️  ALGUNOS TESTS FALLARON');
  console.log('❌ Revisar problemas antes de continuar');
}

console.log('\n' + '=' .repeat(50)); 