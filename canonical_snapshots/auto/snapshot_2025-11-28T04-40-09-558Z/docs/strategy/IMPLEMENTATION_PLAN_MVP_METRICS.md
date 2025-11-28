# Plan de Implementación: 3 Métricas MVP
**Time-to-Value, Feature Adoption, Quality Signals**

**Fecha:** Noviembre 2025  
**Timeline:** 3-4 días  
**Objetivo:** Sistema funcionando antes de reunión CTO  
**Prioridad:** ALTA - Demo para Niagara

---

## 🎯 OBJETIVO FINAL

Implementar 3 métricas críticas que demuestren valor agregado y permitan decisiones kaizen de reinversión:

1. **Time-to-Value** - Tiempo de documentación (valor principal)
2. **Feature Adoption** - Uso de funcionalidades (dónde reinvertir)
3. **Quality Signals** - Calidad de output (si funciona)

---

## 📅 PLAN DÍA POR DÍA

### DÍA 1: Extensión de Analytics Service + Schema

**Tiempo estimado:** 4-6 horas

#### Tarea 1.1: Definir interfaces TypeScript

**Archivo:** `src/services/analyticsService.ts` (extender)

**Agregar al final del archivo:**

```typescript
/**
 * Value Metrics for MVP - Kaizen Reinvestment Intelligence
 */

export interface ValueMetricsEvent {
  // Session identifiers (pseudonymized)
  hashedUserId: string;
  hashedSessionId: string;
  
  // Time-to-Value metrics
  timestamps: {
    sessionStart: Date;
    transcriptionStart?: Date;
    transcriptionEnd?: Date;
    soapGenerationStart?: Date;
    soapFinalized: Date;
  };
  
  calculatedTimes: {
    totalDocumentationTime: number; // minutos
    transcriptionTime?: number;      // minutos
    aiGenerationTime?: number;       // minutos (transcription + SOAP)
    manualEditingTime?: number;      // minutos (entre generación y finalización)
  };
  
  // Feature Adoption metrics
  featuresUsed: {
    transcription: boolean;
    physicalTests: boolean;
    aiSuggestions: boolean;
    soapGeneration: boolean;
  };
  
  // Quality Signals
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
    editsMadeToSOAP: number; // Número de cambios después de generación
  };
  
  // Metadata
  sessionType: 'initial' | 'follow-up';
  region?: string; // Provincias (sin granularidad específica)
  timestamp: Date;
}
```

---

#### Tarea 1.2: Crear método trackValueMetrics()

**Archivo:** `src/services/analyticsService.ts` (dentro de la clase)

**Agregar método estático:**

```typescript
/**
 * Track value metrics for MVP - Kaizen reinvestment intelligence
 * 
 * REQUIREMENTS:
 * - PHIPA compliant (no PHI)
 * - Pseudonymized identifiers
 * - Validated before saving
 * 
 * @param metrics - Value metrics event data
 */
static async trackValueMetrics(metrics: Omit<ValueMetricsEvent, 'timestamp'>): Promise<void> {
  try {
    // Import validators (dynamic to avoid circular deps)
    const { validateAnalyticsQuery, validateKAnonymity } = await import('./analyticsValidationService');
    const { pseudonymizeUserId } = await import('./pseudonymizationService');
    
    // Validate query doesn't contain PHI
    validateAnalyticsQuery(metrics, 'value_analytics');
    
    // Pseudonymize user ID
    const hashedUserId = pseudonymizeUserId(metrics.hashedUserId);
    const hashedSessionId = metrics.hashedSessionId; // Already hashed or generate hash
    
    // Prepare event for Firestore
    const valueEvent = {
      hashedUserId,
      hashedSessionId,
      timestamps: {
        sessionStart: metrics.timestamps.sessionStart,
        transcriptionStart: metrics.timestamps.transcriptionStart || null,
        transcriptionEnd: metrics.timestamps.transcriptionEnd || null,
        soapGenerationStart: metrics.timestamps.soapGenerationStart || null,
        soapFinalized: metrics.timestamps.soapFinalized,
      },
      calculatedTimes: {
        totalDocumentationTime: metrics.calculatedTimes.totalDocumentationTime,
        transcriptionTime: metrics.calculatedTimes.transcriptionTime || null,
        aiGenerationTime: metrics.calculatedTimes.aiGenerationTime || null,
        manualEditingTime: metrics.calculatedTimes.manualEditingTime || null,
      },
      featuresUsed: metrics.featuresUsed,
      quality: metrics.quality,
      sessionType: metrics.sessionType,
      region: metrics.region || null,
      timestamp: serverTimestamp(),
    };
    
    // Save to Firestore
    const valueAnalyticsRef = collection(db, 'value_analytics');
    await addDoc(valueAnalyticsRef, valueEvent);
    
    console.log('[VALUE METRICS] Event tracked:', {
      hashedSessionId,
      totalTime: metrics.calculatedTimes.totalDocumentationTime,
      featuresUsed: Object.values(metrics.featuresUsed).filter(Boolean).length,
    });
  } catch (error) {
    console.error('❌ [VALUE METRICS] Error tracking value metrics:', error);
    // Don't throw - analytics should not break main flow
  }
}
```

