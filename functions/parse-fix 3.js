    // Parsear la respuesta para extraer entidades
    const entities = [];
    let idCounter = 1;
    
    // Buscar secciones con formato **Título:**
    const sections = responseText.split(/\*\*([^:]+):\*\*/);
    
    for (let i = 1; i < sections.length; i += 2) {
      const sectionTitle = sections[i].toLowerCase();
      const sectionContent = sections[i + 1] || '';
      
      // Extraer items con formato * **Item:** descripción
      const items = sectionContent.match(/\*\s+\*\*([^:]+)(?:\s*\([^)]*\))?:\*\*\s*([^\n]*)/g) || [];
      
      items.forEach(item => {
        const match = item.match(/\*\s+\*\*([^:]+?)(?:\s*\([^)]*\))?\*\*:\s*(.*)/);
        if (match) {
          const [, name, description] = match;
          
          // Determinar el tipo basado en la sección
          let type = 'other';
          let icon = '📋';
          
          if (sectionTitle.includes('condicion')) {
            type = 'condition';
            icon = '🔍';
          } else if (sectionTitle.includes('síntoma')) {
            type = 'symptom';
            icon = '⚠️';
          } else if (sectionTitle.includes('medicament')) {
            type = 'medication';
            icon = '💊';
          } else if (sectionTitle.includes('test') || sectionTitle.includes('evaluac')) {
            type = 'test';
            icon = '📋';
          }
          
          entities.push({
            id: String(idCounter++),
            text: `${icon} ${name.trim()}`,
            type: type,
            clinicalRelevance: 'high',
            description: description.trim()
          });
        }
      });
    }
    
    // Si no se encontraron entidades con el nuevo formato, intentar formato simple
    if (entities.length === 0) {
      const lines = responseText.split('\n');
      lines.forEach(line => {
        if (line.includes('*') && line.trim().length > 5) {
          const cleanLine = line.replace(/\*/g, '').trim();
          if (cleanLine) {
            entities.push({
              id: String(idCounter++),
              text: cleanLine,
              type: 'other',
              clinicalRelevance: 'high'
            });
          }
        }
      });
    }
