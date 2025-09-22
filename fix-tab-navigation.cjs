const fs = require('fs');

// Primero, arreglar ProfessionalWorkflowPage para pasar setActiveTab
const pageFile = 'src/pages/ProfessionalWorkflowPage.tsx';
let pageContent = fs.readFileSync(pageFile, 'utf8');

// Buscar donde se renderiza WorkflowAnalysisTab
const workflowTabRegex = /<WorkflowAnalysisTab[\s\S]*?\/>/;
const match = pageContent.match(workflowTabRegex);

if (match) {
  // Agregar onTabChange prop
  const updated = match[0].replace(
    '/>',
    '\n          onTabChange={(tab) => setActiveTab(tab)}\n        />'
  );
  pageContent = pageContent.replace(match[0], updated);
  fs.writeFileSync(pageFile, pageContent);
  console.log('✅ Added onTabChange to WorkflowAnalysisTab in ProfessionalWorkflowPage');
}

// Ahora arreglar WorkflowAnalysisTab para recibir la prop
const tabFile = 'src/components/WorkflowAnalysisTab.tsx';
let tabContent = fs.readFileSync(tabFile, 'utf8');

// Buscar la interfaz de props
if (!tabContent.includes('onTabChange?:')) {
  // Agregar onTabChange a las props
  tabContent = tabContent.replace(
    'interface WorkflowAnalysisTabProps {',
    'interface WorkflowAnalysisTabProps {\n  onTabChange?: (tab: number) => void;'
  );
  
  // Agregar onTabChange a la destructuración de props
  tabContent = tabContent.replace(
    'export function WorkflowAnalysisTab({',
    'export function WorkflowAnalysisTab({\n  onTabChange,'
  );
  
  fs.writeFileSync(tabFile, tabContent);
  console.log('✅ Added onTabChange prop to WorkflowAnalysisTab interface');
}

console.log('Navigation should now work!');
