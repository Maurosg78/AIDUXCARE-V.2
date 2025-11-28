# Physical Test Customization & Canonical Language Proposal

**Market:** CA | **Language:** en-CA | **Status:** Proposal for CTO Review  
**Date:** 2025-01-XX | **Author:** Implementation Team

---

## Executive Summary

This document proposes a solution to two critical issues in the Physical Evaluation workflow:

1. **Canonical Language Compliance**: Eliminate Spanish text from the UI to ensure en-CA canonical compliance
2. **Test-Specific Field Adaptation**: Enable custom tests (and AI-suggested tests not in the library) to have field-specific forms instead of generic textareas

---

## Problem Statement

### Issue 1: Spanish Text in UI (Non-Compliant)

**Current State:**
- UI displays Spanish labels: "Estado: Normal", "Resultado anormal"
- Placeholder text in Spanish: "Clinical notes, pain provocation..."
- Violates canonical en-CA requirement for Aidux North

**Impact:**
- Non-compliance with Canadian market standards
- Inconsistent user experience
- Regulatory/audit risk

### Issue 2: Generic Forms for Custom Tests

**Current State:**
- Tests from library (e.g., SLR, Lachman) have **specific fields** (angles, yes/no checkboxes, etc.)
- Custom tests (e.g., "Lumbar Range of Motion Assessment", "Palpation of Lumbar Spine") use **generic textarea**
- AI-suggested tests not matched to library also use generic form

**Impact:**
- Inconsistent documentation quality
- Missing structured data for custom tests
- Reduced clinical value and SOAP note quality

---

## Proposed Solution

### Phase 1: Immediate Fix (Canonical Language)

**Action Items:**
1. Replace all Spanish UI labels with English (en-CA)
   - "Estado" → "Status"
   - "Resultado anormal" → "Abnormal result"
   - Review all placeholders and ensure en-CA

2. Create UI text constants file:
   ```typescript
   // src/core/ui-texts/physical-evaluation.en-CA.ts
   export const PHYSICAL_EVAL_UI = {
     status: "Status",
     abnormalResult: "Abnormal result",
     additionalNotes: "Additional clinical notes (optional)",
     clinicalNotes: "Clinical notes, pain provocation, mobility restrictions...",
     // ... all UI strings
   };
   ```

**Timeline:** Immediate (1-2 hours)

---

### Phase 2: Test Template System (Custom Test Adaptation)

**Concept:**
Allow custom tests to optionally use **test templates** that define field structures, similar to library tests.

#### Option A: Pre-defined Test Templates (Recommended)

**Approach:**
1. Create a **Test Template Library** with common test patterns:
   ```typescript
   export const TEST_TEMPLATES = {
     'range-of-motion': {
       fields: [
         { id: 'flexion', kind: 'angle_bilateral', label: 'Flexion', ... },
         { id: 'extension', kind: 'angle_bilateral', label: 'Extension', ... },
         // ...
       ]
     },
     'palpation': {
       fields: [
         { id: 'tenderness', kind: 'yes_no', label: 'Tenderness present?', ... },
         { id: 'location', kind: 'text', label: 'Location', ... },
         // ...
       ]
     },
     'strength-testing': {
       fields: [
         { id: 'grade', kind: 'score_0_10', label: 'Strength grade (0-10)', ... },
         { id: 'comparison', kind: 'text', label: 'Comparison to contralateral', ... },
         // ...
       ]
     },
   };
   ```

2. When creating a custom test, physiotherapist selects a template:
   - "Lumbar Range of Motion Assessment" → uses `range-of-motion` template
   - "Palpation of Lumbar Spine" → uses `palpation` template
   - "Muscle Strength Testing" → uses `strength-testing` template

3. If no template matches, falls back to generic form (current behavior)

**Benefits:**
- ✅ Structured data for common test types
- ✅ Consistent with library test UX
- ✅ No breaking changes
- ✅ Easy to extend with new templates

**Implementation:**
- Add template selector in custom test form
- Store `templateId` in `EvaluationTestEntry`
- Render fields based on template when `templateId` exists

#### Option B: Dynamic Field Builder (Advanced)

**Approach:**
Allow physiotherapist to define custom fields when creating a test.

**Pros:**
- Maximum flexibility
- No pre-defined templates needed

**Cons:**
- Complex UI/UX
- Risk of inconsistent field definitions
- Higher implementation cost

**Recommendation:** Start with Option A, consider Option B for v2.

---

## Technical Implementation Plan

### Step 1: Canonical Language Fix

**Files to modify:**
- `src/pages/ProfessionalWorkflowPage.tsx` (lines 1262, 1275, 1308, 1321)
- Create `src/core/ui-texts/physical-evaluation.en-CA.ts`

**Changes:**
```typescript
// Before
<span>Estado: {RESULT_LABELS[entry.result]}</span>
<label>Resultado anormal</label>

// After
<span>Status: {RESULT_LABELS[entry.result]}</span>
<label>Abnormal result</label>
```

### Step 2: Test Template System

**New files:**
- `src/core/msk-tests/templates/testTemplates.ts` (template definitions)
- `src/core/msk-tests/templates/types.ts` (template types)

**Modified files:**
- `src/pages/ProfessionalWorkflowPage.tsx` (template selector in custom form)
- `src/core/msk-tests/library/mskTestLibrary.ts` (export template helpers)

**Data structure:**
```typescript
type EvaluationTestEntry = {
  // ... existing fields
  templateId?: string; // NEW: reference to test template
  values?: Record<string, number | string | boolean | null>;
};
```

---

## Example: Custom Test with Template

**Before (Generic):**
```
Test: "Lumbar Range of Motion Assessment"
- Generic textarea: "Clinical notes..."
```

**After (Template-Based):**
```
Test: "Lumbar Range of Motion Assessment"
Template: "Range of Motion"
Fields:
- Flexion: [angle input] °
- Extension: [angle input] °
- Lateral Flexion Right: [angle input] °
- Lateral Flexion Left: [angle input] °
- Rotation Right: [angle input] °
- Rotation Left: [angle input] °
- Pain during movement: [checkbox]
- Additional notes: [textarea]
```

---

## Migration Strategy

1. **Phase 1 (Week 1):** Canonical language fix
   - All UI text → en-CA
   - No breaking changes

2. **Phase 2 (Week 2-3):** Template system
   - Add template library (5-10 common templates)
   - Update custom test form
   - Existing custom tests remain generic (backward compatible)

3. **Phase 3 (Week 4):** Enhancement
   - AI suggestions can propose templates
   - Template matching for common test names

---

## Success Metrics

- ✅ 100% en-CA UI text
- ✅ 80%+ of custom tests use templates (within 3 months)
- ✅ Structured data capture for custom tests
- ✅ Improved SOAP note quality

---

## Open Questions for CTO

1. **Template Library Scope:** How many templates should we start with? (Proposed: 5-10)
2. **Template Naming:** Should templates be visible to physiotherapists or auto-selected?
3. **AI Integration:** Should Vertex AI suggest templates when proposing custom tests?
4. **Backward Compatibility:** Keep generic form as fallback? (Recommended: Yes)

---

## Recommendation

**Immediate Action:**
1. Fix canonical language (Phase 1) - **This week**
2. Implement basic template system (Phase 2) - **Next sprint**
3. Monitor adoption and iterate

**Long-term Vision:**
- Template library grows organically based on usage
- AI learns to suggest appropriate templates
- Eventually, most tests (library + custom) have structured fields

---

**Next Steps:**
1. CTO review and approval
2. Create detailed technical spec for template system
3. Assign implementation tasks
4. Begin Phase 1 (canonical language fix)

