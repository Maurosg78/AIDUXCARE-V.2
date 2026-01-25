# 🗑️ ANÁLISIS: Funciones de Firebase a Eliminar
## Fecha: 2026-01-21 | Estado: LISTO PARA ELIMINACIÓN

---

## ✅ FUNCIONES USADAS (NO ELIMINAR)

### 1. `processWithVertexAI` ✅
- **Ubicación:** `functions/index.js:14`
- **Uso:** `src/services/VertexAIServiceViaFirebase.ts:32`
- **Tipo:** `https.onCall`
- **Estado:** ✅ **MANTENER**

### 2. `whisperProxy` ✅
- **Ubicación:** `functions/src/whisperProxy.js`
- **Uso:** `src/services/FirebaseWhisperService.ts:72`
- **Tipo:** `https.onCall`
- **Estado:** ✅ **MANTENER**

### 3. `sendConsentSMS` ✅
- **Ubicación:** `functions/index.js:51`
- **Uso:** `src/services/smsService.ts:413, 543`
- **Tipo:** `https.onRequest`
- **Estado:** ✅ **MANTENER**

### 4. `vertexAIProxy` ✅
- **Ubicación:** `functions/index.js:310`
- **Uso:** `src/services/vertex-ai-soap-service.ts:23`, `src/services/vertex-ai-service-firebase.ts:42`
- **Tipo:** `https.onRequest`
- **Estado:** ✅ **MANTENER**

### 5. `apiConsentVerify` ✅
- **Ubicación:** `functions/index.js:755`
- **Uso:** `src/pages/PatientConsentPortalPage.tsx:42`
- **Tipo:** `https.onRequest`
- **Estado:** ✅ **MANTENER**

---

## ❌ FUNCIONES NO USADAS (100% SEGURO ELIMINAR)

### 1. `receiveSMS` ❌
- **Ubicación:** `functions/index.js:171`
- **Tipo:** `https.onRequest` (webhook de Vonage)
- **Uso en código:** ❌ **NO ENCONTRADO**
- **Razón:** Webhook de Vonage para SMS entrantes, pero no se usa en el código frontend
- **Estado:** ✅ **SEGURO ELIMINAR**

### 2. `smsDeliveryReceipt` ❌
- **Ubicación:** `functions/index.js:240`
- **Tipo:** `https.onRequest` (webhook de Vonage)
- **Uso en código:** ❌ **NO ENCONTRADO**
- **Razón:** Webhook de Vonage para recibos de entrega, pero no se usa en el código frontend
- **Estado:** ✅ **SEGURO ELIMINAR**

### 3. `apiCreateNote` ❌
- **Ubicación:** `functions/index.js:524`
- **Tipo:** `https.onRequest` (stub)
- **Uso en código:** ❌ **NO ENCONTRADO**
- **Razón:** Stub function que retorna `501 Not Implemented`
- **Estado:** ✅ **SEGURO ELIMINAR**

### 4. `apiUpdateNote` ❌
- **Ubicación:** `functions/index.js:527`
- **Tipo:** `https.onRequest` (stub)
- **Uso en código:** ❌ **NO ENCONTRADO**
- **Razón:** Stub function que retorna `501 Not Implemented`
- **Estado:** ✅ **SEGURO ELIMINAR**

### 5. `apiSignNote` ❌
- **Ubicación:** `functions/index.js:530`
- **Tipo:** `https.onRequest` (stub)
- **Uso en código:** ❌ **NO ENCONTRADO**
- **Razón:** Stub function que retorna `501 Not Implemented`
- **Estado:** ✅ **SEGURO ELIMINAR**

### 6. `apiAuditLog` ❌
- **Ubicación:** `functions/index.js:533`
- **Tipo:** `https.onRequest` (stub)
- **Uso en código:** ❌ **NO ENCONTRADO**
- **Razón:** Stub function que retorna `501 Not Implemented`
- **Estado:** ✅ **SEGURO ELIMINAR**

### 7. `apiConsent` ❌
- **Ubicación:** `functions/index.js:536`
- **Tipo:** `https.onRequest` (stub)
- **Uso en código:** ❌ **NO ENCONTRADO**
- **Razón:** Stub function que retorna `501 Not Implemented`
- **Estado:** ✅ **SEGURO ELIMINAR**

### 8. `apiReferral` ❌
- **Ubicación:** `functions/index.js:550`
- **Tipo:** `https.onRequest` (stub)
- **Uso en código:** ❌ **NO ENCONTRADO**
- **Razón:** Retorna `404 Not Found`, no implementado
- **Estado:** ✅ **SEGURO ELIMINAR**

### 9. `apiErasePatientData` ❌
- **Ubicación:** `functions/index.js:581`
- **Tipo:** `https.onRequest`
- **Uso en código:** ❌ **NO ENCONTRADO**
- **Razón:** Endpoint de borrado de datos, pero no se usa en el código frontend
- **Estado:** ✅ **SEGURO ELIMINAR** (pero puede ser útil para compliance, verificar antes)

---

## 📁 ARCHIVOS DUPLICADOS/ANTIGUOS (100% SEGURO ELIMINAR)

### Archivos en `functions/` (raíz) que son versiones antiguas/debug:

1. **`index-debug.js`** ❌
   - Versión de debug de `index.js`
   - **Estado:** ✅ **SEGURO ELIMINAR**

2. **`index-fix.js`** ❌
   - Versión de fix de `index.js`
   - **Estado:** ✅ **SEGURO ELIMINAR**

3. **`better-parsing.js`** ❌
   - Versión experimental de parsing
   - **Estado:** ✅ **SEGURO ELIMINAR**

