# 🔷 CUESTIONARIO ACLARATORIO ADICIONAL
## Segunda Capa de Auditoría - Requiere Evidencia Concreta

**Fecha:** Noviembre 2025  
**Propósito:** Segunda capa de auditoría con requisitos estrictos de evidencia  
**Enfoque:** "Demuéstralo o no existe"

---

## 🔷 1. INCONSISTENCIAS ENTRE CÓDIGO Y DECLARACIONES

### 1.1 Protocolo de Verificación de Declaraciones

#### **FORMATO ESTÁNDAR DE PREGUNTA:**

**"Has declarado que '[CARACTERÍSTICA X] existe', pero no lo encontramos en el repositorio.**

**Por favor entrega:**

1. **Ruta exacta del archivo:** `src/path/to/file.ts`
2. **Número de línea:** Línea 123
3. **Commit hash donde fue introducido:** `abc123def456`
4. **Explicación de por qué no aparece en el branch actual:** [Explicación]

**Si no puede demostrarlo → no existe."**

---

#### **EJEMPLOS DE VERIFICACIÓN REQUERIDA:**

**Ejemplo 1: Telehealth**
```
❓ Has declarado que "telehealth está implementado"
📋 Evidencia requerida:
   - Archivo: src/components/telehealth/VideoCall.tsx
   - Línea: [especificar]
   - Commit: [hash]
   - Si no existe → Confirmar que NO está implementado
```

**Ejemplo 2: Dual Audio Capture**
```
❓ Has declarado que "dual audio capture funciona"
📋 Evidencia requerida:
   - Archivo: src/services/DualAudioCaptureService.ts
   - Línea: [especificar función de diarization]
   - Commit: [hash]
   - Si no existe → Confirmar que NO está implementado
```

**Ejemplo 3: NPS**
```
❓ Has declarado que "NPS está capturado"
📋 Evidencia requerida:
   - Archivo: src/services/NPSService.ts
   - Línea: [especificar cálculo de NPS]
   - Commit: [hash]
   - Si no existe → Confirmar que NO está implementado
```

---

## 🔷 2. DATA RESIDENCY Y PROCESAMIENTO EXTERNO

### 2.1 Diagrama de Flujo de Datos Requerido

#### **PREGUNTA OBLIGATORIA:**

**"Explica mediante diagrama qué datos viajan a EE.UU., qué datos permanecen en Canadá, por qué es legal bajo PHIPA s.18, y cómo se mitigan riesgos del CLOUD Act."**

#### **EVIDENCIA REQUERIDA:**

**1. Diagrama de Flujo:**
```
┌─────────────────┐
│   Browser       │
│   (Canadá)      │
└────────┬────────┘
         │
         │ Audio Recording
         ▼
┌─────────────────┐
│  Firestore      │ ← ¿Región?
│  (Storage)      │
└────────┬────────┘
         │
         │ ¿Qué datos?
         ▼
┌─────────────────┐
│  OpenAI Whisper │ ← EE.UU.
│  (Transcripción)│
└────────┬────────┘
         │
         │ Texto transcrito
         ▼
┌─────────────────┐
│  Vertex AI      │ ← ¿Región?
│  (SOAP Gen)     │
└─────────────────┘
```

**2. Tabla de Flujos de Datos:**

| Tipo de Dato | Origen | Destino | Región | Consentimiento | CLOUD Act Risk |
|--------------|--------|---------|--------|----------------|----------------|
| Audio raw | Browser | Firestore | ¿Canadá? | ¿Requerido? | ¿Mitigado? |
| Audio | Firestore | OpenAI Whisper | EE.UU. | ✅ Sí | ⚠️ Riesgo |
| Texto transcrito | OpenAI | Vertex AI | ¿EE.UU.? | ✅ Sí | ⚠️ Riesgo |
| SOAP generado | Vertex AI | Firestore | ¿Canadá? | ✅ Sí | ✅ Mitigado |

**3. Políticas Aplicadas:**

**Evidencia requerida:**
- ✅ Consentimiento explícito: `CrossBorderAIConsentService` ✅
- ✅ CLOUD Act disclosure: `cloudActAcknowledged: boolean` ✅
- ⚠️ VPC Service Controls: ❌ No encontrado
- ⚠️ Data Loss Prevention: ❌ No encontrado

