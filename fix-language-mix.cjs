const fs = require('fs');
const file = 'src/components/ClinicalAnalysisResults.tsx';
let content = fs.readFileSync(file, 'utf8');

// Reemplazar texto en español con inglés
const replacements = {
  'Todo': 'All',
  'Limpiar': 'Clear',
  'sensibilidad': 'sensitivity',
  'especificidad': 'specificity'
};

Object.entries(replacements).forEach(([spanish, english]) => {
  content = content.replace(new RegExp(spanish, 'g'), english);
});

fs.writeFileSync(file, content);
console.log('✅ Fixed language mix in ClinicalAnalysisResults');
