# 📊 Informe Técnico para CTO: Simplificación de Scheduling y Mejora de "Today's Plan"

**Fecha:** 2024-12-19  
**Autor:** Engineering Team  
**Estado:** ✅ Implementado

---

## 🎯 Resumen Ejecutivo

Se realizaron dos cambios estratégicos alineados con el **refinamiento del Market Fit** de AiduxCare como **Clinical Companion** (no EMR completo):

1. **Eliminación del componente de Scheduling complejo** del flujo SOAP
2. **Mejora del header "Today's Plan"** con lógica de visitas y contexto clínico

---

## 1. 📅 Eliminación del TreatmentPlanScheduler

### 1.1 Contexto Estratégico

**Decisión de Producto:**
- AiduxCare se posiciona como **Clinical Companion** para fisioterapeutas
- **NO** es un EMR completo ni sistema de scheduling
- **Valor Core:** Documentación inteligente, memoria del paciente, copy/paste fácil a EMR

**Roadmap Simplificado:**
- ❌ **REMOVED:** Complex Treatment Scheduling Proposals
- ❌ **REMOVED:** Appointment Management
- ❌ **REMOVED:** Calendar Integration
- ❌ **REMOVED:** Resource Booking
- ✅ **FOCUS:** SOAP Quality, Patient Memory, Easy Copy/Paste, Clinical Continuity

### 1.2 Cambios Técnicos Implementados

**Archivo:** `src/components/SOAPEditor.tsx`

**Antes:**
```typescript
import { TreatmentPlanScheduler } from './TreatmentPlanScheduler';

// En el render:
{patientId && (
  <TreatmentPlanScheduler
    patientId={patientId}
    treatmentPlan={currentSOAP?.plan || ''}
    visitType={visitType}
  />
)}
```

**Después:**
```typescript
// Componente removido completamente
// Reemplazado por acciones simples de "Companion"
```

**Reemplazo:**
Se agregaron acciones simples de "Companion" visibles solo cuando `status === 'draft'`:
- **Copy to Clipboard** (prominente, con subtítulo "Paste into your EMR")
- **Export PDF** (usando `window.print()`)
- **Download .txt** (formato plano compatible con EMR)

### 1.3 Impacto

**Código Eliminado:**
- `TreatmentPlanScheduler` component (no existe en codebase actual)
- Lógica de parsing de planes de tratamiento para scheduling
- Generación automática de citas desde SOAP

**Código Mantenido:**
- `treatmentPlanService.ts` - Servicio para guardar planes (usado para reminders)
- `parseTreatmentPlan()` - Parser de planes (puede reutilizarse en futuro)
- Lógica de reminders para follow-up visits

**Beneficios:**
- ✅ UI más simple y enfocada en el valor core
- ✅ Menos complejidad en el flujo SOAP
- ✅ Mejor UX para el caso de uso principal (copy/paste a EMR)
- ✅ Código más mantenible

---

## 2. 📋 Mejora del Header "Today's Plan"

### 2.1 Objetivo

Transformar la columna "TODAY'S PLAN" del header del workflow para:
1. Mostrar número de visita basado en encounters completados (no fecha/hora específica)
2. Mostrar qué se hizo en la última visita (intervenciones o resumen del plan)
3. Mostrar qué se propone para hoy (del plan del SOAP anterior)
4. Permitir notas adicionales del fisio para la sesión actual

### 2.2 Arquitectura de Datos

**Hooks Utilizados:**

```typescript
// src/features/patient-dashboard/hooks/usePatientVisitCount.ts
// Cuenta encounters con status 'completed' o 'signed'
const visitCount = usePatientVisitCount(patientId);

// src/features/patient-dashboard/hooks/useLastEncounter.ts
// Obtiene el último encounter del paciente
const lastEncounter = useLastEncounter(patientId);

// src/features/patient-dashboard/hooks/useActiveEpisode.ts
// Obtiene el episodio activo (si existe)
const activeEpisode = useActiveEpisode(patientId);
```

**Modelo de Datos (Encounter):**
```typescript
interface Encounter {
  id: string;
  patientId: string;
  status: 'draft' | 'completed' | 'signed';
  encounterDate: Timestamp;
  
  // SOAP del encuentro anterior
  soap?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string; // ← Usado para "Today's plan"
  };
  
  // Intervenciones realizadas
  interventions?: {
    type: string;
    description: string;
    duration?: number;
    intensity?: string;
    sets?: number;
    reps?: number;
    notes?: string;
  }[]; // ← Usado para "Last visit"
}
```

### 2.3 Lógica de Renderizado

**Ubicación:** `src/pages/ProfessionalWorkflowPage.tsx` (líneas 2583-2653)

**Estructura del Componente:**

