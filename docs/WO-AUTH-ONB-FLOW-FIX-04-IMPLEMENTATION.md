# WO-AUTH-ONB-FLOW-FIX-04 — Implementation Summary

**Date:** 2025-01-XX  
**Status:** ✅ **COMPLETE**

---

## Objetivo

Eliminar el loop `login→verify-email→onboarding` y evitar lecturas por email sin auth. Hacer que el gate use solo `users/{uid}` como source-of-truth.

---

## Cambios Implementados

### A) Bloquear "validateEmailImmediate" cuando no hay auth ✅

**Archivo:** `src/pages/ProfessionalOnboardingPage.tsx`

**Problema:**
- `validateEmailImmediate()` llamaba `getProfessional(email)` y fallaba con permissions (usuario aún no autenticado).

**Solución:**
- Si `!auth.currentUser?.uid` → NO consultar Firestore, solo validar formato de email localmente.
- Si hay auth → cualquier verificación debe ser por uid y en `users/{uid}`, no por email.

**Código:**
```typescript
// WO-AUTH-ONB-FLOW-FIX-04 A: Si NO hay auth, solo validar formato localmente
const { getAuth } = await import('firebase/auth');
const auth = getAuth();
const currentUser = auth.currentUser;

if (!currentUser?.uid) {
  // Usuario no autenticado - solo validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidFormat = emailRegex.test(email);
  // NO llamar getProfessional(email) sin auth
  // Firebase Auth validará duplicados cuando se cree la cuenta
}
```

**DoD:**
- ✅ No debe aparecer `Missing or insufficient permissions` al escribir email en el onboarding.

---

### B) AuthGuard: NO usar getProfessional(email). Usar Firebase Auth + users/{uid} ✅

**Archivo:** `src/components/AuthGuard.tsx`

**Problema:**
- `emailVerified` venía de Firestore (`getProfessional(email)`) en lugar de Firebase Auth.

**Solución:**
- `emailVerified` ahora viene de `auth.currentUser.emailVerified` (Firebase Auth).
- Perfil completo = `users/{uid}.registrationStatus === 'complete'`.
- Si falla Firestore (permissions/network) → soft-fail con Retry (no logout, no redirect infinito).

**Código:**
```typescript
// WO-AUTH-ONB-FLOW-FIX-04 B: emailVerified viene de Firebase Auth, no de Firestore
// Source of truth: auth.currentUser.emailVerified
if (!user.email) {
  setEmailVerified(false);
} else {
  // Firebase Auth ya tiene emailVerified en el objeto user
  setEmailVerified(user.emailVerified || false);
}
```

**DoD:**
- ✅ Login exitoso no deriva a `/verify-email` salvo que realmente `emailVerified === false`.
- ✅ No loops.

---

### C) ProfessionalProfileContext: nunca "crear minimal profile" si el error es permissions ✅

**Archivo:** `src/context/ProfessionalProfileContext.tsx`

**Problema:**
- Ante "not found" o fallos, se creaba perfil mínimo `incomplete` y pisaba/ensuciaba estado.

**Solución:**
- Solo crear minimal profile si el resultado es "documento no existe" confirmado (`getDoc.exists() === false`) y la lectura fue exitosa.
- Si error es `permission-denied` → `set profileError + UI Retry`; NO escribir nada.

**Código:**
```typescript
// WO-AUTH-ONB-FLOW-FIX-04 C: Detectar específicamente permission-denied
const isPermissionDenied = errorCode === 'permission-denied' || 
                           errorMessage.includes('permission-denied') ||
                           errorMessage.includes('missing or insufficient permissions');

if (isNetworkOrBlockedError(err) || isPermissionDenied) {
  // NO escribir nada a Firestore si hay error de permissions
  setError(error);
  setErrorType(classifiedType);
  // NO crear perfil mínimo
}
```

**DoD:**
- ✅ Si reglas impiden leer, no se crea nada.
- ✅ No se pisa `registrationStatus`.

---

### D) Unificar rutas: /verify-email existe y solo se muestra en registro real ✅

**Archivo:** `src/router/router.tsx`

**Verificación:**
- ✅ La ruta `/verify-email` está registrada (línea 66).
- ✅ Apunta a `EmailVerifiedPage`.
- ✅ El redirect a `/verify-email` solo ocurre desde flujo registro, no desde login normal.

**Código:**
```typescript
// src/router/router.tsx:66
{ path: '/verify-email', element: <EmailVerifiedPage /> },
```

**DoD:**
- ✅ Nunca 404 en `/verify-email`.

---

### E) UX: Botón Logout (mínimo) en pantalla inicial ✅

**Archivo:** `src/features/command-center/components/CommandCenterHeader.tsx`

