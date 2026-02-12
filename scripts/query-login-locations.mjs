#!/usr/bin/env node
/**
 * Query Firestore for connection/IP data - consent, audit, patient_consents
 * Run: node scripts/query-login-locations.mjs
 * Requires: serviceAccountKey.json in project root
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const keyPath = join(projectRoot, 'serviceAccountKey.json');

if (!existsSync(keyPath)) {
  console.error('❌ serviceAccountKey.json not found. Place it in project root.');
  process.exit(1);
}

const key = JSON.parse(readFileSync(keyPath, 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(key) });
}
const db = admin.firestore();

async function main() {
  console.log('\n📍 AiDuxCare - Connection / IP locations from Firestore\n');

  const results = [];

  // 1. consent_verifications - fisioIpAddress, auditTrail
  try {
    const cvSnap = await db.collection('consent_verifications').get();
    cvSnap.docs.forEach(d => {
      const d_ = d.data();
      const ip = d_.fisioIpAddress || d_.auditTrail?.[0]?.ipAddress;
      if (ip && ip !== 'client-side') {
        results.push({ source: 'consent_verifications', patientId: d_.patientId, ip, userAgent: d_.auditTrail?.[0]?.userAgent?.slice(0, 50), timestamp: d_.auditTrail?.[0]?.timestamp });
      }
    });
  } catch (e) {
    console.warn('consent_verifications:', e.message);
  }

  // 2. patient_consents - consentGiven.ipAddress
  try {
    const pcSnap = await db.collection('patient_consents').limit(100).get();
    pcSnap.docs.forEach(d => {
      const d_ = d.data();
      const cg = d_.consentGiven || {};
      const ip = cg.ipAddress;
      if (ip && ip !== 'client-side' && ip !== 'manual-authorization') {
        results.push({ source: 'patient_consents', patientId: d_.patientId, ip, userAgent: cg.userAgent?.slice(0, 50), timestamp: d_.consentDate });
      }
    });
  } catch (e) {
    console.warn('patient_consents:', e.message);
  }

  // 3. audit_logs - metadata (if has ip)
  try {
    const alSnap = await db.collection('audit_logs').orderBy('timestamp', 'desc').limit(200).get();
    alSnap.docs.forEach(d => {
      const d_ = d.data();
      const meta = d_.metadata || {};
      const ip = meta.ipAddress || meta.ip;
      if (ip && ip !== 'client-side') {
        results.push({ source: 'audit_logs', type: d_.type, userId: d_.userId, ip, timestamp: d_.timestamp });
      }
    });
  } catch (e) {
    console.warn('audit_logs:', e.message);
  }

  // 4. users - list for context (no IP, but last login)
  try {
    const usersSnap = await db.collection('users').limit(50).get();
    console.log(`\n👤 Usuarios (${usersSnap.size}):`);
    usersSnap.docs.forEach(d => {
      const u = d.data();
      console.log(`   - ${u.email || d.id} | uid: ${d.id}`);
    });
  } catch (e) {
    console.warn('users:', e.message);
  }

  // Print IP results
  const uniqueIps = [...new Set(results.map(r => r.ip))];
  console.log(`\n📍 Conexiones con IP registrada (${results.length} eventos, ${uniqueIps.length} IPs únicas):\n`);
  results.slice(0, 30).forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.source} | IP: ${r.ip} | ${r.userId || r.patientId || '-'} | ${r.userAgent || ''}`);
  });
  if (results.length > 30) console.log(`   ... y ${results.length - 30} más`);
  console.log('');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
