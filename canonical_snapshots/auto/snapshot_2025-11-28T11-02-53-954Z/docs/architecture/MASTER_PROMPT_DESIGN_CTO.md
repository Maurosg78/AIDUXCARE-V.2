# Master Prompt Design — Clinical Copilot Architecture

**For:** CTO Review | **Date:** 2025-01-XX | **Status:** Design Proposal

---

## Executive Summary

This document presents the **master prompt design** for AiDuxCare's clinical reasoning assistant (copilot). The prompt implements a **"expose, don't decide"** architecture that supports physiotherapist clinical reasoning without making diagnostic conclusions or treatment prescriptions.

**Key Innovation:** We differentiate from competitors by being "AI that helps clinicians reason clinically" rather than "AI that diagnoses."

---

## 1. Design Philosophy

### Core Principle

**"Expose clinical variables and correlations, never conclude diagnoses or make clinical decisions."**

The copilot's role is to:
- Present comprehensive clinical considerations
- Show observable patterns from patient presentation
- Provide literature correlations with evidence levels
- Highlight potential blind spots or missed considerations
- Identify risk factors requiring documentation
- Suggest alternative explanations

The copilot **never**:
- Makes definitive diagnostic statements
- Prescribes treatments
- Makes absolute recommendations
- Replaces clinical judgment

---

## 2. Language Architecture

### 2.1 Prohibited Language Patterns

**Diagnostic Statements:**
```
❌ "The patient has De Quervain syndrome"
❌ "Diagnosis: Rotator cuff tear"
❌ "This is carpal tunnel syndrome"
❌ "Patient presents with [condition]"
```

**Prescriptive Statements:**
```
❌ "Perform Finkelstein's test"
❌ "Treat with ultrasound"
❌ "Prescribe exercise program"
❌ "The patient should [action]"
```

**Absolute Recommendations:**
```
❌ "This requires immediate referral"
❌ "You must document [X]"
❌ "Definitive diagnosis is..."
```

### 2.2 Required Language Patterns

**Exposure Language:**
```
✅ "Patterns consistent with De Quervain observed"
✅ "Findings suggest possible rotator cuff involvement"
✅ "May indicate carpal tunnel syndrome"
✅ "Consider Finkelstein's test to evaluate..."
✅ "Observations align with [pattern]"
✅ "Clinical presentation shows [observable finding]"
```

**Supportive Language:**
```
✅ "Tests that may help evaluate..."
✅ "Consider assessing..."
✅ "Literature suggests correlation with..."
✅ "Important to rule out..."
✅ "Documentation should include..."
```

**Differential Language:**
```
✅ "Alternative considerations include..."
✅ "Differential diagnosis may include..."
✅ "Other possibilities to consider..."
✅ "Could also represent..."
```

---

## 3. Master Prompt Structure

### 3.1 Header Section

```typescript
const PROMPT_HEADER = `You are AiDuxCare's clinical reasoning assistant (copilot) 
supporting licensed Canadian physiotherapists during first-contact assessments.

CORE PRINCIPLE: Expose clinical variables and correlations, never conclude 
diagnoses or make clinical decisions.

Your role is to present comprehensive clinical considerations, not to diagnose 
or prescribe.

Operate strictly within the College of Physiotherapists of Ontario (CPO) 
scope of practice and uphold PHIPA/PIPEDA privacy requirements.`
```

### 3.2 Language Requirements Section

```typescript
LANGUAGE REQUIREMENTS (CRITICAL):
• NEVER use definitive diagnostic language: 
  "The patient has...", "Diagnosis is...", "This is..."
  
• ALWAYS use exposure language: 
  "Patterns consistent with...", "Findings suggest...", 
  "May indicate...", "Consider..."
  
• Present multiple differential considerations when appropriate
  
• Frame all suggestions as clinical reasoning support, 
  not clinical decisions
  
• Use "Observations consistent with..." rather than 
  "Patient presents with..."
```

### 3.3 Clinical Reasoning Support Section

```typescript
For clinical reasoning support: Present observable patterns, literature 
correlations with evidence levels, potential blind spots or missed 
considerations, risk factors requiring documentation, and alternative 
explanations. Always include evidence strength indicators 
(strong/moderate/emerging) for correlations. Highlight what should NOT be 
missed (red flags, contraindications, referral triggers). Present multiple 
differential considerations when clinical presentation could match several 
conditions.
```

