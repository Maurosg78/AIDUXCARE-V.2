# 🎯 SPRINT 1.1: PIPELINE DE PROCESAMIENTO DE AUDIO Y TRANSCRIPCIÓN (STT)

## 📊 **Estado de Pre-Requisitos**
- [x] ✅ **Fase 0.5.A**: Supabase Singleton implementado y funcionando
- [x] ✅ **Fase 0.5.B**: Suite de tests estabilizada y ejecutándose
- [x] ✅ **Infraestructura base**: Completamente estable

---

## 🎯 **Objetivos del Sprint 1.1**
Implementar un pipeline completo de procesamiento de audio que permita:
1. **Carga y validación** de archivos de audio
2. **Transcripción STT** con diarización básica
3. **Almacenamiento real** en Supabase (no simulado)
4. **Integración fluida** en la página AudioProcessingPage.tsx

---

## 📋 **TAREA 1.1.1: INTERFAZ DE CARGA DE AUDIO**

### ✅ **Estado Actual** (Ya Implementado)
- [x] Componente `AudioFileUpload.tsx` funcionando
- [x] Validación de formatos (WAV, MP3, M4A, WEBM)
- [x] Validación de tamaño (máx 50MB)
- [x] UI drag-and-drop implementada
- [x] Indicadores de progreso

### 🔧 **Verificaciones Pendientes**
- [ ] **Verificar integración** con AudioProcessingPage.tsx
- [ ] **Probar carga** con archivos reales de diferentes formatos
- [ ] **Validar UI/UX** responsive en diferentes dispositivos
- [ ] **Confirmar manejo de errores** para archivos inválidos

---

## 📋 **TAREA 1.1.2: INTEGRACIÓN DEL SERVICIO STT**

### ✅ **Estado Actual** (Ya Implementado)
- [x] Servicio `AudioFileSTTService.ts` con Web Speech API
- [x] Fallback para navegadores no compatibles
- [x] Diarización básica implementada
- [x] Detección de speaker por pausas y cambios de tono
- [x] Formato de segmentos con timestamps

### 🔧 **Mejoras Pendientes**
- [ ] **Optimizar detección de speakers** con algoritmos más robustos
- [ ] **Implementar configuración** de sensibilidad de diarización
- [ ] **Añadir soporte** para idiomas adicionales (inglés, portugués)
- [ ] **Mejorar manejo** de archivos largos (>10 minutos)
- [ ] **Implementar chunks** para archivos de gran tamaño

### 💡 **Funciones Clave a Conectar**
```typescript
// En AudioFileSTTService.ts
- processAudioFile() → Transcripción principal
- identifySpeakers() → Diarización de speakers  
- formatTranscriptionSegments() → Formato final
```

---

## 📋 **TAREA 1.1.3: ALMACENAMIENTO REAL EN SUPABASE**

### ❌ **Estado Actual** (Simulado - Necesita Implementación Real)
- [x] Pipeline integrado en AudioProcessingPage.tsx
- [x] Simulación de almacenamiento funcionando
- [ ] **PENDIENTE**: Conexión real con Supabase
- [ ] **PENDIENTE**: Esquema de BD para transcripciones

### 🔧 **Implementación Requerida**

#### **A. Esquema de Base de Datos**
```sql
-- Tabla: audio_transcriptions
CREATE TABLE audio_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES visits(id),
  patient_id UUID REFERENCES patients(id), 
  professional_id UUID REFERENCES professionals(id),
  filename VARCHAR(255) NOT NULL,
  file_size BIGINT,
  duration_seconds INTEGER,
  audio_format VARCHAR(20),
  transcription_segments JSONB, -- Array de segmentos con speaker/timestamp
  full_text TEXT,
  processing_status VARCHAR(50) DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **B. Servicio de Almacenamiento**
- [ ] **Crear** `AudioTranscriptionService.ts`
- [ ] **Implementar** métodos CRUD para transcripciones
- [ ] **Conectar** con el Supabase Singleton
- [ ] **Validar** integridad de datos antes de guardar

#### **C. Integración con Pipeline Existente**
- [ ] **Reemplazar** simulación en AudioProcessingPage.tsx
- [ ] **Conectar** con EMRFormService para integración SOAP
- [ ] **Implementar** persistencia de archivos de audio (Supabase Storage)

---

## 📋 **TAREA 1.1.4: INTEGRACIÓN CON SERVICIOS EXISTENTES**

### 🔄 **Conexiones Requeridas**

#### **A. Con EMRFormService**
- [ ] **Conectar** transcripciones con formularios SOAP
- [ ] **Permitir** inserción automática en secciones EMR
- [ ] **Implementar** workflow: Audio → Transcripción → SOAP

#### **B. Con MCPManager**
- [ ] **Integrar** transcripciones como bloques de memoria contextual
- [ ] **Alimentar** al agente clínico con información de audio
- [ ] **Mantener** contexto entre transcripciones de la misma visita

#### **C. Con AuditLogger**
- [ ] **Registrar** eventos de procesamiento de audio
- [ ] **Trackear** tiempo de transcripción y precisión
- [ ] **Auditar** modificaciones a transcripciones

---

## 🔧 **PLAN DE IMPLEMENTACIÓN**

### **Día 1-2: Almacenamiento en Supabase**
1. **Crear esquema** de audio_transcriptions
2. **Implementar** AudioTranscriptionService.ts
3. **Probar** conexión con Supabase Singleton

### **Día 3-4: Integración del Pipeline**
1. **Conectar** AudioProcessingPage.tsx con servicio real
2. **Reemplazar** simulaciones por almacenamiento real
3. **Probar** flujo completo: Upload → STT → Storage

### **Día 5-6: Conexiones con Servicios Existentes**
1. **Integrar** con EMRFormService
2. **Conectar** con MCPManager para contexto
3. **Añadir** logging y auditoría

### **Día 7: Testing y Refinamiento**
1. **Tests unitarios** para AudioTranscriptionService
2. **Tests de integración** del pipeline completo
3. **UI/UX** polish y manejo de errores

---

## 🧪 **CRITERIOS DE ACEPTACIÓN**

### **Funcionalidad Principal**
- [ ] ✅ Usuario puede cargar archivo de audio (WAV/MP3/M4A)
- [ ] ✅ Transcripción STT se ejecuta automáticamente
- [ ] ✅ Resultado se almacena en Supabase (real, no simulado)
- [ ] ✅ Transcripción aparece en interfaz con speakers identificados
- [ ] ✅ Datos persisten entre sesiones

### **Integración con Servicios**
- [ ] ✅ Transcripción se puede insertar en formulario SOAP
- [ ] ✅ Audio alimenta contexto de memoria para agente clínico
- [ ] ✅ Eventos se registran correctamente en auditoría

### **Rendimiento y Robustez**
- [ ] ✅ Archivos hasta 50MB se procesan sin errores
- [ ] ✅ Tiempo de transcripción es razonable (<2x duración del audio)
- [ ] ✅ Manejo graceful de errores de red/API
- [ ] ✅ UI responsive y feedback claro al usuario

---

## 🚀 **SIGUIENTE FASE**

Una vez completado Sprint 1.1, estaremos listos para:
- **Sprint 1.2**: Agente Clínico con IA para análisis de transcripciones
- **Sprint 1.3**: Generación automática de notas SOAP
- **Sprint 1.4**: Exportación y reportes

---

**Preparado por:** Claude (Implementation Lead)  
**Aprobado por:** Pendiente - CTO  
**Fecha:** 3 de Junio, 2025  
**Estado:** ✅ Listo para ejecución tras confirmación de Fase 0.5 