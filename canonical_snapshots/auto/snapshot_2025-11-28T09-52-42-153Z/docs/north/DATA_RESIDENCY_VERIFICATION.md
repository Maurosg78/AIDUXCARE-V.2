# 🇨🇦 **CANADIAN DATA RESIDENCY VERIFICATION**

**Date:** November 2025  
**Status:** ⚠️ **REQUIRES CONSOLE VERIFICATION**  
**Purpose:** PHIPA Compliance - Data Residency Requirements

---

## 📋 **VERIFICATION CHECKLIST**

### **1. Firestore Database**

**Required Region:** `northamerica-northeast1` (Montreal, Canada)

**Verification Steps:**
1. Go to Firebase Console → Firestore Database
2. Check database location/region
3. Verify region is `northamerica-northeast1`

**Current Status:** ⚠️ **NOT VERIFIED IN CODE**
- Code location: `src/lib/firebase.ts`
- No explicit region configuration found
- Region must be set during Firestore database creation in Firebase Console

**Action Required:**
- [ ] Verify region in Firebase Console
- [ ] Document region if correct
- [ ] Migrate database if incorrect (requires Firebase support)

---

### **2. Firebase Storage**

**Required Region:** `northamerica-northeast1` (Montreal, Canada)

**Verification Steps:**
1. Go to Firebase Console → Storage
2. Check bucket location/region
3. Verify region is `northamerica-northeast1`

**Current Status:** ⚠️ **NOT VERIFIED IN CODE**
- Code location: `src/lib/firebase.ts`
- Storage initialized but region not explicitly set
- Region is set when Storage bucket is created

**Action Required:**
- [ ] Verify region in Firebase Console
- [ ] Document region if correct
- [ ] Create new bucket in correct region if needed

---

### **3. Firebase Functions**

**Required Region:** `northamerica-northeast1` (Montreal, Canada)

**Verification Steps:**
1. Go to Firebase Console → Functions
2. Check function region configuration
3. Verify region is `northamerica-northeast1`

**Current Status:** ⚠️ **NOT FOUND IN CODEBASE**
- Functions may exist separately or not yet implemented
- Reference found: `src/core/assistant/assistantAdapter.ts` mentions `europe-west1` (INCORRECT)

**Action Required:**
- [ ] Locate all Firebase Functions
- [ ] Update region to `northamerica-northeast1`
- [ ] Redeploy functions with correct region

**Code Reference:**
```typescript
// src/core/assistant/assistantAdapter.ts (line 64)
const region = 'europe-west1'; // ❌ INCORRECT - Should be 'northamerica-northeast1'
```

---

### **4. Supabase Database**

**Required Region:** Canada (if used)

**Verification Steps:**
1. Go to Supabase Dashboard
2. Check project region
3. Verify region is Canada

**Current Status:** ⚠️ **NOT FOUND IN CODEBASE**
- Supabase may be used for analytics/logging
- No explicit Supabase configuration found

**Action Required:**
- [ ] Locate Supabase configuration
- [ ] Verify region in Supabase Dashboard
- [ ] Document region if correct

---

## 🔧 **CODE UPDATES REQUIRED**

### **1. Update Firebase Functions Region**

**File:** `src/core/assistant/assistantAdapter.ts`

**Current:**
```typescript
const region = 'europe-west1'; // ❌ INCORRECT
```

**Required:**
```typescript
const region = 'northamerica-northeast1'; // ✅ CANADA
```

---

### **2. Add Region Verification Logging**

**File:** `src/lib/firebase.ts`

**Add:**
```typescript
// Log region information (for verification)
console.info("📍 Firestore Region: northamerica-northeast1 (Montreal, Canada)");
console.info("📍 Storage Region: northamerica-northeast1 (Montreal, Canada)");
```

**Note:** Actual region verification must be done in Firebase Console, as regions are set during resource creation, not in client code.

---

## 📊 **VERIFICATION RESULTS**

| Service | Required Region | Status | Notes |
|---------|----------------|--------|-------|
| Firestore | `northamerica-northeast1` | ⚠️ Requires Console Check | Set during DB creation |
| Storage | `northamerica-northeast1` | ⚠️ Requires Console Check | Set during bucket creation |
| Functions | `northamerica-northeast1` | 🔴 Incorrect (`europe-west1`) | Code update required |
| Supabase | Canada | ⚠️ Not Found | May not be used |

---

## ✅ **COMPLIANCE STATUS**