**4. Justificación Legal (PHIPA s.18):**

**Evidencia requerida:**
- ✅ Consentimiento expreso: `consentScope: 'ongoing' | 'session-only'`
- ✅ CLOUD Act acknowledgment: `cloudActAcknowledged: boolean`
- ✅ Derecho a retirar: `rightToWithdrawAcknowledged: boolean`

**Código relevante:**
- `src/services/crossBorderAIConsentService.ts` - Implementa consentimiento
- `src/services/patientConsentService.ts` - Maneja consentimiento de paciente

---

## 🔷 3. CONSENTIMIENTO

### 3.1 Bloqueo de Captura de Audio

#### **PREGUNTA CRÍTICA:**

**"Muéstrame exactamente dónde se bloquea la captura de audio, no solo el análisis.**

**Si no existe ese bloqueo, provee un plan de implementación con archivo, líneas y ETA."**

#### **EVIDENCIA ACTUAL:**

**✅ Bloqueo de SOAP (implementado):**
- **Archivo:** `src/pages/ProfessionalWorkflowPage.tsx`
- **Línea:** 1354-1364
- **Código:**
  ```typescript
  const hasConsent = await PatientConsentService.hasConsent(patientId);
  if (!hasConsent) {
    setAnalysisError('Patient consent is required...');
    return; // Block AI processing until consent is given
  }
  ```

**❌ Bloqueo de Grabación (NO implementado):**
- **Archivo:** `src/components/RealTimeAudioCapture.tsx`
- **Línea:** 99-114 (`handleStartCapture`)
- **Estado:** NO verifica consentimiento antes de iniciar grabación

#### **PLAN DE IMPLEMENTACIÓN REQUERIDO:**

**Si el bloqueo NO existe, el implementador debe proporcionar:**

1. **Archivo a modificar:** `src/components/RealTimeAudioCapture.tsx`
2. **Líneas a cambiar:** Línea 99 (`handleStartCapture`)
3. **Código propuesto:**
   ```typescript
   const handleStartCapture = async () => {
     // ✅ AGREGAR: Verificar consentimiento
     const patientId = currentPatient?.id;
     if (patientId) {
       const hasConsent = await PatientConsentService.hasConsent(patientId);
       if (!hasConsent) {
         setErrorMessage('Patient consent is required before recording');
         return; // Bloquear grabación
       }
     }
     
     // Continuar con grabación...
   }
   ```
4. **ETA:** [Fecha estimada de implementación]

---

### 3.2 Idioma y Método de Obtención

#### **PREGUNTA:**

**"Proporciona screenshot de la colección `patient_consents` mostrando:**
- **idioma usado**
- **método de obtención**

**Si no aparece, ¿cuál es la fecha estimada para incluirlo?"**

#### **EVIDENCIA ACTUAL:**

**Código revisado:** `src/services/patientConsentService.ts` línea 212-273

**Campos actuales en Firestore:**
```typescript
{
  patientId: string;
  patientName: string;
  clinicName: string;
  physiotherapistId: string;
  physiotherapistName: string;
  consentScope: 'ongoing' | 'session-only' | 'declined';
  consented: boolean;
  consentDate: Date;
  consentVersion: string; // ✅ '1.0.0'
  tokenUsed: string;
  digitalSignature?: string; // ✅ Opcional
  ipAddress?: string; // ✅
  userAgent?: string; // ✅
  // ❌ FALTA: idioma usado
  // ❌ FALTA: método de obtención
}
```

**🔴 ACCIÓN REQUERIDA:**
- Agregar campos: `languageUsed: string`, `obtainmentMethod: 'SMS' | 'Portal' | 'Email'`
- **ETA requerida:** [Fecha]

---

## 🔷 4. TELEHEALTH

### 4.1 Verificación de Implementación

#### **PREGUNTA:**

**"Indica:**
- **proveedor telehealth**
- **archivo donde está la integración**
- **cómo se captura audio dual**
- **cómo se gestiona diarización**

**Si no puedes mostrarlo, confirma explícitamente que telehealth NO está implementado."**

#### **BÚSQUEDA REALIZADA:**

