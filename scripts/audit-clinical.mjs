/**
 * Auditoría mínima de datos (Emulador Firestore)
 * Lee colecciones: clinical_notes, audit_logs, consents
 * Genera: docs/data/SPRINT_DATA_AUDIT_W41.md
 *
 * Uso:
 *   PROJECT_ID=demo-audit FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/audit-clinical.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ID = process.env.PROJECT_ID || 'demo-audit';
const HOST = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').replace(/^http(s)?:\/\//,'');
const BASE = `http://${HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const AUTH = { 'Authorization': 'Bearer owner' };

async function listDocs(col) {
  const url = `${BASE}/${encodeURIComponent(col)}`;
  const res = await fetch(url, { headers: AUTH });
  if (!res.ok) return [];
  const json = await res.json();
  const docs = json.documents ?? [];
  return docs.map(d => {
    const f = d.fields || {};
    const val = k => f[k]?.stringValue ?? f[k]?.integerValue ?? f[k]?.booleanValue ?? f[k]?.doubleValue ?? null;
    return {
      id: d.name.split('/').pop(),
      patientId: val('patientId'),
      clinicianId: val('clinicianId') ?? val('clinicianUid'),
      status: val('status'),
      createdAtEpoch: Number(val('createdAt')),
      signedAtEpoch: Number(val('signedAt')),
      hash: val('hash') ?? val('signedHash'),
      consentType: val('consentType'),
      granted: f['granted']?.booleanValue ?? null,
      active: f['active']?.booleanValue ?? null,
      action: val('action'),
      entityType: val('entityType'),
      entityId: val('entityId'),
    };
  });
}

function fmtEpoch(ts) {
  if (!ts || Number.isNaN(Number(ts))) return '—';
  const d = new Date(Number(ts) * 1000);
  return d.toISOString();
}

(async () => {
  try {
    const notes = await listDocs('clinical_notes');
    const logs  = await listDocs('audit_logs');
    const cons  = await listDocs('consents');

    // Métricas rápidas
    const totalNotes = notes.length;
    const drafts     = notes.filter(n => n.status === 'draft').length;
    const submitted  = notes.filter(n => n.status === 'submitted').length;
    const signed     = notes.filter(n => n.status === 'signed').length;

    const byPatient = Object.groupBy ? Object.groupBy(notes, n => n.patientId || '—') :
      notes.reduce((acc, n) => ((acc[n.patientId||'—'] ||= []).push(n), acc), {});
    const patients = Object.keys(byPatient);

    // Reglas de auditoría simples
    const issues = [];
    for (const n of notes) {
      if (n.status === 'signed' && !n.hash) {
        issues.push({ type: 'SIGNED_WITHOUT_HASH', id: n.id, patientId: n.patientId });
      }
      if (!n.patientId) {
        issues.push({ type: 'MISSING_PATIENT_ID', id: n.id });
      }
      if (n.status === 'signed' && !n.signedAtEpoch) {
        issues.push({ type: 'SIGNED_WITHOUT_TIMESTAMP', id: n.id });
      }
    }

    // Markdown
    const lines = [];
    lines.push('# SPRINT DATA AUDIT W41');
    lines.push('');
    lines.push('## Summary');
    lines.push(`- Notes: **${totalNotes}**  (draft: ${drafts} / submitted: ${submitted} / signed: ${signed})`);
    lines.push(`- Patients with notes: **${patients.length}**`);
    lines.push(`- Consents: **${cons.length}**, Audit Logs: **${logs.length}**`);
    lines.push('');
    lines.push('## Issues');
    if (issues.length === 0) {
      lines.push('- ✅ No issues found');
    } else {
      for (const i of issues) lines.push(`- ❌ ${i.type} — note: ${i.id} (patient: ${i.patientId ?? '—'})`);
    }
    lines.push('');
    lines.push('## Notes (detail)');
    lines.push('| id | patientId | status | createdAt | signedAt | hash |');
    lines.push('|---|---|---|---|---|---|');
    for (const n of notes) {
      lines.push(`| ${n.id} | ${n.patientId ?? '—'} | ${n.status ?? '—'} | ${fmtEpoch(n.createdAtEpoch)} | ${fmtEpoch(n.signedAtEpoch)} | ${n.hash ?? '—'} |`);
    }
    lines.push('');
    lines.push('## Consents (sample)');
    lines.push('| id | patientId | type | active | granted |');
    lines.push('|---|---|---|---|---|');
    for (const c of cons.slice(0, 10)) {
      lines.push(`| ${c.id} | ${c.patientId ?? '—'} | ${c.consentType ?? '—'} | ${String(c.active)} | ${String(c.granted)} |`);
    }
    lines.push('');
    lines.push('## Audit Logs (sample)');
    lines.push('| id | userId | action | entityType | entityId | timestamp |');
    lines.push('|---|---|---|---|---|---|');
    for (const l of logs.slice(0, 10)) {
      lines.push(`| ${l.id} | ${l.clinicianId ?? '—'} | ${l.action ?? '—'} | ${l.entityType ?? '—'} | ${l.entityId ?? '—'} | ${fmtEpoch(l.createdAtEpoch)} |`);
    }

    const out = path.resolve('docs/data/SPRINT_DATA_AUDIT_W41.md');
    fs.writeFileSync(out, lines.join('\n') + '\n', 'utf8');
    console.log('✅ Reporte generado:', out);
  } catch (e) {
    console.error('❌ Audit failed:', e?.message || e);
    process.exit(1);
  }
})();
