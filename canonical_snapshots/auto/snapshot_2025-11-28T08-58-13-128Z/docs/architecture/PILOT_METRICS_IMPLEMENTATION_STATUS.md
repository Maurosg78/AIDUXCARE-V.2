# 📊 Informe de Implementación: Métricas del Piloto

**Fecha:** 2024-12-19  
**Estado:** 📋 **ESPECIFICACIÓN COMPLETA - IMPLEMENTACIÓN PENDIENTE**  
**Última Actualización:** 2024-12-19

---

## 🎯 Resumen Ejecutivo

Se ha creado una **especificación completa** de métricas para el piloto que comienza hoy. El documento define:

1. ✅ **Arquitectura de tracking** completa
2. ✅ **Eventos a capturar** con estructura de datos detallada
3. ✅ **Código de implementación** propuesto
4. ⚠️ **Estado actual:** Especificación lista, código pendiente de implementación

---

## 📋 Estado de Implementación por Componente

### 1. 👥 Tracking de Usuarios Piloto

#### 1.1 Especificación Creada

**Documento:** `docs/architecture/PILOT_METRICS_SPECIFICATION.md` (Sección 1.1)

**Evento Definido:**
```typescript
Event: 'pilot_user_registered'
Datos: {
  userId: string;
  email: string;
  registrationDate: Date;
  isPilotUser: true;
  pilotPhase: 'pilot_1';
  registrationSource?: string;
  professionalProfile?: {...};
}
```

#### 1.2 Estado Actual del Código

**Archivos Relevantes:**
- `src/services/emailActivationService.ts` - Registro de profesionales
- `src/core/auth/firebaseAuthService.ts` - Registro de usuarios
- `src/features/auth/RegisterPage.tsx` - UI de registro

**Análisis:**
- ❌ **NO existe** flag `isPilotUser` en registro actual
- ❌ **NO existe** evento `pilot_user_registered`
- ✅ **EXISTE** `AnalyticsService.trackEvent()` para usar
- ✅ **EXISTE** `registrationDate` en `ProfessionalRegistration` interface

**Código Actual:**
```typescript
// src/services/emailActivationService.ts (línea 28)
interface ProfessionalRegistration {
  registrationDate: Date; // ✅ Ya existe
  // ❌ Falta: isPilotUser, pilotPhase
}
```

#### 1.3 Implementación Requerida

**Archivo:** `src/services/emailActivationService.ts`

**Cambios Necesarios:**
```typescript
// 1. Agregar constantes
const PILOT_START_DATE = new Date('2024-12-19T00:00:00Z');

// 2. Modificar registerProfessional()
public async registerProfessional(...) {
  // ... código existente ...
  
  // Detectar si es usuario piloto
  const isPilotUser = new Date() >= PILOT_START_DATE;
  
  // Agregar a firestoreData
  firestoreData.isPilotUser = isPilotUser;
  firestoreData.pilotPhase = isPilotUser ? 'pilot_1' : undefined;
  
  // Track evento piloto
  if (isPilotUser) {
    await AnalyticsService.trackEvent('pilot_user_registered', {
      userId: professionalId,
      email: professionalData.email,
      registrationDate: new Date().toISOString(),
      isPilotUser: true,
      pilotPhase: 'pilot_1',
      registrationSource: 'organic', // o 'invite' si aplica
      professionalProfile: {
        specialty: professionalData.specialty,
        experienceYears: professionalData.experienceYears,
        clinicName: professionalData.clinic?.name,
        location: {
          city: professionalData.city,
          country: professionalData.country
        }
      }
    });
  }
}
```

**Prioridad:** 🔴 **CRÍTICA - Implementar HOY**

---

### 2. 🏥 Tracking de Pacientes

#### 2.1 Especificación Creada

