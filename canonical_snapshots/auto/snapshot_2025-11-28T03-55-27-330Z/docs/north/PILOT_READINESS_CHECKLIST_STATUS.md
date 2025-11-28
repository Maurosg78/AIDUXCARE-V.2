# AiduxCare – Pilot Readiness Checklist Status (Ontario Physios)

**Fecha de evaluación:** $(date)  
**Estado general:** 🟡 **PARCIALMENTE LISTO** (requiere validación y ajustes menores)

---

## 1. Flujo clínico básico

### ✅ Puedo crear o seleccionar un paciente
**Estado:** IMPLEMENTADO  
**Evidencia:**
- `src/services/patientService.ts`: `PatientService` con métodos `createPatient()`, `getPatient()`, `getPatientsByProfessional()`
- `src/pages/ProfessionalWorkflowPage.tsx`: Integración con `PatientService` y selección de pacientes
- **Nota:** La selección de pacientes funciona mediante `patientIdFromUrl` (query param)

### ✅ Puedo iniciar una sesión (initial / follow-up / wsib / mva / certificate)
**Estado:** IMPLEMENTADO  
**Evidencia:**
- `src/services/sessionTypeService.ts`: `SessionTypeService` con tipos `'initial' | 'followup' | 'wsib' | 'mva' | 'certificate'`
- `src/components/WorkflowSidebar.tsx`: UI para selección de tipo de sesión
- `src/services/sessionService.ts`: `SessionService.createSession()` acepta `sessionType`
- **Nota:** Los tipos están integrados en el workflow principal

### ✅ Puedo grabar o pegar una transcripción
**Estado:** IMPLEMENTADO  
**Evidencia:**
- `src/hooks/useTranscript.ts`: Hook para manejo de transcripción
- `src/pages/ProfessionalWorkflowPage.tsx`: Manejo de `transcript` state y `handlePasteTranscript`
- `src/services/OpenAIWhisperService.ts`: Servicio de transcripción de audio
- **Nota:** Soporta grabación en tiempo real y pegado manual

### 🟡 Puedo generar una nota SOAP sin que la app se rompa
**Estado:** IMPLEMENTADO CON MANEJO DE ERRORES  
**Evidencia:**
- `src/pages/ProfessionalWorkflowPage.tsx`: `handleGenerateSoap()` con `try-catch` y `setAnalysisError()`
- `src/services/vertex-ai-soap-service.ts`: Servicio de generación SOAP con manejo de errores
- **Validación requerida:** Verificar que los mensajes de error son claros y no bloquean la sesión
- **Línea de código:** `src/pages/ProfessionalWorkflowPage.tsx:1642` - `setAnalysisError(errorMessage)`

### ✅ Puedo guardar la nota y volver a verla más tarde
**Estado:** IMPLEMENTADO  
**Evidencia:**
- `src/pages/ProfessionalWorkflowPage.tsx`: `handleSaveSOAP()` (línea 1772)
- `src/services/PersistenceService.ts`: `saveSOAPNote()` guarda en Firestore collection `consultations`
- `src/services/sessionService.ts`: `createSession()` guarda sesiones completas con SOAP
- **Nota:** Las notas se guardan encriptadas en Firestore y se pueden recuperar por `patientId` y `sessionId`

---

## 2. Consentimiento

### ✅ Existe flujo claro para obtener consentimiento del paciente
**Estado:** IMPLEMENTADO  
**Evidencia:**
- `src/services/patientConsentService.ts`: `PatientConsentService` completo con generación de tokens, SMS, y registro
- `src/pages/ProfessionalWorkflowPage.tsx`: UI de consentimiento con banner y estado (líneas 2251-2333)
- **Nota:** Flujo SMS + Portal para consentimiento PHIPA-compliant

### ✅ SIN consentimiento, NO se hace análisis de audio/AI
**Estado:** IMPLEMENTADO  
**Evidencia:**
- `src/pages/ProfessionalWorkflowPage.tsx`: `handleGenerateSoap()` verifica consentimiento (líneas 1459-1471)
- `src/pages/ProfessionalWorkflowPage.tsx`: Bloqueo explícito con `PatientConsentService.hasConsent(patientId)` (línea 1461)
- `src/pages/ProfessionalWorkflowPage.tsx`: Si no hay consentimiento, muestra error y retorna sin procesar (líneas 1463-1471)
- **Nota:** El bloqueo está correctamente implementado con mensaje de error claro

### 🟡 El texto de consentimiento está disponible al menos en inglés (EN-CA)
**Estado:** REQUIERE VERIFICACIÓN  
**Evidencia:**
- `src/services/patientConsentService.ts`: Campo `languageUsed?: string` en `recordConsent()` (línea 220)
- `src/services/smsService.ts`: Servicio SMS para envío de consentimiento
- **Validación requerida:** Verificar que el texto SMS/Portal está en EN-CA y es PHIPA-compliant
- **Acción:** Revisar contenido de SMS en `SMSService.sendConsentSMS()`

