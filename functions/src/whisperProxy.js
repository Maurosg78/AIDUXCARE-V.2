/**
 * Whisper API Proxy - Cloud Function
 * 
 * Proxies audio transcription requests to OpenAI Whisper API
 * to avoid CORS issues and keep API keys secure on backend.
 * 
 * @author AiduxCare Team
 * @date 2026-01-09
 */

const functions = require('firebase-functions');
const FormData = require('form-data');
const fetch = require('node-fetch');

const LOCATION = 'northamerica-northeast1'; // ✅ CANADÁ (Montreal) - PHIPA compliance

/**
 * Whisper Proxy Cloud Function
 * 
 * Receives audio as base64, converts to multipart/form-data,
 * and forwards to OpenAI Whisper API.
 * 
 * @param {Object} data - Request data
 * @param {string} data.audioBase64 - Audio file as base64 string
 * @param {string} data.mimeType - MIME type of audio (e.g., "audio/webm")
 * @param {string} data.language - Language hint (optional, "auto" by default)
 * @param {Object} context - Firebase callable context
 * @returns {Promise<Object>} Transcription result
 */
exports.whisperProxy = functions.region(LOCATION).https.onCall(async (data, context) => {
  // ============================================
  // 1. AUTHENTICATION CHECK
  // ============================================
  
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to use transcription service'
    );
  }

  const userId = context.auth.uid;
  console.log(`[whisperProxy] Request from user: ${userId}`);

  // ============================================
  // 2. VALIDATE INPUT
  // ============================================
  
  const { audioBase64, mimeType, language = 'auto' } = data || {};

  if (!audioBase64 || typeof audioBase64 !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'audioBase64 is required and must be a string'
    );
  }

  if (!mimeType || typeof mimeType !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'mimeType is required and must be a string'
    );
  }

  // ============================================
  // 3. GET OPENAI API KEY
  // ============================================
  
  const openaiConfig = functions.config().openai;
  const OPENAI_API_KEY = openaiConfig?.key || process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    console.error('[whisperProxy] OpenAI API key not configured');
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Transcription service is not properly configured. Please contact support.'
    );
  }

  // Log key status (without exposing full key)
  console.log(`[whisperProxy] API Key status: ${OPENAI_API_KEY ? `Present (${OPENAI_API_KEY.length} chars, starts with: ${OPENAI_API_KEY.substring(0, 10)}...)` : 'MISSING'}`);

  // ============================================
  // 4. CONVERT BASE64 TO BUFFER
  // ============================================
  
  let audioBuffer;
  try {
    audioBuffer = Buffer.from(audioBase64, 'base64');
    console.log(`[whisperProxy] Audio buffer size: ${audioBuffer.length} bytes`);
  } catch (error) {
    console.error('[whisperProxy] Error decoding base64:', error);
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid base64 audio data'
    );
  }

  // Validate file size (OpenAI limit: 25MB)
  const MAX_SIZE = 25 * 1024 * 1024; // 25MB
  if (audioBuffer.length > MAX_SIZE) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Audio file too large: ${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB. Maximum size is 25MB.`
    );
  }

  // ============================================
  // 5. DETERMINE FILE EXTENSION
  // ============================================
  
  let fileExtension = 'webm'; // default
  if (mimeType.includes('webm')) {
    fileExtension = 'webm';
  } else if (mimeType.includes('mp3')) {
    fileExtension = 'mp3';
  } else if (mimeType.includes('mp4')) {
    fileExtension = 'mp4';
  } else if (mimeType.includes('mpeg')) {
    fileExtension = 'mp3';
  } else if (mimeType.includes('mpga')) {
    fileExtension = 'mp3';
  } else if (mimeType.includes('wav')) {
    fileExtension = 'wav';
  } else if (mimeType.includes('m4a')) {
    fileExtension = 'm4a';
  }

  const filename = `clinical-audio.${fileExtension}`;

  // ============================================
  // 6. PREPARE MULTIPART/FORM-DATA
  // ============================================
  
  const formData = new FormData();
  formData.append('file', audioBuffer, {
    filename: filename,
    contentType: mimeType,
  });
  formData.append('model', 'whisper-1');
  
  if (language && language !== 'auto') {
    formData.append('language', language);
  }

  // ============================================
  // 7. CALL OPENAI WHISPER API
  // ============================================
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
      timeout: 300000, // 5 minutes
    });

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[whisperProxy] Whisper API error: ${response.status}`, errorBody);
      console.error(`[whisperProxy] Request details:`, {
        url: 'https://api.openai.com/v1/audio/transcriptions',
        method: 'POST',
        hasAuthHeader: !!OPENAI_API_KEY,
        keyLength: OPENAI_API_KEY?.length || 0,
        keyPrefix: OPENAI_API_KEY?.substring(0, 10) || 'N/A',
        audioSize: audioBuffer.length,
        mimeType: mimeType
      });
      
      let errorMessage = 'Transcription failed';
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error?.message || errorMessage;
        console.error(`[whisperProxy] OpenAI error details:`, errorJson);
      } catch (e) {
        console.error(`[whisperProxy] Could not parse error response:`, errorBody);
      }

      if (response.status === 401 || response.status === 400) {
        // 400 can also indicate invalid API key
        throw new functions.https.HttpsError(
          'failed-precondition',
          'OpenAI API key is invalid or expired. Please contact support.'
        );
      } else if (response.status === 429) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'OpenAI API rate limit exceeded. Please try again later.'
        );
      } else {
        throw new functions.https.HttpsError(
          'internal',
          `OpenAI API error: ${errorMessage}`
        );
      }
    }

    const result = await response.json();
    console.log(`[whisperProxy] ✅ Transcription successful: ${result.text?.length || 0} chars in ${processingTime}ms`);

    // ============================================
    // 8. RETURN RESULT
    // ============================================
    
    return {
      text: result.text || '',
      language: result.language || language,
      duration: result.duration || null,
      processingTimeMs: processingTime,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[whisperProxy] Error after ${processingTime}ms:`, error);

    // Re-throw HttpsError as-is
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Wrap other errors
    throw new functions.https.HttpsError(
      'internal',
      `Transcription failed: ${error.message || 'Unknown error'}`
    );
  }
});

console.log('[OK] functions/src/whisperProxy.js: whisperProxy ready');

