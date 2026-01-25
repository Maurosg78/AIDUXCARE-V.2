# ✅ VERIFICACIÓN: Funciones Pendientes
## Fecha: 2026-01-21 | Estado: VERIFICACIÓN COMPLETA

---

## 📋 RESUMEN DE VERIFICACIÓN

### ✅ FUNCIONES A MANTENER (No Eliminar)

#### 1. `apiErasePatientData` ✅ **MANTENER**
- **Ubicación:** `functions/index.js:581`
- **Tipo:** `https.onRequest`
- **Uso:** 
  - ✅ Documentado en `COMPLIANCE_REMEDIATION_CHECKLIST.md` como necesario para compliance PIPEDA
  - ✅ Implementa "Right to be Forgotten" (PIPEDA Principle 4.1.8, PHIPA Section 52)
  - ✅ Genera certificados de eliminación con hash SHA-256
  - ✅ Retiene audit logs por 10 años (requisito legal)
- **Frontend:** 
  - Existe `src/services/dataErasureService.ts` que hace lo mismo desde el cliente
  - Pero el endpoint de Cloud Function es necesario para:
    - Validación de autorización HIC (Health Information Custodian)
    - Eliminación segura desde backend
    - Generación de certificados de eliminación
- **Decisión:** ✅ **MANTENER** - Crítico para compliance PIPEDA/PHIPA

---

#### 2. `sendWelcomeEmail` ✅ **MANTENER**
- **Ubicación:** `functions/sendWelcomeEmail.js:95`
- **Tipo:** `firestore.document('users/{userId}').onCreate` (trigger automático)
- **Uso:**
  - ✅ Trigger automático cuando se crea un documento en `users/{userId}`
  - ✅ Se ejecuta automáticamente sin llamada desde frontend
  - ⚠️ Actualmente solo hace `console.log` (no envía emails realmente)
  - ⚠️ Requiere configuración de servicio de email (SendGrid/Resend/Nodemailer)
- **Frontend:**
  - `src/services/EmailVerificationService.ts` intenta llamar a `/api/email/welcome` pero no existe
  - El trigger automático es independiente del frontend
- **Decisión:** ✅ **MANTENER** - Es un trigger automático, aunque no esté completamente implementado

---

#### 3. `monthlyTokenReset` / `manualTokenReset` ✅ **MANTENER**
- **Ubicación:** 
  - `functions/monthlyTokenReset.js` (raíz)
  - `functions/src/monthlyTokenReset.js` (src/)
- **Tipo:** 
  - `monthlyTokenReset`: `pubsub.schedule('0 0 1 * *')` (scheduled, 1er día del mes)
  - `manualTokenReset`: `https.onCall` (callable, para admins)
- **Uso:**
  - ✅ Scheduled function que se ejecuta automáticamente el 1er día de cada mes
  - ✅ Resetea tokens base a 1200 para todos los usuarios activos
  - ✅ Expira tokens comprados mayores a 12 meses
  - ✅ No se llama desde frontend (es automático)
- **Frontend:**
  - `src/services/tokenTrackingService.ts` tiene `resetMonthlyCycle()` pero es para uso manual
  - El scheduled function es independiente
- **Decisión:** ✅ **MANTENER** - Es una scheduled function crítica para el modelo de tokens
- **⚠️ ACCIÓN REQUERIDA:** Verificar cuál versión está activa y eliminar el duplicado

---

#### 4. `dailyMetricsRollup` / `updateRealTimeMetrics` ✅ **MANTENER**
- **Ubicación:** `functions/src/functions-metricsRollup.ts`
- **Tipo:** 
  - `dailyMetricsRollup`: `onSchedule('0 0 * * *')` (scheduled, diario)
  - `updateRealTimeMetrics`: `onDocumentCreated` (trigger automático)
- **Uso:**
  - ✅ Triggers automáticos para analytics
  - ✅ No se llaman desde frontend
- **Decisión:** ✅ **MANTENER** - Son triggers automáticos para analytics

---

## 📊 RESUMEN FINAL

| Función | Estado | Razón |
|---------|--------|-------|
| `apiErasePatientData` | ✅ **MANTENER** | Crítico para compliance PIPEDA/PHIPA |
| `sendWelcomeEmail` | ✅ **MANTENER** | Trigger automático de Firestore |
| `monthlyTokenReset` | ✅ **MANTENER** | Scheduled function crítica |
| `manualTokenReset` | ✅ **MANTENER** | Callable para admins |
| `dailyMetricsRollup` | ✅ **MANTENER** | Scheduled function para analytics |
| `updateRealTimeMetrics` | ✅ **MANTENER** | Trigger automático para analytics |

---

## ⚠️ ACCIONES REQUERIDAS

### 1. Verificar duplicado de `monthlyTokenReset`
- **Problema:** Existen dos versiones:
  - `functions/monthlyTokenReset.js` (raíz)
  - `functions/src/monthlyTokenReset.js` (src/)
- **Acción:** Verificar cuál está siendo exportada en `functions/index.js` o `functions/src/index.ts`
- **Decisión:** Eliminar el duplicado que no se esté usando

### 2. Completar implementación de `sendWelcomeEmail`
- **Problema:** Actualmente solo hace `console.log`, no envía emails
- **Acción:** Configurar servicio de email (SendGrid/Resend/Nodemailer) cuando sea necesario
- **Nota:** No es crítico para demo, pero debe estar listo para producción

---

## ✅ CONCLUSIÓN

**Todas las funciones pendientes deben MANTENERSE:**
- Son triggers automáticos o scheduled functions
- Son necesarias para compliance o funcionalidad crítica
- No se llaman desde frontend (son automáticas)

**No se eliminarán funciones adicionales en esta fase.**

---

**Generado:** 2026-01-21  
**Verificado por:** Cursor AI Assistant
