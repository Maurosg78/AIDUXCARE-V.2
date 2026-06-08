import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

type ConsentSummaryKey = string;

const PROJECT_ID = 'aiduxcare-v2-uat-dev';
const APPLY_FLAG = '--apply';
const CONFIRM_ENV = 'CONFIRM_MIGRATE_MINOR_LEGACY_CONSENT';

if (!getApps().length) {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
}

const db = getFirestore();

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function ageOn(birth: Date, today = new Date()): number {
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }

  return age;
}

function getSummaryKey(consentData: FirebaseFirestore.DocumentData): ConsentSummaryKey {
  return JSON.stringify({
    source: consentData.source ?? null,
    consentMethod: consentData.consentMethod ?? null,
    channel: consentData.channel ?? null,
    patientResponse: consentData.patientResponse ?? null,
    hasPaperOrLegacy:
      consentData.source === 'paper' ||
      consentData.source === 'legacy' ||
      consentData.source === 'legacy_paper' ||
      consentData.consentMethod === 'paper' ||
      consentData.consentMethod === 'legacy' ||
      consentData.consentMethod === 'legacy_paper' ||
      consentData.channel === 'legacy',
  });
}

async function main() {
  const applyRequested = process.argv.includes(APPLY_FLAG);
  const applyConfirmed = process.env[CONFIRM_ENV] === 'true';
  const patientsSnapshot = await db.collection('patients').get();
  const targetConsentDocs: FirebaseFirestore.DocumentReference[] = [];
  const aggregate: Record<ConsentSummaryKey, number> = {};

  for (const patientDoc of patientsSnapshot.docs) {
    const patientData = patientDoc.data();
    const dateOfBirth = parseDate(patientData.dateOfBirth) ?? parseDate(patientData.birthDate);
    if (!dateOfBirth) continue;
    if (ageOn(dateOfBirth) >= 18) continue;

    const consentRef = patientDoc.ref.collection('consent_status').doc('latest');
    const consentSnap = await consentRef.get();
    if (!consentSnap.exists) continue;

    const consentData = consentSnap.data() ?? {};
    if (consentData.patientResponse !== 'authorized') continue;

    targetConsentDocs.push(consentRef);
    const summaryKey = getSummaryKey(consentData);
    aggregate[summaryKey] = (aggregate[summaryKey] ?? 0) + 1;
  }

  console.log('[minor-legacy-consent] phase_1_report', {
    totalDocumentsFound: targetConsentDocs.length,
    aggregate,
    applyRequested,
    applyConfirmed,
  });

  if (!applyRequested) return;

  if (!applyConfirmed) {
    throw new Error(`${CONFIRM_ENV}=true is required for phase 2 writes`);
  }

  for (const consentRef of targetConsentDocs) {
    await consentRef.set(
      {
        consentMethod: 'paper',
        source: 'legacy_paper',
        legacyNote: 'Consentimiento físico firmado previo al sistema digital. Archivado en Clínica Axon Valencia.',
        legacyMigratedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  console.log('[minor-legacy-consent] phase_2_completed', {
    totalDocumentsUpdated: targetConsentDocs.length,
  });
}

main().catch((error) => {
  console.error('[minor-legacy-consent] failed', {
    hasMessage: Boolean(error instanceof Error ? error.message : error),
  });
  process.exitCode = 1;
});
