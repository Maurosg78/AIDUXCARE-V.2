#!/usr/bin/env node
/**
 * Audit encounters with missing linkage fields.
 *
 * Flags encounters that are missing:
 * - sessionId
 * - visitType
 * - owner field (authorUid or userId)
 *
 * Usage:
 *   node scripts/qa/audit-orphan-encounters.cjs
 */

const { resolve, isAbsolute } = require('path');
const fs = require('fs');

const envPath = resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const PROJECT_ID = 'aiduxcare-v2-uat-dev';

function initializeAdmin(projectId) {
  if (getApps().length > 0) {
    return getFirestore();
  }

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
    return getFirestore();
  }

  if (serviceAccountPath) {
    console.warn('⚠️ GOOGLE_APPLICATION_CREDENTIALS apunta a un archivo inexistente. Usando credenciales por defecto.');
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }

  initializeApp({ projectId });
  return getFirestore();
}

function toIso(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function isMissingString(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

async function main() {
  const projectId = PROJECT_ID;
  const db = initializeAdmin(projectId);
  const encountersSnapshot = await db.collection('encounters').get();
  const rows = encountersSnapshot.docs.map((doc) => {
    const data = doc.data();
    const sessionId = data.sessionId ?? null;
    const visitType = data.visitType ?? null;
    const authorUid = data.authorUid ?? null;
    const userId = data.userId ?? null;
    const missingSessionId = isMissingString(sessionId);
    const missingVisitType = isMissingString(visitType);
    const missingAuthorUid = isMissingString(authorUid);
    const missingUserId = isMissingString(userId);
    const missingOwner = missingAuthorUid && missingUserId;
    const orphaned = missingSessionId || missingVisitType || missingOwner;
    const missingFields = [];

    if (missingSessionId) {
      missingFields.push('sessionId');
    }

    if (missingVisitType) {
      missingFields.push('visitType');
    }

    if (missingOwner) {
      missingFields.push('owner');
    }

    return {
      docId: doc.id,
      sessionId,
      visitType,
      authorUid,
      userId,
      missingSessionId,
      missingVisitType,
      missingAuthorUid,
      missingUserId,
      missingOwner,
      missingFields,
      orphaned,
    };
  });

  const orphanedRows = rows.filter((row) => row.orphaned);
  const completeRows = rows.filter((row) => !row.orphaned);
  const orphanedSummary = orphanedRows.map((row) => ({
    docId: row.docId,
    missingFields: row.missingFields,
  }));
  const completeSummary = completeRows.map((row) => ({
    docId: row.docId,
    sessionId: row.sessionId,
    visitType: row.visitType,
    authorUid: row.authorUid,
    userId: row.userId,
  }));

  const report = {
    projectId,
    totalEncounters: rows.length,
    orphanCount: orphanedRows.length,
    orphanedEncounters: orphanedSummary,
    completeEncounters: completeSummary,
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
