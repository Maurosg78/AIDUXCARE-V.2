# Interoperability Architecture — AiduxCare + Sócrates

**Versión:** 1.0
**Fecha:** 2026-05-25
**Autor:** Mauricio Sobarzo, CEO/CTO
**Estado:** Activo. Aplica a cualquier código que toque interoperabilidad, `ClinicalProvenance`, o el ledger de Sócrates.
**ADR de referencia:** ADR-010 en ENGINEERING.md §2.2

---

## Decisión central

**AiduxCare es FHIR-aware. Sócrates es source-agnostic.**

Estas dos posturas no son contradictorias — son el diseño deliberado:

| Capa | Postura | Razón |
|---|---|---|
| AiduxCare (plataforma) | FHIR-aware | Necesita hablar con EMRs, hospitales, laboratorios. Los compradores institucionales requieren FHIR R4. |
| Sócrates (capa de deliberación) | Source-agnostic | Opera sobre un ledger normalizado de hechos clínicos. No le importa si el dato llegó de FHIR, HL7 v2, CSV, o transcripción de sesión. |

El puente entre las dos capas es `ClinicalProvenance` — un objeto de trazabilidad que acompaña cada dato desde su origen hasta el ledger.

---

## Arquitectura de capas

```
Fuentes externas          AiduxCare (FHIR-aware)       Sócrates (source-agnostic)
──────────────────        ──────────────────────        ──────────────────────────
EMR / HIS (FHIR R4)  →   FHIR Adapters               →   ClinicalContextLedger
HL7 v2 (ADT, ORU)    →   HL7 v2 Adapters             →     DocumentedFact
Transcripción sesión →   Audio → SOAP pipeline        →     AiObservation
Formularios manuales →   Manual input                 →     ClinicalDecision
CSV / export manual  →   Import pipeline              →     LongitudinalPattern
```

Cada flecha que cruza hacia el ledger de Sócrates lleva un `ClinicalProvenance`.

---

## ClinicalProvenance — diseño canónico

`ClinicalProvenance` es la extensión de `ClinicalTraceability` (que ya existe en `src/core/socratic/types.ts`) con campos de origen externo.

**Tipos actuales en `ClinicalTraceability` (v1 — ya en repo):**

```typescript
export interface ClinicalTraceability {
  readonly sourceType: ClinicalContextSourceType;   // 'transcript' | 'soap' | 'manual_input' | ...
  readonly sessionId: string;
  readonly encounterId?: string;
  readonly sourceText?: string;
  readonly createdBy: ClinicalContextAuthor;         // 'human' | 'ai' | 'system'
  readonly acceptedByClinician?: boolean;
  readonly modelVersion?: string;
  readonly promptVersion?: string;
}
```

**Extensión `ClinicalProvenance` (para Commit 2 — añadir a `types.ts`):**

```typescript
export interface ClinicalProvenance extends ClinicalTraceability {
  // Origen del dato en el sistema externo
  readonly sourceSystem?: string;          // 'oscar_emr' | 'olis_ontario' | 'epic' | 'manual' | ...
  readonly sourceRecordId?: string;        // ID del recurso en el sistema origen
  readonly sourceResourceType?: string;    // 'Patient' | 'Observation' | 'Encounter' | 'DiagnosticReport'
  readonly sourceTimestamp?: string;       // ISO 8601 — cuándo se generó el dato en origen
  readonly sourceAuthor?: string;          // Profesional que registró el dato en origen
  readonly sourceOrganization?: string;    // Institución de origen

  // Calidad del mapping
  readonly confidenceOfMapping?: ConfidenceOfMapping;

  // Versión del schema Firestore (5º campo obligatorio en todo documento nuevo)
  readonly schemaVersion: number;
}

export type ConfidenceOfMapping =
  | 'native'       // dato nativo de AiduxCare — sin transformación
  | 'exact'        // mapeado 1:1 desde fuente externa (mismo código, misma unidad)
  | 'normalized'   // transformado con pérdida de precisión controlada (ej: unidades convertidas)
  | 'approximate'; // mapeo heurístico — requiere revisión clínica antes de uso en decisiones
```

**Regla de uso de `confidenceOfMapping`:**

| Valor | Cuándo usar | Implicación en UI |
|---|---|---|
| `'native'` | Dato originado en AiduxCare (transcripción, SOAP, entrada manual) | Sin label especial |
| `'exact'` | FHIR Patient.name, Observation.valueQuantity con código LOINC verificado | Sin label especial |
| `'normalized'` | Unidades convertidas (mg/dL → mmol/L), fechas reformateadas | Label: "Normalizado desde [fuente]" |
| `'approximate'` | Mapeo de texto libre, clasificación automática sin validación clínica | Label visible: "Aproximado — revisar" |

Los datos con `confidenceOfMapping: 'approximate'` nunca deben alimentar razonamiento clínico sin `acceptedByClinician: true`.

---

## FHIR en AiduxCare — estado actual y límites

### Recursos implementados (en `src/core/fhir/`)

| Recurso FHIR | Dirección | Estado |
|---|---|---|
| `Patient` | AiduxCare → FHIR (export) | Implementado. Bidireccional en adaptadores. |
| `Encounter` | AiduxCare → FHIR (export) | Implementado. Bidireccional en adaptadores. |
| `Observation` | AiduxCare → FHIR (export) | Implementado. Bidireccional en adaptadores. |
| Cualquier otro | — | No implementado |

