# 🧩 CUESTIONARIO FINAL PARA EL IMPLEMENTADOR
## Respuestas Basadas en Código y Documentación Actual

**Fecha:** Noviembre 2025  
**Versión:** 2025 — Auditoría profesional  
**Alineado con:** CPO Documentation Standard 2025, TRUST AI Framework, PHIPA/PIPEDA, CLOUD Act, Scope expansion 2026

---

## 🟦 1) ARQUITECTURA TÉCNICA Y DATA FLOW

### 1.1 Data Residency y Procesamiento

#### ¿Dónde exactamente se procesan TODOS los flujos de datos (audio, texto, embeddings, LLM, logs)?

**RESPUESTA:**

**Firestore Database:**
- **Estado:** ⚠️ **REQUIERE VERIFICACIÓN EN CONSOLE**
- **Región requerida:** `northamerica-northeast1` (Montreal, Canada)
- **Código:** `src/lib/firebase.ts` - No especifica región explícitamente (se configura en Firebase Console durante creación)
- **Documentación:** `docs/north/DATA_RESIDENCY_VERIFICATION.md` indica que requiere verificación manual

**Firebase Storage:**
- **Estado:** ⚠️ **REQUIERE VERIFICACIÓN EN CONSOLE**
- **Región requerida:** `northamerica-northeast1` (Montreal, Canada)
- **Código:** `src/lib/firebase.ts` - Inicializado pero región no especificada en código

**Firebase Functions:**
- **Estado:** 🔴 **INCORRECTO EN CÓDIGO**
- **Código actual:** `functions/index.js` línea 5: `LOCATION = 'us-central1'` ❌
- **Código referencia:** `src/core/assistant/assistantAdapter.ts` línea 64 menciona `europe-west1` ❌
- **Región requerida:** `northamerica-northeast1` (Montreal, Canada)
- **Función específica:** `functions/clinical-analysis-v2.js` línea 12: `location: 'northamerica-northeast1'` ✅ (correcto)

**Vertex AI:**
- **Estado:** ⚠️ **MIXTO**
- **Proxy Function:** `functions/index.js` - Usa `us-central1` ❌ (incorrecto para Canadá)
- **Endpoint:** `https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy`
- **Modelo:** `gemini-2.5-flash` (línea 6)
- **Nota:** Vertex AI puede procesar en US pero requiere consentimiento explícito para CLOUD Act

**OpenAI Whisper:**
- **Estado:** ⚠️ **PROCESAMIENTO EN EE.UU.**
- **Endpoint:** `https://api.openai.com/v1/audio/transcriptions` (EE.UU.)
- **Modelo:** `whisper-1` o `gpt-4o-mini-transcribe` (según `src/config/env.ts`)
- **Código:** `src/services/OpenAIWhisperService.ts`
- **Consentimiento requerido:** ✅ Implementado (`CrossBorderAIConsentService`)

#### ¿Existe algún flujo que viaje a EE.UU.?

**RESPUESTA:** ✅ **SÍ**

1. **OpenAI Whisper:** ✅ **SÍ** - Transcripción de audio viaja a EE.UU.
   - **Consentimiento:** ✅ Requerido y capturado (`CrossBorderAIConsentService`)
   - **CLOUD Act disclosure:** ✅ Implementado (`cloudActAcknowledged: boolean`)

2. **Vertex AI (via proxy):** ⚠️ **POSIBLE**
   - Proxy function está en `us-central1` (EE.UU.)
   - Requiere verificación si Vertex AI procesa en Canadá o EE.UU.
   - **Consentimiento:** ✅ Requerido para cross-border processing

#### ¿Hay mecanismos para evitar exfiltración involuntaria?

**RESPUESTA:** ⚠️ **PARCIAL**

**Implementado:**
- ✅ Consentimiento explícito requerido (`CrossBorderAIConsentService`)
- ✅ Pseudonymización de datos (`pseudonymizationService.ts`)
- ✅ Validación de queries (`analyticsValidationService.ts`)
- ✅ K-anonymity (mínimo 5 eventos para agregación)

**No implementado:**
- ❌ VPC Service Controls (no encontrado en código)
- ❌ Network egress controls explícitos
- ❌ Data loss prevention (DLP) policies

