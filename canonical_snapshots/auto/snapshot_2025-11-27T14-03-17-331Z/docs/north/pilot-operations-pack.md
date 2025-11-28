# 📦 **NIAGARA PILOT OPERATIONS PACK**

**Version:** 1.0.0  
**Last Updated:** November 2025  
**Target Audience:** Niagara Technical Team  
**Classification:** Internal Operations Documentation

---

## **Purpose**

This document provides Niagara technical team with:
1. How the pilot works
2. What to measure
3. What constitutes "success"
4. How to respond to failures

---

# **1. PILOT ARCHITECTURE**

## **System Flow Diagram**

```
┌─────────────┐
│   Frontend  │ (React + Vite)
│  (Browser)  │
└──────┬──────┘
       │
       │ Audio Upload
       ▼
┌─────────────┐
│   Storage   │ (Firebase Storage - CA region)
│  (Canada)   │
└──────┬──────┘
       │
       │ Trigger
       ▼
┌─────────────┐
│  Functions  │ (Firebase Functions - CA region)
│  (Canada)   │
└──────┬──────┘
       │
       │ Audio → Text
       ▼
┌─────────────┐
│   Whisper   │ (OpenAI API)
│  (US)       │
└──────┬──────┘
       │
       │ Transcript
       ▼
┌─────────────┐
│   Niagara   │ (PromptFactory + ModelSelector)
│  Processor  │
└──────┬──────┘
       │
       │ Clinical Analysis
       ▼
┌─────────────┐
│     GPT     │ (Vertex AI - US)
│  (Analysis) │
└──────┬──────┘
       │
       │ SOAP Generation
       ▼
┌─────────────┐
│     GPT     │ (Vertex AI - US)
│  (SOAP Gen) │
└──────┬──────┘
       │
       │ SOAP Note
       ▼
┌─────────────┐
│  Firestore  │ (CA region)
│  (Storage)  │
└──────┬──────┘
       │
       │ Audit Log
       ▼
┌─────────────┐
│   Supabase  │ (CA region)
│  (Analytics)│
└──────┬──────┘
       │
       │ Display
       ▼
┌─────────────┐
│    Vault    │ (/documents)
│  (Frontend) │
└─────────────┘
```

## **Key Components**

### **Frontend (React + Vite)**
- **Location:** `src/`
- **Key Pages:** Login, Command Center, Workflow, Documents (Vault)
- **Key Services:** `smsService.ts`, `patientService.ts`, `vertex-ai-soap-service.ts`

### **Firebase Storage (CA Region)**
- **Collection:** `audio-recordings/`
- **Structure:** `{userId}/{patientId}/{timestamp}.webm`
- **Retention:** 10+ years per CPO

### **Firebase Functions (CA Region)**
- **Function:** `processAudioRecording`
- **Trigger:** Storage upload completion
- **Process:** Audio → Whisper → Niagara → GPT → Firestore

### **Niagara Processor**
- **Location:** `src/services/vertex-ai-soap-service.ts`
- **Components:** PromptFactory, ModelSelector
- **Output:** CPO-compliant SOAP notes

### **Firestore (CA Region)**
- **Collections:** `patients/`, `soap-notes/`, `appointments/`, `users/`
- **Indexes:** Required for complex queries (see checklist)

### **Supabase (CA Region)**
- **Tables:** `audit_logs/`, `feedback/`, `metrics/`
- **Purpose:** Analytics, audit trail, feedback storage

---

# **2. TECHNICAL CHECKLIST FOR PILOT**

## **✅ Must Work (Critical Priorities)**

### **1. Audio → SOAP Pipeline**
- [ ] Audio recording works on iOS Safari
- [ ] Audio recording works on Android Chrome
- [ ] Upload to Storage succeeds >95% of the time
- [ ] Whisper processing <30s average
- [ ] Niagara generates valid SOAP notes
- [ ] Error handling visible to users
- [ ] Retry mechanism functional

