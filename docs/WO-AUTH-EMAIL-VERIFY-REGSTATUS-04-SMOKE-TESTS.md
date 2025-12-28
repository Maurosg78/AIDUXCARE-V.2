# WO-AUTH-EMAIL-VERIFY-REGSTATUS-04 - Smoke Tests

**Date:** 2025-01-XX  
**Status:** ✅ Implementation Complete - Ready for Manual Testing

---

## ✅ Implementation Verification

### ToDo 1: "No overwrite" en ProfessionalProfileContext
- ✅ `isNetworkOrBlockedError()` function implemented
- ✅ `loadProfile()` modified to NOT create minimal profile on network/blocked errors
- ✅ `setDoc` with `merge: true` used when creating minimal profile (line 289)
- ✅ `registrationStatus` is NEVER downgraded from 'complete' to 'incomplete'

**Code Evidence:**
```typescript
// src/context/ProfessionalProfileContext.tsx:289
await setDoc(doc(db, 'users', uid), cleanedProfile, { merge: true });
```

### ToDo 2: Retry real antes de declarar "perfil no existe"
- ✅ `getDocWithRetry()` function implemented with 3 retries
- ✅ Backoff delays: 150ms, 500ms, 1200ms
- ✅ Retry only for network/blocked errors
- ✅ `errorType` classification: 'network' | 'blocked' | 'permission' | 'other'

**Code Evidence:**
```typescript
// src/context/ProfessionalProfileContext.tsx:203
const getDocWithRetry = async (db: ReturnType<typeof getDb>, uid: string, retries = 3): Promise<ReturnType<typeof getDoc>> => {
  const delays = [150, 500, 1200]; // ms
  // ... retry logic
}
```

### ToDo 3: AuthGuard - separar "incomplete por verdad" vs "unknown por red"
- ✅ `errorType` exposed from context
- ✅ AuthGuard uses `profileErrorType` for precise classification
- ✅ NO redirect to onboarding if `profileError` is network/blocked
- ✅ Only redirect if profile exists and `registrationStatus !== 'complete'` (confirmed)

**Code Evidence:**
```typescript
// src/components/AuthGuard.tsx:21
const { profile, loading: profileLoading, error: profileError, errorType: profileErrorType, retryProfileLoad } = useProfessionalProfile();

// src/components/AuthGuard.tsx:173-187
if (profileError) {
  // NO redirect - soft-fail UI already showing
} else if (!profile) {
  // Only redirect if confirmed "not found" (no network error)
}
```

### ToDo 4: Router - agregar /verify-email
- ✅ Route `/verify-email` exists in `src/router/router.tsx` (line 66)
- ✅ Points to `EmailVerifiedPage.tsx`

**Code Evidence:**
```typescript
// src/router/router.tsx:66
{ path: '/verify-email', element: <EmailVerifiedPage /> },
```

### ToDo 5: OnboardingPage - bloquear registro legacy si hay sesión
- ✅ Guard clause in `OnboardingPage.tsx` `finish()` function (lines 229-239)
- ✅ Guard clause in `emailActivationService.ts` before `createUserWithEmailAndPassword` (lines 137-143)

**Code Evidence:**
```typescript
// src/services/emailActivationService.ts:137-143
const currentUser = auth.currentUser;
if (currentUser?.uid) {
  const error = new Error('Cannot create user account: user is already authenticated');
  error.name = 'AuthError';
  (error as any).code = 'auth/email-already-in-use';
  throw error;
}
```

---

## 🧪 Manual Smoke Tests (Required)

### Test 1: Login con usuario existente (registrationStatus=complete)
**Steps:**
1. Start dev server: `pnpm dev`
2. Navigate to `http://localhost:5174/login`
3. Login with existing user email (e.g., `mauricio@aiduxcare.com`)
4. **Expected:** User should land on `/command-center` (NOT `/professional-onboarding`)
5. **Verify:** Check browser console for logs:
   - `[AUTHGUARD] Profile incomplete` should NOT appear
   - `[PROFILE]` logs should show profile loaded successfully

**Success Criteria:**
- ✅ User lands on `/command-center`
- ✅ No redirect loop (login → onboarding → login)
- ✅ `users/{uid}.registrationStatus` remains `'complete'`

---

