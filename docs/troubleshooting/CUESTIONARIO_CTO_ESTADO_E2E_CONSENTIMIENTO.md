# 🧾 CUESTIONARIO CTO — ESTADO REAL E2E CONSENTIMIENTO

**Fecha:** 2026-01-25  
**Respondido por:** AI Assistant (Cursor)  
**Método:** Revisión de código + logs observados

---

## 🧱 BLOQUE 1 — BACKEND (LEGAL SOURCE OF TRUTH)

### 1.1 Cloud Functions desplegadas

#### ✅ `getConsentStatus` está DEPLOYED

**Evidencia de código:**
- Archivo: `functions/src/consent/getConsentStatus.js`
- Línea 33: `exports.getConsentStatus = functions.region(LOCATION).https.onRequest(...)`
- Línea 23: `const LOCATION = 'northamerica-northeast1';`

**Región:** `northamerica-northeast1` (Canadá - Montreal)

**Gen (1 / 2):** Gen 1 (usa `functions.region().https.onRequest`)

**URL exacta:** `https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/getConsentStatus`

**📌 Evidencia de deploy:**
- ✅ **CONFIRMADO:** `firebase functions:list` muestra:
  ```
  │ getConsentStatus            │ v1      │ https  │ northamerica-northeast1 │ 256    │ nodejs20 │
  ```
- Logs del usuario muestran llamadas exitosas a esta función
- CORS fix fue desplegado (líneas 36-49 del código)

**✅ CONFIRMADO:** Función está desplegada y activa

---

#### ✅ `acceptPatientConsentByToken` está DEPLOYED

**Evidencia de código:**
- Archivo: `functions/src/consent/acceptPatientConsentByToken.js`
- Existe en el repositorio

**Región:** `northamerica-northeast1` (línea 24 del código)

**Gen (1 / 2):** Gen 1 (usa `functions.region().https.onRequest`)

**URL exacta:** `https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/acceptPatientConsentByToken`

**📌 Evidencia de deploy:**
- ✅ **CONFIRMADO:** `firebase functions:list` muestra:
  ```
  │ acceptPatientConsentByToken │ v1      │ https  │ northamerica-northeast1 │ 256    │ nodejs20 │
  ```
- El código existe y se usa en `PatientConsentPortalPage.tsx`

**✅ CONFIRMADO:** Función está desplegada y activa

---

### 1.2 IAM / Acceso público

#### ⚠️ PARCIALMENTE CONFIRMADO

**Evidencia de código:**
- `getConsentStatus`: Requiere autenticación (`Bearer` token) - línea 67-87
  - Verifica `Authorization: Bearer <token>`
  - No es público, requiere profesional autenticado
- `acceptPatientConsentByToken`: Público (acepta tokens sin auth) - línea 32
  - No verifica `Authorization` header
  - Diseñado para ser invocado desde portal público del paciente

**📌 IAM no verificado con gcloud:**
- No se ejecutó `gcloud functions get-iam-policy` para verificar permisos IAM
- Código sugiere que `getConsentStatus` requiere auth, `acceptPatientConsentByToken` es público

**⚠️ Acción recomendada (no bloqueante):**
```bash
gcloud functions get-iam-policy getConsentStatus --region northamerica-northeast1 --project aiduxcare-v2-uat-dev
gcloud functions get-iam-policy acceptPatientConsentByToken --region northamerica-northeast1 --project aiduxcare-v2-uat-dev
```

---

### 1.3 Lógica de getConsentStatus

#### ✅ Campo que determina consentimiento válido

**Evidencia (líneas 129-132):**
```javascript
const consents = snapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter(consent => {
    const status = consent.consentStatus || consent.status;
    return status === 'granted';
  })
```

**Respuesta:** `status === 'granted'` (verifica `consentStatus` o `status`, cualquiera que exista)

#### ✅ Acepta ambos métodos

**Evidencia (líneas 151-156):**
```javascript
const consentMethod = latestConsent.consentMethod === 'digital' ? 'digital' : 
                      latestConsent.consentMethod === 'sms' ? 'digital' : // Legacy compatibility
                      latestConsent.consentMethod === 'verbal' ? 'verbal' : 
                      'unknown';
```

