const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';
let content = fs.readFileSync(file, 'utf8');

// Add 'medications' as the FIRST field to check
content = content.replace(
  /const medFields = \[[\s\S]*?\];/,
  `const medFields = [
      'medications',  // THIS IS WHAT VERTEX SENDS
      'medications_reported',
      'current_medications_reported',
      'current_medications_suspected',
      'medical_history_reported',
      'suspected_medications', 
      'current_medications'
    ];`
);

// Fix the extraction logic for the 'medications' field structure
content = content.replace(
  /const medName = [\s\S]*?;/,
  `const medName = med.inferred || med.suspected_medication || 
                            med.likely_medication || med.name || med.medication || '';`
);

fs.writeFileSync(file, content);
console.log('✅ Fixed medications field name');
