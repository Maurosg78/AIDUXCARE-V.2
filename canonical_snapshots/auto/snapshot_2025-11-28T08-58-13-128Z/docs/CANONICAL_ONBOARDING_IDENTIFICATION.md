# 🎯 CANONICAL ONBOARDING IDENTIFICATION

**CRITICAL:** This document identifies the ONE canonical onboarding page to prevent confusion.

---

## ✅ CANONICAL ONBOARDING PAGE

### **File Path:**
```
src/pages/OnboardingPage.tsx
```

### **Router Configuration:**
```typescript
// src/router/router.tsx
const OnboardingPage = lazy(() => 
  import("@/pages/OnboardingPage").then(m => ({ default: m.default }))
);

{
  path: "/onboarding",
  element: (
    <Suspense fallback={<LoadingFallback />}>
      <OnboardingPage />
    </Suspense>
  )
}
```

### **Key Characteristics:**

1. **Component Name:** `OnboardingPage` (default export)
2. **Structure:** 3-step wizard (Personal → Professional → Location)
3. **Components Used:**
   - `PersonalDataStep` from `src/components/wizard/PersonalDataStep.tsx`
   - `ProfessionalDataStep` from `src/components/wizard/ProfessionalDataStep.tsx`
   - `LocationDataStep` from `src/components/wizard/LocationDataStep.tsx`
4. **Language:** English
5. **Compliance:** PHIPA/PIPEDA compliant
6. **Brand Name:** "AiduxCare" (not "AiDuxCare")

---

## ❌ NON-CANONICAL (DEPRECATED) FILES

### **DO NOT USE:**

1. **`src/pages/ProfessionalOnboardingPage.tsx`**
   - ❌ Old Spanish version
   - ❌ Deprecated structure
   - ❌ Not PHIPA/PIPEDA compliant

2. **Any file in `src/_deprecated/features_onboarding/`**
   - ❌ All deprecated
   - ❌ Do not reference

---

## 🔍 HOW TO VERIFY CANONICAL ONBOARDING

### **Check Router:**
```typescript
// Should import from "@/pages/OnboardingPage"
// Should use default export
// Route should be "/onboarding"
```

### **Check Component:**
```typescript
// Should export default function OnboardingPage()
// Should use wizard.module.css styles
// Should have 3 steps: personal, professional, location
```

### **Check Wizard Components:**
```typescript
// Should import from:
// - src/components/wizard/PersonalDataStep.tsx
// - src/components/wizard/ProfessionalDataStep.tsx
// - src/components/wizard/LocationDataStep.tsx
```

---

## 📋 CANONICAL SNAPSHOT REFERENCE

**Snapshot Location:**
```
canonical_snapshots/2025-11-16T18-51-21-979Z/src/pages/OnboardingPage.tsx
```

**Manifest Entry:**
```json
{
  "files": [
    "src/pages/OnboardingPage.tsx",
    "src/components/wizard/PersonalDataStep.tsx",
    "src/components/wizard/ProfessionalDataStep.tsx",
    "src/components/wizard/LocationDataStep.tsx"
  ]
}
```

---

## ✅ VERIFICATION CHECKLIST

When working with onboarding, verify:

- [ ] Router imports from `@/pages/OnboardingPage`
- [ ] Uses default export `OnboardingPage`
- [ ] Route is `/onboarding`
- [ ] Uses wizard components from `src/components/wizard/`
- [ ] Brand name is "AiduxCare" (not "AiDuxCare")
- [ ] Language is English
- [ ] PHIPA/PIPEDA compliant

---

## 🚨 CRITICAL REMINDER

**NEVER use `ProfessionalOnboardingPage.tsx` - it is deprecated.**

**ALWAYS use `OnboardingPage.tsx` - it is the canonical version.**

---

**Last Updated:** January 19, 2025  
**Status:** ✅ **CANONICAL IDENTIFIED AND DOCUMENTED**

