/**
 * WO-FS-DATA-01: Firestore Data Backfill (Ownership)
 * 
 * Admin script to backfill ownership fields in Firestore collections:
 * - episodes → ownerUid
 * - encounters → authorUid
 * - consent_verifications → ownerUid
 * - audit_logs → userId (only if missing)
 * 
 * Usage:
 *   Dry-run: tsx scripts/firestore-backfill-ownership.ts --dry-run
 *   Execute: tsx scripts/firestore-backfill-ownership.ts
 * 
 * Requirements:
 *   - Firebase Admin SDK
 *   - Service account credentials (GOOGLE_APPLICATION_CREDENTIALS env var or default)
 *   - Node.js >= 20.19
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin
function initializeAdmin() {
  if (getApps().length === 0) {
    // Try to use service account from environment
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (serviceAccountPath) {
      const serviceAccount = require(resolve(process.cwd(), serviceAccountPath));
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      // Try default Firebase Admin initialization (uses Application Default Credentials)
      try {
        initializeApp();
      } catch (error) {
        console.error('❌ Error: Firebase Admin initialization failed.');
        console.error('   Set GOOGLE_APPLICATION_CREDENTIALS env var or use Application Default Credentials.');
        process.exit(1);
      }
    }
  }
  return getFirestore();
}

// Statistics tracking
interface Stats {
  episodes: { updated: number; skipped: number };
  encounters: { updated: number; skipped: number };
  consent_verifications: { updated: number; skipped: number };
  audit_logs: { updated: number; skipped: number };
}

const stats: Stats = {
  episodes: { updated: 0, skipped: 0 },
  encounters: { updated: 0, skipped: 0 },
  consent_verifications: { updated: 0, skipped: 0 },
  audit_logs: { updated: 0, skipped: 0 },
};

const skippedDocs: Array<{ collection: string; docId: string; reason: string }> = [];

// Check if dry-run mode
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 DRY-RUN MODE: No changes will be written to Firestore\n');
}

/**
 * Infer ownerUid from document data or related collections
 */
async function inferOwnerUid(
  db: FirebaseFirestore.Firestore,
  data: FirebaseFirestore.DocumentData,
  collectionName: string
): Promise<string | null> {
  // Strategy 1: Check for existing ownership fields
  if (data.ownerUid) return data.ownerUid;
  if (data.authorUid) return data.authorUid;
  if (data.createdByUid) return data.createdByUid;
  if (data.userId) return data.userId;
  if (data.physiotherapistId) return data.physiotherapistId;

  // Strategy 2: Infer from patient relationship
  if (data.patientId) {
    try {
      const patientDoc = await db.collection('patients').doc(data.patientId).get();
      if (patientDoc.exists) {
        const patientData = patientDoc.data();
        if (patientData?.ownerUid) {
          return patientData.ownerUid;
        }
      }
    } catch (error) {
      console.warn(`   ⚠️  Could not fetch patient ${data.patientId}: ${error}`);
    }
  }

  return null;
}

/**
 * Backfill episodes collection
 */
async function backfillEpisodes(db: FirebaseFirestore.Firestore): Promise<void> {
  console.log('📋 Processing episodes collection...');
  
  const episodesRef = db.collection('episodes');
  const snapshot = await episodesRef.get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Skip if already has ownerUid
    if (data.ownerUid) {
      continue;
    }

    const inferredUid = await inferOwnerUid(db, data, 'episodes');
    
    if (inferredUid) {
      if (isDryRun) {
        console.log(`   [DRY-RUN] Would update ${doc.id}: ownerUid = ${inferredUid}`);
      } else {
        await doc.ref.update({ ownerUid: inferredUid });
        console.log(`   ✅ Updated ${doc.id}: ownerUid = ${inferredUid}`);
      }
      stats.episodes.updated++;
    } else {
      const reason = 'ownerUid not inferable';
      skippedDocs.push({ collection: 'episodes', docId: doc.id, reason });
      console.log(`   ⚠️  Skipped ${doc.id}: ${reason}`);
      stats.episodes.skipped++;
    }
  }
  
  console.log(`   ✔ episodes: ${stats.episodes.updated} updated, ${stats.episodes.skipped} skipped\n`);
}

/**
 * Backfill encounters collection
 */
async function backfillEncounters(db: FirebaseFirestore.Firestore): Promise<void> {
  console.log('📋 Processing encounters collection...');
  
  const encountersRef = db.collection('encounters');
  const snapshot = await encountersRef.get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Skip if already has authorUid
    if (data.authorUid) {
      continue;
    }

    const inferredUid = await inferOwnerUid(db, data, 'encounters');
    
    if (inferredUid) {
      if (isDryRun) {
        console.log(`   [DRY-RUN] Would update ${doc.id}: authorUid = ${inferredUid}`);
      } else {
        await doc.ref.update({ authorUid: inferredUid });
        console.log(`   ✅ Updated ${doc.id}: authorUid = ${inferredUid}`);
      }
      stats.encounters.updated++;
    } else {
      const reason = 'authorUid not inferable';
      skippedDocs.push({ collection: 'encounters', docId: doc.id, reason });
      console.log(`   ⚠️  Skipped ${doc.id}: ${reason}`);
      stats.encounters.skipped++;
    }
  }
  
  console.log(`   ✔ encounters: ${stats.encounters.updated} updated, ${stats.encounters.skipped} skipped\n`);
}

