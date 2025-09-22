const fs = require('fs');
const file = 'src/utils/cleanVertexResponse.ts';
let content = fs.readFileSync(file, 'utf8');

// Buscar la línea problemática y arreglarla
// La línea 132 tiene código mezclado: map((r: any) => formatRedFlag(r)) return ...
// Necesitamos limpiar todo el bloque de mapeo de red flags

// Primero, encontrar el bloque problemático
const lines = content.split('\n');
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const red = rfIn.map')) {
    startIdx = i;
    // Buscar el final del bloque (siguiente declaración const o return)
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim().startsWith('const ') || 
          lines[j].trim().startsWith('return ') ||
          lines[j].includes('})')) {
        endIdx = j;
        break;
      }
    }
    break;
  }
}

if (startIdx !== -1) {
  // Reemplazar todo el bloque problemático con la versión limpia
  lines[startIdx] = '    const red = rfIn.map((r: any) => formatRedFlag(r))';
  
  // Eliminar las líneas extras del código viejo
  if (endIdx > startIdx + 1) {
    lines.splice(startIdx + 1, endIdx - startIdx - 1);
  }
}

content = lines.join('\n');
fs.writeFileSync(file, content);
console.log('✅ Fixed red flag mapping');
