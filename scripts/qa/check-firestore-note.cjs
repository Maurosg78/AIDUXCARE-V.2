#!/usr/bin/env node
const { resolve, isAbsolute } = require('path');
const fs = require('fs');

const envPath = resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  'aiduxcare-v2-uat-dev';

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
      initializeApp({ projectId: projectId || PROJECT_ID });
    }
  }
  return getFirestore();
}

async function main() {
  const args = process.argv.slice(2);
  const noteId = args[0] && !args[0].startsWith('--') ? args[0] : null;
  const patientIdx = args.indexOf('--patient');
  const patientId = patientIdx >= 0 ? args[patientIdx + 1] : null;

  if (!noteId && !patientId) {
    console.error('Usage: node scripts/qa/check-firestore-note.cjs NOTE_ID');
    console.error('   or: node scripts/qa/check-firestore-note.cjs --patient PATIENT_ID');
    process.exit(1);
  }

  const db = initializeAdmin(PROJECT_ID);

  const collections = ['consultations', 'hospital_portal_notes', 'clinical_notes'];
  const out = { noteId, patientId, project: PROJECT_ID, collections: {} };

  for (const collectionName of collections) {
    if (noteId) {
      const snap = await db.collection(collectionName).doc(noteId).get();
      out.collections[collectionName] = snap.exists ? snap.data() : null;
      continue;
    }

    const querySnap = await db.collection(collectionName).where('patientId', '==', patientId).limit(10).get();
    out.collections[collectionName] = querySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
