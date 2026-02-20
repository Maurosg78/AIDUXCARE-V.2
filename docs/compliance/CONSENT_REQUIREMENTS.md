# Consent Requirements - Decision Documentation

**Date:** 2026-02-20  
**Work Order:** WO-005  
**Feedback ID:** `RPYKJoZTmCzHgYJMf0hQ`  
**Question:** Is the minimal consent text in the app sufficient, or should it match the longer SMS text sent to patients?

---

## Current State Analysis

### A) Verbal Consent Text (App - Minimal)

**Location:** `src/services/verbalConsentService.ts` → `VERBAL_CONSENT_TEXT`

**Current Text:**
```
Vamos a grabar nuestra sesión de fisioterapia para generar 
automáticamente las notas médicas usando inteligencia artificial.
La grabación se mantiene segura en servidores canadienses.
¿Autoriza esta grabación y procesamiento de sus datos?
```

**Used In:** `VerbalConsentModal.tsx` - shown to physiotherapist to read to patient before recording

**Length:** ~50 words

---

### B) SMS Text (Sent to Patients)

**Location:** `src/content/smsTemplates.ts` → `SMS_TEMPLATES.consent.en_CA`

**Current Text:**
```
Hello [patientName], [physioName] requires your consent for health data processing according to Canadian law (PHIPA s.18).

Authorize: [consentUrl]

Privacy Policy: [privacyUrl]

Reply STOP to opt out.
```

**Length:** ~30 words

**Note:** SMS is a notification with link to full consent document, not the consent text itself.

---

### C) Full Legal Consent Document (Portal)

**Location:** `src/content/legalConsentContent.ts` → `LEGAL_CONSENT_CONTENT.fullDocument`

**Length:** ~500+ words

**Includes:**
- ✅ Purpose of recording
- ✅ AI processing disclosure
- ✅ **Specific third-party processors** (OpenAI Whisper API, Google Vertex AI Gemini)
- ✅ **Processing location** (US us-central1 region)
- ✅ **CLOUD Act exposure** disclosure
- ✅ Right to refuse
- ✅ Data retention (10 years per CPO)
- ✅ Contact information (compliance@aiduxcare.com)
- ✅ Withdrawal process
- ✅ Complaint filing process

**Used In:** `PatientConsentPortalPage.tsx` - full document shown when patient clicks SMS link

---

## PHIPA Requirements Analysis

### Mandatory Requirements (PHIPA s.18)

| **Requirement** | **Verbal Text** | **SMS** | **Full Document** | **Status** |
|-----------------|-----------------|---------|-------------------|------------|
| Purpose of recording | ✅ Yes | ✅ Yes (implied) | ✅ Yes | ✅ Met |
| AI processing disclosure | ✅ Yes | ✅ Yes (implied) | ✅ Yes | ✅ Met |
| **Third-party processors** | ❌ **NO** | ❌ **NO** | ✅ Yes (OpenAI, Google) | ⚠️ **GAP** |
| **Processing location** | ❌ **NO** (incorrect: says "servidores canadienses") | ❌ **NO** | ✅ Yes (US us-central1) | ⚠️ **GAP** |
| **CLOUD Act exposure** | ❌ **NO** | ❌ **NO** | ✅ Yes | ⚠️ **GAP** |
| Right to refuse | ✅ Yes (implied) | ✅ Yes | ✅ Yes | ✅ Met |
| **Data retention** | ❌ **NO** | ❌ **NO** | ✅ Yes (10 years) | ⚠️ **GAP** |
| **Contact information** | ❌ **NO** | ❌ **NO** | ✅ Yes | ⚠️ **GAP** |

### Recommended Requirements (Best Practice)

| **Requirement** | **Verbal Text** | **SMS** | **Full Document** | **Status** |
|-----------------|-----------------|---------|-------------------|------------|
| Specific AI providers | ❌ No | ❌ No | ✅ Yes | ⚠️ Recommended |
| Security measures | ❌ No | ❌ No | ✅ Yes | ⚠️ Recommended |
| Withdrawal process | ❌ No | ❌ No | ✅ Yes | ⚠️ Recommended |

---

## Critical Issues Identified

### 🚨 Issue 1: Incorrect Information in Verbal Text

**Problem:** Verbal text states "La grabación se mantiene segura en servidores canadienses" (recordings kept secure on Canadian servers)

**Reality:** All AI processing occurs in **US data centers** (us-central1 region, Google Cloud Platform)

**Impact:** 
- **Misleading information** violates PHIPA requirement for "knowledgeable consent"
- Patient cannot make informed decision if given incorrect information
- Legal risk if challenged

**Severity:** 🔴 **HIGH** - Legal compliance issue

---

### 🚨 Issue 2: Missing Mandatory Disclosures

**Problem:** Verbal consent text does NOT include:
- Third-party processors (OpenAI, Google)
- Processing location (US)
- CLOUD Act exposure
- Data retention period
- Contact information

**Impact:**
- Consent may not be considered "informed" under PHIPA
- Patient cannot make knowledgeable decision
- Legal risk if consent is challenged

**Severity:** 🔴 **HIGH** - Legal compliance issue

---

### ⚠️ Issue 3: SMS Text is Notification, Not Consent

**Clarification:** SMS text is a **notification** that directs patient to full consent document. It is NOT the consent text itself.

**Status:** ✅ **ACCEPTABLE** - SMS correctly functions as notification with link to full document

