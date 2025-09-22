const fs = require('fs');
const path = require('path');

// Files that might have hardcoded Spanish
const files = [
  'src/services/responseParser.ts',
  'src/utils/cleanVertexResponse.ts',
  'src/components/WorkflowAnalysisTab.tsx'
];

const replacements = {
  'Evaluación neurológica urgente': 'Urgent neurological evaluation',
  'Descartar síndrome de cauda equina': 'Rule out cauda equina syndrome',
  'Test de Tinetti': 'Tinetti Balance Test',
  'Cuantificar riesgo de caídas': 'Quantify fall risk',
  'Evaluación fuerza MMII': 'Lower limb strength evaluation',
  'Documentar déficit motor': 'Document motor deficit',
  'RMN lumbar urgente': 'Urgent lumbar MRI',
  'Confirmar compresión nerviosa': 'Confirm nerve compression',
  'Estenosis de canal lumbar severa': 'Severe lumbar canal stenosis',
  'Síndrome de cauda equina (URGENTE descartar)': 'Cauda equina syndrome (URGENT rule out)',
  'Radiculopatía lumbar': 'Lumbar radiculopathy'
};

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    Object.entries(replacements).forEach(([spanish, english]) => {
      content = content.replace(new RegExp(spanish, 'g'), english);
    });
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed ${file}`);
  }
});
