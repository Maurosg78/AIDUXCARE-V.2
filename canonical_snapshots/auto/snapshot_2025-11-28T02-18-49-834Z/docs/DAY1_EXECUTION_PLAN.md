# 📋 DAY 1 EXECUTION PLAN: SMS CRITICAL PATH

**Date:** 2025-01-19  
**Priority:** 🔴 **P0 - BUSINESS CRITICAL**  
**Status:** 🚀 **READY TO EXECUTE**  
**Assigned:** Senior Developer  
**Estimated Time:** 8 hours

---

## 🎯 OBJECTIVES

1. **Translate all SMS messages to English (en-CA)**
2. **Fix URL construction for production**
3. **Validate mobile compatibility**
4. **Test end-to-end SMS → Consent workflow**

---

## 📝 TASK BREAKDOWN

### **Task 1: Create English SMS Templates** (2 hours)

**File to Create:** `src/content/smsTemplates.ts`

```typescript
/**
 * SMS Templates - English (en-CA) for Canadian Market
 * PHIPA s.18 Compliant Consent Messages
 */

export const SMS_TEMPLATES = {
  consent: {
    en_CA: (
      patientName: string,
      physioName: string,
      consentUrl: string,
      privacyUrl: string
    ): string => {
      return `Hello ${patientName}, ${physioName} requires your consent for health data processing according to Canadian law (PHIPA s.18).

Authorize: ${consentUrl}

Privacy Policy: ${privacyUrl}

Reply STOP to opt out.`;
    }
  },
  
  activation: {
    en_CA: (
      professionalName: string,
      activationUrl: string,
      privacyUrl: string,
      dataUsageUrl: string
    ): string => {
      return `Hello ${professionalName}, activate your AiDuxCare account:

${activationUrl}

Privacy: ${privacyUrl}
Data Usage: ${dataUsageUrl}

Link valid for 24 hours.`;
    }
  }
};

// Validation helper
export function validateSMSTemplate(template: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check for Spanish characters
  if (/[áéíóúñü]/i.test(template)) {
    errors.push('Contains Spanish characters');
  }
  
  // Check for Spanish words
  const spanishWords = ['Hola', 'consentimiento', 'datos', 'salud', 'según', 'ley', 'válido'];
  spanishWords.forEach(word => {
    if (template.includes(word)) {
      errors.push(`Contains Spanish word: ${word}`);
    }
  });
  
  // Check for required English content
  if (!template.includes('Hello') && !template.includes('Hi')) {
    errors.push('Missing English greeting');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

**Acceptance Criteria:**
- [ ] File created with English templates
- [ ] No Spanish characters or words
- [ ] PHIPA s.18 mentioned
- [ ] Professional tone
- [ ] Validation helper included

---

### **Task 2: Update SMS Service** (2 hours)

**File to Update:** `src/services/smsService.ts`

**Changes Required:**

1. **Import templates:**
```typescript
import { SMS_TEMPLATES, validateSMSTemplate } from '../content/smsTemplates';
```

2. **Update `sendConsentLink` method:**
```typescript
static async sendConsentLink(
  phone: string,
  patientName: string,
  physiotherapistName: string,
  clinicName: string,
  consentToken: string
): Promise<void> {
  try {
    // Get production URL
    const publicBaseUrl = getPublicBaseUrl();
    const consentUrl = `${publicBaseUrl}/consent/${consentToken}`;
    const privacyUrl = `${publicBaseUrl}/privacy-policy`;

    // Use English template
    const message = SMS_TEMPLATES.consent.en_CA(
      patientName,
      physiotherapistName,
      consentUrl,
      privacyUrl
    );

    // Validate template
    const validation = validateSMSTemplate(message);
    if (!validation.isValid) {
      throw new Error(`SMS template validation failed: ${validation.errors.join(', ')}`);
    }

    // Send SMS (existing logic)
    // ... rest of implementation
  } catch (error) {
    console.error('❌ [SMS Consent] Error:', error);
    throw error;
  }
}
```

3. **Update `sendActivationLink` method:**
```typescript
static async sendActivationLink(
  phone: string,
  professionalName: string,
  activationToken: string
): Promise<void> {
  try {
    const publicBaseUrl = getPublicBaseUrl();
    const activationUrl = `${publicBaseUrl}/activate?token=${activationToken}`;
    const privacyUrl = `${publicBaseUrl}/privacy-policy`;
    const dataUsageUrl = `${publicBaseUrl}/privacy-policy#data-usage`;

    // Use English template
    const message = SMS_TEMPLATES.activation.en_CA(
      professionalName,
      activationUrl,
      privacyUrl,
      dataUsageUrl
    );

    // Validate template
    const validation = validateSMSTemplate(message);
    if (!validation.isValid) {
      throw new Error(`SMS template validation failed: ${validation.errors.join(', ')}`);
    }

    // Send SMS (existing logic)
    // ... rest of implementation
  } catch (error) {
    console.error('❌ [SMS Activation] Error:', error);
    throw error;
  }
}
```

**Acceptance Criteria:**
- [ ] Templates imported and used
- [ ] Validation added
- [ ] No Spanish strings remaining
- [ ] Error handling improved

---

### **Task 3: Create URL Helper Function** (1 hour)

**File to Create:** `src/utils/urlHelpers.ts`

```typescript
/**
 * URL Helper Functions
 * Ensures production URLs are used, never localhost
 */

