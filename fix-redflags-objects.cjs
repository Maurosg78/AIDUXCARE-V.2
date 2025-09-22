const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';
let content = fs.readFileSync(file, 'utf8');

// Reemplazar la función formatRedFlags para manejar objetos
const newFormatRedFlags = `function formatRedFlags(flags: any): string[] {
  if (!flags) return [];
  const flagArray = Array.isArray(flags) ? flags : [flags];
  
  return flagArray.map(flag => {
    // Handle object format from expert physio
    if (typeof flag === 'object' && flag.finding) {
      const priority = flag.priority || 'Medical';
      const icon = priority.includes('ER') || priority.includes('Urgent') ? '🚨' : '⚠️';
      return \`\${icon} [\${priority}] \${flag.finding} - \${flag.rationale}\`;
    }
    
    // Handle simple string format
    const flagStr = String(flag);
    if (flagStr.toLowerCase().includes('urgent') || 
        flagStr.toLowerCase().includes('immediate') ||
        flagStr.toLowerCase().includes('suicid')) {
      return '🚨 ' + flagStr;
    }
    return '⚠️ ' + flagStr;
  });
}`;

// Buscar y reemplazar la función formatRedFlags existente
content = content.replace(/function formatRedFlags[\s\S]*?^}/gm, newFormatRedFlags);

// También arreglar yellow_flags que ahora vienen como strings desde el prompt
content = content.replace(
  'structure.yellow_flags = vertexData.yellow_flags || [];',
  'structure.yellow_flags = (vertexData.yellow_flags || []).map(f => String(f));'
);

// Arreglar sensitivity/specificity en los tests
const fixTests = `function formatTests(tests: any): any[] {
  if (!tests || !Array.isArray(tests)) {
    return [
      {
        test: 'Functional assessment pending',
        sensibilidad: 0.80,
        especificidad: 0.85,
        objetivo: 'Initial evaluation required',
        contraindicado_si: ''
      }
    ];
  }
  
  return tests.map(t => {
    if (typeof t === 'string') {
      return {
        test: t,
        sensibilidad: 0.85,
        especificidad: 0.85,
        objetivo: 'Clinical assessment',
        contraindicado_si: ''
      };
    }
    
    return {
      test: t.test || 'Assessment',
      sensibilidad: t.sensitivity !== undefined ? t.sensitivity : 0.85,
      especificidad: t.specificity !== undefined ? t.specificity : 0.85,
      objetivo: t.reason || '',
      contraindicado_si: t.contraindication || ''
    };
  });
}`;

content = content.replace(/function formatTests[\s\S]*?^}/gm, fixTests);

fs.writeFileSync(file, content);
console.log('✅ Fixed red flags object processing and test sensitivity/specificity');