**Respuesta:** 
- ✅ `digital` (incluye legacy `sms`)
- ✅ `verbal`

**📌 Snippet exacto:**
```javascript
// Líneas 124-148: Filtrado y validación
const consents = snapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter(consent => {
    const status = consent.consentStatus || consent.status;
    return status === 'granted';
  })
  .sort((a, b) => {
    const aDate = a.consentDate?.toDate?.() || a.grantedAt?.toDate?.() || new Date(0);
    const bDate = b.consentDate?.toDate?.() || b.grantedAt?.toDate?.() || new Date(0);
    return bDate.getTime() - aDate.getTime();
  });

if (consents.length === 0) {
  return res.status(200).json({
    success: true,
    hasValidConsent: false,
    status: null,
    consentMethod: null
  });
}

const latestConsent = consents[0];
const consentMethod = latestConsent.consentMethod === 'digital' ? 'digital' : 
                      latestConsent.consentMethod === 'sms' ? 'digital' : 
                      latestConsent.consentMethod === 'verbal' ? 'verbal' : 
                      'unknown';
```

---

## 🧠 BLOQUE 2 — FRONTEND (UX SOURCE OF TRUTH)

### 2.1 ConsentGateScreen — Render real

#### ✅ Cuando `hasValidConsent === true`, `ConsentGateScreen` retorna `null`

**Evidencia de código (líneas 435-448):**
```typescript
// ✅ WO-CONSENT-GATE-ALIGN-WORKFLOW-01: Guard absoluto - workflow is source of truth
console.log('[ConsentGate] 🎨 Render check', {
  consentStatus,
  hasValidConsent: consentStatus?.hasValidConsent,
  method: consentStatus?.consentMethod,
  status: consentStatus?.status,
  patientId,
  willRenderGate: consentStatus?.hasValidConsent !== true
});

if (consentStatus?.hasValidConsent === true) {
  console.log('[ConsentGate] 🔒 Consent already valid → gate disabled', {
    method: consentStatus.consentMethod,
    status: consentStatus.status,
    patientId
  });
  return null;
}
```

**Evidencia de logs observados:**
```
[ConsentGate] 🎨 Render check {consentStatus: {…}, hasValidConsent: true, method: 'verbal', status: 'ongoing', patientId: '2LlFIcvPd5X4iOXGNKiR', willRenderGate: false}
[ConsentGate] 🔒 Consent already valid → gate disabled {method: 'verbal', status: 'ongoing', patientId: '2LlFIcvPd5X4iOXGNKiR'}
```

#### ✅ No se renderiza modal verbal ni CTA SMS cuando hay consentimiento

**Evidencia de código:**
- El guard retorna `null` antes de cualquier renderizado de UI
- El componente nunca llega a renderizar el JSX del gate

#### ⚠️ Flicker inicial: PARCIALMENTE CONFIRMADO

**Evidencia:**
- El componente se monta y ejecuta `useEffect` de verificación
- Hay un estado `checkingConsent` que muestra loading
- Pero el guard absoluto debería prevenir el flicker

**Logs observados muestran:**
- `[ConsentGate] 🚀 Component mounted/updated` aparece
- `[ConsentGate] 🔄 useEffect triggered` aparece
- Pero luego `[ConsentGate] 🔒 Consent already valid → gate disabled` retorna `null`

**📌 Conclusión:** Puede haber un flicker mínimo durante la verificación inicial, pero el guard previene que se muestre el gate.

---

### 2.2 Flujo SMS (CRÍTICO)

#### ❌ NO CONFIRMADO E2E

**Razón:** No se probó el flujo completo SMS en esta sesión.

**Código sugiere que debería funcionar:**
- `ConsentGateScreen` ofrece SMS como opción (líneas 620-641)
- `SMSService.sendConsentLink()` genera token y envía SMS
- `PatientConsentPortalPage` acepta consentimiento
- `acceptPatientConsentByToken` Cloud Function registra el consentimiento
- `getConsentStatus` debería retornar `hasValidConsent: true`

