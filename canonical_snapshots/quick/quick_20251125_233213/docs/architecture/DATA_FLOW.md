# Data Flow - Flujo de Datos en AiduxCare

**Objetivo:** Hacer evidente cómo fluyen los datos entre diferentes componentes y cómo se retroalimentan entre sí.

---

## 🔄 Flujos Principales

### 1. **Onboarding → Professional Profile → AI Context**

```
User completes Onboarding
    ↓
ProfessionalProfileService.save()
    ↓
Firestore: /professionals/{userId}
    ↓
ProfessionalProfileContext (React Context)
    ↓
ProfessionalContextService.getContext()
    ↓
PromptFactory.addProfessionalContext()
    ↓
Vertex AI receives context in prompts
    ↓
Personalized suggestions/responses
```

**Datos clave que fluyen:**
- `specialization` → Usado en prompts de tratamiento
- `yearsOfExperience` → Ajusta nivel de sugerencias
- `certifications` → Prioriza técnicas certificadas
- `patientPopulation` → Filtra sugerencias por población

---

### 2. **Create Patient → Patient Profile → Treatment Suggestions**

```
User creates new patient
    ↓
PatientService.createPatient()
    ↓
Firestore: /patients/{patientId}
    ↓
CommandCenterPage receives patient
    ↓
TreatmentSuggestionService.getSuggestions(patientId, professionalId)
    ↓
Combines:
  - Patient age → Age-appropriate treatments
  - Patient condition → Condition-specific protocols
  - Professional expertise → Expertise-matched suggestions
    ↓
Display personalized suggestions in UI
```

**Datos clave que fluyen:**
- `patient.age` → Filtra tratamientos por edad
- `patient.condition` → Sugiere protocolos específicos
- `patient.medicalHistory` → Evita contraindicaciones
- `professional.specialization` → Prioriza tratamientos del expertise

---

### 3. **Session History → Pattern Analysis → Future Suggestions**

```
Patient has previous sessions
    ↓
SessionService.getSessionsByPatient(patientId)
    ↓
SessionPatternAnalysisService.analyze(sessions)
    ↓
Identifies:
  - What treatments worked best
  - Patient response patterns
  - Progress indicators
    ↓
Combines with professional expertise
    ↓
Suggests next steps for follow-up session
```

**Datos clave que fluyen:**
- `session.treatmentType` → Qué funcionó mejor
- `session.outcome` → Patrones de respuesta
- `session.progress` → Indicadores de mejora
- `professional.expertise` → Cómo aplicar expertise a patrones

---

## 🗂️ Estructura de Datos

### Professional Profile (Onboarding → Context)
```typescript
{
  specialization: "Orthopedic Physiotherapy",
  yearsOfExperience: 12,
  certifications: ["Manual Therapy", "Dry Needling"],
  practiceType: "CLINIC",
  patientPopulation: "sports",
  areasOfInterest: ["Sports injuries", "Post-surgical rehab"]
}
```

### Patient Profile (Create → Suggestions)
```typescript
{
  age: 45,
  condition: "Lower back pain",
  medicalHistory: ["Previous hip replacement"],
  insuranceType: "WSIB",
  // ... otros campos
}
```

### Combined Context (For AI)
```typescript
{
  professional: {
    specialization: "Orthopedic Physiotherapy",
    expertise: ["Manual Therapy", "Dry Needling"],
    experience: 12
  },
  patient: {
    age: 45,
    condition: "Lower back pain",
    history: ["Previous hip replacement"]
  },
  sessionHistory: [
    { type: "initial", outcome: "positive", treatments: ["Manual therapy"] }
  ]
}
```

---

## 🔗 Puntos de Integración

### 1. **Command Center → Workflow**
- Command Center selecciona paciente
- Pasa `patientId` y `professionalId` a Workflow
- Workflow carga contexto y muestra sugerencias

### 2. **Workflow → AI Service**
- Workflow incluye contexto en prompts
- AI Service retorna respuestas personalizadas
- Workflow muestra sugerencias basadas en contexto

### 3. **Session Complete → Pattern Analysis**
- Sesión se guarda con outcome
- Pattern Analysis se ejecuta en background
- Resultados disponibles para próxima sesión

---

## 📊 Visualización de Flujo

