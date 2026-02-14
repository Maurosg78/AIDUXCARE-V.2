# WO-PHASE1B-FOLLOWUP-WORKFLOW-REFACTOR

**Work Order ID:** WO-PHASE1B-001  
**Priority:** HIGH  
**Estimated Effort:** 4-5 days  
**Assignee:** Cursor AI Team  
**CTO Approval:** Required before implementation  
**Created:** 2026-02-14  
**Target Completion:** 2026-02-21

---

## EXECUTIVE SUMMARY

Refactor the FOLLOW-UP workflow to match the natural clinical consultation flow, implement comprehensive prompt hydration with professional profile, and add treatment adjustment notes for better SOAP generation quality.

**Current Problem:**
- UI order doesn't match clinical reality (clinician workflow)
- Professional profile not used in follow-up prompts (generic AI responses)
- Missing field for treatment adjustments/modifications
- SOAP button appears without validating prior steps completion
- `inClinicItems[].notes` and `homeProgramItems[].notes` not sent to Vertex

**Desired Outcome:**
- Logical UI flow: Audio → In-clinic (with adjustment notes) → HEP → SOAP button
- Professional profile injected into follow-up prompts (personalized AI)
- All captured data reaches Vertex AI (complete hydration)
- Gate on SOAP button (only enabled when prerequisites met)

---

## BUSINESS CONTEXT

### Clinical Reality vs Current UI

**How a physiotherapist actually works:**
1. **Listen to patient** (subjective complaints, progress, setbacks)
2. **Perform treatment in clinic** (manual therapy, exercises, modalities)
3. **Adjust home program** based on patient response
4. **Document everything** in SOAP format

**Current UI sequence:** ❌ Doesn't match this flow  
**Target UI sequence:** ✅ Audio → In-clinic → HEP → SOAP (matches clinical reality)

### Why Professional Profile Matters

- **Initial assessment:** Uses `PromptFactory-Canada` with full profile context
- **Follow-up:** ❌ Generic prompt, no profile (inconsistent AI quality)
- **Impact:** AI responses don't adapt to clinician's:
  - Experience level (junior vs senior)
  - Specialty focus (sports, geriatrics, pediatrics)
  - Preferred techniques (manual therapy, dry needling, etc.)
  - Documentation preferences (verbose vs concise)

### Parking Lot: Future Enhancements

These are OUT OF SCOPE for this WO but documented for future:

1. **Metrics: Checkbox acceptance rate**
   - Track which AI-suggested interventions are accepted/rejected
   - Use data to improve suggestion quality over time

2. **Wibbi Integration**
   - HEP exercises pulled from Wibbi platform
   - Potential partnership for seamless exercise prescription
   - Contact: [TBD]

---

## TECHNICAL REQUIREMENTS

### 1. UI REORDERING (ProfessionalWorkflowPage.tsx)

**Current order:**
```
[ Clinical Notes ] (Audio/Transcript)
[ Suggested Focus ] (In-clinic treatment)
[ Home Program ]
[ Generate SOAP ] (Button always visible)
```

**Target order:**
```
1. [ Clinical Notes ] (Audio/Transcript)
   ↓
2. [ Today's In-Clinic Treatment ]
   - Checkbox list from baseline/plan
   - NEW: Adjustment notes textarea/dictation
   ↓
3. [ Home Exercise Program (HEP) ]
   - Checkbox list from baseline/plan
   ↓
4. [ Generate SOAP with AI ] (Button)
   - Only enabled when 1-3 have minimum content
```

**Implementation:**
- Move blocks in `ProfessionalWorkflowPage.tsx` (lines ~4400-4600)
- Preserve all existing functionality
- Update state dependencies if needed

**Acceptance Criteria:**
- [ ] Audio/Transcript block appears FIRST
- [ ] In-clinic block appears SECOND
- [ ] HEP block appears THIRD
- [ ] SOAP button appears LAST
- [ ] No regression in existing features
- [ ] Visual hierarchy clear (numbers or visual flow indicators)

---

### 2. IN-CLINIC ADJUSTMENT NOTES FIELD

**Location:** Inside "Today's in-clinic treatment" block, AFTER checkbox list

**Purpose:** Document treatment modifications based on patient's current condition

