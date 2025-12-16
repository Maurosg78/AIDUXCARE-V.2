# WO-2025-012 — i18n Phase 12 : Real-Time Clinical Corrections (Inline AI Rephrasing)  
**Market:** CA  
**Language:** en-CA  
**Status:** In Progress  

## Objective  
Provide real-time AI-based rephrasing and style corrections while the clinician writes.  
Integrate adaptive prompt generation with streamed AI responses (SoT-safe buffer control).  

## Components  
- `src/hooks/useRephraseAI.ts`  
- `src/components/forms/RephraseBox.tsx`  
- Updates to `en.json` and `es.json` (`rephrase.*` keys)  

## Compliance  
✅ English-first baseline (CPO safe)  
✅ No PHI stored — ephemeral AI buffer  
✅ CI + SoT trailers enforced  

**Signed-off-by:** ROADMAP_READ  
**COMPLIANCE_CHECKED**
