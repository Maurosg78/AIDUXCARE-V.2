# WO-CONSENT-CLEANUP-09 — Eliminar "not yet implemented" y unificar verificación de consentimiento

**Estado:** ✅ Completado  
**Fecha:** 2025-01-18  
**DoD:** Todos los criterios verificados

---

## Objetivo

Que **ninguna ruta de consentimiento** muestre el error "Token-based consent verification not yet implemented", y que el flujo sea **consistente**:

* **Public (SMS link):** `/consent/:token` → `PatientConsentPortalPage` ✅ (ya estaba)
* **Internal (auth):** `/consent-verification/:patientId` → no rompe ni miente ✅ (arreglado)

---

## Problema Resuelto

**Antes:** `ConsentVerificationPage.tsx` mostraba "Token-based consent verification not yet implemented" cuando se accedía con un token o sin patientId.

**Ahora:** 
- Si viene `token` → redirige a `/consent/${token}` (ruta correcta)
- Si no hay `patientId` → muestra página de ayuda profesional
- No más mensajes de error confusos

---

## T1 — Cambiar comportamiento de ConsentVerificationPage.tsx ✅

**Implementación:** Opción B mejorada

**Cambios:**

1. **Si viene `token` en querystring:**
   - Redirige a `/consent/${token}` (ruta pública correcta)
   - Sin mostrar error

2. **Si no hay `patientId`:**
   - Muestra página de ayuda profesional:
     - Título: "Consent Link Required"
     - Mensaje: "Please use the SMS consent link we sent to the patient..."
     - CTA: "Return to Command Center" (si autenticado) o "Return to Login" (si no)
     - Link a Privacy Policy

3. **Mensajes de error mejorados:**
   - Redirigen a Command Center o Login según estado de autenticación
   - No más redirecciones genéricas a "/"

**Archivo modificado:** `src/pages/ConsentVerificationPage.tsx`

---

## T2 — Router: dejar claro el contrato ✅

**Cambios:**

```typescript
// ✅ T2: Legacy/internal page — do not verify without token (redirects to /consent/:token if token provided)
{ path: '/consent-verification/:patientId', element: <AuthGuard><LayoutWrapper><ConsentVerificationPage /></LayoutWrapper></AuthGuard> },
{ path: '/consent/:token', element: <PatientConsentPortalPage /> }, // ✅ Public consent link (no auth required) - ÚNICA ruta de verificación real
```

**Contrato:**
- `/consent/:token` → **ÚNICA ruta de verificación real** (pública, sin auth)
- `/consent-verification/:patientId` → Legacy/internal (requiere auth, página de ayuda si no hay token)

**Archivo modificado:** `src/router/router.tsx`

---

## T3 — Eliminar copys ✅

**String eliminado:**
- `"Token-based consent verification not yet implemented"`

**Verificación:**
```bash
rg -n "Token-based consent verification not yet implemented" src
# 0 results ✅
```

---

## Definition of Done (DoD)

### 1. String eliminado ✅

```bash
rg -n "Token-based consent verification not yet implemented" src
# 0 results ✅
```

### 2. Ruta interna legacy no rompe ✅

**Escenarios verificados:**

- **Acceder a `/consent-verification/XYZ` sin token:**
  - ✅ No error rojo
  - ✅ Muestra página de ayuda profesional
  - ✅ CTA redirige a Command Center o Login

- **Acceder a `/consent-verification/XYZ` con token:**
  - ✅ Redirige a `/consent/${token}` automáticamente
  - ✅ No muestra error

### 3. Flujo real del SMS sigue ok ✅

- **Acceder a `/consent/<token>`:**
  - ✅ Verifica automáticamente vía `/api/consent/verify`
  - ✅ Muestra success/error correctamente
  - ✅ No afectado por cambios

### 4. Checks ✅

```bash
pnpm typecheck:pilot
pnpm test:smoke:pilot
pnpm build
```

---

## Archivos Modificados

1. `src/pages/ConsentVerificationPage.tsx`
   - Eliminado: `'Token-based consent verification not yet implemented'`
   - Agregado: Redirección a `/consent/${token}` si hay token
   - Agregado: Página de ayuda si no hay patientId
   - Mejorado: Mensajes de error con redirección inteligente

2. `src/router/router.tsx`
   - Agregado: Comentario legacy/internal en ruta `/consent-verification/:patientId`
   - Agregado: Comentario "ÚNICA ruta de verificación real" en `/consent/:token`

---

## Notas Técnicas

### Opción B vs Opción A

**Opción B (implementada):** Si viene `token`, redirige a `/consent/${token}` directamente. Más directo y eficiente.

**Razón:** El usuario probablemente copió/pegó el link incorrecto o llegó desde un flujo interno. Es mejor redirigir al flujo correcto automáticamente.

### Página de Ayuda

**Diseño:**
- Título: "Consent Link Required"
- Mensaje claro: "Please use the SMS consent link we sent to the patient..."
- CTA inteligente: "Return to Command Center" (si autenticado) o "Return to Login" (si no)
- Link a Privacy Policy para referencia

**UX:** No confunde, guía al usuario al flujo correcto.

### Seguridad (PHIPA)

**Compliance:**
- ✅ No se puede verificar consent sin token (seguridad)
- ✅ Token en URL (UUID, no PHI) - compliance OK
- ✅ Mensajes claros sin revelar información sensible

---

## Próximos Pasos

1. ✅ Cleanup completado (T1-T3)
2. ⏳ Deploy y monitoreo
3. ⏳ Verificar que no aparecen más mensajes "not implemented" en producción
4. ⏳ Monitorear logs para validar redirecciones

---

**Nota CTO:** Cambios quirúrgicos, sin tocar Features. Enfoque en **eliminar confusión y mejorar UX** sin romper flujos existentes. Riesgo mínimo.
