export interface ParsedResponse {
  success: boolean;
  data: any;
  error?: string;
  source?: string;
}

// Función para intentar reparar JSON malformado
function tryRepairJSON(jsonString: string): string {
  try {
    JSON.parse(jsonString);
    return jsonString;
  } catch (e) {
    console.log("[Parser] JSON malformado, intentando reparar...");
    let fixed = jsonString.replace(/(\d)(\s*\n\s*")/g, "$1,$2");
    fixed = fixed.replace(/}(\s*")/g, "},$1");
    fixed = fixed.replace(/](\s*")/g, "],$1");
    fixed = fixed.replace(/(true|false)(\s*")/g, "$1,$2");
    fixed = fixed.replace(/"score":\s*([\d.]+)(\s*")/g, "\"score\": $1,$2");
    return fixed;
  }
}
// Función para intentar reparar JSON malformado
function tryRepairJSON(jsonString: string): string {
  try {
    JSON.parse(jsonString);
    return jsonString;
  } catch (e) {
    console.log("[Parser] JSON malformado, intentando reparar...");
    let fixed = jsonString.replace(/(\d)(\s*\n\s*")/g, "$1,$2");
    fixed = fixed.replace(/}(\s*")/g, "},$1");
    fixed = fixed.replace(/](\s*")/g, "],$1");
    fixed = fixed.replace(/(true|false)(\s*")/g, "$1,$2");
    fixed = fixed.replace(/"score":\s*([\d.]+)(\s*")/g, ""score": $1,$2");
    return fixed;
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
    
    if (typeof response === 'string') {
      console.log('[Parser] Parsing string response');
      data = JSON.parse(tryRepairJSON(response));
      source = 'direct-string';
    }
    else if (response?.text && typeof response.text === 'string') {
      console.log('[Parser] Parsing response.text field');
      data = JSON.parse(tryRepairJSON(response.text));
      source = 'text-field';
    }
    else if (response?.vertexRaw?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('[Parser] Parsing vertexRaw structure');
      const rawText = response.vertexRaw.candidates[0].content.parts[0].text;
      data = JSON.parse(tryRepairJSON(rawText));
      source = 'vertex-raw';
    }
    else if (response?.result && typeof response.result === 'string') {
      console.log('[Parser] Parsing response.result');
      data = JSON.parse(tryRepairJSON(response.result));
      source = 'result-field';
    }
    else if (response?.data) {
      console.log('[Parser] Using response.data');
      data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      source = 'data-field';
    }
    
    if (!data) {
      throw new Error('No valid data found in response');
    }
    
    const hasExpectedStructure = 
      data.motivo_consulta !== undefined ||
      data.hallazgos_relevantes !== undefined ||
      data.diagnosticos_probables !== undefined;
    
    if (!hasExpectedStructure) {
      console.warn('[Parser] Parsed data lacks expected structure:', data);
    }
    
    console.log('[Parser] Success from source:', source);
    return { success: true, data, source };
    
  } catch (error) {
    console.error('[Parser] Error:', error);
    console.error('[Parser] Failed input:', response);
    
    return { 
      success: false, 
      data: null, 
      error: error.message,
      source: 'error'
    };
  }
}

export function validateClinicalSchema(data: any): boolean {
  const requiredFields = [
    'motivo_consulta',
    'hallazgos_relevantes', 
    'diagnosticos_probables',
    'red_flags',
    'evaluaciones_fisicas_sugeridas',
    'plan_tratamiento_sugerido'
  ];
  
  return requiredFields.every(field => field in data);
}
