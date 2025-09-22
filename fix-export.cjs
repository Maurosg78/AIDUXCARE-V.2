const fs = require('fs');
const file = 'src/utils/cleanVertexResponse.ts';
let content = fs.readFileSync(file, 'utf8');

// Cambiar el export default a export named function
content = content.replace(
  'export default function cleanVertexResponse',
  'export function normalizeVertexResponse'
);

// Si hay otro export default al final, quitarlo
content = content.replace(/\nexport default normalizeVertexResponse;?$/gm, '');

fs.writeFileSync(file, content);
console.log('✅ Fixed export to match import');
