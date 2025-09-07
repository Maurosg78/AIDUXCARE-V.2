    // Parsear la respuesta para extraer entidades
    const entities = [];
    let idCounter = 1;
    
    // Dividir por secciones principales
    const sections = responseText.split(/\*\*([^:*]+):\*\*/);
    
    for (let i = 1; i < sections.length; i += 2) {
      const sectionTitle = sections[i].trim().toLowerCase();
      const sectionContent = sections[i + 1] || '';
      
      // Determinar tipo base según la sección
      let baseType = 'other';
      let baseIcon = '📋';
      
      if (sectionTitle.includes('condicion')) {
        baseType = 'condition';
        baseIcon = '🔍';
      } else if (sectionTitle.includes('síntoma')) {
        baseType = 'symptom';
        baseIcon = '⚠️';
      } else if (sectionTitle.includes('medicament')) {
        baseType = 'medication';
        baseIcon = '💊';
      } else if (sectionTitle.includes('test') || sectionTitle.includes('evaluac')) {
        baseType = 'test';
        baseIcon = '📋';
      }
      
      // Buscar items con formato: *   **Nombre:** Descripción
      const regex = /\*\s+\*\*([^:*]+)\*\*:\s*([^\n]*)/g;
      let match;
      
      while ((match = regex.exec(sectionContent)) !== null) {
        const [, name, description] = match;
        
        entities.push({
          id: String(idCounter++),
          text: `${baseIcon} ${name.trim()}`,
          type: baseType,
          clinicalRelevance: 'high',
          description: description.trim()
        });
      }
    }
    
    console.log(`Parseadas ${entities.length} entidades`);