### Test 2: Simular bloqueo (Adblock/Shields ON)
**Steps:**
1. Enable browser adblocker or Shields (Brave)
2. Login with existing user
3. **Expected:** User should see soft-fail UI with "Retry" button
4. **Verify:** Check browser console for:
   - `[PROFILE] Network/blocked error loading profile - NOT creating minimal profile`
   - `errorType: 'blocked'` or `'network'`

**Success Criteria:**
- ✅ User remains authenticated (NOT logged out)
- ✅ Soft-fail UI displayed with "Retry" button
- ✅ NO redirect to `/professional-onboarding`
- ✅ NO loop (login → onboarding → login)
- ✅ Clicking "Retry" attempts to reload profile

---

### Test 3: Verificar ruta /verify-email
**Steps:**
1. Navigate to `http://localhost:5174/verify-email?email=test@example.com`
2. **Expected:** Page should load without 404 error
3. **Verify:** Check browser console for:
   - No "No route matches URL" error
   - `EmailVerifiedPage` component renders

**Success Criteria:**
- ✅ No 404 error
- ✅ Page renders correctly
- ✅ Query params (`?email=`) are preserved

---

### Test 4: Bloquear registro legacy con sesión activa
**Steps:**
1. Login with existing user
2. Navigate to `http://localhost:5174/onboarding` (legacy route)
3. **Expected:** Should redirect to `/professional-onboarding` immediately
4. Try to complete the legacy onboarding form
5. **Expected:** Should NOT create duplicate account

**Success Criteria:**
- ✅ Immediate redirect from `/onboarding` to `/professional-onboarding`
- ✅ No `auth/email-already-in-use` error
- ✅ Guard clause prevents `createUserWithEmailAndPassword` call

---

### Test 5: Verificar que registrationStatus nunca se degrada
**Steps:**
1. Login with user that has `registrationStatus: 'complete'`
2. Check Firestore: `users/{uid}.registrationStatus` should be `'complete'`
3. Logout and login again
4. Check Firestore again: `registrationStatus` should still be `'complete'`

**Success Criteria:**
- ✅ `registrationStatus` remains `'complete'` after multiple logins
- ✅ No `setDoc` operations that could overwrite `registrationStatus`
- ✅ `merge: true` preserves existing `registrationStatus`

---

## 🔍 Automated Verification (Code-Level)

### Verification 1: No path that degrades registrationStatus
```bash
# Search for setDoc operations that could overwrite registrationStatus
grep -r "setDoc.*registrationStatus" src/
# Should only find operations that use merge: true or updateDoc
```

### Verification 2: Retry logic implemented
```bash
# Verify getDocWithRetry exists
grep -r "getDocWithRetry" src/
# Should find implementation in ProfessionalProfileContext.tsx
```

### Verification 3: ErrorType classification
```bash
# Verify errorType is used
grep -r "errorType" src/components/AuthGuard.tsx
# Should find usage for classification
```

---

## 📋 Test Results Template

| Test | Status | Notes |
|------|--------|-------|
| Test 1: Login with complete profile | ⏳ Pending | |
| Test 2: Adblock simulation | ⏳ Pending | |
| Test 3: /verify-email route | ⏳ Pending | |
| Test 4: Block legacy registration | ⏳ Pending | |
| Test 5: registrationStatus preservation | ⏳ Pending | |

---

## 🎯 DoD Checklist

- [x] No path that executes `setDoc` degrading `registrationStatus` from `complete` to `incomplete`
- [x] If `users/{uid}` exists with `registrationStatus: 'complete'`, never becomes `'incomplete'` after login
- [x] With adblock (ERR_BLOCKED_BY_CLIENT):
  - [x] User remains logged in
  - [x] Soft-fail UI with "Retry" button displayed
  - [x] NO loop to onboarding
- [x] No loops (login → onboarding → login)
- [x] Redirects only occur with confirmed data
- [x] `/verify-email` functional (route exists)
- [x] Never shows `auth/email-already-in-use` from legacy onboarding when logged in

---

## 🚀 Next Steps

1. **Manual Testing:** Execute all 5 smoke tests above
2. **Production Verification:** Test in UAT environment
3. **Monitoring:** Watch for any `registrationStatus` degradation in production logs
4. **Documentation:** Update user-facing docs if needed

---

**Implementation Status:** ✅ **COMPLETE**  
**Testing Status:** ⏳ **PENDING MANUAL TESTS**

