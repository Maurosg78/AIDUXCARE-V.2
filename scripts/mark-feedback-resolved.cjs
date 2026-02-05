#!/usr/bin/env node
/**
 * Marcar feedback como resuelto o no resuelto (Firestore user_feedback)
 *
 * Campos que se escriben: resolved (bool), resolvedAt (timestamp), resolvedBy (string).
 *
 * Uso:
 *   node scripts/mark-feedback-resolved.cjs ID1 [ID2 ID3 ...]           # marcar como resuelto
 *   node scripts/mark-feedback-resolved.cjs --file ids.txt              # un ID por línea
 *   node scripts/mark-feedback-resolved.cjs --from-export export.json --filter localhost  # marcar todos donde url incluye "localhost"
 *   node scripts/mark-feedback-resolved.cjs --unresolve ID              # marcar como no resuelto
 *
 * Credenciales: igual que export-user-feedback.cjs (gcloud o GOOGLE_APPLICATION_CREDENTIALS).
 */

const { resolve, isAbsolute } = require('path');
const fs = require('fs');

const path = resolve(process.cwd(), '.env.local');
if (fs.existsSync(path)) {
  require('dotenv').config({ path });
}

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

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

async function main() {
  const args = process.argv.slice(2);
  const projectIdx = args.indexOf('--project');
  const projectId = projectIdx >= 0 && args[projectIdx + 1] ? args[projectIdx + 1] : PROJECT_ID;
  const unresolve = args.includes('--unresolve');
  const fileIdx = args.indexOf('--file');
  const fromExportIdx = args.indexOf('--from-export');
  const filterIdx = args.indexOf('--filter');

  let ids = [];
  const resolvedBy = process.env.USER || 'script';

  if (fromExportIdx >= 0 && args[fromExportIdx + 1]) {
    const exportPath = resolve(process.cwd(), args[fromExportIdx + 1]);
    const filterSubstr = filterIdx >= 0 && args[filterIdx + 1] ? args[filterIdx + 1] : null;
    const data = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    if (!Array.isArray(data)) throw new Error('El JSON de export debe ser un array de objetos con id y url.');
    ids = data
      .filter((item) => !filterSubstr || (item.url && String(item.url).includes(filterSubstr)))
      .map((item) => item.id);
    console.log('Desde export:', exportPath, filterSubstr ? `filter url contains "${filterSubstr}"` : '', '→', ids.length, 'ids');
  } else if (fileIdx >= 0 && args[fileIdx + 1]) {
    const filePath = resolve(process.cwd(), args[fileIdx + 1]);
    const content = fs.readFileSync(filePath, 'utf8');
    ids = content
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    console.log('Desde archivo:', filePath, '→', ids.length, 'ids');
  } else {
    ids = args.filter((a) => !a.startsWith('--') && a.length > 0);
    if (unresolve) ids = ids.filter((id) => id !== '--unresolve');
  }

  if (ids.length === 0) {
    console.error('Uso: node scripts/mark-feedback-resolved.cjs ID1 [ID2 ...]');
    console.error('  o: node scripts/mark-feedback-resolved.cjs --file ids.txt');
    console.error('  o: node scripts/mark-feedback-resolved.cjs --from-export scripts/exports/xxx.json --filter localhost');
    console.error('  o: node scripts/mark-feedback-resolved.cjs --unresolve ID');
    process.exit(1);
  }

  const db = initializeAdmin(projectId);
  const ref = db.collection(COLLECTION);

  const update = unresolve
    ? { resolved: false, resolvedAt: FieldValue.delete(), resolvedBy: FieldValue.delete() }
    : { resolved: true, resolvedAt: FieldValue.serverTimestamp(), resolvedBy };

  let ok = 0;
  let notFound = 0;
  for (const id of ids) {
    const docRef = ref.doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      console.warn('No existe:', id);
      notFound++;
      continue;
    }
    await docRef.update(update);
    console.log(unresolve ? 'No resuelto:' : 'Resuelto:', id);
    ok++;
  }

  console.log('OK:', ok, 'No encontrados:', notFound);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
