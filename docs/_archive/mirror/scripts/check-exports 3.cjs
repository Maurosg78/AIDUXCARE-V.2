#!/usr/bin/env node

/**
 * Script para verificar exports de componentes
 * Uso: node scripts/check-exports.cjs
 */

const fs = require('fs');
const path = require('path');

console.log('=== VERIFICACIÓN DE EXPORTS ===');

const filesToCheck = [
  'src/pages/WelcomePage.tsx',
  'src/pages/LoginPage.tsx',
  'src/pages/RegistrationSuccessPage.tsx',
  'src/pages/DebugPage.tsx',
  'src/features/command-center/CommandCenterPage.tsx',
  'src/pages/ProfessionalWorkflowPage.tsx',
  'src/components/AuthGuard.tsx'
];

console.log('Verificando exports...\n');

filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let hasDefaultExport = false;
    let hasNamedExport = false;
    let componentName = '';
    
    for (const line of lines) {
      if (line.includes('export default')) {
        hasDefaultExport = true;
      }
      if (line.includes('export const') || line.includes('export function')) {
        hasNamedExport = true;
        // Extraer nombre del componente
        const match = line.match(/export (?:const|function) (\w+)/);
        if (match) {
          componentName = match[1];
        }
      }
    }
    
    const fileName = path.basename(filePath, '.tsx');
    console.log(`${fileName}:`);
    console.log(`  Default export: ${hasDefaultExport ? '✅' : '❌'}`);
    console.log(`  Named export: ${hasNamedExport ? '✅' : '❌'}`);
    if (hasNamedExport && componentName) {
      console.log(`  Component name: ${componentName}`);
    }
    console.log('');
  } else {
    console.log(`${filePath}: ❌ No existe`);
  }
});

console.log('✅ VERIFICACIÓN COMPLETADA');
console.log('📝 Si hay ❌ en Default export, usar import { ComponentName }');
console.log('📝 Si hay ❌ en Named export, usar import ComponentName');
console.log('=============================');
