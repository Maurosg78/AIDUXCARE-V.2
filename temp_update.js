const fs = require('fs');
const content = fs.readFileSync('src/services/vertex-ai-service-firebase.ts', 'utf8');

// Add Canadian parsing logic after the fetch
const updatedContent = content.replace(
  'return r.json();',
  `const rawResponse = await r.json();
  
  // Try Canadian parser first if transcript was provided (Canadian system)
  if (payload.transcript) {
    const canadianResult = parseCanadianVertexResponse(rawResponse);
    if (canadianResult) {
      console.log('[Canadian System] Parsed English response successfully');
      return canadianResult;
    }
  }
  
  return rawResponse;`
);

fs.writeFileSync('src/services/vertex-ai-service-firebase.ts', updatedContent);
