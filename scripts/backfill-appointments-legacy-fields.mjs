#!/usr/bin/env node
/**
 * backfill-appointments-legacy-fields.mjs
 * Adds userId (Firebase Auth UID) and dateTime (ISO) to legacy appointment docs.
 * - clinicianUid may be an email (resolve via getUserByEmail) or already a Firebase UID.
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS (service account with Firestore + Firebase Auth read)
 *
 *   node scripts/backfill-appointments-legacy-fields.mjs --project aiduxcare-v2-uat-dev --dry-run
 *   node scripts/backfill-appointments-legacy-fields.mjs --project aiduxcare-v2-uat-dev --apply
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

function argValue(name) {
  const i = process.argv.indexOf(name);
  if (i === -1 || !process.argv[i + 1]) return null;
  return process.argv[i + 1];
}

const projectId = argValue('--project') || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');

if (!projectId) {
  console.error('Missing --project or GCLOUD_PROJECT');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ projectId });
}

const db = getFirestore();
const auth = getAuth();

function isEmail(s) {
  return typeof s === 'string' && s.includes('@');
}

/** Firebase Auth uid: alphanumeric, no @, typical length (legacy data sometimes stored uid in clinicianUid). */
function looksLikeFirebaseUid(s) {
  if (typeof s !== 'string') return false;
  const t = s.trim();
  return t.length >= 20 && t.length <= 128 && /^[a-zA-Z0-9]+$/.test(t) && !t.includes('@');
}

async function resolveUserIdFromClinician(clinicianRaw, docId) {
  const clinician = clinicianRaw.trim();
  if (isEmail(clinician)) {
    try {
      const u = await auth.getUserByEmail(clinician);
      return u.uid;
    } catch (e) {
      console.warn(`[skip userId] ${docId}: getUserByEmail(${clinician}) — ${e.message || e}`);
      return null;
    }
  }
  if (looksLikeFirebaseUid(clinician)) {
    try {
      await auth.getUser(clinician);
      return clinician;
    } catch (e) {
      console.warn(`[skip userId] ${docId}: getUser(${clinician}) — ${e.message || e}`);
      return null;
    }
  }
  return null;
}

async function main() {
  console.log(JSON.stringify({ projectId, dryRun }, null, 0));

  const snap = await db.collection('appointments').get();
  let touched = 0;
  let skipped = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const hasUserId = typeof data.userId === 'string' && data.userId.length > 0;
    const hasDateTime = typeof data.dateTime === 'string' && data.dateTime.length > 0;
    const clinician = data.clinicianUid;
    const dateField = data.date;

    const patch = {};

    if (!hasDateTime && dateField instanceof Timestamp) {
      patch.dateTime = dateField.toDate().toISOString();
    }

    if (!hasUserId && typeof clinician === 'string' && clinician.trim()) {
      const uid = await resolveUserIdFromClinician(clinician, docSnap.id);
      if (uid) {
        patch.userId = uid;
      }
    }

    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }

    touched++;
    console.log(dryRun ? `[dry-run] would update ${docSnap.id}` : `[apply] ${docSnap.id}`, patch);
    if (!dryRun) {
      await docSnap.ref.set(patch, { merge: true });
    }
  }

  console.log(JSON.stringify({ totalDocs: snap.size, touched, skipped }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