**Comandos ejecutados:**
```bash
grep -r "telehealth\|zoom\|meet\|doxy\|jitsi\|video.*call" src/ --include="*.ts" --include="*.tsx"
```

**Resultados:**
- ❌ **0 archivos encontrados** con integración telehealth
- ❌ **0 componentes** de video call
- ❌ **0 servicios** de telehealth

#### **RESPUESTA REQUERIDA:**

**Si el implementador afirma que telehealth existe, debe proporcionar:**

1. **Proveedor:** [Zoom/Meet/Doxy/Jitsi/Propio]
2. **Archivo de integración:** `src/[ruta exacta]`
3. **Audio dual:** `src/[archivo]` línea [número]
4. **Diarization:** `src/[archivo]` línea [número]

**Si NO puede proporcionar → Confirmar explícitamente:**
```
"Telehealth NO está implementado en el código actual.
Estado: NO DISPONIBLE
ETA: [Fecha estimada o "No planificado"]
```

---

## 🔷 5. AI PIPELINE

### 5.1 Verification Layer

#### **PREGUNTA:**

**"Describe exactamente qué define como 'verification layer' y cómo se diferencia de validaciones distribuidas.**

**Si no existe un módulo dedicado, confirma que NO existe verification layer independiente."**

#### **EVIDENCIA ACTUAL:**

**Validaciones distribuidas encontradas:**

1. **Schema Validation:**
   - Archivo: `src/orchestration/validation/response-validator.ts`
   - Propósito: Valida estructura de respuesta

2. **SOAP Objective Validation:**
   - Archivo: `src/core/soap/SOAPObjectiveValidator.ts`
   - Propósito: Valida que solo se mencionen regiones testeadas

3. **Clinical Schema Validation:**
   - Archivo: `src/orchestration/schemas/clinical-note-schema.ts`
   - Propósito: Valida campos requeridos y completitud

4. **Confidence Scoring:**
   - Archivo: `src/core/assistant/rails.ts` línea 136
   - Propósito: Calcula confianza de consultas

**❌ NO existe:**
- Módulo dedicado llamado "VerificationLayer"
- Sistema centralizado de verificación post-generación
- Detección automática de alucinaciones

#### **RESPUESTA REQUERIDA:**

**El implementador debe confirmar:**

```
"NO existe un 'verification layer' independiente como módulo dedicado.
Existen validaciones distribuidas en múltiples archivos:
- response-validator.ts (validación de schema)
- SOAPObjectiveValidator.ts (validación de regiones)
- rails.ts (confidence scoring)

Estas validaciones NO constituyen un 'verification layer' centralizado.
```

**O proporcionar:**
- Archivo del verification layer dedicado
- Cómo se diferencia de validaciones distribuidas

---

### 5.2 Whisper y Múltiples Speakers

#### **PREGUNTA:**

**"Proveer parámetro Whisper que habilita diarization.**

**Si no existe → confirmar que AiduxCare NO puede separar speakers actualmente."**

#### **EVIDENCIA ACTUAL:**

**Código revisado:** `src/services/OpenAIWhisperService.ts`

**Parámetros actuales:**
```typescript
const formData = new FormData();
formData.append('file', audioBlob);
formData.append('model', 'whisper-1');
formData.append('language', languageHint || 'auto');
// ❌ NO hay parámetro de diarization
```

**OpenAI Whisper API soporta diarization mediante:**
- Parámetro `response_format: 'verbose_json'` con `speaker_labels: true`
- **PERO:** No encontrado en código actual

#### **RESPUESTA REQUERIDA:**

**El implementador debe confirmar:**

```
"AiduxCare NO puede separar múltiples speakers actualmente.
Whisper API soporta diarization, pero NO está implementado en el código.

Para implementar:
- Agregar parámetro: response_format: 'verbose_json'
- Agregar parámetro: speaker_labels: true
- Procesar respuesta con segmentos por speaker

Estado: NO IMPLEMENTADO
ETA: [Fecha o "No planificado"]
```

**O proporcionar:**
- Línea de código donde se habilita diarization
- Parámetros específicos usados

---

## 🔷 6. WSIB / MVA

### 6.1 Generación de Documentos Oficiales

#### **PREGUNTA:**

**"Entrega:**
- **template**
- **archivo donde se genera**
- **disclaimers aplicados**

