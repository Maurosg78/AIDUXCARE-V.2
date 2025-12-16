# Clinical Copilot Architecture — Design Principles

**Market:** CA | **Language:** en-CA | **Status:** Canonical Design Document  
**Date:** 2025-01-XX | **Owner:** Core AI Team

---

## Executive Summary

AiDuxCare's clinical copilot operates on a **"expose, don't decide"** architecture. It presents comprehensive clinical considerations, patterns, and correlations to support physiotherapist reasoning, but **never** makes diagnostic conclusions or treatment prescriptions.

**Core Differentiation:** We are not "AI that diagnoses"; we are "AI that helps clinicians reason clinically."

---

## 1. Core Architectural Principles

### 1.1 Exposure, Not Conclusion

**Principle:** The copilot exposes clinical variables and correlations. The physiotherapist makes all clinical decisions.

**Implementation:**
```typescript
// ❌ PROHIBITED LANGUAGE:
"The patient has De Quervain syndrome"
"Diagnosis: Rotator cuff tear"
"This is carpal tunnel syndrome"

// ✅ REQUIRED LANGUAGE:
"Patterns consistent with De Quervain observed"
"Findings suggest possible rotator cuff involvement"
"Consider carpal tunnel syndrome in differential"
"Observations may indicate..."
```

**Rationale:**
- Maintains legal and regulatory compliance (PHIPA/PIPEDA)
- Preserves clinical responsibility with the licensed practitioner
- Prevents over-reliance on AI suggestions
- Supports clinical reasoning without replacing it

### 1.2 Comprehensive Clinical Exposure

The copilot presents:

1. **Observable Patterns**
   - Factual findings from patient presentation
   - Anatomical specificity
   - Temporal evolution
   - Functional impact

2. **Literature Correlations**
   - Evidence-based associations
   - Evidence strength indicators (strong/moderate/emerging)
   - Source attribution when available

3. **Potential Blind Spots**
   - Considerations that might be missed
   - Alternative explanations
   - Differential diagnoses

4. **Risk Factors**
   - Red flags requiring documentation
   - Contraindications
   - Referral triggers
   - Legal/regulatory exposure points

5. **Alternative Explanations**
   - Multiple differential considerations
   - Competing hypotheses
   - Context-dependent interpretations

---

## 2. Suggestion Framework

### 2.1 Transparent Presentation

**Structure:**
```
"Here are clinical considerations based on the presentation:

1. Patterns consistent with [condition]:
   - Evidence level: [strong/moderate/emerging]
   - Observable findings: [list]
   - Literature correlation: [brief context]

2. Alternative considerations:
   - [Differential 1]: [why relevant]
   - [Differential 2]: [why relevant]

3. Important not to miss:
   - [Red flag/risk factor]
   - [Documentation requirement]

4. Recommended assessments (consider):
   - [Test 1]: [rationale]
   - [Test 2]: [rationale]"
```

### 2.2 Evidence Level Indicators

Every correlation or suggestion includes evidence strength:

- **Strong:** Well-established, high-quality evidence, clear clinical guidelines
- **Moderate:** Good evidence, some clinical consensus, reasonable confidence
- **Emerging:** Limited evidence, case reports, expert opinion, requires caution

### 2.3 Editability and Modifiability

**UI/UX Requirements:**
- All suggestions are **selectable** (checkboxes/selectors)
- All text is **editable** by the clinician
- All suggestions can be **dismissed** or **modified**
- No auto-insertion into final documentation without review

**Technical Implementation:**
- Suggestions stored as separate entities, not merged into final output
- Clear separation between "AI suggestions" and "clinician decisions"
- Audit trail: what was suggested vs. what was accepted/modified

---

## 3. Prohibited vs. Required Language

### 3.1 Prohibited Language Patterns

**Diagnostic Statements:**
- ❌ "The patient has [condition]"
- ❌ "Diagnosis: [condition]"
- ❌ "This is [condition]"
- ❌ "Patient presents with [condition]"

**Prescriptive Statements:**
- ❌ "Perform [test]"
- ❌ "Treat with [modality]"
- ❌ "Prescribe [intervention]"
- ❌ "The patient should [action]"

**Absolute Recommendations:**
- ❌ "This requires [action]"
- ❌ "You must [action]"
- ❌ "Definitive [conclusion]"

### 3.2 Required Language Patterns

**Exposure Language:**
- ✅ "Patterns consistent with [condition] observed"
- ✅ "Findings suggest possible [consideration]"
- ✅ "May indicate [possibility]"
- ✅ "Consider [assessment/intervention]"
- ✅ "Observations align with [pattern]"
- ✅ "Clinical presentation shows [observable finding]"

**Supportive Language:**
- ✅ "Tests that may help evaluate..."
- ✅ "Consider assessing..."
- ✅ "Literature suggests correlation with..."
- ✅ "Important to rule out..."
- ✅ "Documentation should include..."

**Differential Language:**
- ✅ "Alternative considerations include..."
- ✅ "Differential diagnosis may include..."
- ✅ "Other possibilities to consider..."
- ✅ "Could also represent..."

---

## 4. Value Proposition

### 4.1 Reduces Cognitive Load

