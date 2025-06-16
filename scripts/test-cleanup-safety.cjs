const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 🧪 SCRIPT DE VALIDACIÓN DE SEGURIDAD POST-DEPURACIÓN
// Ejecuta todas las pruebas necesarias para garantizar estabilidad

console.log('🧪 INICIANDO VALIDACIÓN DE SEGURIDAD POST-DEPURACIÓN\n');

const tests = [
  {
    name: 'Verificación de archivos críticos',
    test: () => {
      const criticalFiles = [
        'package.json',
        'vite.config.ts',
        'tsconfig.json',
        'tailwind.config.ts',
        'src/main.tsx',
        'src/App.tsx',
        'index.html'
      ];
      
      for (const file of criticalFiles) {
        if (!fs.existsSync(file)) {
          throw new Error(`Archivo crítico faltante: ${file}`);
        }
      }
      return 'Todos los archivos críticos están presentes';
    }
  },
  
  {
    name: 'Verificación de importaciones TypeScript',
    test: () => {
      try {
        execSync('npx tsc --noEmit --skipLibCheck', { 
          stdio: 'pipe',
          encoding: 'utf8'
        });
        return 'Compilación TypeScript exitosa';
      } catch (error) {
        throw new Error(`Error de compilación TypeScript: ${error.stdout || error.message}`);
      }
    }
  },
  
  {
    name: 'Verificación de dependencias',
    test: () => {
      try {
        execSync('npm ls --depth=0', { 
          stdio: 'pipe',
          encoding: 'utf8'
        });
        return 'Todas las dependencias están resueltas';
      } catch (error) {
        console.warn('Advertencia en dependencias:', error.message);
        return 'Dependencias verificadas con advertencias';
      }
    }
  },
  
  {
    name: 'Verificación de build de producción',
    test: () => {
      try {
        console.log('   Ejecutando build...');
        const startTime = Date.now();
        execSync('npm run build', { 
          stdio: 'pipe',
          encoding: 'utf8',
          timeout: 60000 // 60 segundos timeout
        });
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        // Verificar que dist/ se haya creado
        if (!fs.existsSync('dist')) {
          throw new Error('Directorio dist/ no fue creado');
        }
        
        return `Build exitoso en ${duration}s`;
      } catch (error) {
        throw new Error(`Error en build: ${error.message}`);
      }
    }
  },
  
  {
    name: 'Verificación de archivos de configuración',
    test: () => {
      const configs = [
        { file: 'package.json', check: (data) => data.name && data.scripts },
        { file: 'vite.config.ts', check: (content) => content.includes('export default') },
        { file: 'tailwind.config.ts', check: (content) => content.includes('export default') }
      ];
      
      for (const config of configs) {
        if (!fs.existsSync(config.file)) {
          throw new Error(`Config faltante: ${config.file}`);
        }
        
        const content = fs.readFileSync(config.file, 'utf8');
        
        if (config.file.endsWith('.json')) {
          try {
            const data = JSON.parse(content);
            if (!config.check(data)) {
              throw new Error(`Config inválida: ${config.file}`);
            }
          } catch (parseError) {
            throw new Error(`JSON inválido en ${config.file}: ${parseError.message}`);
          }
        } else {
          if (!config.check(content)) {
            throw new Error(`Config inválida: ${config.file}`);
          }
        }
      }
      
      return 'Todas las configuraciones son válidas';
    }
  },
  
  {
    name: 'Verificación de rutas principales',
    test: () => {
      const routes = [
        'src/App.tsx',
        'src/router/index.tsx',
        'src/pages/WelcomePage.tsx',
        'src/pages/SimpleConsultationPage.tsx',
        'src/pages/PatientListPage.tsx'
      ];
      
      for (const route of routes) {
        if (!fs.existsSync(route)) {
          throw new Error(`Ruta faltante: ${route}`);
        }
        
        const content = fs.readFileSync(route, 'utf8');
        if (!content.includes('export') && !content.includes('function')) {
          throw new Error(`Archivo posiblemente corrupto: ${route}`);
        }
      }
      
      return 'Todas las rutas principales están disponibles';
    }
  },
  
  {
    name: 'Verificación de servicios principales',
    test: () => {
      const services = [
        'src/services/core/TranscriptionService.ts',
        'src/services/TextProcessingService.ts',
        'src/hooks/useInterval.ts'
      ];
      
      for (const service of services) {
        if (!fs.existsSync(service)) {
          throw new Error(`Servicio faltante: ${service}`);
        }
      }
      
      return 'Todos los servicios principales están disponibles';
    }
  },
  
  {
    name: 'Verificación de tamaño de cuarentena',
    test: () => {
      if (!fs.existsSync('_deprecated')) {
        throw new Error('Carpeta de cuarentena no existe');
      }
      
      const deprecatedFiles = execSync('find _deprecated -type f | wc -l', { 
        encoding: 'utf8' 
      }).trim();
      
      const deprecatedDirs = execSync('find _deprecated -type d | wc -l', { 
        encoding: 'utf8' 
      }).trim();
      
      return `Cuarentena: ${deprecatedFiles} archivos, ${deprecatedDirs} directorios`;
    }
  }
];

// Ejecutar todos los tests
let passedTests = 0;
let failedTests = 0;

for (let i = 0; i < tests.length; i++) {
  const test = tests[i];
  const testNumber = `${i + 1}/${tests.length}`;
  
  try {
    console.log(`🔍 [${testNumber}] ${test.name}...`);
    const result = test.test();
    console.log(`✅ [${testNumber}] EXITOSO: ${result}\n`);
    passedTests++;
  } catch (error) {
    console.log(`❌ [${testNumber}] FALLIDO: ${error.message}\n`);
    failedTests++;
  }
}

// Resumen final
console.log('📊 RESUMEN DE VALIDACIÓN:');
console.log(`• Tests exitosos: ${passedTests}`);
console.log(`• Tests fallidos: ${failedTests}`);
console.log(`• Total ejecutados: ${tests.length}`);

if (failedTests === 0) {
  console.log('\n🎉 ¡VALIDACIÓN COMPLETADA EXITOSAMENTE!');
  console.log('✅ Es seguro proceder con la eliminación definitiva de _deprecated/');
  process.exit(0);
} else {
  console.log('\n⚠️  SE DETECTARON PROBLEMAS');
  console.log('❌ NO ES SEGURO proceder hasta resolver los errores');
  process.exit(1);
} 