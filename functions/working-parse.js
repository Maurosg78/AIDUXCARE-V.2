    // PARSING QUE FUNCIONA
    const entities = [];
    let idCounter = 1;
    
    // Extraer todas las líneas con formato: *   **Texto:**
    const lines = responseText.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/\*\s+\*\*([^:*]+)\*\*/);
      if (match && match[1]) {
        const itemText = match[1].trim();
        
        let type = 'condition';
        let icon = '🔍';
        
        const lowerText = itemText.toLowerCase();
        if (lowerText.includes('dolor') || lowerText.includes('debilidad') || lowerText.includes('fatiga')) {
          type = 'symptom';
          icon = '⚠️';
        } else if (lowerText.includes('pregabalina') || lowerText.includes('paracetamol')) {
          type = 'medication';
          icon = '💊';
        } else if (lowerText.includes('evaluación') || lowerText.includes('test')) {
          type = 'test';
          icon = '📋';
        }
        
        entities.push({
          id: String(idCounter++),
          text: icon + ' ' + itemText,
          type: type,
          clinicalRelevance: 'high'
        });
      }
    });
    
    console.log('Entidades parseadas:', entities.length);