#### ¿Tenemos VPC Service Controls activado para impedir movimientos fuera de Canadá?

**RESPUESTA:** ❌ **NO ENCONTRADO EN CÓDIGO**

- No hay evidencia de VPC Service Controls en el código
- Requiere configuración en Google Cloud Console (no visible en código fuente)

#### ¿Usamos Customer Managed Encryption Keys (CMEK) o dependemos de claves gestionadas por Google?

**RESPUESTA:** ⚠️ **SIN DATA**

- **Firestore:** No especificado en código (usa claves gestionadas por Google por defecto)
- **Storage:** No especificado en código
- **Encriptación de datos:** `CryptoService.ts` usa Web Crypto API con clave derivada de `VITE_ENCRYPTION_KEY`
- **Documentación:** `docs/enterprise/ARCHITECTURE.md` menciona "CMEK optional when required" pero no confirma implementación

#### ¿Existe auditoría de logs para cada acceso a PHI (aunque sea pseudonimizada)?

**RESPUESTA:** ✅ **SÍ**

**Implementado:**
- ✅ `FirestoreAuditLogger` (`src/core/audit/FirestoreAuditLogger.ts`)
- ✅ Colección `audit_logs` en Firestore
- ✅ Eventos auditados:
  - `patient_data_access`, `patient_data_created`, `patient_data_modified`, `patient_data_deleted`
  - `visit_data_access`, `visit_data_created`, `visit_data_modified`, `visit_data_deleted`
  - `clinical_data_edit`, `data_export`
  - `login_success`, `login_failed`, `logout_success`
- ✅ Metadatos cifrados antes de almacenar
- ✅ Timestamps y trazabilidad completa

**Documentación:** `docs/AUDIT_CERTIFICATION_PACKAGE.md` describe sistema completo

---

### 1.2 Data Lifecycle

#### ¿La app permite exportación TOTAL de datos para permitir al fisioterapeuta cumplir su obligación de 10+ años?

**RESPUESTA:** ⚠️ **PARCIAL**

**Implementado:**
- ✅ Método `exportAnalyticsData()` en `AnalyticsService` (CSV/JSON)
- ✅ Exportación de analytics y métricas
- ✅ `AuditLogger` registra eventos de exportación (`data_export`)

**No encontrado:**
- ❌ Exportación completa de sesiones clínicas (SOAP notes, transcripciones, attachments)
- ❌ Exportación en formato estándar (FHIR Bundle, PDF, etc.)
- ❌ Función de "exportar todo" para cumplir retención 10+ años

**Recomendación:** Implementar función de exportación completa de datos clínicos

#### ¿La función de "memoria de pacientes" garantiza duplicación legal permitida por PHIPA (agente)?

**RESPUESTA:** ⚠️ **SIN DATA ESPECÍFICA**

- No encontré documentación específica sobre "memoria de pacientes" como función separada
- `PersistenceService` y `sessionService` guardan datos en Firestore
- No hay evidencia explícita de que se garantice duplicación legal o que se evite retención por motivos del vendor

#### ¿Cuál es la política exacta de eliminación final del vendor? (30, 60 o 90 días)

**RESPUESTA:** ⚠️ **SIN DATA ESPECÍFICA**

**Encontrado:**
- `docs/enterprise/ARCHITECTURE.md` menciona:
  - Retención clínica: **≥ 7 años**
  - Retención audit logs: **≥ 10 años**
  - Legal holds pausan reloj de retención

**No encontrado:**
- Política específica de eliminación final del vendor (30/60/90 días)
- Proceso automatizado de eliminación después de retención
- Documentación de política de eliminación

---

## 🟧 2) COMPLIANCE PHIPA / PIPEDA / CPO / CLOUD ACT

### 2.1 Agent vs HIC – Validación

#### ¿El diseño actual garantiza inequívocamente que AiduxCare NUNCA actúa como HIC?

**RESPUESTA:** ⚠️ **SIN DATA EXPLÍCITA**