```typescript
{/* Column 3: TODAY'S PLAN */}
<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
  {/* 1. Header con número de visita */}
  <div className="flex items-center gap-2 mb-2">
    <CheckCircle className="w-4 h-4 text-emerald-500" />
    <p>TODAY'S PLAN</p>
    <span>
      {visitCount.loading ? '...' 
       : visitCount.data ? `#${visitCount.data + 1}` 
       : '#1'}
    </span>
  </div>
  
  {/* 2. Tipo de sesión actual */}
  <p>{sessionTypeConfig.label}</p>
  
  {/* 3. Resumen de última visita (si existe) */}
  {lastEncounter.data && lastEncounter.data.soap && (
    <div>
      {/* Prioridad: interventions > plan > mensaje vacío */}
      {lastEncounter.data.interventions?.length > 0 ? (
        <ul>
          {interventions.slice(0, 2).map(i => (
            <li>• {i.type}: {i.description}</li>
          ))}
        </ul>
      ) : lastEncounter.data.soap.plan ? (
        <p>{plan.substring(0, 80)}...</p>
      ) : (
        <p>No interventions documented</p>
      )}
      
      {/* 4. Plan propuesto para hoy */}
      {lastEncounter.data.soap.plan && (
        <div>
          <p>Today's plan:</p>
          <p>{plan.substring(0, 100)}...</p>
        </div>
      )}
    </div>
  )}
  
  {/* 5. Mensaje para primera sesión */}
  {!lastEncounter.loading && !lastEncounter.data && (
    <p>First session - Initial assessment</p>
  )}
  
  {/* 6. Campo editable para notas adicionales */}
  <textarea
    value={physioNotes}
    onChange={(e) => setPhysioNotes(e.target.value)}
    placeholder="Add any additional notes..."
  />
</div>
```

### 2.4 Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│ 1. Component Mount                                      │
│    └─> usePatientVisitCount(patientId)                  │
│        └─> encountersRepo.getEncountersByPatient()      │
│            └─> Filter: status === 'completed'|'signed' │
│                └─> Return: count                        │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Render Visit Number                                 │
│    visitCount.data + 1 = "#2", "#3", etc.              │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Load Last Encounter                                  │
│    └─> useLastEncounter(patientId)                     │
│        └─> encountersRepo.getLastEncounterByPatient()  │
│            └─> Return: Encounter | null                 │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Display Logic                                        │
│    IF lastEncounter.data EXISTS:                        │
│      ├─> IF interventions.length > 0:                   │
│      │     └─> Show interventions (max 2)              │
│      ├─> ELSE IF soap.plan EXISTS:                      │
│      │     └─> Show plan summary (80 chars)            │
│      └─> Show "Today's plan" from soap.plan (100 chars) │
│    ELSE:                                                │
│      └─> Show "First session - Initial assessment"      │
└─────────────────────────────────────────────────────────┘
```

### 2.5 Estado Local

**Nuevo Estado Agregado:**
```typescript
// src/pages/ProfessionalWorkflowPage.tsx (línea ~1554)
const [physioNotes, setPhysioNotes] = useState<string>('');
```

**Propósito:**
- Permite al fisioterapeuta agregar notas adicionales para la sesión actual
- Estado local (no persistido aún, puede agregarse en futuro)
- Campo de texto editable en el header

### 2.6 Casos de Uso Cubiertos

| Escenario | Comportamiento |
|-----------|----------------|
| **Primera sesión** | Muestra "#1" y "First session - Initial assessment" |
| **Segunda sesión** | Muestra "#2", intervenciones de la primera visita, y plan propuesto |
| **Sesión N** | Muestra "#N", resumen de última visita, y plan propuesto |
| **Sin intervenciones previas** | Muestra resumen del plan del SOAP anterior |
| **Sin SOAP previo** | Muestra mensaje de primera sesión |

---

## 3. 🔄 Integración con Flujo de Follow-up

### 3.1 Visión Futura

El sistema está preparado para un flujo de follow-up distinto (no solo seguir el flujo de "initial assessment"):

**Preparación Actual:**
- ✅ Conteo de visitas basado en encounters completados
- ✅ Acceso al último encounter y su SOAP
- ✅ Campo para notas adicionales del fisio
- ✅ Extracción de intervenciones realizadas

**Próximos Pasos (Futuro):**
- Implementar flujo específico para follow-up que:
  - Compare con sesión anterior
  - Muestre progreso del paciente
  - Sugiera ajustes al plan basado en resultados previos
  - Permita actualizar plan de tratamiento

---

## 4. 📈 Métricas y Validación

### 4.1 Validación de Cambios

**Testing Manual:**
- ✅ Primera sesión muestra "#1" correctamente
- ✅ Segunda sesión muestra "#2" y datos de primera visita
- ✅ Intervenciones se muestran cuando existen
- ✅ Plan del SOAP anterior se muestra como referencia
- ✅ Campo de notas es editable
- ✅ Sin errores de linting