```
┌─────────────────┐
│   Onboarding    │
│  (Professional) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌─────────────────┐
│ Professional    │      │   Create Patient │
│   Profile       │      │    (Patient)     │
│  (Firestore)    │      │   (Firestore)    │
└────────┬────────┘      └────────┬─────────┘
         │                        │
         └────────┬────────────────┘
                  │
                  ↓
         ┌─────────────────┐
         │ Context Service  │
         │  (Combines Data) │
         └────────┬──────────┘
                  │
                  ↓
         ┌─────────────────┐
         │  Prompt Factory │
         │ (Adds Context)   │
         └────────┬──────────┘
                  │
                  ↓
         ┌─────────────────┐
         │   Vertex AI      │
         │ (Personalized)   │
         └────────┬──────────┘
                  │
                  ↓
         ┌─────────────────┐
         │  UI Components   │
         │ (Shows Results)   │
         └──────────────────┘
```

---

## 🎯 Casos de Uso Específicos

### Caso 1: Fisio Ortopédico + Paciente Deportista
```
Professional Context:
  - Specialization: "Orthopedic"
  - Certifications: ["Sports Medicine"]
  - Patient Population: "sports"

Patient Context:
  - Age: 28
  - Condition: "ACL reconstruction recovery"
  - Activity Level: "Athlete"

→ AI Suggests:
  - Sports-specific rehabilitation protocols
  - Return-to-sport progression
  - Athletic performance optimization
```

### Caso 2: Fisio Geriátrico + Paciente Mayor
```
Professional Context:
  - Specialization: "Geriatric"
  - Certifications: ["Fall Prevention"]
  - Patient Population: "geriatric"

Patient Context:
  - Age: 78
  - Condition: "Balance issues"
  - History: "Previous falls"

→ AI Suggests:
  - Fall prevention protocols
  - Balance training exercises
  - Home safety assessments
```

---

## 📝 Notas para Desarrolladores

1. **Siempre incluir contexto profesional** en prompts de AI
2. **Verificar edad del paciente** antes de sugerir tratamientos
3. **Combinar datos** de múltiples fuentes para mejor personalización
4. **Cachear contexto profesional** (cambia poco frecuentemente)
5. **Documentar** qué datos se usan y cómo en cada flujo

---

---

## 🔬 Vertex AI Processing Flow - Two Calls Per Session

**Objetivo:** Documentar el proceso completo de las dos consultas a Vertex AI por sesión, incluyendo mapeo y parseo de respuestas.

### Overview: Two-Stage AI Processing

Cada sesión clínica realiza **exactamente dos llamadas** a Vertex AI:

1. **Primera llamada**: Análisis clínico inicial (Niagara Processor)
2. **Segunda llamada**: Generación de nota SOAP

---

### 📞 Primera Llamada: Análisis Clínico Inicial (Niagara)

**Trigger:** Usuario hace clic en "Analyze with AiduxCare AI" en el tab "Initial Analysis"

**Flujo completo:**

```
User clicks "Analyze with AiduxCare AI"
    ↓
handleAnalyzeWithVertex() en ProfessionalWorkflowPage.tsx
    ↓
processText(payload) del hook useNiagaraProcessor
    ↓
VertexAIServiceViaFirebase.processWithNiagara(payload)
    ↓
analyzeWithVertexProxy() → VERTEX_PROXY_URL
    ↓
PromptFactory.create() → Construye prompt estructurado con esquema JSON
    ↓
Vertex AI (Gemini 2.0 Flash) procesa transcript
    ↓
Respuesta raw de Vertex AI (texto estructurado o JSON)
    ↓
normalizeVertexResponse() en cleanVertexResponse.ts
    ↓
parseVertexResponse() en responseParser.ts
    ↓
validateClinicalSchema() → Valida estructura
    ↓
mapStructuredPayload() → Mapea a ClinicalAnalysis
    ↓
niagaraResults (estado en ProfessionalWorkflowPage)
    ↓
UI muestra resultados en ClinicalAnalysisResults component
```

**Payload enviado a Vertex:**
```typescript
{
  text: string,           // Transcript sanitizado (max 6000 chars)
  lang?: string,          // Idioma detectado o preferido
  mode?: "live" | "dictation",
  timestamp?: number
}
```

**Prompt generado:**
- Usa `PromptFactory.create()` con contexto estructurado
- Incluye esquema JSON para respuesta estructurada
- Enfocado en extracción de información clínica

