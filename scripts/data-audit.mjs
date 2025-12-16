import fs from 'node:fs';
import { Firestore } from '@google-cloud/firestore';

// Config: usa GOOGLE_APPLICATION_CREDENTIALS o credenciales por ADC.
// export GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json
const firestore = new Firestore();

// Colecciones objetivo
const TARGETS = [
  { name: 'clinical_notes', key: 'notes' },
  { name: 'audit_logs', key: 'audit_logs' },
  { name: 'consents', key: 'consents' },
];

// Reglas mínimas según Section 5 (en-CA, Canada-first)
const NOTE_REQUIRED = ['patient_id', 'clinic_id', 'author_id', 'status', 'createdAt', 'updatedAt'];
const NOTE_STATUS_ALLOWED = new Set(['draft', 'signed']);

function validateNote(doc) {
  const data = doc.data() || {};
  const missing = NOTE_REQUIRED.filter(k => !(k in data));
  const statusOk = NOTE_STATUS_ALLOWED.has(data.status);
  const tsValid = typeof data.createdAt !== 'undefined' && typeof data.updatedAt !== 'undefined';
  return {
    id: doc.id,
    missing,
    statusOk,
    tsValid,
  };
}

async function countByStatus() {
  const map = { draft: 0, signed: 0, other: 0 };
  const snap = await firestore.collection('clinical_notes').select('status').get();
  for (const d of snap.docs) {
    const s = d.get('status');
    if (s === 'draft' || s === 'signed') map[s]++; else map.other++;
  }
  return map;
}

async function sampleDocs(collName, limit = 10) {
  const snap = await firestore.collection(collName).limit(limit).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function run() {
  const counts = {};
  for (const t of TARGETS) {
    const snap = await firestore.collection(t.name).count().get();
    counts[t.key] = snap.data().count || 0;
  }

  const noteStatus = await countByStatus();

  // Conformidad notes (muestra)
  const sampleNotesSnap = await firestore.collection('clinical_notes').limit(50).get();
  const validations = sampleNotesSnap.docs.map(validateNote);
  const missingAny = validations.filter(v => v.missing.length > 0);
  const badStatus = validations.filter(v => !v.statusOk);
  const badTimestamps = validations.filter(v => !v.tsValid);

  // Muestras
  const samples = {
    notes: await sampleDocs('clinical_notes', 5),
    audit_logs: await sampleDocs('audit_logs', 5),
    consents: await sampleDocs('consents', 5),
  };

  const report = {
    generatedAtISO: new Date().toISOString(),
    collectionsInventory: {
      notes: { total: counts.notes, byStatus: noteStatus },
      audit_logs: { total: counts.audit_logs },
      consents: { total: counts.consents },
    },
    schemaConformity: {
      notesRequiredFields: NOTE_REQUIRED,
      sampleChecked: validations.length,
      issues: {
        missingRequired: missingAny.slice(0, 20),
        invalidStatus: badStatus.slice(0, 20),
        invalidTimestamps: badTimestamps.slice(0, 20),
      },
    },
    samples,
  };

  fs.mkdirSync('docs/data', { recursive: true });
  fs.writeFileSync('docs/data/data-audit.report.json', JSON.stringify(report, null, 2));
  // También generamos Markdown para el output esperado
  const md = [
    `# Data Audit Report - Oct 13, 2025`,
    ``,
    `## Collections Inventory`,
    `- notes: ${counts.notes} records (${noteStatus.draft} draft, ${noteStatus.signed} signed, ${noteStatus.other} other)`,
    `- audit_logs: ${counts.audit_logs} records`,
    `- consents: ${counts.consents} records`,
    ``,
    `## Schema Conformity`,
    `- ${missingAny.length === 0 ? '✅' : '❌'} All notes have required fields`,
    `- ${badTimestamps.length === 0 ? '✅' : '❌'} Timestamps valid`,
    `- ${badStatus.length === 0 ? '✅' : '❌'} Status values correct`,
    ``,
    `## Issues Found`,
    ...(missingAny.slice(0,10).map((v,i)=> `${i+1}. Missing fields on note ${v.id}: ${v.missing.join(', ')}`)),
    ...(badStatus.slice(0,10).map((v,i)=> `${missingAny.slice(0,10).length+i+1}. Invalid status on note ${v.id}`)),
    ...(badTimestamps.slice(0,10).map((v,i)=> `${missingAny.slice(0,10).length+badStatus.slice(0,10).length+i+1}. Invalid timestamps on note ${v.id}`)),
    ``,
    `## Recommendations`,
    `1. Backfill required fields and normalize status to ['draft','signed'].`,
    `2. Validate createdAt/updatedAt consistency; enforce at write-time.`,
  ].join('\n');
  fs.writeFileSync('docs/data/SPRINT_DATA_AUDIT_W41.md', md);

  console.log('✅ Data audit generated: docs/data/data-audit.report.json & docs/data/SPRINT_DATA_AUDIT_W41.md');
}

run().catch(e => { console.error(e); process.exit(1); });
