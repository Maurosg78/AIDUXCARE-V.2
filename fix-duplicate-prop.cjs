const fs = require('fs');
const file = 'src/pages/ProfessionalWorkflowPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Buscar y eliminar el onTabChange duplicado
// Encontrar el patrón de líneas duplicadas
const duplicatePattern = /onTabChange=\{[^}]+\}\s*\n\s*onTabChange=\{[^}]+\}/g;

if (content.match(duplicatePattern)) {
  // Reemplazar duplicados con solo una instancia
  content = content.replace(duplicatePattern, 'onTabChange={(tab) => setActiveTab(tab as any)}');
  console.log('✅ Removed duplicate onTabChange');
} else {
  // Si no hay duplicados exactos, buscar líneas consecutivas con onTabChange
  const lines = content.split('\n');
  let newLines = [];
  let skipNext = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    
    if (lines[i].includes('onTabChange=') && 
        i + 1 < lines.length && 
        lines[i + 1].includes('onTabChange=')) {
      // Mantener solo la primera línea
      newLines.push(lines[i]);
      skipNext = true;
    } else {
      newLines.push(lines[i]);
    }
  }
  
  content = newLines.join('\n');
  console.log('✅ Fixed duplicate onTabChange lines');
}

fs.writeFileSync(file, content);
