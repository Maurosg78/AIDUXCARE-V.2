const fs = require('fs');
const file = 'src/hooks/useNiagaraProcessor.ts';
let content = fs.readFileSync(file, 'utf8');

// Agregar import del prompt estructurado
const imports = `import { normalizeVertexResponse } from '../utils/cleanVertexResponse';
import { callVertexAI } from '../services/vertex-ai-service-firebase';
import { mapVertexToSpanish } from '../utils/vertexFieldMapper';
import { generateSchemaConstrainedPrompt } from '../orchestration/prompts/schema-constrained-prompt';`;

content = content.replace(
  /import[\s\S]*?from '\.\.\/utils\/vertexFieldMapper';/,
  imports
);

// Cambiar para usar el prompt estructurado
content = content.replace(
  'console.log(\'Processing text with Vertex AI...\');\n      const response = await callVertexAI(text);',
  `console.log('Processing text with Vertex AI...');
      // USAR EL PROMPT ESTRUCTURADO
      const structuredPrompt = generateSchemaConstrainedPrompt(text);
      const response = await callVertexAI(structuredPrompt);`
);

fs.writeFileSync(file, content);
console.log('✅ Refactorizado para usar prompt estructurado');