**Problem:** Physiotherapists must consider many variables simultaneously during assessment.

**Solution:** Copilot exposes relevant variables, patterns, and correlations that the clinician might not immediately consider, reducing cognitive burden while maintaining clinical autonomy.

### 4.2 Improves Documentation

**Problem:** Incomplete documentation increases legal/regulatory risk.

**Solution:** Copilot suggests elements that should be documented (red flags, risk factors, contraindications, referral triggers) without dictating the final documentation.

### 4.3 Accelerates Clinical Reasoning

**Problem:** Accessing literature correlations and differential considerations is time-consuming.

**Solution:** Copilot presents relevant correlations and differentials quickly, allowing clinician to focus on patient interaction and decision-making.

### 4.4 Maintains Clinical Responsibility

**Problem:** Over-reliance on AI can erode clinical judgment.

**Solution:** By exposing rather than concluding, the copilot supports reasoning without replacing it. The physiotherapist remains fully responsible for all clinical decisions.

---

## 5. Implementation in Prompt Engineering

### 5.1 Prompt Structure

The master prompt includes:

1. **Role Definition:**
   - "Clinical reasoning assistant"
   - "Expose clinical variables, never conclude"

2. **Language Constraints:**
   - Explicit prohibited patterns
   - Required language templates
   - Examples of correct vs. incorrect phrasing

3. **Output Requirements:**
   - Evidence levels for all correlations
   - Multiple differential considerations
   - Blind spot alerts
   - Risk documentation reminders

4. **Editability Emphasis:**
   - All suggestions are modifiable
   - Clear separation of AI input vs. clinician decision

### 5.2 Validation Layer

**Post-processing checks:**
- Scan output for prohibited language patterns
- Flag definitive diagnostic statements
- Verify evidence levels are present
- Ensure multiple considerations when appropriate

**UI Validation:**
- Highlight suggestions vs. decisions
- Show edit history (what changed, why)
- Maintain audit trail

---

## 6. Regulatory Compliance

### 6.1 PHIPA/PIPEDA Alignment

- **No diagnostic interpretation:** Copilot does not diagnose, only exposes patterns
- **No treatment prescription:** Copilot does not prescribe, only suggests considerations
- **Transparent attribution:** Clear indication of AI-generated vs. clinician-modified content
- **Audit trail:** Complete record of suggestions, modifications, and final decisions

### 6.2 Professional Scope

- **Respects physiotherapy scope:** Suggestions stay within CPO guidelines
- **Highlights referral needs:** Clearly indicates when medical referral is required
- **No medical diagnosis:** Never attempts to diagnose conditions outside physiotherapy scope
- **Documentation support:** Helps document appropriately without dictating content

---

## 7. Competitive Differentiation

### 7.1 Market Positioning

**Competitors:** "AI that diagnoses" or "AI that prescribes"

**AiDuxCare:** "AI that helps clinicians reason clinically"

### 7.2 Key Differentiators

1. **Transparency:** All suggestions are visible, editable, and attributable
2. **Humility:** Acknowledges limitations, presents alternatives, highlights blind spots
3. **Support, Not Replacement:** Enhances clinical reasoning without replacing it
4. **Regulatory Safety:** Designed for compliance from the ground up

---

## 8. Success Metrics

### 8.1 Clinical Quality

- ✅ Clinicians report improved confidence in documentation
- ✅ Fewer missed considerations in assessments
- ✅ Better differential thinking (multiple considerations explored)
- ✅ Appropriate referral rates maintained or improved

### 8.2 Regulatory Safety

- ✅ Zero instances of AI making diagnostic conclusions
- ✅ 100% of suggestions reviewed/modified by clinicians
- ✅ Complete audit trail for all suggestions
- ✅ No regulatory violations related to AI suggestions

### 8.3 User Adoption

- ✅ High suggestion acceptance rate (suggestions are useful)
- ✅ High modification rate (suggestions are editable, not prescriptive)
- ✅ Low dismissal rate (suggestions are relevant)
- ✅ Positive clinician feedback on reasoning support

---

## 9. Future Enhancements

### 9.1 Short-term (Q1 2025)

- Refine language patterns based on clinician feedback
- Expand evidence level attribution
- Improve blind spot detection algorithms

### 9.2 Medium-term (Q2-Q3 2025)

- Machine learning on clinician modifications (learn preferred language)
- Integration with clinical guidelines databases
- Real-time evidence updates

### 9.3 Long-term (Q4 2025+)

- Predictive blind spot detection
- Personalized reasoning support (learn clinician's practice patterns)
- Multi-modal input (voice, images, structured data)

---

## 10. Master Prompt Design

See: [`PromptFactory-Canada.ts`](../../src/core/ai/PromptFactory-Canada.ts)

**Key Elements:**
- Role: "Clinical reasoning assistant"
- Core principle: "Expose, don't decide"
- Language constraints: Prohibited vs. required patterns
- Output structure: Evidence levels, differentials, blind spots
- Editability: All suggestions modifiable

---

**Status:** This architecture is the foundation for all AI-generated clinical content in AiDuxCare. All prompts, outputs, and UI elements must align with these principles.

**Next Review:** Q2 2025 (or upon regulatory changes)