/**
 * Backfill consent_verifications collection
 */
async function backfillConsentVerifications(db: FirebaseFirestore.Firestore): Promise<void> {
  console.log('📋 Processing consent_verifications collection...');
  
  const consentRef = db.collection('consent_verifications');
  const snapshot = await consentRef.get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Skip if already has ownerUid
    if (data.ownerUid) {
      continue;
    }

    const inferredUid = await inferOwnerUid(db, data, 'consent_verifications');
    
    if (inferredUid) {
      if (isDryRun) {
        console.log(`   [DRY-RUN] Would update ${doc.id}: ownerUid = ${inferredUid}`);
      } else {
        await doc.ref.update({ ownerUid: inferredUid });
        console.log(`   ✅ Updated ${doc.id}: ownerUid = ${inferredUid}`);
      }
      stats.consent_verifications.updated++;
    } else {
      const reason = 'ownerUid not inferable';
      skippedDocs.push({ collection: 'consent_verifications', docId: doc.id, reason });
      console.log(`   ⚠️  Skipped ${doc.id}: ${reason}`);
      stats.consent_verifications.skipped++;
    }
  }
  
  console.log(`   ✔ consent_verifications: ${stats.consent_verifications.updated} updated, ${stats.consent_verifications.skipped} skipped\n`);
}

/**
 * Backfill audit_logs collection
 */
async function backfillAuditLogs(db: FirebaseFirestore.Firestore): Promise<void> {
  console.log('📋 Processing audit_logs collection...');
  
  const auditRef = db.collection('audit_logs');
  const snapshot = await auditRef.get();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Skip if already has userId
    if (data.userId) {
      continue;
    }

    const inferredUid = await inferOwnerUid(db, data, 'audit_logs');
    
    if (inferredUid) {
      if (isDryRun) {
        console.log(`   [DRY-RUN] Would update ${doc.id}: userId = ${inferredUid}`);
      } else {
        await doc.ref.update({ userId: inferredUid });
        console.log(`   ✅ Updated ${doc.id}: userId = ${inferredUid}`);
      }
      stats.audit_logs.updated++;
    } else {
      const reason = 'userId not inferable';
      skippedDocs.push({ collection: 'audit_logs', docId: doc.id, reason });
      console.log(`   ⚠️  Skipped ${doc.id}: ${reason}`);
      stats.audit_logs.skipped++;
    }
  }
  
  console.log(`   ✔ audit_logs: ${stats.audit_logs.updated} updated, ${stats.audit_logs.skipped} skipped\n`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Firestore Ownership Backfill Script\n');
  console.log('=' .repeat(60) + '\n');

  try {
    const db = initializeAdmin();
    console.log('✅ Firebase Admin initialized\n');

    // Process each collection
    await backfillEpisodes(db);
    await backfillEncounters(db);
    await backfillConsentVerifications(db);
    await backfillAuditLogs(db);

    // Print summary
    console.log('=' .repeat(60));
    console.log('📊 SUMMARY\n');
    console.log(`✔ episodes updated: ${stats.episodes.updated}`);
    console.log(`✔ encounters updated: ${stats.encounters.updated}`);
    console.log(`✔ consent_verifications updated: ${stats.consent_verifications.updated}`);
    console.log(`✔ audit_logs updated: ${stats.audit_logs.updated}`);
    
    const totalSkipped = 
      stats.episodes.skipped +
      stats.encounters.skipped +
      stats.consent_verifications.skipped +
      stats.audit_logs.skipped;
    
    if (totalSkipped > 0) {
      console.log(`\n⚠️  skipped (not inferable): ${totalSkipped}`);
      if (skippedDocs.length > 0) {
        console.log('\nSkipped documents:');
        skippedDocs.forEach(({ collection, docId, reason }) => {
          console.log(`   - ${collection}/${docId}: ${reason}`);
        });
      }
    }

    console.log('\n' + '=' .repeat(60));
    
    if (isDryRun) {
      console.log('\n🔍 DRY-RUN completed. No changes were made.');
      console.log('   Run without --dry-run to apply changes.\n');
    } else {
      console.log('\n✅ Backfill completed successfully.\n');
    }

  } catch (error) {
    console.error('\n❌ Error during backfill:', error);
    process.exit(1);
  }
}

// Execute
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
