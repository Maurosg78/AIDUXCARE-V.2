# 🎤 Requisitos para Activar Grabación de Audio

**Fecha:** 2026-01-04  
**Estado:** ⚠️ **PENDIENTE - LISTO PARA ACTIVAR**  
**Prioridad:** 🟡 **MEDIA** - Funcionalidad core deshabilitada temporalmente

---

## 📋 RESUMEN EJECUTIVO

La grabación de audio está **funcionalmente completa** pero **deshabilitada en la UI** con el mensaje "Coming Soon". El código backend está listo y los bugs críticos han sido resueltos. Solo se requiere:

1. ✅ **Configurar API Key de OpenAI** (Whisper)
2. ✅ **Habilitar botón en UI** (cambio simple)
3. ✅ **Validar en dispositivos reales** (recomendado)

---

## 🔍 ESTADO ACTUAL

### **Código Backend: ✅ COMPLETO**

- ✅ `useTranscript.ts` - Hook funcional y probado
- ✅ `OpenAIWhisperService.ts` - Servicio de transcripción listo
- ✅ Manejo de errores implementado
- ✅ Validación de chunks implementada
- ✅ Normalización de MIME types implementada
- ✅ Bugs críticos resueltos (ver documentación)

### **Código Frontend: ⚠️ DESHABILITADO**

**Ubicación:** `src/components/workflow/TranscriptArea.tsx` (línea ~209)

```typescript
// ACTUAL (deshabilitado):
<button
  onClick={startRecording}
  disabled={true}  // ← DESHABILITADO
  className="... cursor-not-allowed opacity-60"
>
  <Play />
  Start Recording (Coming Soon)
</button>
```

**Necesita cambiar a:**
```typescript
// ACTIVADO:
<button
  onClick={startRecording}
  className="... bg-gradient-to-r from-primary-blue to-primary-purple"
>
  <Play />
  Start Recording
</button>
```

---

## ✅ REQUISITOS PARA ACTIVAR

### **1. Configuración de Variables de Entorno** 🔑

**Archivo:** `.env` o `.env.local`

```bash
# ✅ REQUERIDO: API Key de OpenAI para Whisper
VITE_OPENAI_API_KEY=sk-...

# ✅ OPCIONAL: Modelo de Whisper (default: gpt-4o-mini-transcribe)
VITE_WHISPER_MODEL=gpt-4o-mini-transcribe

# ✅ OPCIONAL: URL de transcripción (default: OpenAI)
VITE_OPENAI_TRANSCRIPT_URL=https://api.openai.com/v1/audio/transcriptions
```

**Validación:**
```typescript
// src/services/OpenAIWhisperService.ts
private static ensureConfigured() {
  if (!this.API_KEY) {
    throw new Error("Servicio de transcripción no configurado. Contacte al administrador.");
  }
}
```

**⚠️ IMPORTANTE:**
- La API key debe tener acceso a Whisper API
- Costo aproximado: ~$0.006 por minuto de audio
- Límite práctico: 25MB por archivo (~10 minutos)

---

### **2. Habilitar Botón en UI** 🎨

**Archivo:** `src/components/workflow/TranscriptArea.tsx`

**Cambio necesario:**

```diff
- <button
-   onClick={startRecording}
-   disabled={true}
-   title="Voice recording temporarily unavailable..."
-   className="... cursor-not-allowed opacity-60"
- >
-   <Play />
-   Start Recording (Coming Soon)
- </button>
+ <button
+   onClick={startRecording}
+   className="... bg-gradient-to-r from-primary-blue to-primary-purple"
+ >
+   <Play />
+   Start Recording
+ </button>
```

**También remover banner informativo (opcional):**
```diff
- <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50">
-   <AlertCircle />
-   <p>Voice recording is currently being improved...</p>
- </div>
```

---

### **3. Verificar Permisos del Navegador** 🌐

**Requisitos del navegador:**
- ✅ Chrome/Edge: Soporte completo
- ✅ Firefox: Soporte completo
- ✅ Safari: Soporte completo (iOS 14.3+)
- ✅ Opera: Soporte completo

**Permisos necesarios:**
- ✅ Microphone access (solicitado automáticamente)
- ✅ HTTPS (requerido para `getUserMedia()`)

**Nota:** En desarrollo local, `localhost` funciona sin HTTPS.

---

### **4. Validación en Dispositivos Reales** 📱

**Recomendado pero no bloqueante:**

| Dispositivo | Prioridad | Estado |
|------------|-----------|--------|
| Desktop Chrome | 🔴 ALTA | ✅ Probado |
| Desktop Safari | 🟡 MEDIA | ⚠️ Validar |
| iOS Safari | 🟡 MEDIA | ⚠️ Validar |
| Android Chrome | 🟡 MEDIA | ⚠️ Validar |

**Nota:** Según documentación, ya se validó en iPhone real con éxito.

---

## 🐛 BUGS RESUELTOS (Ya no son bloqueantes)

### ✅ **1. Double Microphone Permission** - RESUELTO
- **Problema:** Dos solicitudes de permiso
- **Solución:** Web Speech API deshabilitado, solo MediaRecorder
- **Estado:** ✅ FIXED

### ✅ **2. Audio Transcription Issues** - RESUELTO
- **Problema:** Chunks muy pequeños, errores silenciosos
- **Solución:** Validación de tamaño mínimo (2KB), logging mejorado
- **Estado:** ✅ FIXED