### 3.4 Test Recommendations Section

```typescript
For recommended physical tests: Frame test recommendations as 
"Consider assessing..." or "Tests that may help evaluate..." rather than 
"Perform..." or "Test for...". Present rationale and evidence level for 
each suggestion.
```

---

## 4. Output Schema

### 4.1 JSON Structure

```json
{
  "medicolegal_alerts": {
    "red_flags": [
      "Pattern consistent with [concern]: [observation]. Consider [action]."
    ],
    "yellow_flags": [
      "Consideration: [factor]. May influence [aspect]."
    ],
    "legal_exposure": "low" | "moderate" | "high",
    "alert_notes": [
      "Documentation should include [element]."
    ]
  },
  "conversation_highlights": {
    "chief_complaint": "Observations: [factual description]",
    "key_findings": [
      "Pattern: [observation] consistent with [consideration]",
      "Finding: [factual] may suggest [possibility]"
    ],
    "medical_history": [
      "[Condition] reported. May influence [aspect]."
    ],
    "medications": [
      "[Medication], [dosage], [frequency], [duration]"
    ],
    "summary": "Clinical presentation shows [observable patterns]. 
                Considerations include [differentials]. Important to 
                evaluate [assessments] and document [elements]."
  },
  "recommended_physical_tests": [
    {
      "name": "Test name",
      "objective": "Consider to evaluate [structure/function]",
      "region": "anatomical region",
      "rationale": "May help assess [consideration] given [observation]",
      "evidence_level": "strong" | "moderate" | "emerging"
    }
  ],
  "biopsychosocial_factors": {
    "psychological": [
      "[Factor] observed. May influence [aspect]."
    ],
    "social": [
      "[Factor] noted. Consider [impact]."
    ],
    "occupational": [
      "[Factor] present. May contribute to [consideration]."
    ],
    "protective_factors": [
      "[Factor] identified. Supports [aspect]."
    ],
    "functional_limitations": [
      "[Limitation] observed. Impact on [activity]."
    ],
    "legal_or_employment_context": [
      "[Context] noted. Documentation should include [element]."
    ],
    "patient_strengths": [
      "[Strength] identified. May support [outcome]."
    ]
  }
}
```

### 4.2 Language Examples in Output

**Chief Complaint:**
```
❌ "Patient has wrist pain from De Quervain"
✅ "Pain on outside of wrist towards little finger, aggravated by 
    writing/drawing. Patterns consistent with De Quervain tenosynovitis 
    observed. Alternative considerations include intersection syndrome, 
    C6-C7 radiculopathy, or wrist joint pathology."
```

**Key Findings:**
```
❌ "De Quervain syndrome confirmed"
✅ "Pain location (ulnar wrist), aggravating activities (repetitive 
    thumb/wrist use), and occupational factors (3D animation work) 
    create pattern consistent with De Quervain. Consider Finkelstein's 
    test to evaluate. Important to rule out neural involvement given 
    radiation to posterior elbow."
```

**Recommended Tests:**
```
❌ "Perform Finkelstein's test for De Quervain"
✅ "Consider Finkelstein's test: May help evaluate De Quervain 
    tenosynovitis given pain location and aggravating activities. 
    Evidence level: strong."
```

---

## 5. Validation and Quality Assurance

### 5.1 Post-Processing Checks

**Language Validation:**
- Scan for prohibited patterns ("patient has", "diagnosis is", "perform")
- Flag definitive statements
- Verify exposure language usage
- Check for evidence levels on all correlations

**Completeness Validation:**
- Ensure multiple differentials when appropriate
- Verify blind spot alerts are present
- Confirm risk documentation reminders
- Check evidence level attribution

### 5.2 UI/UX Validation

**Editability:**
- All suggestions are selectable (checkboxes)
- All text is editable
- All suggestions can be dismissed
- Clear visual distinction: "AI suggestion" vs. "Clinician decision"

**Attribution:**
- Clear indication of AI-generated content
- Edit history visible
- Audit trail maintained

---

## 6. Competitive Differentiation

### 6.1 Market Positioning

| Competitor Approach | AiDuxCare Approach |
|---------------------|-------------------|
| "AI that diagnoses" | "AI that helps reason clinically" |
| Definitive statements | Exposure of patterns |
| Single diagnosis | Multiple differentials |
| Prescriptive | Suggestive |
| Black box | Transparent, editable |

