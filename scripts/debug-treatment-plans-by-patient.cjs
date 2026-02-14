#!/usr/bin/env node
/**
 * Debug: Listar treatment_plans por patientId
 *
 * Para investigación CTO: baseline/plan mostrando idioma inconsistente.
 * La colección treatment_plans es la fuente de previousTreatmentPlan.planText
 * que alimenta "Today's in-clinic treatment" y "HEP" en follow-up.
 *
 * Uso:
 *   node scripts/debug-treatment-plans-by-patient.cjs UAq8lyrtl3LnlkXsgohE
 */

const { resolve, isAbsolute } = require('path');
const fs = require('fs');

const path = resolve(process.cwd(), '.env.local');
if (fs.existsSync(path)) {
  require('dotenv').config({ path });
}

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID || 'aiduxcare-v2-uat-dev';

const SPANISH_MARKERS = ['durante el último tiempo', 'transverso del abdomen', 'flexibilización lumbar'];

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
        console.warn('⚠️  GOOGLE_APPLICATION_CREDENTIALS apunta a un archivo que no existe. Usando gcloud.');
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      }
      initializeApp({ projectId: projectId || PROJECT_ID });
    }
  }
  return getFirestore();
}

function toPlain(obj) {
  if (obj == null) return obj;
  if (obj && typeof obj.toDate === 'function') return obj.toDate().toISOString();
  if (Array.isArray(obj)) return obj.map(toPlain);
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = toPlain(v);
    return out;
  }
  return obj;
}

function hasSpanish(text) {
  if (!text || typeof text !== 'string') return false;
  return SPANISH_MARKERS.some((m) => text.includes(m));
}

async function main() {
  const patientId = process.argv[2] || 'UAq8lyrtl3LnlkXsgohE';
  const projectIdx = process.argv.indexOf('--project');
  const projectId = projectIdx >= 0 && process.argv[projectIdx + 1] ? process.argv[projectIdx + 1] : PROJECT_ID;

  console.log('\n=== Debug treatment_plans por patientId ===\n');
  console.log('Proyecto:', projectId);
  console.log('patientId:', patientId);
  console.log('Esta colección alimenta previousTreatmentPlan.planText (Today\'s treatment + HEP)\n');

  const db = initializeAdmin(projectId);

  const snapshot = await db
    .collection('treatment_plans')
    .where('patientId', '==', patientId)
    .orderBy('acceptedAt', 'desc')
    .limit(10)
    .get();

  console.log(`Planes encontrados: ${snapshot.size}\n`);

  if (snapshot.empty) {
    console.log('No hay treatment_plans para este paciente.');
    console.log('→ previousTreatmentPlan sería null; el plan vendría de followUpClinicalState.baselineSOAP');
    return;
  }

  snapshot.docs.forEach((doc, index) => {
    const data = doc.data();
    const planText = data.planText ?? '';
    const acceptedAt = toPlain(data.acceptedAt);
    const visitType = data.visitType ?? '(no visitType)';
    const authorUid = data.authorUid ?? '(no authorUid)';

    const isSpanish = hasSpanish(planText);

    console.log(`--- Plan ${index} (${doc.id}) ---`);
    console.log('  authorUid:', authorUid);
    console.log('  visitType:', visitType);
    console.log('  acceptedAt:', acceptedAt);
    console.log('  planText (primeros 400 chars):');
    console.log('    ', planText.substring(0, 400).replace(/\n/g, '\n     '));
    if (planText.length > 400) console.log('    ...');
    if (isSpanish) {
      console.log('  ⚠️  CONTIENE TEXTO EN ESPAÑOL (marcadores: durante el último tiempo, transverso, flexibilización)');
    }
    console.log('');
  });

  const withSpanish = snapshot.docs.filter((doc) => hasSpanish(doc.data().planText ?? ''));
  if (withSpanish.length > 0) {
    console.log('=== RESUMEN ===');
    console.log(`${withSpanish.length} plan(es) contienen texto en español.`);
    console.log('El más reciente (por acceptedAt) es el que usa getTreatmentPlan().');
    console.log('Si el plan más reciente está en español, eso explica el baseline en español en la UI.');
  }
}

main().catch((err) => {
  console.error(err);
  if (err.message?.includes('index')) {
    console.error('\nSi el error menciona "index", puede que falte un índice en Firestore.');
    console.error('Crea un índice para: treatment_plans (patientId ASC, acceptedAt DESC)');
  }
  process.exit(1);
});
