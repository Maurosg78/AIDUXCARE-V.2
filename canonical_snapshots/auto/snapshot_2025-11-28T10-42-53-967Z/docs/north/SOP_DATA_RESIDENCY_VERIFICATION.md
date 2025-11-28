# 📋 **SOP: DATA RESIDENCY VERIFICATION CHECKLIST**

**Standard Operating Procedure**  
**Purpose:** PHIPA Compliance - Verify Canadian Data Residency  
**Owner:** Implementation Team  
**Approved By:** CTO  
**Effective Date:** November 2025

---

## 🎯 **OBJECTIVE**

Verify that all data storage services are located in Canada (`northamerica-northeast1` region) to ensure PHIPA compliance.

**Critical:** If ANY service is NOT in Canada → **STOP WORK** → **ESCALATE TO CTO**

---

## 📋 **VERIFICATION CHECKLIST**

### **1. Firestore Database**

**Steps:**
1. [ ] Access Firebase Console: https://console.firebase.google.com
2. [ ] Select project: `aiduxcare-v2-uat-dev`
3. [ ] Navigate to: **Firestore Database** → **Settings** (gear icon)
4. [ ] Check: **Database location** field
5. [ ] Verify: Region is `northamerica-northeast1` (Montreal, Canada)
6. [ ] Screenshot: Database settings page showing region
7. [ ] Document: Region code, verification date, method

**Expected Result:** `northamerica-northeast1` (Montreal, Canada)

**If NOT Canadian:**
- 🚨 **STOP WORK**
- 🚨 **ESCALATE TO CTO IMMEDIATELY**
- 🚨 **DO NOT PROCEED** until migration planned

**Evidence Required:**
- [ ] Screenshot of Firestore settings showing region
- [ ] Region code documented: `northamerica-northeast1`
- [ ] Verification date: [Date]
- [ ] Verified by: [Name]

---

### **2. Firebase Storage**

**Steps:**
1. [ ] Access Firebase Console
2. [ ] Navigate to: **Storage** → **Settings** (gear icon)
3. [ ] Check: **Bucket location** field
4. [ ] Verify: Region is `northamerica-northeast1` (Montreal, Canada)
5. [ ] Screenshot: Storage settings page showing region
6. [ ] Document: Region code, verification date, method

**Expected Result:** `northamerica-northeast1` (Montreal, Canada)

**If NOT Canadian:**
- 🚨 **STOP WORK**
- 🚨 **ESCALATE TO CTO IMMEDIATELY**
- 🚨 **DO NOT PROCEED** until migration planned

**Evidence Required:**
- [ ] Screenshot of Storage settings showing region
- [ ] Region code documented: `northamerica-northeast1`
- [ ] Verification date: [Date]
- [ ] Verified by: [Name]

---

### **3. Supabase Database**

**Steps:**
1. [ ] Access Supabase Dashboard: https://app.supabase.com
2. [ ] Select project: [Project Name]
3. [ ] Navigate to: **Project Settings** → **Infrastructure**
4. [ ] Check: **Region** field
5. [ ] Verify: Region is Canada
6. [ ] Screenshot: Infrastructure settings showing region
7. [ ] Document: Region code, verification date, method

**Expected Result:** Canada region

**If NOT Canadian:**
- 🚨 **STOP WORK**
- 🚨 **ESCALATE TO CTO IMMEDIATELY**
- 🚨 **DO NOT PROCEED** until migration planned

**Evidence Required:**
- [ ] Screenshot of Supabase infrastructure settings showing region
- [ ] Region code documented: [Region]
- [ ] Verification date: [Date]
- [ ] Verified by: [Name]

---

### **4. Firebase Functions**

**Steps:**
1. [ ] Check code: `src/core/assistant/assistantAdapter.ts`
2. [ ] Verify: Region is `northamerica-northeast1`
3. [ ] Check Firebase Console: **Functions** → **Settings**
4. [ ] Verify: Region is `northamerica-northeast1`
5. [ ] Document: Region code, verification date, method

**Expected Result:** `northamerica-northeast1` (Montreal, Canada)

**If NOT Canadian:**
- 🚨 **STOP WORK**
- 🚨 **ESCALATE TO CTO IMMEDIATELY**
- 🚨 **DO NOT PROCEED** until migration planned

**Evidence Required:**
- [ ] Code review showing region
- [ ] Screenshot of Functions settings (if available)
- [ ] Region code documented: `northamerica-northeast1`
- [ ] Verification date: [Date]
- [ ] Verified by: [Name]

---

## 📝 **DOCUMENTATION REQUIREMENTS**

### **Update `DATA_RESIDENCY_VERIFICATION.md`:**

- [ ] Add verified regions (exact codes)
- [ ] Attach screenshots
- [ ] Add verification date
- [ ] Document verification steps (replicable)
- [ ] Add verification method
- [ ] Add verified by: [Name]

### **Update `IMPLEMENTER_FINAL_REPORT.md`:**

- [ ] Add "Data Residency — Testing & Logic" section
- [ ] Document verification method
- [ ] Document how auditors can replicate
- [ ] Add evidence links

---

## ✅ **VERIFICATION COMPLETE**

**All services verified as Canadian:**
- [ ] Firestore: `northamerica-northeast1` ✅
- [ ] Storage: `northamerica-northeast1` ✅
- [ ] Supabase: Canada ✅
- [ ] Functions: `northamerica-northeast1` ✅

**Evidence documented:**
- [ ] Screenshots attached
- [ ] Verification steps documented
- [ ] CTO notified

**Status:** ✅ **VERIFIED** or 🚨 **BLOCKED**

---

## 🚨 **ESCALATION PROCEDURE**

**If ANY service is NOT Canadian:**

1. **STOP WORK** immediately
2. **Document** the issue:
   - Which service is NOT Canadian
   - Current region
   - Required region
3. **Escalate to CTO** immediately:
   - Email: [CTO Email]
   - Subject: "URGENT: Data Residency Verification Failed"
   - Include: Screenshots, current region, required region
4. **DO NOT PROCEED** with other tasks until resolved
5. **Wait for CTO approval** before continuing

---

## 📞 **CONTACTS**

**CTO:** [Contact Info]  
**Firebase Support:** https://firebase.google.com/support  
**Supabase Support:** https://supabase.com/support

---

**SOP Status:** ✅ **APPROVED**

**Last Updated:** November 2025  
**Next Review:** End of Day 2

