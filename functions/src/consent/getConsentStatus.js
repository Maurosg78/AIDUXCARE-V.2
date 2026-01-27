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
  // Allow both production and localhost for development
  const origin = req.headers.origin || req.headers.referer || '';
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('localhost:5002');
  const isProduction = origin === 'https://aiduxcare-v2-uat-dev.web.app';
  
  // Set CORS headers
  if (isLocalhost) {
    // For localhost, allow the specific origin or use wildcard for development
    res.set('Access-Control-Allow-Origin', origin || '*');
  } else if (isProduction) {
    res.set('Access-Control-Allow-Origin', 'https://aiduxcare-v2-uat-dev.web.app');
  } else {
    // Default to production for security
    res.set('Access-Control-Allow-Origin', 'https://aiduxcare-v2-uat-dev.web.app');
  }
  
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');
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
      console.info('[getConsentStatus] No consent documents found', {
        patientId,
        professionalId,
        collection: CONSENT_COLLECTION
      });
      return res.status(200).json({
        success: true,
        hasValidConsent: false,
        isDeclined: false, // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Explicit false
        status: null,
        consentMethod: null
      });
    }

    console.info('[getConsentStatus] Found consent documents', {
      patientId,
      professionalId,
      documentCount: snapshot.docs.length,
      documentIds: snapshot.docs.map(doc => doc.id),
      documentStatuses: snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          status: data.consentStatus || data.status,
          consentMethod: data.consentMethod,
          consentDate: data.consentDate?.toDate?.()?.toISOString() || null
        };
      })
    });

    // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Check for granted consent FIRST
    // If patient granted consent AFTER declining, the granted consent takes precedence (reversal)
    const grantedConsents = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(consent => {
        const status = consent.consentStatus || consent.status;
        return status === 'granted';
      })
      .sort((a, b) => {
        const aDate = a.consentDate?.toDate?.() || a.grantedAt?.toDate?.() || new Date(0);
        const bDate = b.consentDate?.toDate?.() || b.grantedAt?.toDate?.() || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });

    // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: If granted consent exists (even after decline), it takes precedence
    if (grantedConsents.length > 0) {
      const latestGranted = grantedConsents[0];
      const consentMethod = latestGranted.consentMethod === 'digital' ? 'digital' : 
                            latestGranted.consentMethod === 'sms' ? 'digital' : 
                            latestGranted.consentMethod === 'verbal' ? 'verbal' : 
                            'unknown';
      const consentScope = latestGranted.consentScope || 'ongoing';
      
      let displayStatus = null;
      if (consentScope === 'session-only') {
        displayStatus = 'session-only';
      } else if (consentScope === 'ongoing') {
        displayStatus = 'ongoing';
      }

      console.info('[getConsentStatus] Granted consent found (decline reversal)', {
        patientId,
        professionalId,
        consentMethod,
        displayStatus,
        grantedAt: latestGranted.consentDate?.toDate?.()?.toISOString() || 
                   latestGranted.grantedAt?.toDate?.()?.toISOString() || null
      });

      return res.status(200).json({
        success: true,
        hasValidConsent: true,
        isDeclined: false, // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Granted consent overrides declined
        status: displayStatus,
        consentMethod,
        grantedAt: latestGranted.consentDate?.toDate?.()?.toISOString() || 
                   latestGranted.grantedAt?.toDate?.()?.toISOString() || null
      });
    }

    // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Only check for declined if NO granted consent exists
    // Declined consent is a hard block - AiDux cannot be used
    const declinedConsents = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(consent => {
        const status = consent.consentStatus || consent.status;
        return status === 'declined';
      })
      .sort((a, b) => {
        const aDate = a.declinedAt?.toDate?.() || a.consentDate?.toDate?.() || new Date(0);
        const bDate = b.declinedAt?.toDate?.() || b.consentDate?.toDate?.() || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });

    if (declinedConsents.length > 0) {
      const latestDeclined = declinedConsents[0];
      console.info('[getConsentStatus] Declined consent found - HARD BLOCK', {
        patientId,
        professionalId,
        documentId: latestDeclined.id,
        consentStatus: latestDeclined.consentStatus,
        status: latestDeclined.status,
        declinedAt: latestDeclined.declinedAt?.toDate?.()?.toISOString() || 
                    latestDeclined.consentDate?.toDate?.()?.toISOString() || null,
        declineReasons: latestDeclined.declineReasons || []
      });

      // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Normalize declineReasons to array
      // Firestore may store it as string (comma-separated) or array
      let declineReasonsArray = [];
      if (latestDeclined.declineReasons) {
        if (Array.isArray(latestDeclined.declineReasons)) {
          declineReasonsArray = latestDeclined.declineReasons;
        } else if (typeof latestDeclined.declineReasons === 'string') {
          // Split comma-separated string into array
          declineReasonsArray = latestDeclined.declineReasons.split(',').map(r => r.trim()).filter(Boolean);
        }
      }

      return res.status(200).json({
        success: true,
        hasValidConsent: false,
        isDeclined: true, // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: CRITICAL - must be true
        status: 'declined',
        consentMethod: latestDeclined.consentMethod || 'verbal',
        declinedAt: latestDeclined.declinedAt?.toDate?.()?.toISOString() || 
                    latestDeclined.consentDate?.toDate?.()?.toISOString() || null,
        declineReasons: declineReasonsArray
      });
    }

    // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Log if no declined found (for debugging)
    console.info('[getConsentStatus] No declined consent found, checking for granted', {
      patientId,
      professionalId,
      totalDocuments: snapshot.docs.length
    });

    // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: This code should not be reached if granted/declined logic above works
    // But kept as fallback for edge cases
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
      console.info('[getConsentStatus] No granted consent found', {
        patientId,
        professionalId,
        totalDocuments: snapshot.docs.length
      });
      return res.status(200).json({
        success: true,
        hasValidConsent: false,
        isDeclined: false, // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Explicit false
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
      isDeclined: false,
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