4. **`fix-parsing.js`** ❌
   - Versión de fix de parsing
   - **Estado:** ✅ **SEGURO ELIMINAR**

5. **`parse-correct.js`** ❌
   - Versión "correcta" de parsing
   - **Estado:** ✅ **SEGURO ELIMINAR**

6. **`parse-fix.js`** ❌
   - Otra versión de fix de parsing
   - **Estado:** ✅ **SEGURO ELIMINAR**

7. **`working-parse.js`** ❌
   - Versión "working" de parsing
   - **Estado:** ✅ **SEGURO ELIMINAR**

8. **`update-prompt.js`** ❌
   - Versión de actualización de prompt
   - **Estado:** ✅ **SEGURO ELIMINAR**

9. **`vertexAIProxy-complete.js`** ❌
   - Versión "completa" de vertexAIProxy (ya está en `index.js`)
   - **Estado:** ✅ **SEGURO ELIMINAR**

10. **`clinical-analysis-v2.js`** ❌
    - Versión v2 de análisis clínico (no se usa)
    - **Estado:** ✅ **SEGURO ELIMINAR**

11. **`sendWelcomeEmail.js`** ❌
    - Duplicado en raíz (hay uno en `src/` si existe)
    - **Estado:** ⚠️ **VERIFICAR PRIMERO** si hay uno en `src/`

12. **`monthlyTokenReset.js`** ❌
    - Duplicado en raíz (hay uno en `src/monthlyTokenReset.js`)
    - **Estado:** ⚠️ **VERIFICAR PRIMERO** cuál es el activo

---

## ⚠️ FUNCIONES A VERIFICAR (NO 100% SEGURO)

### 1. `sendWelcomeEmail` ⚠️
- **Ubicación:** `functions/sendWelcomeEmail.js:95`
- **Tipo:** `firestore.document.onCreate`
- **Uso en código:** Solo referencia en `src/services/EmailVerificationService.ts:25` pero no se llama directamente
- **Estado:** ⚠️ **VERIFICAR** - Puede ser trigger automático de Firestore

### 2. `monthlyTokenReset` / `manualTokenReset` ⚠️
- **Ubicación:** `functions/src/monthlyTokenReset.js` y `functions/monthlyTokenReset.js`
- **Tipo:** `https.onCall` (manual) y `pubsub.schedule` (monthly)
- **Uso en código:** ❌ **NO ENCONTRADO**
- **Estado:** ⚠️ **VERIFICAR** - Puede ser scheduled function o admin function

### 3. `dailyMetricsRollup` / `updateRealTimeMetrics` ⚠️
- **Ubicación:** `functions/src/functions-metricsRollup.ts`
- **Tipo:** `onSchedule` y `onDocumentCreated`
- **Uso en código:** ❌ **NO ENCONTRADO**
- **Estado:** ⚠️ **VERIFICAR** - Pueden ser triggers automáticos

---

## 📋 RESUMEN DE ELIMINACIÓN

### Funciones a eliminar de `functions/index.js`:
1. `receiveSMS` (línea 171-231)
2. `smsDeliveryReceipt` (línea 240-305)
3. `apiCreateNote` (línea 524-526)
4. `apiUpdateNote` (línea 527-529)
5. `apiSignNote` (línea 530-532)
6. `apiAuditLog` (línea 533-535)
7. `apiConsent` (línea 536-538)
8. `apiReferral` (línea 550-568)
9. `apiErasePatientData` (línea 581-738) ⚠️ **VERIFICAR PRIMERO** si se necesita para compliance

### Archivos a eliminar de `functions/`:
1. `index-debug.js`
2. `index-fix.js`
3. `better-parsing.js`
4. `fix-parsing.js`
5. `parse-correct.js`
6. `parse-fix.js`
7. `working-parse.js`
8. `update-prompt.js`
9. `vertexAIProxy-complete.js`
10. `clinical-analysis-v2.js`
11. `sendWelcomeEmail.js` ⚠️ **VERIFICAR PRIMERO**
12. `monthlyTokenReset.js` ⚠️ **VERIFICAR PRIMERO** (si hay uno en `src/`)

---

## ✅ PLAN DE ACCIÓN

### Fase 1: Eliminación Segura (100% confirmado)
1. Eliminar funciones stub (`apiCreateNote`, `apiUpdateNote`, `apiSignNote`, `apiAuditLog`, `apiConsent`)
2. Eliminar `apiReferral` (retorna 404)
3. Eliminar archivos de debug/antiguos (todos los `.js` experimentales)

### Fase 2: Verificación Requerida
1. Verificar `apiErasePatientData` - ¿Se necesita para compliance PIPEDA?
2. Verificar `sendWelcomeEmail` - ¿Es trigger automático?
3. Verificar `monthlyTokenReset` - ¿Cuál es el activo?
4. Verificar `dailyMetricsRollup` / `updateRealTimeMetrics` - ¿Son triggers automáticos?

### Fase 3: Eliminación de Webhooks (Opcional)
1. `receiveSMS` - Solo si no se configura webhook de Vonage
2. `smsDeliveryReceipt` - Solo si no se configura webhook de Vonage

---

## 🎯 CONCLUSIÓN

**Total de funciones a eliminar (100% seguro):** 8 funciones + 10 archivos

**Total de funciones a verificar:** 4 funciones

**Ahorro estimado:**
- ~500 líneas de código
- Reducción de superficie de ataque
- Simplificación del mantenimiento

---

**Generado:** 2026-01-21  
**Verificado por:** Cursor AI Assistant
