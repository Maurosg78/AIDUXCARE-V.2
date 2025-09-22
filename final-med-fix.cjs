const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';
let content = fs.readFileSync(file, 'utf8');

// Add current_medications_suspected to the list
content = content.replace(
  "'medical_history_reported',",
  "'current_medications_suspected',  // THIS IS WHAT VERTEX SENDS\n      'medical_history_reported',"
);

fs.writeFileSync(file, content);
console.log('✅ Added current_medications_suspected field');
