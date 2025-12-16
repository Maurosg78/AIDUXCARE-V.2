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
    
    return fixed;
  }
}

// Función para extraer datos parciales si el JSON está muy dañado
function extractPartialData(text: string): any {
  const emptyPayload = {
    medicolegal_alerts: {
      red_flags: [],
      yellow_flags: [],
      legal_exposure: "low",
      alert_notes: []
    },
    conversation_highlights: {
      chief_complaint: "",
      key_findings: [],
      medical_history: [],
      medications: [],
      summary: ""
    },
    recommended_physical_tests: [],
    biopsychosocial_factors: {
      psychological: [],
      social: [],
      occupational: [],
      protective_factors: [],
      functional_limitations: [],
      patient_strengths: [],
      legal_or_employment_context: []
    }
  };
  
  try {
    const complaintMatch = text.match(/"chief_complaint":\s*"([^"]*)"/i);
    if (complaintMatch) {
      emptyPayload.conversation_highlights.chief_complaint = complaintMatch[1];
    }
    
    const redFlagsMatch = text.match(/"red_flags":\s*\[([\s\S]*?)\]/i);
    if (redFlagsMatch) {
      const items = redFlagsMatch[1].match(/"([^"]+)"/g);
      if (items) {
        emptyPayload.medicolegal_alerts.red_flags = items.map((item) => item.replace(/"/g, ""));
      }
    }
    
    const yellowFlagsMatch = text.match(/"yellow_flags":\s*\[([\s\S]*?)\]/i);
    if (yellowFlagsMatch) {
      const items = yellowFlagsMatch[1].match(/"([^"]+)"/g);
      if (items) {
        emptyPayload.medicolegal_alerts.yellow_flags = items.map((item) => item.replace(/"/g, ""));
      }
    }
    
    const keyFindingsMatch = text.match(/"key_findings":\s*\[([\s\S]*?)\]/i);
    if (keyFindingsMatch) {
      const items = keyFindingsMatch[1].match(/"([^"]+)"/g);
      if (items) {
        emptyPayload.conversation_highlights.key_findings = items.map((item) => item.replace(/"/g, ""));
      }
    }
    
    const medsMatch = text.match(/"medications":\s*\[([\s\S]*?)\]/i);
    if (medsMatch) {
      const items = medsMatch[1].match(/"([^"]+)"/g);
      if (items) {
        emptyPayload.conversation_highlights.medications = items.map((item) => item.replace(/"/g, ""));
      }
    }
    
    const testsMatch = text.match(/"recommended_physical_tests":\s*\[([\s\S]*?)\]/i);
    if (testsMatch) {
      const items = testsMatch[1].match(/"name":\s*"([^"]+)"/gi);
      if (items) {
        emptyPayload.recommended_physical_tests = items.map((match) => {
          const name = match.split(":")[1].replace(/"/g, "").trim();
          return {
            name,
            objective: "",
            region: "",
            rationale: "",
            evidence_level: "emerging"
          };
        });
      }
    }
    
    // Extract biopsychosocial factors
    const extractBiopsychosocialArray = (fieldName: string): string[] => {
      const pattern = new RegExp(`"${fieldName}":\\s*\\[([\\s\\S]*?)\\]`, 'i');
      const match = text.match(pattern);
      if (match) {
        const items = match[1].match(/"([^"]+)"/g);
        if (items) {
          return items.map((item) => item.replace(/"/g, "").trim()).filter(Boolean);
        }
      }
      return [];
    };
    
    emptyPayload.biopsychosocial_factors.psychological = extractBiopsychosocialArray('psychological');
    emptyPayload.biopsychosocial_factors.social = extractBiopsychosocialArray('social');
    emptyPayload.biopsychosocial_factors.occupational = extractBiopsychosocialArray('occupational');
    emptyPayload.biopsychosocial_factors.protective_factors = extractBiopsychosocialArray('protective_factors');
    emptyPayload.biopsychosocial_factors.functional_limitations = extractBiopsychosocialArray('functional_limitations');
    emptyPayload.biopsychosocial_factors.patient_strengths = extractBiopsychosocialArray('patient_strengths');
    emptyPayload.biopsychosocial_factors.legal_or_employment_context = extractBiopsychosocialArray('legal_or_employment_context');
    
    console.log('[Parser] Partial payload extracted:', emptyPayload);
    console.log('[Parser] Biopsychosocial factors extracted:', emptyPayload.biopsychosocial_factors);
    return emptyPayload;
  } catch (err) {
    console.error('[Parser] Error extracting partial payload:', err);
    return emptyPayload;
  }
}

export function parseVertexResponse(response: any): ParsedResponse {
  console.log('[Parser] Input type:', typeof response);
  console.log('[Parser] Input keys:', response ? Object.keys(response) : 'null');
  
  try {
    let data = null;
    let source = 'unknown';
    
    if (response && typeof response === 'object') {
      if (response.error) {
        console.error('[Parser] Vertex returned error payload:', response.error);
        return {
          success: false,
          data: null,
          error: typeof response.error === 'string'
            ? response.error
            : response.error.message || 'Vertex AI error response',
          source: 'vertex-error'
        };
      }
      if (response.motivo_consulta !== undefined) {
        console.log('[Parser] Already parsed legacy object');
        return { success: true, data: response, source: 'already-parsed' };
      }
      if (
        response.medicolegal_alerts ||
        response.conversation_highlights ||
        response.recommended_physical_tests ||
        response.biopsychosocial_factors
      ) {
        console.log('[Parser] Already parsed structured object');
        return { success: true, data: response, source: 'already-parsed-structured' };
      }
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
        // 🧩 Gemini 2.0 Flash: intentar extracción completa de texto plano
        const asTextSource =
          typeof textToParse === 'string' && textToParse.length > 0
            ? textToParse
            : typeof response === 'string'
              ? response
              : JSON.stringify(response ?? '', null, 2);

        const cleanedSource = asTextSource
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();

        const braceStart = cleanedSource.indexOf('{');
        const braceEnd = cleanedSource.lastIndexOf('}');

        if (braceStart !== -1 && braceEnd > braceStart) {
          const candidate = cleanedSource.slice(braceStart, braceEnd + 1);
          try {
            const normalized = candidate
              .replace(/([{,])(\s*)([a-zA-Z0-9_]+)(\s*):/g, '$1"$3":')
              .replace(/'/g, '"');
            const parsedCandidate = JSON.parse(normalized);
            data = parsedCandidate;
            source = 'extracted-json';
            console.log('[Parser] Successfully parsed from extracted JSON block');
          } catch (e2) {
            console.warn('[Parser] Segunda reparación fallida');
          }
        }

        if (!data) {
          // Si falla incluso después de reparar, extraer datos parciales
          data = extractPartialData(textToParse);
          source = 'partial-extraction';
        }
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
    console.error('[Parser] Error:', error?.message || error);
    try {
      const safeDump = (val: any) => {
        if (val == null) return '<undefined>';
        if (typeof val === 'string') return val.slice(0, 2000);
        return JSON.stringify(val, null, 2).slice(0, 2000);
      };
      const safeInput = typeof response !== 'undefined' ? response : '<no response>';
      console.error('[Parser] Failed input:', safeDump(safeInput));
    } catch (logErr) {
      console.error('[Parser] Logging failed:', logErr);
    }

    return { 
      success: false, 
      data: null, 
      error: error?.message || 'Unknown parse error',
      source: 'parse-error'
    };
  }
}

export function validateClinicalSchema(data: any): boolean {
  const requiredFields = [
    'medicolegal_alerts',
    'conversation_highlights',
    'recommended_physical_tests',
    'biopsychosocial_factors'
  ];
  
  for (const field of requiredFields) {
    if (!(field in data)) {
      console.warn(`[Validator] Missing required field: ${field}`);
      return false;
    }
  }
  
  return true;
}