### ✅ **3. Recording Stops After First Second** - RESUELTO
- **Problema:** MediaRecorder se detenía inesperadamente
- **Solución:** Manejo completo de eventos, verificación de estado
- **Estado:** ✅ FIXED

---

## 📊 FUNCIONALIDADES DISPONIBLES

Una vez activado, el sistema soporta:

### **Modos de Grabación:**
1. **LIVE** (3 segundos por chunk)
   - Feedback en tiempo real
   - Ideal para conversación clínica
   - Transcripción incremental

2. **DICTATION** (10 segundos por chunk)
   - Prioriza completitud
   - Ideal para dictado post-consulta
   - Transcripción más precisa

### **Idiomas Soportados:**
- `auto` - Detección automática
- `en` - English (EN-CA)
- `es` - Español (LatAm)
- `fr` - Français (Canada)

### **Formatos de Audio:**
- `audio/webm;codecs=opus` (Chrome/Android) - Prioridad 1
- `audio/webm` (fallback WebM)
- `audio/mp4` (Safari/iOS)
- `audio/mpeg` (fallback general)

### **Límites:**
- Tamaño mínimo de chunk: 2KB
- Tamaño máximo de archivo: 25MB (~10 minutos)
- Timeout: 5 minutos para audio grande

---

## 🚀 PASOS PARA ACTIVAR

### **Paso 1: Configurar API Key**

```bash
# En .env o .env.local
echo "VITE_OPENAI_API_KEY=sk-tu-api-key-aqui" >> .env.local
```

**O en Codespaces/GitHub:**
```bash
gh secret set VITE_OPENAI_API_KEY --body "sk-tu-api-key-aqui"
```

### **Paso 2: Habilitar Botón**

Editar `src/components/workflow/TranscriptArea.tsx`:

```typescript
// Línea ~206-212
<button
  onClick={startRecording}
  // disabled={true}  ← REMOVER ESTA LÍNEA
  className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg bg-gradient-to-r from-primary-blue to-primary-purple hover:from-primary-blue-hover hover:to-primary-purple-hover text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 font-apple text-[15px]"
>
  <Play className="w-4 h-4" />
  Start Recording  {/* ← CAMBIAR DE "Coming Soon" */}
</button>
```

### **Paso 3: Remover Banner (Opcional)**

```typescript
// Línea ~185-190 (remover o comentar)
{/* 
<div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50">
  <AlertCircle />
  <p>Voice recording is currently being improved...</p>
</div>
*/}
```

### **Paso 4: Verificar**

1. Reiniciar servidor de desarrollo
2. Abrir aplicación
3. Click en "Start Recording"
4. Verificar que solicita permiso de micrófono
5. Grabar unos segundos
6. Verificar que aparece transcript

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### **1. Costos de API**
- Whisper API: ~$0.006 por minuto
- Para 100 consultas de 10 min: ~$6 USD
- Considerar límites de uso

### **2. Privacidad (PHIPA/PIPEDA)**
- ✅ Transcript se de-identifica antes de enviar a Vertex AI
- ✅ Audio se procesa localmente antes de enviar
- ✅ No se almacena audio sin transcripción

### **3. Rendimiento**
- Chunks pequeños pueden tener latencia
- Audio grande (>10 min) puede tener timeout
- Recomendado: segmentos de 5-10 minutos

### **4. Compatibilidad**
- Safari iOS requiere gesto de usuario antes de `getUserMedia()`
- Algunos navegadores antiguos no soportan MediaRecorder
- Validar en dispositivos objetivo

---

## 📝 CHECKLIST DE ACTIVACIÓN

- [ ] API Key de OpenAI configurada en `.env`
- [ ] API Key validada (probar con curl o Postman)
- [ ] Botón habilitado en `TranscriptArea.tsx`
- [ ] Banner "Coming Soon" removido (opcional)
- [ ] Servidor reiniciado
- [ ] Probado en Chrome Desktop
- [ ] Probado en Safari Desktop (opcional)
- [ ] Probado en iOS Safari (recomendado)
- [ ] Verificado permisos de micrófono
- [ ] Verificado transcripción funciona
- [ ] Verificado integración con análisis AI

---

## 🔗 REFERENCIAS

- **Documentación completa:** `docs/CAPTURA-AUDIO-COMPLETA.md`
- **Bugs resueltos:** `docs/north/BUGFIX_*.md`
- **Código principal:** `src/hooks/useTranscript.ts`
- **Servicio:** `src/services/OpenAIWhisperService.ts`
- **UI:** `src/components/workflow/TranscriptArea.tsx`

---

## 🎯 CONCLUSIÓN

**La grabación de audio está lista para activar.** Solo requiere:

1. ✅ Configurar `VITE_OPENAI_API_KEY`
2. ✅ Remover `disabled={true}` del botón
3. ✅ Cambiar texto de "Coming Soon" a "Start Recording"

**Tiempo estimado:** 5-10 minutos  
**Riesgo:** 🟢 BAJO (código ya probado, bugs resueltos)  
**Impacto:** 🟢 ALTO (funcionalidad core del sistema)

---

**Última actualización:** 2026-01-04  
**Autor:** Análisis basado en código actual

