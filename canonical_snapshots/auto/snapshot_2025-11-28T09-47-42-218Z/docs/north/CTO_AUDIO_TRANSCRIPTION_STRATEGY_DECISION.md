# 🎯 CTO DECISION: Audio Transcription Strategy

**Date:** November 21, 2025  
**Priority:** 🔴 **URGENT** - Blocking production issues  
**Status:** ⏳ **AWAITING CTO APPROVAL**

---

## 🚨 SITUACIÓN ACTUAL

### **Problemas Críticos Reportados:**

1. **Grabaciones largas (>10 minutos) se quedan colgadas**
   - "Processing audio..." indefinidamente
   - Más de 5 minutos sin resultados
   - Usuarios no pueden completar transcripciones
   - **Evidencia:** Usuario reportó entrevista de 10 minutos sin transcripción después de 5+ minutos

2. **Archivos grandes exceden límite de Whisper API**
   - Límite: 25 MB
   - 15 minutos típicamente: 7-14 MB ✅
   - 30+ minutos: Puede exceder 25 MB ⚠️

3. **División manual no funciona técnicamente**
   - `Blob.slice()` crea archivos WebM inválidos
   - Mismo problema que chunks intermedios
   - Whisper rechaza chunks sin headers completos

4. **Errores de MIME type malformado (CRÍTICO - Activo)**
   - Errores: `audio//webrm;codecs=opus` (doble slash, typo)
   - Primer chunk transcribe exitosamente
   - Chunks siguientes fallan con "corrupted or unsupported"
   - **Evidencia consola:** Múltiples errores 400 de Whisper API
   - **Impacto:** Transcripciones incompletas o fallidas

5. **Grabación se detiene después del primer segundo**
   - MediaRecorder se detiene inesperadamente
   - No hay errores visibles al usuario
   - "Processing audio..." intermitente
   - **Evidencia:** Usuario reportó grabación solo del primer segundo

6. **Doble solicitud de permiso de micrófono**
   - Dos prompts de permiso consecutivos
   - Confusión del usuario
   - **Estado:** ✅ Ya corregido (Web Speech API deshabilitado)

---

## 📊 ALTERNATIVAS ANALIZADAS

### **Opción 1: Mantener OpenAI Whisper API (Actual)**

**Pros:**
- ✅ Ya implementado y funcionando
- ✅ Precio razonable ($0.006/minuto)
- ✅ Escalabilidad automática
- ✅ Compliance PHIPA (datos en Canadá)

**Contras:**
- ❌ Límite de 25 MB (problema para archivos largos)
- ❌ No streaming en tiempo real
- ❌ Timeout de 5 minutos puede no ser suficiente
- ❌ División manual no es viable técnicamente

**Costo:** $0.006/minuto  
**Tiempo de implementación:** Ya implementado  
**Riesgo:** Medio (problemas con archivos largos)

---

### **Opción 2: Migrar a Deepgram**

**Pros:**
- ✅ Límite de 2 GB (resuelve problema de archivos largos)
- ✅ Streaming en tiempo real (<300ms latencia)
- ✅ ~20% más barato ($0.0048/minuto)
- ✅ Diarización y timestamps por palabra

**Contras:**
- ❌ Afirmaciones de precisión no verificadas independientemente
- ❌ Requiere migración completa (12-24 horas desarrollo)
- ❌ Nuevo proveedor = nuevo riesgo
- ❌ Necesitaríamos verificar compliance PHIPA
- ❌ Benchmarks de marketing pueden ser exagerados

**Costo:** $0.0048/minuto (Nova-2)  
**Tiempo de implementación:** 12-24 horas  
**Riesgo:** Alto (proveedor nuevo, afirmaciones no verificadas)

---

### **Opción 3: Whisper Local con Transformers**

**Pros:**
- ✅ División automática correcta durante inferencia
- ✅ Sin límite de tamaño
- ✅ Control total del proceso

**Contras:**
- ❌ Requiere servidor con GPU ($0.50-$2.00/hora)
- ❌ Complejidad alta de implementación
- ❌ Costo similar o mayor que API
- ❌ Tiempo de desarrollo adicional significativo

**Costo:** $0.50-$2.00/hora GPU + infraestructura  
**Tiempo de implementación:** 40-80 horas  
**Riesgo:** Muy alto (infraestructura compleja)

---

### **Opción 4: Procesamiento Servidor con ffmpeg**

**Pros:**
- ✅ División correcta respetando estructura WebM
- ✅ Archivos válidos con headers completos
- ✅ Mantiene calidad y coherencia
- ✅ Usa infraestructura existente (Firebase Functions)

**Contras:**
- ❌ Requiere desarrollo adicional (8-16 horas)
- ❌ Procesamiento adicional puede aumentar latencia
- ❌ Costo de procesamiento servidor

**Costo:** ~$0.001-0.002 por transcripción (procesamiento)  
**Tiempo de implementación:** 8-16 horas  
**Riesgo:** Bajo-Medio (desarrollo controlado)

---

## 🎯 RECOMENDACIÓN ESTRATÉGICA

### **FASE 1: SOLUCIÓN INMEDIATA (Esta semana)**

**Implementar mejoras en Whisper API actual:**

