# 💬 **DEV CHECK-IN PROMPTS FOR IMPLEMENTER**

**Purpose:** Standard prompts for daily check-ins  
**Frequency:** 12:00, 18:00, 23:00 (Day 2)  
**Format:** Quick status update

---

## 📋 **12:00 CHECK-IN (MID-DAY)**

### **Prompt:**

```
Day 2 Mid-Day Check-In (12:00)

Please provide:
1. Data Residency status (Firestore, Storage, Supabase)
2. Any blockers encountered
3. Timeline status (on track / at risk / delayed)
4. Next steps for afternoon

Status: [GREEN / YELLOW / RED]
```

### **Expected Response Format:**

```
✅ Data Residency: [Status]
   • Firestore: [Region] ✅/❌
   • Storage: [Region] ✅/❌
   • Supabase: [Region] ✅/❌

⚠️ Blockers: [None / List]

📊 Timeline: [On track / At risk / Delayed]

📋 Next Steps: [List]
```

---

## 📋 **18:00 CHECK-IN (END OF PHASE 2)**

### **Prompt:**

```
Day 2 End of Phase 2 Check-In (18:00)

Please provide:
1. Audio Pipeline implementation status
2. Retry mechanism: [Implemented / In Progress / Blocked]
3. Error visibility: [Implemented / In Progress / Blocked]
4. Failure classification: [Implemented / In Progress / Blocked]
5. Latency tracking: [Implemented / In Progress / Blocked]
6. Any blockers
7. Timeline status

Status: [GREEN / YELLOW / RED]
```

### **Expected Response Format:**

```
✅ Audio Pipeline: [Status]
   • Retry Mechanism: ✅/⏳/❌
   • Error Visibility: ✅/⏳/❌
   • Failure Classification: ✅/⏳/❌
   • Latency Tracking: ✅/⏳/❌

⚠️ Blockers: [None / List]

📊 Timeline: [On track / At risk / Delayed]

📋 Next Steps: [Testing phase]
```

---

## 📋 **23:00 CHECK-IN (END OF DAY)**

### **Prompt:**

```
Day 2 End of Day Check-In (23:00)

Please provide:
1. Testing status
2. Test results (passing / failing)
3. Test coverage
4. Day 2 completion percentage
5. Blockers for Day 3
6. Day 2 report ready: [Yes/No]

Status: [GREEN / YELLOW / RED]
```

### **Expected Response Format:**

```
✅ Testing: [Status]
   • Unit Tests: [X] passing / [Y] total
   • Integration Tests: [X] passing / [Y] total
   • Coverage: [X]%

📊 Day 2 Progress: [X]% (Target: 70%)

⚠️ Blockers for Day 3: [None / List]

📄 Day 2 Report: [Ready / In Progress]
```

---

## 🚨 **URGENT ESCALATION PROMPTS**

### **If Data Residency Fails:**

```
🚨 URGENT: Data Residency Verification Failed

[Service] is NOT in Canada region.

Current Region: [Region]
Required Region: northamerica-northeast1

STOP WORK - Escalating to CTO immediately.
```

### **If Critical Blocker:**

```
🚨 CRITICAL BLOCKER: [Blocker Description]

Impact: [Impact]
Timeline Risk: [Risk]
Mitigation Attempted: [Attempts]

Escalating to CTO immediately.
```

---

## 📊 **STATUS CODES**

**GREEN:** On track, no blockers  
**YELLOW:** At risk, minor blockers  
**RED:** Blocked, critical issues

---

**Check-In Prompts Status:** ✅ **READY**

**Last Updated:** November 2025

