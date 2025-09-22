const fs = require('fs');
const file = 'src/utils/cleanVertexResponse.ts';
let content = fs.readFileSync(file, 'utf8');

// Corregir línea 40 - operador ternario mal formado
content = content.replace(
  'const rationale = x.justificacion || x.rationale ?  : ""',
  'const rationale = (x.justificacion || x.rationale) ? ` — ${x.justificacion || x.rationale}` : ""'
);

// Corregir línea 55 - operador ternario incompleto
content = content.replace(
  'return r ?  : n',
  'return r ? `${n} - ${r}` : n'
);

fs.writeFileSync(file, content);
console.log('✅ Fixed ternary operator syntax errors');
