    // Parsing mejorado con tipos específicos
    const entities = [];
    let idCounter = 1;
    
    // Dividir el texto en secciones
    const sections = {
      conditions: [],
      symptoms: [],
      medications: [],
      tests: []
    };
    
    let currentSection = null;
    const lines = responseText.split('\n');
    
    lines.forEach(line => {
      // Detectar sección actual
      if (line.includes('**Condiciones:**')) {
        currentSection = 'conditions';
        return;
      } else if (line.includes('**Síntomas:**')) {
        currentSection = 'symptoms';
        return;
      } else if (line.includes('**Medicamentos:**')) {
        currentSection = 'medications';
        return;
      } else if (line.includes('**Tests') || line.includes('**Evaluac')) {
        currentSection = 'tests';
        return;
      }
      
      // Extraer items de la línea
      if (currentSection && line.includes('**') && line.includes('*')) {
        const match = line.match(/\*\*([^*:]+)/);
        if (match && match[1]) {
          const text = match[1].trim();
          if (text.length > 2) {
            const types = {
              conditions: { type: 'condition', icon: '🔍' },
              symptoms: { type: 'symptom', icon: '⚠️' },
              medications: { type: 'medication', icon: '💊' },
              tests: { type: 'test', icon: '📋' }
            };
            
            const config = types[currentSection] || { type: 'other', icon: '📌' };
            
            entities.push({
              id: String(idCounter++),
              text: config.icon + ' ' + text,
              type: config.type,
              clinicalRelevance: 'high'
            });
          }
        }
      }
    });
