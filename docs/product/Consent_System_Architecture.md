# AiduxCare – Consent System Architecture

## 1. Principles

- Informed consent is mandatory
- Consent is jurisdiction-aware
- Consent is language-controlled
- Consent is audit-first and immutable

## 2. Consent Types

### 2.1 Digital Consent (Patient Portal)

Digital consent is obtained through a secure patient portal accessible via SMS link. The patient must:

- Read the complete consent statement
- Understand their rights under applicable privacy legislation
- Explicitly accept or decline consent
- Have their decision recorded with full audit trail

### 2.2 Verbal Consent (In-clinic)

Verbal consent is obtained in-clinic when the patient is physically present. The process requires:

- Physiotherapist reads the complete consent statement aloud
- Physiotherapist confirms they have read the statement to the patient
- Patient provides explicit verbal response (grant or decline)
- If declined, documented reasons are required for compliance
- Full witness statement and audit trail recorded

## 3. Canonical Rule (NON-NEGOTIABLE)

> Without valid consent, NO clinical UI is rendered.

This rule is enforced at the application gate level. All clinical functionality, including assessment forms, AI transcription, SOAP generation, and data persistence, is blocked until valid consent is obtained and verified.

## 4. System Gates

### UI Gate

Blocks rendering of all clinical interface components until consent is verified. The gate checks for:

- Valid consent record in the system
- Consent status is 'granted'
- Consent has not expired
- Consent matches the current patient session

### Audio / Transcription Gate

Prevents audio recording and transcription services from being activated without valid consent. This protects patient privacy and ensures compliance with recording consent requirements.

### AI / SOAP Gate

Blocks AI-powered SOAP note generation until consent is verified. This ensures that patient data is not processed by AI systems without explicit authorization.

### Persistence Gate

Prevents saving of clinical data to the database until consent is confirmed. This ensures no patient health information is stored without proper authorization.

## 5. Jurisdiction & Language Policy

### CA-ON (Ontario, Canada)

- Language: English (en-CA) only (strict enforcement)
- Compliance: PHIPA s.18 (knowledgeable consent)
- Additional: PIPEDA Principle 4.3 (meaningful consent)

### ES / CL (Spain / Chile)

- Language: English (en-CA or en-US) accepted
- Compliance: GDPR principles (where applicable)
- Additional: Local privacy regulations as required

### Centralized Validation

All consent validation is performed through a single source of truth. Language and jurisdiction rules are enforced at the template and validation layer, ensuring consistency across all consent flows.

## 6. Audit Trail & Compliance

### What is Stored

Every consent record includes:

- Patient identifier
- Professional identifier
- Consent method (digital or verbal)
- Consent status (granted or declined)
- Timestamp of consent decision
- Consent text version used
- Witness statement (for verbal consent)
- Decline reasons (if applicable)
- Decline notes (if applicable)
- Jurisdiction and language context

### What Cannot be Deleted

Consent records are immutable and cannot be deleted. This ensures:

- Complete audit trail for regulatory compliance
- Historical record of all consent decisions
- Protection against tampering or retroactive changes
- Compliance with PHIPA, PIPEDA, and ISO 27001 requirements

### Why This Meets PHIPA / PIPEDA / GDPR Principles

**PHIPA s.18 (Knowledgeable Consent):**
- Full consent text is presented and read to the patient
- Patient has opportunity to ask questions
- Consent decision is explicit and recorded
- Patient can withdraw consent (recorded as new consent event)

**PIPEDA Principle 4.3 (Meaningful Consent):**
- Consent is informed (full text provided)
- Consent is explicit (accept/decline action required)
- Consent is documented (complete audit trail)
- Consent is revocable (withdrawal process available)

**ISO 27001 A.18.1.4 (Privacy and Protection of PII):**
- PII is only processed with valid consent
- Consent records are protected and immutable
- Access to consent records is logged and auditable

**ISO 27001 A.12.4.1 (Event Logging):**
- All consent events are logged with timestamps
- Consent decisions are traceable to specific users
- Audit trail cannot be modified or deleted
- Compliance reporting is supported by complete records
