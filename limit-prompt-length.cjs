const fs = require('fs');
const file = 'src/orchestration/prompts/schema-constrained-prompt.ts';
let content = fs.readFileSync(file, 'utf8');

// Add instruction to be concise
const concisePrompt = content.replace(
  'Your assessment:',
  `IMPORTANT: Keep responses concise. Limit to essential information only.
Maximum 10 items per array field. Be brief and clinical.

Your assessment:`
);

fs.writeFileSync(file, concisePrompt);
console.log('✅ Added conciseness instruction to prompt');
