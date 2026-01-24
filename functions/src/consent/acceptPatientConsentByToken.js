/**
 * Accept Patient Consent By Token - PHIPA/PIPEDA Compliant
 * 
 * Cloud Function that securely records patient consent decisions from the
 * public consent portal. Patients cannot write directly to Firestore.
 * 
 * Compliance:
 * - PHIPA s.18: Knowledgeable consent
 * - PIPEDA Principle 4.3: Meaningful consent
 * - ISO 27001 A.18.1.4: Privacy and protection of PII
 * - ISO 27001 A.12.4.1: Event logging (audit trail)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const LOCATION = 'northamerica-northeast1'; // ✅ CANADÁ (Montreal) - PHIPA compliance

/**
 * Accept Patient Consent By Token
 * 
 * Public HTTPS endpoint for patient consent portal
 * Validates token and records consent decision securely
 */
exports.acceptPatientConsentByToken = functions.region(LOCATION).https.onRequest(async (req, res) => {
  // ✅ T2: CORS correcto (NO wildcard en prod) - Safari/iOS compatible
  const ALLOWED_ORIGIN = 'https://aiduxcare-v2-uat-dev.web.app';
  
  res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '3600');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    // ✅ T3: Validación dura de payload (defensivo)
    const { token, decision, declineReasons, declineNotes } = req.body || {};
    
    if (!token || !['granted', 'declined'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payload'
      });
    }
    
    // ✅ T4: Logging mínimo pero trazable (ISO-friendly)
    console.info('[ConsentCF] request received', {
      hasToken: Boolean(token),
      decision,
      origin: req.headers.origin || 'unknown'
    });

    // Additional validation: Token format (T3 ya validó existencia y decision)
    if (typeof token !== 'string' || token.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN'
      });
    }

    // Validation 2b: If declined, declineReasons should be provided (optional but recommended)
    if (decision === 'declined' && (!declineReasons || (Array.isArray(declineReasons) && declineReasons.length === 0))) {
      // Warning but not blocking - compliance may require reasons but we allow without for UX
      console.warn('[acceptPatientConsentByToken] Decline without reasons provided');
    }

    const db = admin.firestore();
    const trimmedToken = token.trim();

    // Validation 3: Token exists in Firestore
    const tokenRef = db.collection('patient_consent_tokens').doc(trimmedToken);
    const tokenDoc = await tokenRef.get();

    if (!tokenDoc.exists) {
      return res.status(404).json({ error: 'INVALID_TOKEN' });
    }

    const tokenData = tokenDoc.data() || {};

    // Validation 4: Token not expired
    const expiresAt = tokenData.expiresAt?.toDate?.() || (tokenData.expiresAt ? new Date(tokenData.expiresAt) : null);
    if (expiresAt && Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ error: 'TOKEN_EXPIRED' });
    }

    // Validation 5: Token not already used
    if (tokenData.used === true) {
      // Idempotent: if already recorded with same decision, return success
      const consentGiven = tokenData.consentGiven || {};
      const existingScope = consentGiven.scope;
      
      if (decision === 'granted' && existingScope === 'ongoing') {
        return res.status(200).json({ success: true, alreadyRecorded: true });
      }
      if (decision === 'declined' && existingScope === 'declined') {
        return res.status(200).json({ success: true, alreadyRecorded: true });
      }
      
      // Different decision - return error (cannot change decision)
      return res.status(409).json({ error: 'CONSENT_ALREADY_RECORDED' });
    }

    // Get IP and User-Agent for audit trail
    const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip || '').trim();
    const userAgent = (req.get('user-agent') || '').slice(0, 200);

    // Mark token as used
    await tokenRef.update({
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
      consentGiven: {
        scope: decision === 'granted' ? 'ongoing' : 'declined',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: ip || null,
        userAgent: userAgent || null,
      },
    });

    // Create consent record in patient_consent collection (canonical collection)
    // Append-only: create new document, never overwrite
    // ✅ WO-CONSENT-SINGLE-SOURCE-OF-TRUTH-05: Write fields that getConsentStatus reads
    const consentRecord = {
      patientId: tokenData.patientId,
      patientName: tokenData.patientName || 'Patient',
      professionalId: tokenData.physiotherapistId,
      status: decision === 'granted' ? 'granted' : 'declined',
      consentStatus: decision === 'granted' ? 'granted' : 'declined', // For query compatibility
      consentMethod: 'digital', // ✅ Canonical: 'digital' for SMS portal consent
      token: trimmedToken,
      jurisdiction: 'CA-ON', // Default jurisdiction (can be enhanced to read from token)
      // ✅ WO-CONSENT-SINGLE-SOURCE-OF-TRUTH-05: Write BOTH version fields for compatibility
      consentVersion: '1.0.0', // ✅ Required by getConsentStatus
      consentTextVersion: '1.0.0', // ✅ Required by getConsentStatus (alternative check)
      textVersion: 'v1-en-CA', // ✅ Legacy compatibility
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'patient_portal',
      consented: decision === 'granted',
      consentScope: decision === 'granted' ? 'ongoing' : 'declined',
      ...(decision === 'declined' && {
        declineReasons: Array.isArray(declineReasons) ? declineReasons.join(', ') : (declineReasons || null),
        declineNotes: declineNotes || null,
        declinedAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
      audit: {
        ip: ip || null,
        userAgent: userAgent || null,
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    };

    // Write to patient_consent (canonical collection used by ConsentGateScreen)
    const consentId = `${tokenData.patientId}_${Date.now()}`;
    await db.collection('patient_consent').doc(consentId).set(consentRecord);

    // Audit log
    await db.collection('audit_logs').add({
      type: decision === 'granted' ? 'consent_granted' : 'consent_declined',
      userId: tokenData.physiotherapistId || 'system',
      userRole: 'patient',
      patientId: tokenData.patientId,
      metadata: {
        token: trimmedToken,
        method: 'patient_portal',
        decision,
        ipAddress: ip || null,
        userAgent: userAgent || null,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[acceptPatientConsentByToken] Error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});