### **2. Canadian Data Residency**
- [ ] Firestore in `northamerica-northeast1` (Montreal)
- [ ] Storage in `northamerica-northeast1`
- [ ] Functions in `northamerica-northeast1`
- [ ] Supabase in Canadian region
- [ ] PHIPA compliance document available

### **3. Clinical Vault**
- [ ] `/documents` page accessible
- [ ] SOAP notes listed by visit
- [ ] "Copy to clipboard" works
- [ ] PDF download works
- [ ] Text preview works
- [ ] Search by patient works
- [ ] Post-visit editing works
- [ ] Auto-save to Firestore works
- [ ] Audit log to Supabase works

### **4. Mobile Functionality**
- [ ] Microphone permissions handled
- [ ] iOS Safari tested (iPhone 12+, iPad)
- [ ] Android Chrome tested (Android 10+)
- [ ] Touch targets ≥44x44px
- [ ] Loading states visible
- [ ] Error states visible

### **5. Feedback & Support**
- [ ] Feedback widget accessible
- [ ] Bug report functional
- [ ] Feature request functional
- [ ] Contextual logging works
- [ ] Support email functional
- [ ] FAQ accessible

## **✅ Tested on Mobile**

- [ ] iPhone 12+ (Safari)
- [ ] iPad (Safari)
- [ ] Android 10+ (Chrome)
- [ ] Tablet devices (both iOS and Android)

## **✅ Known Limits**

- **Audio Quality:** Requires clear audio (no background noise)
- **Processing Time:** 20-40s average (depends on audio length)
- **Concurrent Users:** Tested up to 10 concurrent users
- **File Size:** Max 50MB per audio file

## **✅ External Dependencies**

- **OpenAI Whisper API:** Required for transcription
- **Google Vertex AI:** Required for SOAP generation
- **Firebase:** Required for storage and functions
- **Supabase:** Required for analytics
- **Twilio/Vonage:** Required for SMS consent links

---

# **3. MANDATORY METRICS TO OBSERVE**

## **Performance Metrics**

### **Audio → SOAP Processing Time**
- **Target:** <30s average
- **Measurement:** Time from "Stop Recording" to SOAP display
- **Location:** Supabase `metrics` table
- **Alert Threshold:** >60s (p95)

### **SOAP Generation Success Rate**
- **Target:** >90%
- **Measurement:** Successful SOAP generation / Total attempts
- **Location:** Supabase `metrics` table
- **Alert Threshold:** <85%

### **Upload Success Rate**
- **Target:** >95%
- **Measurement:** Successful uploads / Total upload attempts
- **Location:** Firebase Storage logs + Supabase
- **Alert Threshold:** <90%

### **Vault Access Success Rate**
- **Target:** >99%
- **Measurement:** Successful vault loads / Total vault access attempts
- **Location:** Firestore logs + Supabase
- **Alert Threshold:** <95%

## **Usage Metrics**

### **Vault Usage**
- **Measurement:** Number of notes accessed per user per day
- **Location:** Supabase `audit_logs` table
- **Query:** `SELECT COUNT(*) WHERE action = 'vault_access' GROUP BY user_id, date`

### **Feedback Received**
- **Measurement:** Number of feedback submissions per week
- **Location:** Supabase `feedback` table
- **Query:** `SELECT COUNT(*) WHERE created_at >= NOW() - INTERVAL '7 days'`

### **Error Rate**
- **Measurement:** Number of errors per 100 operations
- **Location:** Supabase `audit_logs` table (error type)
- **Alert Threshold:** >5% error rate

---

# **4. FAILURE PLAYBOOK**

## **If Whisper Fails**

1. **Automatic Retry:** System retries up to 3 times
2. **User Notification:** Clear error message displayed
3. **Fallback:** Manual transcription option available
4. **Logging:** Error logged to Supabase with context
5. **Alert:** Email alert to Niagara team if >5% failure rate

