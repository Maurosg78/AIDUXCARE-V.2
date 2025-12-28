# WO-AUTH-GUARD-ONB-DATA-01-CLOSE — Cierre de Riesgos

## Riesgos Cerrados

### ✅ Riesgo 1: Retry que crea loops

**Problema:** Botón Retry podía crear loops infinitos si se clickeaba múltiples veces.

**Solución:**
- Botón `disabled` mientras `profileLoading === true`
- Handler `handleRetry` previene múltiples clicks
- Spinner visual mientras retry está en progreso
- Mensajes diferenciados por tipo de error (adblock, permission, network)

**Archivo:** `src/components/AuthGuard.tsx`

### ✅ Riesgo 2: Doble fuente de verdad (users/{uid} vs professional_profiles)

**Problema:** Si algún path pasaba profile de otra fuente, podría saltarse consentimientos.

**Verificación:**
- ✅ `ProfessionalWorkflowPage` obtiene profile de `useProfessionalProfile()` (Context)
- ✅ Context lee de `users/{uid}` (verificado en `ProfessionalProfileContext.tsx`)
- ✅ Todos los paths que llaman `PromptFactory.create()` reciben profile del Context
- ✅ No hay paths alternativos que pasen profile "core" o de otra colección

**Regla CTO aplicada:** El prompting siempre lee del mismo lugar (`users/{uid}` via Context).

**Archivos verificados:**
- `src/pages/ProfessionalWorkflowPage.tsx` → usa `useProfessionalProfile()`
- `src/services/vertex-ai-service-firebase.ts` → recibe profile del payload (viene del Context)
- `src/core/ai/PromptFactory-Canada.ts` → recibe profile como parámetro

### ✅ Riesgo 3: Tests que dependen de env

**Problema:** Tests podrían fallar en CI si dependen de `.env.local` o inicialización de Firebase.

**Verificación:**
- ✅ `PromptFactory-Canada.dataConsent.test.ts` solo importa funciones puras
- ✅ No hay imports de Firebase, no hay inicialización de servicios
- ✅ Tests usan mocks de `ProfessionalProfile` directamente
- ✅ `buildCanadianPrompt()` es función pura (no side effects)

**Archivo:** `src/core/ai/__tests__/PromptFactory-Canada.dataConsent.test.ts`

## Mejoras Adicionales

### Mensajes de Error Diferenciados

AuthGuard ahora muestra mensajes específicos según el tipo de error:
- **Adblock (ERR_BLOCKED_BY_CLIENT):** Mensaje sobre desactivar ad blockers
- **Permission Error:** Mensaje sobre permisos
- **Network Error:** Mensaje sobre conexión
- **Generic Error:** Mensaje genérico con Retry

### UX del Botón Retry

- Botón deshabilitado mientras loading
- Spinner visual durante retry
- Texto "Retrying..." mientras está en progreso
- Prevención de múltiples clicks simultáneos

## DoD Verificado

- ✅ Retry no crea loops (botón disabled + handler guard)
- ✅ Profile viene de `users/{uid}` en todos los paths (verificado)
- ✅ Tests son env-free (solo funciones puras, sin Firebase)

## Próximos Pasos (Manual Testing)

1. **Soft-fail con adblock:** Activar adblock, verificar pantalla recuperable
2. **Soft-fail con permission error:** Simular error de permisos, verificar mensaje
3. **Soft-fail con network error:** Desconectar red, verificar mensaje
4. **Consent → Prompt:** Verificar que con consent OFF no se inyectan preferencias
5. **Persistencia:** Verificar que `dataUseConsent` se guarda en `users/{uid}`

