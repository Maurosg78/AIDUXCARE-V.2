# 🚀 PLAN DE ACCIÓN ORDENADO
## Roadmap para Progresar de Manera Estructurada

**Fecha:** Noviembre 2025  
**Estado Actual:** Fase 2 Completada  
**Próximo Milestone:** Professional Features

---

## 📊 ESTADO ACTUAL CONFIRMADO

### ✅ **COMPLETADO Y FUNCIONAL:**
- Transcripción audio → texto (Whisper)
- Generación SOAP completo (Vertex AI)
- Persistencia de sesiones y pacientes
- Compliance básico (encriptación, audit, consent)
- Bloqueo de grabación sin consentimiento (Fase 2)

### ⚠️ **PARCIALMENTE IMPLEMENTADO:**
- Memoria de pacientes (guarda pero NO compara)
- Progress tracking (métricas pero NO comparación)
- Email infrastructure (básico pero sin templates)

### ❌ **NO IMPLEMENTADO:**
- Comparación de sesiones
- Templates de documentos WSIB/MVA
- Return-to-Work certificates
- Email templates específicos
- Alertas de seguimiento

---

## 🎯 ROADMAP POR FASES

### **FASE ACTUAL: Core Stability** ✅ COMPLETADA

**Duración:** Completada  
**Estado:** ✅ Listo para piloto básico

**Logros:**
- ✅ Pipeline audio → SOAP funcional
- ✅ Compliance PHIPA/PIPEDA implementado
- ✅ Consent management completo
- ✅ Data residency Canadá (con correcciones)

---

### **PRÓXIMA FASE: Professional Features** 🎯 EN PROGRESO

**Duración estimada:** 2-3 semanas  
**Objetivo:** Completar features declaradas pero no implementadas

#### **Sprint 1: Comparación de Sesiones** (5 días)

**Objetivo:** Implementar comparación automática entre sesión actual y anterior

**Tareas:**
1. **Crear servicio de comparación:**
   - Archivo: `src/services/sessionComparisonService.ts`
   - Funcionalidad:
     - Obtener última sesión del paciente
     - Comparar métricas (tiempo, completitud, tests)
     - Calcular cambios (mejora/regresión)
     - Generar resumen de diferencias

2. **Crear componente UI:**
   - Archivo: `src/components/SessionComparison.tsx`
   - Funcionalidad:
     - Mostrar métricas de sesión anterior
     - Mostrar métricas de sesión actual
     - Mostrar diferencias (delta)
     - Indicadores visuales (↑ mejora, ↓ regresión)

3. **Integrar en workflow:**
   - Archivo: `src/pages/ProfessionalWorkflowPage.tsx`
   - Funcionalidad:
     - Cargar sesión anterior al iniciar nueva sesión
     - Mostrar comparación en sidebar o modal
     - Alertas si hay regresión significativa

**Criterios de aceptación:**
- ✅ Compara métricas entre sesiones
- ✅ Muestra diferencias claramente
- ✅ Alertas de regresión funcionan
- ✅ Performance < 1 segundo para comparación

**Dependencias:**
- `sessionService.getLastSession()` ✅ (ya existe)
- Métricas de sesión ✅ (ya existen)

---

#### **Sprint 2: Templates de Documentos** (7 días)

**Objetivo:** Crear templates básicos para documentos de apoyo (NO oficiales)

**Tareas:**

**1. Template WSIB Support:**
   - Archivo: `src/templates/WSIBSupportTemplate.tsx`
   - Basado en: `docs/strategy/WSIB_MVA_REPORT_FORMATS.md`
   - Funcionalidad:
     - Genera documento de apoyo basado en SOAP
     - Auto-completa datos del fisioterapeuta
     - Incluye disclaimers automáticamente
     - **NO genera Form 8 oficial** (solo apoyo)

**2. Template MVA Support:**
   - Archivo: `src/templates/MVASupportTemplate.tsx`
   - Funcionalidad:
     - Genera treatment plan summary
     - Cost estimates aproximados
     - Progress documentation
     - **NO genera OCF-18 oficial** (solo apoyo)

**3. Template Return-to-Work:**
   - Archivo: `src/templates/ReturnToWorkTemplate.tsx`
   - Funcionalidad:
     - Genera certificado basado en assessment
     - Incluye limitations y restrictions
     - Auto-completa datos profesionales
     - **Disclaimers:** "Physiotherapy assessment only"

**4. Servicio de generación:**
   - Archivo: `src/services/documentGeneratorService.ts`
   - Funcionalidad:
     - Orquesta generación de documentos
     - Mapea SOAP → template
     - Genera PDF o HTML
     - Incluye disclaimers apropiados

**Criterios de aceptación:**
- ✅ Templates generan documentos legibles
- ✅ Disclaimers incluidos automáticamente
- ✅ Datos profesionales auto-completados
- ✅ NO se generan documentos oficiales (solo apoyo)

**Dependencias:**
- SOAP notes ✅ (ya existe)
- PDF generator básico ✅ (ya existe)

---

#### **Sprint 3: Email Templates** (3 días)

**Objetivo:** Crear templates básicos de email (sin PHI)

**Tareas:**

**1. Appointment Reminder:**
   - Archivo: `src/templates/emails/AppointmentReminder.tsx`
   - Funcionalidad:
     - Recordatorio de cita próxima
     - Sin PHI específico
     - Información general de preparación