**Respuesta esperada (estructura):**
```typescript
{
  medicolegal_alerts: {
    red_flags: string[],
    yellow_flags: string[],
    legal_exposure: "low" | "moderate" | "high",
    alert_notes: string[]
  },
  conversation_highlights: {
    chief_complaint: string,
    key_findings: string[],
    medical_history: string[],
    medications: string[]
  },
  recommended_physical_tests: Array<{
    name: string,
    rationale?: string,
    region?: string,
    evidence_level?: string
  }>,
  biopsychosocial_factors: {
    psychological: string[],
    social: string[],
    occupational: string[],
    protective_factors: string[],
    functional_limitations: string[],
    patient_strengths: string[]
  }
}
```

**Parser y mapeo:**
1. **parseVertexResponse()** (`responseParser.ts`):
   - Detecta formato de respuesta (JSON, texto estructurado, Gemini candidates)
   - Extrae JSON usando regex si está embebido en texto
   - Maneja múltiples formatos de respuesta de Vertex

2. **normalizeVertexResponse()** (`cleanVertexResponse.ts`):
   - Normaliza diferentes formatos de respuesta
   - Maneja `candidates[0].content.parts[0].text` (formato Gemini)
   - Maneja `output_text` (formato legacy)
   - Valida schema con `validateClinicalSchema()`

3. **mapStructuredPayload()** (`cleanVertexResponse.ts`):
   - Mapea payload estructurado a `ClinicalAnalysis`
   - Limpia flags (elimina "none identified", "no critical")
   - Mapea tests físicos con `mapPhysicalTests()`
   - Extrae factores biopsicosociales por categoría
   - Combina yellow flags con contexto legal/ocupacional

**Resultado final (`ClinicalAnalysis`):**
```typescript
{
  motivo_consulta: string,
  hallazgos_clinicos: string[],
  hallazgos_relevantes: string[],
  contexto_ocupacional: string[],
  contexto_psicosocial: string[],
  medicacion_actual: string[],
  antecedentes_medicos: string[],
  diagnosticos_probables: string[],
  red_flags: string[],
  yellow_flags: string[],
  evaluaciones_fisicas_sugeridas: PhysicalTest[],
  plan_tratamiento_sugerido: string[],
  riesgo_legal: "low" | "moderate" | "high",
  biopsychosocial_psychological: string[],
  biopsychosocial_social: string[],
  biopsychosocial_occupational: string[],
  // ... más campos
}
```

---

### 📝 Segunda Llamada: Generación de Nota SOAP

**Trigger:** Usuario hace clic en "Generate SOAP Note" en el tab "SOAP Report"

**Prerequisitos:**
- `niagaraResults` debe existir (primera llamada completada)
- Al menos un test físico debe estar documentado
- Consentimiento del paciente verificado (PHIPA compliance)

**Flujo completo:**

```
User clicks "Generate SOAP Note"
    ↓
handleGenerateSoap() en ProfessionalWorkflowPage.tsx
    ↓
Verifica consentimiento del paciente (PatientConsentService)
    ↓
Organiza datos unificados (organizeSOAPData)
    ↓
buildSOAPContext() → Construye contexto SOAP
    ↓
buildSOAPPrompt() en SOAPPromptFactory.ts
    ↓
generateSOAPNoteFromService() en vertex-ai-soap-service.ts
    ↓
fetch(VERTEX_PROXY_URL) con action: 'generate_soap'
    ↓
Vertex AI (Gemini 2.0 Flash) genera nota SOAP
    ↓
Respuesta raw de Vertex AI (JSON o texto estructurado)
    ↓
parseSOAPResponse() en vertex-ai-soap-service.ts
    ↓
Extrae JSON de respuesta (maneja múltiples formatos)
    ↓
Valida estructura SOAP
    ↓
SOAPNote estructurado
    ↓
localSoapNote (estado en ProfessionalWorkflowPage)
    ↓
UI muestra nota en SOAPEditor component
```

**Contexto enviado a Vertex:**
```typescript
{
  transcript: string,
  analysis: {
    chiefComplaint: string,
    keyFindings: string[],
    medicalHistory: string[],
    medications: string[],
    redFlags: string[],
    yellowFlags: string[],
    biopsychosocial: {
      occupational: string[],
      protective: string[],
      functionalLimitations: string[],
      patientStrengths: string[]
    }
  },
  physicalEvaluation: {
    tests: PhysicalExamResult[],
    summary: string
  },
  visit: {
    type: 'initial' | 'follow-up',
    patientId: string,
    patientName: string
  },
  visitType: 'initial' | 'follow-up',
  sessionType?: SessionType
}
```