**Evento Definido:**
```typescript
Event: 'pilot_patient_created'
Datos: {
  patientId: string;
  userId: string;
  patientType: 'new_evaluation' | 'existing_followup'; // ⭐ NUEVO
  createdAt: Date;
  existingPatientData?: {
    antecedentesBasicos?: string;
    diagnosticoActual?: string;
    dolenciasPrincipales?: string[];
    restriccionesFisicas?: string[];
    planOrientativoGenerado?: boolean;
  };
}
```

#### 2.2 Estado Actual del Código

**Archivos Relevantes:**
- `src/features/command-center/components/CreatePatientModal.tsx` - Modal de creación
- `src/features/command-center/components/PatientForm.tsx` - Formulario completo
- `src/services/analyticsService.ts` - Servicio de analytics

**Análisis:**
- ✅ **EXISTE** tracking de `patient_created` en `PatientForm.tsx` (línea 221)
- ❌ **NO existe** campo `patientType` en formulario
- ❌ **NO existe** formulario para pacientes existentes
- ❌ **NO existe** tracking de `pilot_patient_created`

**Código Actual:**
```typescript
// src/features/command-center/components/PatientForm.tsx (línea 221)
await AnalyticsService.trackEvent('patient_created', {
  patientId,
  source: formData.source,
  // ... otros campos
  // ❌ Falta: patientType, isPilotUser
});
```

#### 2.3 Implementación Requerida

**Archivo:** `src/features/command-center/components/CreatePatientModal.tsx`

**Cambios Necesarios:**

1. **Agregar selector de tipo de paciente:**
```typescript
const [patientType, setPatientType] = useState<'new_evaluation' | 'existing_followup'>('new_evaluation');
const [isExistingPatient, setIsExistingPatient] = useState(false);

// Campos adicionales para pacientes existentes
const [existingPatientData, setExistingPatientData] = useState({
  antecedentesBasicos: '',
  diagnosticoActual: '',
  dolenciasPrincipales: [] as string[],
  restriccionesFisicas: [] as string[],
  generarPlanOrientativo: false
});
```

2. **Modificar tracking:**
```typescript
// En handleSubmit
await AnalyticsService.trackEvent('pilot_patient_created', {
  patientId,
  userId: user.uid,
  patientType: isExistingPatient ? 'existing_followup' : 'new_evaluation',
  createdAt: new Date().toISOString(),
  existingPatientData: isExistingPatient ? existingPatientData : undefined,
  isPilotUser: true // Si el usuario es piloto
});
```

**Prioridad:** 🔴 **CRÍTICA - Implementar HOY**

---

### 3. 📝 Tracking de Sesiones Clínicas

#### 3.1 Especificación Creada

**Eventos Definidos:**
- `pilot_session_started` - Al iniciar workflow
- `pilot_session_completed` - Al finalizar SOAP
- `pilot_copy_to_clipboard` - Al copiar SOAP
- `pilot_pdf_exported` - Al exportar PDF

#### 3.2 Estado Actual del Código

**Archivos Relevantes:**
- `src/pages/ProfessionalWorkflowPage.tsx` - Workflow principal
- `src/components/SOAPEditor.tsx` - Editor de SOAP
- `src/services/analyticsService.ts` - Servicio de analytics

**Análisis:**
- ✅ **EXISTE** `calculateAndTrackValueMetrics()` en `ProfessionalWorkflowPage.tsx` (línea 1768)
- ✅ **EXISTE** tracking de SOAP finalizado
- ❌ **NO existe** evento `pilot_session_started`
- ❌ **NO existe** evento `pilot_session_completed` específico
- ❌ **NO existe** tracking de `copy_to_clipboard` y `pdf_exported` con flag piloto

**Código Actual:**
```typescript
// src/pages/ProfessionalWorkflowPage.tsx (línea 1844)
await AnalyticsService.trackValueMetrics(metrics);
// ✅ Existe pero NO tiene flag de piloto
```

#### 3.3 Implementación Requerida

**Archivo:** `src/pages/ProfessionalWorkflowPage.tsx`

**Cambios Necesarios:**

