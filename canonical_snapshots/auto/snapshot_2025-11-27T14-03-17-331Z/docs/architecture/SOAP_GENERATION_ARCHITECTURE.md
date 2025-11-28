# SOAP Note Generation Architecture
## AiduxCare North · Market: CA · en-CA · PHIPA/PIPEDA Ready

**Status:** Design Phase - CTO Reviewed & Approved  
**Date:** 2025-01-XX  
**Author:** Technical Design  
**CTO Review:** ✅ Approved with refinements incorporated

---

## 1. Executive Summary

The SOAP (Subjective, Objective, Assessment, Plan) note generation tab is the final step in the clinical workflow, synthesizing all captured data from:
- **Tab 1 (Analysis):** Transcript, red/yellow flags, medications, biopsychosocial factors, suggested tests
- **Tab 2 (Physical Evaluation):** Selected tests, results, field values, clinical findings

The system must generate **two distinct types** of SOAP notes:
1. **Initial Assessment SOAP** (first visit)
2. **Follow-up/Treatment Continuity SOAP** (subsequent visits)

---

## 2. Technical Architecture

### 2.1 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Tab 1: Analysis                                              │
│ - Transcript (raw + processed)                              │
│ - Red/Yellow flags                                           │
│ - Medications                                                │
│ - Biopsychosocial factors                                    │
│ - Suggested tests                                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Tab 2: Physical Evaluation                                   │
│ - Selected tests (AI + manual)                              │
│ - Test results (normal/positive/negative/inconclusive)       │
│ - Field values (angles, scores, yes/no, text)               │
│ - Clinical notes                                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Tab 3: SOAP Generation                                        │
│                                                              │
│ 1. Context Bundle Assembly                                   │
│    - Merge Tab 1 + Tab 2 data                               │
│    - Determine visit type (initial vs follow-up)            │
│    - Build structured payload                                │
│                                                              │
│ 2. Vertex AI Call                                           │
│    - Use appropriate prompt template                        │
│    - Initial Assessment prompt vs Follow-up prompt          │
│    - Structured JSON response                                │
│                                                              │
│ 3. SOAP Rendering                                           │
│    - Parse Vertex response                                  │
│    - Display S/O/A/P sections                               │
│    - Allow editing before finalization                      │
│    - Save to session/Firestore                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Core Components

#### A. **SOAP Context Builder** (`src/core/soap/SOAPContextBuilder.ts`)
```typescript
interface SOAPContext {
  visitType: 'initial' | 'follow-up';
  transcript: string;
  analysis: {
    redFlags: string[];
    yellowFlags: string[];
    medications: string[];
    biopsychosocial: {
      occupational: string[];
      protective: string[];
      functionalLimitations: string[];
      // ... other factors
    };
  };
  physicalEvaluation: {
    tests: Array<{
      name: string;
      result: 'normal' | 'positive' | 'negative' | 'inconclusive';
      values?: Record<string, any>;
      notes: string;
    }>;
  };
  patientContext?: {
    previousVisits?: number;
    lastVisitDate?: string;
    ongoingTreatment?: string;
  };
}
```

**Responsibilities:**
- Aggregate data from Tab 1 and Tab 2
- Determine visit type (heuristic: first visit if no previous SOAP in session, or explicit flag)
- Structure data for Vertex AI prompt
- Sanitize PHI-sensitive data before sending to Vertex

#### B. **SOAP Prompt Factory** (`src/core/soap/SOAPPromptFactory.ts`)
```typescript
class SOAPPromptFactory {
  buildInitialAssessmentPrompt(context: SOAPContext): string;
  buildFollowUpPrompt(context: SOAPContext): string;
  
  // Common prompt structure:
  // 1. Role definition (physiotherapy assistant, not diagnostician)
  // 2. Output schema (S/O/A/P sections)
  // 3. Visit type instructions
  // 4. Data context
  // 5. Language requirements (en-CA)
  // 6. Compliance reminders (PHIPA/PIPEDA, CPO scope)
}
```

**Key Differences Between Prompts:**

