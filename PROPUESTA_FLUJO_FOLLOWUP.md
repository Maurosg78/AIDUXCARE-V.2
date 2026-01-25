# 🎯 PROPUESTA: Flujo Lógico de Follow-up
## Fecha: 2026-01-21 | Estado: 📋 PROPUESTA DE DISEÑO

---

## 🔍 PROBLEMA IDENTIFICADO

**Situación actual:**
- Follow-up **salta el tab "Analysis"** y va directo a SOAP
- **No hay lugar para grabar la conversación inicial** con el paciente
- La evaluación física está diseñada para ser exhaustiva (initial), no selectiva (follow-up)

**Necesidad clínica:**
1. **Conversación inicial** - "¿Cómo has estado desde la última vez?" - Entender evolución
2. **Re-evaluación física selectiva** - No exhaustiva, pero sí medir progreso en áreas clave
3. **Aplicar terapia** - Según el plan anterior
4. **Generar SOAP** - Con actualizaciones

---

## 🎨 PROPUESTA DE FLUJO LÓGICO

### **FLUJO ACTUAL (Incorrecto):**
```
Follow-up → [Skip Analysis] → SOAP
```
**Problema:** No hay lugar para conversación inicial ni re-evaluación

---

### **FLUJO PROPUESTO (Correcto):**

```
┌─────────────────────────────────────────────────────────┐
│ FOLLOW-UP WORKFLOW                                      │
└─────────────────────────────────────────────────────────┘

1️⃣ SUBJECTIVE (Conversación Inicial)
   └─ "¿Cómo has estado desde la última vez?"
   └─ "¿Qué puedes hacer ahora que no podías antes?"
   └─ "¿Qué sigue limitándote?"
   └─ [Grabar audio] → Transcripción → Análisis

2️⃣ OBJECTIVE (Re-evaluación Física Selectiva)
   └─ NO exhaustiva, pero SÍ medir progreso
   └─ Tests clave según patología
   └─ Comparar con baseline anterior
   └─ Medir mejoras específicas

3️⃣ SOAP (Generar Nota)
   └─ Usar conversación + re-evaluación
   └─ Comparar con visita anterior
   └─ Actualizar plan de tratamiento
```

---

## 📋 DISEÑO DE UI PROPUESTO

### **Opción A: Tab "Subjective" para Follow-up**

**Tabs para Follow-up:**
```
[1 · Subjective] [2 · Re-evaluation] [3 · SOAP Report]
```

**Tab 1: Subjective (Follow-up)**
- **Header:** "Follow-up Conversation"
- **Plan anterior visible:** Muestra "Today's Plan" del plan anterior
- **Grabación de audio:** Para conversación inicial
- **Preguntas guía:**
  - "How have you been since last visit?"
  - "What can you do now that you couldn't before?"
  - "What's still limiting you?"
- **Transcript area:** Muestra transcripción en tiempo real
- **Análisis clínico:** Vertex AI analiza cambios y progreso

**Tab 2: Re-evaluation (Follow-up)**
- **Header:** "Selective Physical Re-evaluation"
- **Diferencia con Initial:**
  - ✅ NO exhaustiva
  - ✅ Tests sugeridos basados en patología anterior
  - ✅ Comparación con baseline
  - ✅ Enfoque en medir progreso específico
- **Tests sugeridos:** Basados en:
  - Tests realizados en initial assessment
  - Áreas de enfoque del plan anterior
  - Patología específica

**Tab 3: SOAP Report**
- Igual que actual, pero con contexto de follow-up

---

### **Opción B: Tab "Analysis" Modificado para Follow-up**

**Mantener tab "Analysis" pero con contenido diferente:**

**Para Initial:**
- Análisis completo
- Evaluación exhaustiva sugerida

**Para Follow-up:**
- **Sección 1: Plan anterior** (ya existe)
- **Sección 2: Conversación inicial** (NUEVO)
  - Grabación de audio
  - Transcripción
  - Análisis de cambios
- **Sección 3: Re-evaluación selectiva** (NUEVO)
  - Tests sugeridos basados en patología
  - Comparación con baseline

---

## ✅ RECOMENDACIÓN: Opción B (Modificar Analysis Tab)

**Razones:**
1. ✅ Menos cambios estructurales
2. ✅ Mantiene consistencia de UI
3. ✅ El tab "Analysis" tiene sentido para follow-up (analizar cambios)
4. ✅ Ya tiene el plan anterior mostrado