**Response Time:** <5 minutes for critical failures

## **If GPT Fails**

1. **Automatic Retry:** System retries up to 2 times
2. **User Notification:** "AI processing failed, please try again"
3. **Fallback:** Option to regenerate with different prompt
4. **Logging:** Error logged with prompt and response
5. **Alert:** Email alert if >3% failure rate

**Response Time:** <10 minutes for critical failures

## **If Storage Fails**

1. **Automatic Retry:** System retries upload up to 5 times
2. **User Notification:** "Upload failed, retrying..."
3. **Fallback:** Option to save locally and retry later
4. **Logging:** Storage error logged with file details
5. **Alert:** Immediate email alert for storage failures

**Response Time:** <2 minutes for storage failures

## **If User Reports Bug**

1. **Acknowledge:** Auto-acknowledgment email sent
2. **Triage:** Bug categorized (Critical, High, Medium, Low)
3. **Investigation:** Logs reviewed within 24 hours
4. **Resolution:** Fix deployed within 48 hours (Critical) or 1 week (High)
5. **Follow-up:** User notified of resolution

**Response Time:** <24 hours for acknowledgment, <48 hours for critical bugs

---

# **5. LOGS AND TRACEABILITY**

## **Where to View Logs**

### **Firebase Console**
- **URL:** https://console.firebase.google.com/project/aiduxcare-v2-uat-dev
- **Logs:** Functions → Logs
- **Storage:** Storage → Files
- **Firestore:** Firestore Database → Data

### **Supabase Dashboard**
- **URL:** [Supabase Project URL]
- **Logs:** Logs → Postgres Logs
- **Tables:** Table Editor → `audit_logs`, `feedback`, `metrics`

### **Application Logs**
- **Location:** Browser console (development)
- **Production:** Sent to Supabase `audit_logs` table
- **Format:** JSON with timestamp, user_id, action, metadata

## **What is a "Critical Error"?**

A critical error is:
- **User-facing failure** that prevents core functionality
- **Data loss** or corruption
- **Security breach** or unauthorized access
- **>10% failure rate** for any operation
- **Complete system outage**

## **How to Review Supabase Queries**

### **Common Queries**

```sql
-- Error rate by day
SELECT DATE(created_at) as date, 
       COUNT(*) FILTER (WHERE error IS NOT NULL) as errors,
       COUNT(*) as total,
       ROUND(100.0 * COUNT(*) FILTER (WHERE error IS NOT NULL) / COUNT(*), 2) as error_rate
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- SOAP generation success rate
SELECT DATE(created_at) as date,
       COUNT(*) FILTER (WHERE action = 'soap_generated' AND error IS NULL) as success,
       COUNT(*) FILTER (WHERE action = 'soap_generated') as total,
       ROUND(100.0 * COUNT(*) FILTER (WHERE action = 'soap_generated' AND error IS NULL) / 
             COUNT(*) FILTER (WHERE action = 'soap_generated'), 2) as success_rate
FROM audit_logs
WHERE action = 'soap_generated'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- User feedback summary
SELECT type, COUNT(*) as count
FROM feedback
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY type
ORDER BY count DESC;
```

---

# **6. PILOT TIMELINE**

## **Week 1: Onboarding**
- **Days 1-2:** Welcome pack delivery, account setup
- **Days 3-4:** Initial training session, first test sessions
- **Days 5-7:** Support for initial questions, bug fixes

**Key Metrics:** Account activation rate, first SOAP generation success

## **Week 2: Real Usage**
- **Days 8-14:** Daily clinical use, feedback collection
- **Daily:** Monitor error rates, response times
- **End of Week:** Mid-week check-in survey

**Key Metrics:** Daily active users, SOAP generation success rate, error rate

## **Week 3: Initial Review**
- **Days 15-17:** Mid-pilot survey distribution
- **Days 18-19:** Issue resolution, feature adjustments
- **Days 20-21:** Deploy fixes, gather feedback

