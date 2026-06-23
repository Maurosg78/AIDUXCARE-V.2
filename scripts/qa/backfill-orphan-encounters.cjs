#!/usr/bin/env node
// ============================================================
// ADVERTENCIA: Script de QA/migración — NO es código de producción
// El flag --apply escribe en Firestore (aiduxcare-v2-uat-dev).
// Revisar output en modo dry-run antes de ejecutar con --apply.
// Uso: node scripts/qa/backfill-orphan-encounters.cjs [--apply]
// ============================================================
/**
 * Backfill orphan encounters using high-confidence consultation matches.
 *
 * Default mode is dry-run.
 *
 * Usage:
 *   node scripts/qa/backfill-orphan-encounters.cjs --input <classified-export.json>
 *   node scripts/qa/backfill-orphan-encounters.cjs --input <classified-export.json> --apply
 */

const { resolve } = require('path');
const fs = require('fs');

const envPath = resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const DEFAULT_PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  'aiduxcare-v2-uat-dev';

function parseArgs() {
  const inputIndex = process.argv.indexOf('--input');
  const inputPath = inputIndex >= 0 ? process.argv[inputIndex + 1] : null;
  const shouldApply = process.argv.includes('--apply');
  const projectIndex = process.argv.indexOf('--project');
  const projectId = projectIndex >= 0 ? process.argv[projectIndex + 1] : DEFAULT_PROJECT_ID;
  return {
    inputPath,
    shouldApply,
    projectId,
  };
}

function initializeAdmin(projectId) {
  if (getApps().length > 0) {
    return getFirestore();
  }

  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const fullPath = serviceAccountPath
    ? resolve(process.cwd(), serviceAccountPath)
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

function loadClassifiedReport(inputPath) {
  if (!inputPath) {
    throw new Error('Missing required --input <classified-export.json>');
  }
  const resolvedPath = resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Input file not found: ${resolvedPath}`);
  }
  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const report = JSON.parse(raw);
  return {
    resolvedPath,
    report,
  };
}

function isEligibleProposal(proposal) {
  const highConfidence = proposal.confidence === 'high';
  const consultationSource = proposal.source === 'consultation';
  const hasVisitType = typeof proposal.derivedVisitType === 'string' && proposal.derivedVisitType.length > 0;
  const hasSessionId = typeof proposal.derivedSessionId === 'string' && proposal.derivedSessionId.length > 0;
  return highConfidence && consultationSource && hasVisitType && hasSessionId;
}

async function main() {
  const { inputPath, shouldApply, projectId } = parseArgs();
  const { resolvedPath, report } = loadClassifiedReport(inputPath);
  const db = initializeAdmin(projectId);
  const proposals = Array.isArray(report.proposals) ? report.proposals : [];
  const eligible = proposals.filter(isEligibleProposal);
  const skipped = proposals.filter((proposal) => !isEligibleProposal(proposal));

  console.log(JSON.stringify({
    mode: shouldApply ? 'apply' : 'dry-run',
    projectId,
    inputPath: resolvedPath,
    totalProposals: proposals.length,
    eligible: eligible.length,
    skipped: skipped.length,
  }, null, 2));

  for (const proposal of eligible) {
    console.log(JSON.stringify({
      docId: proposal.docId,
      patientId: proposal.patientId,
      derivedVisitType: proposal.derivedVisitType,
      derivedSessionId: proposal.derivedSessionId,
      confidence: proposal.confidence,
      source: proposal.source,
    }));
  }

  if (!shouldApply) {
    return;
  }

  let updated = 0;

  for (const proposal of eligible) {
    const ref = db.collection('encounters').doc(proposal.docId);
    await ref.update({
      visitType: proposal.derivedVisitType,
      sessionId: proposal.derivedSessionId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    updated += 1;
  }

  console.log(JSON.stringify({
    mode: 'apply',
    updated,
    skipped: skipped.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
