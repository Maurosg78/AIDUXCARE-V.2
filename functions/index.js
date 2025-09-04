const functions = require('firebase-functions');
const { GoogleAuth } = require('google-auth-library');

const PROJECT = 'aiduxcare-v2-uat-dev';
const LOCATION = 'us-central1';
const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });

/**
 * Callable conservado (por compatibilidad)
 */
exports.processWithVertexAI = functions.region(LOCATION).https.onCall(async (data, context) => {
  const { prompt } = data || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new functions.https.HttpsError('invalid-argument', 'Prompt requerido');
  }
  try {
    const client = await auth.getClient();
    const tokenObj = await client.getAccessToken();
    const accessToken = tokenObj?.token || tokenObj;
    if (!accessToken) throw new Error('No se pudo obtener access token');

    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096, topP: 0.8 }
      })
    });

    const result = await r.json();
    return {
      text: result?.candidates?.[0]?.content?.parts?.[0]?.text || '',
      usage: result?.usageMetadata || null,
      signature: 'processWithVertexAI@v1'
    };
  } catch (error) {
    console.error('processWithVertexAI error:', error?.stack || error);
    throw new functions.https.HttpsError('internal', error?.message || 'Unknown error');
  }
});

/**
 * NUEVO vertexAIProxy: passthrough limpio (sin 'entities'), con CORS
 */
exports.vertexAIProxy = functions.region(LOCATION).https.onRequest(async (req, res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  try {
    const { action = 'analyze', prompt, transcript, text, traceId } = req.body || {};
    if (action !== 'analyze') {
      return res.status(400).json({ ok: false, error: 'unsupported_action', action });
    }

    const inputText =
      (typeof prompt === 'string' && prompt.trim()) ||
      (typeof transcript === 'string' && transcript.trim()) ||
      (typeof text === 'string' && text.trim()) ||
      null;

    if (!inputText) {
      return res.status(400).json({ ok: false, error: 'missing_input', message: "Provide 'prompt' or 'transcript' or 'text'." });
    }

    const client = await auth.getClient();
    const tokenObj = await client.getAccessToken();
    const accessToken = tokenObj?.token || tokenObj;
    if (!accessToken) throw new Error('No se pudo obtener access token');

    const payload = {
      contents: [{ role: 'user', parts: [{ text: inputText }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096, response_mime_type: 'application/json' }
    };

    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await r.json();

    return res.status(200).json({
      ok: true,
      signature: 'vertexAIProxy@v1',
      project: PROJECT,
      location: LOCATION,
      model: MODEL,
      traceId: traceId || null,
      text: data?.candidates?.[0]?.content?.parts?.[0]?.text || '',
      vertexRaw: data
    });
  } catch (err) {
    console.error('vertexAIProxy error:', err?.stack || err);
    return res.status(500).json({ ok: false, error: 'vertex_invoke_failed', message: err?.message || 'Unknown error' });
  }
});
