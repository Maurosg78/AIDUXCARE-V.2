# WO-2025-004B — i18n Phase 3B: UI Text Injection
**Market:** CA  
**Language:** en-CA  
**Status:** In Progress  

## Objective
Inject translation hooks (`t()`) into core UI components:
- FormInput.tsx → placeholders & validation messages  
- ModalBanner.tsx → system banners & success notices  
- ErrorBoundary.tsx → fallback UI  
- LoadingOverlay.tsx → loading/sync text  

## Tasks
1. Import `useTranslation` and replace hard-coded strings with `t("ui.*")`
2. Validate build and commit SoT-compliant
3. Tag: `i18n-phase3b-validated`

**Signed-off-by:** ROADMAP_READ  
**COMPLIANCE_CHECKED**