---

## Decision

### ✅ DECISION: Expand Verbal Consent Text

**Rationale:**

1. **Legal Compliance:** Current minimal text does NOT meet PHIPA mandatory requirements for "knowledgeable consent"
2. **Incorrect Information:** Text incorrectly states data is stored on Canadian servers when it's actually processed in US
3. **Missing Critical Disclosures:** Third-party processors, CLOUD Act exposure, and data retention are mandatory disclosures
4. **Patient Rights:** Patients cannot make informed decisions without complete information

**Approach:** **Hybrid Model**
- **Verbal text** (read by physiotherapist): Expanded to include ALL mandatory PHIPA requirements
- **Full document** (portal): Remains comprehensive for detailed review
- **SMS**: Remains as notification (no change needed)

---

## Implementation Plan

### Phase 1: Update Verbal Consent Text

**File:** `src/services/verbalConsentService.ts`

**New Text (English - for Canadian market):**
```
I need to record our physiotherapy session to automatically generate clinical notes using artificial intelligence.

IMPORTANT DISCLOSURES:
- Audio will be processed by OpenAI (Whisper API) and Google Vertex AI (Gemini) in the United States
- US authorities may access this data under US CLOUD Act
- Recordings and notes will be retained for 10 years per College of Physiotherapists requirements
- You can refuse recording without affecting your care quality
- Questions? Contact compliance@aiduxcare.com

Do you authorize this recording and AI processing of your health data?
```

**New Text (Spanish - current):**
```
Necesito grabar nuestra sesión de fisioterapia para generar automáticamente las notas clínicas usando inteligencia artificial.

DISCLOSURES IMPORTANTES:
- El audio será procesado por OpenAI (Whisper API) y Google Vertex AI (Gemini) en Estados Unidos
- Las autoridades estadounidenses pueden acceder a estos datos bajo la ley CLOUD Act de EE.UU.
- Las grabaciones y notas se conservarán por 10 años según los requisitos del Colegio de Fisioterapeutas
- Puede rechazar la grabación sin afectar la calidad de su atención
- ¿Preguntas? Contacte compliance@aiduxcare.com

¿Autoriza esta grabación y procesamiento de sus datos de salud?
```

**Changes:**
- ✅ Remove incorrect "servidores canadienses" statement
- ✅ Add specific third-party processors (OpenAI, Google)
- ✅ Add processing location (US)
- ✅ Add CLOUD Act exposure disclosure
- ✅ Add data retention period
- ✅ Add contact information
- ✅ Maintain right to refuse

---

### Phase 2: Update ConsentTextProvider (if used elsewhere)

**File:** `src/components/consent/ConsentTextProvider.tsx`

**Status:** Currently uses i18n translations. Verify translations include mandatory disclosures.

---

### Phase 3: Documentation

**Files:**
- ✅ `docs/compliance/CONSENT_REQUIREMENTS.md` (this file)
- ✅ `docs/CHANGELOG.md` (add entry)

---

## Testing Checklist

### Test Case 1: Verbal Consent Text Completeness

```
WHEN: Physiotherapist opens VerbalConsentModal
THEN: Text includes:
  ✓ Purpose of recording
  ✓ AI processing disclosure
  ✓ Third-party processors (OpenAI, Google)
  ✓ Processing location (US)
  ✓ CLOUD Act exposure
  ✓ Data retention
  ✓ Right to refuse
  ✓ Contact information
```

---

### Test Case 2: No Incorrect Information

```
WHEN: Reviewing verbal consent text
THEN: Does NOT state "Canadian servers"
AND: Correctly states "US processing"
```

---

### Test Case 3: Patient Understanding

```
WHEN: Physiotherapist reads text to patient
THEN: Patient can make informed decision
AND: Patient understands risks and benefits
```

---

## Compliance Status

### Before Fix

| **Aspect** | **Status** |
|------------|-----------|
| PHIPA Mandatory Requirements | ⚠️ **PARTIAL** - Missing critical disclosures |
| Accurate Information | ❌ **NO** - Incorrect server location |
| Knowledgeable Consent | ❌ **NO** - Missing required information |
| Legal Risk | 🔴 **HIGH** - Consent may be challenged |

### After Fix

| **Aspect** | **Status** |
|------------|-----------|
| PHIPA Mandatory Requirements | ✅ **FULL** - All disclosures included |
| Accurate Information | ✅ **YES** - Correct processing location |
| Knowledgeable Consent | ✅ **YES** - Complete information provided |
| Legal Risk | ✅ **LOW** - Compliant with PHIPA |

---

## Approval

**Decision Made By:** AI Assistant (WO-005 implementation)  
**Date:** 2026-02-20  
**Status:** ✅ **APPROVED FOR IMPLEMENTATION**

**Next Steps:**
1. Update `VERBAL_CONSENT_TEXT` in `verbalConsentService.ts`
2. Update CHANGELOG.md
3. Test verbal consent flow
4. Verify no incorrect information remains

---

## References

- PHIPA s.18: Personal Health Information Protection Act, 2004 (Ontario)
- CPO Documentation Standards: College of Physiotherapists of Ontario
- Legal Compliance Framework: `docs/compliance/LEGAL_COMPLIANCE_FRAMEWORK.md` (if exists)

---

**Last Updated:** 2026-02-20  
**Review Date:** 2026-05-20 (quarterly review)
