#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patrones para detectar imports no usados
const importPatterns = [
  /import\s+{\s*([^}]+)\s*}\s+from\s+['"][^'"]+['"];?/g,
  /import\s+([^;]+)\s+from\s+['"][^'"]+['"];?/g,
  /import\s+{\s*([^}]+)\s*}\s+from\s+['"][^'"]+['"]\s+as\s+([^;]+);?/g
];

function removeUnusedImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Detectar imports vacíos o con solo espacios
    const emptyImportPattern = /import\s*{\s*}\s+from\s+['"][^'"]+['"];?\n?/g;
    if (emptyImportPattern.test(content)) {
      content = content.replace(emptyImportPattern, '');
      modified = true;
    }
    
    // Detectar imports de React que no se usan
    const reactImportPattern = /import\s+React\s+from\s+['"]react['"];?\n?/g;
    if (reactImportPattern.test(content) && !content.includes('React.')) {
      content = content.replace(reactImportPattern, '');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Encontrar todos los archivos TypeScript/JavaScript
const files = glob.sync('src/**/*.{ts,tsx,js,jsx}');

console.log(`🔍 Processing ${files.length} files...`);

files.forEach(file => {
  removeUnusedImports(file);
});

console.log('✨ Unused imports cleanup completed!'); 