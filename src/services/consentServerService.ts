/**
 * Consent server / domain reader: single source of truth for workflow consent status.
 * Reads from consent_status/latest (verbal) first; falls back to patient_consent (digital).
 * WO-CONSENT-VERBAL-FIX: Recognizes consent_status.channel === 'none' or granted === true.
 * WO-CONSENT-SYNC: Also checks patient_consent for digital consent (SMS portal).
 */

import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
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
 * Check consent: consent_status/latest first, then patient_consent (digital) fallback.
 */
export async function checkConsentViaServer(patientId: string): Promise<ConsentCheckResult> {
  if (!patientId) {
    return { hasValidConsent: false, status: null, consentMethod: null };
  }

  try {
    const ref = doc(db, 'patients', patientId, 'consent_status', 'latest');
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return parseConsentStatusDoc(snap.data()!);
    }

    // Fallback: digital consent in patient_consent (SMS portal) — written before WO-CONSENT-SYNC
    const uid = getAuth().currentUser?.uid;
    if (uid) {
      const consentColl = collection(db, 'patient_consent');
      const q = query(
        consentColl,
        where('patientId', '==', patientId),
        where('professionalId', '==', uid),
        limit(20)
      );
      const digitalSnap = await getDocs(q);
      const granted = digitalSnap.docs
        .map((d) => d.data())
        .filter((d) => (d.status || d.consentStatus) === 'granted')
        .sort((a, b) => {
          const aTime = a.grantedAt?.toDate?.()?.getTime() ?? 0;
          const bTime = b.grantedAt?.toDate?.()?.getTime() ?? 0;
          return bTime - aTime;
        })[0];
      if (granted) {
        consentLogger.info('consent_status_retrieved', {
          hasValidConsent: true,
          status: 'ongoing',
          consentMethod: 'digital',
          channel: 'digital',
          source: 'patient_consent_fallback',
        });
        return {
          hasValidConsent: true,
          status: 'ongoing',
          consentMethod: 'digital',
          isDeclined: false,
        };
      }
    }

    consentLogger.info('consent_status_missing', {});
    return { hasValidConsent: false, status: null, consentMethod: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    consentLogger.error('consent_status_read_failed', { message });
    return { hasValidConsent: false, status: null, consentMethod: null };
  }
}

function parseConsentStatusDoc(data: Record<string, unknown>): ConsentCheckResult {
  const channel = data?.channel ?? data?.consentChannel;
  const granted = data?.granted === true || data?.granted === 'true';
  const source = data?.source ?? data?.consentMethod ?? data?.method;
  const status = data?.status ?? (granted || channel === 'none' ? 'ongoing' : null);
  const isDeclined = data?.isDeclined === true || data?.status === 'declined';

  const hasValidConsent = channel === 'none' || granted === true;

  const result: ConsentCheckResult = {
    hasValidConsent,
    status: status ?? null,
    consentMethod: (source as string) ?? (hasValidConsent ? 'verbal' : null),
    isDeclined: isDeclined || false,
    declineReasons: data?.declineReasons as string[] | undefined,
  };

  consentLogger.info('consent_status_retrieved', {
    hasValidConsent: result.hasValidConsent,
    status: result.status,
    consentMethod: result.consentMethod,
    channel,
  });
  return result;
}
