# 🧪 PLAN: Testing y Limpieza de Functions
## Fecha: 2026-01-21 | Prioridad: 🔴 CRÍTICA

---

## 📋 FASE 1: TESTING (15 minutos)

### ✅ Test 1: Login y Redirect (5 min)

**URL:** https://aiduxcare-v2-uat-dev.web.app/login

**Pasos:**
1. Abrir DevTools → Console
2. Hacer login con credenciales
3. Observar logs en consola

**Resultado Esperado:**
```
✅ [INFO] [LOGIN] Attempting sign-in {email: '...'}
✅ [INFO] Login exitoso: ...
✅ [INFO] [PROFILE] Profile loaded from Firestore {...}
✅ [INFO] [LOGIN] Profile complete (WO-13 criteria), redirecting to command-center
✅ Redirect directo a /command-center
```

**❌ NO debe aparecer:**
- `[LOGIN] Profile not loaded yet` (cuando profile existe)
- `[LOGIN] Attempting sign-in` (duplicado)
- Flash de onboarding antes de command-center

---

### ✅ Test 2: Transcripción de Audio (5 min)

**Pasos:**
1. En command-center, iniciar sesión clínica
2. Grabar audio (30-60 segundos)
3. Detener grabación
4. Observar logs en consola

**Resultado Esperado:**
```
✅ [FirebaseWhisper] Starting transcription via Cloud Function...
✅ [FirebaseWhisper] App state verified: {appExists: true, ...}
✅ [FirebaseWhisper] Functions instance created: {functionsExists: true, region: 'northamerica-northeast1'}
✅ [FirebaseWhisper] ✅ Transcription successful: {textLength: ..., language: ...}
```

**❌ NO debe aparecer:**
- `Service functions is not available`
- `Firebase Functions service is not available after retries`
- Errores de transcripción

---

### ✅ Test 3: Profile Loading Feedback (2 min)

**Pasos:**
1. Si el perfil tarda en cargar, observar UI
2. Verificar feedback visual

**Resultado Esperado:**
- Banner azul aparece: "Loading your profile..."
- Banner desaparece cuando profile carga
- No hay cuelgues indefinidos

---

### ✅ Test 4: Validación en Inglés (3 min)

**Pasos:**
1. Intentar login con campos vacíos
2. Click en "Sign In" sin llenar formulario

**Resultado Esperado:**
- Mensaje en inglés: "Please enter your email address"
- Mensaje en inglés: "Please enter your password"
- NO aparecen mensajes en español del navegador

---

## 📊 CHECKLIST DE VERIFICACIÓN

Después de testing, marca lo que funciona:

- [ ] Login funciona sin duplicados
- [ ] Redirect funciona correctamente (sin flash)
- [ ] Transcripción funciona (Functions disponible)
- [ ] No hay cuelgues en profile loading
- [ ] Mensajes de validación en inglés
- [ ] No hay errores críticos en consola

---

## 🧹 FASE 2: LIMPIEZA DE FUNCTIONS (Solo 100% Seguros)

### ✅ FUNCTIONS QUE PODEMOS ELIMINAR (100% Seguro)

Estas functions están **duplicadas** en `us-central1` y tienen versiones activas en `northamerica-northeast1`:

1. ✅ `processWithVertexAI(us-central1)` 
   - **Razón:** Versión activa en `northamerica-northeast1`
   - **Código usa:** `getFunctions(app, 'northamerica-northeast1')`
   - **Riesgo:** CERO

2. ✅ `receiveSMS(us-central1)`
   - **Razón:** Versión activa en `northamerica-northeast1`
   - **Código usa:** `northamerica-northeast1`
   - **Riesgo:** CERO

3. ✅ `sendConsentSMS(us-central1)`
   - **Razón:** Versión activa en `northamerica-northeast1`
   - **Código usa:** `northamerica-northeast1`
   - **Riesgo:** CERO

4. ✅ `smsDeliveryReceipt(us-central1)`
   - **Razón:** Versión activa en `northamerica-northeast1`
   - **Código usa:** `northamerica-northeast1`
   - **Riesgo:** CERO

**Total a eliminar:** 4 functions duplicadas

---

### ⚠️ FUNCTIONS QUE NECESITAN INVESTIGACIÓN

**NO eliminar sin revisar logs en Firebase Console:**

1. ❓ `dailyMetricsRollup(us-central1)`
   - **Acción:** Revisar logs en Firebase Console
   - **Si tiene 0 invocaciones en 30 días → Eliminar**
   - **Si tiene invocaciones → Investigar de dónde se llama**