| Aspect | Initial Assessment | Follow-up |
|--------|-------------------|-----------|
| **Subjective** | **Complete history:** Chief complaint detailed, full medical history, comorbidities, medications, functional limitations | **Focused changes:** Changes since last visit, specific treatment response, new concerns, patient-reported progress |
| **Objective** | **Comprehensive exam:** Complete physical examination, multiple tests, baseline measurements | **Targeted re-assessment:** Focused re-evaluation, quantifiable progress measures, comparison to baseline |
| **Assessment** | **Deep clinical reasoning:** Initial clinical reasoning, differential considerations, pattern identification | **Evolution evaluation:** Progress assessment, treatment effectiveness, need for modifications, discharge considerations |
| **Plan** | **Complete strategy:** Full treatment plan, long-term goals, frequency, duration, follow-up schedule | **Specific adjustments:** Targeted plan modifications, progression criteria, discharge planning if appropriate |

#### C. **Vertex AI SOAP Service** (`src/services/vertex-ai-soap-service.ts`)
```typescript
interface SOAPResponse {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  metadata: {
    model: string;
    tokens: { input: number; output: number };
    timestamp: string;
  };
}

class VertexAISOAPService {
  async generateSOAP(
    context: SOAPContext,
    visitType: 'initial' | 'follow-up'
  ): Promise<SOAPResponse>;
  
  // Uses existing Vertex AI infrastructure
  // Applies same rate limiting, retry logic as clinical analysis
  // PHIPA-compliant (no PHI in logs, secure transmission)
}
```

#### D. **SOAP Editor Component** (`src/components/SOAPEditor.tsx`)
```typescript
interface SOAPEditorProps {
  soap: SOAPResponse;
  isEditable: boolean;
  onSave: (editedSOAP: SOAPResponse) => void;
  onRegenerate?: () => void;
}
```

**Features:**
- Four-section display (S/O/A/P)
- Inline editing capability
- Markdown support for formatting
- "Regenerate" button (with confirmation)
- "Save as Draft" vs "Finalize"
- Export options (PDF, text)

---

## 3. Legal & Compliance Considerations

### 3.1 PHIPA/PIPEDA Compliance

**Critical Requirements:**
1. **No PHI in Vertex AI logs:** Ensure Vertex AI service doesn't log patient names, DOB, or other identifiers
2. **Audit trail:** Log SOAP generation events (who, when, what model) without storing PHI
3. **Data retention:** SOAP notes stored in Firestore with proper access controls
4. **Scope of practice:** Prompts must emphasize physiotherapy scope, no medical diagnosis

### 3.2 CPO (College of Physiotherapists of Ontario) Compliance

**Documentation Standards:**
- SOAP notes must be clear, concise, and clinically relevant
- Must reflect actual findings (not AI-generated assumptions)
- Must be reviewable and editable by the physiotherapist
- Must include date, time, and practitioner identification

**Prompt Instructions:**
```
CRITICAL: This SOAP note is a documentation tool for a registered 
physiotherapist in Ontario, Canada. It must:
- Reflect ONLY information provided by the clinician
- Use language appropriate for clinical documentation
- Avoid diagnostic conclusions (use "patterns consistent with...")
- Include appropriate disclaimers if AI-generated content is used
```

### 3.3 Liability & Attribution

**UI Disclaimers:**
- "This SOAP note is AI-assisted. Review and edit all content before finalizing."
- "The clinician is responsible for the accuracy and completeness of this note."
- "AI-generated content is a starting point and must be verified."

**Technical Safeguards:**
- SOAP notes marked as "draft" until explicitly finalized
- Version history (if regenerated, keep previous version)
- Timestamp and user attribution on finalization

---

## 4. UI/UX Design

### 4.1 Tab Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Analysis] [Physical Evaluation] [SOAP Note] ← Active       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SOAP Note Generation                                         │
│                                                              │
│ Visit Type: ○ Initial Assessment  ● Follow-up Visit         │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Context Summary                                          │ │
│ │ • Transcript: 245 words                                  │ │
│ │ • Red flags: 1 identified                                │ │
│ │ • Physical tests: 4 completed                            │ │
│ │ • Medications: 3 documented                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ [Generate SOAP Note] ← Primary action                       │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Generated SOAP Note (Editable)                           │ │
│ │                                                           │ │
│ │ S: Subjective                                             │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ [Editable text area with generated content]          │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                           │ │
│ │ O: Objective                                             │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ [Editable text area]                                 │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                           │ │
│ │ A: Assessment                                            │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ [Editable text area]                                 │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                           │ │
│ │ P: Plan                                                 │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ [Editable text area]                                 │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                           │ │
│ │ [Regenerate] [Save Draft] [Finalize & Save]              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 States & Interactions