export function getPublicBaseUrl(): string {
  // Priority 1: Explicit production URL
  if (import.meta.env.VITE_PUBLIC_BASE_URL) {
    const url = import.meta.env.VITE_PUBLIC_BASE_URL;
    validateProductionUrl(url);
    return url;
  }
  
  // Priority 2: Production environment detection
  if (import.meta.env.PROD) {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
    
    // Production project
    if (projectId.includes('prod') || projectId.includes('production')) {
      return 'https://aiduxcare.web.app';
    }
    
    // UAT/Staging
    return 'https://aiduxcare-mvp-uat.web.app';
  }
  
  // Development: Require explicit URL for SMS testing
  if (import.meta.env.DEV) {
    const devUrl = import.meta.env.VITE_DEV_PUBLIC_URL;
    if (devUrl) {
      validateDevelopmentUrl(devUrl);
      return devUrl;
    }
    throw new Error(
      'VITE_DEV_PUBLIC_URL required for development SMS testing. ' +
      'Use ngrok or similar service to expose localhost.'
    );
  }
  
  throw new Error('Unable to determine public base URL');
}

function validateProductionUrl(url: string): void {
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    throw new Error('Production URL cannot be localhost');
  }
  
  if (!url.startsWith('https://')) {
    throw new Error('Production URL must use HTTPS');
  }
}

function validateDevelopmentUrl(url: string): void {
  // Development URLs can be http or https
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('Development URL must start with http:// or https://');
  }
  
  // Warn if using localhost (won't work on mobile)
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    console.warn('⚠️ Localhost URL will not work on mobile devices. Use ngrok or similar.');
  }
}
```

**Update SMS Service:**
```typescript
import { getPublicBaseUrl } from '../utils/urlHelpers';
```

**Acceptance Criteria:**
- [ ] Helper function created
- [ ] Production URL validation
- [ ] Development URL handling
- [ ] Error messages clear
- [ ] Imported in SMS service

---

### **Task 4: Environment Configuration** (30 minutes)

**Files to Update:**
- `.env.example` (create if doesn't exist)
- `.env.local` (update)

**`.env.example` additions:**
```bash
# Public Base URL for SMS Links
# Production: https://aiduxcare.web.app
# UAT: https://aiduxcare-mvp-uat.web.app
# Development: Use ngrok URL (e.g., https://abc123.ngrok.io)
VITE_PUBLIC_BASE_URL=https://aiduxcare-mvp-uat.web.app

# Development Public URL (for SMS testing)
# Required when running locally - use ngrok or similar
VITE_DEV_PUBLIC_URL=
```

**Acceptance Criteria:**
- [ ] `.env.example` updated
- [ ] Production URL configured
- [ ] Development URL documented
- [ ] Instructions clear

---

### **Task 5: Unit Tests** (1.5 hours)

**File to Update:** `src/services/__tests__/smsService.production.test.ts`

**Tests to Write:**
- [ ] English-only validation
- [ ] URL construction tests
- [ ] Mobile compatibility tests
- [ ] Template validation tests

**Run Tests:**
```bash
npm run test src/services/__tests__/smsService.production.test.ts
```

**Acceptance Criteria:**
- [ ] All tests passing
- [ ] Coverage >80%
- [ ] Edge cases covered

---

### **Task 6: Manual Testing** (1 hour)

**Test Scenarios:**

1. **Development Testing:**
   - [ ] Set up ngrok: `ngrok http 5174`
   - [ ] Configure `VITE_DEV_PUBLIC_URL` with ngrok URL
   - [ ] Send test SMS
   - [ ] Verify SMS received in English
   - [ ] Click link on mobile device
   - [ ] Verify consent portal loads

2. **Production Testing:**
   - [ ] Deploy to UAT environment
   - [ ] Configure `VITE_PUBLIC_BASE_URL`
   - [ ] Send test SMS
   - [ ] Verify SMS received in English
   - [ ] Click link on mobile device
   - [ ] Verify consent portal loads
   - [ ] Complete consent workflow

**Acceptance Criteria:**
- [ ] SMS sent successfully
- [ ] SMS in English only
- [ ] Link works on mobile
- [ ] Consent portal accessible
- [ ] End-to-end workflow functional

---

## ✅ DAY 1 COMPLETION CHECKLIST

### Code Changes
- [ ] `src/content/smsTemplates.ts` created
- [ ] `src/services/smsService.ts` updated
- [ ] `src/utils/urlHelpers.ts` created
- [ ] `.env.example` updated
- [ ] All Spanish strings removed

### Testing
- [ ] Unit tests written and passing
- [ ] Development testing completed
- [ ] Mobile testing completed
- [ ] End-to-end workflow tested

### Documentation
- [ ] Code comments added
- [ ] Environment variables documented
- [ ] Testing instructions documented

### Validation
- [ ] No Spanish in SMS messages
- [ ] No localhost URLs in production
- [ ] Mobile links working
- [ ] End-to-end workflow functional

---

## 🚨 BLOCKERS & ISSUES

_To be updated during execution_

---

## 📊 PROGRESS TRACKING

**Start Time:** _TBD_  
**End Time:** _TBD_  
**Actual Duration:** _TBD_  
**Status:** 🔴 Not Started

---

## 📝 NOTES

_To be updated during execution_

---

**Next Steps:** Complete Day 1 → Update Execution Tracker → Begin Day 2

