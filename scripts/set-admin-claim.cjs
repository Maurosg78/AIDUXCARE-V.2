#!/usr/bin/env node
/**
 * Asignar custom claim "admin" a un usuario (Firebase Auth)
 *
 * Las reglas de Firestore exigen request.auth.token.admin == true para leer
 * user_feedback, analytics_events, etc. Este script pone admin: true en tu usuario.
 *
 * Uso:
 *   node scripts/set-admin-claim.cjs TU_EMAIL@ejemplo.com
 *   node scripts/set-admin-claim.cjs --uid UID_DEL_USUARIO
 *
 * Credenciales (una de las dos):
 *   - GOOGLE_APPLICATION_CREDENTIALS=ruta/al/service-account.json (ruta real al JSON descargado)
 *   - O sin esa variable: gcloud auth application-default login
 */

const { resolve, isAbsolute } = require('path');
const fs = require('fs');

const path = resolve(process.cwd(), '.env.local');
if (fs.existsSync(path)) {
  require('dotenv').config({ path });
}

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

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
      if (serviceAccountPath) {
        console.warn('⚠️  GOOGLE_APPLICATION_CREDENTIALS apunta a un archivo que no existe. Usando credenciales por defecto (gcloud).');
        delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      }
      initializeApp({ projectId: projectId || PROJECT_ID });
    }
  }
  return getAuth();
}

async function main() {
  const args = process.argv.slice(2);
  const projectIdx = args.indexOf('--project');
  const projectId = projectIdx >= 0 && args[projectIdx + 1] ? args[projectIdx + 1] : PROJECT_ID;
  const uidIdx = args.indexOf('--uid');
  const uidArg = uidIdx >= 0 && args[uidIdx + 1] ? args[uidIdx + 1] : null;
  const emailArg = args.filter((a) => !a.startsWith('--') && a.includes('@'))[0];

  if (!uidArg && !emailArg) {
    console.error('Uso: node scripts/set-admin-claim.cjs TU_EMAIL@ejemplo.com');
    console.error('  o: node scripts/set-admin-claim.cjs --uid UID_DEL_USUARIO');
    process.exit(1);
  }

  const auth = initializeAdmin(projectId);
  let uid = uidArg;

  if (!uid && emailArg) {
    const user = await auth.getUserByEmail(emailArg);
    uid = user.uid;
    console.log('Usuario encontrado:', user.email, 'UID:', uid);
  }

  await auth.setCustomUserClaims(uid, { admin: true });
  console.log('OK: custom claim admin=true asignado al usuario', uid);
  console.log('El usuario debe cerrar sesión y volver a entrar para que el token se actualice.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