**State 1: Pre-Generation**
- Show context summary
- Visit type selector
- "Generate SOAP Note" button (disabled if Tab 1 or Tab 2 incomplete)

**State 2: Generating**
- Loading indicator
- "Generating SOAP note with Vertex AI..."
- Disable editing

**State 3: Generated (Draft)**
- Display all four sections
- All sections editable
- "Regenerate" button (with confirmation modal)
- "Save Draft" button
- "Finalize & Save" button (requires confirmation)

**State 4: Finalized**
- Read-only mode (or edit with "Unfinalize" action)
- Timestamp and user attribution visible
- Export options available

### 4.3 Error Handling

**Vertex AI Failures:**
- Show error message: "Unable to generate SOAP note. Please try again."
- Retry button
- Fallback: Allow manual SOAP entry

**Validation:**
- Warn if Tab 1 or Tab 2 data is incomplete
- Suggest completing missing sections before generation

---

## 5. Prompt Engineering Strategy

### 5.1 Initial Assessment Prompt Structure

```
You are a clinical documentation assistant for a registered physiotherapist 
in Ontario, Canada. Generate a SOAP note for an INITIAL ASSESSMENT visit.

ROLE:
- You assist with documentation, you do NOT diagnose
- Use language: "Patterns consistent with..." not "Patient has..."
- Reflect ONLY information provided by the clinician
- Output in English (en-CA)

OUTPUT FORMAT (JSON):
{
  "subjective": "Chief complaint, history of present condition, relevant 
                 medical history, medications, functional limitations...",
  "objective": "Physical examination findings, test results, measurements...",
  "assessment": "Clinical reasoning, patterns observed, differential 
                 considerations (non-diagnostic language)...",
  "plan": "Treatment goals, proposed interventions, frequency, duration, 
           follow-up plan..."
}

CONTEXT DATA:
[Structured data from Tab 1 and Tab 2]

CRITICAL RULES:
- No medical diagnoses
- No prescription of medications
- Scope: Physiotherapy assessment and treatment planning
- Language: Professional, concise, clinically appropriate
```

### 5.2 Follow-up Prompt Structure

```
You are a clinical documentation assistant for a registered physiotherapist 
in Ontario, Canada. Generate a SOAP note for a FOLLOW-UP/TREATMENT 
CONTINUITY visit.

ROLE: [Same as initial]

OUTPUT FORMAT: [Same JSON structure]

CONTEXT DATA:
[Structured data from Tab 1 (current visit: changes, treatment response)]
[Structured data from Tab 2 (re-assessment findings, progress measures)]
[Previous visit context: Assessment + Plan from last 1-2 visits]

KEY DIFFERENCES - FOCUSED APPROACH:
- Subjective: FOCUSED on changes since last visit, specific treatment 
              response, patient-reported progress, new concerns only, 
              functional improvements/limitations
- Objective: TARGETED re-assessment, quantifiable progress measures, 
             comparison to baseline from initial visit, specific tests 
             repeated, measurable changes
- Assessment: EVOLUTION EVALUATION - progress assessment, treatment 
              effectiveness, what's working/not working, need for plan 
              modifications, discharge readiness considerations
- Plan: SPECIFIC ADJUSTMENTS - targeted modifications to treatment, 
        progression criteria, intensity/frequency changes, new 
        interventions if needed, discharge planning if appropriate, 
        next visit goals

CRITICAL RULES: [Same as initial]
ADDITIONAL: Compare to previous visit(s) to show progression/regression
```

---

## 6. Implementation Phases

### Phase 1: MVP (Week 1) - PRIORITY
- [ ] **SOAP Context Builder** with hybrid visit type detection
  - Heuristic logic (no previous SOAP OR >30 days = Initial)
  - Manual override selector
  - Context aggregation from Tab 1 + Tab 2