**Dependencias:**
- `encountersRepo` debe tener índices de Firestore configurados
- `usePatientVisitCount` maneja errores de índice en construcción gracefully

### 4.2 Impacto en Performance

**Optimizaciones:**
- Hooks usan `onAuthStateChanged` para evitar llamadas innecesarias
- `usePatientVisitCount` limita a 100 encounters (suficiente para conteo)
- `useLastEncounter` solo obtiene el último encounter (1 documento)
- Renderizado condicional evita procesamiento innecesario

**Carga de Datos:**
- **Primera carga:** 2 queries (count + last encounter)
- **Subsecuentes:** Cache de hooks React (no re-fetch a menos que cambie `patientId`)

---

## 5. 🎨 Consideraciones de UX

### 5.1 Diseño Visual

**Jerarquía de Información:**
1. **Número de visita** (prominente, esquina superior derecha)
2. **Tipo de sesión** (bold, fácil de identificar)
3. **Última visita** (contexto histórico, texto pequeño)
4. **Plan de hoy** (propuesta, color emerald para destacar)
5. **Notas adicionales** (campo editable, siempre visible)

**Estados Visuales:**
- **Loading:** Muestra "..." mientras carga `visitCount`
- **Error:** Hook maneja errores gracefully (no bloquea render)
- **Empty:** Mensaje claro para primera sesión

### 5.2 Accesibilidad

- Labels semánticos para todos los campos
- Placeholder descriptivo en textarea
- Contraste adecuado (text-slate-600 sobre bg-white)
- Focus states visibles (ring-emerald-400)

---

## 6. 🔮 Roadmap Futuro

### 6.1 Persistencia de Notas

**Estado Actual:** `physioNotes` es estado local (se pierde al refrescar)

**Mejora Propuesta:**
```typescript
// Guardar en SessionStorage o Firestore
useEffect(() => {
  SessionStorage.saveSession(patientId, {
    ...existingState,
    physioNotes
  });
}, [physioNotes]);
```

### 6.2 Integración con SOAP Generation

**Oportunidad:** Incluir `physioNotes` en el contexto del prompt de SOAP para que la IA considere las notas del fisio al generar el SOAP.

### 6.3 Flujo de Follow-up Dedicado

**Visión:** Crear un flujo específico para follow-up que:
- Compare resultados de sesión anterior vs. actual
- Muestre progreso del paciente visualmente
- Sugiera ajustes al plan automáticamente
- Permita al fisio confirmar/modificar sugerencias

---

## 7. 📝 Archivos Modificados

### 7.1 Archivos Principales

1. **`src/pages/ProfessionalWorkflowPage.tsx`**
   - Agregado hook `usePatientVisitCount`
   - Agregado estado `physioNotes`
   - Modificada sección "TODAY'S PLAN" (líneas 2583-2653)

2. **`src/components/SOAPEditor.tsx`**
   - Removido import de `TreatmentPlanScheduler`
   - Removido componente `TreatmentPlanScheduler` del render
   - Agregadas acciones simples de "Companion" (Copy, Export PDF, Download)

### 7.2 Hooks Utilizados (Sin Modificar)

- `src/features/patient-dashboard/hooks/usePatientVisitCount.ts` (existente)
- `src/features/patient-dashboard/hooks/useLastEncounter.ts` (existente)
- `src/features/patient-dashboard/hooks/useActiveEpisode.ts` (existente)

---

## 8. ✅ Checklist de Implementación

- [x] Removido `TreatmentPlanScheduler` de `SOAPEditor`
- [x] Agregadas acciones simples de Companion (Copy, Export)
- [x] Implementado conteo de visitas en "TODAY'S PLAN"
- [x] Implementado resumen de última visita
- [x] Implementado plan propuesto para hoy
- [x] Agregado campo editable para notas adicionales
- [x] Validado renderizado condicional (primera sesión vs. follow-up)
- [x] Verificado sin errores de linting
- [x] Documentado cambios técnicos

---

## 9. 🎯 Conclusión

Los cambios implementados están alineados con la **estrategia de simplificación del producto** y el enfoque en **Clinical Companion**:

1. **Scheduling removido:** Simplifica el flujo SOAP y enfoca en el valor core
2. **Today's Plan mejorado:** Proporciona contexto clínico útil sin complejidad innecesaria
3. **Preparado para futuro:** La arquitectura permite evolucionar hacia un flujo de follow-up dedicado cuando sea necesario

**Próximos pasos recomendados:**
- Validar con usuarios en UAT
- Considerar persistencia de `physioNotes`
- Evaluar necesidad de flujo de follow-up dedicado basado en feedback

---

**Fin del Informe**

