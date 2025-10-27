# WO-2025-004 — i18n Phase 3: Context Expansion
**Market:** CA  
**Language:** en-CA  
**Status:** In Progress  
**Objective:** Extend localization to UI tooltips, form labels, error messages, and system banners.

## Tasks
- Extract static UI strings into `src/locales/en.json` / `es.json` under `ui.*`
- Add `useTranslation()` hooks in:
  - Tooltip.tsx, FormInput.tsx, ErrorBoundary.tsx, ModalBanner.tsx
- Update placeholders, validation messages, and system alerts
- Validate builds + CI
- Create tag `i18n-phase3-validated`

## Compliance
✅ Follows CPO English-only baseline  
✅ PHIPA/PIPEDA alignment  
✅ CI Zod/SoT trailers required  

**Signed-off-by:** ROADMAP_READ  
**COMPLIANCE_CHECKED**
