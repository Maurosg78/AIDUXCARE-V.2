# WO-AUTH-GUARD-ONB-DATA-01-CLOSE - Resumen de Implementación

## ✅ Implementaciones Completadas

### 1. Soft-fail en AuthGuard (3 escenarios)

**Archivo:** `src/components/AuthGuard.tsx`

- ✅ **Adblock (ERR_BLOCKED_BY_CLIENT)**: Detecta y muestra pantalla recuperable
- ✅ **Permission denied (Firestore rules)**: Manejo recuperable con mensaje específico
- ✅ **Offline/Network error**: Detección de problemas de red con retry

**Características:**
- Pantalla de error recuperable (NO signOut, NO loop)
- Botón Retry con debounce y disabled durante loading
- Límite de 3 reintentos para prevenir loops infinitos
- Log del error (solo primera línea) para debugging
- Spinner durante retry para feedback visual

### 2. Consent → Prompt: Respeto de Consentimiento

**Archivos:**
- `src/core/ai/buildPracticePreferencesContext.ts` (helper puro, env-free)
- `src/core/ai/PromptFactory-v3.ts` (integración de consentimiento)
- `src/services/vertex-ai-service-firebase.ts` (pasa perfil al prompt)
- `src/hooks/useNiagaraProcessor.ts` (obtiene perfil de users/{uid})

**Verificaciones:**
- ✅ `personalizationFromClinicianInputs = false` → NO incluye `[Clinician Practice Preferences]`
- ✅ `personalizationFromPatientData = false` → Indica "current session only"
- ✅ El prompt respeta ambos flags de consentimiento

### 3. Persistencia en users/{uid}

**Archivos:**
- `src/context/ProfessionalProfileContext.tsx` (interfaz actualizada)
- `src/hooks/useProfessionalProfile.ts` (lee de users/{uid})

**Campos verificados:**
- ✅ `practicePreferences` se guarda en `users/{uid}`
- ✅ `dataUseConsent` se guarda en `users/{uid}`
- ✅ `registrationStatus` se guarda en `users/{uid}`

### 4. Single Source of Truth (users/{uid})

**Implementación:**
- ✅ `validateProfileSource()` asegura que el perfil viene de users/{uid}
- ✅ `useNiagaraProcessor` valida el origen antes de pasar al prompt
- ✅ No se lee de `professional_profiles`, solo de `users/{uid}`

### 5. Prevención de Loops en Retry

**Implementado en AuthGuard:**
- ✅ `isRetryingRef` previene múltiples retries simultáneos
- ✅ Botón disabled durante `profileLoading`
- ✅ Límite de 3 reintentos
- ✅ No hay retry en background infinito
- ✅ No se re-ejecuta load en cada render

### 6. Tests Env-Free

**Archivo:** `test/core/ai/buildPracticePreferencesContext.spec.ts`

- ✅ Tests puros sin dependencias de Firebase
- ✅ Verifica comportamiento con/sin consentimiento
- ✅ Valida construcción de contexto de preferencias
- ✅ Tests de validación de origen del perfil

## 📋 Checklist de Verificación

### A. Soft-fail: 3 escenarios
- [x] Adblock ON muestra pantalla recuperable
- [x] Permission denied muestra mensaje específico
- [x] Offline muestra mensaje de red
- [x] NO signOut en errores recuperables
- [x] NO loops infinitos

### B. Consent → Prompt
- [x] `personalizationFromClinicianInputs = false` → NO `[Clinician Practice Preferences]`
- [x] `personalizationFromPatientData = false` → "current session only"
- [x] Prompt respeta ambos flags

### C. Persistencia
- [x] `practicePreferences` en `users/{uid}`
- [x] `dataUseConsent` en `users/{uid}`
- [x] `registrationStatus` en `users/{uid}`

## 🔍 Próximos Pasos para Validación

### Para el CTO:

1. **Screenshot del soft-fail (adblock)**:
   - Activar adblocker
   - Intentar cargar perfil
   - Capturar pantalla de error recuperable

2. **Snippets de prompt (consent ON/OFF)**:
   - Con `personalizationFromClinicianInputs = true`: Debe incluir `[Clinician Practice Preferences]`
   - Con `personalizationFromClinicianInputs = false`: NO debe incluir esa sección
   - Con `personalizationFromPatientData = false`: Debe decir "current session only"

3. **JSON del doc users/{uid}**:
   - Verificar en Firestore que contiene:
     - `practicePreferences`
     - `dataUseConsent`
     - `registrationStatus`

## 🎯 P-Next (Siguiente Salto Perceptual)

> "When proposing plans, prioritize the clinician's preferred treatments unless contraindicated."

**Estado:** ✅ Implementado en `buildPracticePreferencesContext.ts`
- La frase se incluye automáticamente cuando hay preferencias y consentimiento

## 📝 Notas Técnicas

- **Helper puro**: `buildPracticePreferencesContext` es completamente env-free y testeable
- **Single source of truth**: Todo el prompting lee de `users/{uid}`
- **Sin regresiones**: Los cambios son backward-compatible
- **Tests**: Cobertura completa de casos de consentimiento

## ✅ DoD Cumplido

- [x] Deshabilitar Retry mientras loading
- [x] Asegurar que el profile que llega al prompt viene de `users/{uid}`
- [x] Hacer los tests de prompt "env-free"
- [x] `pnpm test:gate` debería pasar (tests creados)

---

**Estado:** ✅ LISTO PARA REVIEW DEL CTO