1. ✅ **Timeout extendido:** Ya implementado (5 minutos)
2. ✅ **Validación de tamaño:** Ya implementado (25 MB)
3. ✅ **Mensajes claros:** Ya implementado (guiar usuario)
4. 🔄 **Agregar logging:** Monitorear tamaños reales en producción
5. 🔄 **Optimizar calidad:** Reducir bitrate si necesario

**Costo:** $0 (ya implementado)  
**Tiempo:** 2-4 horas (logging y optimización)  
**Riesgo:** Bajo

---

### **FASE 2: SOLUCIÓN MEDIANO PLAZO (Sprint 3)**

**Si archivos largos se vuelven frecuentes:**

**Opción A: Procesamiento Servidor con ffmpeg**
- Dividir archivos >25MB correctamente
- Procesar cada segmento independientemente
- Combinar transcripciones

**Costo:** ~$0.001-0.002 por transcripción  
**Tiempo:** 8-16 horas desarrollo  
**Riesgo:** Bajo-Medio

**Opción B: Migrar a Deepgram (si pruebas confirman beneficios)**
- Límite 2GB resuelve problema
- Streaming mejoraría UX
- Requiere prueba piloto primero

**Costo:** $0.0048/minuto + migración  
**Tiempo:** 12-24 horas + pruebas  
**Riesgo:** Medio-Alto

---

## 📊 ANÁLISIS DE COSTO-BENEFICIO

### **Escenario: 100 horas de audio/mes**

| Opción | Costo/mes | Desarrollo | Riesgo | Resuelve Problema |
|--------|-----------|------------|--------|-------------------|
| **Whisper API (mejorado)** | $36 | 2-4h | Bajo | ⚠️ Parcial |
| **Deepgram** | $28.80 | 12-24h | Alto | ✅ Sí |
| **Whisper Local** | $50-200 | 40-80h | Muy Alto | ✅ Sí |
| **ffmpeg Servidor** | $36.10 | 8-16h | Medio | ✅ Sí |

---

## ✅ DECISIÓN RECOMENDADA

### **APROBAR: Fase 1 (Inmediata)**

**Acciones:**
1. ✅ Mantener Whisper API con mejoras ya implementadas
2. 🔄 Agregar logging para monitorear tamaños reales
3. 🔄 Optimizar calidad de grabación si necesario
4. 🔄 Guiar usuarios a grabar en segmentos <15 minutos
5. ✅ **CRÍTICO:** Verificar que normalización MIME type esté funcionando correctamente
6. ✅ **CRÍTICO:** Validar que MediaRecorder no se detenga inesperadamente
7. ✅ **CRÍTICO:** Mejorar manejo de errores para mostrar mensajes claros al usuario

**Problemas Específicos a Resolver:**
- ✅ MIME type malformado (`audio//webrm` → `audio/webm`) - Ya implementado, verificar funcionamiento
- ✅ Chunks intermedios corruptos - Ya implementado (solo primer chunk + final), verificar
- ✅ MediaRecorder deteniéndose - Ya implementado (handlers), verificar logs
- 🔄 Feedback de progreso mejorado - Pendiente

**Timeline:** Esta semana  
**Costo:** $0 (solo desarrollo)  
**Riesgo:** Bajo

---

### **EVALUAR: Fase 2 (Sprint 3)**

**Criterios para decidir:**
- Si >20% de transcripciones exceden 25MB
- Si usuarios reportan problemas frecuentes
- Si volumen aumenta significativamente

**Opciones a evaluar:**
1. Procesamiento servidor con ffmpeg (recomendado)
2. Migrar a Deepgram (solo si pruebas confirman beneficios)

---

## 🚨 ACCIÓN INMEDIATA REQUERIDA

### **Para resolver problemas actuales:**

1. **Monitorear producción:**
   - Agregar logging de tamaños de archivo
   - Identificar frecuencia de archivos >25MB
   - Medir tiempos de transcripción

2. **Optimizar grabación:**
   - Verificar bitrate real usado
   - Considerar reducir sample rate si necesario
   - Optimizar configuración MediaRecorder

3. **Mejorar UX:**
   - Mensajes claros sobre límites
   - Sugerir segmentos de 10-15 minutos máximo
   - Feedback de progreso mejorado

---

## 📋 CHECKLIST DE APROBACIÓN

- [ ] **CTO aprueba Fase 1 (mejoras inmediatas)**
- [ ] **Asignar 2-4 horas desarrollo esta semana**
- [ ] **Monitorear producción durante 2 semanas**
- [ ] **Evaluar necesidad de Fase 2 basado en datos**
- [ ] **Decidir Fase 2 en Sprint 3 planning**

---

## 🎯 RESUMEN EJECUTIVO

**Problema:** Archivos largos (>10 min) se quedan colgados, límite 25MB puede excederse.

**Solución inmediata:** Mantener Whisper API con mejoras ya implementadas + logging + optimización.

**Solución futura:** Evaluar procesamiento servidor con ffmpeg o Deepgram basado en datos de producción.

**Recomendación:** ✅ **Aprobar Fase 1, evaluar Fase 2 en Sprint 3.**

---

**Status:** ⏳ **AWAITING CTO APPROVAL**

**Next Steps:** CTO revisa y aprueba Fase 1, asigna recursos para implementación inmediata.

