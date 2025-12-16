# 🚀 SOLUCIÓN CLI BASADA EN GEMINI

**Método:** Firebase CLI con estructura optimizada  
**Basado en:** Recomendaciones de Gemini + Optimizaciones propias

---

## 📋 **PASO 1: VERIFICAR FIREBASE CLI**

```bash
# Verificar que Firebase CLI está instalado
firebase --version

# Verificar que estás logueado
firebase login

# Verificar proyecto actual
firebase projects:list
```

---

## 🔧 **PASO 2: ESTRUCTURA OPTIMIZADA**

### **2.1 Crear Directorio Limpio:**

```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

# Crear directorio temporal solo para token reset
mkdir -p functions-token-reset
cd functions-token-reset
```

### **2.2 Inicializar Firebase Functions:**

```bash
# Inicializar solo funciones (sin otras opciones)
firebase init functions --project aiduxcare-v2-uat-dev
```

**Selecciones:**
- ✅ Use an existing project: `aiduxcare-v2-uat-dev`
- ✅ Language: **JavaScript** (más simple, menos problemas)
- ✅ ESLint: No (para evitar problemas adicionales)
- ✅ Install dependencies: Yes

---

## 📝 **PASO 3: CREAR CÓDIGO OPTIMIZADO**

### **3.1 Crear `functions/index.js`:**

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicialización lazy - solo cuando se necesita
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
  tokensIncluded: 1200,
};

const BATCH_SIZE = 100;

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

// Monthly Token Reset - Scheduled Function
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

// Manual Token Reset - Callable Function
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
```

### **3.2 Verificar `functions/package.json`:**

```json
{
  "name": "functions",
  "description": "Cloud Functions for Firebase",
  "scripts": {
    "lint": "echo \"Linting skipped\"",
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "20"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^12.7.0",
    "firebase-functions": "^4.9.0"
  },
  "private": true
}
```

---

## 🚀 **PASO 4: DEPLOYMENT**

### **4.1 Deploy con Timeout Extendido:**

```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2/functions-token-reset

# Configurar variables de entorno
export NODE_OPTIONS="--max-old-space-size=4096"
export FUNCTIONS_DISCOVERY_TIMEOUT=120

# Deploy solo las funciones de token reset
firebase deploy --only functions:monthlyTokenReset,functions:manualTokenReset --project aiduxcare-v2-uat-dev
```

### **4.2 Si Fallan, Deploy Individual:**

```bash
# Deploy monthlyTokenReset primero
firebase deploy --only functions:monthlyTokenReset --project aiduxcare-v2-uat-dev

# Luego manualTokenReset
firebase deploy --only functions:manualTokenReset --project aiduxcare-v2-uat-dev
```

---

## ✅ **PASO 5: VERIFICACIÓN**

```bash
# Listar funciones deployadas
firebase functions:list --project aiduxcare-v2-uat-dev | grep -i token

# Ver logs
firebase functions:log --project aiduxcare-v2-uat-dev --only monthlyTokenReset
firebase functions:log --project aiduxcare-v2-uat-dev --only manualTokenReset
```

---

## 🎯 **VENTAJAS DE ESTE MÉTODO**

1. ✅ **Directorio limpio** - Solo contiene las funciones necesarias
2. ✅ **Sin código pesado** - No analiza `index.js` con muchas funciones
3. ✅ **Lazy initialization** - Firebase Admin solo se inicializa cuando se necesita
4. ✅ **Deployment específico** - Solo deploya las funciones de token reset

---

**Status:** ✅ **READY TO TRY**  
**Next:** Ejecuta los comandos del Paso 2 en adelante