---

#### Tarea 1.3: Crear colección Firestore

**Acción:** Crear colección `value_analytics` en Firebase Console

**Schema esperado:**
```
value_analytics/
  {
    hashedUserId: string,
    hashedSessionId: string,
    timestamps: {
      sessionStart: Timestamp,
      transcriptionStart: Timestamp | null,
      transcriptionEnd: Timestamp | null,
      soapGenerationStart: Timestamp | null,
      soapFinalized: Timestamp,
    },
    calculatedTimes: {
      totalDocumentationTime: number,
      transcriptionTime: number | null,
      aiGenerationTime: number | null,
      manualEditingTime: number | null,
    },
    featuresUsed: {
      transcription: boolean,
      physicalTests: boolean,
      aiSuggestions: boolean,
      soapGeneration: boolean,
    },
    quality: {
      soapSectionsCompleted: {
        subjective: boolean,
        objective: boolean,
        assessment: boolean,
        plan: boolean,
      },
      suggestionsOffered: number,
      suggestionsAccepted: number,
      suggestionsRejected: number,
      editsMadeToSOAP: number,
    },
    sessionType: string,
    region: string | null,
    timestamp: Timestamp,
  }
```

**Índices requeridos:**
- `timestamp` (ASC) - Para queries por fecha
- `hashedUserId` (ASC) + `timestamp` (DESC) - Para métricas por usuario
- `sessionType` (ASC) + `timestamp` (DESC) - Para comparar initial vs follow-up

---

### DÍA 2: Integración en Workflow (Time-to-Value)

**Tiempo estimado:** 4-6 horas

#### Tarea 2.1: Agregar timestamps en ProfessionalWorkflowPage

**Archivo:** `src/pages/ProfessionalWorkflowPage.tsx`

**Paso 1:** Agregar estado para timestamps

**Ubicación:** Después de `const [attachments, setAttachments] = ...` (línea ~130)

```typescript
// Value Metrics Tracking
const [sessionStartTime] = useState<Date>(new Date());
const [transcriptionStartTime, setTranscriptionStartTime] = useState<Date | null>(null);
const [transcriptionEndTime, setTranscriptionEndTime] = useState<Date | null>(null);
const [soapGenerationStartTime, setSoapGenerationStartTime] = useState<Date | null>(null);
```

**Paso 2:** Capturar timestamp cuando inicia transcripción

**Ubicación:** En la función que maneja `handleStartRecording` o similar

```typescript
const handleStartTranscription = () => {
  setTranscriptionStartTime(new Date());
  // ... resto del código existente
};
```

**Paso 3:** Capturar timestamp cuando termina transcripción

**Ubicación:** En la función que maneja `handleStopRecording` o cuando termina `useTranscript`

```typescript
useEffect(() => {
  if (transcript && !transcriptionEndTime) {
    setTranscriptionEndTime(new Date());
  }
}, [transcript, transcriptionEndTime]);
```

**Paso 4:** Capturar timestamp cuando inicia generación SOAP

**Ubicación:** En `handleGenerateSOAP()` (antes de `setIsGeneratingSOAP(true)`)

```typescript
const handleGenerateSOAP = async () => {
  setSoapGenerationStartTime(new Date());
  setIsGeneratingSOAP(true);
  // ... resto del código existente
};
```

