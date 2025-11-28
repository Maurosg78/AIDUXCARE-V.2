# Canonical Consent Workflow — Patient Consent (PHIPA s.18)

**Baseline:** 2025-01-19  
**Spec HEAD:** Current  
**Scope:** Single source of truth for patient consent workflow for cross-border AI processing.

---

## Overview

Patient consent workflow is Stage 0 of the canonical pipeline. It must be completed before any AI processing can occur. This workflow ensures PHIPA s.18 compliance for cross-border data processing.

---

## Canonical Files (Single Source of Truth)

### Core Components
- **`src/pages/PatientConsentPortalPage.tsx`** — Main consent portal page (CANONICAL)
- **`src/components/consent/LegalConsentDocument.tsx`** — Legal document display component (CANONICAL)
- **`src/components/consent/ConsentActionButtons.tsx`** — Consent action buttons (sticky footer) (CANONICAL)
- **`src/content/legalConsentContent.ts`** — Legal content in English, plain text format (CANONICAL)

### Services
- **`src/services/patientConsentService.ts`** — Consent token generation, recording, and status checking (CANONICAL)
- **`src/services/smsService.ts`** — SMS delivery for consent links (CANONICAL)
- **`src/services/consentVerificationService.ts`** — Consent verification workflow (CANONICAL)

### Integration Points
- **`src/pages/ProfessionalWorkflowPage.tsx`** — Workflow integration (consent status display, manual authorization) (CANONICAL)
- **`src/pages/ConsentVerificationPage.tsx`** — Consent verification page (CANONICAL)

---

## Workflow Stages

### Stage 0.1: Consent Token Generation
- **Trigger:** First session with patient
- **Service:** `PatientConsentService.generateConsentToken()`
- **Output:** Unique consent token stored in Firestore
- **Integration:** `ProfessionalWorkflowPage` detects first session

### Stage 0.2: SMS Delivery
- **Trigger:** Token generated
- **Service:** `SMSService.sendConsentLink()`
- **Output:** SMS sent to patient with consent link
- **Link Format:** `/consent/:token`

### Stage 0.3: Consent Portal Display
- **Route:** `/consent/:token`
- **Component:** `PatientConsentPortalPage`
- **Content:** `LegalConsentDocument` (plain text, English)
- **Actions:** `ConsentActionButtons` (always visible, sticky footer)
- **Options:**
  - Ongoing consent (requires digital signature)
  - Session-only consent (no signature required)
  - Decline (no AiduxCare access)

### Stage 0.4: Consent Recording
- **Service:** `PatientConsentService.recordConsent()`
- **Manual Authorization:** `PatientConsentService.markConsentAsAuthorized()` (physiotherapist can authorize)
- **Output:** Consent record in Firestore with scope, timestamp, signature (if applicable)

### Stage 0.5: Workflow Access Control
- **Check:** `PatientConsentService.hasConsent()` before AI processing
- **Status:** `PatientConsentService.getConsentStatus()` for display
- **Integration:** `ProfessionalWorkflowPage` blocks AI processing if no consent

---

## Data Structures

### ConsentToken (Firestore: `patient_consent_tokens`)
```typescript
{
  token: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  clinicName: string;
  physiotherapistId: string;
  physiotherapistName: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  used: boolean;
  consentGiven?: {
    scope: 'ongoing' | 'session-only' | 'declined';
    timestamp: Timestamp;
    digitalSignature?: string;
  };
}
```

### ConsentRecord (Firestore: `patient_consents`)
```typescript
{
  patientId: string;
  consentScope: 'ongoing' | 'session-only' | 'declined';
  consented: boolean;
  consentDate: Timestamp;
  consentVersion: string;
  tokenUsed: string;
  digitalSignature?: string;
  authorizedByPhysiotherapist?: boolean;
}
```

---

## User Flows

### Flow 1: Patient Self-Service (SMS)
```
SMS → Link → PatientConsentPortalPage → 
Legal Document (plain text) → 
ConsentActionButtons → 
Select option → 
Submit → 
ConsentRecord created → 
Workflow access granted
```

### Flow 2: In-Clinic Authorization
```
ProfessionalWorkflowPage → 
Open consent link → 
Patient reads document → 
Physiotherapist clicks "Mark as authorized" → 
markConsentAsAuthorized() → 
ConsentRecord created → 
Workflow access granted
```

### Flow 3: Decline
```
PatientConsentPortalPage → 
Select "Decline" → 
ConsentRecord created (declined) → 
No AiduxCare access → 
Use traditional EMR
```

---

## Integration with Main Workflow

### ProfessionalWorkflowPage Integration Points

1. **Consent Status Display**
   - Shows current consent status (ongoing, session-only, declined, pending)
   - Located in patient info card

2. **Consent Link Actions**
   - "Open consent link" — Opens consent portal in new window
   - "Mark as authorized" — Manual authorization by physiotherapist
   - Visible when consent is pending

3. **AI Processing Gate**
   - `hasConsent()` check before AI processing
   - Blocks SOAP generation if no consent
   - Shows notification if consent pending

---

## Compliance Requirements

### PHIPA s.18 Requirements
- ✅ Express consent required (not implied)
- ✅ Cross-border disclosure clearly explained
- ✅ CLOUD Act exposure disclosed
- ✅ Patient rights explained
- ✅ Withdrawal procedures provided
- ✅ Complaint process documented

### CPO Requirements
- ✅ Professional accountability maintained
- ✅ Clinical decision authority remains with PT
- ✅ Documentation standards compliance
- ✅ Record retention (10+ years)

---

## Key Features

### Legal Document
- **Language:** English (Canadian market)
- **Format:** Plain text (no formatting, no emphasis)
- **Content:** Complete PHIPA-compliant disclosure
- **Display:** Scrollable area, max-height 60vh

### Action Buttons
- **Position:** Sticky footer (always visible)
- **Options:** Three radio buttons (Ongoing, Session-only, Decline)
- **Signature:** Required for ongoing consent
- **Submit:** Enabled based on selection

### Manual Authorization
- **Access:** From ProfessionalWorkflowPage
- **Method:** `markConsentAsAuthorized()`
- **Verification:** Physiotherapist ID must match token
- **Audit:** Marked as "manual-authorization" in record

---

## Archive Policy

- **Canonical files:** Keep as-is, no duplicates
- **Variants:** Move to `docs/_archive/consent/` with deprecation notice
- **Backups:** Move to `backups/consent/` with timestamp

---

## Definition of Done

- ✅ All canonical files documented
- ✅ Workflow integrated with ProfessionalWorkflowPage
- ✅ PHIPA compliance verified
- ✅ Manual authorization functional
- ✅ Audit trail complete
- ✅ No duplicate consent components

---

**Status:** Canonical — Single Source of Truth  
**Last Updated:** 2025-01-19  
**Maintainer:** Development Team

