const fs = require('fs');
const file = 'src/hooks/useNiagaraProcessor.ts';
let content = fs.readFileSync(file, 'utf8');

// Reemplazar el procesamiento de la respuesta de Vertex
const newProcessing = `      console.log('Raw Vertex response:', response);
      
      // Extract data from response
      let vertexData = response;
      
      // Handle nested text field
      if (response && response.text) {
        vertexData = response.text;
      }
      
      // Try to parse JSON if it's a string
      if (typeof vertexData === 'string') {
        // Check if it looks like JSON
        if (vertexData.trim().startsWith('{')) {
          try {
            // Try to fix truncated JSON
            let jsonStr = vertexData;
            
            // If truncated, try to close it
            if (!jsonStr.trim().endsWith('}')) {
              console.warn('JSON appears truncated, attempting to fix...');
              // Count open braces and close them
              const openBraces = (jsonStr.match(/{/g) || []).length;
              const closeBraces = (jsonStr.match(/}/g) || []).length;
              const openBrackets = (jsonStr.match(/\\[/g) || []).length;
              const closeBrackets = (jsonStr.match(/\\]/g) || []).length;
              
              // Add missing brackets and braces
              jsonStr += '"]'.repeat(Math.max(0, openBrackets - closeBrackets));
              jsonStr += '}'.repeat(Math.max(0, openBraces - closeBraces));
            }
            
            vertexData = JSON.parse(jsonStr);
            console.log('Successfully parsed JSON');
          } catch (e) {
            console.error('Failed to parse JSON:', e);
            // If can't parse, return empty structure
            return normalizeVertexResponse({});
          }
        }
      }`;

// Replace the existing processing
content = content.replace(
  /console\.log\('Raw Vertex response:', response\);[\s\S]*?\/\/ DEBUG COMPLETO/,
  newProcessing + '\n      \n      // DEBUG COMPLETO'
);

fs.writeFileSync(file, content);
console.log('✅ Fixed JSON truncation handling');