**Evidencia encontrada:**
- ✅ Consentimiento explícito requerido (`PatientConsentService`, `CrossBorderAIConsentService`)
- ✅ Datos almacenados en Firestore (control del fisioterapeuta)
- ✅ Encriptación de datos sensibles (`CryptoService`)

**No encontrado:**
- ❌ Documentación explícita de que AiduxCare actúa como "agent" y no como HIC
- ❌ Contratos o términos que establezcan relación agent
- ❌ Validación legal explícita de status agent

**Recomendación:** Documentar explícitamente status agent en términos legales

#### ¿La plataforma hace uso de PHI para training, product development, o análisis agregados comerciales?

**RESPUESTA:** ⚠️ **NO CLARO**

**Encontrado:**
- ✅ Pseudonymización de datos (`pseudonymizationService.ts`)
- ✅ K-anonymity para agregación (mínimo 5 eventos)
- ✅ Validación de que queries no contengan PHI (`analyticsValidationService.ts`)
- ✅ Analytics capturan métricas agregadas sin PHI

**No encontrado:**
- ❌ Política explícita de NO usar PHI para training
- ❌ Política explícita de NO usar PHI para product development
- ❌ Confirmación de que datos no se usan para análisis comerciales

**Recomendación:** Documentar explícitamente política de NO uso de PHI para training/desarrollo

#### ¿Quién controla la retención? ¿El fisioterapeuta o AiduxCare?

**RESPUESTA:** ⚠️ **SIN DATA CLARA**

**Encontrado:**
- Datos almacenados en Firestore (acceso del fisioterapeuta)
- Retención configurada: ≥7 años (clínico), ≥10 años (audit)

**No encontrado:**
- ❌ Confirmación de quién controla retención (fisioterapeuta vs vendor)
- ❌ Política de transferencia de control al fisioterapeuta
- ❌ Proceso de exportación para cumplir obligaciones legales del fisioterapeuta

---

### 2.2 Consentimiento

#### ¿Existe workflow nativo para obtener consentimiento expreso para grabación, procesamiento por IA, procesamiento fuera de Canadá (si aplica), CLOUD Act disclosure?

**RESPUESTA:** ✅ **SÍ**

**Implementado:**

1. **Consentimiento de Paciente (PHIPA s.18):**
   - ✅ `PatientConsentService` (`src/services/patientConsentService.ts`)
   - ✅ Generación de tokens de consentimiento
   - ✅ SMS con link a portal de consentimiento
   - ✅ Consentimiento: `ongoing` | `session-only` | `declined`
   - ✅ Versión de consentimiento: `1.0.0`
   - ✅ Expiración: 7 días para tokens

2. **Consentimiento Cross-Border AI:**
   - ✅ `CrossBorderAIConsentService` (`src/services/crossBorderAIConsentService.ts`)
   - ✅ `cloudActAcknowledged: boolean` ✅ (CLOUD Act disclosure)
   - ✅ `dataRetentionAcknowledged: boolean` ✅ (10+ años)
   - ✅ `rightToWithdrawAcknowledged: boolean` ✅
   - ✅ `complaintRightsAcknowledged: boolean` ✅ (IPC Ontario)
   - ✅ Consentimiento: `ongoing` | `session-only`
   - ✅ Expiración: 365 días

3. **Consentimiento Legal General:**
   - ✅ `LegalConsentService` (`src/services/legalConsentService.ts`)
   - ✅ Terms, Privacy, Medical Disclaimer

**Componentes UI:**
- ✅ `PatientConsentPortalPage.tsx`
- ✅ `LegalConsentDocument.tsx`
- ✅ `ConsentActionButtons.tsx`
- ✅ `CrossBorderAIConsentModal.tsx`

#### ¿La app bloquea grabar si NO hay consentimiento documentado?

**RESPUESTA:** ⚠️ **NO ENCONTRADO EN CÓDIGO**

- No encontré validación explícita que bloquee grabación sin consentimiento
- `RealTimeAudioCapture.tsx` y `AudioCaptureServiceReal.ts` no muestran verificación de consentimiento antes de grabar
- **Recomendación:** Implementar gate de consentimiento antes de permitir grabación

#### ¿El consentimiento se almacena con fecha/hora, firma digital, versión del documento, método de obtención, idioma usado?

