const functions = require('firebase-functions');
const { GoogleAuth } = require('google-auth-library');
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

exports.processWithVertexAI = functions.https.onCall(async (data, context) => {
  const { prompt } = data;
  
  if (!prompt) {
    throw new functions.https.HttpsError('invalid-argument', 'Prompt requerido');
  }
  
  try {
    const client = await auth.getClient();
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
    
    // Parsing simple que funciona
    const entities = [];
    let idCounter = 1;
    const lines = responseText.split('\n');
    
    lines.forEach(line => {
      if (line.includes('**') && line.includes('*')) {
        const match = line.match(/\*\*([^*:]+)/);
        if (match && match[1]) {
          const text = match[1].trim();
          if (text.length > 2) {
            entities.push({
              id: String(idCounter++),
              text: text,
              type: 'clinical',
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