Perfiles soportados: `CA_CORE`, `US_CORE`. Sin `ES_CORE` todavía.

### Códigos clínicos — estado honesto

Los códigos SNOMED/LOINC en los adaptadores actuales son **placeholders estructurales** (`code: 'unknown'`). Son código correcto en estructura, no en semántica clínica. Antes de cualquier integración real con un EMR, estos códigos deben ser validados por un clínico con acceso a los terminología sistemas correspondientes.

### Lo que NO está implementado

- SMART-on-FHIR (autenticación delegada desde EMR) — no en scope actual
- Suscripciones FHIR (recepción de datos en tiempo real desde EMR)
- Bulk FHIR export (FHIR R4 Group/$export)
- Ningún EMR está integrado en producción

### Por qué elegimos Patient / Encounter / Observation

- **Patient**: toda información clínica necesita contexto de paciente — sin esto, nada más tiene sentido.
- **Encounter**: el modelo de memoria longitudinal de AiduxCare (sesión por sesión) mapea directamente a Encounter. Sin este mapeo, no hay contexto temporal.
- **Observation**: los hallazgos de evaluación MSK (rangos de movimiento, dolor, tests funcionales) son Observations en FHIR. Es el recurso más rico semánticamente para datos que AiduxCare genera.

El resto (Procedure, Condition, CarePlan, DiagnosticReport) vendrá cuando sea necesario para una integración real — no antes.

---

## Sócrates — por qué source-agnostic

Sócrates consume `ClinicalContextLedger`. El ledger contiene `DocumentedFact`, `AiObservation`, `ClinicalDecision` y `LongitudinalPattern`. Ninguno de estos tipos sabe cómo llegó el dato al sistema — solo saben que tiene trazabilidad (`ClinicalTraceability` → `ClinicalProvenance`).

Esta separación tiene consecuencias prácticas:

1. **Sócrates puede operar con datos de cualquier EMR** sin código específico por integración. El adaptador FHIR normaliza y produce hechos con `ClinicalProvenance`. Sócrates los consume sin conocer el origen.

2. **El ledger es el contrato de API de Sócrates.** Si mañana añadimos HL7 v2, no tocamos Sócrates — solo añadimos un adaptador que produce `DocumentedFact` con `sourceSystem: 'hl7_v2'`.

3. **La trazabilidad regulatoria es portable.** Un auditor puede ver en cualquier hecho del ledger exactamente de dónde vino, con qué confianza fue mapeado, y si fue aceptado por el fisioterapeuta. Esto es independiente del sistema de origen.

---

## Reglas de implementación (obligatorias en Commit 2)

### R-1: Todo documento Firestore nuevo lleva `schemaVersion`

```typescript
// BIEN
const fact: DocumentedFact = {
  id: generateId(),
  text: '...',
  traceability: {
    ...
    schemaVersion: 1,    // ← obligatorio
  }
};

// MAL — no hay schemaVersion
const fact = { id: '...', text: '...' };
```

`schemaVersion` empieza en `1` en el Commit 2. Cada cambio de schema que rompe compatibilidad hacia atrás incrementa el número.

### R-2: Datos `'approximate'` nunca a Sócrates sin validación

Si `confidenceOfMapping === 'approximate'` y `acceptedByClinician !== true`, el dato no puede entrar como `DocumentedFact` en el ledger. Puede entrar como `AiObservation` con el label explícito de no confirmado.

### R-3: Códigos clínicos FHIR no inventados

Ningún código SNOMED o LOINC se usa en producción sin validación clínica. Los adaptadores mantienen `code: 'unknown'` hasta que un clínico valide el mapeo. Un código clínico incorrecto es peor que un código ausente.

### R-4: `ClinicalProvenance` no reemplaza `ClinicalTraceability`

Son extensión, no sustitución. El código existente que usa `ClinicalTraceability` no se toca hasta que ese archivo/colección específico necesite provenance de origen externo. No hay refactor masivo.

---

## Qué entra en el Commit 2

| Qué | Archivo | Notas |
|---|---|---|
| `ClinicalProvenance` interface | `src/core/socratic/types.ts` | Extiende `ClinicalTraceability`. Sin romper compatibilidad. |
| `ConfidenceOfMapping` type | `src/core/socratic/types.ts` | Nuevo tipo. |
| `schemaVersion: number` | `src/core/socratic/types.ts` | Campo en `ClinicalProvenance`. |
| `clinicalContextLedger.ts` | `src/core/socratic/` | Builder del ledger — Modo 0, sin Firestore, sin LLM, sin UI. |
| Tests unitarios del ledger | `src/core/socratic/__tests__/` | Cobertura del builder y de los invariantes de trazabilidad. |

**Lo que NO entra en el Commit 2:**
- Integración real con ningún EMR
- SMART-on-FHIR
- Cambios en colecciones Firestore existentes
- Código de Modo 1.5 (gate regulatorio bloqueado)

---

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-05-25 | Versión inicial. Decisión AiduxCare FHIR-aware / Sócrates source-agnostic. ClinicalProvenance canónico. Commit 2 scope definido. |

---

*Documento interno de arquitectura. No contiene datos de pacientes.*
*Fuentes: FHIR R4 (HL7), CA Core, US Core, ADR-002, ADR-008, ENGINEERING.md §2.2, sesión estratégica CEO/CTO 2026-05-25*