**Examples:**
- "Reduced intensity due to increased pain today"
- "Added hamstring stretching to address new tightness"
- "Patient tolerated previous load well, progressed to next level"

**UI Component:**
```tsx
<div className="mt-4 border-t border-slate-200 pt-4">
  <label className="block text-sm font-medium text-slate-700 mb-2">
    Treatment adjustments or notes
  </label>
  <textarea
    value={inClinicAdjustmentsNotes}
    onChange={(e) => setInClinicAdjustmentsNotes(e.target.value)}
    placeholder="Document any modifications to today's treatment plan based on patient response..."
    rows={3}
    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  />
  <p className="text-xs text-slate-500 mt-1">
    This will be included in the SOAP generation for more accurate documentation.
  </p>
</div>
```

**State Management:**
```tsx
const [inClinicAdjustmentsNotes, setInClinicAdjustmentsNotes] = useState<string>('');

// Include in workflow state persistence
useEffect(() => {
  const state = {
    // ... existing state
    inClinicAdjustmentsNotes,
  };
  localStorage.setItem(WORKFLOW_STORAGE_KEY(patientId), JSON.stringify(state));
}, [inClinicAdjustmentsNotes, /* other deps */]);
```

**Acceptance Criteria:**
- [ ] Textarea appears below in-clinic checkbox list
- [ ] Placeholder text guides clinician on what to write
- [ ] State persists in localStorage (workflow recovery)
- [ ] Character count optional (nice-to-have)
- [ ] Value passed to `buildFollowUpPromptV3`

---

### 3. SOAP BUTTON GATE (Validation)

**Current behavior:** Button always enabled ❌  
**Target behavior:** Button enabled only when prerequisites met ✅

**Validation Logic:**
```tsx
const hasMinimumContent = useMemo(() => {
  const hasTranscript = transcript && transcript.trim().length > 0;
  const hasInClinic = inClinicItems.length > 0 || (inClinicAdjustmentsNotes && inClinicAdjustmentsNotes.trim().length > 0);
  const hasHEP = homeProgramItems.length > 0;

  // At least ONE of these must be true
  return hasTranscript || hasInClinic || hasHEP;
}, [transcript, inClinicItems, inClinicAdjustmentsNotes, homeProgramItems]);

// Button UI
<button
  onClick={handleGenerateSoap}
  disabled={!hasMinimumContent || isGenerating}
  className={`
    btn-primary
    ${!hasMinimumContent ? 'opacity-50 cursor-not-allowed' : ''}
  `}
>
  {isGenerating ? 'Generating SOAP...' : 'Generate SOAP with AI'}
</button>

{!hasMinimumContent && (
  <p className="text-xs text-amber-600 mt-2">
    Complete at least one section above (audio, in-clinic treatment, or home program) to generate SOAP.
  </p>
)}
```

**Acceptance Criteria:**
- [ ] Button disabled when NO content in any section
- [ ] Button enabled when ANY section has content
- [ ] Visual feedback (opacity, cursor, helper text)
- [ ] No console errors
- [ ] Works after localStorage restore

---

### 4. PROMPT HYDRATION: buildFollowUpPromptV3 Refactor

**File:** `src/core/soap/followUp/buildFollowUpPromptV3.ts`

**Current signature:**
```typescript
export function buildFollowUpPromptV3(input: FollowUpPromptV3Input): string
// FollowUpPromptV3Input: baselineSOAP, clinicalUpdate, inClinicItems?: string[], homeProgram?: string[]
```

**New signature:**
```typescript
export interface FollowUpPromptV3Input {
  baselineSOAP: FollowUpPromptV3BaselineSOAP;
  clinicalUpdate: string;
  inClinicItems?: Array<{ label: string; notes?: string }>;
  inClinicAdjustmentsNotes?: string;
  homeProgram?: Array<{ label: string; notes?: string }>;
  professionalProfile?: ProfessionalProfile | null;
}
```

**Prerequisite:** Export `buildCapabilityContext`, `buildProfessionalContext`, `buildPracticePreferencesContext` from `PromptFactory-Canada.ts` (they are currently internal).

**Prompt Structure Changes:**