**RESPUESTA:** ✅ **PARCIAL**

**Almacenado:**
- ✅ `consentDate: Date` ✅
- ✅ `consentVersion: string` ✅ (`1.0.0`)
- ✅ `digitalSignature?: string` ✅ (opcional)
- ✅ `ipAddress?: string` ✅
- ✅ `userAgent?: string` ✅
- ✅ `timestamp` (serverTimestamp) ✅

**No encontrado:**
- ❌ `método de obtención` explícito (SMS vs Portal vs Email)
- ❌ `idioma usado` explícito (aunque UI soporta inglés/español)

---

### 2.3 Riesgos / Seguridad

#### ¿Tenemos auditoría para incidentes de seguridad, accesos irregulares, fallos de modelo, reintentos de API, fallos de telehealth?

**RESPUESTA:** ✅ **PARCIAL**

**Implementado:**
- ✅ `FirestoreAuditLogger` - Accesos a datos clínicos
- ✅ `AuditLogger` - Eventos generales
- ✅ Logging de errores en consola
- ✅ Eventos `error_occurred` en analytics

**No encontrado:**
- ❌ Auditoría específica de "incidentes de seguridad"
- ❌ Detección de "accesos irregulares" (anomalías)
- ❌ Logging estructurado de "fallos de modelo" (hallucinaciones, errores de IA)
- ❌ Tracking de "reintentos de API"
- ❌ Logging de "fallos de telehealth" (no hay soporte telehealth encontrado)

**Recomendación:** Implementar logging estructurado para estos eventos específicos

#### ¿Conexiones con OpenAI han sido eliminadas (por riesgo legal) o siguen activas?

**RESPUESTA:** ✅ **SIGUEN ACTIVAS**

**OpenAI activo:**
- ✅ `OpenAIWhisperService.ts` - Transcripción de audio
- ✅ `FileProcessorService.ts` - Procesamiento de archivos
- ✅ Endpoint: `https://api.openai.com/v1/audio/transcriptions`
- ✅ Modelo: `whisper-1` o `gpt-4o-mini-transcribe`

**Mitigación:**
- ✅ Consentimiento explícito requerido (`CrossBorderAIConsentService`)
- ✅ CLOUD Act disclosure implementado
- ✅ Datos pseudonymizados antes de enviar (si aplica)

**Riesgo:** OpenAI procesa en EE.UU. → CLOUD Act aplicable → Requiere consentimiento explícito ✅

---

## 🟩 3) PIPELINE DE IA Y MODELOS

### 3.1 Whisper / Speech-to-Text

#### ¿Qué modelo Whisper se usa concretamente?

**RESPUESTA:** ✅ **CONFIRMADO**

- **Modelo por defecto:** `whisper-1` (según `src/config/env.ts` línea 32)
- **Modelo alternativo:** `gpt-4o-mini-transcribe` (según `OpenAIWhisperService.ts` línea 37)
- **Configuración:** `WHISPER_MODEL` env var o `'whisper-1'` por defecto
- **Endpoint:** `https://api.openai.com/v1/audio/transcriptions`

#### ¿Se aplica pre-procesamiento de audio para ruido, gain control, diarization?

**RESPUESTA:** ⚠️ **PARCIAL**

**Implementado:**
- ✅ Validación de audio (`validateAudio()` en varios servicios)
- ✅ Configuración de MediaRecorder (48kHz, formatos optimizados)
- ✅ Chunking de audio (10-30s con overlap según `docs/enterprise/ARCHITECTURE.md`)

**No encontrado:**
- ❌ Pre-procesamiento de ruido explícito
- ❌ Gain control automático
- ❌ Diarization (identificación de speakers) - mencionado como "opcional" en arquitectura pero no implementado

**Documentación:** `docs/enterprise/ARCHITECTURE.md` menciona "Optional diarisation hints" pero no confirma implementación

#### ¿Tenemos ability de transcribir conversaciones con 2+ speakers? (Jane no lo tiene)

**RESPUESTA:** ⚠️ **NO CONFIRMADO**

**Encontrado:**
- Documentación menciona "Optional diarisation hints (speaker tags, turn-taking signals)"
- No encontré implementación explícita de diarization en código