---

#### Tarea 2.2: Agregar tracking en SOAPEditor

**Archivo:** `src/components/SOAPEditor.tsx`

**Paso 1:** Agregar prop para recibir timestamps

**Ubicación:** En la interface `SOAPEditorProps`

```typescript
export interface SOAPEditorProps {
  // ... props existentes
  sessionStartTime?: Date;
  soapGenerationStartTime?: Date;
  onSOAPFinalized?: (finalizedAt: Date) => void;
}
```

**Paso 2:** Track cuando SOAP se finaliza

**Ubicación:** En `handleSave()` cuando `status === 'finalized'`

```typescript
const handleSave = () => {
  if (status === 'finalized' && onSOAPFinalized) {
    onSOAPFinalized(new Date());
  }
  onSave(editedSOAP, status);
  // ... resto del código
};
```

---

#### Tarea 2.3: Calcular y enviar métricas cuando se finaliza SOAP

**Archivo:** `src/pages/ProfessionalWorkflowPage.tsx`

**Paso 1:** Crear función para calcular métricas

**Ubicación:** Después de `handleSaveSOAP`

```typescript
const calculateAndTrackValueMetrics = useCallback(async (finalizedAt: Date) => {
  if (!transcriptionEndTime || !soapGenerationStartTime) {
    console.warn('[VALUE METRICS] Missing timestamps, skipping tracking');
    return;
  }
  
  // Calcular tiempos (en minutos)
  const transcriptionTime = transcriptionStartTime && transcriptionEndTime
    ? (transcriptionEndTime.getTime() - transcriptionStartTime.getTime()) / 1000 / 60
    : undefined;
    
  const aiGenerationTime = soapGenerationStartTime && transcriptionEndTime
    ? (new Date().getTime() - soapGenerationStartTime.getTime()) / 1000 / 60
    : undefined;
    
  const totalDocumentationTime = (finalizedAt.getTime() - sessionStartTime.getTime()) / 1000 / 60;
  
  const manualEditingTime = aiGenerationTime
    ? totalDocumentationTime - aiGenerationTime
    : undefined;
  
  // Detectar features usadas
  const featuresUsed = {
    transcription: !!transcript && transcript.length > 0,
    physicalTests: evaluationTests.length > 0,
    aiSuggestions: sharedState.clinicalAnalysis?.physicalTests ? sharedState.clinicalAnalysis.physicalTests.length > 0 : false,
    soapGeneration: !!localSoapNote,
  };
  
  // Calcular calidad (necesitamos trackear esto durante el workflow)
  // Por ahora, estimar desde datos disponibles
  const soapSectionsCompleted = {
    subjective: !!(localSoapNote?.subjective && localSoapNote.subjective.length > 0),
    objective: !!(localSoapNote?.objective && localSoapNote.objective.length > 0),
    assessment: !!(localSoapNote?.assessment && localSoapNote.assessment.length > 0),
    plan: !!(localSoapNote?.plan && localSoapNote.plan.length > 0),
  };
  
  // Preparar métricas
  const metrics = {
    hashedUserId: TEMP_USER_ID, // TODO: Reemplazar con ID real hasheado
    hashedSessionId: `session-${Date.now()}`, // TODO: Hash real
    timestamps: {
      sessionStart: sessionStartTime,
      transcriptionStart: transcriptionStartTime || undefined,
      transcriptionEnd: transcriptionEndTime || undefined,
      soapGenerationStart: soapGenerationStartTime || undefined,
      soapFinalized: finalizedAt,
    },
    calculatedTimes: {
      totalDocumentationTime,
      transcriptionTime,
      aiGenerationTime,
      manualEditingTime,
    },
    featuresUsed,
    quality: {
      soapSectionsCompleted,
      suggestionsOffered: sharedState.clinicalAnalysis?.physicalTests?.length || 0,
      suggestionsAccepted: evaluationTests.filter(t => t.source === 'ai').length,
      suggestionsRejected: 0, // TODO: Trackear rejections
      editsMadeToSOAP: 0, // TODO: Trackear edits
    },
    sessionType: visitType,
    region: demoPatient.province, // TODO: Obtener de auth/session
  };
  
  // Enviar métricas
  await AnalyticsService.trackValueMetrics(metrics);
}, [transcriptionStartTime, transcriptionEndTime, soapGenerationStartTime, sessionStartTime, transcript, evaluationTests, sharedState, localSoapNote, visitType]);
```

