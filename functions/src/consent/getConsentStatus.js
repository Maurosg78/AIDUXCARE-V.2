/**
 * Get Consent Status - PHIPA/PIPEDA Compliant
 * 
 * Cloud Function that securely retrieves patient consent status.
 * Only authenticated professionals can query consent for their patients.
 * 
 * Compliance:
 * - PHIPA s.18: Knowledgeable consent
 * - PIPEDA Principle 4.3: Meaningful consent
 * - ISO 27001 A.18.1.4: Privacy and protection of PII
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
const CONSENT_COLLECTION = 'patient_consent';
const CONSENT_VERSION = '1.0.0';

/**
 * Get Consent Status
 * 
 * Authenticated HTTPS endpoint for professionals to check patient consent
 * Returns consent status without exposing full consent documents
 */
exports.getConsentStatus = functions.region(LOCATION).https.onRequest(async (req, res) => {
  // ✅ CORS for authenticated requests
  const ALLOWED_ORIGIN = 'https://aiduxcare-v2-uat-dev.web.app';
  
  res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    // ✅ T1: Verify authentication token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization token'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.warn('[getConsentStatus] Invalid token:', error.message);
      return res.status(401).json({ 
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      });
    }

    const professionalId = decodedToken.uid;

    // ✅ T2: Validate payload
    const { patientId } = req.body || {};
    
    if (!patientId || typeof patientId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PAYLOAD',
        message: 'patientId is required'
      });
    }

    console.info('[getConsentStatus] Request received', {
      patientId,
      professionalId,
      origin: req.headers.origin || 'unknown'
    });

    // ✅ T3: Query consent documents (server-side, no permission issues)
    const consentRef = admin.firestore().collection(CONSENT_COLLECTION);
    const snapshot = await consentRef
      .where('patientId', '==', patientId)
      .where('professionalId', '==', professionalId)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        hasValidConsent: false,
        status: null,
        consentMethod: null
      });
    }

    // ✅ T4: Filter for granted consents
    // ✅ WO-CONSENT-SINGLE-SOURCE-OF-TRUTH-05: Only filter by status, not version
    // Version filtering removed - consent is valid if status === 'granted'
    const consents = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(consent => {
        const status = consent.consentStatus || consent.status;
        return status === 'granted';
      })
      // ✅ Removed version filter - if status is 'granted', consent is valid
      // Version check was causing mismatch between write (textVersion) and read (consentVersion)
      .sort((a, b) => {
        const aDate = a.consentDate?.toDate?.() || a.grantedAt?.toDate?.() || new Date(0);
        const bDate = b.consentDate?.toDate?.() || b.grantedAt?.toDate?.() || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });

    if (consents.length === 0) {
      return res.status(200).json({
        success: true,
        hasValidConsent: false,
        status: null,
        consentMethod: null
      });
    }

    const latestConsent = consents[0];
    // ✅ WO-CONSENT-SINGLE-SOURCE-OF-TRUTH-05: Map consentMethod correctly
    // 'digital' from acceptPatientConsentByToken maps to 'digital' in response
    const consentMethod = latestConsent.consentMethod === 'digital' ? 'digital' : 
                          latestConsent.consentMethod === 'sms' ? 'digital' : // Legacy compatibility
                          latestConsent.consentMethod === 'verbal' ? 'verbal' : 
                          'unknown';
    const consentScope = latestConsent.consentScope || 'ongoing';

    // Determine status for display
    let displayStatus = null;
    if (consentScope === 'session-only') {
      displayStatus = 'session-only';
    } else if (consentScope === 'ongoing') {
      displayStatus = 'ongoing';
    }

    console.info('[getConsentStatus] Consent found', {
      patientId,
      professionalId,
      hasConsent: true,
      consentMethod,
      displayStatus
    });

    return res.status(200).json({
      success: true,
      hasValidConsent: true,
      status: displayStatus,
      consentMethod,
      grantedAt: latestConsent.grantedAt?.toDate?.()?.toISOString() || 
                 latestConsent.consentDate?.toDate?.()?.toISOString() || null
    });

  } catch (error) {
    console.error('[getConsentStatus] Error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to retrieve consent status'
    });
  }
});