- [ ] **Two prompt templates** (Initial Assessment + Follow-up)
  - Initial: Comprehensive, deep clinical reasoning
  - Follow-up: Focused, progress-oriented
- [ ] **Vertex AI integration** (reuse existing infrastructure)
  - Rate limiting, retry logic, error handling
- [ ] **SOAP Editor** (4-section editor)
  - S/O/A/P sections with inline editing
  - Draft/Finalized states
  - Basic validation
- [ ] **Firestore storage** with indexing
  - `soap_notes` collection
  - `episodeId + timestamp` composite index
  - Draft auto-save

### Phase 2: Enhanced (Week 2)
- [ ] **Previous visit context** integration
  - Fetch last 2 SOAP notes for follow-ups
  - Include Assessment + Plan in prompt context
- [ ] **Regenerate functionality** with comparison
  - Side-by-side view (old vs new)
  - Selective merge capability
  - Undo/restore previous version
- [ ] **Enhanced validation**
  - Required sections check
  - Minimum length validation
  - Clinical content validation

### Phase 3: Polish (Week 3)
- [ ] **PDF export** (server-side)
  - CPO-compliant template
  - Professional formatting
  - Header/footer with disclaimers
- [ ] **Version management**
  - Maximum 3 versions (draft, finalized, previous)
  - Version comparison UI
  - Archive strategy for older versions
- [ ] **Enhanced editing**
  - Markdown support
  - Rich text formatting
  - Section templates/snippets
- [ ] **Context summary improvements**
  - Visual summary of Tab 1 + Tab 2 data
  - Missing data warnings
- [ ] **Error handling refinement**
  - Better error messages
  - Recovery strategies
  - User guidance

---

## 7. Technical Decisions Needed

### 7.1 Visit Type Detection
**Question:** How do we determine if this is an initial vs follow-up visit?

**Options:**
1. **Explicit selection:** User selects "Initial" or "Follow-up" in UI
2. **Heuristic:** Check if patient has previous SOAP notes in Firestore
3. **Hybrid:** Default to heuristic, allow override

**✅ CTO Decision: Option 3 (Hybrid) with Enhanced Logic**

**Implementation:**
- **Heuristic 1:** If no previous SOAP exists → Initial Assessment
- **Heuristic 2:** If >30 days since last SOAP → Initial Assessment (new episode)
- **Heuristic 3:** If <30 days and previous SOAP exists → Follow-up
- **Override:** Manual selector always visible for clinician override
- **UI:** Show detected type with option to change: "Detected: Follow-up [Change]"

### 7.2 Previous Visit Context
**Question:** Should we include previous visit SOAP in the prompt for follow-ups?

**Options:**
1. **Yes:** Include full previous SOAP in context (better continuity)
2. **No:** Only use current visit data (simpler, faster)
3. **Optional:** User can choose to include previous visit summary

**✅ CTO Decision: Option 1 (Yes) with Limits**

**Implementation:**
- **For Follow-ups:** Include summary of last SOAP (Assessment + Plan sections only)
- **Context limit:** Maximum 2 previous visits for context
- **Benefit:** Maintains clinical reasoning continuity
- **Token management:** Truncate if needed, prioritize most recent visit

### 7.3 Regeneration Strategy
**Question:** When user clicks "Regenerate", should we:
- Use same prompt with same data?
- Allow user to modify context before regenerating?
- Keep previous version for comparison?

**✅ CTO Decision: Side-by-Side Comparison with Selective Merge**

**Implementation:**
- **Regeneration:** Use same prompt with same data
- **Version keeping:** Keep previous version in draft state
- **UI:** Side-by-side comparison view (old vs new)
- **Merge capability:** Allow selective merging of sections (e.g., keep old Subjective, use new Objective)
- **Undo:** "Restore previous version" option available

### 7.4 Storage Strategy
**Question:** Where and how do we store SOAP notes?

**Options:**
1. **Firestore:** Separate collection `soap_notes` with patient/session references
2. **Session state:** Store in current session, save to Firestore on finalize
3. **Hybrid:** Draft in session, finalized in Firestore

**✅ CTO Decision: Option 1 (Firestore) with Indexing Strategy**

