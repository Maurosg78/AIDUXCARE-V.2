# WO-2025-011 — i18n Phase 11: AI Prompt Localization & Adaptive Context Prompts  
**Market:** CA  
**Language:** en-CA  
**Status:** In Progress  

## Objective  
Localize AI prompts dynamically based on user role, clinical context, and active language.  
Integrate i18n + context adapters directly into prompt generation layer (Niagara/Vertex/Whisper).  

## Components  
- `src/ai/promptAdapter.ts`  
- `src/hooks/useAdaptivePrompt.ts`  
- Updated locales (`prompts.*` keys)  

## Compliance  
✅ English-first baseline (CPO-compliant)  
✅ No PHI persisted in prompt templates  
✅ CI + SoT trailers enforced  

**Signed-off-by:** ROADMAP_READ  
**COMPLIANCE_CHECKED**
