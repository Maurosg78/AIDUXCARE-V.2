exports.vertexAIProxy = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    const { text, prompt } = req.body;
    const fullPrompt = `Analiza este texto clínico y extrae: condiciones, síntomas, medicamentos y tests sugeridos. Texto: ${text}`;
    
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    
    const response = await fetch(
      'https://us-central1-aiplatform.googleapis.com/v1/projects/aiduxcare-v2-uat-dev/locations/us-central1/publishers/google/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: fullPrompt }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            topP: 0.8
          }
        })
      }
    );
    
    const result = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // NUEVO PARSING SIMPLE Y EFECTIVO
    const entities = [];
    let idCounter = 1;
    const lines = responseText.split('\n');
    
    lines.forEach(line => {
      // Capturar cualquier línea con formato: *   **Texto:** o *   **Texto (info):**
      if (line.includes('*') && line.includes('**')) {
        // Extraer el texto entre ** **
        const matches = line.match(/\*\*([^*]+)\*\*/);
        if (matches && matches[1]) {
          const itemText = matches[1].replace(/\([^)]*\)/g, '').trim();
          
          // Determinar tipo
          let type = 'other';
          let icon = '📋';
          
          const lowerLine = line.toLowerCase();
          if (lowerLine.includes('dolor') || lowerLine.includes('debilidad') || lowerLine.includes('fatiga') || lowerLine.includes('limitación')) {
            type = 'symptom';
            icon = '⚠️';
          } else if (lowerLine.includes('pregabalina') || lowerLine.includes('paracetamol') || lowerLine.includes('medicamento')) {
            type = 'medication';
            icon = '💊';
          } else if (lowerLine.includes('evaluación') || lowerLine.includes('test')) {
            type = 'test';
            icon = '📋';
          } else {
            type = 'condition';
            icon = '🔍';
          }
          
          if (itemText.length > 2 && !itemText.includes(':')) {
            entities.push({
              id: String(idCounter++),
              text: `${icon} ${itemText}`,
              type: type,
              clinicalRelevance: 'high'
            });
          }
        }
      }
    });
    
    res.json({
      entities: entities,
      summary: responseText.substring(0, 200),
      rawResponse: responseText
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});
