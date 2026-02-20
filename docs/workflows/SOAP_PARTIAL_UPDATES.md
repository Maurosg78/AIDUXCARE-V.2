# SOAP Partial Updates (WO-002)

## Overview

When a physiotherapist justifies a red flag AFTER generating the SOAP note, the system updates only the Red Flags Clinical Reasoning section without regenerating the entire note. This preserves any manual edits the user made to other sections.

## Problem Solved

**Before WO-002:**
- User generates SOAP note
- User manually edits Assessment section
- User justifies a red flag
- System regenerates entire SOAP → **User's manual edits are lost** ❌

**After WO-002:**
- User generates SOAP note
- User manually edits Assessment section
- User justifies a red flag
- System updates only Red Flags section → **User's manual edits preserved** ✅

## Flow

1. **SOAP Generated**  
   - User generates SOAP note from Analysis + Physical Evaluation data
   - Red flags may or may not have justifications (from Physical Evaluation step)

2. **User Edits SOAP**  
   - User manually edits any section (e.g., Assessment, Plan)
   - Edits are saved in `localSoapNote` state

3. **Red Flag Justification Needed**  
   - System detects red flags without justification
   - Shows UI: "Red flags — add clinical justification"
   - User can add justification for each red flag

4. **Partial Update**  
   - User clicks "Save justification"
   - System calls `updateSOAPNoteRedFlags()`:
     - Parses existing SOAP sections
     - Appends/updates RED FLAGS CLINICAL REASONING section in Assessment
     - Preserves all other sections (including user manual edits)
   - Updated SOAP saved without regenerating

## Technical Implementation

### Service: `soapPartialUpdateService.ts`

**Key Functions:**
- `parseSOAPSections()` - Parse SOAP string/object into sections
- `generateRedFlagsSection()` - Format justifications as text
- `updateSOAPNoteRedFlags()` - Update only assessment section with red flags reasoning
- `reconstructSOAP()` - Rebuild SOAP from sections

**Update Strategy:**
- Red Flags Clinical Reasoning appended to Assessment section
- If section already exists, it's replaced
- All other sections (Subjective, Objective, Plan) remain unchanged

### UI: `SOAPTab.tsx`

**Features:**
- Detects red flags without justification after SOAP generation
- Shows textarea for each un-justified red flag
- "Save justification" button triggers partial update
- Success message: "Red flag justification added. SOAP note updated (your manual edits preserved)."

## Data Model

**Red Flag Justification:**
```typescript
interface RedFlagJustification {
  flagId: string;           // e.g., "rf_0"
  flagTitle: string;        // e.g., "Lumbar radiculopathy"
  justification: string;    // User's clinical reasoning
  justifiedAt: Timestamp;   // When justified
}
```

**SOAP Update:**
- Assessment section: Original content + RED FLAGS CLINICAL REASONING subsection
- Other sections: Unchanged

## Backwards Compatibility

- Existing SOAP notes without red flags section continue to work
- If no justifications provided, SOAP remains unchanged
- Partial update is optional - full regeneration still available via `handleRegenerateSOAP`

## References

- WO-002 spec; feedback ID: `Tu2TTTMZAL68X4AtR3gv`
- Service: `src/services/soapPartialUpdateService.ts`
- UI: `src/components/workflow/tabs/SOAPTab.tsx`
- Related: WO-001 (Red Flags Acknowledgement)
