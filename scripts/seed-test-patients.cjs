#!/usr/bin/env node
/**
 * Crea uno o más pacientes de prueba en Firestore usando Firebase Admin (mismas creds que export-user-feedback).
 * Evita crear pacientes a mano en la UI: ejecutás desde terminal y abrís los enlaces impresos.
 *
 * Requisitos:
 *   - ownerUid = UID de Firebase Auth del profesional que va a ver esos pacientes en Command Center / workflow.
 *     Obtenerlo: Firebase Console → Authentication → usuario → UID, o desde la app (perfil).
 *   - gcloud auth application-default login  O  GOOGLE_APPLICATION_CREDENTIALS hacia service account con permiso en el proyecto.
 *
 * Uso:
 *   node scripts/seed-test-patients.cjs --owner-uid <FIREBASE_UID> [--count 3] [--project aiduxcare-v2-uat-dev]
 *
 * Variables opcionales:
 *   AIDUX_SEED_OWNER_UID   si no pasás --owner-uid
 *   VITE_APP_URL           base para imprimir enlaces (default https://pilot.aiduxcare.com)
 *
 * Salida:
 *   - IDs generados y URLs /workflow?type=initial&patientId=...
 *   - Con --json: una línea JSON por paciente (útil para pipelines)
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

function initializeAdmin(projectId) {
  if (getApps().length === 0) {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const fullPath = serviceAccountPath
      ? isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : resolve(process.cwd(), serviceAccountPath)
      : null;
    if (fullPath && fs.existsSync(fullPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId || serviceAccount.project_id,
      });
    } else {
      if (serviceAccountPath) {
        console.warn(
          '⚠️  GOOGLE_APPLICATION_CREDENTIALS apunta a un archivo inexistente; se usa credencial por defecto (p. ej. gcloud).'
        );
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      }
      initializeApp({ projectId: projectId || PROJECT_ID });
    }
  }
  return getFirestore();
}

function parseArgs(argv) {
  const out = {
    ownerUid: process.env.AIDUX_SEED_OWNER_UID || '',
    count: 1,
    project: PROJECT_ID,
    baseUrl: (process.env.VITE_APP_URL || 'https://pilot.aiduxcare.com').replace(/\/$/, ''),
    json: false,
    chiefComplaint: 'Motivo de consulta de prueba (paciente sembrado por scripts/seed-test-patients.cjs).',
    tag: 'cli-seed',
  };
  const skip = new Set();
  const flagNext = (name) => {
    const i = argv.indexOf(name);
    if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--')) skip.add(argv[i + 1]);
  };
  flagNext('--owner-uid');
  flagNext('--count');
  flagNext('--project');
  flagNext('--base-url');
  flagNext('--chief-complaint');
  flagNext('--tag');

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--owner-uid' && argv[i + 1]) out.ownerUid = argv[++i];
    else if (a === '--count' && argv[i + 1]) out.count = Math.max(1, parseInt(argv[++i], 10) || 1);
    else if (a === '--project' && argv[i + 1]) out.project = argv[++i];
    else if (a === '--base-url' && argv[i + 1]) out.baseUrl = String(argv[++i]).replace(/\/$/, '');
    else if (a === '--chief-complaint' && argv[i + 1]) out.chiefComplaint = argv[++i];
    else if (a === '--tag' && argv[i + 1]) out.tag = argv[++i];
    else if (a === '--json') out.json = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

async function main() {
  const argv = process.argv.slice(2);
  const opts = parseArgs(argv);

  if (opts.help) {
    console.log(`Usage: node scripts/seed-test-patients.cjs --owner-uid <UID> [options]
Options:
  --count N           Número de pacientes (default 1)
  --project ID        Firestore project (default ${PROJECT_ID})
  --base-url URL      Base para enlaces impresos
  --chief-complaint   Texto del motivo de consulta
  --tag LABEL         Incluido en lastName para filtrar en UI (default cli-seed)
  --json              Una línea JSON por paciente en stdout
Env:
  AIDUX_SEED_OWNER_UID  UID por defecto si no pasás --owner-uid
`);
    process.exit(0);
  }

  if (!opts.ownerUid.trim()) {
    console.error('Error: falta --owner-uid (UID del profesional en Firebase Auth) o AIDUX_SEED_OWNER_UID.');
    process.exit(1);
  }

  const db = initializeAdmin(opts.project);
  const batchLabel = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const created = [];

  for (let i = 0; i < opts.count; i++) {
    const suffix = `${batchLabel}-${i + 1}`;
    const firstName = 'QA';
    const lastName = `${opts.tag}-${suffix}`;
    const fullName = `${firstName} ${lastName}`;
    /* Móvil ES de prueba: +34 + 9 dígitos nacionales (6xxxxxxxx) */
    const tail8 = String((Date.now() + i * 9973) % 100000000).padStart(8, '0');
    const phone = `+346${tail8}`;
    const doc = {
      firstName,
      lastName,
      fullName,
      chiefComplaint: opts.chiefComplaint,
      birthDate: '1990-01-01',
      email: `qa.seed.${suffix.replace(/[^a-z0-9-]/gi, '')}@aiduxcare.test`,
      phone,
      status: 'active',
      ownerUid: opts.ownerUid.trim(),
      preferredLanguage: 'es',
      nameLower: fullName.trim().toLowerCase(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      /** Para localizar semillas en soporte / borrado masivo */
      seedSource: 'seed-test-patients.cjs',
      seedBatch: batchLabel,
    };

    const ref = await db.collection('patients').add(doc);
    const id = ref.id;
    const workflowInitial = `${opts.baseUrl}/workflow?type=initial&patientId=${encodeURIComponent(id)}`;
    const workflowFollowup = `${opts.baseUrl}/workflow?type=followup&patientId=${encodeURIComponent(id)}`;
    const patientPage = `${opts.baseUrl}/patients/${encodeURIComponent(id)}`;

    created.push({ id, fullName, phone: doc.phone, workflowInitial, workflowFollowup, patientPage });

    if (opts.json) {
      console.log(JSON.stringify({ id, fullName, workflowInitial, workflowFollowup, patientPage }));
    }
  }

  if (!opts.json) {
    console.log('');
    console.log('=== seed-test-patients ===');
    console.log('Proyecto:', opts.project);
    console.log('ownerUid:', opts.ownerUid.trim());
    console.log('Pacientes creados:', created.length);
    console.log('');
    created.forEach((row, idx) => {
      console.log(`--- #${idx + 1} ${row.fullName} ---`);
      console.log('  id:', row.id);
      console.log('  tel:', row.phone);
      console.log('  inicial: ', row.workflowInitial);
      console.log('  seguimiento:', row.workflowFollowup);
      console.log('  ficha:    ', row.patientPage);
      console.log('');
    });
    console.log('Siguiente paso: iniciá sesión en la app con el mismo usuario (ownerUid) y abrí un enlace, o pegá el id en el workflow.');
    console.log('Trazas: en el navegador abrí DevTools → Consola / Red mientras usás el flujo; este script no sustituye el navegador para audio/SOAP.');
    console.log('');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
