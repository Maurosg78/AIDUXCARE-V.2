export class ResponseValidator {
  static validateAndClean(response: any): any {
    // Eliminar duplicados y reorganizar
    const cleaned = {
      redFlags: [],
      entities: [],
      yellowFlags: [],
      physicalTests: []
    };
    
    // Definir qué es realmente un red flag
    const trueRedFlags = [
      'suicidal ideation',
      'cauda equina',
      'fracture',
      'cancer',
      'infection',
      'chest pain',
      'progressive neurological deficit'
    ];
    
    // Procesar red flags
    if (response.redFlags) {
      response.redFlags.forEach((flag: string) => {
        const flagLower = flag.toLowerCase();
        // Solo incluir si es realmente un red flag
        if (trueRedFlags.some(rf => flagLower.includes(rf))) {
          cleaned.redFlags.push(flag);
        } else {
          // Si no es red flag, podría ser yellow flag
          if (!flagLower.includes('medication') && !flagLower.includes('dizziness')) {
            cleaned.yellowFlags.push(flag);
          }
        }
      });
    }
    
    // Procesar entities sin duplicación
    if (response.entities) {
      const seen = new Set();
      response.entities.forEach((entity: any) => {
        const key = `${entity.type}-${entity.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          cleaned.entities.push(entity);
        }
      });
    }
    
    // Procesar yellow flags sin duplicación
    if (response.yellowFlags) {
      const yellowSet = new Set(cleaned.yellowFlags);
      response.yellowFlags.forEach((flag: string) => {
        // No incluir síntomas físicos en yellow flags
        if (!flag.toLowerCase().includes('dizziness') && 
            !flag.toLowerCase().includes('pain') &&
            !yellowSet.has(flag)) {
          yellowSet.add(flag);
        }
      });
      cleaned.yellowFlags = Array.from(yellowSet);
    }
    
    // Asegurar que hay tests físicos
    if (!response.physicalTests || response.physicalTests.length === 0) {
      cleaned.physicalTests = [
        {
          name: "Timed Up and Go",
          sensitivity: 0.87,
          specificity: 0.87,
          indication: "Fall risk assessment"
        },
        {
          name: "PHQ-9",
          sensitivity: 0.88,
          specificity: 0.88,
          indication: "Depression screening (mandatory with suicidal ideation)"
        },
        {
          name: "Orthostatic Blood Pressure",
          sensitivity: 0.65,
          specificity: 0.92,
          indication: "Assess for orthostatic hypotension"
        }
      ];
    } else {
      cleaned.physicalTests = response.physicalTests;
    }
    
    return cleaned;
  }
}