**A. Add Professional Context (if profile exists):**
```typescript
// Import from PromptFactory-Canada (after adding exports)
import {
  buildCapabilityContext,
  buildProfessionalContext,
  buildPracticePreferencesContext,
} from '../../ai/PromptFactory-Canada';

let prompt = '';

function canUsePersonalization(profile: ProfessionalProfile): boolean {
  return profile?.dataUseConsent?.personalizationFromClinicianInputs !== false;
}

if (professionalProfile && canUsePersonalization(professionalProfile)) {
  prompt += buildCapabilityContext(professionalProfile);
  prompt += '\n\n';
  prompt += buildProfessionalContext(professionalProfile);
  prompt += '\n\n';
  prompt += buildPracticePreferencesContext(professionalProfile);
  prompt += '\n\n';
}
```

**B. Add In-Clinic Adjustments Section:**
```typescript
if (inClinicAdjustmentsNotes && inClinicAdjustmentsNotes.trim()) {
  prompt += `
CONTEXT — IN-CLINIC ADJUSTMENTS / UPDATES TODAY:
${inClinicAdjustmentsNotes.trim()}

`;
}
```

**C. Include Item Notes (if available):**
```typescript
// In-clinic with notes (support both string[] and {label, notes}[] for backward compat)
if (inClinicItems && inClinicItems.length > 0) {
  prompt += `IN-CLINIC TREATMENT TODAY:\n`;
  inClinicItems.forEach(item => {
    const label = typeof item === 'string' ? item : item.label;
    prompt += `- ${label}\n`;
    if (typeof item === 'object' && item.notes?.trim()) {
      prompt += `  Notes: ${item.notes.trim()}\n`;
    }
  });
  prompt += '\n';
}

// HEP with notes
if (homeProgram && homeProgram.length > 0) {
  prompt += `HOME EXERCISE PROGRAM:\n`;
  homeProgram.forEach(item => {
    const label = typeof item === 'string' ? item : item.label;
    prompt += `- ${label}\n`;
    if (typeof item === 'object' && item.notes?.trim()) {
      prompt += `  Notes: ${item.notes.trim()}\n`;
    }
  });
  prompt += '\n';
}
```

**Acceptance Criteria:**
- [ ] `inClinicAdjustmentsNotes` parameter accepted
- [ ] `professionalProfile` parameter accepted
- [ ] Profile sections only added if profile exists
- [ ] Profile sections respect `dataUseConsent.personalizationFromClinicianInputs`
- [ ] Item notes included when present
- [ ] Backward compatible: accepts `string[]` for inClinicItems/homeProgram
- [ ] Prompt structure valid (no syntax errors)
- [ ] Token count doesn't exceed Vertex AI limits (check in logs)

---

### 5. WORKFLOW INTEGRATION: Pass New Data to Prompt

**File:** `src/pages/ProfessionalWorkflowPage.tsx`

**Function:** `handleGenerateSOAPFollowUp` (around line 3300-3400)

**Changes:**

```typescript
// Get professional profile (already available via useProfessionalProfileContext)
const { profile: professionalProfile } = useProfessionalProfileContext();

// In handleGenerateSOAPFollowUp function:
const fullPrompt = buildFollowUpPromptV3({
  baselineSOAP: baseline,
  clinicalUpdate: followUpClinicalUpdate,

  // CHANGED: Pass full objects with notes
  inClinicItems: inClinicItems.map(item => ({
    label: item.label,
    notes: item.notes,
  })),

  // NEW: Adjustment notes
  inClinicAdjustmentsNotes: inClinicAdjustmentsNotes?.trim() || undefined,

  // CHANGED: Pass full objects with notes
  homeProgram: homeProgramItems.map(item => ({
    label: item.label,
    notes: item.notes,
  })),

  // NEW: Professional profile
  professionalProfile: professionalProfile || undefined,
});
```

**Acceptance Criteria:**
- [ ] `inClinicItems[].notes` passed to prompt
- [ ] `inClinicAdjustmentsNotes` passed to prompt
- [ ] `homeProgramItems[].notes` passed to prompt
- [ ] `professionalProfile` passed to prompt
- [ ] No TypeScript errors
- [ ] Console log shows full prompt structure in dev mode

---

## DATA FLOW VERIFICATION CHECKLIST

**Critical:** Every field captured in UI MUST reach Vertex AI prompt.

