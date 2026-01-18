# Pilot Auth Flow - Rutas y Redirecciones

**Fecha:** 17 de Enero, 2026  
**Estado:** ✅ Documentado y Verificado

---

## Flujo Completo: Register → Onboarding → Email Verification → Login → Command Center

### 1. Registro Inicial (`/register` → `/professional-onboarding`)

```
/register (RegisterPage)
  ↓
/professional-onboarding (ProfessionalOnboardingPage)
  - Usuario crea cuenta (si no autenticado)
  - Completa perfil (3 steps: identity → practice → consent)
  - Envía email de verificación
  - Muestra pantalla de éxito: "Check your email"
  - Hace signOut() automático
  - NO navega automáticamente (espera verificación de email)
```

**Ruta definida en:** `src/router/router.tsx:62, 69`

---

### 2. Verificación de Email (`/email-verified` o `/auth/action`)

```
Link de Firebase en email → /email-verified (EmailVerifiedPage)
  - Aplica código de verificación (applyActionCode)
  - Recarga user (currentUser.reload())
  - Muestra countdown 3 segundos
  - Navega a /login con mensaje de éxito
```

**Ruta definida en:** `src/router/router.tsx:70-71`

**Flujo alternativo:** `/auth/action` (AuthActionPage) - maneja acciones de Firebase Auth

---

### 3. Login (`/login`)

```
/login (LoginPage)
  - Usuario ingresa email/password
  - handlePostLoginRedirect() verifica perfil completo:
    - isProfileComplete(profile) = true → /command-center
    - isProfileComplete(profile) = false → /professional-onboarding
  - Si hay error de perfil (adblock, etc.) → AuthGuard maneja soft-fail
```

**Lógica de redirección:** `src/pages/LoginPage.tsx:33-58`

---

### 4. AuthGuard - Rutas Protegidas (`/command-center`, `/workflow`, etc.)

```
AuthGuard (wrapper de rutas protegidas)
  - Si no user → /login
  - Si email no verificado → /verify-email
  - Si perfil incompleto → /professional-onboarding
  - Si perfil completo → permite acceso a ruta
```

**Lógica de redirección:** `src/components/AuthGuard.tsx:125-215`

---

## Reglas de Redirección (Decisión Tree)

### Email Verificado pero Onboarding Incompleto

**Situación:** `user.emailVerified === true` pero `isProfileComplete(profile) === false`

**Acción:** 
- `AuthGuard` detecta perfil incompleto → `/professional-onboarding`
- `LoginPage.handlePostLoginRedirect()` detecta perfil incompleto → `/professional-onboarding`

**Evidencia:**
- `src/components/AuthGuard.tsx:162-212` - verifica `isProfileComplete()` y redirige a `/professional-onboarding`
- `src/pages/LoginPage.tsx:51-56` - verifica `isProfileComplete()` y redirige a `/professional-onboarding`

---

### Email Verificado + Onboarding Completo

**Situación:** `user.emailVerified === true` y `isProfileComplete(profile) === true`

**Acción:**
- `AuthGuard` permite acceso → ruta protegida (ej: `/command-center`)
- `LoginPage.handlePostLoginRedirect()` → `/command-center`

**Evidencia:**
- `src/components/AuthGuard.tsx:214-217` - si perfil completo, retorna `children`
- `src/pages/LoginPage.tsx:44-49` - si perfil completo, navega a `/command-center`

---

### Email Verificado (solo verificación, sin login)

**Situación:** Usuario clickea link de verificación en email

**Acción:**
- `EmailVerifiedPage` verifica email → muestra mensaje de éxito → `/login` con `successMessage`

**Evidencia:**
- `src/pages/EmailVerifiedPage.tsx:85-91` - navega a `/` (UnifiedLandingPage) con mensaje de éxito
- `LoginPage` muestra mensaje de éxito si viene en `location.state.message` (`src/pages/LoginPage.tsx:25-30`)

**Nota:** `EmailVerifiedPage` navega a `/` no a `/login` directamente, pero `UnifiedLandingPage` puede redirigir a `/login` según estado.

---

## Rutas Definidas (router.tsx)

```typescript
// Públicas (sin auth)
'/' → UnifiedLandingPage
'/login' → LoginPage
'/register' → RegisterPage
'/professional-onboarding' → ProfessionalOnboardingPage (permite sin auth)
'/onboarding' → Navigate to="/professional-onboarding" (redirect)
'/email-verified' → EmailVerifiedPage
'/verify-email' → EmailVerifiedPage (alias)
'/auth/action' → AuthActionPage

// Protegidas (requieren AuthGuard)
'/command-center' → CommandCenterPageSprint3
'/workflow' → ProfessionalWorkflowPage
'/patients' → PatientListPage
... otras rutas protegidas
```

---

## Archivos Clave para Redirecciones

1. **`src/components/AuthGuard.tsx`** - Guard principal de rutas protegidas
   - Líneas 125-131: No user → `/login`
   - Líneas 129-131: Email no verificado → `/verify-email`
   - Líneas 162-212: Perfil incompleto → `/professional-onboarding`

2. **`src/pages/LoginPage.tsx`** - Redirección post-login
   - Líneas 33-58: `handlePostLoginRedirect()` - decide `/command-center` vs `/professional-onboarding`

3. **`src/pages/ProfessionalOnboardingPage.tsx`** - Onboarding completion
   - Líneas 550-581: Muestra pantalla de éxito, NO navega automáticamente (espera verificación de email)

4. **`src/pages/EmailVerifiedPage.tsx`** - Post-verification
   - Líneas 85-91: Navega a `/` con mensaje de éxito (que puede mostrar `/login`)

---

## Verificación del Flujo (Manual Test)

Para verificar el flujo completo sin loops:

1. **Usuario nuevo (incógnito):**
   ```
   / → /register → /professional-onboarding
   → Completa onboarding → "Check your email"
   → Click link en email → /email-verified
   → Navega a /login con mensaje de éxito
   → Login → /command-center (si perfil completo)
   ```

2. **Usuario con email verificado pero perfil incompleto:**
   ```
   /login → Login exitoso
   → handlePostLoginRedirect() detecta perfil incompleto
   → /professional-onboarding
   ```

3. **Usuario completo:**
   ```
   /login → Login exitoso
   → handlePostLoginRedirect() detecta perfil completo
   → /command-center
   ```

---

## Cambios Recientes (WO-17, WO-18, WO-19, WO-21)

- **WO-17:** Bloqueo de signup duplicado en `ProfessionalOnboardingPage`
- **WO-18:** Garantía de salida de estado "Completing..." con `finally { setIsLoading(false) }`
- **WO-19:** `profileStatus` ('loading', 'complete', 'incomplete') en `AuthGuard` para evitar loops
- **WO-21:** Onboarding exitoso → "Check your email" → `/login` (sin auto-redirects directos)