**Código relevante:**
- `OpenAIWhisperService.ts` - No muestra parámetros de diarization
- `WebSpeechSTTService.ts` - No muestra soporte multi-speaker

**Recomendación:** Verificar si Whisper API soporta diarization y implementar si es diferenciador vs Jane

---

### 3.2 LLM Responsabilidades

#### ¿Qué modelo de LLM genera SOAP, análisis, documentos de apoyo?

**RESPUESTA:** ✅ **CONFIRMADO**

**SOAP Generation:**
- **Modelo:** `gemini-2.5-flash` (según `functions/index.js` línea 6)
- **Alternativo:** `gemini-2.0-flash-exp` (según `vertex-ai-soap-service.ts` línea 58)
- **Servicio:** `vertex-ai-soap-service.ts`
- **Endpoint:** Vertex AI via proxy function

**Análisis Clínico:**
- **Modelo:** `gemini-1.5-pro-preview-0409` (según `functions/clinical-analysis-v2.js` línea 16)
- **Servicio:** `OptimizedClinicalBrainService.ts`
- **Modelo usado:** `optimized-cascade-v3` (según código línea 187)

**Documentos de Apoyo:**
- **Sin data específica** - No encontré servicio dedicado para documentos de apoyo

#### ¿Se usa un modelo distinto para análisis clínico, redacción, extracción métrica?

**RESPUESTA:** ⚠️ **PARCIAL**

**Encontrado:**
- ✅ Modelo diferente para análisis clínico (`gemini-1.5-pro-preview-0409`)
- ✅ Modelo diferente para SOAP (`gemini-2.5-flash` o `gemini-2.0-flash-exp`)

**No encontrado:**
- ❌ Modelo específico para "redacción"
- ❌ Modelo específico para "extracción métrica"
- ❌ `ModelSelector` existe pero no encontré lógica de selección por tipo de tarea

#### ¿Tenemos controles anti-hallucination: verification layer, structured prompting, confidence score, requirement de revisión humana?

**RESPUESTA:** ✅ **PARCIAL**

**Implementado:**
- ✅ Structured prompting (`SOAPPromptFactory.ts`, `PromptFactory-Canada.ts`)
- ✅ Schema validation (`clinical-note-schema.ts`, `response-validator.ts`)
- ✅ Guardrails (`SOAPObjectiveValidator.ts` - valida regiones testeadas vs mencionadas)
- ✅ Temperature control (`temperature: 0.2-0.3` en funciones)
- ✅ Deterministic fallback (mencionado en arquitectura)

**No encontrado:**
- ❌ Verification layer explícito
- ❌ Confidence scores en respuestas de IA
- ❌ Requirement explícito de revisión humana (aunque UI permite edición)

**Documentación:** `docs/enterprise/ARCHITECTURE.md` menciona "guardrails" y "deterministic fallback" pero no detalles de verification layer

---

### 3.3 Registro de fallos

#### ¿Tenemos logs estructurados de errores de IA, devoluciones incoherentes, alucinaciones detectadas por el usuario, correcciones manuales?

**RESPUESTA:** ⚠️ **PARCIAL**

**Implementado:**
- ✅ Logging de errores generales (`error_occurred` en analytics)
- ✅ Logging de errores de Vertex AI (`vertexErrors` en analytics)
- ✅ Tracking de correcciones manuales (`editsMadeToSOAP` en value metrics)

**No encontrado:**
- ❌ Logs estructurados específicos de "alucinaciones detectadas"
- ❌ Logs estructurados de "devoluciones incoherentes"
- ❌ Sistema de feedback de usuario sobre calidad de IA

**Recomendación:** Implementar logging estructurado para estos eventos específicos

#### ¿El sistema versiona outputs según modelo (para defensa legal)? => requerido por CPO + AI Governance.

**RESPUESTA:** ⚠️ **PARCIAL**

**Implementado:**
- ✅ Metadata incluye `modelUsed` en respuestas
- ✅ `promptVersion` en algunas funciones
- ✅ Timestamps en todas las respuestas

