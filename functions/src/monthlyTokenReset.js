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

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const CANONICAL_PRICING = {
  tokensIncluded: 1200, // Base tokens per month
};

// Smaller batch size for faster processing and less timeout risk
const BATCH_SIZE = 100; // Reduced from 500 to avoid timeout

/**
 * Expire old purchased tokens (12 months old)
 * 
 * Finds all token purchases older than 12 months and marks them as expired
 */
async function expireOldPurchasedTokens(currentMonth) {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const expiryTimestamp = admin.firestore.Timestamp.fromDate(twelveMonthsAgo);

    console.log(`[MonthlyTokenReset] Expiring purchases older than: ${twelveMonthsAgo.toISOString()}`);

    // Get all users
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();

    let expiredCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const purchasesRef = userDoc.ref.collection('token_purchases');
      const oldPurchasesSnapshot = await purchasesRef
        .where('status', '==', 'active')
        .where('expiresAt', '<=', expiryTimestamp)
        .get();

      if (!oldPurchasesSnapshot.empty) {
        const batch = db.batch();
        
        oldPurchasesSnapshot.docs.forEach((purchaseDoc) => {
          batch.update(purchaseDoc.ref, {
            status: 'expired'
          });
          expiredCount++;
        });

        await batch.commit();
      }
    }

    console.log(`[MonthlyTokenReset] Expired ${expiredCount} old purchases`);
    return expiredCount;
  } catch (error) {
    console.error('[MonthlyTokenReset] Error expiring old purchases:', error);
    // Don't throw - expiration is not critical for reset
    return 0;
  }
}

/**
 * Monthly Token Reset Function
 * 
 * Runs on the 1st of every month at midnight Toronto time
 * Resets base tokens to 1,200 for all active professional users
 * Preserves purchased tokens (12-month rollover)
 */
exports.monthlyTokenReset = functions
  .region('northamerica-northeast1') // PHIPA compliance: Canadian region
  .runWith({
    timeoutSeconds: 540, // 9 minutes (max for scheduled functions)
    memory: '512MB' // Sufficient for batch processing
  })
  .pubsub
  .schedule('0 0 1 * *') // 1st of every month at midnight
  .timeZone('America/Toronto')
  .onRun(async (context) => {
    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const timestamp = admin.firestore.Timestamp.now();
    
    console.log(`[MonthlyTokenReset] Starting reset for billing cycle: ${currentMonth}`);
    
    try {
      // Get all users with active professional subscriptions
      const usersRef = db.collection('users');
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

      // Process users in batches (smaller batches for faster processing)
      const users = activeUsersSnapshot.docs;

      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batchUsers = users.slice(i, i + BATCH_SIZE);
        const currentBatch = db.batch();
        
        batchUsers.forEach((userDoc) => {
          try {
            const userRef = userDoc.ref;
            
            // Reset base tokens to 1,200
            // Preserve purchased tokens balance
            currentBatch.update(userRef, {
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

        // Commit batch
        if (batchUsers.length > 0) {
          await currentBatch.commit();
          console.log(`[MonthlyTokenReset] Committed batch: ${batchUsers.length} users`);
        }
      }

      // Expire old purchased tokens (12 months old)
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
 * 
 * Allows manual triggering of monthly reset for testing purposes
 * Only available in staging/dev environments
 */
exports.manualTokenReset = functions
  .region('northamerica-northeast1')
  .runWith({
    timeoutSeconds: 540, // 9 minutes
    memory: '512MB'
  })
  .https
  .onCall(async (data, context) => {
    // Security: Only allow authenticated admins or in dev environment
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // In production, check if user is admin
    // For now, allow in staging/dev
    const isDev = process.env.FUNCTIONS_EMULATOR === 'true' || 
                  process.env.GCLOUD_PROJECT?.includes('dev') ||
                  process.env.GCLOUD_PROJECT?.includes('uat');

    if (!isDev && context.auth.token.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    console.log('[ManualTokenReset] Manual reset triggered by:', context.auth.uid);

    // Execute reset logic directly (reuse the scheduled function logic)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const timestamp = admin.firestore.Timestamp.now();
    
    try {
      const usersRef = db.collection('users');
      const activeUsersSnapshot = await usersRef
        .where('subscription.plan', '==', 'professional')
        .where('subscription.status', '==', 'active')
        .get();

      if (activeUsersSnapshot.empty) {
        return { success: true, usersReset: 0, message: 'No active users found' };
      }

      let resetCount = 0;

      // Process in batches
      const users = activeUsersSnapshot.docs;
      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batchUsers = users.slice(i, i + BATCH_SIZE);
        const currentBatch = db.batch();

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