1. **Agregar tracking de inicio de sesión:**
```typescript
// En useEffect al montar componente o cuando patientId cambia
useEffect(() => {
  if (patientId && user?.uid) {
    const isFirstSession = !lastEncounter.data;
    const patientType = isFirstSession ? 'new_evaluation' : 'existing_followup';
    
    AnalyticsService.trackEvent('pilot_session_started', {
      sessionId: sessionId || `${user.uid}-${Date.now()}`,
      userId: user.uid,
      patientId,
      patientType,
      sessionType: currentSessionType,
      visitNumber: visitCount.data ? visitCount.data + 1 : 1,
      startedAt: new Date().toISOString(),
      hasPreviousEncounter: !!lastEncounter.data,
      daysSinceLastVisit: lastEncounter.data ? 
        Math.floor((Date.now() - lastEncounter.data.encounterDate.toMillis()) / (1000 * 60 * 60 * 24)) : 
        undefined,
      isPilotUser: true // Verificar si usuario es piloto
    });
  }
}, [patientId, user?.uid]);
```

2. **Modificar tracking de finalización:**
```typescript
// En handleFinalizeSOAP, después de calculateAndTrackValueMetrics
await AnalyticsService.trackEvent('pilot_session_completed', {
  sessionId,
  userId: user?.uid,
  patientId,
  patientType: isFirstSession ? 'new_evaluation' : 'existing_followup',
  sessionType: currentSessionType,
  visitNumber: visitCount.data ? visitCount.data + 1 : 1,
  completedAt: new Date().toISOString(),
  durationMinutes: (Date.now() - sessionStartTime.getTime()) / (1000 * 60),
  transcriptLength: transcript?.split(/\s+/).length || 0,
  transcriptionTimeMinutes: transcriptionTime,
  physicalTestsCompleted: filteredEvaluationTests.length,
  aiSuggestionsAccepted: filteredEvaluationTests.filter(t => t.source === 'ai').length,
  soapFinalized: true,
  copyToClipboardUsed: false, // Se actualiza cuando se usa
  pdfExported: false,
  isPilotUser: true
});
```

**Archivo:** `src/components/SOAPEditor.tsx`

**Cambios Necesarios:**

1. **Modificar handleCopyToClipboard:**
```typescript
const handleCopyToClipboard = async () => {
  // ... código existente ...
  
  // Track evento piloto
  await AnalyticsService.trackEvent('pilot_copy_to_clipboard', {
    userId: user?.uid, // Necesita acceso a user
    patientId, // Necesita acceso a patientId
    sessionId, // Necesita acceso a sessionId
    soapLength: plainText.length,
    timestamp: new Date().toISOString(),
    isPilotUser: true
  });
};
```

2. **Modificar handleExportPDF:**
```typescript
const handleExportPDF = () => {
  // ... código existente ...
  
  // Track evento piloto
  AnalyticsService.trackEvent('pilot_pdf_exported', {
    userId: user?.uid,
    patientId,
    sessionId,
    timestamp: new Date().toISOString(),
    isPilotUser: true
  });
};
```

**Prioridad:** 🟡 **ALTA - Implementar esta semana**

---

### 4. 📊 Sistema de Analytics Existente

#### 4.1 Arquitectura Actual

**Archivo:** `src/services/analyticsService.ts`

**Componentes Existentes:**
- ✅ `AnalyticsService.trackEvent()` - Método genérico de tracking
- ✅ `AnalyticsService.trackValueMetrics()` - Métricas de valor
- ✅ `AnalyticsService.trackBusinessMetrics()` - Métricas de negocio
- ✅ Colección Firestore: `analytics_events`, `system_analytics`, `business_metrics`

**Estructura de Eventos:**
```typescript
interface AnalyticsEvent {
  id: string;
  eventName: string;
  eventData: Record<string, unknown>;
  userId?: string;
  timestamp: Date;
  sessionId: string;
  userAgent: string;
  url: string;
  module?: string;
  duration?: number;
  success?: boolean;
  errorMessage?: string;
}
```