### ✅ Hay un registro en base de datos de:
**Estado:** IMPLEMENTADO  
**Evidencia:**
- `src/services/patientConsentService.ts`: Interface `PatientConsent` (líneas 52-68)
  - ✅ `patientId`: Línea 53
  - ✅ `physiotherapistId` / `physiotherapistName`: Líneas 56-57
  - ✅ `consentDate`: Línea 60
  - ✅ `consentScope` ('ongoing' | 'session-only' | 'declined'): Línea 58
- `src/services/patientConsentService.ts`: `recordConsent()` guarda en collection `patient_consents` (línea 276)
- **Nota:** Todos los campos requeridos están presentes en el schema

---

## 3. Tokens & uso

### ✅ El sistema asigna un tipo de sesión (initial / followup / wsib / mva / certificate)
**Estado:** IMPLEMENTADO  
**Evidencia:**
- `src/services/sessionTypeService.ts`: `SessionTypeService.getTokenBudget()` asigna presupuesto por tipo
- `src/services/tokenTrackingService.ts`: `CANONICAL_PRICING` y `TOKEN_BUDGETS` definidos
- **Nota:** Cada tipo tiene un `tokenBudget` asociado (ej: initial=2000, followup=1200, wsib=3000)

### ✅ Cada sesión tiene un `tokenBudget` asociado
**Estado:** IMPLEMENTADO  
**Evidencia:**
- `src/services/sessionService.ts`: Interface `SessionData` incluye `tokenBudget?: number` (línea 17)
- `src/pages/ProfessionalWorkflowPage.tsx`: `tokenBudget` calculado desde `SessionTypeService.getTokenBudget(sessionType)` (línea 180)
- **Nota:** El presupuesto se asigna al crear la sesión

### ✅ Hay algún contador simple de tokens usados (aunque sea aproximado)
**Estado:** IMPLEMENTADO  
**Evidencia:**
- `src/services/tokenTrackingService.ts`: `TokenTrackingService.recordTokenUsage()` registra uso
- `src/services/tokenTrackingService.ts`: `TokenTrackingService.getCurrentTokenUsage()` retorna uso actual
- **Nota:** El sistema rastrea `baseTokensUsed`, `purchasedTokensUsed`, y `totalTokensUsed`

### ✅ Puedo ver en UI (aunque simple) cuántos tokens llevo usados en el mes
**Estado:** IMPLEMENTADO  
**Evidencia:**
- `src/components/TokenUsageDisplay.tsx`: Componente React para mostrar uso de tokens
- `src/pages/ProfessionalWorkflowPage.tsx`: Integración de `TokenUsageDisplay` en header/sidebar (línea 54)
- **Nota:** Muestra base tokens, purchased tokens, total disponible, y proyección mensual

---

## 4. Estabilidad básica

### 🟡 Si falla la transcripción, veo un mensaje entendible y no se rompe la sesión
**Estado:** REQUIERE VERIFICACIÓN  
**Evidencia:**
- `src/pages/ProfessionalWorkflowPage.tsx`: Línea 2108 - "Transcription error" mencionado
- **Validación requerida:** Verificar que los errores de `useTranscript` o `OpenAIWhisperService` se capturan y muestran mensajes claros
- **Acción:** Revisar manejo de errores en `src/hooks/useTranscript.ts` y `src/services/OpenAIWhisperService.ts`

### ✅ Si falla la generación de SOAP, veo un mensaje entendible
**Estado:** IMPLEMENTADO  
**Evidencia:**
- `src/pages/ProfessionalWorkflowPage.tsx`: `handleGenerateSoap()` con `try-catch` (línea 1634)
- `src/pages/ProfessionalWorkflowPage.tsx`: `setAnalysisError(errorMessage)` (línea 1643)
- `src/pages/ProfessionalWorkflowPage.tsx`: `ErrorMessage` component renderiza errores (línea 32)
- **Nota:** Los errores se muestran en UI y no bloquean la sesión

### 🟡 No hay errores críticos en consola al flujo normal de uso
**Estado:** REQUIERE VALIDACIÓN EN PRODUCCIÓN  
**Evidencia:**
- Historial reciente: Errores de `ReferenceError: require is not defined` y `TypeError: Ve.trackSystemEvent is not a function` fueron corregidos
- **Validación requerida:** Probar flujo completo en staging/producción y verificar consola limpia
- **Acción:** Ejecutar smoke tests y revisar console logs en navegador

---

## 5. Instrumentación mínima para métricas