**No encontrado:**
- ❌ Versionado explícito de outputs según modelo
- ❌ Sistema de versionado SEMVER para prompts (mencionado en arquitectura pero no confirmado en código)
- ❌ Audit trail completo de qué modelo generó qué output

**Documentación:** `docs/enterprise/ARCHITECTURE.md` menciona "Prompt Versioning — Rollout & Rollback" con SEMVER pero requiere verificación de implementación

---

## 🟫 4) PRODUCTO: SESIONES, TELEHEALTH, DOCUMENTOS

### 4.1 Telehealth

#### ¿AiduxCare soporta "dual audio capture"? (el punto más débil de Jane)

**RESPUESTA:** ❌ **NO ENCONTRADO**

- No encontré implementación de "dual audio capture"
- `RealTimeAudioCapture.tsx` y `AudioCaptureServiceReal.ts` capturan de un solo micrófono/dispositivo
- No hay evidencia de captura simultánea de múltiples fuentes de audio

**Recomendación:** Implementar dual audio capture como diferenciador vs Jane

#### ¿Funciona sobre Zoom, Meet, Doxy, Jitsi, o tiene herramienta propia?

**RESPUESTA:** ❌ **NO ENCONTRADO**

- No encontré integración con Zoom, Meet, Doxy, Jitsi
- No encontré herramienta propia de video/telehealth
- No hay evidencia de soporte telehealth en código

**Recomendación:** Implementar soporte telehealth o integración con plataformas existentes

#### ¿La plataforma detecta automáticamente micrófono incorrecto, audio unilateral, baja calidad?

**RESPUESTA:** ⚠️ **PARCIAL**

**Implementado:**
- ✅ Validación de dispositivos de audio (`getUserMedia` con constraints)
- ✅ Validación de formato de audio (sample rate, channels)
- ✅ Detección de errores de captura

**No encontrado:**
- ❌ Detección de "micrófono incorrecto" (múltiples dispositivos)
- ❌ Detección de "audio unilateral" (solo un speaker)
- ❌ Detección de "baja calidad" (SNR, nivel de señal)

**Recomendación:** Implementar detección automática de problemas de calidad de audio

---

### 4.2 Multilingüe

#### ¿El sistema ya está preparado para inglés/francés?

**RESPUESTA:** ✅ **SÍ (PARCIAL)**

**Implementado:**
- ✅ i18n configurado (`src/i18n/config.ts`, `src/i18n.ts`)
- ✅ Locales: `en.json`, `es.json` (inglés y español)
- ✅ Soporte para `en`, `es`, `fr` en `WhisperSupportedLanguage` (`OpenAIWhisperService.ts` línea 5)
- ✅ Fallback a inglés (`fallbackLng: 'en'`)

**No encontrado:**
- ❌ Locale `fr.json` (francés) - solo `en` y `es` encontrados
- ❌ Traducciones completas al francés

**Recomendación:** Completar traducciones al francés para cumplir requisitos de Ontario

#### ¿Cómo maneja acentos y dialectos? (fundamental para Ontario multicultural)

**RESPUESTA:** ⚠️ **SIN DATA ESPECÍFICA**

**Encontrado:**
- Whisper soporta `languageHint` (`auto`, `en`, `es`, `fr`)
- Detección automática de idioma (`detectedLanguage` en respuesta)

**No encontrado:**
- ❌ Manejo específico de acentos
- ❌ Manejo específico de dialectos
- ❌ Configuración para acentos canadienses (francés québécois, inglés canadiense)

**Recomendación:** Verificar y documentar manejo de acentos/dialectos con Whisper

---

### 4.3 Documentos de apoyo

#### ¿Los documentos generados incluyen automáticamente disclaimers requeridos para WSIB support, MVA summary, Return-to-work notes?

**RESPUESTA:** ❌ **NO ENCONTRADO**

- No encontré generación automática de documentos WSIB/MVA/Return-to-work
- No encontré disclaimers específicos para estos documentos
- `pdf-generator.ts` existe pero no muestra templates para estos documentos

**Documentación:** `docs/strategy/WSIB_MVA_REPORT_FORMATS.md` existe pero requiere verificación de implementación

**Recomendación:** Implementar generación de documentos WSIB/MVA/Return-to-work con disclaimers apropiados