#### 4.2 Compatibilidad con Piloto

**Análisis:**
- ✅ **COMPATIBLE** - El sistema actual puede manejar eventos de piloto
- ✅ **EXTENSIBLE** - `eventData` puede contener cualquier campo adicional
- ⚠️ **MEJORA NECESARIA** - Agregar flag `isPilotUser` a nivel de evento para filtrado fácil

**Recomendación:**
```typescript
// Agregar campo opcional a AnalyticsEvent
interface AnalyticsEvent {
  // ... campos existentes ...
  isPilotUser?: boolean; // ⭐ NUEVO
  pilotPhase?: 'pilot_1' | 'pilot_2' | ...; // ⭐ NUEVO
}
```

---

### 5. 🔍 Queries de Firestore

#### 5.1 Especificación Creada

**Documento:** `docs/architecture/PILOT_METRICS_SPECIFICATION.md` (Sección 7.2)

**Queries Definidas:**
1. Obtener todos los usuarios piloto
2. Sesiones completadas hoy
3. Usuarios que usaron copy/paste
4. Métricas de adopción

#### 5.2 Estado Actual

**Análisis:**
- ✅ **EXISTE** estructura de queries en el documento
- ❌ **NO existe** código implementado para estas queries
- ✅ **EXISTE** `AnalyticsService.getUsageAnalytics()` que puede extenderse

**Implementación Requerida:**

**Archivo:** `src/services/analyticsService.ts`

**Agregar métodos:**
```typescript
/**
 * Obtener usuarios piloto registrados
 */
public async getPilotUsers(startDate?: Date): Promise<AnalyticsEvent[]> {
  const start = startDate || new Date('2024-12-19T00:00:00Z');
  const q = query(
    collection(db, 'analytics_events'),
    where('eventName', '==', 'pilot_user_registered'),
    where('eventData.isPilotUser', '==', true),
    where('timestamp', '>=', start),
    orderBy('timestamp', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as AnalyticsEvent);
}

/**
 * Obtener sesiones completadas hoy
 */
public async getTodayCompletedSessions(): Promise<AnalyticsEvent[]> {
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const endOfToday = new Date(today.setHours(23, 59, 59, 999));
  
  const q = query(
    collection(db, 'analytics_events'),
    where('eventName', '==', 'pilot_session_completed'),
    where('timestamp', '>=', startOfToday),
    where('timestamp', '<=', endOfToday)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as AnalyticsEvent);
}
```

**Prioridad:** 🟢 **MEDIA - Implementar cuando se necesiten reportes**

---

## 📋 Checklist de Implementación

### Fase 1: Tracking Básico (CRÍTICO - HOY)

- [ ] **1.1** Agregar flag `isPilotUser` en registro de usuarios
  - [ ] Modificar `emailActivationService.ts`
  - [ ] Agregar constante `PILOT_START_DATE`
  - [ ] Implementar detección automática de piloto
  - [ ] Agregar evento `pilot_user_registered`

- [ ] **1.2** Agregar tracking de pacientes con tipo
  - [ ] Modificar `CreatePatientModal.tsx`
  - [ ] Agregar selector de tipo de paciente
  - [ ] Agregar campos para pacientes existentes
  - [ ] Implementar evento `pilot_patient_created`

### Fase 2: Tracking de Workflow (ALTA - Esta Semana)

- [ ] **2.1** Tracking de inicio de sesión
  - [ ] Agregar `useEffect` en `ProfessionalWorkflowPage.tsx`
  - [ ] Implementar evento `pilot_session_started`
  - [ ] Incluir datos de contexto (visitNumber, patientType, etc.)

- [ ] **2.2** Tracking de finalización de sesión
  - [ ] Modificar `handleFinalizeSOAP`
  - [ ] Implementar evento `pilot_session_completed`
  - [ ] Incluir métricas de uso (duration, features used, etc.)

