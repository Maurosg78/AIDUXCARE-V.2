# Pipeline de Flujo Profesional AiDuxCare

## Arquitectura del Sistema Actual

### 1. COMPONENTES PRINCIPALES

#### Frontend Components
- `ProfessionalWorkflowPage.tsx` - Página principal del flujo
- `NewPatientModal.tsx` - Modal para registro de pacientes
- `SelectableFindings.tsx` - Componente de selección de hallazgos en 3 columnas
- `MultimodalTranscriptArea.tsx` - Área de entrada multimodal (texto/audio/archivos)

#### Hooks Personalizados
- `useTranscript.ts` - Maneja grabación y transcripción con Whisper
- `useNiagaraProcessor.ts` - Procesa con Vertex AI y genera SOAP
- `useAuth.ts` - Autenticación de usuario

#### Servicios
- `VertexAIServiceViaFirebase.ts` - Comunicación con Vertex AI via Cloud Functions
- `vertexResponseParser.ts` - Parser inteligente de respuestas con fallbacks
- `FileProcessorService.ts` - Procesamiento de archivos multimodales
- `OpenAIWhisperService.ts` - Transcripción de audio

### 2. FLUJO DE DATOS
[Entrada Multimodal] → [Transcripción] → [Vertex AI] → [Parser] → [3 Columnas]
↓
[Paciente Seleccionado] → [Sesión Activa] → [Selección Manual] → [SOAP Generation]

### 3. ESTRUCTURA DE DATOS CLAVE

- **ClinicalEntity**: Entidad clínica detectada
- **PhysicalExamResult**: Resultado de evaluación física
- **SOAPNote**: Nota estructurada final
- **PatientData**: Información completa del paciente

### 4. SEGURIDAD Y COMPLIANCE
- Encriptación AES-256
- Logs de auditoría
- HIPAA/GDPR compliance
- Validación de campos obligatorios

## GUARDADO PERMANENTE
Commit realizado: [fecha/hash]
Branch: feature/professional-workflow
