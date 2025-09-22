const fs = require('fs');

// 1. ARREGLAR ClinicalAnalysisResults - Títulos en español
const clinicalFile = 'src/components/ClinicalAnalysisResults.tsx';
let clinicalContent = fs.readFileSync(clinicalFile, 'utf8');

// Traducciones de títulos de secciones
const sectionTranslations = {
  'Alertas Médico-Legales': 'Medical-Legal Alerts',
  'Hallazgos Clínicos': 'Clinical Findings',
  'SÍNTOMAS ACTUALES': 'CURRENT SYMPTOMS',
  'MEDICACIÓN ACTUAL': 'CURRENT MEDICATIONS',
  'Evaluación Física Propuesta': 'Proposed Physical Tests',
  'Factores Psicosociales y Contexto Humano': 'Psychosocial Factors',
  'Agregar item': 'Add item'
};

Object.entries(sectionTranslations).forEach(([spanish, english]) => {
  if (clinicalContent.includes(spanish)) {
    clinicalContent = clinicalContent.replace(new RegExp(spanish, 'g'), english);
    console.log(`✓ Translated: "${spanish}" → "${english}"`);
  }
});

fs.writeFileSync(clinicalFile, clinicalContent);
console.log('✅ Fixed Spanish titles in ClinicalAnalysisResults\n');

// 2. ARREGLAR WorkflowAnalysisTab - onTabChange undefined
const tabFile = 'src/components/WorkflowAnalysisTab.tsx';
let tabContent = fs.readFileSync(tabFile, 'utf8');

// Verificar que onTabChange esté en las props y sea del tipo correcto
if (!tabContent.includes('onTabChange?:')) {
  console.log('⚠️ onTabChange not in props, adding...');
  tabContent = tabContent.replace(
    'interface WorkflowAnalysisTabProps {',
    'interface WorkflowAnalysisTabProps {\n  onTabChange?: (tab: string) => void;'
  );
}

// Asegurar que se desestructura de las props
const exportLine = 'export function WorkflowAnalysisTab({';
const propsMatch = tabContent.indexOf(exportLine);
if (propsMatch !== -1) {
  const endOfProps = tabContent.indexOf('}: WorkflowAnalysisTabProps', propsMatch);
  const propsSection = tabContent.substring(propsMatch, endOfProps);
  
  if (!propsSection.includes('onTabChange')) {
    // Agregar onTabChange a la destructuración
    tabContent = tabContent.replace(
      'export function WorkflowAnalysisTab({',
      'export function WorkflowAnalysisTab({\n  onTabChange,'
    );
    console.log('✓ Added onTabChange to props destructuring');
  }
}

// Cambiar el onClick del botón para usar 'evaluation' como string
tabContent = tabContent.replace(
  /onClick=\{.*?onTabChange.*?\}/g,
  "onClick={() => onTabChange?.('evaluation')}"
);

fs.writeFileSync(tabFile, tabContent);
console.log('✅ Fixed onTabChange in WorkflowAnalysisTab\n');

// 3. VERIFICAR ProfessionalWorkflowPage pasa onTabChange correctamente
const pageFile = 'src/pages/ProfessionalWorkflowPage.tsx';
let pageContent = fs.readFileSync(pageFile, 'utf8');

// Buscar WorkflowAnalysisTab y asegurar que tiene onTabChange
const workflowRegex = /<WorkflowAnalysisTab[\s\S]*?\/>/g;
const matches = pageContent.match(workflowRegex);

if (matches && matches[0]) {
  if (!matches[0].includes('onTabChange')) {
    // Agregar onTabChange prop
    const updated = matches[0].replace(
      '/>',
      '\n          onTabChange={(tab) => setActiveTab(tab as any)}\n        />'
    );
    pageContent = pageContent.replace(matches[0], updated);
    console.log('✓ Added onTabChange prop to WorkflowAnalysisTab in ProfessionalWorkflowPage');
  }
}

fs.writeFileSync(pageFile, pageContent);
console.log('✅ Fixed ProfessionalWorkflowPage\n');

console.log('🎉 All issues should be fixed now!');