2. ❓ `updateRealTimeMetrics(us-central1)`
   - **Acción:** Revisar logs en Firebase Console
   - **Si tiene 0 invocaciones en 30 días → Eliminar**
   - **Si tiene invocaciones → Investigar de dónde se llama**

3. ❓ Functions huérfanas en `northamerica-northeast1`:
   - `activateAccount`
   - `imagingOcrFromPdf`
   - `manualTokenReset`
   - `monthlyTokenReset`
   - `processImagingReport`
   - `processImagingReportStorage`
   - `sendActivationEmail`
   
   **Acción:** Revisar logs de cada una en Firebase Console

---

## 🚀 SCRIPT DE LIMPIEZA (Solo 100% Seguros)

```bash
#!/bin/bash
# Script para eliminar functions duplicadas en us-central1
# ⚠️ SOLO EJECUTAR DESPUÉS DE CONFIRMAR QUE TODO FUNCIONA EN TESTING

echo "🧹 Limpiando functions duplicadas en us-central1..."
echo "⚠️  Estas functions tienen versiones activas en northamerica-northeast1"
echo ""

# Functions duplicadas (100% seguro eliminar)
echo "1/4 Eliminando processWithVertexAI(us-central1)..."
firebase functions:delete processWithVertexAI --region=us-central1 --force

echo "2/4 Eliminando receiveSMS(us-central1)..."
firebase functions:delete receiveSMS --region=us-central1 --force

echo "3/4 Eliminando sendConsentSMS(us-central1)..."
firebase functions:delete sendConsentSMS --region=us-central1 --force

echo "4/4 Eliminando smsDeliveryReceipt(us-central1)..."
firebase functions:delete smsDeliveryReceipt --region=us-central1 --force

echo ""
echo "✅ Limpieza completada"
echo "📊 Ahorro estimado: ~$1.60/mes"
echo ""
echo "⚠️  Functions que necesitan investigación (NO eliminadas):"
echo "   - dailyMetricsRollup(us-central1)"
echo "   - updateRealTimeMetrics(us-central1)"
echo "   - 7 functions huérfanas en northamerica-northeast1"
```

---

## 📝 PASOS POST-TESTING

### Si TODO funciona:

1. **Ejecutar script de limpieza:**
   ```bash
   cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
   # Copiar y pegar el script de arriba, o ejecutar comandos uno por uno
   ```

2. **Verificar eliminación:**
   ```bash
   firebase functions:list
   # Verificar que las 4 functions ya no aparecen en us-central1
   ```

3. **Documentar:**
   - Marcar en este documento qué functions se eliminaron
   - Fecha de eliminación
   - Resultado del testing

---

### Si ALGO falla:

1. **NO ejecutar limpieza**
2. **Reportar el problema:**
   - Qué test falló
   - Logs de consola
   - Screenshots si aplica
3. **Revisar fixes antes de limpiar**

---

## 🎯 RESULTADO ESPERADO POST-LIMPIEZA

**Functions en producción (northamerica-northeast1 ONLY):**
```
✅ whisperProxy(northamerica-northeast1)
✅ processWithVertexAI(northamerica-northeast1)
✅ vertexAIProxy(northamerica-northeast1)
✅ sendConsentSMS(northamerica-northeast1)
✅ receiveSMS(northamerica-northeast1)
✅ smsDeliveryReceipt(northamerica-northeast1)
✅ apiCreateNote(northamerica-northeast1)
✅ apiUpdateNote(northamerica-northeast1)
✅ apiSignNote(northamerica-northeast1)
✅ apiAuditLog(northamerica-northeast1)
✅ apiConsent(northamerica-northeast1)
✅ apiReferral(northamerica-northeast1)
✅ apiErasePatientData(northamerica-northeast1)
✅ apiConsentVerify(northamerica-northeast1)
```

**us-central1:** Vacío (o solo functions que necesitan investigación)

---

## 📊 IMPACTO EN COSTOS

**Ahorro inmediato:**
- 4 functions eliminadas × $0.40/mes = **$1.60/mes**
- **$19.20/año**

**Ahorro potencial (si eliminamos todas las huérfanas):**
- 11 functions × $0.40/mes = **$4.40/mes**
- **$52.80/año**

---

## ✅ CHECKLIST FINAL

- [ ] Testing completado
- [ ] Todos los tests pasan
- [ ] Script de limpieza ejecutado
- [ ] Functions duplicadas eliminadas
- [ ] Verificación con `firebase functions:list`
- [ ] Documentación actualizada

---

**Preparado por:** AI Assistant  
**Fecha:** 2026-01-21  
**Estado:** Listo para testing
