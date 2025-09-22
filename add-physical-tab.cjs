const fs = require('fs');
const file = 'src/pages/ProfessionalWorkflowPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Check if PhysicalEvaluationTab is imported
if (!content.includes("import { PhysicalEvaluationTab }")) {
  // Add import
  const importPoint = content.indexOf("import { WorkflowAnalysisTab }");
  if (importPoint !== -1) {
    const endOfLine = content.indexOf('\n', importPoint);
    content = content.substring(0, endOfLine) + 
              "\nimport { PhysicalEvaluationTab } from '../components/PhysicalEvaluationTab';" + 
              content.substring(endOfLine);
  }
}

// Check if tab 1 renders PhysicalEvaluationTab
if (!content.includes("activeTab === 1") || !content.includes("PhysicalEvaluationTab")) {
  // Find the tab content area
  const tabContentRegex = /\{activeTab === 0 && [\s\S]*?\}/;
  const match = content.match(tabContentRegex);
  
  if (match) {
    // Add tab 1 content
    const newTabContent = match[0] + `
        {activeTab === 1 && (
          <PhysicalEvaluationTab 
            suggestedTests={analysisResults?.evaluaciones_fisicas_sugeridas || []}
            onComplete={(results) => {
              console.log('Physical tests completed:', results);
              setActiveTab(2); // Go to SOAP
            }}
          />
        )}`;
    content = content.replace(match[0], newTabContent);
  }
}

fs.writeFileSync(file, content);
console.log('✅ PhysicalEvaluationTab added to tab system');
