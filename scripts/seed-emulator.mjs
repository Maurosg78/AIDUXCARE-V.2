/**
 * Seed Firestore Emulator desde test-data/seed-clinical.json
 * Uso:
 *   PROJECT_ID=demo-audit FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/seed-emulator.mjs
 *
 * Requiere: Emulador Firestore corriendo en FIRESTORE_EMULATOR_HOST
 *           Header Authorization: Bearer owner (modo emulador)
 */
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ID = process.env.PROJECT_ID || 'demo-audit';
const HOST = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').replace(/^http(s)?:\/\//,'');
const BASE = `http://${HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const AUTH = { 'Authorization': 'Bearer owner', 'Content-Type': 'application/json' };

const dataPath = path.resolve('test-data/seed-clinical.json');
if (!fs.existsSync(dataPath)) {
  console.error(`No existe ${dataPath}`);
  process.exit(1);
}
const seed = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

/** Convierte JS plano -> Firestore Value (simplificado para strings, bool, number, null, maps) */
const toValue = (v) => {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === 'object' && typeof v._seconds === 'number') {
    // timestamp simplificado: guarda epoch seconds como integer
    return { integerValue: String(v._seconds) };
  }
  // map
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k,val]) => [k, toValue(val)])) } };
};

async function putDoc(collection, id, doc) {
  const url = `${BASE}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
  const body = { fields: Object.fromEntries(Object.entries(doc).map(([k,v]) => [k, toValue(v)])) };
  const res = await fetch(url, { method: 'PATCH', headers: AUTH, body: JSON.stringify(body) });
  if (!res.ok) {
    const txt = await res.text().catch(()=> '');
    throw new Error(`Error ${res.status} ${res.statusText} en ${collection}/${id}: ${txt}`);
  }
  return res.json();
}

(async () => {
  try {
    for (const note of (seed.clinical_notes || [])) {
      await putDoc('clinical_notes', note.id, note);
      console.log(`✓ clinical_notes/${note.id}`);
    }
    for (const log of (seed.audit_logs || [])) {
      await putDoc('audit_logs', log.id, log);
      console.log(`✓ audit_logs/${log.id}`);
    }
    for (const consent of (seed.consents || [])) {
      await putDoc('consents', consent.id, consent);
      console.log(`✓ consents/${consent.id}`);
    }
    console.log('✅ Seed completado');
  } catch (e) {
    console.error('❌ Seed falló:', e.message);
    process.exit(1);
  }
})();
