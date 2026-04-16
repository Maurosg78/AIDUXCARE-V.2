#!/usr/bin/env node

const { resolve } = require('path');
const fs = require('fs');

const envPath = resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const DEFAULT_PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  'aiduxcare-v2-uat-dev';

function parseArgs() {
  const shouldApply = process.argv.includes('--apply');

  const projectIndex = process.argv.indexOf('--project');
  const projectId = projectIndex >= 0 ? process.argv[projectIndex + 1] : DEFAULT_PROJECT_ID;

  const uidIndex = process.argv.indexOf('--uid');
  const targetUid = uidIndex >= 0 ? process.argv[uidIndex + 1] : null;

  if (!targetUid) {
    throw new Error('Missing required --uid <firebase-uid>');
  }

  return { shouldApply, projectId, targetUid };
}

function initializeAdmin(projectId) {
  if (getApps().length > 0) return getFirestore();

  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const fullPath = serviceAccountPath
    ? resolve(process.cwd(), serviceAccountPath)
    : null;

  if (fullPath && fs.existsSync(fullPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount),
      projectId: projectId || serviceAccount.project_id,
    });
    return getFirestore();
  }

  initializeApp({ projectId });
  return getFirestore();
}

async function main() {
  const { shouldApply, projectId, targetUid } = parseArgs();
  const db = initializeAdmin(projectId);

  const snapshot = await db.collection('sessions').get();

  let candidates = [];

  snapshot.forEach(doc => {
    const data = doc.data();

    if (data.userId === 'temp-user' && data.patientId) {
      candidates.push({
        id: doc.id,
        patientId: data.patientId,
        oldUserId: data.userId || null,
      });
    }
  });

  console.log(JSON.stringify({
    mode: shouldApply ? 'apply' : 'dry-run',
    totalSessions: snapshot.size,
    candidates: candidates.length,
  }, null, 2));

  candidates.slice(0, 10).forEach(c => console.log(c));

  if (!shouldApply) return;

  let updated = 0;

  for (const c of candidates) {
    const ref = db.collection('sessions').doc(c.id);

    await ref.update({
      userId: targetUid,
      updatedAt: FieldValue.serverTimestamp(),
    });

    updated++;
  }

  console.log(JSON.stringify({
    mode: 'apply',
    updated,
  }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});