#### ¿Cada documento queda marcado como "AI-as-draft only", "Requires PT approval"?

**RESPUESTA:** ⚠️ **PARCIAL**

**Implementado:**
- ✅ Status de notas: `'draft' | 'completed'` (según `sessionService.ts`)
- ✅ Workflow de revisión (`SaveNoteCPOGate.tsx` - CPO Review Gate)

**No encontrado:**
- ❌ Marcado explícito de "AI-as-draft only"
- ❌ Marcado explícito de "Requires PT approval"
- ❌ Watermark o disclaimer en documentos generados

**Recomendación:** Agregar marcado explícito de "AI-generated draft" en todos los documentos

---

## 🟪 5) PILOTO EN ONTARIO: MÉTRICAS Y ANALÍTICA

### 5.1 Instrumentación

#### ¿Están ya instrumentados TODOS los eventos descritos en ambos documentos (METRICAS_BUSINESS_PLAN y METRICAS_PILOTO)?

**RESPUESTA:** ✅ **SÍ (MAYORMENTE)**

**Confirmado implementado:**
- ✅ `session_started`, `session_completed`
- ✅ `transcript_started`, `transcript_completed`
- ✅ `soap_generated`, `soap_rendered`
- ✅ `suggestion_accepted`, `suggestion_rejected`
- ✅ `error_occurred`
- ✅ `feature_used`
- ✅ Duración total por sesión (`totalDocumentationTime`)
- ✅ Edición del PT sobre SOAP (`editsMadeToSOAP`)
- ✅ Sugerencias aceptadas vs rechazadas (`suggestionsAccepted`, `suggestionsRejected`)
- ✅ Error rate (calculado en analytics)
- ✅ Tiempo ahorrado (`timeSavedMinutes`)

**No encontrado:**
- ❌ "Telehealth friction" (no hay soporte telehealth)
- ❌ "Porcentaje de completar documentación el mismo día" (requiere cálculo agregado)

#### ¿Las métricas están separadas por specialty, clinic, individual PT?

**RESPUESTA:** ✅ **SÍ**

**Implementado:**
- ✅ Por usuario: `hashedUserId`, `userId`
- ✅ Por especialidad: `eventsBySpecialty` (según `analyticsService.ts`)
- ✅ Por módulo: `eventsByModule`
- ✅ Metadata incluye `specialty` en eventos

**No encontrado:**
- ❌ Separación explícita por "clinic" (requiere agregación por tenant/clinic)

**Recomendación:** Agregar separación por clinic/tenant en analytics

---

### 5.2 Exportación para análisis estadístico

#### ¿El sistema exporta CSV/JSON semanal?

**RESPUESTA:** ✅ **SÍ**

**Implementado:**
- ✅ `exportAnalyticsData(dateRange, format: 'csv' | 'json')` en `AnalyticsService`
- ✅ Método `convertToCSV()` para formato CSV
- ✅ JSON completo disponible

**Limitación:**
- ⚠️ Exportación manual (no automática semanal)
- ⚠️ Requiere llamada manual a función

**Recomendación:** Implementar exportación automática semanal programada

#### ¿Se correlaciona sesión actual con anterior por patientId pseudonimizado?

**RESPUESTA:** ✅ **SÍ**

**Implementado:**
- ✅ `patientId` pseudonymizado en `value_analytics`
- ✅ `hashedSessionId` para correlación de sesiones
- ✅ Timestamps para análisis temporal
- ✅ Agregación por paciente disponible (`eventsByUser`)

**Confirmado:** Sistema permite correlación longitudinal por paciente

#### ¿Tenemos herramientas internas para cleaning / anomaly detection?

**RESPUESTA:** ⚠️ **PARCIAL**

**Implementado:**
- ✅ `cleanUndefined()` en `sessionService` y `feedbackService` (limpieza de datos)
- ✅ Validación de datos (`analyticsValidationService.ts`)
- ✅ K-anonymity validation

**No encontrado:**
- ❌ Anomaly detection automático
- ❌ Herramientas de cleaning avanzadas
- ❌ Detección de outliers en métricas

**Recomendación:** Implementar anomaly detection para métricas del piloto

