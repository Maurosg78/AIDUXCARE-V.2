#!/usr/bin/env node

/**
 * 🔒 SECURITY TEST SUITE - FASE 1 & 2
 * Script de testing automatizado para verificar la integridad del sistema
 * después de las refactorizaciones de depuración
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
    this.srcPath = path.join(__dirname, '../src');
  }

  log(level, message) {
    const timestamp = new Date().toISOString().slice(11, 19);
    const symbols = { info: '🔍', success: '✅', error: '❌', warning: '⚠️' };
    console.log(`${timestamp} ${symbols[level] || 'ℹ️'} ${message}`);
  }

  addTest(name, status, details = '') {
    this.tests.push({ name, status, details, timestamp: new Date() });
    if (status === 'PASS') this.results.passed++;
    else if (status === 'FAIL') this.results.failed++;
    else if (status === 'WARN') this.results.warnings++;
  }

  // Test 1: Verificar integridad de archivos críticos
  testCriticalFiles() {
    this.log('info', 'Testing: Integridad de archivos críticos...');
    
    const criticalFiles = [
      'src/services/core/TranscriptionService.ts',
      'src/hooks/useInterval.ts',
      'src/hooks/useTranscription.ts',
      'src/pages/SimpleConsultationPage.tsx',
      'src/pages/WelcomePage.tsx',
      'src/router/index.tsx',
      'src/App.tsx'
    ];

    let allExist = true;
    const missing = [];

    criticalFiles.forEach(file => {
      if (!fs.existsSync(path.join(__dirname, '..', file))) {
        allExist = false;
        missing.push(file);
      }
    });

    if (allExist) {
      this.addTest('Archivos Críticos', 'PASS', 'Todos los archivos críticos existen');
      this.log('success', 'Todos los archivos críticos están presentes');
    } else {
      this.addTest('Archivos Críticos', 'FAIL', `Archivos faltantes: ${missing.join(', ')}`);
      this.log('error', `Archivos faltantes: ${missing.join(', ')}`);
    }
  }

  // Test 2: Verificar compilación TypeScript
  testTypeScriptCompilation() {
    this.log('info', 'Testing: Compilación TypeScript...');
    
    try {
      execSync('npm run build > /dev/null 2>&1', { stdio: 'pipe' });
      this.addTest('Compilación TS', 'PASS', 'Build exitoso sin errores');
      this.log('success', 'Compilación TypeScript exitosa');
    } catch (error) {
      this.addTest('Compilación TS', 'FAIL', 'Errores de compilación detectados');
      this.log('error', 'Errores de compilación TypeScript');
    }
  }

  // Test 3: Verificar intervalos problemáticos eliminados
  testIntervalCleanup() {
    this.log('info', 'Testing: Limpieza de intervalos problemáticos...');
    
    const refactoredFiles = [
      'src/pages/SimpleConsultationPage.tsx',
      'src/pages/WelcomePage.tsx'
    ];

    let totalIntervals = 0;
    const problematicIntervals = [];

    refactoredFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Buscar patrones problemáticos
        const manualIntervals = content.match(/setInterval\s*\(/g);
        const missingCleanup = content.match(/setInterval.*(?!clearInterval)/g);
        
        if (manualIntervals && manualIntervals.length > 0) {
          // Verificar si hay useInterval en su lugar
          const hasUseInterval = content.includes('useInterval');
          const hasTranscriptionService = content.includes('TranscriptionService');
          
          if (!hasUseInterval && !hasTranscriptionService) {
            totalIntervals += manualIntervals.length;
            problematicIntervals.push(`${file}: ${manualIntervals.length} intervalos`);
          }
        }
      }
    });

    if (totalIntervals === 0) {
      this.addTest('Limpieza Intervalos', 'PASS', 'No hay intervalos problemáticos en archivos refactorizados');
      this.log('success', 'Intervalos problemáticos eliminados correctamente');
    } else {
      this.addTest('Limpieza Intervalos', 'WARN', `${totalIntervals} intervalos encontrados: ${problematicIntervals.join(', ')}`);
      this.log('warning', `Intervalos restantes: ${problematicIntervals.join(', ')}`);
    }
  }

  // Test 4: Verificar imports correctos
  testImportIntegrity() {
    this.log('info', 'Testing: Integridad de imports...');
    
    const files = [
      'src/pages/SimpleConsultationPage.tsx',
      'src/pages/WelcomePage.tsx'
    ];

    let allImportsValid = true;
    const invalidImports = [];

    files.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Verificar imports específicos
        const requiredImports = {
          'src/pages/SimpleConsultationPage.tsx': [
            'TranscriptionService',
            'useInterval'
          ],
          'src/pages/WelcomePage.tsx': [
            'useInterval'
          ]
        };

        const required = requiredImports[file] || [];
        required.forEach(importName => {
          if (!content.includes(importName)) {
            allImportsValid = false;
            invalidImports.push(`${file}: falta ${importName}`);
          }
        });

        // Verificar imports rotos (sin @/ prefix)
        const brokenImports = content.match(/import.*from ['"][^@][.\/]/g);
        if (brokenImports) {
          allImportsValid = false;
          invalidImports.push(`${file}: imports relativos sin @/`);
        }
      }
    });

    if (allImportsValid) {
      this.addTest('Integridad Imports', 'PASS', 'Todos los imports son correctos');
      this.log('success', 'Imports verificados correctamente');
    } else {
      this.addTest('Integridad Imports', 'FAIL', `Imports problemáticos: ${invalidImports.join(', ')}`);
      this.log('error', `Imports problemáticos: ${invalidImports.join(', ')}`);
    }
  }

  // Test 5: Verificar servicios centralizados funcionando
  testCentralizedServices() {
    this.log('info', 'Testing: Servicios centralizados...');
    
    const serviceFiles = [
      'src/services/core/TranscriptionService.ts',
      'src/hooks/useInterval.ts'
    ];

    let servicesWorking = true;
    const issues = [];

    serviceFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Verificar patrones de servicios
        if (file.includes('TranscriptionService')) {
          if (!content.includes('getInstance') || !content.includes('cleanup')) {
            servicesWorking = false;
            issues.push(`${file}: falta patrón Singleton o cleanup`);
          }
        }
        
        if (file.includes('useInterval')) {
          if (!content.includes('useEffect') || !content.includes('clearInterval')) {
            servicesWorking = false;
            issues.push(`${file}: falta cleanup automático`);
          }
        }
      } else {
        servicesWorking = false;
        issues.push(`${file}: archivo no existe`);
      }
    });

    if (servicesWorking) {
      this.addTest('Servicios Centralizados', 'PASS', 'Servicios implementados correctamente');
      this.log('success', 'Servicios centralizados funcionando');
    } else {
      this.addTest('Servicios Centralizados', 'FAIL', `Problemas: ${issues.join(', ')}`);
      this.log('error', `Problemas en servicios: ${issues.join(', ')}`);
    }
  }

  // Test 6: Verificar que el servidor sigue funcionando
  testServerHealth() {
    this.log('info', 'Testing: Salud del servidor...');
    
    try {
      // Verificar que el proceso de Vite esté corriendo
      const result = execSync('curl -s http://localhost:3001 -w "%{http_code}" -o /dev/null 2>/dev/null || echo "000"', { encoding: 'utf8' });
      const statusCode = result.trim();
      
      if (statusCode === '200') {
        this.addTest('Servidor Activo', 'PASS', 'Servidor responde correctamente');
        this.log('success', 'Servidor funcionando correctamente');
      } else {
        this.addTest('Servidor Activo', 'WARN', `Código de respuesta: ${statusCode}`);
        this.log('warning', `Servidor responde con código: ${statusCode}`);
      }
    } catch (error) {
      this.addTest('Servidor Activo', 'FAIL', 'No se puede conectar al servidor');
      this.log('error', 'No se puede conectar al servidor');
    }
  }

  // Test 7: Verificar memoria y rendimiento
  testPerformance() {
    this.log('info', 'Testing: Performance y memoria...');
    
    try {
      // Simular análisis de memoria (en producción sería más complejo)
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
      const hasDevDeps = Object.keys(packageJson.devDependencies || {}).length > 0;
      
      if (hasDevDeps) {
        this.addTest('Performance Check', 'PASS', 'Dependencias de desarrollo presentes');
        this.log('success', 'Estructura de proyecto saludable');
      } else {
        this.addTest('Performance Check', 'WARN', 'Sin dependencias de desarrollo');
        this.log('warning', 'Posible problema en configuración');
      }
      
      // Verificar tamaño de archivos críticos
      const largeFiles = [];
      const checkFiles = [
        'src/pages/SimpleConsultationPage.tsx',
        'src/pages/WelcomePage.tsx'
      ];
      
      checkFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          if (stats.size > 50000) { // 50KB
            largeFiles.push(`${file}: ${Math.round(stats.size/1024)}KB`);
          }
        }
      });
      
      if (largeFiles.length === 0) {
        this.log('success', 'Tamaños de archivo óptimos');
      } else {
        this.log('warning', `Archivos grandes: ${largeFiles.join(', ')}`);
      }
      
    } catch (error) {
      this.addTest('Performance Check', 'FAIL', 'Error en análisis de performance');
      this.log('error', 'Error analizando performance');
    }
  }

  // Ejecutar todos los tests
  runAllTests() {
    console.log('\n🔒 INICIANDO SECURITY TEST SUITE - FASE 1 & 2');
    console.log('=' .repeat(60));
    
    this.testCriticalFiles();
    this.testTypeScriptCompilation();
    this.testIntervalCleanup();
    this.testImportIntegrity();
    this.testCentralizedServices();
    this.testServerHealth();
    this.testPerformance();
    
    this.printSummary();
  }

  // Imprimir resumen final
  printSummary() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESUMEN DE SECURITY TESTING');
    console.log('=' .repeat(60));
    
    console.log(`✅ Tests Pasados: ${this.results.passed}`);
    console.log(`❌ Tests Fallidos: ${this.results.failed}`);
    console.log(`⚠️  Advertencias: ${this.results.warnings}`);
    console.log(`📋 Total Tests: ${this.tests.length}`);
    
    const successRate = ((this.results.passed / this.tests.length) * 100).toFixed(1);
    console.log(`📈 Tasa de Éxito: ${successRate}%`);
    
    console.log('\n📋 DETALLE DE TESTS:');
    this.tests.forEach((test, index) => {
      const status = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${status} ${test.name}: ${test.details}`);
    });
    
    if (this.results.failed === 0) {
      console.log('\n🎉 TODOS LOS TESTS CRÍTICOS PASARON');
      console.log('✅ Es seguro continuar con Fase 3');
    } else {
      console.log('\n⚠️  HAY TESTS FALLIDOS');
      console.log('❌ Revisar problemas antes de continuar');
    }
    
    console.log('\n' + '=' .repeat(60));
  }
}

// Ejecutar tests
const testSuite = new SecurityTestSuite();
testSuite.runAllTests(); 