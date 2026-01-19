# AiDuxCare — Demo Stability Checklist (Internal)

**Scope:** Canada Pilot  
**Audience:** CTO / DevOps / Demo Owner  
**Rule:** If any CRITICAL item fails → **NO DEMO**

---

## 0. Metadata (fill before demo)

- Date:
- Demo location (e.g. Niagara Hub):
- Environment (e.g. uat / prod):
- Commit / Tag used:
- Demo owner:

---

## 1. Infrastructure & Access (CRITICAL)

- [ ] Using **stable Firebase Hosting URL** (`*.web.app`)
- [ ] Demo URL loads on:
  - [ ] Safari iOS
  - [ ] Chrome Desktop
- [ ] URL tested in **incognito mode**
- [ ] Tested from **non-home network** (4G/5G or external Wi-Fi)

---

## 2. Monitoring & Visibility (CRITICAL)

**Opened before demo (separate tabs):**

- [ ] Firebase Console:
  - [ ] Functions → logs (real time)
  - [ ] Firestore → activity
  - [ ] Hosting → requests
- [ ] Browser DevTools:
  - [ ] Console tab (no red errors)
  - [ ] Network tab active
- [ ] Error tracking dashboard (if available)

**Observed metrics:**
- [ ] Function latency < 2s
- [ ] 0 errors 4xx / 5xx
- [ ] No visible cold starts

---

## 3. Pre-warming Functions (CRITICAL)

Executed **15–20 min before demo**:

```bash
curl https://<project>.cloudfunctions.net/apiConsentVerify?token=test
curl https://<project>.cloudfunctions.net/apiReferral
curl https://<project>.cloudfunctions.net/sendConsentSMS
```

* [ ] Last invocation < 5 min (Firebase Console)
* [ ] No timeouts > 5s

---

## 4. Consent Flow (CRITICAL)

### SMS

* [ ] SMS arrives < 10s
* [ ] Message text is complete (no line breaks in URL)
* [ ] Clinician name correct
* [ ] Links point to **same environment as demo**

### Consent Page

* [ ] Opens on real iPhone
* [ ] Clear explanation of consent
* [ ] Action works (Authorize / Accept)
* [ ] **No technical error messages**
* [ ] No "not implemented" text visible

---

## 5. Tokens & Session Integrity (CRITICAL)

* [ ] Demo user has sufficient tokens
* [ ] No unexpected token consumption
* [ ] No "out of tokens" message during demo
* [ ] Patient switching does NOT mix data

---

## 6. Core Clinical Flow (CRITICAL)

* [ ] Create/select patient
* [ ] Start Initial session
* [ ] Generate SOAP successfully
* [ ] SOAP structure correct
* [ ] No diagnostic claims
* [ ] Save/export works (even if not shown)

---

## 7. UI / UX Safety (HIGH)

* [ ] No "not implemented" messages
* [ ] Disabled buttons have clear explanation
* [ ] No infinite loaders
* [ ] Error boundaries active (no stack traces)

---

## 8. Demo Safety Mode & Rollback (CRITICAL)

* [ ] Demo-safe tag created:

```bash
git tag demo-safe-YYYYMMDD
git push origin demo-safe-YYYYMMDD
```

* [ ] Firestore demo data backed up or disposable
* [ ] Rollback procedure known (even if not executed)

---

## 9. Environment Sanity (HIGH)

* [ ] `firebase functions:config:get` reviewed
* [ ] No undefined or placeholder values
* [ ] Firestore indexes created
* [ ] No slow queries (>1s) in logs
* [ ] Quotas well below limits

---

## 10. Plan B (MANDATORY)

* [ ] Backup demo user
* [ ] Backup patient already created
* [ ] Backup session already created
* [ ] Short demo video available (2–3 min)

---

## Final Decision

* [ ] ✅ DEMO APPROVED
* [ ] ❌ DEMO BLOCKED (reason):

**Signed by (CTO/Demo Owner):**
