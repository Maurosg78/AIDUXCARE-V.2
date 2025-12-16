# 🚀 **AIDUX NORTH — CANADIAN PHYSIO PILOT (FINAL PRIORITIES + DOC PACKS)**

**Version:** 1.0.0  
**Last Updated:** November 2025  
**Market:** Canada-first · en-CA · SoT aligned  
**Status:** Pre-Launch Checklist

---

## 📋 **OVERVIEW**

This document outlines the **critical priorities**, **secondary priorities**, and **documentation packs** required before launching the Canadian Physiotherapist Pilot Program.

**Target:** Canadian physiotherapists using AiduxCare in real clinical settings  
**Timeline:** Pre-launch validation required  
**Success Criteria:** >80% clinically valid SOAP notes, >30% time savings, >70% recommendation rate

---

# 🟦 **1. CRITICAL PRIORITIES BEFORE PILOT LAUNCH (BLOCKERS)**

These **5 areas are mandatory before Day 0** of the pilot. Without them, a Canadian physiotherapist **cannot** use AiduxCare in a real clinical context.

---

## 🔥 **1) Audio → SOAP Pipeline Completely Stable (End-to-End)**

**Status:** ⚠️ **REQUIRED BEFORE LAUNCH**

```
□ Audio recording from mobile/tablet without failures
□ Upload to Storage (CA region) with retries
□ Whisper functioning with processing times < 30s
□ Niagara PromptFactory generating CPO-compliant SOAP notes
□ User-visible error handling
□ Retries and fallback (if AI fails)
```

**Acceptance Criteria:**
- 95%+ success rate for audio uploads
- <30s average processing time from audio to SOAP
- Clear error messages for users
- Automatic retry mechanism for transient failures

---

## 🔥 **2) Canadian Data Residency (Verified and Documented)**

**Status:** ⚠️ **REQUIRED BEFORE LAUNCH**

```
□ Firestore/Storage in Canada region
□ Firebase Functions in Canadian region
□ Supabase in Canadian region
□ PHIPA compliance document (minimum viable)
```

**Acceptance Criteria:**
- All data stored in Canadian data centers
- PHIPA compliance documentation available
- Data residency verified and documented
- Cross-border data transfer disclosures complete

---

## 🔥 **3) Clinical Vault / Document Hub (CRITICAL PRIORITY #3)**

**Status:** ⚠️ **REQUIRED BEFORE LAUNCH**

Physiotherapists **need** to find their notes at the end of the day. Without this, the pilot fails because they cannot do charting.

```
□ /documents screen implemented
□ List of SOAP notes generated per visit
□ "Copy to clipboard" button
□ PDF download functionality
□ Text preview
□ Search by patient name
□ Post-visit editing capability
□ Automatic saving to Firestore + Supabase logging
```

**Acceptance Criteria:**
- All SOAP notes accessible from `/documents`
- Search functionality working
- Copy/download working reliably
- Notes persist across sessions
- Audit trail in Supabase

---

## 🔥 **4) Mobile-First Real Functionality (iOS + Android)**

**Status:** ⚠️ **REQUIRED BEFORE LAUNCH**

```
□ Microphone permissions handling
□ Safari iOS tested (iPhone + iPad)
□ Chrome Android tested
□ Touch-friendly UI
□ Visible loading states
□ Visible error states
```

**Acceptance Criteria:**
- Works on iOS Safari (iPhone 12+ and iPad)
- Works on Android Chrome (Android 10+)
- Touch targets minimum 44x44px
- Loading indicators on all async operations
- Error messages clearly visible

---

## 🔥 **5) Feedback & Support Integrated**

**Status:** ⚠️ **REQUIRED BEFORE LAUNCH**

```
□ "Give feedback" widget
□ Bug report functionality
□ Feature request functionality
□ Contextual logging
□ Functional support email
□ Minimum FAQ
```

**Acceptance Criteria:**
- Feedback widget accessible from all pages
- Bug reports include context (user, page, timestamp)
- Support email functional
- FAQ covers common questions
- Feedback stored in Supabase for analysis

---

# 🟧 **2. SECONDARY PRIORITIES (SHOULD HAVE)**

These improve pilot quality but do not block launch if missing.

