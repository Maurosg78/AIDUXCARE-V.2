const fs = require('fs');
const file = 'src/components/WorkflowAnalysisTab.tsx';
let content = fs.readFileSync(file, 'utf8');

// Buscar el último div antes del cierre del componente
const insertPoint = content.lastIndexOf('</div>');

// Agregar el botón
const buttonCode = `
      {/* Botón para proceder a evaluación física */}
      <div className="flex justify-end mt-6 border-t pt-4">
        <button
          onClick={() => onTabChange?.(1)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          Proceed to Physical Evaluation
          <span>→</span>
        </button>
      </div>
`;

content = content.substring(0, insertPoint) + buttonCode + content.substring(insertPoint);

// Agregar prop onTabChange si no existe
if (!content.includes('onTabChange')) {
  content = content.replace(
    'interface WorkflowAnalysisTabProps {',
    'interface WorkflowAnalysisTabProps {\n  onTabChange?: (tab: number) => void;'
  );
  
  content = content.replace(
    'export function WorkflowAnalysisTab({',
    'export function WorkflowAnalysisTab({ onTabChange,'
  );
}

fs.writeFileSync(file, content);
console.log('✅ Botón agregado a WorkflowAnalysisTab');