| Field | UI Component | State Variable | Prompt Parameter | Status |
|-------|-------------|----------------|------------------|--------|
| Audio transcript | `TranscriptArea` | `transcript` | `clinicalUpdate` | ✅ Already working |
| In-clinic checkbox labels | `SuggestedFocusEditor` | `inClinicItems[].label` | `inClinicItems[].label` | ✅ Already working |
| In-clinic item notes | `SuggestedFocusEditor` | `inClinicItems[].notes` | `inClinicItems[].notes` | ❌ **TO IMPLEMENT** |
| In-clinic adjustment notes | NEW textarea | `inClinicAdjustmentsNotes` | `inClinicAdjustmentsNotes` | ❌ **TO IMPLEMENT** |
| HEP checkbox labels | `HomeProgramBlock` | `homeProgramItems[].label` | `homeProgram[].label` | ✅ Already working |
| HEP item notes | `HomeProgramBlock` | `homeProgramItems[].notes` | `homeProgram[].notes` | ❌ **TO IMPLEMENT** |
| Professional profile | `useProfessionalProfileContext` | `professionalProfile` | `professionalProfile` | ❌ **TO IMPLEMENT** |

**Validation Method:**
1. Add console.log in `buildFollowUpPromptV3` showing final prompt
2. Test with ALL fields populated
3. Verify each field appears in logged prompt
4. Test with SOME fields empty (should still work)

---

## EDGE CASES & ERROR HANDLING

### 1. Profile Incomplete
**Scenario:** User has partial profile (missing title, techniques, etc.)  
**Behavior:** Use available fields, omit missing sections  
**Test:** Create user with minimal profile, verify no crashes

### 2. Profile Missing Entirely
**Scenario:** New user hasn't completed onboarding  
**Behavior:** Skip profile sections, use generic prompt (current behavior)  
**Test:** `professionalProfile = null`, verify SOAP still generates

### 3. Consent Declined for Personalization
**Scenario:** `dataUseConsent.personalizationFromClinicianInputs = false`  
**Behavior:** Do NOT inject practice preferences  
**Test:** Set consent false, verify preferences not in prompt

### 4. Very Long Adjustment Notes
**Scenario:** Clinician writes 1000+ character notes  
**Behavior:** Include in prompt, but log warning if total > token limit  
**Test:** Paste Lorem Ipsum 2000 chars, verify truncation or error handling

