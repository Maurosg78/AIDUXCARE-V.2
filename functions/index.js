const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { GoogleAuth } = require('google-auth-library');

const PROJECT = 'aiduxcare-v2-uat-dev';
const LOCATION = 'northamerica-northeast1'; // ✅ CANADÁ (Montreal) - PHIPA compliance
const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });

if (!admin.apps.length) {
  admin.initializeApp();
}

const APP_ALLOWED_ORIGINS = [
  'https://aiduxcare-v2-uat-dev.web.app',
  'https://pilot.aiduxcare.com',
  'https://aiduxcare.com',
];

const maskIdentifierForLog = (value) => {
  if (!value) {
    return 'missing';
  }

  const stringValue = String(value);
  const visiblePrefix = stringValue.slice(0, 4);
  return `${visiblePrefix}...`;
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
};

const resolveCorsOrigin = (req) => {
  const requestOrigin = req.headers.origin || '';
  if (APP_ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }

  return APP_ALLOWED_ORIGINS[0];
};

const applyRestrictedCors = (req, res, methods) => {
  const allowedOrigin = resolveCorsOrigin(req);
  res.set('Access-Control-Allow-Origin', allowedOrigin);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', methods.join(', '));
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.set('Access-Control-Max-Age', '3600');
};

const verifyAuthenticatedRequest = async (req) => {
  const authHeader = req.get('authorization') || '';
  const bearerPrefix = 'Bearer ';
  if (!authHeader.startsWith(bearerPrefix)) {
    return null;
  }

  const token = authHeader.slice(bearerPrefix.length).trim();
  if (!token) {
    return null;
  }

  const decodedToken = await admin.auth().verifyIdToken(token);
  return decodedToken;
};

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
 * Send SMS via Vonage (backend proxy to avoid CORS)
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */
exports.sendConsentSMS = functions.region(LOCATION).https.onRequest(async (req, res) => {
  applyRestrictedCors(req, res, ['POST', 'OPTIONS']);

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const decodedToken = await verifyAuthenticatedRequest(req);
    if (!decodedToken) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const { phone, message, clinicName, patientName, consentToken } = req.body || {};

    if (!phone || !message) {
      return res.status(400).json({ ok: false, error: 'missing_required_fields', message: 'phone and message are required' });
    }

    // Get Vonage credentials from environment
    const VONAGE_API_KEY = functions.config().vonage?.api_key || process.env.VONAGE_API_KEY;
    const VONAGE_API_SECRET = functions.config().vonage?.api_secret || process.env.VONAGE_API_SECRET;
    const VONAGE_FROM_NUMBER = functions.config().vonage?.from_number || process.env.VONAGE_FROM_NUMBER;

    if (!VONAGE_API_KEY || !VONAGE_API_SECRET || !VONAGE_FROM_NUMBER) {
      console.error('[SMS Function] Missing Vonage credentials');
      return res.status(500).json({ ok: false, error: 'configuration_error', message: 'Vonage credentials not configured' });
    }

    // Validate phone number format (E.164)
    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^\+[1-9]\d{1,14}$/.test(cleanPhone)) {
      return res.status(400).json({ ok: false, error: 'invalid_phone_format', message: 'Phone must be in E.164 format' });
    }
    const maskedPhone = `${cleanPhone.slice(0, 4)}***${cleanPhone.slice(-2)}`;

    // Send SMS via Vonage REST API
    const payload = new URLSearchParams({
      api_key: VONAGE_API_KEY,
      api_secret: VONAGE_API_SECRET,
      to: cleanPhone,
      from: VONAGE_FROM_NUMBER,
      text: message,
    });

    // Log credentials status (without exposing secrets)
    console.log('[SMS Function] Vonage config check:', {
      uid: decodedToken.uid,
      apiKeyConfigured: Boolean(VONAGE_API_KEY),
      apiSecret: VONAGE_API_SECRET ? 'SET' : 'MISSING',
      fromNumberConfigured: Boolean(VONAGE_FROM_NUMBER),
      to: maskedPhone,
    });

    const response = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });

    const result = await response.json();
    console.log('[SMS Function] Vonage API response:', {
      status: response.status,
      messageCount: Array.isArray(result.messages) ? result.messages.length : 0,
    });

    // Check Vonage response (status '0' = accepted for delivery; actual delivery may still fail for international numbers)
    if (result.messages && result.messages[0]?.status === '0') {
      const msg = result.messages[0];
      const to = cleanPhone;
      const isInternational = !/^\+1\d{10}$/.test(to.replace(/\s/g, ''));
      if (isInternational) {
        console.warn('[SMS Function] SMS accepted by Vonage for international number:', { to: to.substring(0, 6) + '***', messageId: msg['message-id'] });
      }
      return res.status(200).json({
        ok: true,
        provider: 'vonage',
        messageId: msg['message-id'],
        status: msg.status,
        remainingBalance: msg['remaining-balance'],
      });
    } else {
      // Error from Vonage
      const errorText = result.messages?.[0]?.['error-text'] || result['error-text'] || 'Unknown error';
      const errorCode = result.messages?.[0]?.['status'] || result['error-code'] || 'unknown';
      console.error('[SMS Function] Vonage error:', {
        errorText,
        errorCode,
        hasMessages: Array.isArray(result.messages),
      });

      // Map common Vonage errors to user-friendly messages
      let userMessage = errorText;
      if (errorCode === '2' || errorText.includes('Bad Credentials')) {
        userMessage = 'Invalid Vonage API credentials. Please check your API key and secret.';
      } else if (errorCode === '3' || errorText.includes('Invalid')) {
        userMessage = 'Invalid request parameters. Please check phone number format.';
      }

      return res.status(400).json({
        ok: false,
        error: 'vonage_api_error',
        message: userMessage,
        code: errorCode,
        details: errorText,
      });
    }
  } catch (error) {
    console.error('[SMS Function] Error:', error);
    return res.status(500).json({
      ok: false,
      error: 'internal_error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * ✅ REMOVED: receiveSMS and smsDeliveryReceipt webhook functions
 * These functions were not used in the codebase. If Vonage webhooks are needed in the future,
 * they can be re-added and configured in the Vonage dashboard.
 */

/**
 * NUEVO vertexAIProxy: passthrough limpio (sin 'entities'), con CORS
 */
exports.vertexAIProxy = functions.region(LOCATION).https.onRequest(async (req, res) => {
  applyRestrictedCors(req, res, ['POST', 'OPTIONS']);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  try {
    const decodedToken = await verifyAuthenticatedRequest(req);
    if (!decodedToken) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const { action = 'analyze', prompt, transcript, text, traceId } = req.body || {};
    // WO-IMAGE-OCR-001: Gemini Vision OCR
    if (action === 'image-ocr') {
      const { image, prompt: ocrPrompt } = req.body || {};
      if (!image || !image.data || !image.mimeType) {
        return res.status(400).json({ ok: false, error: 'missing_image' });
      }
      const cl = await auth.getClient();
      const tk = await cl.getAccessToken();
      const at = tk && tk.token ? tk.token : tk;
      const ocrPayload = {
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: image.mimeType, data: image.data } },
          { text: ocrPrompt || 'Extract ALL text from this medical document exactly as written. Return only the extracted text.' }
        ]}],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
      };
      const r2 = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + at, 'Content-Type': 'application/json' },
        body: JSON.stringify(ocrPayload)
      });
      const d2 = await r2.json();
      const txt = (d2 && d2.candidates && d2.candidates[0] && d2.candidates[0].content && d2.candidates[0].content.parts && d2.candidates[0].content.parts[0] && d2.candidates[0].content.parts[0].text) || '';
      if (!txt.trim()) return res.status(422).json({ ok: false, error: 'empty_ocr_result' });
      return res.status(200).json({ ok: true, signature: 'vertexAIProxy@v1', action: 'image-ocr', text: txt });
    }
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

    if (inputText.length > 50000) {
      return res.status(400).json({ ok: false, error: 'input_too_large' });
    }

    const client = await auth.getClient();
    const tokenObj = await client.getAccessToken();
    const accessToken = tokenObj?.token || tokenObj;
    if (!accessToken) throw new Error('No se pudo obtener access token');

    const payload = {
      contents: [{ role: 'user', parts: [{ text: inputText }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 16384, response_mime_type: 'application/json' }
    };

    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [2000, 4000, 8000];
    let r, data;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      r = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await r.json();
      const is429 = r.status === 429 || data?.error?.code === 429;
      if (is429 === false) break;
      if (attempt < MAX_RETRIES) {
        console.warn(`[vertexAIProxy] 429 — retry ${attempt + 1}/${MAX_RETRIES} in ${RETRY_DELAYS[attempt]}ms`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
      } else {
        return res.status(502).json({
          ok: false,
          error: 'vertex_upstream_error',
          message: 'Resource exhausted. Please try again later.',
          code: 429,
          traceId: traceId || null,
        });
      }
    }
    return res.status(200).json({
      ok: true,
      signature: 'vertexAIProxy@v1',
      project: PROJECT,
      location: LOCATION,
      model: MODEL,
      traceId: traceId || null,
      text: data?.candidates?.[0]?.content?.parts?.[0]?.text || '',
    });
  } catch (err) {
    console.error('vertexAIProxy error:', err?.stack || err);
    return res.status(500).json({ ok: false, error: 'vertex_invoke_failed', message: err?.message || 'Unknown error' });
  }
});

