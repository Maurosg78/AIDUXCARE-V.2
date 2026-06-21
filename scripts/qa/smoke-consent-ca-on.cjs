#!/usr/bin/env node
/**
 * Smoke test: CA-ON consent fix verification
 * Read-only diagnostic — no writes, no deploy.
 *
 * Checks:
 * 1. Recent tokens in patient_consent_tokens with jurisdiction: 'CA-ON'
 * 2. For each used token: verifies patient_consent record has correct fields
 * 3. Verifies patients/{patientId}/consent_status/latest has correct fields
 *
 * Usage:
 *   node scripts/qa/smoke-consent-ca-on.cjs
 *   node scripts/qa/smoke-consent-ca-on.cjs --project aiduxcare-v2-uat-dev
 */

const { resolve, isAbsolute } = require('path');
const fs = require('fs');

const envPath = resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

const DEFAULT_PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  'aiduxcare-v2-uat-dev';

function parseProjectId() {
  const idx = process.argv.indexOf('--project');
  return idx >= 0 ? process.argv[idx + 1] : DEFAULT_PROJECT_ID;
}

function initAdmin(projectId) {
  if (getApps().length > 0) return getFirestore();

  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const full = saPath
    ? isAbsolute(saPath) ? saPath : resolve(process.cwd(), saPath)
    : null;

  if (full && fs.existsSync(full)) {
    const sa = JSON.parse(fs.readFileSync(full, 'utf8'));
    initializeApp({ credential: cert(sa), projectId: projectId || sa.project_id });
  } else {
    if (saPath) {
      console.warn('⚠️ GOOGLE_APPLICATION_CREDENTIALS apunta a archivo inexistente. Usando ADC.');
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    }
    initializeApp({ projectId });
  }
  return getFirestore();
}

function toIso(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

const REQUIRED_FIELDS = ['jurisdiction', 'language', 'consentTextVersion', 'consentVersion'];

function checkFields(label, data) {
  const result = {};
  for (const f of REQUIRED_FIELDS) {
    result[f] = data[f] !== undefined && data[f] !== null ? data[f] : '⚠️ MISSING';
  }
  return result;
}

async function main() {
  const projectId = parseProjectId();
  console.log(`\n🔍 Smoke test — CA-ON consent fix — project: ${projectId}\n`);

  const db = initAdmin(projectId);

  // 1. Get recent tokens (last 50, filter in-memory)
  const tokenSnap = await db.collection('patient_consent_tokens')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  const allTokens = tokenSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const caOnTokens = allTokens.filter(t => t.jurisdiction === 'CA-ON');
  const recentOtherTokens = allTokens.filter(t => t.jurisdiction !== 'CA-ON').slice(0, 3);

  console.log(`📋 Total tokens (last 50): ${allTokens.length}`);
  console.log(`🇨🇦 Tokens with jurisdiction='CA-ON': ${caOnTokens.length}`);
  console.log(`📌 Sample jurisdictions from other tokens: ${[...new Set(recentOtherTokens.map(t => t.jurisdiction || 'null'))].join(', ') || 'none'}\n`);

  if (caOnTokens.length === 0) {
    console.log('⚠️  No CA-ON tokens found in the last 50 tokens.\n');
    console.log('📌 HOW TO CREATE A TEST TOKEN:');
    console.log('   1. Log in to pilot.aiduxcare.com');
    console.log('   2. Open ProfessionalWorkflowPage with a CA patient');
    console.log('   3. Trigger "Send consent SMS" — this calls PatientConsentService.generateConsentToken()');
    console.log('      with options.jurisdiction = "CA-ON" (verify in ProfessionalWorkflowPage.tsx ~L1198)');
    console.log('   4. Re-run this script after the token is generated.');

    // Show what tokens exist so we can understand the state
    console.log('\n📋 Most recent 10 tokens (any jurisdiction):');
    allTokens.slice(0, 10).forEach(t => {
      console.log(`  - id: ${t.id.slice(0, 8)}...  jurisdiction: ${t.jurisdiction || 'null'}  used: ${t.used}  createdAt: ${toIso(t.createdAt)}`);
    });
    return;
  }

  // 2. Check used CA-ON tokens
  const usedTokens = caOnTokens.filter(t => t.used === true);
  const unusedTokens = caOnTokens.filter(t => !t.used);
  console.log(`  Used: ${usedTokens.length}  |  Unused/pending: ${unusedTokens.length}\n`);

  // 3. For each used token, check patient_consent and consent_status/latest
  for (const token of usedTokens.slice(0, 5)) {
    console.log(`\n--- TOKEN: ${token.id.slice(0, 8)}...  patient: ${token.patientId || '?'} ---`);
    console.log(`  Token fields:`);
    const tokenFields = checkFields('token', token);
    for (const [k, v] of Object.entries(tokenFields)) {
      console.log(`    ${k}: ${v}`);
    }
    console.log(`  usedAt: ${toIso(token.usedAt)}`);

    if (!token.patientId) {
      console.log('  ⚠️ No patientId on token — cannot check downstream records.');
      continue;
    }

    // Check patient_consent (find record by patientId, recent)
    const consentSnap = await db.collection('patient_consent')
      .where('patientId', '==', token.patientId)
      .orderBy('grantedAt', 'desc')
      .limit(3)
      .get();

    if (consentSnap.empty) {
      console.log('  ❌ patient_consent: NO records found for this patientId');
    } else {
      console.log(`  patient_consent (${consentSnap.size} record(s)):`);
      consentSnap.docs.forEach(d => {
        const data = d.data();
        console.log(`    doc: ${d.id}`);
        const fields = checkFields('consent', data);
        for (const [k, v] of Object.entries(fields)) {
          console.log(`      ${k}: ${v}`);
        }
        console.log(`      status: ${data.status || data.consentStatus || '?'}  source: ${data.source || '?'}  grantedAt: ${toIso(data.grantedAt)}`);
      });
    }

    // Check consent_status/latest
    const latestRef = db.doc(`patients/${token.patientId}/consent_status/latest`);
    const latestSnap = await latestRef.get();
    if (!latestSnap.exists) {
      console.log(`  ❌ patients/${token.patientId}/consent_status/latest: NOT FOUND`);
    } else {
      const data = latestSnap.data();
      console.log(`  patients/${token.patientId}/consent_status/latest:`);
      const fields = checkFields('latest', data);
      for (const [k, v] of Object.entries(fields)) {
        console.log(`    ${k}: ${v}`);
      }
      console.log(`    granted: ${data.granted}  channel: ${data.channel}  source: ${data.source}`);
    }
  }

  // 4. Summary for unused tokens
  if (unusedTokens.length > 0) {
    console.log(`\n--- UNUSED CA-ON TOKENS (no downstream records expected) ---`);
    unusedTokens.slice(0, 3).forEach(t => {
      console.log(`  - ${t.id.slice(0, 8)}...  createdAt: ${toIso(t.createdAt)}  expiresAt: ${toIso(t.expiresAt)}`);
      const fields = checkFields('unused_token', t);
      for (const [k, v] of Object.entries(fields)) {
        console.log(`    ${k}: ${v}`);
      }
    });
  }

  console.log('\n✅ Smoke test complete.\n');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