**Prompt generado:**
- Diferencia entre **Initial Assessment** y **Follow-up** visit
- Incluye restricciones regionales (solo mencionar regiones testeadas)
- Incluye contexto de sesión (WSIB, MVA, Certificate)
- Usa `buildInitialAssessmentPrompt()` o `buildFollowUpPrompt()` según tipo

**Respuesta esperada (JSON):**
```typescript
{
  subjective: string,
  objective: string,
  assessment: string,
  plan: string,
  additionalNotes?: string,
  followUp?: string,
  precautions?: string,
  referrals?: string
}
```

**Parser (`parseSOAPResponse()`):**
1. Detecta formato de respuesta:
   - `vertexResponse.soap` (formato directo)
   - `vertexResponse.text` (JSON embebido en texto)
   - `vertexResponse.candidates[0].content.parts[0].text` (formato Gemini)

2. Extrae JSON:
   - Usa regex `/\{[\s\S]*\}/` para encontrar JSON en texto
   - Parsea JSON con `JSON.parse()`
   - Maneja errores de parsing con fallback

3. Valida y estructura:
   - Convierte todos los campos a `String()`
   - Proporciona valores por defecto si faltan
   - Retorna estructura `SOAPNote` completa

**Resultado final (`SOAPNote`):**
```typescript
{
  subjective: string,
  objective: string,
  assessment: string,
  plan: string,
  additionalNotes?: string,
  followUp?: string,
  precautions?: string,
  referrals?: string,
  requiresReview: true,        // CPO requirement
  isReviewed: false,
  aiGenerated: true,
  aiProcessor: 'AiduxCare Clinical AI',
  processedAt: Date
}
```

---

### 🔄 Integración entre las Dos Llamadas

**Dependencia:**
- La segunda llamada **requiere** los resultados de la primera
- `niagaraResults` se usa para construir el contexto SOAP
- Los tests físicos documentados se incluyen en el prompt SOAP

**Flujo de datos:**
```
Primera llamada (Niagara)
    ↓
niagaraResults → ClinicalAnalysis
    ↓
Usuario documenta tests físicos
    ↓
physicalExamResults → PhysicalExamResult[]
    ↓
Segunda llamada (SOAP)
    ↓
Combina: niagaraResults + physicalExamResults + transcript
    ↓
SOAPNote generado
```

---

### 🛠️ Servicios y Parsers Involucrados

**Primera llamada:**
- **Servicio**: `VertexAIServiceViaFirebase.processWithNiagara()`
- **Proxy**: `vertexAIProxy` Cloud Function
- **Parser**: `normalizeVertexResponse()` → `parseVertexResponse()`
- **Mapper**: `mapStructuredPayload()` → `ClinicalAnalysis`
- **Hook**: `useNiagaraProcessor()`

**Segunda llamada:**
- **Servicio**: `generateSOAPNoteFromService()` en `vertex-ai-soap-service.ts`
- **Proxy**: `vertexAIProxy` Cloud Function (mismo endpoint, diferente `action`)
- **Prompt Builder**: `buildSOAPPrompt()` en `SOAPPromptFactory.ts`
- **Parser**: `parseSOAPResponse()` en `vertex-ai-soap-service.ts`
- **Context Builder**: `buildSOAPContext()` en `SOAPContextBuilder.ts`

---

### 📊 Manejo de Errores y Fallbacks

**Primera llamada:**
- Si parsing falla → Retorna `DEFAULT_RESULT` con campos vacíos
- Si respuesta vacía → Usa `generateFallbackResponse()`
- Si error de red → Muestra error en UI, permite reintento

**Segunda llamada:**
- Si parsing falla → Retorna estructura SOAP vacía con mensaje de error
- Si respuesta inválida → Usa valores por defecto ("Not documented.")
- Si error de red → Muestra error, permite regenerar

---

### 🔍 Trazabilidad

**Trace IDs:**
- Primera llamada: `ui-niagara|lang:{lang}|mode:{mode}|ts:{timestamp}`
- Segunda llamada: `soap-{visitType}-{timestamp}` o `soap-draft|ts:{timestamp}`

**Logging:**
- Cada paso del parsing se loguea con `console.debug()` o `console.log()`
- Errores se capturan y reportan vía `FeedbackService`
- Métricas de procesamiento se trackean en `AnalyticsService`

---

**Última actualización:** 2025-11-25  
**Mantenido por:** Equipo de Desarrollo

