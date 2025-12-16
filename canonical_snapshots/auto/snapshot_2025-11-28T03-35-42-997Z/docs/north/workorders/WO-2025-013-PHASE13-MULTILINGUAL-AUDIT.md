# WO-2025-013 — i18n Phase 13: Multilingual SOAP Audit (Cross-Locale Validation)
**Market:** CA  
**Language:** en-CA  
**Status:** In Progress  

## Objective  
Validate cross-locale consistency between English and Spanish SOAP templates, ensuring that translations preserve clinical meaning, tone, and compliance wording.  

## Components  
- `src/audit/localeValidator.ts`  
- `test/validation/localeValidator.spec.ts`  
- Updates to `en.json` and `es.json` (test keys only)  

## Compliance  
✅ English baseline verified against CPO standards  
✅ No PHI processed — test data only  
✅ CI + SoT trailers enforced  

**Signed-off-by:** ROADMAP_READ  
**COMPLIANCE_CHECKED**