**Paso 2:** Llamar cuando SOAP se finaliza

**Ubicación:** Actualizar `handleSaveSOAP` para llamar `calculateAndTrackValueMetrics`

```typescript
const handleSaveSOAP = async (soap: SOAPNote, status: SOAPStatus) => {
  // ... código existente
  
  if (status === 'finalized') {
    await calculateAndTrackValueMetrics(new Date());
  }
};
```

---

### DÍA 3: Feature Adoption + Quality Tracking

**Tiempo estimado:** 4-6 horas

#### Tarea 3.1: Trackear sugerencias AI (Acceptance/Rejection)

**Archivo:** `src/pages/ProfessionalWorkflowPage.tsx`

**Paso 1:** Agregar contador de sugerencias ofrecidas vs aceptadas

**Ubicación:** Agregar estado

```typescript
const [suggestionsTracking, setSuggestionsTracking] = useState({
  offered: 0,
  accepted: 0,
  rejected: 0,
});
```

**Paso 2:** Trackear cuando se ofrecen sugerencias

**Ubicación:** Cuando se muestran `ClinicalAnalysisResults`

```typescript
useEffect(() => {
  if (sharedState.clinicalAnalysis?.physicalTests) {
    const suggestedTests = sharedState.clinicalAnalysis.physicalTests.length;
    setSuggestionsTracking(prev => ({ ...prev, offered: suggestedTests }));
  }
}, [sharedState.clinicalAnalysis?.physicalTests]);
```

**Paso 3:** Trackear cuando se acepta/rechaza sugerencia

**Ubicación:** En `addEvaluationTest` y cuando se rechaza

```typescript
const addEvaluationTest = useCallback(
  (entry: EvaluationTestEntry) => {
    // ... código existente
    
    // Track acceptance
    if (entry.source === 'ai') {
      setSuggestionsTracking(prev => ({ ...prev, accepted: prev.accepted + 1 }));
    }
    
    persistEvaluation([...evaluationTests, entry]);
  },
  [evaluationTests, persistEvaluation]
);
```

---

#### Tarea 3.2: Trackear edits en SOAP

**Archivo:** `src/components/SOAPEditor.tsx`

**Paso 1:** Agregar contador de edits

**Ubicación:** En el componente, agregar estado

```typescript
const [editCount, setEditCount] = useState(0);
const [initialSOAP, setInitialSOAP] = useState<SOAPNote | null>(null);

useEffect(() => {
  if (soap && !initialSOAP) {
    setInitialSOAP(JSON.parse(JSON.stringify(soap))); // Deep copy
  }
}, [soap, initialSOAP]);

const handleSectionChange = (section: keyof SOAPNote, value: string) => {
  // ... código existente
  
  // Incrementar edit count si es cambio desde inicial
  if (initialSOAP && JSON.stringify(editedSOAP) !== JSON.stringify(initialSOAP)) {
    setEditCount(prev => prev + 1);
  }
};
```

**Paso 2:** Pasar editCount a callback

**Ubicación:** En `handleSave`

```typescript
if (status === 'finalized' && onSOAPFinalized) {
  onSOAPFinalized(new Date(), editCount);
}
```

**Paso 3:** Actualizar interface

```typescript
onSOAPFinalized?: (finalizedAt: Date, editCount: number) => void;
```

---

#### Tarea 3.3: Actualizar métricas con datos de quality

**Archivo:** `src/pages/ProfessionalWorkflowPage.tsx`

**Actualizar `calculateAndTrackValueMetrics`:**

```typescript
quality: {
  soapSectionsCompleted,
  suggestionsOffered: suggestionsTracking.offered,
  suggestionsAccepted: suggestionsTracking.accepted,
  suggestionsRejected: suggestionsTracking.rejected,
  editsMadeToSOAP: editCountFromSOAPEditor, // Pasar desde SOAPEditor
},
```

---

### DÍA 4: Dashboard Simple + Testing

**Tiempo estimado:** 4-6 horas

#### Tarea 4.1: Crear componente ValueMetricsDashboard