**Implementación:**

### 1. **Modificar AnalysisTab para Follow-up**

**Cuando `visitType === 'follow-up'`:**
- Mostrar sección "Follow-up Conversation" (NUEVO)
  - Grabación de audio
  - Transcripción
  - Análisis de cambios
- Mantener "Today's Plan" (ya existe)
- Agregar sección "Selective Re-evaluation" (NUEVO)
  - Tests sugeridos
  - Comparación con baseline

### 2. **Modificar EvaluationTab para Follow-up**

**Cuando `visitType === 'follow-up'`:**
- **Header:** "Selective Physical Re-evaluation"
- **Descripción:** "Focus on key tests to measure progress. Compare with baseline from initial assessment."
- **Tests sugeridos:**
  - Tests realizados en initial assessment
  - Tests relacionados con objetivos del plan
  - Tests específicos de la patología
- **Comparación visual:** Mostrar resultados anteriores vs. actuales

---

## 🔧 CAMBIOS TÉCNICOS NECESARIOS

### 1. **AnalysisTab - Agregar Sección de Conversación**

```typescript
// src/components/workflow/tabs/AnalysisTab.tsx

{visitType === 'follow-up' && (
  <section className="mt-6">
    <h3 className="text-lg font-semibold mb-4">Follow-up Conversation</h3>
    <p className="text-sm text-slate-600 mb-4">
      Record your conversation with the patient about their progress since last visit.
    </p>
    
    {/* Transcript Area para follow-up */}
    <TranscriptArea
      recordingTime={recordingTime}
      isRecording={isRecording}
      startRecording={startRecording}
      stopRecording={stopRecording}
      transcript={transcript}
      setTranscript={setTranscript}
      // ... otros props
    />
    
    {/* Análisis de cambios */}
    {niagaraResults && (
      <ClinicalAnalysisResults
        analysis={niagaraResults}
        visitType="follow-up"
      />
    )}
  </section>
)}
```

### 2. **EvaluationTab - Modo Selectivo para Follow-up**

```typescript
// src/components/workflow/tabs/EvaluationTab.tsx

{visitType === 'follow-up' && (
  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <h3 className="text-sm font-semibold text-blue-900 mb-2">
      Selective Re-evaluation
    </h3>
    <p className="text-sm text-blue-700">
      Focus on key tests to measure progress. Compare results with baseline from initial assessment.
    </p>
    
    {/* Tests sugeridos basados en initial assessment */}
    {previousTests && (
      <div className="mt-4">
        <p className="text-xs font-medium text-blue-900 mb-2">
          Suggested tests (from initial assessment):
        </p>
        <ul className="text-xs text-blue-700 space-y-1">
          {previousTests.map(test => (
            <li key={test.id}>• {test.name}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
)}
```

### 3. **WorkflowRouter - No saltar Analysis en Follow-up**

```typescript
// src/services/workflowRouterService.ts

if (workflowType === 'follow-up') {
  return {
    type: 'follow-up',
    skipTabs: [], // ✅ NO saltar Analysis - necesita conversación
    directToTab: 'analysis', // ✅ Ir a Analysis primero
    analysisLevel: 'follow-up', // Modo follow-up
  };
}
```

---

## 📊 ESTRUCTURA DE DATOS

### **Follow-up Conversation Data:**
```typescript
{
  visitType: 'follow-up',
  conversationTranscript: string,
  conversationAnalysis: {
    changes: string[],        // ["Pain improved from 6/10 to 3/10"]
    newConcerns: string[],   // ["Can't sleep well"]
    progress: string[],       // ["Can write 30min vs 10min"]
  },
  previousPlan: TreatmentPlan,
  selectiveTests: PhysicalTest[],
  comparisonWithBaseline: {
    testId: string,
    previousResult: any,
    currentResult: any,
    change: string,
  }[]
}
```

---

## ✅ CRITERIOS DE ACEPTACIÓN

1. ✅ Follow-up tiene lugar para grabar conversación inicial
2. ✅ Re-evaluación física es selectiva (no exhaustiva)
3. ✅ Tests sugeridos basados en initial assessment
4. ✅ Comparación visual con baseline
5. ✅ Flujo lógico: Conversación → Re-evaluación → SOAP
6. ✅ UI clara y diferenciada entre initial y follow-up

---

**Generado:** 2026-01-21  
**Estado:** 📋 PROPUESTA - Pendiente aprobación
