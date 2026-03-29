#!/usr/bin/env node
/**
 * Inspecciona estado Firestore para un paciente (búsqueda por nombre) y resume
 * sessions / consultations / encounters (sin volcar SOAP, cifrado ni transcripciones).
 *
 * Usage: node scripts/qa/inspect-patient-session-state.mjs "Maritza Lyon"
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.resolve(process.cwd(), '.env.local');
const envPathExists = fs.existsSync(envPath);
if (envPathExists) {
  require('dotenv').config({ path: envPath });
}

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

const PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  'aiduxcare-v2-uat-dev';

function initDb() {
  const apps = getApps();
  const alreadyInit = apps.length > 0;
  if (!alreadyInit) {
    const credPathRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const credResolved = credPathRaw
      ? path.isAbsolute(credPathRaw)
        ? credPathRaw
        : path.resolve(process.cwd(), credPathRaw)
      : null;
    const credOk = credResolved && fs.existsSync(credResolved);
    if (credOk) {
      const saJson = fs.readFileSync(credResolved, 'utf8');
      const serviceAccount = JSON.parse(saJson);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: PROJECT_ID || serviceAccount.project_id,
      });
    } else {
      initializeApp({ projectId: PROJECT_ID });
    }
  }
  const db = getFirestore();
  return db;
}

function normalizeName(s) {
  const str = String(s);
  const lower = str.toLowerCase();
  const trimmed = lower.trim();
  return trimmed;
}

function patientMatchesSearch(data, needleNorm) {
  const bucket = [];
  if (data.firstName) {
    bucket.push(String(data.firstName));
  }
  if (data.lastName) {
    bucket.push(String(data.lastName));
  }
  if (data.fullName) {
    bucket.push(String(data.fullName));
  }
  const joined = bucket.join(' ');
  const norm = normalizeName(joined);
  return norm.includes(needleNorm);
}

async function findPatientsByName(db, needle) {
  const needleNorm = normalizeName(needle);
  const snap = await db.collection('patients').limit(500).get();
  const list = [];
  snap.forEach((d) => {
    const data = d.data();
    const match = patientMatchesSearch(data, needleNorm);
    if (match) {
      list.push({ id: d.id, firstName: data.firstName, lastName: data.lastName, fullName: data.fullName });
    }
  });
  return list;
}

function tsToIso(v) {
  if (!v) {
    return null;
  }
  if (v instanceof Timestamp) {
    return v.toDate().toISOString();
  }
  if (typeof v === 'string') {
    return v;
  }
  if (v._seconds != null) {
    const ms = v._seconds * 1000;
    return new Date(ms).toISOString();
  }
  return String(v);
}

function summarizeConsultation(doc) {
  const data = doc.data();
  const soap = data.soapData;
  const hasSoap = Boolean(soap && typeof soap === 'object');
  const row = {
    id: doc.id,
    patientId: data.patientId,
    sessionId: data.sessionId,
    authorUid: data.authorUid,
    visitType: data.visitType,
    source: data.source,
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
    hasSoapPayload: hasSoap,
    hasEncryptedBlob: Boolean(data.encryptedData),
  };
  return row;
}

function summarizeEncounter(doc) {
  const data = doc.data();
  const sn = data.soapNote;
  const soapSt = sn && typeof sn === 'object' ? sn.status : null;
  const row = {
    id: doc.id,
    patientId: data.patientId,
    authorUid: data.authorUid,
    status: data.status,
    soapNoteStatus: soapSt || null,
    encounterDate: tsToIso(data.encounterDate),
    createdAt: tsToIso(data.createdAt),
    hasSoapBlocks: Boolean(data.soap && typeof data.soap === 'object'),
  };
  return row;
}

function summarizeSession(doc) {
  const data = doc.data();
  const sn = data.soapNote;
  let soapStatus = null;
  if (sn && typeof sn === 'object' && !Array.isArray(sn)) {
    soapStatus = sn.status || null;
  }
  const row = {
    id: doc.id,
    patientId: data.patientId,
    userId: data.userId,
    sessionType: data.sessionType,
    sessionStatus: data.status,
    soapNoteStatus: soapStatus,
    timestamp: tsToIso(data.timestamp),
    transcriptChars: typeof data.transcript === 'string' ? data.transcript.length : 0,
    attachmentCount: Array.isArray(data.attachments) ? data.attachments.length : 0,
  };
  return row;
}

async function loadConsultations(db, patientId) {
  const q = db.collection('consultations').where('patientId', '==', patientId);
  const snap = await q.get();
  const rows = [];
  snap.forEach((d) => {
    const one = summarizeConsultation(d);
    rows.push(one);
  });
  return rows;
}

async function loadEncounters(db, patientId) {
  const q = db.collection('encounters').where('patientId', '==', patientId);
  const snap = await q.get();
  const rows = [];
  snap.forEach((d) => {
    const one = summarizeEncounter(d);
    rows.push(one);
  });
  return rows;
}

async function loadSessions(db, patientId) {
  const q = db.collection('sessions').where('patientId', '==', patientId);
  const snap = await q.get();
  const rows = [];
  snap.forEach((d) => {
    const one = summarizeSession(d);
    rows.push(one);
  });
  return rows;
}

async function main() {
  const argv = process.argv.slice(2);
  const needle = argv[0];
  if (!needle) {
    console.error('Usage: node scripts/qa/inspect-patient-session-state.mjs "Patient Full Name"');
    process.exit(1);
  }

  const db = initDb();
  const patients = await findPatientsByName(db, needle);

  if (patients.length === 0) {
    const empty = {
      project: PROJECT_ID,
      needle,
      patients: [],
      hint: 'No matches in first 500 patients by name; narrow search or use patientId in Firestore console.',
    };
    console.log(JSON.stringify(empty, null, 2));
    return;
  }

  const report = { project: PROJECT_ID, needle, patients: [] };

  for (const p of patients) {
    const pid = p.id;
    const consultations = await loadConsultations(db, pid);
    const encounters = await loadEncounters(db, pid);
    const sessions = await loadSessions(db, pid);
    const entry = {
      patient: p,
      counts: {
        consultations: consultations.length,
        encounters: encounters.length,
        sessions: sessions.length,
      },
      consultations,
      encounters,
      sessions,
    };
    report.patients.push(entry);
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
