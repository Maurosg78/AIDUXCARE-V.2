#!/usr/bin/env node
/**
 * Inspecciona un documento de telemetry_sessions por ID.
 * Uso: pnpm telemetry:inspect <sessionId>
 * Ej:  pnpm telemetry:inspect 06cb07dc-9237-4e0f-8643-ffa7cc947564
 */
const admin = require('firebase-admin');

const projectId = process.env.PROJECT_ID || process.env.GCLOUD_PROJECT || 'aiduxcare-v2-uat-dev';
const sessionId = process.argv[2];

if (!sessionId) {
  console.error('Uso: pnpm telemetry:inspect <sessionId>');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const db = admin.firestore();

function serializeTimestamps(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v.toDate === 'function') {
      out[k] = v.toDate().toISOString();
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = serializeTimestamps(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function main() {
  const snap = await db.collection('telemetry_sessions').doc(sessionId).get();

  if (!snap.exists) {
    console.error('Documento no encontrado:', sessionId);
    process.exit(1);
  }

  const data = serializeTimestamps(snap.data());
  console.log(JSON.stringify(data, null, 2));

  // Resumen de campos clave (auditoría)
  console.log('\n--- Campos clave ---');
  console.log('finalized:', data.finalized);
  console.log('endedReason:', data.endedReason ?? '(ausente)');
  console.log('soapGenerateClickedCount:', data.soapGenerateClickedCount ?? 0);
  console.log('soapGenerateSuccessCount:', data.soapGenerateSuccessCount ?? 0);
  console.log('soapGenerateFailureCount:', data.soapGenerateFailureCount ?? 0);
  console.log('regenerateCount:', data.regenerateCount ?? 0);
  console.log('validationErrorCount:', data.validationErrorCount ?? 0);
  if (data.blocks?.soap_subjective) {
    console.log('blocks.soap_subjective.renderedCount:', data.blocks.soap_subjective.renderedCount ?? '-');
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
