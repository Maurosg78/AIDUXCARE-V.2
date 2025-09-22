const fs = require('fs');
const file = 'src/components/WorkflowAnalysisTab.tsx';
let content = fs.readFileSync(file, 'utf8');

// Spanish to English translations
const translations = {
  'Alertas Médico-Legales': 'Medical-Legal Alerts',
  'Hallazgos Clínicos': 'Clinical Findings',
  'SÍNTOMAS ACTUALES': 'CURRENT SYMPTOMS',
  'MEDICACIÓN ACTUAL': 'CURRENT MEDICATIONS',
  'Evaluación Física Propuesta': 'Proposed Physical Tests',
  'Factores Psicosociales y Contexto Humano': 'Psychosocial Factors',
  'Agregar item': 'Add item',
  'Todo': 'All',
  'Limpiar': 'Clear',
  'Elementos seleccionados': 'Items selected',
  'Selección rápida': 'Quick select',
  'Solo críticos': 'Critical only',
  'sensibilidad': 'sensitivity',
  'especificidad': 'specificity'
};

Object.entries(translations).forEach(([spanish, english]) => {
  content = content.replace(new RegExp(spanish, 'g'), english);
});

fs.writeFileSync(file, content);
console.log('✅ Translated to English');
