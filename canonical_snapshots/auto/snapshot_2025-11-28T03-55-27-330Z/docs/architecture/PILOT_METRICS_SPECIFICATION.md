# 📊 Especificación de Métricas del Piloto - AiduxCare V.2

**Fecha de Inicio del Piloto:** 2024-12-19  
**Estado:** 🚀 **ACTIVO DESDE HOY**  
**Propósito:** Captura de métricas críticas para validación de product-market fit

---

## 🎯 Objetivo Estratégico

Capturar métricas desde el inicio del piloto para:
1. **Validar Product-Market Fit** con datos reales de fisioterapeutas
2. **Medir adopción** de funcionalidades core (Clinical Companion)
3. **Identificar puntos de fricción** en el flujo de trabajo
4. **Calcular ROI** del sistema para usuarios piloto
5. **Informar decisiones** de producto basadas en datos

---

## 📈 Categorías de Métricas

### 1. 👥 Métricas de Usuarios Piloto

#### 1.1 Registro de Usuarios Piloto

**Evento:** `pilot_user_registered`

**Captura Automática:**
```typescript
// En: src/features/auth/RegisterPage.tsx o similar
interface PilotUserRegistration {
  userId: string;
  email: string;
  registrationDate: Date; // Timestamp crítico
  isPilotUser: true; // Flag para filtrado
  pilotPhase: 'pilot_1'; // Para tracking de cohortes
  registrationSource?: string; // 'invite', 'organic', etc.
  professionalProfile?: {
    specialty: string;
    experienceYears?: number;
    clinicName?: string;
    location?: {
      city: string;
      country: string;
    };
  };
}
```

**Implementación:**
```typescript
// Al registrar usuario nuevo desde hoy
await AnalyticsService.trackEvent('pilot_user_registered', {
  userId: user.uid,
  email: user.email,
  registrationDate: new Date().toISOString(),
  isPilotUser: true,
  pilotPhase: 'pilot_1',
  professionalProfile: {
    specialty: profile.specialty,
    experienceYears: profile.experienceYears,
    clinicName: profile.clinic?.name,
    location: {
      city: profile.clinic?.city,
      country: profile.clinic?.country || 'Canada'
    }
  }
});
```

#### 1.2 Actividad de Usuarios Piloto

**Eventos a Capturar:**
- `pilot_user_first_login` - Primera vez que inicia sesión
- `pilot_user_daily_active` - Usuario activo en el día
- `pilot_user_workflow_started` - Inició un workflow clínico
- `pilot_user_soap_completed` - Completó un SOAP note

**Métricas Calculadas:**
- **DAU (Daily Active Users)** - Usuarios piloto activos por día
- **WAU (Weekly Active Users)** - Usuarios piloto activos por semana
- **Retention Rate** - % de usuarios que vuelven después de primera sesión
- **Time to First Value** - Tiempo desde registro hasta primer SOAP completado

---

### 2. 🏥 Métricas de Pacientes

#### 2.1 Creación de Pacientes

**Evento:** `pilot_patient_created`

**Datos a Capturar:**
```typescript
interface PilotPatientCreation {
  patientId: string;
  userId: string; // Fisioterapeuta que creó
  patientType: 'new_evaluation' | 'existing_followup'; // ⭐ NUEVO
  createdAt: Date;
  
  // Para pacientes nuevos
  hasInitialEvaluation?: boolean;
  
  // Para pacientes existentes (nuevo requerimiento)
  existingPatientData?: {
    antecedentesBasicos?: string;
    diagnosticoActual?: string;
    dolenciasPrincipales?: string[];
    restriccionesFisicas?: string[];
    planOrientativoGenerado?: boolean; // Si aceptó generar plan
  };
  
  // Metadata común
  source?: 'referral' | 'direct';
  hasInsurance?: boolean;
  hasReferral?: boolean;
}
```

**Implementación:**
```typescript
// En: src/features/command-center/components/CreatePatientModal.tsx
await AnalyticsService.trackEvent('pilot_patient_created', {
  patientId,
  userId: user.uid,
  patientType: formData.isExistingPatient ? 'existing_followup' : 'new_evaluation',
  createdAt: new Date().toISOString(),
  existingPatientData: formData.isExistingPatient ? {
    antecedentesBasicos: formData.antecedentesBasicos,
    diagnosticoActual: formData.diagnosticoActual,
    dolenciasPrincipales: formData.dolenciasPrincipales,
    restriccionesFisicas: formData.restriccionesFisicas,
    planOrientativoGenerado: formData.generarPlanOrientativo
  } : undefined,
  source: formData.isReferral ? 'referral' : 'direct'
});
```

