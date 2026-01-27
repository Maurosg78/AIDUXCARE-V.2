# 🧪 FASE 3 — SMS E2E Testing Checklist

**Objetivo:** Demostrar que el flujo SMS CA-ON funciona end-to-end sin reload, sin loops y sin navegación desde el gate.

**Fecha:** 2026-01-25  
**Tester:** [Tu nombre]  
**Ambiente:** UAT (aiduxcare-v2-uat-dev)

---

## 📋 PREPARACIÓN

### Precondiciones
- [ ] Proyecto Firebase: `aiduxcare-v2-uat-dev`
- [ ] Cloud Functions desplegadas:
  - [ ] `getConsentStatus` (northamerica-northeast1)
  - [ ] `acceptPatientConsentByToken` (northamerica-northeast1)
- [ ] Twilio configurado y funcionando
- [ ] Navegador con DevTools abierto (Console + Network)
- [ ] Firebase Console abierto (Functions logs)

---

## 🧪 CASO A — Paciente NUEVO (sin consentimiento)

### Precondiciones
- [ ] Jurisdicción: `CA-ON` (verificar en código o env)
- [ ] Paciente **sin** consentimiento previo en Firestore
- [ ] Paciente con número de teléfono válido
- [ ] Sesión activa (initial o follow-up)

### Pasos y Verificación

#### 1. Abrir workflow clínico
- [ ] Navegar a: `/workflow?type=initial&patientId=<PATIENT_ID>`
- [ ] **Log esperado:**
  ```
  [WORKFLOW] Patient loaded: <Patient Name>
  [WORKFLOW] Setting up consent polling for patient: <PATIENT_ID>
  ```

#### 2. Verificar que aparece ConsentGateScreen
- [ ] **Evidencia visual:** Gate modal visible
- [ ] **Log esperado:**
  ```
  [ConsentGate] 🚀 Component mounted/updated
  [ConsentGate] 🎨 Render check {channel: 'sms', hasValidConsent: false, ...}
  [WORKFLOW] Rendering ConsentGateScreen (no valid consent)
  ```

#### 3. Verificar resolución de canal
- [ ] **Log esperado:**
  ```
  [ConsentGate] 🎨 Render check {
    channel: 'sms',
    hasValidConsent: false,
    jurisdiction: 'CA-ON',
    willRenderGate: true
  }
  ```
- [ ] **Verificar:** `channel === 'sms'` (no 'none', no 'verbal')

#### 4. Verificar UI muestra solo SMS
- [ ] **Evidencia visual:**
  - [ ] Botón "Send Consent via SMS" visible
  - [ ] **NO** debe aparecer botón "Read & Record Verbal Consent" (a menos que sea CTA explícito)
  - [ ] Número de teléfono del paciente visible

#### 5. Enviar SMS real
- [ ] Click en "Send Consent via SMS"
- [ ] **Log esperado:**
  ```
  [ConsentGate] SMS consent link sent and state recorded: <phone>
  [SMS] Message sent successfully
  ```
- [ ] **Verificar en Twilio:** SMS enviado exitosamente
- [ ] **Evidencia visual:** Mensaje "SMS sent successfully!" aparece

#### 6. Paciente abre link
- [ ] Abrir link del SMS en navegador (o dispositivo móvil)
- [ ] **Verificar:** Portal de consentimiento carga correctamente
- [ ] **Log esperado (en portal):**
  ```
  [PatientConsentPortal] Token validated
  ```

#### 7. Paciente acepta consentimiento
- [ ] Click en "Aceptar" / "Grant Consent"
- [ ] **Log esperado (backend - Firebase Functions):**
  ```
  [acceptPatientConsentByToken] Consent granted
  [acceptPatientConsentByToken] Consent record created: {status: 'granted', consentMethod: 'digital'}
  ```
- [ ] **Verificar en Firestore:**
  - [ ] Collection `patient_consent`: Documento creado con `status: 'granted'`
  - [ ] Collection `patient_consent_tokens`: Token marcado como `used: true`

