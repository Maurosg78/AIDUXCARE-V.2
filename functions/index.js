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