**Key Metrics:** User satisfaction score, feature requests, bug reports

## **Week 4: Final Adjustments + Survey**
- **Days 22-24:** Final feedback collection
- **Days 25-26:** Success metrics evaluation
- **Days 27-28:** Post-pilot planning, report generation

**Key Metrics:** Final satisfaction score, recommendation rate, time savings

---

# **7. SUCCESS CRITERIA**

## **Pilot Success Metrics**

### **Clinical Validity**
- **Target:** >80% clinically valid SOAP notes
- **Measurement:** Manual review of random sample (20% of notes)
- **Criteria:** SOAP note contains all required sections, accurate clinical content

### **Time Savings**
- **Target:** >30% time savings reported
- **Measurement:** User survey question: "How much time did you save per visit?"
- **Calculation:** (Time with AiduxCare) / (Time without AiduxCare) < 0.7

### **Recommendation Rate**
- **Target:** >70% would recommend
- **Measurement:** End-of-pilot survey: "Would you recommend AiduxCare to a colleague?"
- **Calculation:** (Yes responses) / (Total responses) > 0.7

### **User Satisfaction**
- **Target:** >4.0/5.0 average rating
- **Measurement:** End-of-pilot survey: "Rate your overall satisfaction"
- **Calculation:** Average of all ratings > 4.0

### **Technical Performance**
- **Target:** <5% critical failure rate
- **Measurement:** (Critical errors) / (Total operations) < 0.05
- **Location:** Supabase `audit_logs` table

---

# **8. KNOWN RISKS (HONEST ASSESSMENT)**

## **Risk 1: Latency on Mobile Networks**

**Impact:** High  
**Probability:** Medium  
**Mitigation:**
- Optimized audio compression
- Chunked uploads with retry logic
- Clear loading indicators
- Offline queue for failed uploads

## **Risk 2: Audio Quality Variability**

**Impact:** Medium  
**Probability:** High  
**Mitigation:**
- Clear recording guidelines in welcome pack
- Audio quality checks before processing
- Manual transcription fallback
- User feedback on audio quality

## **Risk 3: Occasional GPT Errors**

**Impact:** Medium  
**Probability:** Medium  
**Mitigation:**
- Retry mechanism with exponential backoff
- Manual regeneration option
- Clear error messages
- Fallback to template-based SOAP

## **Risk 4: User Adoption Challenges**

**Impact:** High  
**Probability:** Medium  
**Mitigation:**
- Comprehensive welcome pack
- Ongoing support availability
- Regular check-ins during pilot
- Quick response to feedback

---

# **9. ESCALATION PROCEDURES**

## **Level 1: Standard Issues**
- **Response Time:** <24 hours
- **Handler:** Support team
- **Examples:** UI bugs, minor errors, user questions

## **Level 2: High Priority Issues**
- **Response Time:** <4 hours
- **Handler:** Technical lead
- **Examples:** Feature not working, data access issues

## **Level 3: Critical Issues**
- **Response Time:** <1 hour
- **Handler:** CTO / Technical lead
- **Examples:** System outage, data loss, security breach

## **Level 4: Emergency**
- **Response Time:** Immediate
- **Handler:** On-call engineer + CTO
- **Examples:** Complete system failure, PHI breach

---

# **10. COMMUNICATION CHANNELS**

## **Internal Communication**
- **Slack Channel:** #aidux-north-pilot
- **Daily Standup:** 9:00 AM EST (during pilot)
- **Weekly Review:** Fridays 3:00 PM EST

## **External Communication**
- **Support Email:** support@aiduxcare.com
- **Feedback Email:** feedback@aiduxcare.com
- **Emergency Contact:** [On-call phone number]

---

**Document Owner:** Niagara Technical Lead  
**Review Cycle:** Weekly during pilot  
**Last Updated:** November 2025  
**Next Review:** End of Week 1

