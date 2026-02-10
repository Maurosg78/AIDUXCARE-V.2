/**
 * Consent server / domain reader: single source of truth for workflow consent status.
 * Reads from the same Firestore path where verbalConsentService writes.
 * WO-CONSENT-VERBAL-FIX: Recognizes consent_status.channel === 'none' or granted === true.
 * Enterprise: structured logging, no PHI, error handling.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { consentLogger } from '@/domain/consent/consentLogger';

export interface ConsentCheckResult {
  hasValidConsent: boolean;
  status: string | null;
  consentMethod: string | null;
  isDeclined?: boolean;
  declineReasons?: string[];
}

/**
 * Check consent via the same document the verbal consent service writes.
 * Returns hasValidConsent: true when channel === 'none' or granted === true.
 */
export async function checkConsentViaServer(patientId: string): Promise<ConsentCheckResult> {
  if (!patientId) {
    return { hasValidConsent: false, status: null, consentMethod: null };
  }

  try {
    const ref = doc(db, 'patients', patientId, 'consent_status', 'latest');
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      consentLogger.info('consent_status_missing', {});
      return { hasValidConsent: false, status: null, consentMethod: null };
    }

    const data = snap.data();
    const channel = data?.channel ?? data?.consentChannel;
    const granted = data?.granted === true || data?.granted === 'true';
    const source = data?.source ?? data?.consentMethod ?? data?.method;
    const status = data?.status ?? (granted || channel === 'none' ? 'ongoing' : null);
    const isDeclined = data?.isDeclined === true || data?.status === 'declined';

    const hasValidConsent = channel === 'none' || granted === true;

    const result: ConsentCheckResult = {
      hasValidConsent,
      status: status ?? null,
      consentMethod: source ?? (hasValidConsent ? 'verbal' : null),
      isDeclined: isDeclined || false,
      declineReasons: data?.declineReasons,
    };

    consentLogger.info('consent_status_retrieved', {
      hasValidConsent: result.hasValidConsent,
      status: result.status,
      consentMethod: result.consentMethod,
      channel,
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    consentLogger.error('consent_status_read_failed', { message });
    return { hasValidConsent: false, status: null, consentMethod: null };
  }
}