---

## 🟠 **Front-End Usability**

```
□ Professional onboarding clean
□ Patient search functionality
□ Visit history
□ Loading states on all screens
□ Clear error states
```

**Priority:** High  
**Timeline:** Week 1-2 of pilot

---

## 🟠 **Backend & Logging**

```
□ Basic PHI audit trail
□ AI processing logs
□ Error rate monitoring
□ Metrics export to Supabase
```

**Priority:** Medium  
**Timeline:** Week 2-3 of pilot

---

## 🟠 **Canadian Regulatory Enhancement**

```
□ Terms of Service in en-CA
□ Privacy Policy in en-CA
□ Audio consent on-screen
```

**Priority:** Medium  
**Timeline:** Pre-launch or Week 1

---

# 🟩 **3. NICE TO HAVE (POST-LAUNCH ITERATION)**

```
□ Internal analytics dashboard
□ Vault improvements (folders, tags)
□ EMR-specific format exports
□ Clinical readability improvements
□ Shortcuts + quick commands
```

**Priority:** Low  
**Timeline:** Post-pilot iteration

---

# 🟦 **4. DOCUMENTATION PACKS**

## 📦 **Pilot Welcome Pack**

See: [`pilot-welcome-pack.md`](./pilot-welcome-pack.md)

**Delivery:** Must be provided to every physiotherapist entering the pilot.

**Contents:**
- Welcome message
- Quick start instructions (1 page)
- Feedback process
- FAQ
- Known limitations
- Legal documentation (pilot version)

---

## 📦 **Niagara Pilot Operations Pack**

See: [`pilot-operations-pack.md`](./pilot-operations-pack.md)

**Delivery:** Must be provided to Niagara technical team.

**Contents:**
- Pilot architecture diagram
- Technical checklist
- Mandatory metrics
- Failure playbook
- Logs and traceability
- Pilot timeline
- Success criteria
- Known risks

---

# 📊 **SUCCESS METRICS**

## **Pilot Success Criteria:**

- ✅ **>80%** clinically valid SOAP notes
- ✅ **>30%** time savings reported by physiotherapists
- ✅ **>70%** recommendation rate (would recommend to colleagues)
- ✅ **<5%** critical failure rate
- ✅ **>90%** user satisfaction score

## **Technical Metrics:**

- Audio → SOAP processing time: **<30s average**
- Upload success rate: **>95%**
- SOAP generation success rate: **>90%**
- Vault access success rate: **>99%**

---

# 🚨 **RISK MITIGATION**

## **Known Risks:**

1. **Latency on mobile networks**
   - Mitigation: Optimized uploads, retry logic

2. **Audio quality variability**
   - Mitigation: Clear recording guidelines, quality checks

3. **Occasional GPT errors**
   - Mitigation: Retry mechanism, manual override

4. **User adoption challenges**
   - Mitigation: Comprehensive welcome pack, support availability

---

# 📅 **PILOT TIMELINE**

## **Week 1: Onboarding**
- Welcome pack delivery
- Account setup
- Initial training session
- First test sessions

## **Week 2: Real Usage**
- Daily clinical use
- Feedback collection
- Issue monitoring

## **Week 3: Initial Review**
- Mid-pilot survey
- Issue resolution
- Feature adjustments

## **Week 4: Final Adjustments + Survey**
- Final feedback collection
- Success metrics evaluation
- Post-pilot planning

---

# ✅ **LAUNCH DECISION FRAMEWORK**

## **Green Light Criteria:**

- ✅ All 5 critical priorities completed
- ✅ Welcome pack delivered
- ✅ Operations pack delivered
- ✅ Technical infrastructure verified
- ✅ Support channels operational

## **Yellow Light (Conditional Launch):**

- ⚠️ 4/5 critical priorities completed
- ⚠️ Workarounds available for missing items
- ⚠️ Clear timeline for completion

## **Red Light (No Launch):**

- ❌ <4 critical priorities completed
- ❌ Critical infrastructure failures
- ❌ No support channels available

---

**Document Owner:** CTO / Product Lead  
**Review Cycle:** Weekly during pre-launch, bi-weekly during pilot  
**Next Review:** [Date TBD]