**Archivo:** `src/components/analytics/ValueMetricsDashboard.tsx` (nuevo)

```typescript
/**
 * Value Metrics Dashboard - MVP
 * 
 * Muestra las 3 métricas críticas:
 * - Time-to-Value
 * - Feature Adoption
 * - Quality Signals
 */

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ValueMetrics {
  avgTotalTime: number;
  avgTranscriptionTime: number;
  avgAiGenerationTime: number;
  avgManualEditingTime: number;
  
  featureAdoption: {
    transcription: number;
    physicalTests: number;
    aiSuggestions: number;
    soapGeneration: number;
  };
  
  quality: {
    avgSOAPCompleteness: number;
    avgSuggestionsAcceptanceRate: number;
    avgEditsPerSOAP: number;
  };
}

export const ValueMetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ValueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadMetrics();
  }, []);
  
  const loadMetrics = async () => {
    try {
      // Query últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const q = query(
        collection(db, 'value_analytics'),
        where('timestamp', '>=', thirtyDaysAgo),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );
      
      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => doc.data());
      
      if (events.length === 0) {
        setLoading(false);
        return;
      }
      
      // Calcular métricas agregadas
      const avgTotalTime = events.reduce((sum, e) => sum + (e.calculatedTimes?.totalDocumentationTime || 0), 0) / events.length;
      const avgTranscriptionTime = events.filter(e => e.calculatedTimes?.transcriptionTime).reduce((sum, e) => sum + (e.calculatedTimes.transcriptionTime || 0), 0) / events.filter(e => e.calculatedTimes?.transcriptionTime).length || 0;
      const avgAiGenerationTime = events.filter(e => e.calculatedTimes?.aiGenerationTime).reduce((sum, e) => sum + (e.calculatedTimes.aiGenerationTime || 0), 0) / events.filter(e => e.calculatedTimes?.aiGenerationTime).length || 0;
      const avgManualEditingTime = events.filter(e => e.calculatedTimes?.manualEditingTime).reduce((sum, e) => sum + (e.calculatedTimes.manualEditingTime || 0), 0) / events.filter(e => e.calculatedTimes?.manualEditingTime).length || 0;
      
      const featureAdoption = {
        transcription: (events.filter(e => e.featuresUsed?.transcription).length / events.length) * 100,
        physicalTests: (events.filter(e => e.featuresUsed?.physicalTests).length / events.length) * 100,
        aiSuggestions: (events.filter(e => e.featuresUsed?.aiSuggestions).length / events.length) * 100,
        soapGeneration: (events.filter(e => e.featuresUsed?.soapGeneration).length / events.length) * 100,
      };
      
      const avgSOAPCompleteness = events.reduce((sum, e) => {
        const sections = e.quality?.soapSectionsCompleted || {};
        const completed = [sections.subjective, sections.objective, sections.assessment, sections.plan].filter(Boolean).length;
        return sum + (completed / 4) * 100;
      }, 0) / events.length;
      
      const avgSuggestionsAcceptanceRate = events.filter(e => e.quality?.suggestionsOffered > 0).reduce((sum, e) => {
        const offered = e.quality.suggestionsOffered || 0;
        const accepted = e.quality.suggestionsAccepted || 0;
        return sum + (accepted / offered) * 100;
      }, 0) / events.filter(e => e.quality?.suggestionsOffered > 0).length || 0;
      
      const avgEditsPerSOAP = events.reduce((sum, e) => sum + (e.quality?.editsMadeToSOAP || 0), 0) / events.length;
      
      setMetrics({
        avgTotalTime,
        avgTranscriptionTime,
        avgAiGenerationTime,
        avgManualEditingTime,
        featureAdoption,
        quality: {
          avgSOAPCompleteness,
          avgSuggestionsAcceptanceRate,
          avgEditsPerSOAP,
        },
      });
      
      setLoading(false);
    } catch (error) {
      console.error('[VALUE METRICS] Error loading metrics:', error);
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="p-8">Loading metrics...</div>;
  }
  
  if (!metrics) {
    return <div className="p-8">No metrics available yet.</div>;
  }
  
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Value Metrics Dashboard</h1>
      
      {/* Time-to-Value */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Time-to-Value</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Total Documentation</div>
            <div className="text-2xl font-bold">{metrics.avgTotalTime.toFixed(1)} min</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Transcription</div>
            <div className="text-2xl font-bold">{metrics.avgTranscriptionTime.toFixed(1)} min</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">AI Generation</div>
            <div className="text-2xl font-bold">{metrics.avgAiGenerationTime.toFixed(1)} min</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Manual Editing</div>
            <div className="text-2xl font-bold">{metrics.avgManualEditingTime.toFixed(1)} min</div>
          </div>
        </div>
      </section>
      
      {/* Feature Adoption */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Feature Adoption</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Transcription</span>
            <span className="font-semibold">{metrics.featureAdoption.transcription.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Physical Tests</span>
            <span className="font-semibold">{metrics.featureAdoption.physicalTests.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>AI Suggestions</span>
            <span className="font-semibold">{metrics.featureAdoption.aiSuggestions.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>SOAP Generation</span>
            <span className="font-semibold">{metrics.featureAdoption.soapGeneration.toFixed(1)}%</span>
          </div>
        </div>
      </section>
      
      {/* Quality Signals */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quality Signals</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">SOAP Completeness</div>
            <div className="text-2xl font-bold">{metrics.quality.avgSOAPCompleteness.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">AI Acceptance</div>
            <div className="text-2xl font-bold">{metrics.quality.avgSuggestionsAcceptanceRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Avg Edits/SOAP</div>
            <div className="text-2xl font-bold">{metrics.quality.avgEditsPerSOAP.toFixed(1)}</div>
          </div>
        </div>
      </section>
    </div>
  );
};
```