#### 2.2 Distribución de Tipos de Pacientes

**Métricas Calculadas:**
- **Ratio Nuevos vs Existentes:** `new_evaluation / existing_followup`
- **% Pacientes Existentes con Plan Generado:** `planOrientativoGenerado / existing_followup`
- **Promedio de Pacientes por Usuario:** `total_patients / total_pilot_users`

---

### 3. 📝 Métricas de Workflow Clínico

#### 3.1 Sesiones Clínicas

**Evento:** `pilot_session_started`

**Datos a Capturar:**
```typescript
interface PilotSession {
  sessionId: string;
  userId: string;
  patientId: string;
  patientType: 'new_evaluation' | 'existing_followup';
  sessionType: 'initial' | 'followup' | 'wsib' | 'mva' | 'certificate';
  visitNumber: number; // Del usePatientVisitCount
  startedAt: Date;
  
  // Contexto de sesión anterior (si aplica)
  hasPreviousEncounter?: boolean;
  daysSinceLastVisit?: number;
}
```

**Evento:** `pilot_session_completed`

**Datos Adicionales:**
```typescript
interface PilotSessionCompleted extends PilotSession {
  completedAt: Date;
  durationMinutes: number;
  
  // Métricas de uso
  transcriptLength?: number; // palabras
  transcriptionTimeMinutes?: number;
  physicalTestsCompleted?: number;
  aiSuggestionsAccepted?: number;
  aiSuggestionsRejected?: number;
  soapGenerationTimeMinutes?: number;
  soapFinalized: boolean;
  
  // Métricas de valor
  timeSavedMinutes?: number; // vs. documentación manual estimada
  copyToClipboardUsed?: boolean; // Si usó copy/paste a EMR
  pdfExported?: boolean;
}
```

**Implementación:**
```typescript
// En: src/pages/ProfessionalWorkflowPage.tsx
// Al iniciar workflow
await AnalyticsService.trackEvent('pilot_session_started', {
  sessionId: sessionId || `${userId}-${Date.now()}`,
  userId: user.uid,
  patientId,
  patientType: isFirstSession ? 'new_evaluation' : 'existing_followup',
  sessionType: currentSessionType,
  visitNumber: visitCount.data ? visitCount.data + 1 : 1,
  startedAt: new Date().toISOString(),
  hasPreviousEncounter: !!lastEncounter.data,
  daysSinceLastVisit: lastEncounter.data ? 
    Math.floor((Date.now() - lastEncounter.data.encounterDate.toMillis()) / (1000 * 60 * 60 * 24)) : 
    undefined
});

// Al finalizar SOAP
await AnalyticsService.trackEvent('pilot_session_completed', {
  ...sessionData,
  completedAt: new Date().toISOString(),
  durationMinutes: (Date.now() - sessionStartTime.getTime()) / (1000 * 60),
  transcriptLength: transcript?.split(/\s+/).length || 0,
  transcriptionTimeMinutes: transcriptionTime,
  physicalTestsCompleted: filteredEvaluationTests.length,
  aiSuggestionsAccepted: filteredEvaluationTests.filter(t => t.source === 'ai').length,
  soapFinalized: soapStatus === 'finalized',
  copyToClipboardUsed: false, // Se actualiza cuando se usa
  pdfExported: false // Se actualiza cuando se exporta
});
```

#### 3.2 Uso de Funcionalidades Core

**Eventos Específicos:**

| Evento | Descripción | Datos |
|--------|-------------|-------|
| `pilot_transcript_captured` | Grabación/transcripción iniciada | `mode: 'live'\|'dictation'`, `language` |
| `pilot_analysis_completed` | Análisis Vertex AI completado | `processingTimeSeconds`, `redFlagsFound` |
| `pilot_physical_tests_added` | Tests físicos agregados | `testCount`, `source: 'ai'\|'manual'` |
| `pilot_soap_generated` | SOAP generado (draft) | `generationTimeSeconds`, `sectionsCompleted` |
| `pilot_soap_finalized` | SOAP finalizado | `reviewTimeMinutes`, `editsMade` |
| `pilot_copy_to_clipboard` | Copy usado para EMR | `soapLength`, `timestamp` |
| `pilot_pdf_exported` | PDF exportado | `timestamp` |

---

### 4. 💡 Métricas de Product-Market Fit

#### 4.1 Adoption Metrics

**Core Value Propositions a Medir:**

1. **Smart Documentation Adoption**
   - % sesiones que usan transcripción
   - % sesiones que generan SOAP con IA
   - Promedio de tiempo ahorrado por sesión

