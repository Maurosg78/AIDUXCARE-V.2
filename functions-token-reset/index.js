/**
 * Monthly Token Reset Cloud Function
 * 
 * Scheduled function that runs on the 1st of every month to reset base tokens
 * for all active users. Purchased tokens are preserved (rollover policy).
 * 
 * Sprint 2A - Day 3: Production Polish
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Lazy initialization - only initialize when function is called
let db;
function getDb() {
  if (!db) {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    db = admin.firestore();
  }
  return db;
}

const CANONICAL_PRICING = {
  tokensIncluded: 1200, // Base tokens per month
};

// Smaller batch size for faster processing and less timeout risk
const BATCH_SIZE = 100;

/**
 * Expire old purchased tokens (12 months old)
 */
async function expireOldPurchasedTokens(currentMonth) {
  try {
    const firestoreDb = getDb();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const expiryTimestamp = admin.firestore.Timestamp.fromDate(twelveMonthsAgo);

    console.log(`[MonthlyTokenReset] Expiring purchases older than: ${twelveMonthsAgo.toISOString()}`);

    const usersRef = firestoreDb.collection('users');
    const usersSnapshot = await usersRef.get();
    let expiredCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const purchasesRef = userDoc.ref.collection('token_purchases');
      const oldPurchasesSnapshot = await purchasesRef
        .where('status', '==', 'active')
        .where('expiresAt', '<=', expiryTimestamp)
        .get();

      if (!oldPurchasesSnapshot.empty) {
        const batch = firestoreDb.batch();
        oldPurchasesSnapshot.docs.forEach((purchaseDoc) => {
          batch.update(purchaseDoc.ref, { status: 'expired' });
          expiredCount++;
        });
        await batch.commit();
      }
    }

    console.log(`[MonthlyTokenReset] Expired ${expiredCount} old purchases`);
    return expiredCount;
  } catch (error) {
    console.error('[MonthlyTokenReset] Error expiring old purchases:', error);
    return 0;
  }
}

/**
 * Monthly Token Reset Function
 */
exports.monthlyTokenReset = functions
  .region('northamerica-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '512MB' })
  .pubsub.schedule('0 0 1 * *')
  .timeZone('America/Toronto')
  .onRun(async (context) => {
    const firestoreDb = getDb();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const timestamp = admin.firestore.Timestamp.now();
    
    console.log(`[MonthlyTokenReset] Starting reset for billing cycle: ${currentMonth}`);
    
    try {
      const usersRef = firestoreDb.collection('users');
      const activeUsersSnapshot = await usersRef
        .where('subscription.plan', '==', 'professional')
        .where('subscription.status', '==', 'active')
        .get();

      if (activeUsersSnapshot.empty) {
        console.log('[MonthlyTokenReset] No active users found');
        return { success: true, usersReset: 0 };
      }

      let resetCount = 0;
      let errorCount = 0;
      const users = activeUsersSnapshot.docs;

      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batchUsers = users.slice(i, i + BATCH_SIZE);
        const currentBatch = firestoreDb.batch();
        
        batchUsers.forEach((userDoc) => {
          try {
            currentBatch.update(userDoc.ref, {
              'subscription.tokenAllocation.baseTokensUsed': 0,
              'subscription.tokenAllocation.baseTokensRemaining': CANONICAL_PRICING.tokensIncluded,
              'subscription.tokenAllocation.currentBillingCycle': currentMonth,
              'subscription.tokenAllocation.lastResetDate': timestamp,
            });
            resetCount++;
          } catch (error) {
            console.error(`[MonthlyTokenReset] Error processing user ${userDoc.id}:`, error);
            errorCount++;
          }
        });

        if (batchUsers.length > 0) {
          await currentBatch.commit();
          console.log(`[MonthlyTokenReset] Committed batch: ${batchUsers.length} users`);
        }
      }

      await expireOldPurchasedTokens(currentMonth);

      console.log(`[MonthlyTokenReset] Reset complete. Users reset: ${resetCount}, Errors: ${errorCount}`);
      
      return {
        success: true,
        usersReset: resetCount,
        errors: errorCount,
        billingCycle: currentMonth,
        timestamp: timestamp.toDate().toISOString()
      };
    } catch (error) {
      console.error('[MonthlyTokenReset] Fatal error:', error);
      throw new functions.https.HttpsError('internal', `Monthly reset failed: ${error.message}`);
    }
  });

/**
 * Manual Trigger Function (for testing)
 */
exports.manualTokenReset = functions
  .region('northamerica-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '512MB' })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const isDev = process.env.FUNCTIONS_EMULATOR === 'true' || 
                  process.env.GCLOUD_PROJECT?.includes('dev') ||
                  process.env.GCLOUD_PROJECT?.includes('uat');

    if (!isDev && context.auth.token.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    console.log('[ManualTokenReset] Manual reset triggered by:', context.auth.uid);

    const firestoreDb = getDb();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const timestamp = admin.firestore.Timestamp.now();
    
    try {
      const usersRef = firestoreDb.collection('users');
      const activeUsersSnapshot = await usersRef
        .where('subscription.plan', '==', 'professional')
        .where('subscription.status', '==', 'active')
        .get();

      if (activeUsersSnapshot.empty) {
        return { success: true, usersReset: 0, message: 'No active users found' };
      }

      let resetCount = 0;
      const users = activeUsersSnapshot.docs;

      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batchUsers = users.slice(i, i + BATCH_SIZE);
        const currentBatch = firestoreDb.batch();

        batchUsers.forEach((userDoc) => {
          currentBatch.update(userDoc.ref, {
            'subscription.tokenAllocation.baseTokensUsed': 0,
            'subscription.tokenAllocation.baseTokensRemaining': CANONICAL_PRICING.tokensIncluded,
            'subscription.tokenAllocation.currentBillingCycle': currentMonth,
            'subscription.tokenAllocation.lastResetDate': timestamp,
          });
          resetCount++;
        });

        await currentBatch.commit();
      }

      await expireOldPurchasedTokens(currentMonth);

      return {
        success: true,
        usersReset: resetCount,
        billingCycle: currentMonth,
        timestamp: timestamp.toDate().toISOString()
      };
    } catch (error) {
      console.error('[ManualTokenReset] Error:', error);
      throw new functions.https.HttpsError('internal', `Manual reset failed: ${error.message}`);
    }
  });