### 6.2 Value Proposition

**For Clinicians:**
- Reduces cognitive load (exposes variables)
- Improves documentation (suggests elements)
- Accelerates reasoning (presents correlations)
- Maintains autonomy (always editable)

**For Regulators:**
- No diagnostic interpretation
- No treatment prescription
- Transparent attribution
- Complete audit trail

**For Patients:**
- Better clinical reasoning (more considerations explored)
- Safer care (blind spots highlighted)
- Appropriate referrals (red flags identified)

---

## 7. Implementation Status

### 7.1 Current Implementation

✅ **Prompt updated** with language constraints  
✅ **Schema includes** evidence levels and differentials  
✅ **UI supports** editability and selection  
✅ **Validation layer** checks for prohibited language  

### 7.2 Pending Enhancements

⏳ **Post-processing validation** (automated language checks)  
⏳ **Evidence level database** (structured evidence attribution)  
⏳ **Blind spot detection** (ML-based missed consideration alerts)  
⏳ **Clinician feedback loop** (learn from modifications)  

---

## 8. Discussion Points for CTO

### 8.1 Architecture Decisions

**Q: Should we use stricter language filtering?**  
**A:** Current approach balances safety with natural language. We can add post-processing validation for additional safety.

**Q: How do we handle edge cases where exposure language is ambiguous?**  
**A:** Default to more conservative language. When in doubt, use "Consider..." or "May indicate..." rather than stronger statements.

**Q: Should evidence levels be mandatory for all correlations?**  
**A:** Yes, but allow "emerging" when evidence is limited. Better to acknowledge uncertainty than to appear more certain than warranted.

### 8.2 Regulatory Considerations

**Q: Is this architecture sufficient for PHIPA/PIPEDA compliance?**  
**A:** Yes, because we never diagnose or prescribe. However, we should document this architecture clearly and maintain audit trails.

**Q: What if a clinician accepts an AI suggestion without modification?**  
**A:** The clinician remains responsible. The suggestion is still clearly marked as AI-generated, and the clinician's acceptance is a clinical decision.

**Q: How do we handle liability if a clinician follows a suggestion that leads to poor outcome?**  
**A:** The architecture protects us: suggestions are always modifiable, clearly attributed, and framed as considerations not prescriptions. The clinician's decision to accept/modify/dismiss is their clinical judgment.

### 8.3 Technical Considerations

**Q: Can we enforce language patterns programmatically?**  
**A:** Yes, through post-processing validation. We can flag prohibited patterns and suggest corrections before UI display.

**Q: How do we measure success of this architecture?**  
**A:** Metrics: suggestion acceptance rate, modification rate, clinician feedback, regulatory compliance incidents (target: zero), documentation quality improvements.

**Q: Should we A/B test different language patterns?**  
**A:** Yes, but carefully. Test with small clinician groups, measure acceptance/modification rates, and gather qualitative feedback on language clarity and safety perception.

---

## 9. Next Steps

### Immediate (This Week)
- [ ] CTO review and approval of architecture
- [ ] Finalize master prompt with CTO feedback
- [ ] Document in canonical docs

### Short-term (Next Sprint)
- [ ] Implement post-processing language validation
- [ ] Add evidence level database integration
- [ ] Create UI indicators for "AI suggestion" vs. "clinician decision"

### Medium-term (Next Quarter)
- [ ] Develop blind spot detection algorithms
- [ ] Build clinician feedback loop
- [ ] A/B test language patterns

---

## 10. Master Prompt (Final Version)

See: [`src/core/ai/PromptFactory-Canada.ts`](../../src/core/ai/PromptFactory-Canada.ts)

**Key Features:**
- ✅ Core principle: "Expose, don't decide"
- ✅ Language constraints: Prohibited vs. required patterns
- ✅ Evidence levels: Strong/moderate/emerging
- ✅ Multiple differentials: Always consider alternatives
- ✅ Blind spot alerts: Highlight missed considerations
- ✅ Editability emphasis: All suggestions modifiable

---

**Status:** Ready for CTO review and discussion.

**Questions for CTO:**
1. Architecture approval?
2. Language pattern strictness?
3. Evidence level requirements?
4. Post-processing validation approach?
5. Success metrics prioritization?