#### 8. Backend registra status === 'granted'
- [ ] **Verificar en Firestore Console:**
  ```javascript
  // Documento en patient_consent
  {
    patientId: "<PATIENT_ID>",
    status: "granted",
    consentStatus: "granted",
    consentMethod: "digital",
    ...
  }
  ```

#### 9. Frontend recibe actualización (polling)
- [ ] **Log esperado (frontend - polling):**
  ```
  [ConsentGate] Setting up consent polling for patient: <PATIENT_ID>
  [ConsentServer] Consent status retrieved: {hasValidConsent: false, ...}
  [ConsentServer] Consent status retrieved: {hasValidConsent: true, status: 'ongoing', consentMethod: 'digital'}
  [ConsentGate] ✅ Consent detected! Closing modal permanently...
  ```
- [ ] **Verificar:** Polling detecta cambio de `hasValidConsent: false` → `true`

#### 10. Gate desaparece sin reload
- [ ] **Evidencia visual:** Gate modal desaparece **sin** refresh de página
- [ ] **Log esperado:**
  ```
  [ConsentGate] 🎨 Render check {channel: 'none', hasValidConsent: true, ...}
  [ConsentGate] 🔒 Consent already valid → gate disabled
  [WORKFLOW] ✅ Valid consent found - workflow unlocked
  ```
- [ ] **Verificar:** No hay `window.location.reload()` ni `navigate()` desde ConsentGateScreen

#### 11. Workflow continúa
- [ ] **Evidencia visual:** UI clínica (tabs, análisis, etc.) aparece
- [ ] **Log esperado:**
  ```
  [WORKFLOW] Workflow detected: {routeType: 'initial', ...}
  [WORKFLOW] Rendering clinical UI (consent valid)
  ```

### ✅ Checklist Caso A
- [ ] Gate aparece: ✅
- [ ] Canal resuelto: `sms`
- [ ] SMS enviado: ✅
- [ ] Consent aceptado en portal: ✅
- [ ] Backend status: `granted`
- [ ] Gate desaparece sin reload: ✅
- [ ] Navegación desde gate: **NO** (verificado)

---

## 🧪 CASO B — Paciente con consentimiento previo

### Precondiciones
- [ ] Paciente con consentimiento ya otorgado (`status === 'granted'` en Firestore)
- [ ] Consentimiento puede ser `digital` o `verbal`

### Pasos y Verificación

#### 1. Abrir workflow
- [ ] Navegar a: `/workflow?type=initial&patientId=<PATIENT_ID_WITH_CONSENT>`
- [ ] **Log esperado:**
  ```
  [WORKFLOW] Patient loaded: <Patient Name>
  [ConsentServer] Consent status retrieved: {hasValidConsent: true, status: 'ongoing', consentMethod: 'digital'}
  ```

#### 2. Verificar resolución de canal
- [ ] **Log esperado:**
  ```
  [ConsentGate] 🎨 Render check {
    channel: 'none',
    hasValidConsent: true,
    jurisdiction: 'CA-ON',
    willRenderGate: false
  }
  ```
- [ ] **Verificar:** `channel === 'none'` (no 'sms', no 'verbal')

#### 3. Verificar ConsentGateScreen NO renderiza
- [ ] **Evidencia visual:** **NO** aparece gate modal
- [ ] **Log esperado:**
  ```
  [ConsentGate] 🔒 Consent already valid → gate disabled
  [WORKFLOW] ✅ Valid consent found - workflow unlocked
  ```
- [ ] **Verificar:** `ConsentGateScreen` retorna `null` (no renderiza)

#### 4. Flujo clínico continúa directo
- [ ] **Evidencia visual:** UI clínica aparece inmediatamente
- [ ] **Log esperado:**
  ```
  [WORKFLOW] Workflow detected: {routeType: 'initial', ...}
  [WORKFLOW] Rendering clinical UI (consent valid)
  ```

