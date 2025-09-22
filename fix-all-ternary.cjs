const fs = require('fs');
const file = 'src/utils/cleanVertexResponse.ts';
let content = fs.readFileSync(file, 'utf8');

// Arreglar TODOS los operadores ternarios mal formados
// Patrón: "return r ? : n" debe ser "return r ? `${n} - ${r}` : n"
content = content.replace(/return r \?\s*:\s*n/g, 'return r ? `${n} - ${r}` : n');

// También arreglar el de rationale si aún está mal
content = content.replace(
  /const rationale = .*?\? {2,}: ""/g,
  'const rationale = (x.justificacion || x.rationale) ? ` — ${x.justificacion || x.rationale}` : ""'
);

fs.writeFileSync(file, content);
console.log('✅ Fixed all ternary operator errors');

// Mostrar las líneas corregidas para verificar
const lines = content.split('\n');
console.log('\nLines with ternary operators:');
lines.forEach((line, i) => {
  if (line.includes('?') && line.includes(':')) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
});
