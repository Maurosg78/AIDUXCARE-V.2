# 🧹 PLAN DE LIMPIEZA - PÁGINA DE CAPTURA

## 📋 ARCHIVOS A MANTENER (PIPELINE NUEVO)

### 🎯 PÁGINAS PRINCIPALES
- ✅ `src/pages/ProfessionalWorkflowPage.tsx` - Página principal de captura
- ⚠️ `src/pages/AudioProcessingPage.tsx` - Revisar si es necesario
- ⚠️ `src/pages/AudioTestPage.tsx` - Revisar si es necesario

### 🎯 COMPONENTES DE AUDIO
- ✅ `src/components/RealTimeAudioCapture.tsx` - Captura en tiempo real
- ✅ `src/components/professional/ProfessionalAudioCapture.tsx` - Captura profesional
- ✅ `src/components/professional/AudioFileUpload.tsx` - Subida de archivos

### 🎯 SERVICIOS DE AUDIO
- ✅ `src/services/WebSpeechSTTService.ts` - Servicio principal STT
- ✅ `src/services/AudioCaptureServiceReal.ts` - Servicio de captura
- ✅ `src/services/AudioFileSTTService.ts` - Servicio de archivos
- ✅ `src/services/MedicalTranscriptionPipelineService.ts` - Pipeline médico

### 🎯 SERVICIOS DE ANÁLISIS
- ✅ `src/services/OptimizedClinicalBrainService.ts` - Cerebro clínico
- ✅ `src/services/PhysiotherapyPipelineService.ts` - Pipeline fisioterapia
- ✅ `src/services/KnowledgeBaseService.ts` - Base de conocimiento

## 🚨 DATOS FICTICIOS A ELIMINAR

### 📋 EN ProfessionalWorkflowPage.tsx:
- ❌ Paciente: María González Rodríguez
- ❌ Medicamentos: Tramadol 50mg, Omeprazol 20mg
- ❌ ID: FT-2025-001
- ❌ Datos de alergias, tratamientos previos, etc.

### 📋 EN Layout.tsx:
- ❌ Usuario: Dr. Juan Pérez

### 📋 EN AccessPage.tsx:
- ❌ Usuarios demo: demo@aiduxcare.com, paciente@aiduxcare.com

## 🔧 ACCIONES REQUERIDAS

### 1. LIMPIAR DATOS FICTICIOS
- [ ] Eliminar datos de paciente ficticio en ProfessionalWorkflowPage
- [ ] Limpiar usuario ficticio en Layout
- [ ] Remover usuarios demo en AccessPage
- [ ] Limpiar credenciales demo en LoginPage

### 2. REVISAR ARCHIVOS DUPLICADOS
- [ ] Verificar si AudioProcessingPage es necesario
- [ ] Verificar si AudioTestPage es necesario
- [ ] Eliminar archivos duplicados si no son necesarios

### 3. OPTIMIZAR PIPELINE
- [ ] Verificar que solo se usen los servicios necesarios
- [ ] Eliminar imports no utilizados
- [ ] Limpiar código comentado o obsoleto

## 📊 ESTADO ACTUAL
- ✅ Login funcionando correctamente
- ✅ Navegación a /professional-workflow exitosa
- ✅ Sistema de monitoreo activo
- ⚠️ Datos ficticios presentes
- ⚠️ Posibles archivos duplicados

## 🎯 OBJETIVO
Crear un pipeline limpio de captura sin datos ficticios, listo para uso real. 