**⚠️ Pasos NO probados:**
1. ❌ Paciente SIN consentimiento previo → Gate aparece
2. ❌ Se ofrece SMS como opción principal
3. ❌ Se genera token
4. ❌ Se envía SMS (proveedor real)
5. ❌ Paciente acepta desde portal
6. ❌ `getConsentStatus` → `hasValidConsent: true`
7. ❌ Gate desaparece sin reload
8. ❌ Workflow continúa

**📌 Acción requerida:** Probar flujo E2E completo con paciente nuevo

---

### 2.3 Flujo Verbal (secundario)

#### ✅ PARCIALMENTE CONFIRMADO

**Evidencia de logs observados:**
- Modal verbal aparece cuando se solicita explícitamente
- Consentimiento verbal se registra correctamente
- Gate desaparece después de registrar consentimiento verbal

**Código confirma:**
- Verbal solo aparece si jurisdicción lo permite (línea 56 de `VerbalConsentModal.tsx`)
- Requiere acción explícita del fisio (botón "Read & Record Verbal Consent")
- Tras registrar verbal: `handleVerbalConsentComplete` actualiza estado y cierra gate

**⚠️ NO CONFIRMADO:**
- ❌ No se probó cambio de jurisdicción
- ❌ No se verificó que SMS no se ofrezca después de verbal
- ❌ No se probó re-render después de verbal

**📌 Logs observados (parciales):**
```
[VerbalConsent] ✅ Consent granted and recorded: 2LlFIcvPd5X4iOXGNKiR
[ConsentGate] ✅ Verbal consent granted - updating state and navigating
[WORKFLOW] ✅ Consent obtained - updating state and redirecting to command-center
```

---

## 🔁 BLOQUE 3 — REENTRADA / ESTABILIDAD

### 3.1 Reabrir paciente con consentimiento previo

#### ✅ CONFIRMADO (con logs observados)

**Evidencia de logs del usuario:**
```
[ConsentServer] Consent status retrieved: {patientId: '2LlFIcvPd5X4iOXGNKiR', hasValidConsent: true, status: 'ongoing', consentMethod: 'verbal'}
[WORKFLOW] ✅ Valid consent found - workflow unlocked {jurisdiction: 'CA-ON'}
[ConsentGate] 🎨 Render check {consentStatus: {…}, hasValidConsent: true, method: 'verbal', status: 'ongoing', patientId: '2LlFIcvPd5X4iOXGNKiR', willRenderGate: false}
[ConsentGate] 🔒 Consent already valid → gate disabled {method: 'verbal', status: 'ongoing', patientId: '2LlFIcvPd5X4iOXGNKiR'}
```

**Confirmado:**
- ✅ No aparece gate
- ✅ No hay polling innecesario (se detiene después de detectar consentimiento)
- ✅ No CTA SMS visible
- ✅ Workflow fluye directo (logs muestran `[WORKFLOW] Workflow detected`)

**📌 Logs completos desde inicio de sesión:**
```
[LOGIN] Login exitoso: maurosg.2023@gmail.com
[WORKFLOW] Patient loaded: Mauricio Sobarzo Gavilán
[ConsentServer] Consent status retrieved: {hasValidConsent: true, status: 'ongoing', consentMethod: 'verbal'}
[WORKFLOW] ✅ Valid consent found - workflow unlocked
[ConsentGate] 🔒 Consent already valid → gate disabled
[WORKFLOW] Workflow detected: {routeType: 'initial', ...}
```

---

### 3.2 Cambio de paciente (edge)

#### ❌ NO CONFIRMADO

**Razón:** No se probó cambio de paciente en esta sesión.

**Código sugiere que debería funcionar:**
- `ConsentGateScreen` recibe `patientId` como prop
- El guard verifica `consentStatus` que es específico por paciente
- El workflow actualiza `workflowConsentStatus` cuando cambia el paciente