**Implementation:**
- **Collection:** `soap_notes` in Firestore
- **Indexing:** Composite indexes on `episodeId + timestamp` for efficient queries
- **Structure:**
  ```typescript
  {
    id: string;
    episodeId: string; // Links visits in same episode
    patientId: string;
    visitType: 'initial' | 'follow-up';
    visitNumber: number; // 1, 2, 3...
    timestamp: Timestamp;
    status: 'draft' | 'finalized';
    soap: {
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
    };
    metadata: {
      generatedBy: 'vertex-ai';
      model: string;
      tokens: { input: number; output: number };
      editedBy: string; // User ID
      finalizedAt: Timestamp;
    };
    versions?: Array<{ // Max 3 versions
      version: number;
      soap: SOAPContent;
      timestamp: Timestamp;
    }>;
  }
  ```
- **Draft handling:** Drafts stored in Firestore with `status: 'draft'`, auto-saved periodically

---

## 8. Risk Assessment

### 8.1 Technical Risks
- **Vertex AI rate limiting:** Same mitigations as clinical analysis (backoff, cooldown)
- **Token limits:** Large context bundles may exceed limits → implement truncation strategy
- **Response quality:** Prompt engineering critical → iterative refinement needed

### 8.2 Legal Risks
- **Over-reliance on AI:** Mitigated by mandatory review/edit before finalization
- **Scope of practice:** Prompts must be carefully crafted to avoid diagnostic language
- **Data privacy:** Ensure no PHI leakage in logs or error messages

### 8.3 UX Risks
- **User frustration if regeneration changes too much:** Allow "undo" or version comparison
- **Long generation times:** Show progress, allow cancellation
- **Complexity:** Keep UI simple, progressive disclosure for advanced features

---

## 9. Success Metrics

### 9.1 Technical
- SOAP generation success rate >95%
- Average generation time <10 seconds
- Zero PHI leakage in logs/errors

### 9.2 Clinical
- Clinician satisfaction with generated content
- Time saved vs manual SOAP writing
- Edit rate (how much clinicians modify AI-generated content)

### 9.3 Compliance
- 100% of SOAP notes reviewed before finalization
- Zero scope of practice violations in generated content
- Audit trail completeness

---

## 10. CTO Decisions & Implementation Details

### ✅ Resolved Questions:

1. **Visit type detection:** ✅ **Hybrid** (heuristic + manual override)
   - Heuristic: No previous SOAP OR >30 days since last = Initial
   - Override: Manual selector always visible

2. **Previous visit context:** ✅ **Yes** - Last Assessment + Plan in follow-ups
   - Limit: Maximum 2 previous visits
   - Content: Assessment + Plan sections only

3. **Regeneration UX:** ✅ **Side-by-side comparison** with selective merge
   - Keep previous version
   - Allow section-by-section merge
   - Undo capability

4. **Storage:** ✅ **Firestore** with `episodeId + timestamp` indexing
   - Collection: `soap_notes`
   - Drafts stored in Firestore with auto-save
   - Structure defined above

5. **Export formats:** ✅ **PDF on server** with CPO-compliant template
   - Server-side generation (Firebase Functions or Cloud Run)
   - Template includes: Header, 4 sections, footer with disclaimers
   - Format: Professional, printable, compliant

6. **Versioning:** ✅ **Maximum 3 versions** (draft, finalized, previous)
   - Keep: Current draft, finalized version, one previous finalized
   - Archive older versions to separate collection if needed

### 🔮 Future Considerations:

7. **Integration:** External EMR integration (Future consideration)
8. **Multi-language:** French SOAP notes for Quebec market (Future consideration)

---

## 11. Next Steps

1. **CTO Review:** Discuss this document, address open questions
2. **Prompt Refinement:** Iterate on prompt templates with clinical input
3. **Prototype:** Build MVP SOAP tab with basic functionality
4. **Testing:** Test with real clinical scenarios, gather feedback
5. **Iteration:** Refine based on user feedback and compliance review

---

**Document Status:** ✅ CTO Reviewed - Ready for Implementation  
**Last Updated:** 2025-01-XX  
**CTO Decisions:** All 6 questions resolved, refinements incorporated