**Si no puedes: confirma que AiduxCare NO genera documentos oficiales y solo puede generar 'support drafts'."**

#### **EVIDENCIA ACTUAL:**

**Documentación encontrada:**
- ✅ `docs/strategy/WSIB_MVA_REPORT_FORMATS.md` - Requisitos documentados

**Código encontrado:**
- ❌ **0 templates** de WSIB/MVA
- ❌ **0 funciones** de generación
- ❌ `src/services/pdf-generator.ts` - Existe pero NO tiene templates WSIB/MVA

**Búsqueda realizada:**
```bash
grep -r "WSIB\|MVA\|Form.*8\|Form.*26\|OCF" src/ --include="*.ts" --include="*.tsx"
```

**Resultados:**
- ❌ Solo referencias en documentación, NO en código

#### **RESPUESTA REQUERIDA:**

**El implementador debe confirmar:**

```
"AiduxCare NO genera documentos oficiales WSIB/MVA actualmente.

Estado:
- Documentación de requisitos: ✅ COMPLETA
- Templates implementados: ❌ NO
- Generación automática: ❌ NO
- Disclaimers: ❌ NO

Solo puede generar 'support drafts' basados en SOAP notes.
Los documentos oficiales deben ser completados manualmente por el fisioterapeuta.

ETA para implementación: [Fecha o "No planificado"]
```

**O proporcionar:**
- Template: `src/templates/WSIBForm8.tsx`
- Generación: `src/services/WSIBReportGenerator.ts` línea [número]
- Disclaimers: `src/content/WSIBDisclaimers.ts`

---

## 🔷 7. NPS, RETENCIÓN, MÉTRICAS

### 7.1 Net Promoter Score (NPS)

#### **PREGUNTA:**

**"Proveer archivo exacto donde se implementa NPS.**

**Si no existe, confirmar que NPS NO está implementado y debe ser añadido antes del piloto."**

#### **BÚSQUEDA REALIZADA:**

```bash
grep -r "NPS\|net.*promoter\|promoter.*score\|satisfaction.*survey" src/ --include="*.ts" --include="*.tsx" -i
```

**Resultados:**
- ❌ **0 archivos** con implementación de NPS
- ✅ `src/services/feedbackService.ts` - Feedback estructurado pero NO NPS

#### **RESPUESTA REQUERIDA:**

```
"NPS NO está implementado en el código actual.

Estado:
- Cálculo de NPS: ❌ NO
- Encuesta de NPS: ❌ NO
- Captura de score: ❌ NO

Debe ser añadido antes del piloto.

ETA: [Fecha requerida]
```

**O proporcionar:**
- Archivo: `src/services/NPSService.ts`
- Línea: [cálculo de NPS]

---

### 7.2 Exportación Automática Semanal

#### **PREGUNTA:**

**"Muéstrame Cloud Function con:**
- **schedule()**
- **timezone**
- **trigger semanal**

**Si no existe → confirma que la exportación es manual."**

#### **BÚSQUEDA REALIZADA:**

**Firebase Functions revisadas:**
- `functions/index.js` - NO tiene scheduled functions
- `functions/clinical-analysis-v2.js` - NO tiene scheduled functions

**Búsqueda:**
```bash
grep -r "schedule\|cron\|weekly\|semanal" functions/ --include="*.js"
```

**Resultados:**
- ❌ **0 scheduled functions** encontradas

#### **RESPUESTA REQUERIDA:**

```
"Exportación automática semanal NO está implementada.

Estado:
- Exportación manual: ✅ SÍ (AnalyticsService.exportAnalyticsData())
- Scheduled function: ❌ NO
- Cron job: ❌ NO

La exportación debe ser ejecutada manualmente mediante:
- Llamada a AnalyticsService.exportAnalyticsData(dateRange, format)

ETA para automatización: [Fecha o "No planificado"]
```

**O proporcionar:**
- Cloud Function: `functions/scheduled-export.js`
- Schedule: `schedule('every monday 00:00')`
- Timezone: `timeZone: 'America/Toronto'`

---

## 🔷 8. POLÍTICA DE NO USO DE PHI PARA TRAINING

### 8.1 Documentación Legal Requerida

#### **PREGUNTA:**

