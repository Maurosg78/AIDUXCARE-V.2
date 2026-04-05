/**
 * Backfill legacy treatment_plans documents:
 * Adds inClinicText and homeProgramText by parsing existing planText.
 *
 * Usage:
 *   Dry-run: tsx scripts/backfill-treatment-plan-fields.ts --dry-run
 *   Execute: tsx scripts/backfill-treatment-plan-fields.ts
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

function initializeAdmin() {
  if (getApps().length === 0) {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (serviceAccountPath) {
      const serviceAccount = require(resolve(process.cwd(), serviceAccountPath));
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      initializeApp();
    }
  }
}

function parsePlanText(planText: string): { inClinicText: string; homeProgramText: string } | null {
  const inClinicMatch = planText.match(/IN-CLINIC TREATMENT:\n([\s\S]*?)(?=HOME EXERCISE PROGRAM|HEP:|$)/i);
  const hepMatch = planText.match(/HOME EXERCISE PROGRAM[^:\n]*:\n([\s\S]*?)$/i);

  if (!inClinicMatch && !hepMatch) return null;

  const inClinicText = inClinicMatch
    ? inClinicMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-')).join('\n')
    : '';
  const homeProgramText = hepMatch
    ? hepMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-') || l.trim().length > 0).join('\n')
    : '';

  return { inClinicText, homeProgramText };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'EXECUTE'}`);

  initializeAdmin();
  const db = getFirestore();

  const snapshot = await db.collection('treatment_plans').get();
  console.log(`Found ${snapshot.size} treatment_plan documents`);

  let patched = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Skip if already has separated fields
    if (data.inClinicText || data.homeProgramText) {
      console.log(`[SKIP] ${doc.id} — already has separated fields`);
      skipped++;
      continue;
    }

    if (!data.planText) {
      console.log(`[SKIP] ${doc.id} — no planText`);
      skipped++;
      continue;
    }

    const parsed = parsePlanText(data.planText);
    if (!parsed) {
      console.log(`[WARN] ${doc.id} — could not parse planText`);
      failed++;
      continue;
    }

    console.log(`[PATCH] ${doc.id}`);
    console.log(`  inClinicText: ${parsed.inClinicText.slice(0, 60)}...`);
    console.log(`  homeProgramText: ${parsed.homeProgramText.slice(0, 60)}...`);

    if (!dryRun) {
      await doc.ref.update({
        inClinicText: parsed.inClinicText,
        homeProgramText: parsed.homeProgramText,
      });
    }
    patched++;
  }

  console.log(`\nDone — patched: ${patched}, skipped: ${skipped}, failed: ${failed}`);
}

main().catch(console.error);
