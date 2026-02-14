#!/usr/bin/env node
/**
 * Debug: Listar notas de consultations por patientId
 *
 * Para investigación CTO: baseline mostrando idioma inconsistente (español vs inglés).
 * Busca si existe alguna nota con texto en español que contenga las frases clave.
 *
 * Uso:
 *   node scripts/debug-consultations-by-patient.cjs UAq8lyrtl3LnlkXsgohE
 *
 * Credenciales: GOOGLE_APPLICATION_CREDENTIALS o gcloud auth application-default login
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

const SPANISH_KEYWORDS = [
  'durante el último tiempo',
  'core abdominal',
  'transverso del abdomen',
];

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

function containsSpanishKeywords(text) {
  if (!text || typeof text !== 'string') return [];
  const found = SPANISH_KEYWORDS.filter((kw) => text.includes(kw));
  return found;
}

async function main() {
  const patientId = process.argv[2] || 'UAq8lyrtl3LnlkXsgohE';
  const projectIdx = process.argv.indexOf('--project');
  const projectId = projectIdx >= 0 && process.argv[projectIdx + 1] ? process.argv[projectIdx + 1] : PROJECT_ID;

  console.log('\n=== Debug consultations por patientId ===\n');
  console.log('Proyecto:', projectId);
  console.log('patientId:', patientId);
  console.log('Buscando frases en español:', SPANISH_KEYWORDS.join(', '));
  console.log('');

  const db = initializeAdmin(projectId);

  const snapshot = await db
    .collection('consultations')
    .where('patientId', '==', patientId)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  console.log(`Notas encontradas: ${snapshot.size}\n`);

  if (snapshot.empty) {
    console.log('No hay notas para este paciente.');
    return;
  }

  snapshot.docs.forEach((doc, index) => {
    const data = doc.data();
    const plan = data.soapData?.plan ?? '';
    const createdAt = toPlain(data.createdAt);
    const visitType = data.visitType ?? '(no visitType)';

    const spanishFound = containsSpanishKeywords(plan);

    console.log(`--- Nota ${index} (${doc.id}) ---`);
    console.log('  authorUid:', data.authorUid ?? data.ownerUid ?? '(no author)');
    console.log('  visitType:', visitType);
    console.log('  createdAt:', createdAt);
    console.log('  plan (primeros 300 chars):');
    console.log('    ', plan.substring(0, 300).replace(/\n/g, '\n     '));
    if (plan.length > 300) console.log('    ...');
    if (spanishFound.length > 0) {
      console.log('  ⚠️  CONTIENE FRASES EN ESPAÑOL:', spanishFound.join(', '));
    } else {
      console.log('  Idioma: sin coincidencia con frases clave');
    }
    console.log('');
  });

  // Resumen: ¿alguna nota tiene el texto en español?
  const withSpanish = snapshot.docs.filter((doc) => {
    const plan = doc.data().soapData?.plan ?? '';
    return containsSpanishKeywords(plan).length > 0;
  });

  if (withSpanish.length > 0) {
    console.log('=== RESUMEN ===');
    console.log(`${withSpanish.length} nota(s) contienen las frases en español.`);
    console.log('Esas notas podrían ser la fuente del baseline en español.');
  }
}

main().catch((err) => {
  console.error(err);
  if (err.message?.includes('index')) {
    console.error('\nSi el error menciona "index", puede que falte un índice compuesto en Firestore.');
    console.error('Crea un índice para: consultations (patientId ASC, createdAt DESC)');
  }
  process.exit(1);
});