**"Proveer documento legal o `docs/` donde quede explícito que 'AiduxCare no usa PHI para entrenamiento ni para ningún fin no autorizado.'**

**Si no existe → debe ser creado antes del piloto."**

#### **BÚSQUEDA REALIZADA:**

**Documentos revisados:**
- `docs/compliance/` - No encontré política explícita
- `docs/enterprise/ARCHITECTURE.md` - Menciona pseudonymización pero NO política explícita
- `src/services/pseudonymizationService.ts` - Implementa pseudonymización pero NO documenta política

#### **RESPUESTA REQUERIDA:**

**El implementador debe confirmar:**

```
"Política explícita de NO uso de PHI para training NO está documentada.

Estado:
- Pseudonymización implementada: ✅ SÍ
- Política documentada: ❌ NO
- Términos de servicio: ⚠️ Requiere verificación

Debe ser creada antes del piloto en:
- docs/compliance/NO_PHI_TRAINING_POLICY.md
- Términos de servicio (actualizar)
- Privacy Policy (actualizar)

ETA: [Fecha requerida antes del piloto]
```

**O proporcionar:**
- Documento: `docs/compliance/NO_PHI_TRAINING_POLICY.md`
- Términos: `docs/legal/TERMS_OF_SERVICE.md` línea [número]
- Privacy Policy: `docs/legal/PRIVACY_POLICY.md` línea [número]

---

## 🔷 9. REGION MISMATCH DETECTION

### 9.1 Verificación de Regiones

#### **PREGUNTA:**

**"Proveer screenshot REAL de:**
- **Firestore location**
- **Storage bucket**
- **Functions region**
- **Vertex AI region**

**Si uno solo no es Canada-Central → explicar plan de migración."**

#### **INCONSISTENCIAS ENCONTRADAS:**

**Código muestra regiones diferentes:**

1. **Firebase Functions (`functions/index.js` línea 5):**
   ```javascript
   const LOCATION = 'us-central1'; // ❌ INCORRECTO
   ```

2. **Función específica (`functions/clinical-analysis-v2.js` línea 12):**
   ```javascript
   location: 'northamerica-northeast1', // ✅ CORRECTO
   ```

3. **Referencia (`src/core/assistant/assistantAdapter.ts` línea 64):**
   ```typescript
   const region = 'europe-west1'; // ❌ INCORRECTO (comentario dice 'northamerica-northeast1')
   ```

#### **EVIDENCIA REQUERIDA:**

**Screenshots obligatorios de Firebase Console:**

1. **Firestore Database:**
   - URL: `https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/firestore`
   - Sección: Settings → Database location
   - **Requerido:** `northamerica-northeast1` (Montreal, Canada)

2. **Firebase Storage:**
   - URL: `https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/storage`
   - Sección: Settings → Bucket location
   - **Requerido:** `northamerica-northeast1`

3. **Firebase Functions:**
   - URL: `https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/functions`
   - Cada función → Details → Region
   - **Requerido:** `northamerica-northeast1`

4. **Vertex AI:**
   - Verificar región de procesamiento
   - **Requerido:** Canadá o consentimiento explícito

#### **PLAN DE MIGRACIÓN REQUERIDO:**

**Si alguna región NO es Canadá, el implementador debe proporcionar:**

1. **Regiones actuales:**
   - Firestore: [Región actual]
   - Storage: [Región actual]
   - Functions: [Región actual]
   - Vertex AI: [Región actual]

2. **Plan de migración:**
   - Fecha de migración: [Fecha]
   - Pasos: [Lista de pasos]
   - Riesgo de downtime: [Sí/No]
   - Rollback plan: [Plan]

3. **Justificación temporal:**
   - ¿Por qué no está en Canadá ahora?
   - ¿Cuándo será migrado?
   - ¿Hay consentimiento explícito para procesamiento fuera de Canadá?

---

## 🔷 10. PREGUNTA FINAL DE CIERRE (OBLIGATORIA)

### 10.1 Declaración Final

#### **PREGUNTA OBLIGATORIA:**

**"¿Existe alguna característica que hayas declarado como implementada, pero que no esté presente en el branch actual, no esté en staging, o no esté verificada por un auditor externo?**

**Responde SÍ o NO.**