---

### 5.3 KPIs del piloto

#### ¿El implementador puede confirmar que podremos entregar reducción promedio de tiempo (target 30–50%), incremento en completitud documental, error rate < X%, NPS de profesionales, latencia promedio del pipeline?

**RESPUESTA:** ✅ **SÍ (PARCIAL)**

**Confirmado capturado:**
- ✅ Reducción de tiempo: `timeSavedMinutes`, `calculatedTimes.totalDocumentationTime`
- ✅ Completitud documental: `quality.completenessScore`, `soapSectionsCompleted`
- ✅ Error rate: Calculado en `getUsageAnalytics()` (`errorRate`)
- ✅ Latencia promedio: `calculatedTimes.aiGenerationTime`, `calculatedTimes.transcriptionTime`

**No capturado:**
- ❌ NPS de profesionales (no implementado - mencionado en documentos como "sin data")

**Recomendación:** Implementar encuesta NPS para profesionales

---

## 🟫 6) ROADMAP, LIMITACIONES Y SCOPE EXPANSION 2026

### ¿AiduxCare está preparado para "Scope Expansion Readiness" 2026?

**RESPUESTA:** ⚠️ **NO CLARO**

**Encontrado:**
- Arquitectura modular (`enterprise/ARCHITECTURE.md`)
- Sistema de tipos extensible
- FHIR adapters (`core/fhir/adapters/`)

**No encontrado:**
- ❌ Documentación específica para MRI/CT/Xray
- ❌ Soporte para órdenes asistidas
- ❌ Tracking de parámetros clínicos avanzados
- ❌ Módulos para laboratory ordering

**Recomendación:** Documentar roadmap de scope expansion 2026

### ¿Qué limitaciones técnicas siguen activas?

**RESPUESTA:** ✅ **CONFIRMADO**

**Limitaciones identificadas:**
1. **Telehealth:** ❌ No implementado
2. **Ruido:** ⚠️ Pre-procesamiento limitado
3. **Múltiples speakers:** ⚠️ Diarization no confirmado
4. **Latencia:** ⚠️ Objetivo p95 ≤ 3.0s pero requiere monitoreo
5. **Optimización del pipeline:** 🔄 En progreso (Sprint 2)

**Documentación:** `docs/north/PHASE1_TECHNICAL_DEBT.md` lista limitaciones conocidas

### ¿Qué features NO se incluirán por razones legales?

**RESPUESTA:** ⚠️ **SIN DATA EXPLÍCITA**

**Inferido de código:**
- ✅ Sistema NO genera diagnósticos automáticos (solo sugerencias)
- ✅ Sistema NO firma automáticamente (requiere aprobación PT)
- ✅ Sistema NO toma decisiones clínicas automáticas

**No encontrado:**
- ❌ Lista explícita de features excluidas por razones legales
- ❌ Documentación de límites legales

**Recomendación:** Documentar explícitamente features excluidas por razones legales

---

## 📊 RESUMEN EJECUTIVO

### ✅ CONFIRMADO:
- Consentimiento completo (PHIPA, CLOUD Act, Cross-border)
- Auditoría de accesos PHI
- Métricas del piloto (mayormente implementadas)
- Pseudonymización de datos
- Validación de compliance

### ⚠️ REQUIERE VERIFICACIÓN:
- Región de Firestore (requiere verificación en Console)
- Región de Functions (código muestra `us-central1` - incorrecto)
- VPC Service Controls (no encontrado)
- CMEK (no especificado)
- Exportación completa de datos (parcial)

### ❌ NO IMPLEMENTADO:
- Telehealth
- Dual audio capture
- NPS de profesionales
- Documentos WSIB/MVA/Return-to-work
- Anomaly detection automático

### 🔴 CRÍTICO:
- **Functions región:** `us-central1` debe cambiarse a `northamerica-northeast1`
- **Firestore región:** Requiere verificación inmediata en Console
- **Gate de consentimiento:** Bloquear grabación sin consentimiento

---

**Documento generado:** Noviembre 2025  
**Basado en:** Código fuente y documentación actual  
**Próxima acción:** Verificar regiones en Firebase Console y corregir Functions región

