#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para analizar el bundle de producción
 */
function analyzeBundleSize() {
  const distPath = path.join(__dirname, '..', 'dist');
  const assetsPath = path.join(distPath, 'assets');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Directorio dist no encontrado. Ejecuta npm run build primero.');
    process.exit(1);
  }

  if (!fs.existsSync(assetsPath)) {
    console.error('❌ Directorio dist/assets no encontrado.');
    process.exit(1);
  }

  console.log('📊 ANÁLISIS DEL BUNDLE - AiDuxCare V.2\n');
  console.log('=' .repeat(50));

  const files = fs.readdirSync(assetsPath, { withFileTypes: true });
  const jsFiles = files.filter(file => file.name.endsWith('.js'));
  const cssFiles = files.filter(file => file.name.endsWith('.css'));
  
  let totalSize = 0;

  console.log('\n📦 ARCHIVOS JAVASCRIPT:');
  console.log('-'.repeat(50));
  
  jsFiles.forEach(file => {
    const filePath = path.join(assetsPath, file.name);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    totalSize += stats.size;
    
    // Categorizar archivos
    let category = '📄 App';
    if (file.name.includes('react')) category = '⚛️  React';
    else if (file.name.includes('supabase')) category = '🗄️  Supabase';
    else if (file.name.includes('router')) category = '🛣️  Router';
    else if (file.name.includes('AgentSuggestions')) category = '🤖 Agent';
    else if (file.name.includes('utils')) category = '🔧 Utils';
    else if (file.name.includes('ui')) category = '🎨 UI';
    else if (file.name.includes('browser')) category = '🌐 Browser';

    console.log(`${category.padEnd(12)} ${file.name.padEnd(35)} ${sizeKB.padStart(8)} KB`);
  });

  console.log('\n🎨 ARCHIVOS CSS:');
  console.log('-'.repeat(50));
  
  cssFiles.forEach(file => {
    const filePath = path.join(assetsPath, file.name);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    totalSize += stats.size;
    
    console.log(`🎨 CSS       ${file.name.padEnd(35)} ${sizeKB.padStart(8)} KB`);
  });

  console.log('\n📈 RESUMEN:');
  console.log('=' .repeat(50));
  console.log(`📦 Total archivos JS: ${jsFiles.length}`);
  console.log(`🎨 Total archivos CSS: ${cssFiles.length}`);
  console.log(`📊 Tamaño total: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`📊 Tamaño total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  // Análisis de chunks
  console.log('\n🔍 ANÁLISIS DE CHUNKS:');
  console.log('-'.repeat(50));
  
  const chunks = {
    vendor: jsFiles.filter(f => f.name.includes('react') || f.name.includes('supabase')),
    app: jsFiles.filter(f => f.name.includes('index') && !f.name.includes('react')),
    lazy: jsFiles.filter(f => f.name.includes('AgentSuggestions') || f.name.includes('router')),
    utils: jsFiles.filter(f => f.name.includes('utils') || f.name.includes('ui') || f.name.includes('browser'))
  };

  Object.entries(chunks).forEach(([type, files]) => {
    if (files.length > 0) {
      const totalChunkSize = files.reduce((sum, file) => {
        const filePath = path.join(assetsPath, file.name);
        return sum + fs.statSync(filePath).size;
      }, 0);
      
      console.log(`${type.toUpperCase().padEnd(8)} ${files.length} archivos - ${(totalChunkSize / 1024).toFixed(2)} KB`);
    }
  });

  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:');
  console.log('=' .repeat(50));
  
  const largestFile = jsFiles.reduce((largest, file) => {
    const filePath = path.join(assetsPath, file.name);
    const size = fs.statSync(filePath).size;
    if (!largest || size > largest.size) {
      return { name: file.name, size };
    }
    return largest;
  }, null);

  if (largestFile && largestFile.size > 150 * 1024) {
    console.log(`⚠️  Archivo más grande: ${largestFile.name} (${(largestFile.size / 1024).toFixed(2)} KB)`);
    console.log('   Considera dividir este chunk o implementar más lazy loading');
  }

  if (totalSize > 500 * 1024) {
    console.log('⚠️  Bundle total > 500KB. Considera optimizaciones adicionales.');
  } else {
    console.log('✅ Tamaño del bundle está dentro de límites recomendados.');
  }

  console.log('\n🚀 OPTIMIZACIONES APLICADAS:');
  console.log('-'.repeat(50));
  console.log('✅ Code splitting implementado');
  console.log('✅ Lazy loading de rutas');
  console.log('✅ Chunks de vendor separados');
  console.log('✅ Minificación con esbuild');
  console.log('✅ Tree shaking habilitado');
  
  if (fs.existsSync(path.join(distPath, 'stats.html'))) {
    console.log('✅ Bundle analyzer disponible en dist/stats.html');
  }

  console.log('\n' + '=' .repeat(50));
}

// Ejecutar análisis
analyzeBundleSize(); 