- [ ] **2.3** Tracking de acciones de EMR
  - [ ] Modificar `handleCopyToClipboard` en `SOAPEditor.tsx`
  - [ ] Modificar `handleExportPDF` en `SOAPEditor.tsx`
  - [ ] Implementar eventos `pilot_copy_to_clipboard` y `pilot_pdf_exported`

### Fase 3: Queries y Reportes (MEDIA - Próxima Semana)

- [ ] **3.1** Agregar métodos de queries en `AnalyticsService`
  - [ ] `getPilotUsers()`
  - [ ] `getTodayCompletedSessions()`
  - [ ] `getCopyPasteUsage()`
  - [ ] `getAdoptionMetrics()`

- [ ] **3.2** Crear dashboard de métricas
  - [ ] Componente React para visualización
  - [ ] KPIs principales (DAU, sesiones, SOAP completados)
  - [ ] Gráficos de adopción

### Fase 4: Validación y Testing (CONTINUA)

- [ ] **4.1** Validar eventos se capturan correctamente
- [ ] **4.2** Verificar timestamps son precisos
- [ ] **4.3** Validar datos de piloto se marcan correctamente
- [ ] **4.4** Probar queries de agregación

---

## 🔧 Detalles Técnicos de Implementación

### 6.1 Detección de Usuario Piloto

**Lógica:**
```typescript
const PILOT_START_DATE = new Date('2024-12-19T00:00:00Z');

function isPilotUser(registrationDate: Date): boolean {
  return registrationDate >= PILOT_START_DATE;
}
```

**Aplicación:**
- Al registrar usuario: `isPilotUser(new Date())`
- Al crear paciente: Verificar si `user.isPilotUser === true`
- Al iniciar sesión: Verificar flag en perfil de usuario

### 6.2 Estructura de Datos en Firestore

**Colección:** `analytics_events`

**Documento Ejemplo:**
```json
{
  "id": "auto-generated",
  "eventName": "pilot_user_registered",
  "eventData": {
    "userId": "user123",
    "email": "physio@example.com",
    "registrationDate": "2024-12-19T10:30:00Z",
    "isPilotUser": true,
    "pilotPhase": "pilot_1",
    "professionalProfile": {
      "specialty": "Physiotherapy",
      "location": {
        "city": "Toronto",
        "country": "Canada"
      }
    }
  },
  "userId": "user123",
  "timestamp": "2024-12-19T10:30:00Z",
  "sessionId": "session_123",
  "userAgent": "...",
  "url": "https://...",
  "isPilotUser": true,
  "pilotPhase": "pilot_1"
}
```

### 6.3 Índices de Firestore Requeridos

**Índices Necesarios:**
```javascript
// 1. Usuarios piloto por fecha
{
  collectionGroup: 'analytics_events',
  queryScope: 'COLLECTION',
  fields: [
    { fieldPath: 'eventName', order: 'ASCENDING' },
    { fieldPath: 'eventData.isPilotUser', order: 'ASCENDING' },
    { fieldPath: 'timestamp', order: 'DESCENDING' }
  ]
}

// 2. Sesiones completadas por fecha
{
  collectionGroup: 'analytics_events',
  queryScope: 'COLLECTION',
  fields: [
    { fieldPath: 'eventName', order: 'ASCENDING' },
    { fieldPath: 'timestamp', order: 'DESCENDING' }
  ]
}

// 3. Pacientes por tipo
{
  collectionGroup: 'analytics_events',
  queryScope: 'COLLECTION',
  fields: [
    { fieldPath: 'eventName', order: 'ASCENDING' },
    { fieldPath: 'eventData.patientType', order: 'ASCENDING' },
    { fieldPath: 'timestamp', order: 'DESCENDING' }
  ]
}
```

---

## 📊 Métricas que se Capturarán

### 7.1 Métricas de Usuarios

