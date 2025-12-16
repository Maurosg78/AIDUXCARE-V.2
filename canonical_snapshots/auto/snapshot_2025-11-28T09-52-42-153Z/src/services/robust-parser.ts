// @ts-nocheck
export class RobustParser {
  static parse(vertexResponse: string): any {
    const result = {
      entities: [],
      redFlags: [],
      yellowFlags: [],
      summary: '',
      isValid: false,
      parseErrors: []
    };

    try {
      let cleanResponse = vertexResponse;
      if (vertexResponse.includes('```json')) {
        cleanResponse = vertexResponse.split('```json')[1].split('```')[0];
      } else if (vertexResponse.includes('```')) {
        cleanResponse = vertexResponse.split('```')[1].split('```')[0];
      }
      
      const jsonData = JSON.parse(cleanResponse);
      result.isValid = true;
      
      // Extraer entidades
      let idCounter = 1;
      const symptoms = jsonData.sintomas_principales || [];
      symptoms.forEach(s => {
        result.entities.push({
          id: `symptom-${idCounter++}`,
          text: s,
          type: 'symptom',
          clinicalRelevance: 'high'
        });
      });
      
      const conditions = jsonData.condiciones_medicas || [];
      conditions.forEach(c => {
        result.entities.push({
          id: `condition-${idCounter++}`,
          text: c,
          type: 'condition',
          clinicalRelevance: 'high'
        });
      });
      
      const medications = jsonData.medicamentos || [];
      medications.forEach(m => {
        result.entities.push({
          id: `med-${idCounter++}`,
          text: typeof m === 'string' ? m : m.nombre,
          type: 'medication',
          clinicalRelevance: 'medium'
        });
      });
      
      // Extraer flags
      const flags = jsonData.banderas_rojas || [];
      flags.forEach(flag => {
        result.redFlags.push({
          pattern: flag.tipo || flag,
          action: flag.accion || 'Evaluar derivación',
          urgency: flag.urgencia || 'high'
        });
      });
      
      result.yellowFlags = jsonData.banderas_amarillas || [];
      result.summary = jsonData.resumen || 'Análisis completado';
      
    } catch (error) {
      result.parseErrors.push(`Error: ${error}`);
      result.entities = [{
        id: 'error-1',
        text: 'Error al procesar',
        type: 'other',
        clinicalRelevance: 'low'
      }];
    }
    
    return result;
  }
}
