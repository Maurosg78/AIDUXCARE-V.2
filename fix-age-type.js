const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';
let content = fs.readFileSync(file, 'utf8');

// Arreglar comparación de edad - manejar número o string
content = content.replace(
  /if\s*\(vertexData\.age\?\.includes\(['"]84['"]\)/g,
  'if ((typeof vertexData.age === "string" && vertexData.age.includes("84")) || vertexData.age === 84'
);

// Arreglar cualquier otra comparación de edad problemática
content = content.replace(
  /vertexData\.age\s*&&\s*vertexData\.age\.includes/g,
  'vertexData.age && String(vertexData.age).includes'
);

fs.writeFileSync(file, content);
console.log('✅ Fixed age type handling');