| Métrica | Evento | Estado |
|---------|--------|--------|
| Nuevos usuarios piloto | `pilot_user_registered` | ⚠️ Pendiente |
| DAU (Daily Active Users) | `pilot_user_daily_active` | ⚠️ Pendiente |
| Primera sesión completada | `pilot_user_first_soap` | ⚠️ Pendiente |

### 7.2 Métricas de Pacientes

| Métrica | Evento | Estado |
|---------|--------|--------|
| Pacientes creados | `pilot_patient_created` | ⚠️ Pendiente |
| Ratio nuevos vs existentes | Calculado | ⚠️ Pendiente |
| Plan orientativo generado | `pilot_patient_created` (campo) | ⚠️ Pendiente |

### 7.3 Métricas de Workflow

| Métrica | Evento | Estado |
|---------|--------|--------|
| Sesiones iniciadas | `pilot_session_started` | ⚠️ Pendiente |
| Sesiones completadas | `pilot_session_completed` | ⚠️ Pendiente |
| SOAP finalizados | `pilot_session_completed` (campo) | ⚠️ Pendiente |
| Copy/Paste usado | `pilot_copy_to_clipboard` | ⚠️ Pendiente |
| PDF exportado | `pilot_pdf_exported` | ⚠️ Pendiente |

### 7.4 Métricas de Valor (Ya Existen)

| Métrica | Evento | Estado |
|---------|--------|--------|
| Tiempo ahorrado | `trackValueMetrics` | ✅ Existe |
| Features usadas | `trackValueMetrics` | ✅ Existe |
| Calidad de SOAP | `trackValueMetrics` | ✅ Existe |

**Nota:** Las métricas de valor existen pero **NO tienen flag de piloto**. Se recomienda agregar el flag para poder filtrar por usuarios piloto.

---

## 🎯 Próximos Pasos Recomendados

### Inmediato (HOY)

1. **Implementar tracking de usuarios piloto**
   - Agregar flag `isPilotUser` en registro
   - Implementar evento `pilot_user_registered`
   - Validar que se captura correctamente

2. **Implementar tracking de pacientes**
   - Agregar selector de tipo de paciente
   - Implementar evento `pilot_patient_created`
   - Validar datos se capturan correctamente

### Esta Semana

3. **Implementar tracking de sesiones**
   - Agregar eventos de inicio y finalización
   - Integrar con workflow existente
   - Validar métricas se calculan correctamente

4. **Implementar tracking de acciones EMR**
   - Agregar eventos de copy/paste y export
   - Integrar con SOAPEditor
   - Validar eventos se disparan correctamente

### Próxima Semana

5. **Crear queries de agregación**
   - Implementar métodos en AnalyticsService
   - Crear índices de Firestore
   - Validar queries funcionan correctamente

6. **Crear dashboard de métricas**
   - Componente React para visualización
   - KPIs principales
   - Gráficos de adopción

---

## ✅ Conclusión

**Estado General:** 📋 **ESPECIFICACIÓN COMPLETA - IMPLEMENTACIÓN PENDIENTE**

**Resumen:**
- ✅ Especificación técnica completa creada
- ✅ Arquitectura de datos definida
- ✅ Código de ejemplo proporcionado
- ⚠️ Implementación real pendiente
- ⚠️ Testing pendiente
- ⚠️ Dashboard pendiente

**Prioridad de Implementación:**
1. 🔴 **CRÍTICA:** Tracking de usuarios y pacientes (HOY)
2. 🟡 **ALTA:** Tracking de sesiones (Esta semana)
3. 🟢 **MEDIA:** Queries y dashboard (Próxima semana)

**Riesgos:**
- ⚠️ Sin implementación HOY, se perderán métricas de usuarios que se registren hoy
- ⚠️ Sin tracking de pacientes, no se podrá medir ratio nuevos vs existentes
- ⚠️ Sin tracking de sesiones, no se podrá medir adopción del workflow

**Recomendación:** Implementar al menos Fase 1 (tracking básico) HOY para no perder datos críticos del piloto.

---

**Fin del Informe**

