# HITO: Onboarding Profile → Canonical Source of Truth

**Fecha:** 2025-12-15  
**Market:** CA  
**Language:** en-CA  
**Estado:** ✅ COMPLETADO

---

## 🎯 Qué faltaba

El Onboarding Wizard capturaba datos profesionales completos, pero **tres campos críticos no se persistían** en Firestore:

1. ❌ `university` — capturado pero no guardado
2. ❌ `experienceYears` — capturado pero no guardado  
3. ❌ `workplace` — capturado pero no guardado

Esto creaba un **gap entre la fuente canónica** (wizard) y el **ProfessionalProfile** usado por el sistema de prompts.

---

## ✅ Qué se corrigió

### Persistencia completa

**Archivos modificados:**
- `src/services/emailActivationService.ts` — interface `ProfessionalRegistration` extendida
- `src/pages/OnboardingPage.tsx` — campos agregados al payload y pasados a `registerProfessional()`

**Cambios técnicos:**
- `university?: string` agregado a `ProfessionalRegistration`
- `experienceYears?: number` agregado (tipo normalizado a `number`)
- `workplace?: string` agregado
- Validación con `Number.isFinite()` para prevenir `NaN`
- Persistencia automática en Firestore `users/{uid}` vía spread operator

### Source of Truth confirmado

✅ **Firestore `users/{uid}`** es ahora la fuente canónica completa del perfil profesional  
✅ `ProfessionalProfileContext` lee correctamente desde Firestore  
✅ `PromptFactory-Canada.ts` consume el contexto completo

---

## 🚀 Qué habilita

Con el perfil profesional canónico completo, ahora es posible:

1. **Prompt capability-aware** — ajustar el lenguaje y priorización según seniority y especialidad
2. **Ajuste por seniority** — junior recibe más guía, senior recibe output más conciso
3. **Ajuste por especialidad** — foco en domain (MSK, neuro, cardio, general)
4. **Reducción de ruido** — perfiles expertos no reciben explicaciones básicas innecesarias

---

## 🚫 Qué NO se hace aún

Este hito **solo cierra la persistencia**. No incluye:

- ❌ Agregar subespecialidades al wizard
- ❌ Agregar skills ni comfort levels
- ❌ Modificar el wizard UI
- ❌ Cambiar el sistema de prompts (eso es WO-PROMPT-CAPABILITY-AWARE-01)

---

## 📊 Validación

**Criterios de Done:**
- ✅ Campos persistidos en Firestore `users/{uid}`
- ✅ `ProfessionalProfileContext` carga los campos
- ✅ Logs de PromptFactory muestran `experienceYears` (no `undefined`)
- ✅ Tipos normalizados (`experienceYears` como `number`)

**Commit:** `ff28b939`

---

## 🔗 Próximo paso

**WO-PROMPT-CAPABILITY-AWARE-01** — usar este perfil canónico para hacer el sistema de prompts inteligente y contextual.