---

#### Tarea 4.2: Agregar ruta para dashboard

**Archivo:** `src/router/router.tsx`

**Agregar ruta:**

```typescript
import { ValueMetricsDashboard } from '@/components/analytics/ValueMetricsDashboard';

// En createBrowserRouter:
{
  path: "/analytics",
  element: <ValueMetricsDashboard />,
  // TODO: Agregar protección con auth (solo CEO/CTO)
}
```

---

#### Tarea 4.3: Testing Manual

**Checklist:**

- [ ] Crear sesión completa (transcripción → tests → SOAP)
- [ ] Verificar que se guarda en `value_analytics` collection
- [ ] Verificar que timestamps son correctos
- [ ] Verificar que features used son correctos
- [ ] Verificar que quality metrics son correctos
- [ ] Abrir `/analytics` y verificar que dashboard carga
- [ ] Verificar que métricas se calculan correctamente
- [ ] Probar con múltiples sesiones
- [ ] Verificar que no se rompe si faltan datos

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Día 1
- [ ] Extender `analyticsService.ts` con interfaces
- [ ] Crear método `trackValueMetrics()`
- [ ] Crear colección `value_analytics` en Firestore
- [ ] Crear índices necesarios

### Día 2
- [ ] Agregar timestamps en `ProfessionalWorkflowPage`
- [ ] Integrar tracking en workflow
- [ ] Agregar callback en `SOAPEditor`
- [ ] Calcular y enviar métricas al finalizar

### Día 3
- [ ] Trackear sugerencias AI (offered/accepted/rejected)
- [ ] Trackear edits en SOAP
- [ ] Actualizar métricas con datos de quality

### Día 4
- [ ] Crear componente `ValueMetricsDashboard`
- [ ] Agregar ruta `/analytics`
- [ ] Testing manual completo
- [ ] Fix bugs encontrados

---

## 🎯 RESULTADO ESPERADO

Al finalizar, tendrás:

1. ✅ Sistema de métricas funcionando
2. ✅ Dashboard en `/analytics` mostrando las 3 métricas críticas
3. ✅ Data siendo capturada automáticamente en cada sesión
4. ✅ PHIPA-compliant (pseudonymized, validado)

**Para la reunión CTO:**
- Puedes mostrar dashboard funcionando
- Puedes mostrar métricas reales (si hay sesiones de prueba)
- Puedes demostrar "data-driven operations" real

---

## 🚀 PRÓXIMOS PASOS (Post-Reunión)

1. **Refinamiento basado en feedback CTO**
2. **Expansión a Growth Metrics** (cuando tengas volumen)
3. **Dashboard para usuarios individuales** (opcional)

---

**Plan listo para implementación inmediata.**