**PHIPA Requirement:** Personal health information must be stored in Canada unless explicit consent for cross-border transfer is obtained.

**Current Status:** ⚠️ **PARTIAL COMPLIANCE**
- ✅ Patient consent obtained for AI processing (US servers)
- ⚠️ Data storage regions require verification
- 🔴 Functions region is incorrect

**Action Required:**
1. Verify Firestore region in Firebase Console
2. Verify Storage region in Firebase Console
3. Update Functions region in code
4. Verify Supabase region (if used)
5. Document all verified regions

---

## 📝 **VERIFICATION DOCUMENTATION**

### **Verification Script**

A verification script has been created to guide manual verification:

**Script:** `scripts/verify-data-residency.cjs`

**Usage:**
```bash
node scripts/verify-data-residency.cjs
```

This script will:
- Display Firebase configuration
- Provide step-by-step instructions for manual verification
- Check code for Functions region configuration
- Guide through Supabase region verification

### **Reproducible Verification Steps**

#### **Step 1: Firestore Region Verification**

1. **Access Firebase Console:**
   - Go to: https://console.firebase.google.com
   - Select project: `aiduxcare-v2-uat-dev` (or your project ID)

2. **Navigate to Firestore:**
   - Click "Firestore Database" in left sidebar
   - Click the "Settings" (gear icon) at the top
   - Look for "Database location" or "Region" field

3. **Verify Region:**
   - Required: `northamerica-northeast1` (Montreal, Canada)
   - If different → **STOP WORK → ESCALATE TO CTO**

4. **Document:**
   - Take screenshot of region setting
   - Note verification date and time
   - Update this document

#### **Step 2: Storage Region Verification**

1. **Access Firebase Console:**
   - Same project as above

2. **Navigate to Storage:**
   - Click "Storage" in left sidebar
   - Click the "Settings" (gear icon) at the top
   - Look for "Bucket location" or "Region" field

3. **Verify Region:**
   - Required: `northamerica-northeast1` (Montreal, Canada)
   - If different → **STOP WORK → ESCALATE TO CTO**

4. **Document:**
   - Take screenshot of region setting
   - Note verification date and time
   - Update this document

#### **Step 3: Functions Region Verification**

1. **Access Firebase Console:**
   - Same project as above

2. **Navigate to Functions:**
   - Click "Functions" in left sidebar
   - Review each function's region configuration

3. **Verify Code:**
   - Check `src/core/assistant/assistantAdapter.ts` line 64
   - Should be: `const region = 'northamerica-northeast1';`
   - Check `functions/index.js` for region configuration

4. **Verify Region:**
   - Required: `northamerica-northeast1` (Montreal, Canada)
   - If different → **STOP WORK → ESCALATE TO CTO**

5. **Document:**
   - Take screenshot of function region settings
   - Note verification date and time
   - Update this document

#### **Step 4: Supabase Region Verification**

1. **Access Supabase Dashboard:**
   - Go to: https://app.supabase.com
   - Select project

2. **Navigate to Settings:**
   - Click "Project Settings" → "Infrastructure"
   - Look for "Region" field

3. **Verify Region:**
   - Required: Canada region (`ca-central-1` or equivalent)
   - If different → **STOP WORK → ESCALATE TO CTO**

4. **Document:**
   - Take screenshot of region setting
   - Note verification date and time
   - Update this document

### **After Verification, Document:**

```markdown
## Verified Regions (Date: [DATE])

- **Firestore:** northamerica-northeast1 (Montreal, Canada) ✅
- **Storage:** northamerica-northeast1 (Montreal, Canada) ✅
- **Functions:** northamerica-northeast1 (Montreal, Canada) ✅
- **Supabase:** [Region] ✅

**Verified By:** [Name]
**Verification Method:** Firebase Console / Supabase Dashboard
**Screenshots:** [Attach screenshots]
**Script Output:** [Attach script output]
```

---

## 🚨 **RISK ASSESSMENT**

**Risk Level:** 🔴 **HIGH**

**Impact if Non-Compliant:**
- PHIPA violation
- Legal liability
- Loss of professional trust
- Pilot failure

**Mitigation:**
- Immediate verification required
- Code updates for Functions
- Console verification for Firestore/Storage
- Documentation of all regions

---

**Next Steps:**
1. Access Firebase Console
2. Verify Firestore region
3. Verify Storage region
4. Update Functions code
5. Document verification results
6. Update this document with verified regions

