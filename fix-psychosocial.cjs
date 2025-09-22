const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the psychosocial context to exclude age and add real social factors
content = content.replace(
  /contexto_psicosocial:[\s\S]*?\.filter\(Boolean\),/,
  `contexto_psicosocial: (() => {
      const context = [];
      
      // Social history
      if (vertexData.social_history) {
        if (typeof vertexData.social_history === 'string') {
          context.push(...vertexData.social_history.split('. ').filter(s => s.length > 5));
        } else if (typeof vertexData.social_history === 'object') {
          Object.values(vertexData.social_history).forEach(value => {
            if (value && typeof value === 'string') context.push(value);
          });
        }
      }
      
      // Assessment concerns that are psychosocial
      if (vertexData.assessment_and_concerns) {
        vertexData.assessment_and_concerns.forEach((concern: string) => {
          if (concern.toLowerCase().includes('social') || 
              concern.toLowerCase().includes('isolation') ||
              concern.toLowerCase().includes('depression')) {
            context.push(concern);
          }
        });
      }
      
      return context.slice(0, 8);
    })(),`
);

fs.writeFileSync(file, content);
console.log('✅ Fixed psychosocial context');