console.log("[OK] functions/index.js: vertexAIProxy@v1 ready");

// ===== Validation Wiring v2 (ESM-friendly) =====
// TEMPORARILY DISABLED - Commented out to fix deploy issues
// Will be re-enabled once validation module is properly set up
/*
// Note: Using v1 functions for consistency with existing codebase
// Validation module is optional - skip if not available
const VALIDATION_ENABLED = process.env.VALIDATION_ENABLED === 'true'; // Disabled by default

let __schemasPromise;
function loadSchemas() {
  if (!__schemasPromise) {
    try {
      const { pathToFileURL } = require("url");
      const path = require("path");
      const fs = require("fs");
      const validationPath = path.resolve(__dirname, "../dist/validation/index.cjs");
      
      // Check if file exists before trying to import
      if (!fs.existsSync(validationPath)) {
        return Promise.resolve({});
      }
      
      const fileUrl = pathToFileURL(validationPath).href;
      __schemasPromise = import(fileUrl).catch(() => ({}));
    } catch (e) {
      __schemasPromise = Promise.resolve({});
    }
  }
  return __schemasPromise;
}

if (VALIDATION_ENABLED) {
  try {
    // POST /api/notes -> create (using v1 for consistency)
    exports.apiCreateNote = exports.apiCreateNote || functions.region(LOCATION).https.onRequest(async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
    if (VALIDATION_ENABLED) {
      const { ClinicalNoteSchema } = await loadSchemas().catch((e) => {
        console.error("Validation module load failed:", e && e.message);
        return {};
      });
      if (!ClinicalNoteSchema) return res.status(500).json({ error: "Validation module unavailable" });
      const result = ClinicalNoteSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Validation failed", details: result.error.format() });
      }
      req.body = result.data;
    }
    return res.status(201).json({ ok: true, note: req.body });
  });

  // PUT /api/notes/:id -> update (using v1 for consistency)
  exports.apiUpdateNote = exports.apiUpdateNote || functions.region(LOCATION).https.onRequest(async (req, res) => {
    if (req.method !== "PUT") return res.status(405).send("Method Not Allowed");
    if (VALIDATION_ENABLED) {
      const { ClinicalNoteSchema } = await loadSchemas().catch((e) => {
        console.error("Validation module load failed:", e && e.message);
        return {};
      });
      if (!ClinicalNoteSchema) return res.status(500).json({ error: "Validation module unavailable" });
      const result = ClinicalNoteSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Validation failed", details: result.error.format() });
      }
      req.body = result.data;
    }
    return res.status(200).json({ ok: true, note: req.body });
  });

  // POST /api/notes/:id/sign -> sign (using v1 for consistency)
  exports.apiSignNote = exports.apiSignNote || functions.region(LOCATION).https.onRequest(async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
    if (VALIDATION_ENABLED) {
      const { ClinicalNoteSchema } = await loadSchemas().catch((e) => {
        console.error("Validation module load failed:", e && e.message);
        return {};
      });
      if (!ClinicalNoteSchema) return res.status(500).json({ error: "Validation module unavailable" });
      const result = ClinicalNoteSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Validation failed", details: result.error.format() });
      }
      const note = result.data;
      const soapOk = !!(note.subjective && note.objective && note.assessment && note.plan);
      if (note.status !== 'submitted' || !soapOk) {
        return res.status(400).json({ error: "Cannot sign note", details: { status: "must be 'submitted' with full SOAP" } });
      }
      if (!note.immutable_hash || !note.immutable_signed) {
        return res.status(400).json({ error: "Cannot sign note", details: { immutable: "immutable_hash and immutable_signed required" } });
      }
      req.body = note;
    }
    return res.status(200).json({ ok: true, signed: true });
  });

  // POST /api/audit-logs (using v1 for consistency)
  exports.apiAuditLog = exports.apiAuditLog || functions.region(LOCATION).https.onRequest(async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
    if (VALIDATION_ENABLED) {
      const { AuditLogSchema } = await loadSchemas().catch((e) => {
        console.error("Validation module load failed:", e && e.message);
        return {};
      });
      if (!AuditLogSchema) return res.status(500).json({ error: "Validation module unavailable" });
      const result = AuditLogSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Validation failed", details: result.error.format() });
      }
    }
    return res.status(201).json({ ok: true });
  });

  // POST /api/consents (using v1 for consistency)
  exports.apiConsent = exports.apiConsent || functions.region(LOCATION).https.onRequest(async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
    if (VALIDATION_ENABLED) {
      const { ConsentSchema } = await loadSchemas().catch((e) => {
        console.error("Validation module load failed:", e && e.message);
        return {};
      });
      if (!ConsentSchema) return res.status(500).json({ error: "Validation module unavailable" });
      const result = ConsentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Validation failed", details: result.error.format() });
      }
    }
    return res.status(201).json({ ok: true });
  });

  } catch (e) {
    console.error("Validation wiring v2 failed:", e && e.message);
  }
} else {
  // Validation disabled - export stub functions to prevent errors
  exports.apiCreateNote = exports.apiCreateNote || functions.region(LOCATION).https.onRequest(async (req, res) => {
    return res.status(501).json({ ok: false, error: "Validation API not enabled" });
  });
  exports.apiUpdateNote = exports.apiUpdateNote || functions.region(LOCATION).https.onRequest(async (req, res) => {
    return res.status(501).json({ ok: false, error: "Validation API not enabled" });
  });
  exports.apiSignNote = exports.apiSignNote || functions.region(LOCATION).https.onRequest(async (req, res) => {
    return res.status(501).json({ ok: false, error: "Validation API not enabled" });
  });
  exports.apiAuditLog = exports.apiAuditLog || functions.region(LOCATION).https.onRequest(async (req, res) => {
    return res.status(501).json({ ok: false, error: "Validation API not enabled" });
  });
  exports.apiConsent = exports.apiConsent || functions.region(LOCATION).https.onRequest(async (req, res) => {
    return res.status(501).json({ ok: false, error: "Validation API not enabled" });
  });
}
// ===== End Validation Wiring v2 =====
*/
// ✅ REMOVED: Stub functions (apiCreateNote, apiUpdateNote, apiSignNote, apiAuditLog, apiConsent, apiReferral)
// These functions were not used in the codebase and only returned 501/404 errors.

