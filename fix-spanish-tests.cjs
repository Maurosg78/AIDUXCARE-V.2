const fs = require('fs');

// Fix responseParser.ts to remove Spanish defaults
const parser = 'src/services/responseParser.ts';
if (fs.existsSync(parser)) {
  let content = fs.readFileSync(parser, 'utf8');
  
  // Replace Spanish diagnoses
  content = content.replace(
    'Estenosis de canal lumbar severa',
    'Severe lumbar canal stenosis'
  );
  content = content.replace(
    'Síndrome de cauda equina (URGENTE descartar)',
    'Cauda equina syndrome (URGENT rule out)'
  );
  content = content.replace(
    'Radiculopatía lumbar L4-L5/L5-S1',
    'Lumbar radiculopathy L4-L5/L5-S1'
  );
  
  fs.writeFileSync(parser, content);
}

// Fix cleanVertexResponse.ts 
const clean = 'src/utils/cleanVertexResponse.ts';
if (fs.existsSync(clean)) {
  let content = fs.readFileSync(clean, 'utf8');
  
  // Search for hardcoded diagnoses and replace
  if (content.includes('diagnosticos_probables:')) {
    content = content.replace(
      /diagnosticos_probables:\s*\[[^\]]*\]/g,
      'diagnosticos_probables: []'
    );
  }
  
  fs.writeFileSync(clean, content);
}

console.log('✅ Removed Spanish hardcoded values');
