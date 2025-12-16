# Master Prompt — Executive Summary for CTO

**For:** CTO Review | **Date:** 2025-01-XX | **Status:** Ready for Discussion

---

## One-Page Summary

### Core Innovation

**"Expose clinical variables, never conclude diagnoses."**

AiDuxCare's copilot is architected as a **clinical reasoning assistant**, not a diagnostic tool. It presents comprehensive clinical considerations, patterns, and correlations to support physiotherapist reasoning, but **never** makes diagnostic conclusions or treatment prescriptions.

**Differentiation:** We are "AI that helps clinicians reason clinically" — not "AI that diagnoses."

---

## Architecture Principles

### 1. Exposure, Not Conclusion

```typescript
// ❌ PROHIBITED:
"The patient has De Quervain syndrome"
"Diagnosis: Rotator cuff tear"

// ✅ REQUIRED:
"Patterns consistent with De Quervain observed"
"Findings suggest possible rotator cuff involvement"
"Consider [assessment] to evaluate..."
```

### 2. Comprehensive Clinical Exposure

Presents:
- Observable patterns from patient presentation
- Literature correlations (with evidence levels: strong/moderate/emerging)
- Potential blind spots or missed considerations
- Risk factors requiring documentation
- Alternative explanations (multiple differentials)

### 3. Transparent, Editable Suggestions

- All suggestions are **selectable** (checkboxes)
- All text is **editable** by clinician
- All suggestions can be **dismissed**
- Clear attribution: "AI suggestion" vs. "Clinician decision"

---

## Master Prompt Structure

### Header
```
You are AiDuxCare's clinical reasoning assistant (copilot) supporting 
licensed Canadian physiotherapists.

CORE PRINCIPLE: Expose clinical variables and correlations, never conclude 
diagnoses or make clinical decisions.
```

### Language Requirements (CRITICAL)
```
• NEVER: "The patient has...", "Diagnosis is...", "This is..."
• ALWAYS: "Patterns consistent with...", "Findings suggest...", 
          "May indicate...", "Consider..."
• Present multiple differential considerations
• Frame all suggestions as clinical reasoning support
```

### Clinical Reasoning Support
```
Present: observable patterns, literature correlations (with evidence 
levels), potential blind spots, risk factors, alternative explanations.
Always include evidence strength indicators. Highlight what should NOT 
be missed. Present multiple differential considerations.
```

### Test Recommendations
```
Frame as: "Consider assessing..." or "Tests that may help evaluate..."
Never: "Perform..." or "Test for..."
```

---

## Value Proposition

**For Clinicians:**
- ✅ Reduces cognitive load (exposes variables)
- ✅ Improves documentation (suggests elements)
- ✅ Accelerates reasoning (presents correlations)
- ✅ Maintains autonomy (always editable)

**For Regulators:**
- ✅ No diagnostic interpretation
- ✅ No treatment prescription
- ✅ Transparent attribution
- ✅ Complete audit trail

**For Market:**
- ✅ Competitive differentiation
- ✅ Regulatory safety
- ✅ Clinical trust
- ✅ Scalable architecture

---

## Implementation Status

✅ **Prompt updated** with language constraints  
✅ **Schema includes** evidence levels and differentials  
✅ **Documentation created** (architecture + CTO review)  
⏳ **Post-processing validation** (pending)  
⏳ **UI indicators** for AI vs. clinician content (pending)  

---

## Key Decisions Needed from CTO

1. **Architecture approval?** (Expose vs. decide approach)
2. **Language strictness?** (How aggressive should filtering be?)
3. **Evidence level requirements?** (Mandatory for all correlations?)
4. **Post-processing validation?** (Automated language checks?)
5. **Success metrics?** (What to measure and prioritize?)

---

## Full Documentation

- **Architecture:** [`CLINICAL_COPILOT_ARCHITECTURE.md`](./CLINICAL_COPILOT_ARCHITECTURE.md)
- **Detailed Design:** [`MASTER_PROMPT_DESIGN_CTO.md`](./MASTER_PROMPT_DESIGN_CTO.md)
- **Implementation:** [`src/core/ai/PromptFactory-Canada.ts`](../../src/core/ai/PromptFactory-Canada.ts)

---

**Status:** Ready for CTO review and discussion.

