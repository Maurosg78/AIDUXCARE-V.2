const functions = require('firebase-functions');
const { GoogleAuth } = require('google-auth-library');

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

exports.processWithVertexAI = functions.https.onCall(async (data, context) => {
  // No requiere autenticación por ahora para simplificar
  const { prompt } = data;
  
  if (!prompt) {
    throw new functions.https.HttpsError('invalid-argument', 'Prompt requerido');
  }

  try {
    console.log("Body recibido:", JSON.stringify(req.body).substring(0, 200));    const client = await auth.getClient();
    const token = await client.getAccessToken();
    
    const response = await fetch(
      'https://us-central1-aiplatform.googleapis.com/v1/projects/aiduxcare-v2-uat-dev/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
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
    return {
      text: result.candidates?.[0]?.content?.parts?.[0]?.text || '',
      usage: result.usageMetadata
    };
  } catch (error) {
    console.error('Error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Función HTTP con CORS para el frontend
exports.vertexAIProxy = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    console.log("Body recibido:", JSON.stringify(req.body).substring(0, 200));    const { text, prompt } = req.body;
    const fullPrompt = prompt ? `${prompt}. Texto: ${text}` : `Analiza este texto clínico y extrae: condiciones, síntomas, medicamentos y tests sugeridos. Texto: ${text}`;
    
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
    console.log("Respuesta de Vertex AI:", responseText.substring(0, 500));    
      entities: entities,
      summary: responseText.substring(0, 200),
      rawResponse: responseText
    });
    
  } catch (error) {
    console.error('Error en vertexAIProxy:', error);
    res.status(500).json({ error: error.message });
  }
});

    res.json({
      entities: entities,
      summary: responseText.substring(0, 200),
      rawResponse: responseText
    });