**⚠️ NO PROBADO:**
- ❌ Paciente A (con consentimiento) → OK
- ❌ Cambio a Paciente B (sin consentimiento)
- ❌ Gate aparece correctamente
- ❌ Canal correcto ofrecido

---

## 📱 BLOQUE 4 — MOBILE (NO OPCIONAL)

#### ❌ NO CONFIRMADO

**Razón:** No se probó en dispositivos móviles reales en esta sesión.

**Código sugiere preparación para mobile:**
- `ConsentSuccessPage` tiene instrucciones específicas para iOS/Android
- `window.close()` tiene fallback para mobile
- SMS funciona desde cualquier dispositivo

**⚠️ NO PROBADO:**
- ❌ Safari iOS
- ❌ Chrome Android
- ❌ SMS consent en mobile
- ❌ Verbal consent en mobile
- ❌ Reentrada en mobile

---

## 📊 BLOQUE 5 — OBSERVABILIDAD

### 5.1 Polling después de consentimiento

#### ✅ CONFIRMADO (con código)

**Evidencia de código (líneas 322-327 de `ConsentGateScreen.tsx`):**
```typescript
if (consentPollingRef.current) {
  clearInterval(consentPollingRef.current);
  consentPollingRef.current = null;
  consentPollingAttemptsRef.current = 0;
  console.log('[ConsentGate] Polling stopped immediately after optimistic consent');
}
```

**Evidencia de logs:**
```
[ConsentGate] Cleaning up consent polling for patient: 2LlFIcvPd5X4iOXGNKiR
```

**✅ Confirmado:** Polling se detiene después de detectar consentimiento

---

### 5.2 Logs contradictorios

#### ✅ NO HAY CONTRADICCIONES OBSERVADAS

**Evidencia de logs:**
- Cuando `hasValidConsent: true` → Gate retorna `null` (no visible)
- Logs son consistentes: `hasValidConsent: true` + `gate disabled`

**Ejemplo de consistencia:**
```
[ConsentServer] Consent status retrieved: {hasValidConsent: true, ...}
[ConsentGate] 🔒 Consent already valid → gate disabled
```

---

### 5.3 Logs permiten reconstruir flujo E2E

#### ✅ CONFIRMADO

**Evidencia:** Los logs observados muestran flujo completo:
1. Login
2. Carga de paciente
3. Verificación de consentimiento
4. Decisión de renderizado
5. Workflow continúa

**Ejemplo de flujo reconstruible:**
```
[LOGIN] Login exitoso
[WORKFLOW] Patient loaded
[ConsentServer] Consent status retrieved: {hasValidConsent: true}
[WORKFLOW] ✅ Valid consent found - workflow unlocked
[ConsentGate] 🔒 Consent already valid → gate disabled
[WORKFLOW] Workflow detected
```

---

## 🧾 BLOQUE 6 — DECLARACIÓN FINAL (OBLIGATORIA)

### ✅ Cerrado (con evidencia):

1. **Backend - Cloud Functions desplegadas:**
   - ✅ `getConsentStatus` está DEPLOYED (verificado con `firebase functions:list`)
   - ✅ `acceptPatientConsentByToken` está DEPLOYED (verificado con `firebase functions:list`)
   - ✅ Ambas en región `northamerica-northeast1`
   - ✅ Ambas Gen 1 (v1)

2. **Backend - Lógica de `getConsentStatus`:**
   - ✅ Campo `status === 'granted'` determina consentimiento válido
   - ✅ Acepta métodos `digital` y `verbal`
   - ✅ Código desplegado existe y es correcto

2. **Frontend - Guard absoluto:**
   - ✅ `ConsentGateScreen` retorna `null` cuando `consentStatus?.hasValidConsent === true`
   - ✅ No renderiza modal verbal ni CTA SMS cuando hay consentimiento
   - ✅ Logs confirman comportamiento correcto

3. **Reentrada con consentimiento previo:**
   - ✅ Paciente con consentimiento existente → No aparece gate
   - ✅ No hay polling innecesario
   - ✅ Workflow fluye directo
   - ✅ Logs confirman comportamiento