### ✅ Registro: nº de sesiones por tipo
**Estado:** IMPLEMENTADO  
**Evidencia:**
- `src/services/analyticsService.ts`: `AnalyticsService.trackEvent()` registra eventos con `metadata.sessionType`
- `src/services/analyticsService.ts`: `getUsageAnalytics()` agrega eventos por módulo/tipo (línea 245)
- `src/pages/ProfessionalWorkflowPage.tsx`: Tracking de eventos `session_created` con `sessionType` (línea 3306)
- **Nota:** Los eventos se guardan en collection `system_analytics` con `sessionType` en metadata

### ✅ Registro: nº de notas SOAP generadas
**Estado:** IMPLEMENTADO  
**Evidencia:**
- `src/services/analyticsService.ts`: Tracking de eventos `soap_generated` y `soap_saved`
- `src/pages/ProfessionalWorkflowPage.tsx`: `AnalyticsService.trackEvent('soap_generated')` en `handleGenerateSoap()`
- **Nota:** Cada generación y guardado de SOAP se registra en `system_analytics`

### ✅ Registro: nº de sesiones por fisioterapeuta
**Estado:** IMPLEMENTADO  
**Evidencia:**
- `src/services/analyticsService.ts`: `getUsageAnalytics()` agrega eventos por `userId` (línea 250)
- `src/services/analyticsService.ts`: `eventsByUser` retorna conteo por profesional
- **Nota:** Cada evento incluye `userId` del fisioterapeuta autenticado

### 🟡 Puedo exportar esos datos (o al menos leerlos) al final del piloto
**Estado:** IMPLEMENTADO PARCIALMENTE  
**Evidencia:**
- `src/services/analyticsService.ts`: `exportAnalyticsData()` método existe (línea 424)
- `src/services/analyticsService.ts`: Soporta exportación en formato `'csv' | 'json'`
- **Validación requerida:** Verificar que el método funciona correctamente y que hay UI/admin para ejecutarlo
- **Acción:** Crear script/admin page para exportar datos del piloto (3 semanas)

---

## Resumen Ejecutivo

### ✅ COMPLETAMENTE LISTO (16/20 puntos)
1. Crear/seleccionar paciente
2. Iniciar sesión con tipos
3. Grabar/pegar transcripción
4. Guardar nota y verla después
5. Flujo de consentimiento
6. Registro de consentimiento en BD
7. Asignación de tipo de sesión
8. Token budget por sesión
9. Contador de tokens usados
10. UI de tokens en el mes
11. Manejo de errores SOAP
12. Registro de sesiones por tipo
13. Registro de SOAP generadas
14. Registro de sesiones por fisio
15. Exportación de datos (método existe)

### 🟡 REQUIERE VALIDACIÓN/AJUSTES MENORES (4/20 puntos)
1. **Texto de consentimiento EN-CA:** Verificar contenido SMS/Portal
2. **Manejo de errores de transcripción:** Revisar `useTranscript` y `OpenAIWhisperService`
3. **Errores críticos en consola:** Smoke tests en producción
4. **Exportación de datos:** Crear UI/admin para ejecutar exportación

---

## Acciones Inmediatas (Pre-Pilot)

### Prioridad ALTA (Bloqueantes)
1. ✅ **Verificar texto de consentimiento EN-CA**
   - Archivo: `src/services/smsService.ts`
   - Acción: Revisar contenido de SMS y asegurar que está en EN-CA y es PHIPA-compliant

### Prioridad MEDIA (Recomendado)
3. ✅ **Mejorar manejo de errores de transcripción**
   - Archivos: `src/hooks/useTranscript.ts`, `src/services/OpenAIWhisperService.ts`
   - Acción: Agregar mensajes de error claros y no bloquear sesión

4. ✅ **Crear UI/admin para exportación de métricas**
   - Archivo: Nuevo componente o página admin
   - Acción: Crear página simple para ejecutar `AnalyticsService.exportAnalyticsData()` y descargar CSV/JSON

### Prioridad BAJA (Nice to have)
5. ✅ **Smoke tests en producción**
   - Acción: Ejecutar flujo completo y verificar consola limpia

---

## Notas Técnicas

- **Base de datos:** Firestore collections:
  - `sessions`: Sesiones completas con SOAP
  - `consultations`: Notas SOAP encriptadas (note vault)
  - `patient_consents`: Registros de consentimiento
  - `system_analytics`: Eventos de métricas
  - `patient_consent_tokens`: Tokens de consentimiento

- **Servicios clave:**
  - `PatientService`: Gestión de pacientes
  - `SessionService`: Gestión de sesiones
  - `PatientConsentService`: Gestión de consentimiento
  - `TokenTrackingService`: Tracking de tokens
  - `AnalyticsService`: Métricas y exportación

- **Componentes UI:**
  - `WorkflowSidebar`: Selección de tipo de sesión
  - `TokenUsageDisplay`: Visualización de tokens
  - `SessionComparison`: Comparación de sesiones (Sprint 1)

---

**Última actualización:** $(date)  
**Próxima revisión:** Antes del inicio del piloto (3 semanas en Ontario)

