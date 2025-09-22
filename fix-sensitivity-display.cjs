const fs = require('fs');
const file = 'src/components/ClinicalAnalysisResults.tsx';
let content = fs.readFileSync(file, 'utf8');

// Simplificar la línea 251 que muestra S: y E:
const oldLine = "text={`${i + 1}. ${typeof test === 'string' ? test : (test.name || test.test || 'Test físico')}${(test.sensitivity || test.sensibilidad) ? ` (S: ${Math.round((test.sensitivity || test.sensibilidad) * 100)}%, E: ${Math.round((test.specificity || test.especificidad || 0) * 100)}%)` : ''}`}";

const newLine = "text={`${i + 1}. ${typeof test === 'string' ? test : (test.name || test.test || 'Test')}`}";

content = content.replace(oldLine, newLine);

fs.writeFileSync(file, content);
console.log('✅ Simplified test display (removed mock S/E values)');
