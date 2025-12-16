# 🔍 Investigación: Whisper API - Manejo de Audios Largos

**Date:** November 21, 2025  
**Status:** ✅ **COMPLETED**  
**Source:** OpenAI Official Documentation

---

## 📋 OBJETIVO

Investigar documentación oficial de OpenAI Whisper API sobre:
- Límites de tamaño y duración
- Mejores prácticas para archivos largos
- Manejo de timeouts
- Formatos soportados
- Estrategias recomendadas

---

## 🔍 RESULTADOS DE INVESTIGACIÓN

### **1. LÍMITE DE TAMAÑO DE ARCHIVO**

**Fuente:** [OpenAI Help Center - Audio API FAQ](https://help.openai.com/es-419/articles/7031512-audio-api-faq)

> **"La API de Whisper tiene un tamaño máximo de archivo de 25 MB."**

**Implicaciones:**
- ✅ Nuestro límite de 25MB está correcto
- ✅ Archivos > 25MB deben dividirse antes de enviar
- ✅ No hay límite de duración explícito, solo tamaño

---

### **2. PROCESAMIENTO INTERNO DE WHISPER**

**Fuente:** [OpenAI Blog - Introducing Whisper](https://openai.com/es-ES/index/whisper/)

> **"Whisper divide el audio de entrada en segmentos de 30 segundos, los convierte en espectrogramas log-Mel y los procesa mediante un codificador."**

**Implicaciones:**
- ✅ Whisper procesa internamente en segmentos de 30 segundos
- ✅ No necesitamos dividir en 30 segundos manualmente
- ✅ El modelo maneja la división interna automáticamente
- ⚠️ Pero el archivo completo debe ser < 25MB

---

### **3. NO SOPORTA STREAMING EN TIEMPO REAL**

**Fuente:** [OpenAI Help Center - Audio API FAQ](https://help.openai.com/es-419/articles/7031512-audio-api-faq)

> **"El modelo `whisper-1` no admite la transcripción en tiempo real de transmisiones de audio en curso."**

**Implicaciones:**
- ✅ Nuestra estrategia actual (grabar completo, luego transcribir) es correcta
- ❌ No podemos hacer streaming en tiempo real
- ✅ Necesitamos archivos completos y válidos

---

### **4. FORMATOS SOPORTADOS**

**Fuente:** [OpenAI Blog - Introducing ChatGPT and Whisper APIs](https://openai.com/es-ES/index/introducing-chatgpt-and-whisper-apis/)

**Formatos aceptados:**
- `m4a`
- `mp3`
- `mp4`
- `mpeg`
- `mpga`
- `wav`
- `webm` ✅ (nuestro formato actual)

**Implicaciones:**
- ✅ WebM está soportado oficialmente
- ✅ No necesitamos conversión de formato
- ✅ El problema no es el formato, sino cómo dividimos

---

### **5. RECOMENDACIÓN OFICIAL PARA ARCHIVOS LARGOS**

**Fuente:** [OpenAI Help Center - Audio API FAQ](https://help.openai.com/es-419/articles/7031512-audio-api-faq)

> **"Si los usuarios necesitan transcribir archivos más grandes, se recomienda dividir el audio en segmentos más pequeños antes de enviarlos para su transcripción."**

**⚠️ IMPORTANTE:** La documentación NO especifica CÓMO dividir correctamente.

**Implicaciones:**
- ✅ OpenAI recomienda dividir manualmente
- ❌ No proporcionan herramientas o métodos específicos
- ⚠️ La división debe crear archivos válidos y completos
- ⚠️ `Blob.slice()` NO crea archivos válidos para WebM

---

### **6. CALIDAD Y COHERENCIA AL DIVIDIR**

**Fuente:** [OpenAI Help Center - Audio API FAQ](https://help.openai.com/es-419/articles/7031512-audio-api-faq)

> **"Al dividir archivos de audio, se debe asegurar que los segmentos mantengan la coherencia y la calidad necesarias para una transcripción precisa."**

**Implicaciones:**
- ✅ Los segmentos deben ser archivos válidos y completos
- ✅ Deben mantener calidad de audio
- ✅ Deben preservar contexto cuando sea posible
- ⚠️ `Blob.slice()` no garantiza esto

---

## 🎯 CONCLUSIONES PARA NUESTRA IMPLEMENTACIÓN

### **✅ Lo que estamos haciendo BIEN:**

1. **Límite de 25MB:** Correcto según documentación oficial
2. **Timeout de 5 minutos:** Razonable para archivos grandes
3. **Formato WebM:** Soportado oficialmente
4. **Validación de tamaño:** Detectamos archivos > 25MB antes de enviar
5. **Estrategia de grabación completa:** Correcta (no streaming)

### **⚠️ Lo que necesitamos MEJORAR:**

1. **División manual:** OpenAI recomienda dividir, pero NO especifica cómo
2. **Archivos válidos:** `Blob.slice()` no crea archivos WebM válidos
3. **Estrategia actual:** Intentar completo y guiar al usuario es correcto

### **🚀 OPCIONES FUTURAS:**

1. **Procesamiento en servidor:**
   - Usar `ffmpeg` para dividir correctamente
   - Crear archivos válidos con headers completos
   - Respeta estructura del contenedor
   - Mantiene calidad y coherencia

2. **Conversión a WAV:**
   - WAV es más simple (menos estructura de contenedor)
   - Más fácil de dividir sin corromper
   - Requiere conversión adicional
   - Puede aumentar tamaño de archivo

3. **Esperar mejoras:**
   - OpenAI puede mejorar límites en el futuro
   - O proporcionar herramientas de división
   - O lanzar API de streaming

---

## 📊 COMPARACIÓN: ESTRATEGIAS

| Estrategia | Archivos Válidos | Complejidad | Recomendación OpenAI | Estado |
|------------|------------------|-------------|----------------------|--------|
| **Blob.slice() manual** | ❌ No | Baja | ⚠️ No especificado | ❌ No funciona |
| **Transcripción completa** | ✅ Sí | Baja | ✅ Permitido | ✅ Implementado |
| **Procesamiento servidor** | ✅ Sí | Alta | ✅ Recomendado | ⏳ Pendiente |
| **Conversión a WAV** | ⚠️ Tal vez | Media | ⚠️ No mencionado | ⏳ Pendiente |

---

## 📝 REFERENCIAS OFICIALES

1. **OpenAI Help Center - Audio API FAQ:**
   - https://help.openai.com/es-419/articles/7031512-audio-api-faq
   - Límite de 25MB
   - Recomendación de dividir archivos grandes
   - No streaming en tiempo real

2. **OpenAI Blog - Introducing Whisper:**
   - https://openai.com/es-ES/index/whisper/
   - Procesamiento interno en segmentos de 30 segundos
   - Arquitectura del modelo

3. **OpenAI Blog - Introducing ChatGPT and Whisper APIs:**
   - https://openai.com/es-ES/index/introducing-chatgpt-and-whisper-apis/
   - Formatos soportados (m4a, mp3, mp4, mpeg, mpga, wav, webm)
   - Endpoints disponibles

4. **OpenAI Platform Documentation:**
   - https://platform.openai.com/docs/guides/speech-to-text
   - https://platform.openai.com/docs/api-reference/audio
   - Guías de uso y mejores prácticas

---

## ✅ RECOMENDACIÓN FINAL

### **Estrategia actual (CORRECTA):**

1. ✅ Validar tamaño máximo (25MB)
2. ✅ Intentar transcripción completa con timeout (5 minutos)
3. ✅ Si falla, guiar al usuario a grabar segmentos más cortos manualmente
4. ✅ Mensaje claro: "Grabe en segmentos de 5-7 minutos"

### **Razón:**

- OpenAI recomienda dividir, pero **NO especifica cómo hacerlo correctamente**
- `Blob.slice()` no crea archivos válidos (confirmado técnicamente)
- Guiar al usuario es la solución más confiable actualmente
- Mantiene calidad y coherencia (requisito oficial)

### **Futuro:**

1. **Implementar procesamiento en servidor con `ffmpeg`:**
   - Divide correctamente respetando estructura WebM
   - Crea archivos válidos con headers completos
   - Mantiene calidad y coherencia
   - Procesa cada segmento independientemente

2. **O esperar herramientas oficiales:**
   - OpenAI puede proporcionar herramientas de división
   - O mejorar límites de tamaño
   - O lanzar API de streaming

---

## 🔍 NOTAS TÉCNICAS ADICIONALES

### **¿Por qué Whisper procesa en 30 segundos?**

- El modelo está entrenado con segmentos de 30 segundos
- Procesa cada segmento independientemente
- Mantiene contexto entre segmentos cuando es posible
- Esto es interno y automático

### **¿Por qué 25MB es el límite?**

- Probablemente relacionado con:
  - Tiempo de procesamiento (más grande = más tiempo)
  - Límites de memoria del servidor
  - Experiencia de usuario (timeouts)
- No hay límite de duración explícito, solo tamaño

### **¿Cómo dividir correctamente?**

**OpenAI NO especifica**, pero técnicamente necesitamos:
1. Herramientas que respeten estructura del contenedor (ffmpeg)
2. Archivos válidos con headers completos
3. Mantener calidad de audio
4. Preservar contexto cuando sea posible

---

**Status:** ✅ **RESEARCH COMPLETED**
