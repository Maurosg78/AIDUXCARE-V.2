# 🧠 **CTO DECISION FRAMEWORK — AIDUX NORTH MVP**

**Date:** November 2025  
**Decision Maker:** CTO  
**Status:** ✅ **OFFICIAL**  
**Effective:** Immediately

---

## 📋 **DECISION PRINCIPLES**

All CTO decisions are based on 4 pillars:

1. **Patient Safety** (PHIPA-compliant, no data leaks, no note loss)
2. **Clinical Reliability** (Robust Audio → SOAP usable by real physiotherapists)
3. **Real Operability** (Mobile-first, Clinical Vault, note recovery, PDF optional)
4. **Pilot Viability** (14 days, not 3 months)

---

## 🚨 **CRITICAL DECISIONS — OFFICIAL**

### **1. Clinical Vault is CENTRAL FEATURE of MVP (APPROVED)**

**Decision:** Without Clinical Vault, there is no pilot.

**Approved:** MVP with list → search → preview → copy.

Nothing "prettier" for now.

**Status:** ✅ **COMPLETE (with tests)**

---

### **2. Data Residency — LEGAL PRIORITY #1**

**Decision:** Nothing advances without this.

**Day 2 Priority:**
- Verify Firestore region
- Verify Storage region
- Verify Supabase region
- Document it
- Save evidence

**STOP WORK if any region is not Canadian → migrate first.**

**Status:** 🟡 **50% (requires console access)**

---

### **3. Audio Pipeline Robustness — CLINICAL FLOW BLOCKER**

**Decision:** If physiotherapist cannot record or upload fails → pilot dies.

**CTO Mandate:**
- Implement **3 retries + exponential backoff**
- With **unit tests + integration tests**

**If pipeline has >5% failures → NO PILOT.**

**Status:** ⏳ **0% (starts today)**

---

### **4. Mobile-First → CTO MANDATE**

80% of pilots will use AiDux from tablet or mobile.

**CTO Decision:** Not "pilot-ready" until:
- iOS Safari (iPhone)
- iPadOS
- Android Chrome

Pass complete flow: **login → record → upload → SOAP → copy → vault**

**Status:** ⏳ **0% (starts tomorrow)**

---

### **5. Mandatory Tests → CTO POLICY**

Nothing enters production without:
- Unit tests
- Integration tests
- Test logic
- Edge cases

**Formalized in:** `docs/north/CTO_TESTING_REQUIREMENTS.md`

**CTO Decision:** All new features pass **Test Gate** before marked "done".

---

## 🧩 **CTO — OFFICIAL IMPLEMENTATION PLAN (14 DAYS)**

### **PHASE 1 (Days 1-7) — Blockers**

1. Clinical Vault MVP → ✅ **COMPLETE**
2. Data Residency Verification → 🔥 **Priority Day 2**
3. Audio Pipeline Robustness → **Days 2-4**
4. Mobile Prep → **Days 3-4**
5. Feedback Verification → ✅ **COMPLETE**

---

### **PHASE 2 (Days 8-11) — Mobile + Stability**

- Real device testing
- Fixes
- Pipeline refinement
- Latency testing
- User experience hardening

---

### **PHASE 3 (Days 12-14) — Polish + QA**

- Regression testing
- Edge case testing
- Pilot onboarding package
- Pilot instructions
- Monitoring dashboard for pilot
- Success metrics instrumentation

---

## 📈 **CTO — SUCCESS RULE (Go/No-Go)**

Pilot only launches if ALL are met:

1. ✅ Data Residency → **100% Canada**
2. ✅ Audio Pipeline → **<5% failures**
3. ✅ Clinical Vault → **stable and tested**
4. ✅ Mobile → **complete flow OK on iOS and Android**
5. ✅ Tests → **90% of core features**
6. ✅ Feedback System → **active**
7. ✅ Latency audio→SOAP: **<30 seconds**
8. ✅ Error handling: **clear, visible, useful**

**If any fails → NO PILOT.**

**Rationale:** We will not risk:
- Real clinical data
- Physiotherapist trust
- Credibility with Niagara

---

## 🔥 **CTO — OFFICIAL ORDERS FOR TODAY (DAY 2)**

**To Implementer:**

1. Complete Data Residency (Firestore, Storage, Supabase)
2. Attach evidence and replicable steps
3. Implement retries + backoff in pipeline
4. Create unit and integration tests for pipeline
5. Update report with "Testing & Logic"
6. Do not advance new features without test suite

---

## 🇨🇦 **CTO — MVP CANADIAN-FIT GUARANTEE**

With this decision framework, I guarantee:

**AiDux North will have a clinically valid MVP for Canadian physiotherapists in 14 days.**

---

**CTO Signature:** ✅ **APPROVED**

**Effective Date:** November 2025  
**Review Date:** End of Day 14