### ✅ Checklist Caso B
- [ ] Gate aparece: **NO**
- [ ] Canal resuelto: `none`
- [ ] Flujo directo: ✅

---

## 📱 MOBILE (Obligatorio declarar estado)

### Opción 1 — Validado
- [ ] Dispositivo: Safari iOS / Chrome Android
- [ ] Repetir **Caso A** completo en mobile
- [ ] Verificar:
  - [ ] CTA visible y clickeable
  - [ ] Portal abre correctamente
  - [ ] Aceptación funciona
  - [ ] Gate desaparece sin reload

**Estado:** ✅ VALIDADO  
**Dispositivo:** [Safari iOS / Chrome Android]  
**Notas:** [Cualquier observación]

### Opción 2 — Bloqueado explícitamente
- [ ] **Estado:** ❌ BLOQUEADO
- [ ] **Razón:** [Explicar por qué no se probó]
- [ ] **Ticket/Nota:** [Referencia si existe]

---

## 📊 LOGS A CAPTURAR

### Frontend (Browser Console)
```javascript
// Buscar estos logs:
[ConsentGate] 🎨 Render check
[ConsentGate] 🔒 Consent already valid → gate disabled
[ConsentServer] Consent status retrieved
[WORKFLOW] ✅ Valid consent found
[WORKFLOW] Rendering ConsentGateScreen
```

### Backend (Firebase Functions Logs)
```javascript
// Buscar estos logs:
[acceptPatientConsentByToken] Consent granted
[getConsentStatus] Consent found
```

### Firestore
- Verificar documentos en:
  - `patient_consent` (consent record)
  - `patient_consent_tokens` (token usado)

---

## 🚦 CRITERIOS DE ACEPTACIÓN

### Caso A — DEBE pasar
- ✅ Gate aparece cuando no hay consentimiento
- ✅ Canal resuelto correctamente (`sms`)
- ✅ SMS se envía exitosamente
- ✅ Consent se acepta en portal
- ✅ Backend registra `status: 'granted'`
- ✅ Gate desaparece **sin reload**
- ✅ **NO hay navegación** desde gate

### Caso B — DEBE pasar
- ✅ Gate **NO aparece** cuando hay consentimiento
- ✅ Canal resuelto correctamente (`none`)
- ✅ Flujo clínico continúa directo

### Mobile — DEBE declararse
- ✅ Validado en dispositivo real, O
- ❌ Bloqueado explícitamente con razón

---

## 📝 FORMATO DE ENTREGA

Cuando termines las pruebas, completa este formato:

```
FASE 3 — SMS E2E

Caso A (Paciente nuevo):
- Gate aparece: ✅ / ❌
- Canal resuelto: sms
- SMS enviado: ✅ / ❌
- Consent aceptado en portal: ✅ / ❌
- Backend status: granted
- Gate desaparece sin reload: ✅ / ❌
- Navegación desde gate: NO

Logs relevantes:
- [pegar líneas clave del console]

Caso B (Paciente con consentimiento):
- Gate aparece: NO
- Canal resuelto: none
- Flujo directo: ✅

Mobile:
- Estado: VALIDADO / BLOQUEADO
- Detalle breve: [explicación]
```

---

## 🔍 TROUBLESHOOTING

### Gate no aparece cuando debería
- Verificar: `consentStatus?.hasValidConsent === false`
- Verificar: `channel === 'sms'` (no 'none')
- Verificar: `ConsentGateScreen` está siendo renderizado por `ProfessionalWorkflowPage`

### Gate no desaparece después de consent
- Verificar: Polling está activo
- Verificar: `getConsentStatus` retorna `hasValidConsent: true`
- Verificar: No hay errores en console

### SMS no se envía
- Verificar: Twilio configurado correctamente
- Verificar: Número de teléfono válido
- Verificar: Logs de `SMSService`

---

**Preparado por:** AI Assistant (Cursor)  
**Fecha:** 2026-01-25  
**Para uso de:** Tester / CTO
