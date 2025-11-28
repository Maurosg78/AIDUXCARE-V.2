# DATA RESIDENCY VERIFICATION

**Fecha de Verificación:** [PENDIENTE - Requiere acceso a Firebase Console]  
**Verificado por:** [PENDIENTE]  
**Status:** ⚠️ **PENDIENTE DE VERIFICACIÓN**

---

## REGIONES REQUERIDAS

Todas las regiones deben estar en **`northamerica-northeast1`** (Montreal, Canada) para cumplir con PHIPA.

---

## REGIONES VERIFICADAS

### Firestore Database
- **Región Requerida:** `northamerica-northeast1` ✅
- **Región Actual:** [PENDIENTE - Verificar en Firebase Console]
- **Screenshot:** [Adjuntar screenshot de Firebase Console → Firestore → Settings → Database location]
- **Fecha de Verificación:** [Fecha]
- **Verificado por:** [Nombre]

**Pasos para verificar:**
1. Acceder a: https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/firestore
2. Click en "Settings" (gear icon)
3. Verificar "Database location"
4. Screenshot requerido

---

### Firebase Storage
- **Región Requerida:** `northamerica-northeast1` ✅
- **Región Actual:** [PENDIENTE - Verificar en Firebase Console]
- **Screenshot:** [Adjuntar screenshot de Firebase Console → Storage → Settings → Bucket location]
- **Fecha de Verificación:** [Fecha]
- **Verificado por:** [Nombre]

**Pasos para verificar:**
1. Acceder a: https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/storage
2. Click en "Settings" (gear icon)
3. Verificar "Bucket location"
4. Screenshot requerido

---

### Firebase Functions

#### processWithVertexAI
- **Región Requerida:** `northamerica-northeast1` ✅
- **Región Actual:** [PENDIENTE - Verificar después de redeploy]
- **Código:** `functions/index.js` línea 5 - ✅ CORREGIDO a `northamerica-northeast1`
- **Screenshot:** [Adjuntar después de redeploy]
- **Fecha de Verificación:** [Fecha]
- **Verificado por:** [Nombre]

#### sendConsentSMS
- **Región Requerida:** `northamerica-northeast1` ✅
- **Región Actual:** [PENDIENTE - Verificar después de redeploy]
- **Código:** `functions/index.js` - ✅ Usa `LOCATION` constante
- **Screenshot:** [Adjuntar después de redeploy]
- **Fecha de Verificación:** [Fecha]
- **Verificado por:** [Nombre]

#### vertexAIProxy
- **Región Requerida:** `northamerica-northeast1` ✅
- **Región Actual:** [PENDIENTE - Verificar después de redeploy]
- **Código:** `functions/index.js` - ✅ Usa `LOCATION` constante
- **Screenshot:** [Adjuntar después de redeploy]
- **Fecha de Verificación:** [Fecha]
- **Verificado por:** [Nombre]

**Pasos para verificar:**
1. Acceder a: https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/functions
2. Click en cada función → "Details"
3. Verificar "Region"
4. Screenshot requerido para cada función

---

## PROCESAMIENTO EXTERNO

### OpenAI Whisper
- **Región:** EE.UU. (requiere consentimiento explícito)
- **Endpoint:** `https://api.openai.com/v1/audio/transcriptions`
- **Consentimiento:** ✅ Implementado (`CrossBorderAIConsentService`)
- **CLOUD Act:** ✅ Disclosure implementado (`cloudActAcknowledged: boolean`)
- **Justificación Legal:** PHIPA s.18 - Consentimiento expreso obtenido

**Evidencia:**
- Código: `src/services/OpenAIWhisperService.ts`
- Consentimiento: `src/services/crossBorderAIConsentService.ts`
- CLOUD Act disclosure: `cloudActAcknowledged: boolean` ✅

---

### Vertex AI
- **Región:** [PENDIENTE - Verificar región real de procesamiento]
- **Proxy Function:** `northamerica-northeast1` ✅ (después de corrección)
- **Endpoint:** `https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy`
- **Consentimiento:** ✅ Requerido si procesamiento fuera de Canadá
- **CLOUD Act:** ⚠️ Aplicable si procesamiento en EE.UU.

**Nota:** Vertex AI puede procesar en Canadá o EE.UU. según configuración del proyecto GCP.

**Verificación requerida:**
1. Verificar región de Vertex AI en Google Cloud Console
2. Si es EE.UU. → Confirmar consentimiento explícito obtenido
3. Documentar justificación legal

---

## DIAGRAMA DE FLUJO DE DATOS

```
┌─────────────────┐
│   Browser       │
│   (Canadá)      │
└────────┬────────┘
         │
         │ Audio Recording
         ▼
┌─────────────────┐
│  Firestore      │ ← [VERIFICAR: ¿northamerica-northeast1?]
│  (Storage)      │
└────────┬────────┘
         │
         │ Audio → OpenAI Whisper
         ▼
┌─────────────────┐
│  OpenAI Whisper │ ← EE.UU. (requiere consentimiento ✅)
│  (Transcripción)│
└────────┬────────┘
         │
         │ Texto transcrito → Vertex AI
         ▼
┌─────────────────┐
│  Vertex AI      │ ← [VERIFICAR: ¿Canadá o EE.UU.?]
│  (SOAP Gen)     │
└────────┬────────┘
         │
         │ SOAP generado → Firestore
         ▼
┌─────────────────┐
│  Firestore      │ ← [VERIFICAR: ¿northamerica-northeast1?]
│  (Canadá)       │
└─────────────────┘
```

---

## MITIGACIÓN DE RIESGOS CLOUD ACT

### Riesgos Identificados:
1. **OpenAI Whisper (EE.UU.):** ✅ Mitigado con consentimiento explícito
2. **Vertex AI (posible EE.UU.):** ⚠️ Requiere verificación y consentimiento si aplica

### Controles Implementados:
- ✅ Consentimiento explícito requerido (`CrossBorderAIConsentService`)
- ✅ CLOUD Act disclosure (`cloudActAcknowledged: boolean`)
- ✅ Derecho a retirar consentimiento (`rightToWithdrawAcknowledged: boolean`)
- ✅ Pseudonymización de datos antes de analytics

---

## ACCIONES REQUERIDAS

### Inmediatas:
1. [ ] Verificar región de Firestore en Firebase Console
2. [ ] Verificar región de Storage en Firebase Console
3. [ ] Redeploy Functions con región corregida
4. [ ] Verificar región de Functions después de redeploy
5. [ ] Verificar región de Vertex AI en Google Cloud Console

### Documentación:
1. [ ] Adjuntar screenshots de todas las regiones
2. [ ] Documentar justificación legal si alguna región no es Canadá
3. [ ] Actualizar este documento con fechas y verificadores

---

## CUMPLIMIENTO PHIPA

**Requisito:** Personal health information must be stored in Canada unless explicit consent for cross-border transfer is obtained.

**Estado Actual:**
- ✅ Consentimiento explícito implementado
- ⚠️ Regiones requieren verificación
- ✅ CLOUD Act disclosure implementado

**Próximos Pasos:**
1. Verificar todas las regiones
2. Documentar cualquier procesamiento fuera de Canadá
3. Confirmar consentimiento explícito para cada flujo cross-border

---

**Última actualización:** Noviembre 2025  
**Próxima revisión:** Después de verificación de regiones