### 5. All Sections Empty
**Scenario:** User clicks SOAP button with no content (shouldn't happen with gate)  
**Behavior:** Button disabled, can't click  
**Test:** Try to enable button programmatically, should fail

### 6. localStorage Corruption
**Scenario:** Invalid JSON in workflow state  
**Behavior:** Graceful fallback, don't crash  
**Test:** Manually corrupt localStorage, reload page

---

## DEFINITION OF DONE (DoD)

### Code Quality
- [ ] **TypeScript:** No `any` types, all params typed
- [ ] **ESLint:** No warnings or errors
- [ ] **Prettier:** Code formatted
- [ ] **Comments:** All new functions JSDoc commented
- [ ] **Console logs:** Development logs removed or behind `NODE_ENV` check

### Functionality
- [ ] **UI Order:** Audio → In-clinic → HEP → SOAP (visual test)
- [ ] **Adjustment Notes:** Textarea works, persists, reaches prompt
- [ ] **Button Gate:** Disabled when no content, enabled when content exists
- [ ] **Profile Injection:** Logs show profile sections in prompt when exists
- [ ] **Item Notes:** `inClinicItems[].notes` and `homeProgramItems[].notes` in prompt
- [ ] **No Regression:** All existing features still work

### Testing
- [ ] **Unit Tests:** `buildFollowUpPromptV3` with all parameter combinations
- [ ] **Integration Test:** Full workflow from audio to SOAP generation
- [ ] **Edge Cases:** All 6 edge cases tested and pass
- [ ] **Cross-browser:** Works in Chrome, Safari, Firefox
- [ ] **Mobile:** Responsive on iPhone/Android

### Performance
- [ ] **Prompt Length:** Total tokens logged, stays under Vertex AI limit
- [ ] **Re-renders:** No infinite loops or excessive re-renders
- [ ] **Memory:** No memory leaks in long sessions

### Documentation
- [ ] **Code Comments:** Complex logic explained
- [ ] **CHANGELOG:** Entry added describing changes
- [ ] **README:** Updated if needed
- [ ] **API Docs:** `buildFollowUpPromptV3` signature documented

### Deployment
- [ ] **Build:** `npm run build` succeeds
- [ ] **Dev Server:** `npm run dev` works
- [ ] **Staging Deploy:** Works on `pilot.aiduxcare.com`
- [ ] **Production Ready:** CTO approval before main merge

---

## TESTING SCENARIOS

### Scenario 1: Happy Path (All Fields)
```
Given: User has complete professional profile
And: Patient has baseline from previous session
When: Clinician:
  1. Records audio: "Patient reports 50% improvement"
  2. Checks in-clinic items: [x] Manual therapy, [x] Core exercises
  3. Writes adjustment notes: "Reduced intensity due to fatigue"
  4. Checks HEP items: [x] Plank 3x30s
  5. Clicks "Generate SOAP"
Then:
  - Prompt includes professional profile sections
  - Prompt includes "Reduced intensity due to fatigue"
  - Prompt includes all checkbox items
  - SOAP generated successfully
  - SOAP reflects clinician's specialty/preferences
```

### Scenario 2: Minimal Path (Audio Only)
```
Given: User has no profile
And: Patient has baseline
When: Clinician:
  1. Records audio: "Patient worse today"
  2. Leaves in-clinic empty
  3. Leaves HEP empty
  4. Clicks "Generate SOAP" (should be enabled)
Then:
  - Prompt includes only audio transcript
  - No profile sections in prompt
  - SOAP generated successfully (generic)
```

### Scenario 3: Profile Without Consent
```
Given: User has profile
And: dataUseConsent.personalizationFromClinicianInputs = false
When: Clinician generates SOAP
Then:
  - Prompt includes professional context (title, years exp)
  - Prompt EXCLUDES practice preferences
  - SOAP generated without personalization
```

### Scenario 4: Gate Validation
```
Given: Empty workflow
When: Clinician opens follow-up
Then:
  - SOAP button disabled
  - Helper text visible

When: Clinician types in adjustment notes
Then:
  - SOAP button enabled
  - Helper text hidden
```

---

## ROLLBACK PLAN

If critical issues found after deploy:

1. **Immediate:** Revert to previous stable tag
```bash
git revert <commit-hash>
git push origin release/pilot-cmdctr-searchbar-20260209
ssh mauriciosobarzo@35.239.23.162
cd /var/www/pilot
git pull
npm run build
pm2 restart pilot-web
```

2. **Investigate:** Collect error logs, user feedback

3. **Fix Forward:** Create hotfix branch, test thoroughly, redeploy

---

## SUCCESS METRICS

**Quantitative:**
- [ ] 0 console errors in production
- [ ] 0 TypeScript compilation errors
- [ ] Prompt token count < 95% of Vertex AI limit
- [ ] Page load time increase < 10%
- [ ] SOAP generation time unchanged

**Qualitative:**
- [ ] CTO approval after UAT testing
- [ ] Beta users confirm workflow feels natural
- [ ] SOAP quality subjectively improved (feedback form)

---

## REFERENCES

| Document | Purpose |
|----------|---------|
| `docs/proposals/PROPUESTA_FLUJO_FOLLOWUP_Y_PROMPT_VERTEX_2026-02-14.md` | Original proposal |
| `src/core/soap/followUp/buildFollowUpPromptV3.ts` | Current prompt builder |
| `src/core/ai/PromptFactory-Canada.ts` | Profile context builders |
| `src/pages/ProfessionalWorkflowPage.tsx` | Main workflow page |
| `src/utils/parsePlanToFocus.ts` | `TodayFocusItem` interface |
| `src/components/workflow/SuggestedFocusEditor.tsx` | In-clinic checklist (already has notes UI) |
| `src/components/workflow/HomeProgramBlock.tsx` | HEP checklist |

---

## SIGN-OFF

**Created by:** CTO Mauricio Sobarzo  
**Date:** 2026-02-14  
**Approved for Implementation:** [ ] Yes [ ] No  
**Approved by:** _______________  
**Approval Date:** _______________

---

**END OF WORK ORDER WO-PHASE1B-001**
