const functions = require('firebase-functions');
const { GoogleAuth } = require('google-auth-library');

const PROJECT = 'aiduxcare-v2-uat-dev';
const LOCATION = 'northamerica-northeast1'; // ✅ CANADÁ (Montreal) - PHIPA compliance
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
 * Send SMS via Vonage (backend proxy to avoid CORS)
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */
exports.sendConsentSMS = functions.region(LOCATION).https.onRequest(async (req, res) => {
  // CORS - Handle preflight
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.set('Access-Control-Max-Age', '3600');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
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
      apiKey: VONAGE_API_KEY ? `${VONAGE_API_KEY.substring(0, 4)}...` : 'MISSING',
      apiSecret: VONAGE_API_SECRET ? 'SET' : 'MISSING',
      fromNumber: VONAGE_FROM_NUMBER,
      to: cleanPhone,
    });

    const response = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });

    const result = await response.json();
    console.log('[SMS Function] Vonage API response:', {
      status: response.status,
      result: JSON.stringify(result).substring(0, 500), // Limit log size
    });

    // Check Vonage response
    if (result.messages && result.messages[0]?.status === '0') {
      // Success
      return res.status(200).json({
        ok: true,
        provider: 'vonage',
        messageId: result.messages[0]['message-id'],
        status: result.messages[0].status,
        remainingBalance: result.messages[0]['remaining-balance'],
      });
    } else {
      // Error from Vonage
      const errorText = result.messages?.[0]?.['error-text'] || result['error-text'] || 'Unknown error';
      const errorCode = result.messages?.[0]?.['status'] || result['error-code'] || 'unknown';
      console.error('[SMS Function] Vonage error:', { 
        errorText, 
        errorCode, 
        fullResponse: JSON.stringify(result).substring(0, 1000),
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
      generationConfig: { temperature: 0.3, maxOutputTokens: 16384, response_mime_type: 'application/json' }
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
  // CORS - Handle preflight
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    const db = admin.firestore();
    const storage = admin.storage();

    const { patientId } = req.params;
    const { requestedBy, reason, authorizationProof } = req.body || {};

    if (!patientId) {
      return res.status(400).json({ ok: false, error: 'missing_patient_id' });
    }

    if (!requestedBy) {
      return res.status(400).json({ ok: false, error: 'missing_requested_by' });
    }

    // TODO: Implement authorization check
    // Verify that requestedBy is authorized HIC for this patient
    // Verify patient authorization proof if provided

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
      deletedBy: requestedBy,
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
      userId: requestedBy,
      userRole: 'HIC',
      patientId,
      metadata: {
        certificateId,
        deletedCounts,
        verificationHash: certificate.verificationHash,
        reason,
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
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');
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
      tokenUsed: token.trim(),
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
      type: 'consent_granted',
      userId: data.physiotherapistId || 'system',
      userRole: 'professional',
      patientId: data.patientId,
      metadata: {
        token,
        method: 'sms_token',
        scope: 'ongoing',
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
