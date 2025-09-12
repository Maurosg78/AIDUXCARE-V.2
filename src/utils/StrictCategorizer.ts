export class StrictCategorizer {
  // Definiciones estrictas basadas en evidencia
  static readonly TRUE_RED_FLAGS = [
    'suicidal ideation',
    'cauda equina syndrome',
    'suspected fracture',
    'suspected cancer',
    'suspected infection',
    'chest pain',
    'progressive neurological deficit',
    'signs of abuse'
  ];
  
  static readonly TRUE_YELLOW_FLAGS = [
    'depression',
    'anxiety',
    'fear avoidance',
    'catastrophizing',
    'low self-efficacy',
    'social isolation',
    'work dissatisfaction',
    'compensation issues',
    'family problems'
  ];
  
  static categorize(rawResponse: any): any {
    const categorized = {
      redFlags: [],
      entities: [],
      yellowFlags: [],
      physicalTests: [],
      metadata: {
        addedByValidator: [],
        removedByValidator: [],
        recategorized: []
      }
    };
    
    // Procesar red flags estrictamente
    (rawResponse.redFlags || []).forEach((flag: string) => {
      const flagLower = flag.toLowerCase();
      
      if (this.TRUE_RED_FLAGS.some(rf => flagLower.includes(rf))) {
        categorized.redFlags.push(flag);
      } else if (this.TRUE_YELLOW_FLAGS.some(yf => flagLower.includes(yf))) {
        categorized.yellowFlags.push(flag);
        categorized.metadata.recategorized.push(`"${flag}" moved to yellowFlags`);
      } else {
        categorized.metadata.removedByValidator.push(`"${flag}" not a true red flag`);
      }
    });
    
    // Procesar yellow flags estrictamente
    (rawResponse.yellowFlags || []).forEach((flag: string) => {
      const flagLower = flag.toLowerCase();
      
      // Si es síntoma físico, mover a entities
      if (/pain|dizz|confus|weak/i.test(flagLower)) {
        categorized.entities.push({
          type: 'symptom',
          name: flag,
          source: 'recategorized from yellowFlags'
        });
        categorized.metadata.recategorized.push(`"${flag}" moved to symptoms`);
      } else if (this.TRUE_YELLOW_FLAGS.some(yf => flagLower.includes(yf))) {
        categorized.yellowFlags.push(flag);
      }
    });
    
    // Copiar entities sin duplicados
    const seenEntities = new Set();
    (rawResponse.entities || []).forEach((entity: any) => {
      const key = `${entity.type}-${entity.name}`;
      if (!seenEntities.has(key)) {
        categorized.entities.push(entity);
        seenEntities.add(key);
      }
    });
    
    // Agregar tests con evidencia obligatoria
    if (!rawResponse.physicalTests || rawResponse.physicalTests.length === 0) {
      categorized.physicalTests = [
        {
          name: "Timed Up and Go",
          sensitivity: 0.87,
          specificity: 0.87,
          indication: "Fall risk screening",
          source: "Added by validator - no tests provided"
        }
      ];
      categorized.metadata.addedByValidator.push('Default physical tests added');
    } else {
      categorized.physicalTests = rawResponse.physicalTests;
    }
    
    return categorized;
  }
}
