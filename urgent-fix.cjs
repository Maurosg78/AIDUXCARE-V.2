const fs = require('fs');

// FIX 1: Arreglar el error de age.includes
let mapper = fs.readFileSync('src/utils/vertexFieldMapper.ts', 'utf8');

// Reemplazar la línea problemática que causa el error
mapper = mapper.replace(
  "if (vertexData.age?.includes('84') && allText.includes('muy fuerte'))",
  "if ((vertexData.age === 84 || vertexData.age === '84') && allText.includes('severe'))"
);

// También arreglar para que maneje age como número
mapper = mapper.replace(
  "vertexData.age &&",
  "vertexData.age && String(vertexData.age)"
);

fs.writeFileSync('src/utils/vertexFieldMapper.ts', mapper);

// FIX 2: Cambiar UI a inglés - WorkflowAnalysisTab.tsx
const workflowFile = 'src/components/WorkflowAnalysisTab.tsx';
if (fs.existsSync(workflowFile)) {
  let workflow = fs.readFileSync(workflowFile, 'utf8');
  
  // Cambiar títulos a inglés
  workflow = workflow.replace(/Alertas Médico-Legales/g, 'Medical-Legal Alerts');
  workflow = workflow.replace(/Hallazgos Clínicos/g, 'Clinical Findings');
  workflow = workflow.replace(/SÍNTOMAS ACTUALES/g, 'CURRENT SYMPTOMS');
  workflow = workflow.replace(/MEDICACIÓN ACTUAL/g, 'CURRENT MEDICATIONS');
  workflow = workflow.replace(/Evaluación Física Propuesta/g, 'Proposed Physical Evaluation');
  workflow = workflow.replace(/Factores Psicosociales y Contexto Humano/g, 'Psychosocial Factors and Human Context');
  workflow = workflow.replace(/Agregar item/g, 'Add item');
  workflow = workflow.replace(/Limpiar/g, 'Clear');
  workflow = workflow.replace(/Todo/g, 'All');
  
  fs.writeFileSync(workflowFile, workflow);
}

// FIX 3: Cambiar ProfessionalWorkflowPage.tsx a inglés
const pageFile = 'src/pages/ProfessionalWorkflowPage.tsx';
if (fs.existsSync(pageFile)) {
  let page = fs.readFileSync(pageFile, 'utf8');
  
  page = page.replace(/Flujo de Trabajo Clínico/g, 'Clinical Workflow');
  page = page.replace(/Análisis Inicial/g, 'Initial Analysis');
  page = page.replace(/Evaluación Física/g, 'Physical Evaluation');
  page = page.replace(/Informe SOAP/g, 'SOAP Report');
  page = page.replace(/Contenido de la Consulta/g, 'Consultation Content');
  page = page.replace(/palabras/g, 'words');
  page = page.replace(/Expandir/g, 'Expand');
  page = page.replace(/Grabar/g, 'Record');
  page = page.replace(/Analizar con IA/g, 'Analyze with AI');
  page = page.replace(/créditos disponibles/g, 'credits available');
  page = page.replace(/Consumiendo/g, 'Using');
  page = page.replace(/Restantes/g, 'Remaining');
  
  fs.writeFileSync(pageFile, page);
}

console.log('✅ Fixed age type error and changed UI to English');
