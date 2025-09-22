const fs = require('fs');
const file = 'src/components/WorkflowAnalysisTab.tsx';
let content = fs.readFileSync(file, 'utf8');

// Make checkbox IDs unique by adding section prefix
content = content.replace(
  /id="select-all"/g,
  (match, offset) => {
    // Determine which section based on context
    const before = content.substring(Math.max(0, offset - 200), offset);
    if (before.includes('Alertas')) return 'id="select-all-alerts"';
    if (before.includes('SÍNTOMAS')) return 'id="select-all-symptoms"';
    if (before.includes('Evaluación')) return 'id="select-all-tests"';
    if (before.includes('Psicosocial')) return 'id="select-all-psych"';
    return match;
  }
);

// Fix individual checkbox IDs
content = content.replace(
  /id={`item-\${index}`}/g,
  (match, offset) => {
    const before = content.substring(Math.max(0, offset - 300), offset);
    if (before.includes('redFlags')) return 'id={`alert-${index}`}';
    if (before.includes('hallazgos')) return 'id={`symptom-${index}`}';
    if (before.includes('evaluaciones')) return 'id={`test-${index}`}';
    if (before.includes('psicosocial')) return 'id={`psych-${index}`}';
    return match;
  }
);

fs.writeFileSync(file, content);
console.log('✅ Fixed checkbox IDs');