// Token reset functions are in separate file (monthlyTokenReset.js)
// Firebase will discover them automatically during deployment

/**
 * Data Erasure Endpoint - PIPEDA "Right to be Forgotten"
 * 
 * POST /api/patients/:patientId/erase
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: PIPEDA Principle 4.1.8, PHIPA Section 52
 */
exports.apiErasePatientData = functions.region(LOCATION).https.onRequest(async (req, res) => {
  applyRestrictedCors(req, res, ['POST', 'OPTIONS']);

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const decodedToken = await verifyAuthenticatedRequest(req);
    if (!decodedToken) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const isAdminCaller = decodedToken.admin === true;
    if (!isAdminCaller) {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }

    const db = admin.firestore();
    const storage = admin.storage();

    const patientId = req.body?.patientId || req.query?.patientId || req.params?.patientId;
    const { requestedBy, reason, authorizationProof } = req.body || {};

    if (!patientId) {
      return res.status(400).json({ ok: false, error: 'missing_patient_id' });
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ ok: false, error: 'missing_reason' });
    }

    const requesterUid = decodedToken.uid;

    const deletedCounts = {};
    const deletedCollections = [];

    // Collections to delete from
    const collectionsToDelete = [
      'secureNotes',
      'episodes',
      'patientConsents',
      'treatmentPlans',
    ];

    // Delete from each collection
    for (const collectionName of collectionsToDelete) {
      try {
        const snapshot = await db.collection(collectionName)
          .where('patientId', '==', patientId)
          .get();

        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          deletedCounts[collectionName] = snapshot.size;
          deletedCollections.push(collectionName);
        }
      } catch (error) {
        console.error(`[Erase] Error deleting from ${collectionName}:`, error);
        deletedCounts[collectionName] = 0;
      }
    }

    // Delete patient record
    try {
      const patientRef = db.collection('patients').doc(patientId);
      const patientDoc = await patientRef.get();
      if (patientDoc.exists) {
        await patientRef.delete();
        deletedCounts['patients'] = 1;
        deletedCollections.push('patients');
      }
    } catch (error) {
      console.error('[Erase] Error deleting patient record:', error);
    }

    // Delete storage files
    try {
      const bucket = storage.bucket();
      const [files] = await bucket.getFiles({ prefix: `patients/${patientId}/` });
      let deletedFiles = 0;
      for (const file of files) {
        try {
          await file.delete();
          deletedFiles++;
        } catch (error) {
          console.error(`[Erase] Error deleting file ${file.name}:`, error);
        }
      }
      if (deletedFiles > 0) {
        deletedCounts['storage_files'] = deletedFiles;
      }
    } catch (error) {
      console.error('[Erase] Error deleting storage files:', error);
    }

    // Generate deletion certificate
    const certificateId = `cert-${patientId}-${Date.now()}`;
    const certificate = {
      id: certificateId,
      patientId,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletedBy: requesterUid,
      deletedCollections,
      deletedCounts,
      verificationHash: require('crypto').createHash('sha256')
        .update(`${patientId}-${JSON.stringify(deletedCounts)}-${Date.now()}`)
        .digest('hex'),
      retainedData: {
        auditLogs: true, // Retained for legal compliance
        certificates: true, // Retained for 10 years
      },
    };

    // Store certificate
    await db.collection('deletion_certificates').doc(certificateId).set(certificate);

    // Log erasure event
    await db.collection('audit_logs').add({
      type: 'data_erasure_completed',
      userId: requesterUid,
      userRole: 'HIC',
      patientId,
      metadata: {
        certificateId,
        deletedCounts,
        verificationHash: certificate.verificationHash,
        reason: reason.trim(),
        hasAuthorizationProof: Boolean(authorizationProof),
        requestedByMatchesToken: requestedBy ? requestedBy === requesterUid : true,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      ok: true,
      success: true,
      patientId,
      deletedCollections,
      deletedCounts,
      certificateId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Erase] Error:', error);
    return res.status(500).json({
      ok: false,
      error: 'internal_error',
      message: error.message || 'Unknown error',
    });
  }
});

