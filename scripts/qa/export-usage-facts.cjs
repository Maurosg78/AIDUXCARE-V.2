#!/usr/bin/env node
/**
 * Export usage session facts without PHI.
 *
 * Reads Firestore sessions with Firebase Admin SDK and materializes
 * privacy-safe usage_session_facts exports for pilot usage reporting.
 *
 * Rules:
 * - Do not export transcript, soapNote, or clinical text fields.
 * - Hash userId and patientId with SHA-256.
 * - Read real userId only to derive hashedUserId.
 *
 * Usage:
 *   node scripts/qa/export-usage-facts.cjs
 *
 * Credentials:
 *   gcloud auth application-default login
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const admin = require('firebase-admin');

const PROJECT_ID = 'aiduxcare-v2-uat-dev';
const COLLECTION = 'sessions';
const APP_VERSION = 'pilot-2026-06';
const ENVIRONMENT = 'pilot';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });
}

const db = admin.firestore();

function sha256(value) {
  const normalizedValue = value == null ? '' : String(value);
  return crypto.createHash('sha256').update(normalizedValue).digest('hex');
}

function toIsoOrNull(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

function transcriptLengthBucket(length) {
  if (!length || length <= 0) return 'none';
  if (length <= 500) return 'short';
  if (length <= 2000) return 'medium';
  return 'long';
}

function deriveOutcome(session) {
  const writeState = session.writeState ?? 'draft';
  const hasTranscript = Boolean(session.transcript?.trim());
  const soapFinalized = session.soapStatus === 'finalized';

  if (writeState === 'fully_committed') return 'completed_finalized';
  if (writeState === 'commit_failed') return 'failed_persistence';
  if (writeState === 'soap_saved' || writeState === 'encounter_saved') return 'completed_draft';
  if (writeState === 'soap_generated' && !soapFinalized) return 'completed_draft';
  if (hasTranscript) return 'interrupted_with_transcript';
  return 'interrupted_no_transcript';
}

function buildUsageFact(doc) {
  const session = doc.data();
  const sessionId = session.sessionId ?? doc.id;
  const userId = session.userId ?? '';
  const patientId = session.patientId ?? '';
  const writeState = session.writeState ?? 'draft';
  const transcriptLength = typeof session.transcript === 'string' ? session.transcript.length : 0;
  const transcriptPresent = Boolean(session.transcript?.trim());
  const soapGenerated = [
    'soap_generated',
    'soap_saved',
    'encounter_saved',
    'fully_committed',
  ].includes(writeState);

  return {
    usageSessionId: doc.id,
    hashedUserId: sha256(userId),
    sessionId,
    patientIdHash: sha256(patientId),
    visitType: session.visitType ?? 'unknown',
    writeState,
    soapStatus: session.soapStatus ?? null,
    transcriptPresent,
    transcriptLengthBucket: transcriptLengthBucket(transcriptLength),
    soapGenerated,
    soapFinalized: session.soapStatus === 'finalized',
    encounterCreated: writeState === 'fully_committed',
    outcome: deriveOutcome(session),
    appVersion: APP_VERSION,
    environment: ENVIRONMENT,
    startedAt: toIsoOrNull(session.createdAt),
    lastActivityAt: toIsoOrNull(session.updatedAt),
  };
}

function csvEscape(value) {
  if (value == null) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function toCsv(rows) {
  const headers = [
    'usageSessionId',
    'hashedUserId',
    'sessionId',
    'patientIdHash',
    'visitType',
    'writeState',
    'soapStatus',
    'transcriptPresent',
    'transcriptLengthBucket',
    'soapGenerated',
    'soapFinalized',
    'encounterCreated',
    'outcome',
    'appVersion',
    'environment',
    'startedAt',
    'lastActivityAt',
  ];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function summarize(rows) {
  const breakdown = rows.reduce((acc, row) => {
    acc[row.outcome] = (acc[row.outcome] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalSessions: rows.length,
    outcomeBreakdown: breakdown,
  };
}

async function main() {
  const snapshot = await db.collection(COLLECTION).get();
  const rows = snapshot.docs.map(buildUsageFact);
  const stamp = todayStamp();
  const exportsDir = path.resolve(process.cwd(), 'scripts', 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });

  const jsonPath = path.join(exportsDir, `usage_session_facts_${stamp}.json`);
  const csvPath = path.join(exportsDir, `usage_session_facts_${stamp}.csv`);

  fs.writeFileSync(jsonPath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
  fs.writeFileSync(csvPath, toCsv(rows), 'utf8');

  const summary = summarize(rows);
  console.log(JSON.stringify(summary, null, 2));
  console.log(`JSON: ${jsonPath}`);
  console.log(`CSV: ${csvPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
