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
import { safeLogger } from '@/utils/safeLogger';
import { validateConsentForAgeGateWithLegacyPolicy } from '@/utils/ageUtils';

export type ConsentBlockReason =
  | 'minor_requires_representative'
  | 'age_unknown_dob_required'
  | 'age_unknown_confirmation_required';

export interface ConsentCheckResult {
  hasValidConsent: boolean;
  status: 'ongoing' | 'session-only' | 'declined' | null;
  consentMethod: string | null;
  isDeclined?: boolean;
  declineReasons?: string[];
  channel?: 'none' | 'sms' | 'blocked' | 'insufficient';
  blockReason?: ConsentBlockReason;
}

/**
 * Check consent: consent_status/latest first, then patient_consent (digital) fallback.
 */
export async function checkConsentViaServer(patientId: string): Promise<ConsentCheckResult> {
  if (!patientId) {
    return { hasValidConsent: false, status: null, consentMethod: null };
  }

  try {
    const patientRef = doc(db, 'patients', patientId);
    const patientSnap = await getDoc(patientRef);
    const patientData = patientSnap.exists() ? patientSnap.data() : null;
    const ref = doc(db, 'patients', patientId, 'consent_status', 'latest');
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return parseConsentStatusDoc(snap.data()!, patientData);
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
        const ageValidation = validateConsentDocumentForAge(granted, patientData);
        if (ageValidation !== null) return ageValidation;

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
          channel: 'none',
        };
      }
    }

    const ageValidationWithoutConsent = validateConsentForAgeGateWithLegacyPolicy(
      getNullableString(patientData?.dateOfBirth),
      getNullableString(patientData?.birthDate),
      null,
      getCreatedAtForGate(patientData),
      null,
      false
    );
    if (ageValidationWithoutConsent !== 'valid') {
      return buildBlockedConsentResult(ageValidationWithoutConsent);
    }

    consentLogger.info('consent_status_missing', {});
    return { hasValidConsent: false, status: null, consentMethod: null, channel: 'sms' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    consentLogger.error('consent_status_read_failed', { message });
    return { hasValidConsent: false, status: null, consentMethod: null };
  }
}

function parseConsentStatusDoc(
  data: Record<string, unknown>,
  patientData: Record<string, unknown> | null
): ConsentCheckResult {
  const channel = data?.channel ?? data?.consentChannel;
  const granted = data?.granted === true || data?.granted === 'true';
  const source = data?.source ?? data?.consentMethod ?? data?.method;
  const status = data?.status ?? (granted || channel === 'none' ? 'ongoing' : null);
  const isDeclined = data?.isDeclined === true || data?.status === 'declined';

  const hasValidConsent = channel === 'none' || granted === true;
  if (hasValidConsent) {
    const ageValidation = validateConsentDocumentForAge(data, patientData);
    if (ageValidation !== null) return ageValidation;
  }

  const result: ConsentCheckResult = {
    hasValidConsent,
    status: (status == null ? null : String(status)) as ConsentCheckResult['status'],
    consentMethod: (source as string) ?? (hasValidConsent ? 'verbal' : null),
    isDeclined: isDeclined || false,
    declineReasons: data?.declineReasons as string[] | undefined,
    channel: hasValidConsent ? 'none' : 'sms',
  };

  consentLogger.info('consent_status_retrieved', {
    hasValidConsent: result.hasValidConsent,
    status: result.status,
    consentMethod: result.consentMethod,
    channel,
  });
  return result;
}

function validateConsentDocumentForAge(
  consentDoc: Record<string, unknown>,
  patientData: Record<string, unknown> | null
): ConsentCheckResult | null {
  const consentSource = getNullableString(consentDoc?.source);
  const consentMethod = getNullableString(consentDoc?.consentMethod);
  const consentChannel = getNullableString(consentDoc?.channel);
  const isLegacyPaperConsent =
    consentSource === 'paper' ||
    consentSource === 'legacy' ||
    consentSource === 'legacy_paper' ||
    consentMethod === 'paper' ||
    consentMethod === 'legacy' ||
    consentMethod === 'legacy_paper' ||
    consentChannel === 'legacy';

  if (isLegacyPaperConsent) {
    safeLogger.identifierOperation('consent', 'legacy_paper_validated');
    return null;
  }

  const patientDateOfBirth = getNullableString(patientData?.dateOfBirth);
  const patientBirthDate = getNullableString(patientData?.birthDate);
  const patientResponse = getNullableString(consentDoc?.patientResponse);
  const adultConfirmedByClinicianAt = getNullableString(consentDoc?.adultConfirmedByClinicianAt);
  const patientCreatedAt = getCreatedAtForGate(patientData);
  const ageValidation = validateConsentForAgeGateWithLegacyPolicy(
    patientDateOfBirth,
    patientBirthDate,
    patientResponse,
    patientCreatedAt,
    adultConfirmedByClinicianAt,
    false
  );

  if (ageValidation === 'minor_requires_representative') {
    return buildBlockedConsentResult('minor_requires_representative');
  }

  if (ageValidation === 'age_unknown_confirmation_required') {
    return buildBlockedConsentResult('age_unknown_confirmation_required');
  }

  if (ageValidation === 'age_unknown_dob_required') {
    return buildBlockedConsentResult('age_unknown_dob_required');
  }

  return null;
}

function buildBlockedConsentResult(blockReason: ConsentBlockReason): ConsentCheckResult {
  return {
    hasValidConsent: false,
    status: null,
    consentMethod: null,
    isDeclined: false,
    channel: blockReason === 'age_unknown_dob_required' ? 'blocked' : 'insufficient',
    blockReason,
  };
}

function getNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function getCreatedAtForGate(patientData: Record<string, unknown> | null): string | Date | null {
  const createdAt = patientData?.createdAt ?? (patientData?.metadata as { createdAt?: unknown } | undefined)?.createdAt;
  if (typeof createdAt === 'string') return createdAt;
  if (createdAt instanceof Date) return createdAt;
  if (typeof (createdAt as { toDate?: unknown } | null)?.toDate === 'function') {
    return (createdAt as { toDate: () => Date }).toDate();
  }

  return null;
}
