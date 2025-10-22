// Canadian JSON Response Parser
export function parseCanadianVertexResponse(response: any) {
  console.log('[Canadian Parser] Processing response:', response);
  
  try {
    // Handle different response formats
    let jsonData = null;
    
    if (typeof response === 'string') {
      // Try to parse JSON from string
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0]);
      }
    } else if (response && typeof response === 'object') {
      jsonData = response;
    }
    
    if (!jsonData) {
      console.error('[Canadian Parser] No JSON data found');
      return null;
    }
    
    // Validate English schema
    const requiredEnglishKeys = [
      'chief_complaint',
      'clinical_findings',
      'physical_assessments_suggested',
      'treatment_plan_suggested'
    ];
    
    const hasEnglishSchema = requiredEnglishKeys.some(key => key in jsonData);
    
    if (hasEnglishSchema) {
      console.log('[Canadian Parser] English schema detected');
      return {
        motivo_consulta: jsonData.chief_complaint || '',
        hallazgos_clinicos: jsonData.clinical_findings || [],
        evaluaciones_fisicas_sugeridas: jsonData.physical_assessments_suggested || [],
        plan_tratamiento_sugerido: jsonData.treatment_plan_suggested || [],
        red_flags: jsonData.red_flags || [],
        yellow_flags: jsonData.yellow_flags || [],
        riesgo_legal: jsonData.legal_risk_assessment || 'bajo',
        ontario_compliance: jsonData.ontario_compliance_notes || ''
      };
    }
    
    console.log('[Canadian Parser] Fallback to original format');
    return jsonData;
    
  } catch (error) {
    console.error('[Canadian Parser] Error:', error);
    return null;
  }
}
