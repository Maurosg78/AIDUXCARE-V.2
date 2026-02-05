#!/usr/bin/env node
/**
 * Export User Feedback (formulario flotante)
 *
 * Lee la colección user_feedback de Firestore y exporta a JSON (y opcionalmente CSV).
 * Sirve para rescatar sugerencias y feedback del piloto.
 *
 * Uso:
 *   node scripts/export-user-feedback.cjs [--csv] [--unresolved-only | --resolved-only] [--project PROYECTO]
 *
 * Credenciales (una de las dos):
 *   - GOOGLE_APPLICATION_CREDENTIALS=ruta/real/al/service-account.json
 *   - O sin esa variable: gcloud auth application-default login
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
const COLLECTION = 'user_feedback';

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
        console.warn('⚠️  GOOGLE_APPLICATION_CREDENTIALS apunta a un archivo que no existe. Usando credenciales por defecto (gcloud).');
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

function rowToCsvRow(row) {
  const esc = (v) => {
    if (v == null) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    row.id,
    row.type,
    row.severity,
    row.description,
    row.url,
    row.userId ?? '',
    row.timestamp ?? '',
    row.resolved === true ? 'true' : (row.resolved === false ? 'false' : ''),
    row.resolvedAt ?? '',
    row.resolvedBy ?? '',
    row.autoTags ? row.autoTags.join(';') : '',
    row.calculatedPriority ?? '',
    row.enrichedContext ? JSON.stringify(row.enrichedContext) : '',
  ].map(esc).join(',');
}

async function main() {
  const args = process.argv.slice(2);
  const outCsv = args.includes('--csv');
  const unresolvedOnly = args.includes('--unresolved-only');
  const resolvedOnly = args.includes('--resolved-only');
  const projectIdx = args.indexOf('--project');
  const projectId = projectIdx >= 0 && args[projectIdx + 1] ? args[projectIdx + 1] : PROJECT_ID;

  console.log('Proyecto:', projectId);
  console.log('Colección:', COLLECTION);

  const db = initializeAdmin(projectId);
  const snap = await db.collection(COLLECTION).orderBy('timestamp', 'desc').get();

  let rows = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...toPlain(data),
    };
  });

  if (unresolvedOnly) {
    rows = rows.filter((r) => r.resolved !== true);
    console.log('Filtro: solo no resueltos');
  } else if (resolvedOnly) {
    rows = rows.filter((r) => r.resolved === true);
    console.log('Filtro: solo resueltos');
  }

  console.log('Registros encontrados:', rows.length);

  const outDir = resolve(process.cwd(), 'scripts', 'exports');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const baseName = `user_feedback_${projectId}_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
  const jsonPath = resolve(outDir, `${baseName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2), 'utf8');
  console.log('JSON guardado:', jsonPath);

  if (outCsv) {
    const header = 'id,type,severity,description,url,userId,timestamp,resolved,resolvedAt,resolvedBy,autoTags,calculatedPriority,enrichedContext';
    const csvLines = [header, ...rows.map(rowToCsvRow)];
    const csvPath = resolve(outDir, `${baseName}.csv`);
    fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
    console.log('CSV guardado:', csvPath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