2. **Patient Memory Usage**
   - % sesiones follow-up que consultan última visita
   - % sesiones que usan "Today's Plan" del header
   - % sesiones que usan notas adicionales del fisio

3. **EMR Integration Usage**
   - % SOAP finalizados que se copian a clipboard
   - % SOAP que se exportan como PDF
   - Frecuencia de uso de copy/paste

#### 4.2 Engagement Metrics

**Métricas de Profundidad de Uso:**
- **Sessions per User per Week:** Promedio de sesiones clínicas por usuario piloto
- **Patients per User:** Promedio de pacientes únicos por usuario
- **SOAP Completion Rate:** % de workflows iniciados que completan SOAP
- **Feature Adoption Rate:** % de usuarios que usan cada feature core

#### 4.3 Value Metrics (Ya Implementado)

**Sistema Existente:** `ValueMetricsEvent` en `src/services/analyticsService.ts`

**Métricas Capturadas:**
```typescript
interface ValueMetricsEvent {
  hashedUserId: string;
  hashedSessionId: string;
  timestamps: {
    sessionStart: Date;
    transcriptionStart?: Date;
    transcriptionEnd?: Date;
    soapGenerationStart?: Date;
    soapFinalized: Date;
  };
  calculatedTimes: {
    totalDocumentationTime: number; // minutos
    transcriptionTime?: number;
    aiGenerationTime?: number;
    manualEditingTime?: number;
  };
  featuresUsed: {
    transcription: boolean;
    physicalTests: boolean;
    aiSuggestions: boolean;
    soapGeneration: boolean;
  };
  quality: {
    soapSectionsCompleted: {
      subjective: boolean;
      objective: boolean;
      assessment: boolean;
      plan: boolean;
    };
    suggestionsOffered: number;
    suggestionsAccepted: number;
    suggestionsRejected: number;
    editsMadeToSOAP: number;
  };
  sessionType: 'initial' | 'follow-up';
}
```

**Mejora para Piloto:**
```typescript
// Agregar flag de piloto
interface PilotValueMetricsEvent extends ValueMetricsEvent {
  isPilotUser: true;
  pilotPhase: 'pilot_1';
  patientType: 'new_evaluation' | 'existing_followup';
}
```

---

### 5. 🐛 Métricas de Errores y Fricción

#### 5.1 Errores Críticos

**Evento:** `pilot_error_occurred`

**Datos:**
```typescript
interface PilotError {
  errorType: 'transcription' | 'vertex_ai' | 'soap_generation' | 'save' | 'other';
  errorMessage: string;
  userId: string;
  sessionId?: string;
  patientId?: string;
  workflowStep: string; // 'transcription', 'analysis', 'evaluation', 'soap'
  timestamp: Date;
  userAction: string; // Qué estaba haciendo el usuario
  recoverable: boolean; // Si el usuario pudo continuar
}
```

#### 5.2 Puntos de Fricción

**Eventos de Abandono:**
- `pilot_workflow_abandoned` - Usuario inició workflow pero no completó
- `pilot_soap_draft_abandoned` - Generó SOAP draft pero no finalizó
- `pilot_transcription_failed` - Error en transcripción que bloqueó flujo

**Métricas Calculadas:**
- **Drop-off Rate por Paso:** % usuarios que abandonan en cada paso del workflow
- **Error Recovery Rate:** % errores de los que el usuario se recupera
- **Support Requests:** Número de solicitudes de ayuda/soporte

---

### 6. 📊 Dashboard de Métricas del Piloto

#### 6.1 Métricas Diarias

**KPIs Principales:**
1. **Nuevos Usuarios Piloto:** `COUNT(pilot_user_registered WHERE registrationDate = TODAY)`
2. **Sesiones Activas:** `COUNT(pilot_session_started WHERE startedAt = TODAY)`
3. **SOAP Completados:** `COUNT(pilot_soap_finalized WHERE completedAt = TODAY)`
4. **Tiempo Promedio Ahorrado:** `AVG(timeSavedMinutes) WHERE completedAt = TODAY`

#### 6.2 Métricas Semanales

**Adoption Metrics:**
- **DAU / WAU Ratio:** Actividad diaria vs semanal
- **Retention Rate:** % usuarios que vuelven después de primera semana
- **Feature Adoption:** % usuarios que usan cada feature core
- **Patient Mix:** Ratio nuevos vs existentes

#### 6.3 Métricas de Product-Market Fit