// Export whisperProxy function
const whisperProxy = require('./src/whisperProxy');
exports.whisperProxy = whisperProxy.whisperProxy;

// ✅ WO-CONSENT-PORTAL-CF-01: Patient Consent Portal Cloud Function
// Public endpoint for secure consent recording from patient portal
const acceptPatientConsentByToken = require('./src/consent/acceptPatientConsentByToken');
exports.acceptPatientConsentByToken = acceptPatientConsentByToken.acceptPatientConsentByToken;

const getConsentStatus = require('./src/consent/getConsentStatus');
exports.getConsentStatus = getConsentStatus.getConsentStatus;

/**
 * Consent verification endpoint (token-based)
 * 
 * Verifies consent token and marks consent as granted (idempotent)
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * 
 * Route: /api/consent/verify?token=...
 * 
 * ✅ CRITICAL: Public access required - patients must access without authentication
 * Note: IAM permissions must be set separately via gcloud to allow public access
 */
exports.apiConsentVerify = functions.region(LOCATION).https.onRequest(async (req, res) => {
  applyRestrictedCors(req, res, ['GET', 'POST', 'OPTIONS']);
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  const token = (req.query?.token || req.body?.token);
  const action = (req.query?.action || req.body?.action || 'accept'); // 'accept' or 'decline'
  const declineReasons = req.body?.declineReasons || null;
  const declineNotes = req.body?.declineNotes || null;
  const consentTextVersion = req.body?.consentTextVersion || '1.0.0';
  const jurisdiction = req.body?.jurisdiction || 'CA-ON';

  if (!token || typeof token !== 'string' || token.trim().length < 10) {
    return res.status(400).json({ ok: false, error: 'missing_or_invalid_token' });
  }

  if (action === 'decline' && (!declineReasons || declineReasons.length === 0)) {
    return res.status(400).json({ ok: false, error: 'decline_reasons_required' });
  }

  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) admin.initializeApp();
    const db = admin.firestore();

    // ✅ T3: Schema real - colección: patient_consent_tokens, campo: token (no consentToken)
    const tokenRef = db.collection('patient_consent_tokens').doc(token.trim());
    const tokenDoc = await tokenRef.get();

    if (!tokenDoc.exists) {
      // No revelar demasiado
      return res.status(404).json({ ok: false, error: 'invalid_or_expired' });
    }

    const data = tokenDoc.data() || {};

    // ✅ T3: Verificar expiry - campo: expiresAt
    const expiresAt = data.expiresAt?.toDate?.() || (data.expiresAt ? new Date(data.expiresAt) : null);
    if (expiresAt && Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ ok: false, error: 'expired' });
    }

    // ✅ T3: Verificar si ya está usado - campo: used
    if (data.used === true) {
      // Idempotente: si ya está otorgado/declinado, responder ok
      const consentGiven = data.consentGiven || {};
      if (consentGiven.scope && consentGiven.scope !== 'declined') {
        return res.status(200).json({ ok: true, alreadyGranted: true, scope: consentGiven.scope });
      }
      if (consentGiven.scope === 'declined') {
        return res.status(200).json({ ok: true, alreadyDeclined: true });
      }
    }

    // Obtener IP y User-Agent
    const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip || '').trim();
    const ua = (req.get('user-agent') || '').slice(0, 200);

    // Determine consent status based on action
    const isDeclined = action === 'decline';
    const consentScope = isDeclined ? 'declined' : 'ongoing';
    const consentStatus = isDeclined ? 'declined' : 'granted';

    // ✅ T3: Marcar como usado y registrar decisión
    await tokenRef.update({
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
      consentGiven: {
        scope: consentScope,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: ip || null,
        userAgent: ua || null,
      },
    });

    // ✅ PHIPA-compliant: Create consent record in patient_consent collection (new schema)
    // This is the canonical collection used by ConsentGateScreen and all consent listeners
    const tokenHash = hashToken(token.trim());
    const consentRecord = {
      patientId: data.patientId,
      patientName: data.patientName,
      professionalId: data.physiotherapistId,
      consentMethod: 'digital',
      consentStatus: consentStatus,
      status: consentStatus, // For query compatibility
      consentTextVersion: consentTextVersion,
      consentDate: admin.firestore.FieldValue.serverTimestamp(),
      consentVersion: '1.0.0',
      jurisdiction: jurisdiction,
      consented: !isDeclined,
      consentScope: consentScope,
      tokenHash,
      ipAddress: ip || null,
      userAgent: ua || null,
      obtainmentMethod: 'SMS',
      ...(isDeclined && {
        declineReasons: Array.isArray(declineReasons) ? declineReasons.join(', ') : declineReasons,
        declineNotes: declineNotes || null,
        declinedAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
    };

    // Write to patient_consent (new canonical collection)
    const consentId = `${data.patientId}_${Date.now()}`;
    await db.collection('patient_consent').doc(consentId).set(consentRecord);

    // Log para audit
    await db.collection('audit_logs').add({
      type: isDeclined ? 'consent_declined' : 'consent_granted',
      userId: data.physiotherapistId || 'system',
      userRole: 'professional',
      patientId: data.patientId,
      metadata: {
        tokenHash,
        method: 'sms_token',
        scope: consentScope,
        ipAddress: ip || null,
        userAgent: ua || null,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      ok: true,
      scope: consentScope,
      status: consentStatus,
      action: action
    });
  } catch (e) {
    console.error('[apiConsentVerify] error:', e?.stack || e);
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
});

// ---------------------------------------------------------------------------
// Resend (email) — API key solo en Secret Manager (nunca en código)
// Secret name: RESEND_API_KEY  →  firebase functions:secrets:set RESEND_API_KEY
// ---------------------------------------------------------------------------
const { onCall: onCallV2, HttpsError: HttpsErrorV2 } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { Resend } = require('resend');

const resendApiKeySecret = defineSecret('RESEND_API_KEY');

/**
 * Callable de prueba: envía un correo vía Resend usando la clave en secrets.
 * Requiere usuario autenticado (Firebase Auth) para evitar abuso.
 *
 * Opcional en data: { to, subject, html } — si faltan, usa valores de ejemplo.
 */
exports.sendResendHelloWorld = onCallV2(
  {
    region: LOCATION,
    secrets: [resendApiKeySecret],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsErrorV2('unauthenticated', 'Sign in required');
    }

    const apiKey = resendApiKeySecret.value();
    const resend = new Resend(apiKey);

    const to =
      typeof request.data?.to === 'string' && request.data.to.trim()
        ? request.data.to.trim()
        : 'mauricio@aiduxcare.com';
    const subject =
      typeof request.data?.subject === 'string' && request.data.subject.trim()
        ? request.data.subject.trim()
        : 'Hello World';
    const html =
      typeof request.data?.html === 'string' && request.data.html.trim()
        ? request.data.html
        : '<p>Congrats on sending your <strong>first email</strong>!</p>';

    const { data, error } = await resend.emails.send({
      from: 'AiduxCare <noreply@aiduxcare.com>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[sendResendHelloWorld] Resend API error:', error);
      throw new HttpsErrorV2('internal', error.message || 'Resend send failed');
    }

    return { ok: true, id: data?.id };
  }
);

