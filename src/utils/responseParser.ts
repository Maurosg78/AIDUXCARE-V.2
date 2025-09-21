export interface ParsedResponse {
  success: boolean;
  data: any;
  error?: string;
  source?: string;
}

// Función mejorada para reparar JSON malformado o truncado
function tryRepairJSON(jsonString: string): string {
  try {
    JSON.parse(jsonString);
    return jsonString;
  } catch (e) {
    console.log('[Parser] JSON malformado, intentando reparar...');
    
    let fixed = jsonString;
    
    // Si el JSON está truncado (termina abruptamente)
    if (fixed.includes('"Mod') || fixed.includes('"Edu') || fixed.includes('"Apl')) {
      // Buscar el último elemento completo antes del truncamiento
      const lastCompleteQuote = fixed.lastIndexOf('",');
      if (lastCompleteQuote > -1) {
        fixed = fixed.substring(0, lastCompleteQuote + 1);
      }
      
      // Cerrar todas las estructuras abiertas
      const openBrackets = (fixed.match(/\[/g) || []).length;
      const closeBrackets = (fixed.match(/\]/g) || []).length;
      const openBraces = (fixed.match(/\{/g) || []).length;
      const closeBraces = (fixed.match(/\}/g) || []).length;
      
      // Agregar corchetes faltantes
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixed += ']';
      }
      
      // Agregar llaves faltantes
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixed += '}';
      }
    }
    
    // Reparaciones adicionales
    fixed = fixed
      .replace(/(\d)(\s*\n\s*")/g, '$1,$2')
      .replace(/}(\s*")/g, '},$1')
      .replace(/](\s*")/g, '],$1')
      .replace(/(true|false)(\s*")/g, '$1,$2')
      .replace(/"score":\s*([\d.]+)(\s*\n\s*")/g, '"score": $1,$2');

    // Eliminar comas finales antes de cerrar llaves o corchetes
    fixed = fixed.replace(/,\s*}/g, "}");
    fixed = fixed.replace(/,\s*]/g, "]");
    
    // Eliminar comas múltiples consecutivas
    fixed = fixed.replace(/,{2,}/g, ",");    
    return fixed;
  }
}

// Función para extraer datos parciales si el JSON está muy dañado
function extractPartialData(text: string): any {
  const data: any = {
    motivo_consulta: "",
    hallazgos_relevantes: [],
    diagnosticos_probables: [],
    red_flags: [],
    evaluaciones_fisicas_sugeridas: [],
    plan_tratamiento_sugerido: []
  };
  
  try {
    // Extraer motivo_consulta
    const motivoMatch = text.match(/"motivo_consulta":\s*"([^"]+)"/);
    if (motivoMatch) data.motivo_consulta = motivoMatch[1];
    
    // Extraer hallazgos_relevantes
    const hallazgosMatch = text.match(/"hallazgos_relevantes":\s*\[([\s\S]*?)\]/);
    if (hallazgosMatch) {
      const items = hallazgosMatch[1].match(/"([^"]+)"/g);
      if (items) {
        data.hallazgos_relevantes = items.map(item => item.replace(/"/g, ''));
      }
    }
    
    // Extraer diagnosticos_probables
    const diagMatch = text.match(/"diagnosticos_probables":\s*\[([\s\S]*?)\]/);
    if (diagMatch) {
      const items = diagMatch[1].match(/"([^"]+)"/g);
      if (items) {
        data.diagnosticos_probables = items.map(item => item.replace(/"/g, ''));
      }
    }
    
    // Extraer evaluaciones físicas (pueden ser objetos)
    const evalMatch = text.match(/"evaluaciones_fisicas_sugeridas":\s*\[([\s\S]*?)(?:\]|$)/);
    if (evalMatch) {
      const testMatches = evalMatch[1].match(/\{[^}]*"test":\s*"([^"]+)"[^}]*\}/g);
      if (testMatches) {
        data.evaluaciones_fisicas_sugeridas = testMatches.map(match => {
          const testName = match.match(/"test":\s*"([^"]+)"/);
          return testName ? testName[1] : "Test físico";
        });
      }
    }
    
    console.log('[Parser] Datos parciales extraídos:', data);
    return data;
    
  } catch (err) {
    console.error('[Parser] Error extrayendo datos parciales:', err);
    return data;
  }
}

export function parseVertexResponse(response: any): ParsedResponse {
  console.log('[Parser] Input type:', typeof response);
  console.log('[Parser] Input keys:', response ? Object.keys(response) : 'null');
  
  try {
    let data = null;
    let source = 'unknown';
    
    if (response && typeof response === 'object' && response.motivo_consulta !== undefined) {
      console.log('[Parser] Already parsed object');
      return { success: true, data: response, source: 'already-parsed' };
    }
    
    let textToParse = '';
    
    if (typeof response === 'string') {
      textToParse = response;
      source = 'direct-string';
    }
    else if (response?.text && typeof response.text === 'string') {
      textToParse = response.text;
      source = 'text-field';
    }
    else if (response?.vertexRaw?.candidates?.[0]?.content?.parts?.[0]?.text) {
      textToParse = response.vertexRaw.candidates[0].content.parts[0].text;
      source = 'vertex-raw';
    }
    else if (response?.result && typeof response.result === 'string') {
      textToParse = response.result;
      source = 'result-field';
    }
    
    if (textToParse) {
      console.log('[Parser] Attempting to parse from', source);
      
      // Intentar parsear normalmente
      try {
        const repaired = tryRepairJSON(textToParse);
        data = JSON.parse(repaired);
        console.log('[Parser] Successfully parsed after repair');
      } catch (parseError) {
        console.warn('[Parser] Parse failed even after repair, extracting partial data');
        // Si falla incluso después de reparar, extraer datos parciales
        data = extractPartialData(textToParse);
        source = 'partial-extraction';
      }
      
      return { success: true, data, source };
    }
    
    console.log('[Parser] Unrecognized response format');
    return { 
      success: false, 
      data: null, 
      error: 'Unrecognized response format',
      source: 'unknown'
    };
    
  } catch (error: any) {
    console.error('[Parser] Error:', error.message);
    console.error('[Parser] Failed input:', response);
    return { 
      success: false, 
      data: null, 
      error: error.message,
      source: 'parse-error'
    };
  }
}

export function validateClinicalSchema(data: any): boolean {
  const requiredFields = [
    'motivo_consulta',
    'hallazgos_relevantes',
    'diagnosticos_probables',
    'red_flags',
    'evaluaciones_fisicas_sugeridas'
  ];
  
  for (const field of requiredFields) {
    if (!(field in data)) {
      console.warn(`[Validator] Missing required field: ${field}`);
      return false;
    }
  }
  
  return true;
}
