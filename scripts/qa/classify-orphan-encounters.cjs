#!/usr/bin/env node
/**
 * Dry-run classifier for orphan encounters.
 *
 * Proposes:
 * - derivedVisitType
 * - derivedSessionId
 * - confidence
 * - source
 *
 * Matching strategy:
 * 1. Same patient + nearest consultation timestamp within 24h
 * 2. Same patient + nearest session timestamp within 24h
 * 3. Ordinal fallback from patient's encounter timeline
 *
 * Usage:
 *   node scripts/qa/classify-orphan-encounters.cjs
 *   node scripts/qa/classify-orphan-encounters.cjs --project aiduxcare-v2-uat-dev
 */

const { resolve, isAbsolute } = require('path');
const fs = require('fs');

const envPath = resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const DEFAULT_PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  'aiduxcare-v2-uat-dev';

const MAX_MATCH_DISTANCE_MS = 24 * 60 * 60 * 1000;

function parseProjectId() {
  const projectIndex = process.argv.indexOf('--project');
  const projectValue = projectIndex >= 0 ? process.argv[projectIndex + 1] : null;
  const projectId = projectValue || DEFAULT_PROJECT_ID;
  return projectId;
}

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

function toMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === 'function') {
    return value.toMillis();
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isMissingString(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

function canonicalVisitType(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'initial') {
    return 'initial';
  }
  if (normalized === 'follow-up' || normalized === 'followup') {
    return 'follow-up';
  }
  return null;
}

function getEncounterTimestamp(data) {
  const encounterDateMs = toMillis(data.encounterDate);
  if (encounterDateMs > 0) {
    return encounterDateMs;
  }
  const createdAtMs = toMillis(data.createdAt);
  return createdAtMs;
}

function buildCandidate(doc, kind) {
  const data = doc.data();
  const visitType = canonicalVisitType(data.visitType ?? data.sessionType ?? null);
  const sessionId = data.sessionId ?? (kind === 'session' ? doc.id : null);
  const timestampValue =
    kind === 'consultation'
      ? data.createdAt
      : data.timestamp ?? data.createdAt ?? data.encounterDate;
  const timestampMs = toMillis(timestampValue);

  return {
    kind,
    docId: doc.id,
    patientId: data.patientId ?? null,
    visitType,
    sessionId,
    timestampMs,
    timestampIso: toIso(timestampValue),
  };
}

function chooseNearestCandidate(encounterMs, candidates) {
  const eligible = candidates
    .map((candidate) => {
      const distanceMs = Math.abs(candidate.timestampMs - encounterMs);
      return {
        ...candidate,
        distanceMs,
      };
    })
    .filter((candidate) => candidate.timestampMs > 0)
    .filter((candidate) => candidate.distanceMs <= MAX_MATCH_DISTANCE_MS)
    .sort((left, right) => left.distanceMs - right.distanceMs);

  return eligible[0] ?? null;
}

function inferVisitTypeFromOrdinal(index) {
  return index === 0 ? 'initial' : 'follow-up';
}

async function main() {
  const projectId = parseProjectId();
  const db = initializeAdmin(projectId);
  const encountersSnapshot = await db.collection('encounters').get();
  const consultationsSnapshot = await db.collection('consultations').get();
  const sessionsSnapshot = await db.collection('sessions').get();

  const consultationsByPatient = new Map();
  const sessionsByPatient = new Map();

  consultationsSnapshot.docs.forEach((doc) => {
    const candidate = buildCandidate(doc, 'consultation');
    const key = candidate.patientId;
    if (!key) {
      return;
    }
    const bucket = consultationsByPatient.get(key) ?? [];
    bucket.push(candidate);
    consultationsByPatient.set(key, bucket);
  });

  sessionsSnapshot.docs.forEach((doc) => {
    const candidate = buildCandidate(doc, 'session');
    const key = candidate.patientId;
    if (!key) {
      return;
    }
    const bucket = sessionsByPatient.get(key) ?? [];
    bucket.push(candidate);
    sessionsByPatient.set(key, bucket);
  });

  const allEncounters = encountersSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      docId: doc.id,
      patientId: data.patientId ?? null,
      authorUid: data.authorUid ?? null,
      status: data.status ?? null,
      encounterDate: toIso(data.encounterDate),
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
      encounterMs: getEncounterTimestamp(data),
      sessionId: data.sessionId ?? null,
      visitType: canonicalVisitType(data.visitType ?? null),
      orphaned: isMissingString(data.sessionId) || isMissingString(data.visitType),
    };
  });

  const encountersByPatient = new Map();
  allEncounters.forEach((encounter) => {
    const key = encounter.patientId;
    if (!key) {
      return;
    }
    const bucket = encountersByPatient.get(key) ?? [];
    bucket.push(encounter);
    encountersByPatient.set(key, bucket);
  });

  const orphaned = allEncounters.filter((encounter) => encounter.orphaned);
  const proposals = orphaned.map((encounter) => {
    const patientId = encounter.patientId;
    const encounterMs = encounter.encounterMs;
    const consultationCandidates = consultationsByPatient.get(patientId) ?? [];
    const sessionCandidates = sessionsByPatient.get(patientId) ?? [];
    const nearestConsultation = chooseNearestCandidate(encounterMs, consultationCandidates);
    const nearestSession = chooseNearestCandidate(encounterMs, sessionCandidates);
    const patientEncounterTimeline = [...(encountersByPatient.get(patientId) ?? [])]
      .sort((left, right) => left.encounterMs - right.encounterMs);
    const ordinalIndex = patientEncounterTimeline.findIndex((row) => row.docId === encounter.docId);
    const ordinalVisitType = ordinalIndex >= 0 ? inferVisitTypeFromOrdinal(ordinalIndex) : null;

    let derivedVisitType = null;
    let derivedSessionId = null;
    let confidence = 'low';
    let source = 'unresolved';

    if (nearestConsultation) {
      derivedVisitType = nearestConsultation.visitType;
      derivedSessionId = nearestConsultation.sessionId;
      confidence = 'high';
      source = 'consultation';
    } else if (nearestSession) {
      derivedVisitType = nearestSession.visitType;
      derivedSessionId = nearestSession.sessionId;
      confidence = 'medium';
      source = 'session';
    } else if (ordinalVisitType) {
      derivedVisitType = ordinalVisitType;
      derivedSessionId = null;
      confidence = 'low';
      source = 'ordinal';
    }

    return {
      docId: encounter.docId,
      patientId: encounter.patientId,
      authorUid: encounter.authorUid,
      status: encounter.status,
      encounterDate: encounter.encounterDate,
      existingSessionId: encounter.sessionId,
      existingVisitType: encounter.visitType,
      derivedVisitType,
      derivedSessionId,
      confidence,
      source,
      nearestConsultation: nearestConsultation
        ? {
            docId: nearestConsultation.docId,
            visitType: nearestConsultation.visitType,
            sessionId: nearestConsultation.sessionId,
            timestampIso: nearestConsultation.timestampIso,
            distanceMs: nearestConsultation.distanceMs,
          }
        : null,
      nearestSession: nearestSession
        ? {
            docId: nearestSession.docId,
            visitType: nearestSession.visitType,
            sessionId: nearestSession.sessionId,
            timestampIso: nearestSession.timestampIso,
            distanceMs: nearestSession.distanceMs,
          }
        : null,
      ordinalVisitType,
    };
  });

  const summary = {
    projectId,
    totalOrphaned: proposals.length,
    highConfidence: proposals.filter((row) => row.confidence === 'high').length,
    mediumConfidence: proposals.filter((row) => row.confidence === 'medium').length,
    lowConfidence: proposals.filter((row) => row.confidence === 'low').length,
    unresolved: proposals.filter((row) => row.source === 'unresolved').length,
    bySource: {
      consultation: proposals.filter((row) => row.source === 'consultation').length,
      session: proposals.filter((row) => row.source === 'session').length,
      ordinal: proposals.filter((row) => row.source === 'ordinal').length,
      unresolved: proposals.filter((row) => row.source === 'unresolved').length,
    },
    proposals,
  };

  const outDir = resolve(process.cwd(), 'scripts', 'exports');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = resolve(outDir, `orphan_encounters_classified_${projectId}_${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log(JSON.stringify({
    projectId,
    totalOrphaned: summary.totalOrphaned,
    highConfidence: summary.highConfidence,
    mediumConfidence: summary.mediumConfidence,
    lowConfidence: summary.lowConfidence,
    bySource: summary.bySource,
    exportPath: outPath,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
