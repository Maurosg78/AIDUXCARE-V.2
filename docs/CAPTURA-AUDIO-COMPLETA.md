# 📹 Captura de Audio - Flujo Completo

**Documentación completa del sistema de captura de audio desde principio a fin**

---

## 📋 Índice

1. [Arquitectura General](#arquitectura-general)
2. [Programa Principal](#programa-principal)
3. [Fallback](#fallback)
4. [Renderizado](#renderizado)
5. [Integración con Prompting](#integración-con-prompting)
6. [Flujo Completo](#flujo-completo)

---

## 🏗️ Arquitectura General

```
Usuario → TranscriptArea (UI) → useTranscript (Hook) → MediaRecorder API
                                                      ↓
                                              OpenAIWhisperService (Principal)
                                                      ↓
                                              Whisper API (OpenAI)
                                                      ↓
                                              Transcripción (texto)
                                                      ↓
                                              PromptFactory-Canada
                                                      ↓
                                              Vertex AI (Análisis)
```

---

## 🎯 Programa Principal

### 1. Hook Principal: `useTranscript.ts`

**Ubicación:** `src/hooks/useTranscript.ts`

**Responsabilidad:** Maneja todo el ciclo de vida de la grabación de audio

**Características principales:**

#### Inicio de Grabación (`startRecording`)

```typescript
// 1. Solicita acceso al micrófono
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000
  }
});

// 2. Detecta mejor formato de audio para el dispositivo
let mimeType = 'audio/webm';
if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
  mimeType = 'audio/webm;codecs=opus';
} else if (MediaRecorder.isTypeSupported('audio/mp4')) {
  mimeType = 'audio/mp4';
} // ... más fallbacks

// 3. Crea MediaRecorder
const recorder = new MediaRecorder(stream, { mimeType });

// 4. Configura intervalos según modo:
//    - LIVE: chunks cada 3 segundos (3000ms)
//    - DICTATION: chunks cada 10 segundos (10000ms)
const chunkInterval = mode === 'dictation' 
  ? DICTATION_CHUNK_INTERVAL_MS (10000ms)
  : LIVE_CHUNK_INTERVAL_MS (3000ms);

recorder.start(chunkInterval);
```

#### Procesamiento de Chunks (`ondataavailable`)

```typescript
recorder.ondataavailable = async (event: BlobEvent) => {
  if (event.data && event.data.size > 0) {
    // Normaliza tipo MIME (arregla errores comunes)
    let blobType = event.data.type
      .replace(/\/+/g, '/')      // Fix múltiples slashes
      .replace(/webrm/gi, 'webm') // Fix typo: webrm -> webm
    
    // Almacena chunk para transcripción final
    audioChunksRef.current.push(normalizedBlob);
    
    // ✅ TRANSCRIBE SOLO EL PRIMER CHUNK para feedback en tiempo real
    // Los chunks subsecuentes pueden estar corruptos en formato webm
    // La transcripción completa se hace al detener la grabación
    if (audioChunksRef.current.length === 1 && normalizedBlob.size >= 2000) {
      await transcribeChunk(normalizedBlob);
    }
  }
};
```

#### Transripción de Chunks (`transcribeChunk`)

```typescript
const transcribeChunk = async (chunkBlob: Blob) => {
  // Validaciones:
  // - Tamaño mínimo: 2KB
  // - Tipo MIME válido (audio/*)
  // - Normalización de formato
  
  // Llama a OpenAIWhisperService
  const result = await OpenAIWhisperService.transcribe(normalizedBlob, {
    languageHint: languagePreference, // 'auto' | 'en' | 'es' | 'fr'
    mode // 'live' | 'dictation'
  });
  
  // Agrega texto al transcript
  appendTranscript(result.text);
  
  // Actualiza metadata (idioma detectado, confianza, duración)
  setMeta({
    detectedLanguage: result.detectedLanguage,
    averageLogProb: result.averageLogProb,
    durationSeconds: result.durationSeconds
  });
};
```

#### Detención de Grabación (`onstop`)

```typescript
recorder.onstop = async () => {
  // 1. Crea blob final combinando todos los chunks
  const finalBlob = new Blob(audioChunksRef.current, { type: normalizedMimeType });
  
  // 2. Verifica tamaño (límite: 25MB)
  const fileSizeMB = finalBlob.size / (1024 * 1024);
  
  if (fileSizeMB > 25) {
    // Maneja audio muy grande con timeout extendido
    await handleLargeAudio(finalBlob, normalizedMimeType);
  } else {
    // Transcribe audio completo
    await transcribeChunk(finalBlob);
  }
};
```

### 2. Servicio Principal: `OpenAIWhisperService.ts`

**Ubicación:** `src/services/OpenAIWhisperService.ts`

**Responsabilidad:** Comunicación con la API de Whisper de OpenAI

**Características:**

#### Configuración

```typescript
- API_URL: "https://api.openai.com/v1/audio/transcriptions"
- MODEL: "gpt-4o-mini-transcribe" (o configurado via env)
- API_KEY: Desde variables de entorno
```

#### Prompt Clínico

```typescript
buildClinicalPrompt(mode: WhisperMode, promptOverride?: string): string {
  const baseLines = [
    "Clinical context: Canadian physiotherapy assessment in compliance with PHIPA/PIPEDA.",
    "Vocabulary bias: AiDuxCare, Niagara, physiotherapy, manual therapy, gait, cervical spine, lumbar spine...",
    "Respect Canadian English, Canadian French, and Latin American Spanish accents.",
    "Do not fabricate patient identifiers or personal health information."
  ];
  
  if (mode === "dictation") {
    baseLines.push("Mode: Post-session dictation with longer uninterrupted speech...");
  } else {
    baseLines.push("Mode: Live clinical conversation with back-and-forth dialogue...");
  }
  
  return baseLines.join("\n");
}
```

#### Mapeo de Formatos

```typescript
// Mapea tipos MIME a extensiones compatibles con Whisper
getWhisperCompatibleFilename(mimeType: string): string {
  const mimeToExt = {
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
    'audio/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/m4a': 'm4a',
    'audio/wav': 'wav',
    // ... más formatos
  };
  
  return `clinical-audio.${extension}`;
}
```

#### Request a Whisper API

```typescript
static async transcribe(
  audioBlob: Blob,
  options?: WhisperTranscriptionOptions
): Promise<WhisperTranscriptionResult> {
  // 1. Valida API key
  this.ensureConfigured();
  
  // 2. Construye FormData
  const formData = this.buildFormData(audioBlob, options);
  
  // 3. Construye prompt clínico
  const prompt = this.buildClinicalPrompt(options?.mode, options?.promptOverride);
  formData.append("prompt", prompt);
  
  // 4. Envía request a OpenAI
  const response = await fetch(this.API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.API_KEY}`
    },
    body: formData
  });
  
  // 5. Procesa respuesta
  const data = await response.json();
  return this.mapResponse(data);
}
```

---

## ⚠️ Fallback

### Servicio de Fallback: `WebSpeechSTTService.ts`

**Ubicación:** `src/services/WebSpeechSTTService.ts`

**Estado:** ❌ **DESHABILITADO**

**Razón:** 
- Causaba doble solicitud de permisos de micrófono
- No se puede compartir el mismo stream con MediaRecorder
- Whisper es superior para transcripción médica

**Código actual:**
```typescript
export class WebSpeechSTTService {
  // Todos los métodos son no-ops (no operación)
  onSegment(_: (segment:any)=>void){/* noop */}
  onError(_: (err:any)=>void){/* noop */}
  async start(){/* noop */}
  async stop(){/* noop */}
}
```

**Nota:** El código de Web Speech API está presente pero comentado/deshabilitado en `useTranscript.ts`:
- Líneas 121-124: `isWebSpeechAvailable()` - siempre retorna false
- Líneas 152-154: Comentario explicando por qué está deshabilitado

---

## 🎨 Renderizado

### Componente: `TranscriptArea.tsx`

**Ubicación:** `src/components/workflow/TranscriptArea.tsx`

**Responsabilidad:** UI para captura y visualización de transcript

**Características:**

#### Estado del Botón de Grabación

```typescript
// ACTUALMENTE DESHABILITADO (Coming Soon)
{isRecording ? (
  <button onClick={stopRecording}>
    <Square /> Stop Recording
  </button>
) : (
  <button onClick={startRecording} disabled={true}>
    <Play /> Start Recording (Coming Soon)
  </button>
)}
```

#### Banner Informativo

```typescript
<div className="border border-amber-200 bg-amber-50">
  <AlertCircle />
  <p>Voice recording is currently being improved.</p>
  <p>Please paste your transcript in the text area below.</p>
</div>
```

#### Área de Texto

```typescript
<textarea
  value={localTranscript}
  onChange={handleChange}
  placeholder="Paste or type clinical transcript here..."
  // Actualización en tiempo real con debounce (300ms)
/>
```

#### Visualización de Waveform

```typescript
{audioStream && (
  <AudioWaveform stream={audioStream} />
)}
```

**Nota:** El componente recibe todas las props de `useTranscript` pero el botón de grabación está deshabilitado temporalmente.

### Página Principal: `ProfessionalWorkflowPage.tsx`

**Ubicación:** `src/pages/ProfessionalWorkflowPage.tsx`

**Responsabilidad:** Orquesta todo el flujo de trabajo

**Uso de useTranscript:**

```typescript
const {
  transcript,
  isRecording,
  isTranscribing,
  error: transcriptError,
  languagePreference,
  setLanguagePreference,
  mode,
  setMode,
  meta: transcriptMeta,
  audioStream,
  startRecording,
  stopRecording,
  setTranscript,
} = useTranscript();
```

**Pasa props a TranscriptArea:**

```typescript
<TranscriptArea
  recordingTime={recordingTime}
  isRecording={isRecording}
  startRecording={startRecording}
  stopRecording={stopRecording}
  transcript={transcript}
  setTranscript={setTranscript}
  transcriptError={transcriptError}
  transcriptMeta={transcriptMeta}
  languagePreference={languagePreference}
  setLanguagePreference={setLanguagePreference}
  mode={mode}
  setMode={setMode}
  isTranscribing={isTranscribing}
  isProcessing={isProcessing}
  audioStream={audioStream}
  handleAnalyzeWithVertex={handleAnalyzeWithVertex}
  // ... más props
/>
```

---

## 🤖 Integración con Prompting

### 1. Handler de Análisis: `handleAnalyzeWithVertex`

**Ubicación:** `src/pages/ProfessionalWorkflowPage.tsx` (línea 1619)

```typescript
const handleAnalyzeWithVertex = async () => {
  // 1. Asegura que transcript es string
  const transcriptText = typeof transcript === 'string' 
    ? transcript 
    : String(transcript || '');
  
  if (!transcriptText.trim()) return;
  
  try {
    // 2. Construye payload
    const payload = {
      text: transcriptText,                    // ← TRANSCRIPT AQUÍ
      lang: transcriptMeta?.detectedLanguage ?? languagePreference,
      mode,                                    // 'live' | 'dictation'
      timestamp: Date.now(),
      visitType: visitType === 'follow-up' ? 'follow-up' : 'initial'
    };
    
    // 3. Procesa con Niagara Processor
    await processText({
      ...payload,
      professionalProfile: professionalProfile || undefined
    });
  } catch (error) {
    // Manejo de errores
  }
};
```

### 2. Niagara Processor: `useNiagaraProcessor.ts`

**Ubicación:** `src/hooks/useNiagaraProcessor.ts`

```typescript
const processText = async (params: {
  text: string;           // ← TRANSCRIPT
  lang?: string;
  mode?: 'live' | 'dictation';
  timestamp: number;
  visitType?: 'initial' | 'follow-up';
  professionalProfile?: ProfessionalProfile;
}) => {
  // 1. Construye prompt usando PromptFactory
  const prompt = PromptFactory.buildPrompt({
    transcript: params.text,              // ← TRANSCRIPT AQUÍ
    tests: selectedTests,
    attachments: session.attachments,
    professionalProfile: params.professionalProfile,
    visitType: params.visitType
  });
  
  // 2. Envía a Vertex AI
  const response = await fetch(VERTEX_PROXY_URL, {
    method: 'POST',
    body: JSON.stringify({ prompt })
  });
  
  // 3. Procesa respuesta
  // ...
};
```

### 3. Prompt Factory: `PromptFactory-Canada.ts`

**Ubicación:** `src/core/ai/PromptFactory-Canada.ts`

**Uso del transcript en el prompt:**

```typescript
export const buildCanadianPrompt = ({
  transcript,              // ← TRANSCRIPT AQUÍ
  contextoPaciente,
  instrucciones,
  visitType = 'initial',
  attachments,
  // ...
}: CanadianPromptParams): string => `
${PROMPT_HEADER}

[Patient Context]
${contextoPaciente}

## CLINICAL TRANSCRIPT

${transcript}              ← TRANSCRIPT INCLUIDO EN EL PROMPT

${attachments ? `
## CLINICAL ATTACHMENTS
${attachments.map(att => att.extractedText).join('\n\n')}
` : ''}

${instrucciones || (visitType === 'follow-up' 
  ? DEFAULT_INSTRUCTIONS_FOLLOWUP 
  : DEFAULT_INSTRUCTIONS_INITIAL)}
`;
```

**Nota:** El transcript se incluye directamente en el prompt que se envía a Vertex AI para análisis clínico.

---

## 🔄 Flujo Completo

### Paso a Paso:

1. **Usuario inicia grabación:**
   - Click en "Start Recording" (actualmente deshabilitado)
   - `startRecording()` se llama desde `useTranscript`

2. **Acceso al micrófono:**
   ```typescript
   navigator.mediaDevices.getUserMedia({ audio: {...} })
   ```
   - Solicita permisos al usuario
   - Retorna `MediaStream`

3. **MediaRecorder captura audio:**
   ```typescript
   const recorder = new MediaRecorder(stream, { mimeType });
   recorder.start(chunkInterval); // 3s (live) o 10s (dictation)
   ```

4. **Chunks de audio generados:**
   - Cada chunk es un `Blob` con audio
   - Se almacenan en `audioChunksRef.current`
   - Primer chunk se transcribe inmediatamente (feedback)

5. **Transcripción en tiempo real:**
   ```typescript
   OpenAIWhisperService.transcribe(chunkBlob, {
     languageHint: languagePreference,
     mode
   })
   ```
   - Envía chunk a Whisper API
   - Recibe texto transcrito
   - Se agrega al transcript con `appendTranscript()`

6. **Usuario detiene grabación:**
   - `stopRecording()` se llama
   - MediaRecorder se detiene
   - Stream se cierra

7. **Transcripción final:**
   ```typescript
   const finalBlob = new Blob(audioChunksRef.current);
   await transcribeChunk(finalBlob); // Transcripción completa
   ```

8. **Transcript listo:**
   - Texto completo disponible en `transcript` state
   - Metadata disponible (idioma, confianza, duración)

9. **Usuario hace análisis:**
   - Click en "Analyze with AI"
   - `handleAnalyzeWithVertex()` se llama
   - Transcript se pasa a `processText()`

10. **Construcción del prompt:**
    ```typescript
    PromptFactory.buildPrompt({
      transcript: transcriptText,  // ← TRANSCRIPT
      tests: selectedTests,
      attachments: session.attachments,
      visitType: 'initial' | 'follow-up'
    })
    ```

11. **Envío a Vertex AI:**
    - Prompt completo (con transcript) se envía a Vertex AI
    - Vertex AI analiza y genera respuesta clínica

12. **Resultados:**
    - Análisis clínico
    - Tests recomendados
    - Notas SOAP (si se solicita)

---

## 📊 Modos de Operación

### 1. Modo LIVE (`mode: 'live'`)

**Características:**
- Chunks cada **3 segundos** (3000ms)
- Prioriza latencia baja
- Feedback en tiempo real
- Ideal para conversación clínica

**Prompt a Whisper:**
```
Mode: Live clinical conversation with back-and-forth dialogue; 
prioritise timely segmentation without losing context.
```

### 2. Modo DICTATION (`mode: 'dictation'`)

**Características:**
- Chunks cada **10 segundos** (10000ms)
- Prioriza completitud
- Tolerancia a silencios prolongados
- Ideal para dictado post-consulta

**Prompt a Whisper:**
```
Mode: Post-session dictation with longer uninterrupted speech; 
prioritise completeness over latency.
```

---

## 🔧 Configuraciones Clave

### Formatos de Audio Soportados

**Prioridad:**
1. `audio/webm;codecs=opus` (Chrome/Android)
2. `audio/webm` (fallback WebM)
3. `audio/mp4` (Safari/iOS)
4. `audio/mpeg` (fallback general)

### Límites

- **Tamaño mínimo de chunk:** 2KB
- **Tamaño máximo de archivo:** 25MB
- **Timeout para audio grande:** 300 segundos (5 minutos)
- **Muestreo:** 48kHz

### Idiomas Soportados

- `auto` - Detección automática
- `en` - English (EN-CA)
- `es` - Español (LatAm)
- `fr` - Français (Canada)

---

## 🐛 Manejo de Errores

### Errores Comunes:

1. **Sin permisos de micrófono:**
   ```typescript
   Error: El navegador no soporta captura de audio
   ```

2. **API key no configurada:**
   ```typescript
   Error: Servicio de transcripción no configurado
   ```

3. **Audio muy grande:**
   ```typescript
   Error: The audio file is very long (X MB) and transcription is taking too long
   ```

4. **Timeout:**
   ```typescript
   Error: Transcription timeout. Please check your connection
   ```

5. **Formato corrupto:**
   ```typescript
   Error: Audio format corrupted or unsupported
   ```

---

## 📝 Notas Importantes

1. **Web Speech API está deshabilitado:**
   - No se usa como fallback
   - Causaba doble solicitud de permisos
   - Whisper es superior para transcripción médica

2. **Botón de grabación deshabilitado:**
   - Actualmente muestra "Coming Soon"
   - Usuario debe pegar transcript manualmente
   - Funcionalidad de grabación existe pero está desactivada en UI

3. **Transcripción en dos fases:**
   - Primer chunk: transcripción inmediata (feedback)
   - Audio completo: transcripción final al detener

4. **Normalización de MIME types:**
   - Arregla errores comunes (webrm → webm)
   - Normaliza múltiples slashes
   - Asegura compatibilidad con Whisper

5. **Prompt clínico incluido:**
   - Cada transcripción incluye contexto clínico
   - Vocabulario médico sesgado
   - Compliance PHIPA/PIPEDA

---

## 📚 Referencias de Código

- **Hook principal:** `src/hooks/useTranscript.ts`
- **Servicio principal:** `src/services/OpenAIWhisperService.ts`
- **Fallback (deshabilitado):** `src/services/WebSpeechSTTService.ts`
- **UI:** `src/components/workflow/TranscriptArea.tsx`
- **Página:** `src/pages/ProfessionalWorkflowPage.tsx`
- **Prompting:** `src/core/ai/PromptFactory-Canada.ts`
- **Processor:** `src/hooks/useNiagaraProcessor.ts`

---

**Última actualización:** 2026-01-04  
**Estado:** Funcional pero grabación deshabilitada en UI