**North Star Metrics:**
1. **Time to First Value:** Tiempo desde registro hasta primer SOAP completado
2. **SOAP Completion Rate:** % workflows que completan SOAP
3. **Copy/Paste Usage Rate:** % SOAP que se copian a EMR
4. **Weekly Active Users:** Usuarios que completan al menos 1 sesión por semana

---

## 🔧 Implementación Técnica

### 7.1 Modificaciones Necesarias

#### 7.1.1 User Registration Tracking

**Archivo:** `src/features/auth/RegisterPage.tsx` o servicio de registro

**Agregar:**
```typescript
// Detectar si es usuario piloto (registrado desde hoy)
const PILOT_START_DATE = new Date('2024-12-19T00:00:00Z');
const isPilotUser = new Date() >= PILOT_START_DATE;

// Al crear usuario
await AnalyticsService.trackEvent('pilot_user_registered', {
  userId: user.uid,
  email: user.email,
  registrationDate: new Date().toISOString(),
  isPilotUser: isPilotUser,
  pilotPhase: 'pilot_1',
  registrationSource: 'organic' // o 'invite' si aplica
});
```

#### 7.1.2 Patient Creation Tracking

**Archivo:** `src/features/command-center/components/CreatePatientModal.tsx`

**Modificar:**
```typescript
// Agregar campo para tipo de paciente
const [patientType, setPatientType] = useState<'new_evaluation' | 'existing_followup'>('new_evaluation');

// Al crear paciente
await AnalyticsService.trackEvent('pilot_patient_created', {
  patientId,
  userId: user.uid,
  patientType,
  createdAt: new Date().toISOString(),
  existingPatientData: patientType === 'existing_followup' ? {
    antecedentesBasicos: formData.antecedentesBasicos,
    diagnosticoActual: formData.diagnosticoActual,
    dolenciasPrincipales: formData.dolenciasPrincipales,
    restriccionesFisicas: formData.restriccionesFisicas,
    planOrientativoGenerado: formData.generarPlanOrientativo
  } : undefined
});
```

#### 7.1.3 Session Tracking

**Archivo:** `src/pages/ProfessionalWorkflowPage.tsx`

**Agregar al inicio del workflow:**
```typescript
// Detectar tipo de paciente
const isFirstSession = !lastEncounter.data;
const patientType = isFirstSession ? 'new_evaluation' : 'existing_followup';

// Track session start
useEffect(() => {
  if (patientId && user?.uid) {
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
        undefined
    });
  }
}, [patientId, user?.uid]);
```

**Agregar al finalizar SOAP:**
```typescript
// En handleFinalizeSOAP
await AnalyticsService.trackEvent('pilot_session_completed', {
  sessionId,
  userId: user?.uid,
  patientId,
  patientType,
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
  pdfExported: false
});
```

#### 7.1.4 Copy/Paste y Export Tracking

**Archivo:** `src/components/SOAPEditor.tsx`

**Modificar handlers:**
```typescript
const handleCopyToClipboard = async () => {
  // ... código existente ...
  
  // Track evento
  await AnalyticsService.trackEvent('pilot_copy_to_clipboard', {
    userId: user?.uid,
    patientId,
    sessionId,
    soapLength: plainText.length,
    timestamp: new Date().toISOString()
  });
};

const handleExportPDF = () => {
  // ... código existente ...
  
  // Track evento
  AnalyticsService.trackEvent('pilot_pdf_exported', {
    userId: user?.uid,
    patientId,
    sessionId,
    timestamp: new Date().toISOString()
  });
};
```

### 7.2 Queries de Firestore

#### 7.2.1 Usuarios Piloto

```typescript
// Obtener todos los usuarios piloto
const pilotUsersQuery = query(
  collection(db, 'analytics_events'),
  where('eventName', '==', 'pilot_user_registered'),
  where('eventData.isPilotUser', '==', true),
  where('timestamp', '>=', PILOT_START_DATE),
  orderBy('timestamp', 'desc')
);
```

#### 7.2.2 Sesiones del Piloto

```typescript
// Sesiones completadas hoy
const todaySessionsQuery = query(
  collection(db, 'analytics_events'),
  where('eventName', '==', 'pilot_session_completed'),
  where('timestamp', '>=', startOfToday),
  where('timestamp', '<=', endOfToday)
);
```

#### 7.2.3 Métricas de Adopción

```typescript
// Usuarios que usaron copy/paste
const copyPasteUsersQuery = query(
  collection(db, 'analytics_events'),
  where('eventName', '==', 'pilot_copy_to_clipboard'),
  where('eventData.userId', 'in', pilotUserIds)
);
```

---

## 📋 Checklist de Implementación

### Fase 1: Tracking Básico (CRÍTICO - HOY)

