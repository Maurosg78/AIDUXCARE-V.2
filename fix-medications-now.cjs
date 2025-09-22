const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';
let content = fs.readFileSync(file, 'utf8');

// Find the medication mapping section and add current_medications_reported
const medSection = content.indexOf("medicacion_actual: (() => {");
if (medSection > -1) {
  // Replace the possibleFields array to include current_medications_reported FIRST
  content = content.replace(
    /const medFields = \[[\s\S]*?\];/,
    `const medFields = [
      'current_medications_reported',  // THIS IS WHAT VERTEX SENDS NOW
      'current_medications_suspected',
      'medical_history_reported',
      'medications', 
      'suspected_medications', 
      'current_medications',
      'medications_reported'
    ];`
  );
  
  // Fix the extraction logic to handle the structure properly
  content = content.replace(
    /const medName = [\s\S]*?;/,
    `const medName = med.suspected_medication || med.inferred_medication || 
                            med.likely_medication || med.name || med.medication || '';`
  );
}

fs.writeFileSync(file, content);
console.log('✅ Fixed medication field detection');
