# 🔧 Bug Fix: Long Audio Transcription Timeout

**Date:** November 21, 2025  
**Status:** ✅ **FIXED**  
**Priority:** 🔴 **CRITICAL** - Blocks long interviews

---

## 🐛 PROBLEMA REPORTADO

**"Cuando realicé una entrevista de casi 10 minutos el procesamiento del audio fue tan lento que nunca apareció la transcripción y se quedó en el recuadro amarillo diciendo que se estaba realizando, lo que después de más de 5 minutos no hubo resultados."**

**Síntomas:**
- Grabación de ~10 minutos
- "Processing audio..." se queda colgado
- Más de 5 minutos sin resultados
- Sin feedback de progreso
- Sin manejo de timeout

---

## 🔍 CAUSAS IDENTIFICADAS

### **Problema 1: Sin timeout en fetch**
- No hay timeout configurado en la llamada a Whisper API
- Si la API tarda mucho, el request puede colgarse indefinidamente
- No hay forma de cancelar o detectar el problema

### **Problema 2: Archivos grandes sin validación**
- 10 minutos de audio pueden ser > 25MB
- Whisper API tiene límites prácticos (~25MB, ~10 minutos)
- No validamos tamaño antes de enviar

### **Problema 3: Sin división de archivos grandes**
- Intentamos transcribir el archivo completo de una vez
- Archivos grandes pueden fallar o tardar demasiado
- No hay estrategia de dividir y procesar en chunks

### **Problema 4: Sin feedback de progreso**
- Usuario no sabe qué está pasando
- No hay indicador de progreso
- No hay estimación de tiempo restante

---

## ✅ SOLUCIONES IMPLEMENTADAS

### **1. Timeout en fetch**

```typescript
// Add timeout for long transcriptions
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const controller = new AbortController();
const timeoutId = setTimeout(() => {
  controller.abort();
}, TIMEOUT_MS);

const response = await fetch(this.API_URL, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${this.API_KEY}`
  },
  body: formData,
  signal: controller.signal
});

clearTimeout(timeoutId);
```

**Beneficios:**
- Evita requests colgados indefinidamente
- Proporciona error claro después de 5 minutos
- Permite al usuario saber que algo salió mal

---

### **2. Validación de tamaño máximo**

```typescript
const MAX_FILE_SIZE_MB = 25; // 25MB limit
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const fileSizeMB = audioBlob.size / (1024 * 1024);

if (audioBlob.size > MAX_FILE_SIZE_BYTES) {
  throw new Error(`El archivo de audio es muy grande (${fileSizeMB.toFixed(2)} MB). El límite máximo es ${MAX_FILE_SIZE_MB} MB. Por favor, divida la grabación en segmentos más cortos.`);
}
```

**Beneficios:**
- Detecta archivos muy grandes antes de procesarlos
- Proporciona mensaje claro al usuario
- Evita enviar requests que sabemos que fallarán

---

### **3. División automática de archivos grandes**

```typescript
const transcribeLargeAudio = async (largeBlob: Blob, blobType: string) => {
  const CHUNK_SIZE_MB = 20; // Split into ~20MB chunks
  const totalChunks = Math.ceil(largeBlob.size / CHUNK_SIZE_BYTES);
  
  // Process each chunk sequentially
  for (let i = 0; i < totalChunks; i++) {
    const chunkBlob = largeBlob.slice(start, end, blobType);
    const result = await OpenAIWhisperService.transcribe(chunkBlob);
    allTranscripts.push(result.text);
    appendTranscript(result.text); // Progressive update
  }
};
```

**Beneficios:**
- Divide archivos grandes automáticamente
- Procesa en chunks manejables
- Actualiza transcripción progresivamente
- Evita timeouts y errores

---

### **4. Manejo mejorado de errores de timeout**

```typescript
if (error.name === 'AbortError' || error.message.includes('aborted')) {
  throw new Error(`La transcripción está tomando demasiado tiempo (más de 5 minutos). El archivo puede ser muy largo (${fileSizeMB.toFixed(2)} MB). Por favor, intente dividir la grabación en segmentos más cortos o grabe nuevamente.`);
}
```

**Beneficios:**
- Detecta timeouts específicamente
- Proporciona mensaje claro y accionable
- Incluye información útil (tamaño del archivo)

---

### **5. Feedback de progreso**

```typescript
setError(`Procesando audio largo: dividiendo en ${totalChunks} segmentos...`);
setError(`Procesando segmento ${i + 1} de ${totalChunks}...`);
```

**Beneficios:**
- Usuario sabe qué está pasando
- Ve progreso en tiempo real
- No se queda sin feedback

---

## 📋 ARCHIVOS MODIFICADOS

- `src/services/OpenAIWhisperService.ts`
  - Agregado timeout de 5 minutos
  - Agregada validación de tamaño máximo (25MB)
  - Mejorado manejo de errores de timeout
  - Agregado logging de tamaño de archivo

- `src/hooks/useTranscript.ts`
  - Agregada función `transcribeLargeAudio` para dividir archivos grandes
  - Agregada detección automática de archivos grandes
  - Agregado feedback de progreso durante división
  - Mejorado logging con tamaño de archivo

---

## 🧪 TESTING REQUERIDO

### **Test 1: Audio largo (> 10 minutos)**
1. Grabar audio durante 10-15 minutos
2. **Verificar:** Se detecta archivo grande
3. **Verificar:** Se divide automáticamente
4. **Verificar:** Feedback de progreso aparece
5. **Verificar:** Transcripción completa al final

### **Test 2: Timeout**
1. Simular timeout (si es posible)
2. **Verificar:** Error claro después de 5 minutos
3. **Verificar:** Mensaje incluye tamaño del archivo
4. **Verificar:** No se queda colgado indefinidamente

### **Test 3: Archivo muy grande (> 25MB)**
1. Intentar transcribir archivo > 25MB
2. **Verificar:** Error antes de enviar a API
3. **Verificar:** Mensaje claro sobre límite
4. **Verificar:** Sugerencia de dividir manualmente

### **Test 4: Archivo mediano (5-10 minutos)**
1. Grabar audio de 5-10 minutos
2. **Verificar:** Se transcribe sin dividir
3. **Verificar:** Completa en tiempo razonable (< 5 minutos)
4. **Verificar:** No hay errores

---

## ✅ VERIFICACIÓN

- ✅ Sin errores de linting
- ✅ Build compilando correctamente
- ✅ Timeout implementado
- ✅ Validación de tamaño
- ✅ División automática de archivos grandes
- ✅ Feedback de progreso

---

## 🎯 BENEFICIOS

1. **Elimina colgues:** Timeout evita requests infinitos
2. **Maneja archivos grandes:** División automática
3. **Mejor UX:** Feedback de progreso claro
4. **Mensajes claros:** Errores específicos y accionables
5. **Transcripción progresiva:** Usuario ve resultados mientras se procesan

---

## 📝 NOTAS TÉCNICAS

### **Límites de Whisper API:**
- **Tamaño máximo:** ~25MB (práctico)
- **Duración máxima:** ~10 minutos (práctico)
- **Timeout recomendado:** 5 minutos por request

### **Estrategia de división:**
- Dividir en chunks de ~20MB
- Procesar secuencialmente (evita rate limiting)
- Combinar resultados progresivamente
- Mantener contexto entre chunks

### **Por qué 5 minutos de timeout:**
- Whisper puede tardar 1-3 minutos para archivos grandes
- 5 minutos da margen sin ser excesivo
- Evita colgues indefinidos

---

**Status:** ✅ **FIXED - Ready for Testing**