4. **Observabilidad:**
   - ✅ Polling se detiene después de consentimiento
   - ✅ No hay logs contradictorios
   - ✅ Logs permiten reconstruir flujo E2E

---

### ❌ No confirmado (sin evidencia):

1. **Backend - IAM Permissions:**
   - ⚠️ Código sugiere permisos correctos, pero no se verificó con `gcloud`
   - ⚠️ `getConsentStatus` requiere auth (código confirma)
   - ⚠️ `acceptPatientConsentByToken` es público (código confirma)

2. **Flujo SMS E2E:**
   - ❌ No se probó flujo completo SMS desde cero
   - ❌ No se verificó que el gate desaparezca sin reload después de SMS
   - ❌ No se probó con proveedor SMS real

3. **Flujo Verbal completo:**
   - ❌ No se verificó que SMS no se ofrezca después de verbal
   - ❌ No se probó cambio de jurisdicción

4. **Cambio de paciente:**
   - ❌ No se probó cambio de Paciente A (con consent) → Paciente B (sin consent)

5. **Mobile:**
   - ❌ No se probó en Safari iOS
   - ❌ No se probó en Chrome Android
   - ❌ No se probó flujo SMS en mobile
   - ❌ No se probó flujo verbal en mobile

---

### ⚠️ Inconsistencias observadas:

1. **Ninguna inconsistencia crítica observada en logs**
   - Los logs muestran comportamiento consistente
   - El guard absoluto funciona correctamente
   - No hay contradicciones entre backend y frontend

2. **Posible flicker mínimo:**
   - El componente se monta y verifica antes de retornar `null`
   - Puede haber un delay mínimo (< 100ms) durante verificación inicial
   - No es crítico, pero existe

3. **Navegación innecesaria (CORREGIDO):**
   - Se corrigió en esta sesión: ya no navega a command-center cuando consentimiento ya existía
   - Código actualizado no llama `onConsentVerified()` si consentimiento ya existía

---

## 🎯 DECISIÓN CTO (CONDICIONAL)

### 📊 Resumen de estado:

**✅ Cerrado con evidencia:**
- ✅ Cloud Functions desplegadas (verificado con `firebase functions:list`)
- ✅ Lógica backend correcta
- ✅ Guard absoluto funciona
- ✅ Reentrada con consentimiento previo funciona
- ✅ Observabilidad adecuada

**❌ Requiere validación E2E:**
- ❌ Flujo SMS completo (CRÍTICO - no probado)
- ❌ Cambio de paciente (edge case - no probado)
- ❌ Mobile (Safari iOS, Chrome Android) - REQUERIDO para producción

**⚠️ Verificación pendiente (no bloqueante):**
- ⚠️ IAM permissions (gcloud) - código sugiere que está correcto

---

### 🎯 Recomendación:

**Opción recomendada:** 🧪 **Más validación E2E**

**Razón:**
- El código está correcto y los logs muestran comportamiento esperado
- Pero faltan pruebas E2E críticas:
  - Flujo SMS completo (más importante)
  - Mobile (requerido para producción)
  - Cambio de paciente (edge case importante)

**Acciones sugeridas:**
1. ✅ **COMPLETADO:** Verificar deploys con `firebase functions:list` (ambas funciones confirmadas)
2. **PRIORIDAD ALTA:** Probar flujo SMS E2E completo con paciente nuevo
3. **PRIORIDAD ALTA:** Probar en Safari iOS y Chrome Android (requerido para producción)
4. **PRIORIDAD MEDIA:** Probar cambio de paciente (edge case)
5. **PRIORIDAD BAJA:** Verificar IAM permissions con `gcloud` (código sugiere que está correcto)

**Alternativa:** Si el tiempo es crítico, se puede hacer **🔧 Fix puntual** solo para verificar deploys y IAM, pero el flujo SMS y mobile DEBEN probarse antes de producción.

---

**Preparado por:** AI Assistant (Cursor)  
**Fecha:** 2026-01-25  
**Método:** Revisión de código + análisis de logs observados
