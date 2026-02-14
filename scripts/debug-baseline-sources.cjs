#!/usr/bin/env node
/**
 * Debug: Verificar TODAS las fuentes de baseline para un paciente
 *
 * Consultations, treatment_plans, patients.activeBaselineId, clinical_baselines
 *
 * Uso:
 *   node scripts/debug-baseline-sources.cjs UAq8lyrtl3LnlkXsgohE
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
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
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

async function main() {
  const patientId = process.argv[2] || 'UAq8lyrtl3LnlkXsgohE';

  console.log('\n=== Fuentes de baseline para', patientId, '===\n');

  const db = initializeAdmin(PROJECT_ID);

  // 1. Patient → activeBaselineId
  const patientSnap = await db.collection('patients').doc(patientId).get();
  const patient = patientSnap.exists ? patientSnap.data() : null;
  const activeBaselineId = patient?.activeBaselineId;

  console.log('1. PATIENTS');
  console.log('   activeBaselineId:', activeBaselineId || '(ninguno)');
  console.log('');

  // 2. clinical_baselines (si existe activeBaselineId)
  if (activeBaselineId) {
    const blSnap = await db.collection('clinical_baselines').doc(activeBaselineId).get();
    if (blSnap.exists) {
      const bl = blSnap.data();
      const planSummary = bl.snapshot?.planSummary ?? '';
      console.log('2. CLINICAL_BASELINES (fallback cuando no hay notas)');
      console.log('   baselineId:', activeBaselineId);
      console.log('   planSummary (primeros 300 chars):');
      console.log('   ', planSummary.substring(0, 300).replace(/\n/g, '\n    '));
      console.log('   ¿Español?', /durante el último|transverso del abdomen|flexibilización/.test(planSummary) ? 'SÍ' : 'No');
    } else {
      console.log('2. CLINICAL_BASELINES: documento no encontrado');
    }
  } else {
    console.log('2. CLINICAL_BASELINES: no aplica (sin activeBaselineId)');
  }
  console.log('');

  // 3. consultations (nota más reciente)
  const notesSnap = await db
    .collection('consultations')
    .where('patientId', '==', patientId)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (!notesSnap.empty) {
    const note = notesSnap.docs[0].data();
    const plan = note.soapData?.plan ?? '';
    console.log('3. CONSULTATIONS (nota más reciente - path A1)');
    console.log('   id:', notesSnap.docs[0].id);
    console.log('   createdAt:', toPlain(note.createdAt));
    console.log('   plan (primeros 200 chars):');
    console.log('   ', plan.substring(0, 200).replace(/\n/g, '\n    '));
    console.log('   ¿Español?', /durante el último|transverso del abdomen|flexibilización/.test(plan) ? 'SÍ' : 'No');
  } else {
    console.log('3. CONSULTATIONS: 0 notas → se usa fallback clinical_baselines');
  }
  console.log('');

  // 4. treatment_plans (más reciente)
  const plansSnap = await db
    .collection('treatment_plans')
    .where('patientId', '==', patientId)
    .orderBy('acceptedAt', 'desc')
    .limit(1)
    .get();

  if (!plansSnap.empty) {
    const plan = plansSnap.docs[0].data();
    const planText = plan.planText ?? '';
    console.log('4. TREATMENT_PLANS (previousTreatmentPlan - fallback si baseline vacío)');
    console.log('   id:', plansSnap.docs[0].id);
    console.log('   acceptedAt:', toPlain(plan.acceptedAt));
    console.log('   planText (primeros 200 chars):');
    console.log('   ', planText.substring(0, 200).replace(/\n/g, '\n    '));
    console.log('   ¿Español?', /durante el último|transverso del abdomen|flexibilización/.test(planText) ? 'SÍ' : 'No');
  } else {
    console.log('4. TREATMENT_PLANS: 0 planes');
  }

  console.log('\n=== Orden de prioridad en la UI ===');
  console.log('planText = followUpClinicalState.baselineSOAP.plan || previousTreatmentPlan.planText');
  console.log('baselineSOAP viene de: consultations (A1) si hay notas, sino clinical_baselines (A3)');
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
