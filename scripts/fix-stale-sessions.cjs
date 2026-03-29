#!/usr/bin/env node
/**
 * Cleanup de sesiones stale sin SOAP finalizable.
 *
 * Dry-run por defecto:
 *   node scripts/fix-stale-sessions.cjs
 *
 * Aplicar cambios:
 *   node scripts/fix-stale-sessions.cjs --apply
 */

const { resolve, isAbsolute } = require('path');
const fs = require('fs');

const envPath = resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  'aiduxcare-v2-uat-dev';
const TARGET_UID = 'ff0w27nBbmMoVe1MnUOKq7gKEd32';
const REASON = 'stale_no_soap';

function initializeAdmin(projectId) {
  if (getApps().length === 0) {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const fullPath = serviceAccountPath
      ? (isAbsolute(serviceAccountPath) ? serviceAccountPath : resolve(process.cwd(), serviceAccountPath))
      : null;

    if (fullPath && fs.existsSync(fullPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId || serviceAccount.project_id,
      });
    } else {
      if (serviceAccountPath) {
        console.warn('GOOGLE_APPLICATION_CREDENTIALS no existe; usando credenciales por defecto.');
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      }
      initializeApp({ projectId: projectId || PROJECT_ID });
    }
  }

  return getFirestore();
}

function formatTs(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldApply = args.includes('--apply');
  const deletedBy = process.env.USER || 'script';

  const db = initializeAdmin(PROJECT_ID);
  const sessionsRef = db.collection('sessions');
  const deletedRef = db.collection('deleted_sessions');

  const snapshot = await sessionsRef
    .where('userId', '==', TARGET_UID)
    .where('status', '==', 'interrupted')
    .get();

  const candidates = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((session) => session.soapStatus !== 'finalized')
    .filter((session) => session.hasSoapNote === false || session.hasSoapNote == null);

  console.log(shouldApply ? 'MODE: APPLY' : 'MODE: DRY-RUN');
  console.log('PROJECT:', PROJECT_ID);
  console.log('USER:', TARGET_UID);
  console.log('MATCHED INTERRUPTED:', snapshot.size);
  console.log('STALE WITHOUT FINALIZED SOAP:', candidates.length);

  for (const session of candidates) {
    console.log(
      JSON.stringify({
        id: session.id,
        patientName: session.patientName || null,
        updatedAt: formatTs(session.updatedAt) || null,
      }),
    );
  }

  if (!shouldApply) {
    console.log('SUMMARY:', JSON.stringify({ dryRun: true, matched: snapshot.size, stale: candidates.length }));
    return;
  }

  let archived = 0;
  let deleted = 0;

  for (const session of candidates) {
    const sessionDocRef = sessionsRef.doc(session.id);
    const deletedDocRef = deletedRef.doc(session.id);

    await deletedDocRef.set({
      ...session,
      originalCollection: 'sessions',
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy,
      reason: REASON,
    });
    archived++;

    await sessionDocRef.delete();
    deleted++;
  }

  console.log(
    'SUMMARY:',
    JSON.stringify({
      dryRun: false,
      matched: snapshot.size,
      stale: candidates.length,
      archived,
      deleted,
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