**Si SÍ → lista exactamente cuáles, dónde deberían estar, y cuándo estarán disponibles."**

---

#### **RESPUESTA REQUERIDA (FORMATO):**

```
RESPUESTA: [SÍ / NO]

Si SÍ, lista:

1. [Característica]
   - Dónde debería estar: [ruta]
   - Estado actual: [No implementado / En desarrollo / En staging]
   - Fecha estimada: [Fecha]
   - Verificado por auditor: [Sí / No]

2. [Característica]
   - Dónde debería estar: [ruta]
   - Estado actual: [No implementado / En desarrollo / En staging]
   - Fecha estimada: [Fecha]
   - Verificado por auditor: [Sí / No]

[...]
```

---

#### **RESPUESTA BASADA EN ANÁLISIS DE CÓDIGO:**

**Basado en análisis exhaustivo del código, las siguientes características fueron declaradas pero NO están implementadas:**

1. **Telehealth**
   - Dónde debería estar: `src/components/telehealth/` o `src/services/telehealthService.ts`
   - Estado actual: ❌ NO implementado
   - Verificado por auditor: ✅ SÍ (análisis de código)

2. **Dual Audio Capture**
   - Dónde debería estar: `src/services/DualAudioCaptureService.ts`
   - Estado actual: ❌ NO implementado
   - Verificado por auditor: ✅ SÍ (análisis de código)

3. **NPS (Net Promoter Score)**
   - Dónde debería estar: `src/services/NPSService.ts`
   - Estado actual: ❌ NO implementado
   - Verificado por auditor: ✅ SÍ (análisis de código)

4. **Exportación Automática Semanal**
   - Dónde debería estar: `functions/scheduled-export.js` con `schedule()`
   - Estado actual: ❌ NO implementado (solo exportación manual)
   - Verificado por auditor: ✅ SÍ (análisis de código)

5. **Documentos WSIB/MVA**
   - Dónde debería estar: `src/templates/WSIBForm8.tsx` o `src/services/WSIBReportGenerator.ts`
   - Estado actual: ❌ NO implementado (solo documentación de requisitos)
   - Verificado por auditor: ✅ SÍ (análisis de código)

6. **Bloqueo de Grabación sin Consentimiento**
   - Dónde debería estar: `src/components/RealTimeAudioCapture.tsx` línea 99
   - Estado actual: ⚠️ PARCIAL (bloquea SOAP pero NO grabación)
   - Verificado por auditor: ✅ SÍ (análisis de código)

7. **Verification Layer Centralizado**
   - Dónde debería estar: `src/core/ai/VerificationLayer.ts`
   - Estado actual: ⚠️ PARCIAL (validaciones distribuidas, no centralizadas)
   - Verificado por auditor: ✅ SÍ (análisis de código)

8. **Política Explícita de NO uso de PHI para Training**
   - Dónde debería estar: `docs/compliance/NO_PHI_TRAINING_POLICY.md`
   - Estado actual: ❌ NO documentada explícitamente
   - Verificado por auditor: ✅ SÍ (análisis de documentación)

---

## 📋 CHECKLIST DE EVIDENCIA REQUERIDA

### **Para cada característica declarada, el implementador debe proporcionar:**

- [ ] **Ruta exacta del archivo**
- [ ] **Número de línea específico**
- [ ] **Commit hash donde fue introducido**
- [ ] **Screenshot de Firebase Console (si aplica)**
- [ ] **Código ejecutable (no solo documentación)**
- [ ] **Test que valide la funcionalidad**
- [ ] **Fecha de implementación**
- [ ] **Verificación por auditor externo (si aplica)**

---

## 🎯 CONCLUSIÓN

**Este cuestionario requiere evidencia concreta y verificable.**

**Principio aplicado:** "Si no puedes demostrarlo con código, commits, screenshots o tests → no existe."

**Todas las respuestas deben ser:**
- Específicas (rutas, líneas, commits)
- Verificables (screenshots, código ejecutable)
- Sin ambigüedades (SÍ/NO, fechas concretas)

---

**Documento generado:** Noviembre 2025  
**Basado en:** Análisis exhaustivo del código fuente y documentación  
**Propósito:** Segunda capa de auditoría con requisitos estrictos de evidencia

