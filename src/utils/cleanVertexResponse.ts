export function normalizeVertexResponse(rawResponse: any): any {
  console.log('[Normalizer] Raw input:', rawResponse);
  
  try {
    // Extraer texto si viene envuelto
    let textToParse = rawResponse;
    if (rawResponse?.text && typeof rawResponse.text === 'string') {
      console.log('[Normalizer] Extracting from text property');
      textToParse = rawResponse.text;
    }
    
    // Intentar parsear directamente
    try {
      const parsed = JSON.parse(textToParse);
      console.log('[Normalizer] Successfully parsed:', parsed);
      return {
        redFlags: parsed.redFlags || [],
        entities: parsed.entities || [],
        yellowFlags: parsed.yellowFlags || [],
        physicalTests: parsed.physicalTests || []
      };
    } catch (parseError) {
      console.log('[Normalizer] Direct parse failed, attempting repair');
      
      // Intentar extraer secciones con regex
      const sections = {
        redFlags: [],
        entities: [],
        yellowFlags: [],
        physicalTests: []
      };
      
      // Extraer red flags
      const redFlagsMatch = textToParse.match(/"redFlags"\s*:\s*\[(.*?)\]/s);
      if (redFlagsMatch) {
        const flags = redFlagsMatch[1].match(/"([^"]+)"/g);
        sections.redFlags = flags ? flags.map(f => f.replace(/"/g, '')) : [];
      }
      
      // Extraer entities
      const entitiesMatch = textToParse.match(/"entities"\s*:\s*\[(.*?)\],/s);
      if (entitiesMatch) {
        try {
          sections.entities = JSON.parse('[' + entitiesMatch[1] + ']');
        } catch {
          console.log('[Normalizer] Could not parse entities');
        }
      }
      
      // Extraer yellow flags
      const yellowMatch = textToParse.match(/"yellowFlags"\s*:\s*\[(.*?)\]/s);
      if (yellowMatch) {
        const flags = yellowMatch[1].match(/"([^"]+)"/g);
        sections.yellowFlags = flags ? flags.map(f => f.replace(/"/g, '')) : [];
      }
      
      // Extraer physical tests
      const testsMatch = textToParse.match(/"physicalTests"\s*:\s*\[(.*?)\]/s);
      if (testsMatch) {
        try {
          sections.physicalTests = JSON.parse('[' + testsMatch[1] + ']');
        } catch {
          console.log('[Normalizer] Could not parse physical tests');
        }
      }
      
      console.log('[Normalizer] Extracted sections:', sections);
      return sections;
    }
    
  } catch (error) {
    console.error('[Normalizer] Fatal error:', error);
    return {
      redFlags: [],
      entities: [],
      yellowFlags: [],
      physicalTests: []
    };
  }
}