// ---------------------------------------------------------------------------
// sendPatientSummary — Envía resumen de sesión (HEP + tratamiento) al paciente
// Solo piloto España. Requiere usuario autenticado.
// ---------------------------------------------------------------------------

/** Escapa caracteres HTML para uso seguro en templates de email. */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Construye el HTML del email de resumen para el paciente.
 * @param {object} p
 * @param {string} p.patientFirstName
 * @param {string} p.professionalName
 * @param {string} p.professionalTitle
 * @param {string} p.visitDate
 * @param {string[]} p.inClinicItems
 * @param {string[]} p.hepItems
 * @param {string} [p.customMessage]
 */
function buildPatientSummaryHtml(p) {
  const inClinicHtml = p.inClinicItems.length > 0
    ? `<p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin:0 0 8px">Hoy trabajamos en</p>
       <ul style="padding-left:20px;margin:0 0 24px;font-size:14px;line-height:1.6">
         ${p.inClinicItems.map(i => `<li style="margin-bottom:6px">${escHtml(i)}</li>`).join('')}
       </ul>`
    : '';

  const hepHtml = p.hepItems.length > 0
    ? `<p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin:0 0 8px">Para casa &#127968;</p>
       <ul style="padding-left:20px;margin:0 0 24px;font-size:14px;line-height:1.6">
         ${p.hepItems.map(i => `<li style="margin-bottom:6px">${escHtml(i)}</li>`).join('')}
       </ul>`
    : '';

  const noteHtml = p.customMessage
    ? `<div style="background:#f0f9ff;border-left:3px solid #4f46e5;padding:12px 16px;margin:20px 0;border-radius:4px;font-size:14px">
         <strong>Nota de tu fisioterapeuta:</strong><br>${escHtml(p.customMessage)}
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#374151">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:20px 32px">
      <span style="color:#fff;font-size:18px;font-weight:600;letter-spacing:-0.3px">AiduxCare</span>
    </div>
    <div style="padding:32px">
      <p style="font-size:16px;margin:0 0 6px">Hola <strong>${escHtml(p.patientFirstName)}</strong>,</p>
      <p style="font-size:14px;color:#6b7280;margin:0 0 28px">
        Aquí tienes el resumen de tu sesión del <strong>${escHtml(p.visitDate)}</strong>
        con <strong>${escHtml(p.professionalName)}</strong>.
      </p>
      ${inClinicHtml}
      ${hepHtml}
      ${noteHtml}
      <p style="font-size:14px;margin:28px 0 4px">Ante cualquier duda, no dudes en contactarnos.</p>
      <p style="font-size:14px;margin:0">
        Un saludo,<br>
        <strong>${escHtml(p.professionalName)}</strong><br>
        <span style="color:#6b7280;font-size:13px">${escHtml(p.professionalTitle)}</span>
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #e5e7eb;background:#f9fafb">
      <p style="font-size:11px;color:#9ca3af;margin:0">
        Mensaje enviado desde AiduxCare en nombre de tu profesional de salud.
        Por favor, no respondas a este email.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Envía el resumen de sesión (HEP + tratamiento en clínica) al paciente por email.
 * Solo para piloto España. Requiere usuario autenticado.
 *
 * data: { patientEmail, patientFirstName, professionalName, professionalTitle,
 *         visitDate, inClinicItems[], hepItems[], customMessage? }
 */
exports.sendPatientSummary = onCallV2(
  {
    region: LOCATION,
    secrets: [resendApiKeySecret],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsErrorV2('unauthenticated', 'Sign in required');
    }

    const {
      patientEmail,
      patientFirstName,
      professionalName,
      professionalTitle,
      visitDate,
      inClinicItems,
      hepItems,
      customMessage,
    } = request.data || {};

    if (!patientEmail || !patientFirstName || !professionalName) {
      throw new HttpsErrorV2(
        'invalid-argument',
        'Missing required fields: patientEmail, patientFirstName, professionalName'
      );
    }

    const apiKey = resendApiKeySecret.value();
    const resend = new Resend(apiKey);

    const html = buildPatientSummaryHtml({
      patientFirstName,
      professionalName,
      professionalTitle: professionalTitle || 'Fisioterapeuta',
      visitDate: visitDate || new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
      inClinicItems: Array.isArray(inClinicItems) ? inClinicItems : [],
      hepItems: Array.isArray(hepItems) ? hepItems : [],
      customMessage: typeof customMessage === 'string' ? customMessage.trim() : '',
    });

    const { data, error } = await resend.emails.send({
      from: 'AiduxCare <noreply@aiduxcare.com>',
      to: patientEmail,
      subject: `Tu resumen de sesión — ${visitDate || 'hoy'}`,
      html,
    });

    if (error) {
      console.error('[sendPatientSummary] Resend error:', error);
      throw new HttpsErrorV2('internal', error.message || 'Email send failed');
    }

    const maskedPatientEmail = patientEmail.replace(/(^.{2}).*(@.*$)/, '$1***$2');
    console.log('[sendPatientSummary] Sent:', { id: data?.id, to: maskedPatientEmail });
    return { ok: true, id: data?.id };
  }
);