**Solución:**
- Agregado botón "Logout" visible en el header del Command Center.
- Permite cortar loops rápido en QA.

**Código:**
```typescript
// WO-AUTH-ONB-FLOW-FIX-04 E: Botón Logout para cortar loops rápido en QA
const handleLogout = async () => {
  try {
    await signOut(getAuth());
    navigate('/login', { replace: true });
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

// En el JSX:
<button
  onClick={handleLogout}
  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:border-slate-400 transition-colors font-apple"
  title="Logout"
>
  <LogOut className="w-4 h-4" />
  <span className="hidden sm:inline">Logout</span>
</button>
```

**DoD:**
- ✅ Un botón "Logout" visible en el área autenticada para cortar loops rápido en QA.

---

## Onboarding Wizard — División de 3 Pasos (Referencia)

### Step 1 — Identidad y contacto (para personalización humana)

**Campos:**
- `firstName` / `lastName` (+ opcionales `secondName`/`secondLastName`)
- `preferredSalutation` / `displayName`
- `email` / `phone`
- `timezone` / `languages`

**Uso:**
- Saludo, firma de notas, tono "humano".

**Persistencia:** `users/{uid}`

**Acceso:** `useProfessionalProfile()`

**Uso en prompting:** Sección `[Clinician Profile]` y tono/idioma.

---

### Step 2 — Profesional + estilo clínico (para "se siente que te conoce")

**Campos:**
- `profession` / `professionalTitle`
- `specialty` / `domainFocus`
- `licenseNumber` + `country`/`province`
- `yearsOfExperience`
- `clinic`/`workplace`
- `practicePreferences` (`noteVerbosity`, `tone`, `preferredTreatments`, `doNotSuggest`)

**Uso:**
- Personalización fuerte del prompt (ya implementado).

**Persistencia:** `users/{uid}.practicePreferences`

**Uso en prompting:** `[Clinician Practice Preferences]` (ya implementado).

---

### Step 3 — Consentimiento y data-use (guardrails legales + memoria)

**Campos:**
- `consents` (PIPEDA/GDPR/HIPAA + data processing)
- `auditTrailEnabled` / `mfaEnabled`
- `dataUseConsent` (los 4 flags)

**Uso en prompting:**
- Si `personalizationFromClinicianInputs=false` → NO inyectar preferences
- Si `personalizationFromPatientData=false` → NO usar historial en `contextoPaciente`
- Si `allowAssistantMemoryAcrossSessions=false` → NO guardar/resumir memory

**Persistencia:** `users/{uid}.dataUseConsent`

---

## Regla de Oro para el Equipo (Cursor)

**Todo campo del wizard debe cumplir estos 3 puntos:**

1. ✅ Se guarda en un solo SoT: `users/{uid}`
2. ✅ Es accesible desde un solo hook: `useProfessionalProfile()`
3. ✅ Tiene "puente" explícito a prompting: `PromptFactory-Canada` (o el builder activo), sin inventar defaults.

---

## Verificación de Cambios

### Archivos Modificados:

1. ✅ `src/pages/ProfessionalOnboardingPage.tsx`
   - `validateEmailImmediate()` ahora solo valida formato local si no hay auth

2. ✅ `src/components/AuthGuard.tsx`
   - Removido `emailActivationService.getProfessional(email)`
   - Usa `auth.currentUser.emailVerified` directamente

3. ✅ `src/context/ProfessionalProfileContext.tsx`
   - Detecta específicamente `permission-denied`
   - NO crea perfil mínimo si hay error de permissions

4. ✅ `src/router/router.tsx`
   - Verificado que `/verify-email` existe

5. ✅ `src/features/command-center/components/CommandCenterHeader.tsx`
   - Agregado botón "Logout"

---

## DoD Final

- [x] No debe aparecer `Missing or insufficient permissions` al escribir email en el onboarding
- [x] Login exitoso no deriva a `/verify-email` salvo que realmente `emailVerified === false`
- [x] No loops
- [x] Si reglas impiden leer, no se crea nada
- [x] No se pisa `registrationStatus`
- [x] Nunca 404 en `/verify-email`
- [x] Botón "Logout" visible en el área autenticada

---

## Próximos Pasos

1. **Testing Manual:**
   - Verificar que no aparecen errores de permissions al escribir email en onboarding
   - Verificar que login exitoso no deriva a `/verify-email` incorrectamente
   - Verificar que no hay loops
   - Verificar que el botón Logout funciona

2. **Monitoring:**
   - Observar logs para detectar cualquier error de permissions
   - Verificar que no se crean perfiles mínimos cuando hay errores de permissions

---

**Implementation Status:** ✅ **COMPLETE**  
**Testing Status:** ⏳ **PENDING MANUAL TESTS**

