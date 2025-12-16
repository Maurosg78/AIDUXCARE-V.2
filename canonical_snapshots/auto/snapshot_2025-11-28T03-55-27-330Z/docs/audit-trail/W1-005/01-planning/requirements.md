# W1-005: AI Data Deidentification - Planning Requirements

## 📋 Deliverable Overview

**Objective**: Implement data deidentification service to remove personal identifiers before sending data to Vertex AI, ensuring PHIPA compliance.

**Priority**: P1 - Critical for data sovereignty and PHIPA compliance

**Timeline**: 2-3 days

**Dependencies**: None (independent of Firestore migration)

---

## 🎯 Compliance Requirements

### PHIPA Compliance
- **Section 18**: Prevent cross-border disclosure of identifiable health information
- **Section 4(1)**: Limit collection, use, and disclosure to necessary purposes
- **Principle 4.1**: Accountability for data handling

### ISO 27001 Controls
- **A.8.2.1**: Classification of information (identifiable vs de-identified)
- **A.8.2.3**: Handling of assets (de-identification before external processing)
- **A.12.4.1**: Management of technical vulnerabilities (prevent data leakage)

---

## 📊 Technical Requirements

### Functional Requirements
1. **Deidentification Service**
   - Remove/mask personal identifiers (names, phone numbers, postal codes, health cards, dates, emails, addresses, SIN, medical record numbers)
   - Generate placeholder mappings for re-identification
   - Validate deidentification success

2. **Integration Points**
   - `vertex-ai-service-firebase.ts`: All AI processing endpoints
   - `vertex-ai-soap-service.ts`: SOAP note generation
   - Audit logging for all deidentification events

3. **Re-identification**
   - Restore original identifiers after AI processing
   - Maintain data integrity (no loss of clinical information)

### Non-Functional Requirements
- **Performance**: Minimal latency impact (<100ms overhead)
- **Reliability**: Fail-safe (if deidentification fails, block AI call)
- **Auditability**: Complete audit trail of all deidentification events
- **Security**: High security level for audit logs

---

## 🔒 Security Requirements

1. **Data Protection**
   - Identifiers must be removed before any external API call
   - Placeholder mappings stored securely (not logged in plain text)
   - Re-identification only occurs after successful AI response

2. **Audit Requirements**
   - Log all deidentification events with:
     - Action type (deidentify/reidentify/validate)
     - Text length processed
     - Number of identifiers removed
     - Trace ID for correlation
     - Timestamp
     - Security level: HIGH

3. **Error Handling**
   - If deidentification fails, block AI call
   - Log errors for investigation
   - Don't expose sensitive data in error messages

---

## 📝 Acceptance Criteria

### Definition of Done
- [ ] `DataDeidentificationService.ts` created with all required methods
- [ ] Deidentification integrated into all Vertex AI service methods
- [ ] Re-identification integrated into all Vertex AI response handlers
- [ ] Audit logging functional for all deidentification events
- [ ] Tests pass with sample data containing identifiers
- [ ] No identifiers remain in deidentified text (validation passes)
- [ ] SOAP notes generated correctly after re-identification
- [ ] Performance impact <100ms overhead
- [ ] ISO 27001 audit trail documentation complete

### Evidence Required
- Service implementation with test cases
- Integration code in Vertex AI services
- Audit log entries showing deidentification events
- Test results showing identifier removal
- Performance metrics (before/after)

---

## 🚨 Risk Assessment

### Identified Risks
1. **Data Loss**: Re-identification might fail, losing clinical context
   - **Mitigation**: Comprehensive testing, fail-safe error handling
   
2. **Performance Impact**: Deidentification adds processing overhead
   - **Mitigation**: Optimize regex patterns, measure and document impact
   
3. **False Positives**: Legitimate clinical terms might be flagged as identifiers
   - **Mitigation**: Refine patterns, validate with clinical experts

4. **Audit Logging Failure**: If audit logging fails, main flow should continue
   - **Mitigation**: Fail silently for audit logging, don't break main flow

---

## 📅 Timeline

- **Day 1**: Create `DataDeidentificationService.ts`, implement core methods
- **Day 2**: Integrate into Vertex AI services, add audit logging
- **Day 3**: Testing, validation, documentation, CTO review

---

## ✅ CTO Approval

**Status**: ✅ Approved for immediate implementation

**Rationale**: Critical for PHIPA compliance and data sovereignty. No dependencies on other deliverables.

**Authorization**: Proceed with implementation following ISO 27001 audit framework.