**2. Exercise Instructions:**
   - Archivo: `src/templates/emails/ExerciseInstructions.tsx`
   - Funcionalidad:
     - Instrucciones generales de ejercicios
     - Sin PHI específico
     - Links a recursos educativos

**3. Integración con email service:**
   - Modificar: `src/services/emailActivationService.ts`
   - Funcionalidad:
     - Usar templates creados
     - Enviar emails sin PHI
     - Tracking de envíos

**Criterios de aceptación:**
- ✅ Templates generan emails legibles
- ✅ Sin PHI incluido
- ✅ PIPEDA compliant
- ✅ Envío funciona correctamente

---

### **FASE FUTURA: Advanced Features** 🔮 PLANIFICADO

**Duración estimada:** 3-6 meses  
**Objetivo:** Features avanzadas post-piloto

**Features:**
1. Progress tracking avanzado (gráficos, alertas)
2. Secure deletion automatizado
3. Telehealth integration
4. Dual audio capture
5. Diarization
6. EMR integrations

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### **Sprint 1: Comparación de Sesiones**

**Día 1-2: Servicio de Comparación**
- [ ] Crear `sessionComparisonService.ts`
- [ ] Implementar `compareSessions(previous, current)`
- [ ] Calcular métricas de diferencia
- [ ] Tests unitarios

**Día 3-4: Componente UI**
- [ ] Crear `SessionComparison.tsx`
- [ ] Diseñar UI de comparación
- [ ] Indicadores visuales (↑↓)
- [ ] Tests de componente

**Día 5: Integración**
- [ ] Integrar en `ProfessionalWorkflowPage`
- [ ] Cargar sesión anterior automáticamente
- [ ] Mostrar comparación en UI
- [ ] Testing end-to-end

---

### **Sprint 2: Templates de Documentos**

**Día 1-2: Template WSIB**
- [ ] Crear `WSIBSupportTemplate.tsx`
- [ ] Mapear SOAP → campos WSIB
- [ ] Agregar disclaimers
- [ ] Tests

**Día 3-4: Template MVA**
- [ ] Crear `MVASupportTemplate.tsx`
- [ ] Mapear SOAP → campos MVA
- [ ] Agregar disclaimers
- [ ] Tests

**Día 5: Template Return-to-Work**
- [ ] Crear `ReturnToWorkTemplate.tsx`
- [ ] Mapear assessment → certificado
- [ ] Agregar disclaimers
- [ ] Tests

**Día 6-7: Servicio de Generación**
- [ ] Crear `documentGeneratorService.ts`
- [ ] Orquestar generación de documentos
- [ ] Integrar con PDF generator
- [ ] Tests end-to-end

---

### **Sprint 3: Email Templates**

**Día 1: Appointment Reminder**
- [ ] Crear template
- [ ] Integrar con email service
- [ ] Tests

**Día 2: Exercise Instructions**
- [ ] Crear template
- [ ] Integrar con email service
- [ ] Tests

**Día 3: Integración y Testing**
- [ ] Testing completo
- [ ] Validación PIPEDA compliance
- [ ] Documentación

---

## 🎯 PRIORIZACIÓN

### **🔴 CRÍTICO (Antes del piloto):**
1. Comparación de sesiones
2. Templates básicos de documentos

### **🟡 IMPORTANTE (Durante piloto):**
3. Email templates básicos
4. Alertas de seguimiento básicas

### **🟢 NICE TO HAVE (Post-piloto):**
5. Progress tracking avanzado
6. Gráficos de progreso
7. Telehealth
8. Dual audio capture

---

## 📊 MÉTRICAS DE ÉXITO

### **Sprint 1 (Comparación):**
- ✅ Comparación funciona en < 1 segundo
- ✅ UI clara y profesional
- ✅ Alertas de regresión funcionan
- ✅ Tests pasando

### **Sprint 2 (Templates):**
- ✅ Templates generan documentos legibles
- ✅ Disclaimers incluidos automáticamente
- ✅ Datos profesionales auto-completados
- ✅ Tests pasando

### **Sprint 3 (Email):**
- ✅ Templates generan emails legibles
- ✅ Sin PHI incluido
- ✅ Envío funciona correctamente
- ✅ Tests pasando

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### **Esta Semana:**
1. ✅ Fase 2 completada (bloqueo consentimiento, región, políticas)
2. ⏳ Verificar regiones en Firebase Console
3. ⏳ Redeploy Functions con región corregida
4. ⏳ Testing de bloqueo de grabación

### **Próxima Semana:**
1. 🎯 Iniciar Sprint 1: Comparación de sesiones
2. 🎯 Diseñar UI de comparación
3. 🎯 Implementar servicio de comparación

### **Siguientes 2 Semanas:**
1. 🎯 Completar Sprint 1
2. 🎯 Iniciar Sprint 2: Templates de documentos
3. 🎯 Crear templates básicos

---

## ✅ CRITERIOS DE COMPLETACIÓN

### **Para considerar "Professional Features" completado:**
- [x] Core funcionalidades ✅
- [ ] Comparación de sesiones implementada
- [ ] Templates básicos de documentos creados
- [ ] Email templates básicos creados
- [ ] Testing completo
- [ ] Documentación actualizada

---

**Status:** 🚀 **LISTO PARA PROGRESAR**  
**Próximo Sprint:** Comparación de sesiones  
**Fecha estimada de inicio:** Esta semana