- [ ] Agregar flag `isPilotUser` en registro de usuarios
- [ ] Implementar `pilot_user_registered` event
- [ ] Implementar `pilot_patient_created` con `patientType`
- [ ] Implementar `pilot_session_started` y `pilot_session_completed`
- [ ] Agregar tracking de `copy_to_clipboard` y `pdf_exported`

### Fase 2: Tracking Avanzado (Esta Semana)

- [ ] Implementar eventos de workflow (`transcript_captured`, `analysis_completed`, etc.)
- [ ] Agregar tracking de errores con contexto de piloto
- [ ] Implementar métricas de abandono (`workflow_abandoned`)
- [ ] Agregar tracking de uso de "Today's Plan" header

### Fase 3: Dashboard y Reporting (Próxima Semana)

- [ ] Crear dashboard de métricas del piloto
- [ ] Implementar queries de agregación diarias/semanales
- [ ] Crear reportes automáticos de KPIs
- [ ] Configurar alertas para métricas críticas

---

## 🎯 Métricas Clave para Product-Market Fit

### North Star Metric

**"Weekly Active Users que completan al menos 1 SOAP"**

**Razón:** Mide adopción real del valor core (documentación clínica)

### Métricas de Éxito del Piloto

1. **Adoption Rate:** > 70% usuarios piloto completan al menos 1 SOAP en primera semana
2. **Retention Rate:** > 50% usuarios vuelven después de primera sesión
3. **Time to First Value:** < 30 minutos desde registro hasta primer SOAP
4. **Copy/Paste Usage:** > 60% SOAP finalizados se copian a EMR
5. **Time Saved:** Promedio > 10 minutos por sesión vs documentación manual

---

## 📊 Estructura de Datos en Firestore

### Colección: `analytics_events`

```typescript
{
  id: string;
  eventName: 'pilot_user_registered' | 'pilot_patient_created' | ...;
  eventData: {
    // Datos específicos del evento
    userId?: string;
    patientId?: string;
    sessionId?: string;
    isPilotUser?: boolean;
    pilotPhase?: 'pilot_1';
    patientType?: 'new_evaluation' | 'existing_followup';
    // ... otros campos según evento
  };
  userId?: string; // Hasheado para privacidad
  timestamp: Timestamp;
  sessionId?: string;
  userAgent?: string;
  url?: string;
}
```

### Índices Requeridos

```javascript
// Firestore Indexes
{
  collectionGroup: 'analytics_events',
  queryScope: 'COLLECTION',
  fields: [
    { fieldPath: 'eventName', order: 'ASCENDING' },
    { fieldPath: 'timestamp', order: 'DESCENDING' }
  ]
},
{
  collectionGroup: 'analytics_events',
  queryScope: 'COLLECTION',
  fields: [
    { fieldPath: 'eventName', order: 'ASCENDING' },
    { fieldPath: 'eventData.userId', order: 'ASCENDING' },
    { fieldPath: 'timestamp', order: 'DESCENDING' }
  ]
},
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

## 🔍 Análisis y Reporting

### Reportes Diarios Automáticos

**Métricas a Incluir:**
1. Nuevos usuarios piloto registrados
2. Sesiones iniciadas y completadas
3. SOAP generados y finalizados
4. Tiempo promedio ahorrado
5. Errores críticos ocurridos
6. Feature adoption rates

### Reportes Semanales

**Análisis de Cohorte:**
1. Retention rate por semana de registro
2. Feature adoption por cohorte
3. Patient mix (nuevos vs existentes)
4. Time to first value por usuario
5. Copy/paste usage trends

---

## ✅ Validación y Testing

### Testing de Tracking

**Verificar:**
- [ ] Eventos se capturan correctamente en Firestore
- [ ] Timestamps son precisos (timezone correcto)
- [ ] Datos de piloto se marcan correctamente
- [ ] Queries de agregación funcionan
- [ ] No hay eventos duplicados

### Validación de Datos

**Checks Automáticos:**
- Validar que `isPilotUser === true` para usuarios registrados desde hoy
- Validar que `patientType` está presente en creación de pacientes
- Validar que `sessionId` es único por sesión
- Validar que timestamps están en orden cronológico

---

## 🚀 Próximos Pasos

1. **HOY:** Implementar tracking básico de usuarios y pacientes piloto
2. **Esta Semana:** Implementar tracking completo de workflow
3. **Próxima Semana:** Crear dashboard de métricas y reportes automáticos
4. **Ongoing:** Revisar métricas semanalmente y ajustar según findings

---

**Fin de la Especificación**


