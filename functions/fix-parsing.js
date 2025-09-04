    // PARSING ARREGLADO - DEFINIR itemText ANTES DE USARLO
    const entities = [];
    let idCounter = 1;
    const lines = responseText.split('\n');
    
    lines.forEach(line => {
      // Buscar líneas con formato: *   **Texto:** o *   **Texto (info):**
      if (line.includes('*') && line.includes('**')) {
        const matches = line.match(/\*\*([^*]+)\*\*/);
        if (matches && matches[1]) {
          // AQUÍ DEFINIMOS itemText
          const itemText = matches[1].replace(/\([^)]*\)/g, '').replace(':', '').trim();
          
          let type = 'condition';
          let icon = '🔍';
          
          const lowerText = itemText.toLowerCase();
          if (lowerText.includes('dolor') || lowerText.includes('debilidad') || lowerText.includes('fatiga') || lowerText.includes('limitación')) {
            type = 'symptom';
            icon = '⚠️';
          } else if (lowerText.includes('pregabalina') || lowerText.includes('paracetamol') || lowerText.includes('medicamento')) {
            type = 'medication';
            icon = '��';
          } else if (lowerText.includes('evaluación') || lowerText.includes('test') || lowerText.includes('análisis')) {
            type = 'test';
            icon = '📋';
          }
          
          if (itemText.length > 2 && !itemText.includes(':')) {
            entities.push({
              id: String(idCounter++),
              text: icon + ' ' + itemText,
              type: type,
              clinicalRelevance: 'high'
            });
          }
        }
      }
    });
