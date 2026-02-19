#!/usr/bin/env node
/**
 * Crea o actualiza config/telemetry en Firestore.
 * Uso: pnpm telemetry:setup
 * Sin enabledUserHashes → usa sampleRate para todos.
 */
const admin = require('firebase-admin');

const projectId = process.env.PROJECT_ID || process.env.GCLOUD_PROJECT || 'aiduxcare-v2-uat-dev';

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const db = admin.firestore();

const CONFIG = {
  enabled: true,
  sampleRate: 1,
  // NO enabledUserHashes → sampleRate aplica a todos
};

async function main() {
  console.log('Project:', projectId);
  console.log('');

  const ref = db.doc('config/telemetry');
  const before = await ref.get();

  await ref.set(CONFIG, { merge: true });

  console.log('--- config/telemetry ---');
  console.log(before.exists ? '(actualizado)' : '(creado)');
  console.log(JSON.stringify(CONFIG, null, 2));
  console.log('');
  console.log('OK. Refresca localhost, entra al workflow, luego: pnpm telemetry:check');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
