# WO-2025-005 — i18n Phase 4: Runtime Language Switcher
**Market:** CA  
**Language:** en-CA  
**Status:** In Progress  
# Objective
Enable real-time language switching between English and Spanish without reloading the app, persisting user preference across sessions.

## Tasks
1. Create `LanguageSelector.tsx` with dropdown (EN / ES)
2. Hook to i18next: `const { i18n } = useTranslation(); i18n.changeLanguage(lang)`
3. Save selected language in `localStorage` as `i18nextLng`
4. Load persisted language on app start
5. Validate build and SoT trailers
6. Tag: `i18n-phase4-validated`

## Compliance
✅ CPO baseline English-first  
✅ PHIPA/PIPEDA safe  
✅ CI + SoT trailers enforced  

**Signed-off-by:** ROADMAP_READ  
**COMPLIANCE_CHECKED**
