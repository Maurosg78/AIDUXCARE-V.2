const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

// Configuración
const LOCATION = 'northamerica-northeast1';
const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

// Definir secret para API key
const openaiApiKey = defineSecret('OPENAI_API_KEY');

/**
 * Cloud Function para transcribir audio usando OpenAI Whisper API
 * 
 * Resuelve el problema de CORS al llamar desde el navegador.
 * La API key se almacena de forma segura en Firebase Functions Secrets.
 */
exports.whisperProxy = onCall(
  {
    region: LOCATION,
    timeoutSeconds: 300, // 5 minutos para audio largo
    memory: '512MiB',
    cors: true,
    secrets: [openaiApiKey]
  },
  async (request) => {
    const startTime = Date.now();
    const userId = request.auth?.uid || 'anonymous';
    
    console.log(`[whisperProxy] Request from user: ${userId}`);
    console.log(`[whisperProxy] Request data keys:`, Object.keys(request.data || {}));

    try {
      // Validar datos de entrada
      // ✅ IMPORTANTE: El parámetro se llama 'audioBase64' (no 'audio')
      if (!request.data || !request.data.audioBase64) {
        throw new HttpsError(
          'invalid-argument',
          'audioBase64 is required and must be a string'
        );
      }
      
      // Validar que audioBase64 es un string
      if (typeof request.data.audioBase64 !== 'string') {
        throw new HttpsError(
          'invalid-argument',
          'audioBase64 must be a string'
        );
      }

      // Obtener API key de Firebase Functions Secrets
      const OPENAI_API_KEY = openaiApiKey.value();
      
      if (!OPENAI_API_KEY) {
        console.error('[whisperProxy] OpenAI API key not configured');
        throw new HttpsError(
          'failed-precondition',
          'OpenAI API key is not configured. Please contact support.'
        );
      }

      console.log(`[whisperProxy] API Key status: ${OPENAI_API_KEY ? `Present (${OPENAI_API_KEY.length} chars, starts with: ${OPENAI_API_KEY.substring(0, 10)}...)` : 'MISSING'}`);

      // Decodificar audio base64
      let audioBuffer;
      try {
        const base64Audio = request.data.audioBase64;  // ✅ Nombre correcto: audioBase64
        audioBuffer = Buffer.from(base64Audio, 'base64');
        console.log(`[whisperProxy] Audio buffer size: ${audioBuffer.length} bytes`);
      } catch (error) {
        console.error('[whisperProxy] Error decoding base64:', error);
        throw new HttpsError(
          'invalid-argument',
          'Error al decodificar el audio. Asegúrese de que el audio esté en formato base64 válido.'
        );
      }

      // Validar tamaño de archivo (máximo 25MB para Whisper)
      const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
      if (audioBuffer.length > MAX_FILE_SIZE) {
        throw new HttpsError(
          'invalid-argument',
          `El archivo de audio es demasiado grande (${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB). El máximo permitido es 25 MB.`
        );
      }

      // Preparar parámetros
      const model = request.data.model || 'gpt-4o-mini-transcribe';
      const language = request.data.language || 'auto';
      const mimeType = request.data.mimeType || 'audio/webm';

      console.log(`[whisperProxy] Transcription params:`, {
        model,
        language,
        mimeType,
        audioSize: `${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB`
      });

      // Determinar extensión de archivo basada en MIME type
      let fileExtension = 'webm';
      if (mimeType.includes('mp4')) fileExtension = 'mp4';
      else if (mimeType.includes('mpeg')) fileExtension = 'mp3';
      else if (mimeType.includes('wav')) fileExtension = 'wav';
      else if (mimeType.includes('ogg')) fileExtension = 'ogg';

      // Crear FormData para la petición a OpenAI
      const FormData = require('form-data');
      const formData = new FormData();
      
      formData.append('file', audioBuffer, {
        filename: `audio.${fileExtension}`,
        contentType: mimeType
      });
      formData.append('model', model);
      
      if (language && language !== 'auto') {
        formData.append('language', language);
      }

      // Prompt clínico optimizado
      const prompt = 'This is a clinical conversation between a healthcare professional and a patient. Transcribe accurately, preserving medical terminology, anatomical terms, and clinical details.';
      formData.append('prompt', prompt);

      // Llamar a la API de OpenAI
      const fetch = require('node-fetch');
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          ...formData.getHeaders()
        },
        body: formData,
        timeout: 300000 // 5 minutos
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[whisperProxy] Whisper API error: ${response.status}`, errorBody);
        console.error(`[whisperProxy] Request details:`, {
          model,
          language,
          audioSize: audioBuffer.length,
          mimeType
        });

        let errorMessage = 'Error al transcribir el audio';
        
        if (response.status === 401) {
          errorMessage = 'OpenAI API key is invalid or expired. Please contact support.';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again in a few moments.';
        } else if (response.status === 413) {
          errorMessage = 'El archivo de audio es demasiado grande. El máximo permitido es 25 MB.';
        } else {
          try {
            const errorJson = JSON.parse(errorBody);
            errorMessage = errorJson.error?.message || errorMessage;
            console.error(`[whisperProxy] OpenAI error details:`, errorJson);
          } catch (parseError) {
            console.error(`[whisperProxy] Could not parse error response:`, errorBody);
          }
        }

        throw new HttpsError(
          'internal',
          errorMessage
        );
      }

      const result = await response.json();
      const processingTime = Date.now() - startTime;

      console.log(`[whisperProxy] ✅ Transcription successful: ${result.text?.length || 0} chars in ${processingTime}ms`);

      return {
        text: result.text || '',
        language: result.language || language,
        duration: result.duration || undefined
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[whisperProxy] Error after ${processingTime}ms:`, error);

      // Si ya es un HttpsError, re-lanzarlo
      if (error instanceof HttpsError) {
        throw error;
      }

      // Error genérico
      throw new HttpsError(
        'internal',
        error.message || 'Error al transcribir el audio. Por favor, intente nuevamente.'
      );
    }
  }
);

console.log('[OK] functions/src/whisperProxy.js: whisperProxy ready');
