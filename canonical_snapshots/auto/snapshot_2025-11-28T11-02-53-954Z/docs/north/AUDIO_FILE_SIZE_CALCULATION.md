# 📊 Cálculo: Tamaño de Audio para Entrevistas Médicas

**Date:** November 21, 2025  
**Status:** ✅ **COMPLETED**  
**Context:** Evaluar si archivos de 15 minutos exceden límite de 25MB

---

## 🎤 CONFIGURACIÓN ACTUAL

**Formato:** WebM con codec Opus  
**Sample Rate:** 48,000 Hz (según `useTranscript.ts`)  
**Canales:** Mono (voz)  
**Bitrate:** No especificado explícitamente (navegador decide automáticamente)

---

## 📊 CÁLCULOS POR BITRATE

### **Para 15 minutos (900 segundos):**

| Bitrate | KB/s | Tamaño (15 min) | Estado |
|---------|------|-----------------|--------|
| **64 kbps** (voz básica) | 8 KB/s | ~7 MB | ✅ Bien dentro |
| **96 kbps** (voz clara) | 12 KB/s | ~10.5 MB | ✅ Bien dentro |
| **128 kbps** (alta calidad) | 16 KB/s | ~14 MB | ✅ Dentro del límite |
| **192 kbps** (muy alta) | 24 KB/s | ~21 MB | ⚠️ Cerca del límite |
| **256 kbps** (excesivo) | 32 KB/s | ~28 MB | ❌ Excede límite |

---

## 🔍 FACTORES QUE AFECTAN EL TAMAÑO

### **1. Bitrate (más importante):**
- **Voz humana:** 64-128 kbps es suficiente
- **Opus codec:** Muy eficiente para voz
- **Navegador decide:** Puede variar según dispositivo

### **2. Calidad de audio:**
- **Ruido de fondo:** Aumenta tamaño
- **Compresión:** Más eficiente = menor tamaño
- **Eco/reverberación:** Puede aumentar tamaño

### **3. Configuración del navegador:**
- **Chrome/Edge:** Típicamente 64-128 kbps para Opus
- **Safari:** Puede usar bitrate diferente
- **Firefox:** Similar a Chrome

---

## 📊 ESCENARIOS REALES

### **Escenario 1: Entrevista médica típica (15 min)**
- **Bitrate:** ~96 kbps (voz clara)
- **Tamaño:** ~10.5 MB
- **Estado:** ✅ **Bien dentro del límite**

### **Escenario 2: Entrevista con ruido de fondo (15 min)**
- **Bitrate:** ~128 kbps (mayor complejidad)
- **Tamaño:** ~14 MB
- **Estado:** ✅ **Dentro del límite**

### **Escenario 3: Entrevista muy larga (30 min)**
- **Bitrate:** ~96 kbps
- **Tamaño:** ~21 MB
- **Estado:** ⚠️ **Cerca del límite de 25MB**

### **Escenario 4: Entrevista muy larga con alta calidad (30 min)**
- **Bitrate:** ~128 kbps
- **Tamaño:** ~28 MB
- **Estado:** ❌ **Excede límite de 25MB**

---

## 🎯 CONCLUSIÓN PARA NUESTRO CASO

### **15 minutos típicamente:**
- **Tamaño esperado:** 7-14 MB
- **Límite Whisper:** 25 MB
- **Margen de seguridad:** ~11-18 MB
- **Estado:** ✅ **Bien dentro del límite**

### **Riesgo de exceder 25MB:**
- ⚠️ Si bitrate es muy alto (>200 kbps)
- ⚠️ Si hay mucho ruido/compresión ineficiente
- ⚠️ Si entrevista es >30 minutos con alta calidad

---

## ✅ RECOMENDACIONES

### **1. Monitorear tamaño real:**
```typescript
// Agregar logging en useTranscript.ts
console.log(`[useTranscript] Audio blob size: ${blob.size / 1024 / 1024} MB`);
```

### **2. Optimizar si necesario:**
- Reducir sample rate a 24,000 Hz (suficiente para voz)
- Forzar bitrate más bajo si es configurable
- Considerar compresión adicional

### **3. Manejar archivos largos:**
- Si >25MB, usar estrategia actual (timeout + guiar usuario)
- O considerar Deepgram (límite 2GB) si se vuelve frecuente

---

## 📝 FÓRMULA GENERAL

**Tamaño (MB) = (Bitrate (kbps) × Duración (minutos)) / 8 / 1024**

**Ejemplos:**
- 15 min @ 96 kbps = (96 × 15) / 8 / 1024 = **~10.5 MB**
- 30 min @ 128 kbps = (128 × 30) / 8 / 1024 = **~28 MB**

---

## 🔍 VERIFICACIÓN EN PRODUCCIÓN

**Recomendación:** Agregar logging para monitorear tamaños reales:

```typescript
// En useTranscript.ts, después de crear finalBlob
const fileSizeMB = finalBlob.size / (1024 * 1024);
const durationMinutes = audioDurationSeconds / 60;
const estimatedBitrate = (fileSizeMB * 8 * 1024) / durationMinutes;

console.log(`[useTranscript] Audio stats:`, {
  duration: `${durationMinutes.toFixed(1)} min`,
  size: `${fileSizeMB.toFixed(2)} MB`,
  estimatedBitrate: `${estimatedBitrate.toFixed(0)} kbps`,
  limit: '25 MB',
  margin: `${(25 - fileSizeMB).toFixed(2)} MB`
});
```

---

**Status:** ✅ **CALCULATION COMPLETED - 15 MINUTES TYPICALLY 7-14 MB**

