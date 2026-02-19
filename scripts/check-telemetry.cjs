#!/usr/bin/env node
/**
 * Verifica telemetry_sessions y config/telemetry en Firestore.
 * Uso: pnpm telemetry:check
 */
const admin = require('firebase-admin');

const projectId = process.env.PROJECT_ID || process.env.GCLOUD_PROJECT || 'aiduxcare-v2-uat-dev';

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const db = admin.firestore();

async function main() {
  console.log('Project:', projectId);
  console.log('');

  // 1. config/telemetry
  const configSnap = await db.doc('config/telemetry').get();
  console.log('--- config/telemetry ---');
  if (configSnap.exists) {
    console.log(JSON.stringify(configSnap.data(), null, 2));
  } else {
    console.log('(no existe)');
  }
  console.log('');

  // 2. telemetry_sessions (últimos 10)
  const sessionsSnap = await db.collection('telemetry_sessions').limit(10).get();
  console.log('--- telemetry_sessions (últimos 10) ---');
  console.log('Total docs en esta página:', sessionsSnap.size);

  if (sessionsSnap.empty) {
    console.log('(ningún documento)');
  } else {
    sessionsSnap.forEach((doc) => {
      const d = doc.data();
      const ts = d.createdAt ? new Date(d.createdAt).toISOString() : (d.startedAt?.toDate?.() || d.startedAt || '-');
      const hash = d.userIdHash ? `${d.userIdHash.slice(0, 12)}...` : '-';
      const fin = d.finalized != null ? d.finalized : '?';
      const reason = d.endedReason || '-';
      console.log(`  ${doc.id} | ${ts} | ${hash} | ${d.workflowType || '-'} | finalized=${fin} | ${reason}`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
