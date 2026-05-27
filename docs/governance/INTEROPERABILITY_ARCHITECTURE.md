# Interoperability Architecture — AiduxCare + Sócrates

**Versión:** 1.2
**Fecha:** 2026-05-27
**Autor:** Mauricio Sobarzo, CEO/CTO
**Estado:** Activo. Aplica a cualquier código que toque interoperabilidad, `ClinicalProvenance`, o el ledger de Sócrates.
**ADR de referencia:** ADR-010 en ENGINEERING.md §2.2

---

## Propuesta de valor de interoperabilidad

> *Esta sección es la que abre la conversación con Dedalus, con Ontario Health, o con cualquier HIS. El diagrama de `ClinicalProvenance` viene después.*

### Posicionamiento: capa clínica inteligente, no otro EMR de fisio

AiduxCare no compite por ser otro PMS de fisioterapia con FHIR añadido. Es una **capa clínica inteligente** que:

1. **Consume** contexto histórico del EMR para enriquecer cada sesión
2. **Genera** razonamiento longitudinal del episodio fisioterapéutico con trazabilidad explícita a cada decisión clínica
3. **Devuelve** al EMR lo que rara vez aparece en los PMS de fisio: `EpisodeOfCare` + `Goal` + `Observation` + `CarePlan` como recursos FHIR R4 estructurados — no solo como PDF adjunto

### Por qué FHIR R4 solo no es la ventaja

WebPT ya muestra interoperabilidad HL7 v2 documental. Healthie publica señales de FHIR R4/certificación ONC. EMRFlow y SPRY ya usan el lenguaje de FHIR, SMART on FHIR e integración con EHRs. Si la propuesta de valor de AiduxCare fuera "también hacemos FHIR R4", eso no es una ventaja — es un requisito de entrada al mercado enterprise.

La ventaja no es técnica. Es clínica.

### Lo que suele no llegar al EMR y AiduxCare sí genera

En la documentación pública revisada, los PMS/EMR de fisioterapia tienden a resolver agenda, billing, documentación, e integración documental. No aparece como patrón dominante la devolución al EMR hospitalario de un episodio fisioterapéutico como recursos FHIR clínicos estructurados.

Ese es el espacio clínico que AiduxCare puede ocupar:

| Dato clínico | Recurso FHIR | Por qué el EMR no lo tiene |
|---|---|---|
| Adherencia longitudinal al HEP sesión a sesión | `Observation` (adherencia) | El HEP se prescribe en el PMS de fisio. Cumplimiento nunca llega al EMR. |
| Evolución funcional con trazabilidad a decisiones del fisio | `Goal` + `Observation` (outcomes) | Los scores funcionales (NPRS, PSFS, DASH) se miden en el PMS. El médico nunca los ve estructurados. |
| Señales psicosociales del episodio aceptadas por el fisioterapeuta | `Observation` (flags clínicos) | Identificadas por Sócrates, validadas por el fisio. Rara vez quedan codificadas como dato interoperable. |
| Razonamiento socrático — qué se preguntó, qué se consideró, qué se descartó | `QuestionnaireResponse` | La deliberación clínica del fisioterapeuta rara vez queda disponible como dato estructurado interoperable. |

Eso no es solo un `DocumentReference` con un PDF. Es un `EpisodeOfCare` con `Goal` de rehabilitación medidos, `Observation` de outcome measures verificados, y `CarePlan` ejecutado con adherencia documentada. Máquina-legible. Diseñado para que Epic, Dedalus u otro HIS puedan ingerirlo sin relectura humana del episodio.

### Paisaje competitivo — señales públicas revisadas (mayo 2026)

Lectura de documentación pública y páginas comerciales disponibles. Esto no reemplaza due diligence técnica con acceso a APIs, contratos o sandboxes:

| Plataforma | FHIR R4 | Bidireccional | Datos estructurados de vuelta al EMR hospitalario |
|---|---|---|---|
| Jane App (CA) | No observado públicamente | No observado públicamente | Integraciones públicas centradas en billing, calendario, fax, HEP y herramientas de práctica. |
| Noterro (CA) | No observado públicamente | No observado públicamente | Integraciones públicas centradas en billing, pagos, calendario, intake y operaciones de clínica. |
| Cliniko (AU) | No observado públicamente | No observado públicamente | Ecosistema amplio de apps; no se observa FHIR/HL7 clínico en documentación pública revisada. |
| Power Diary / Zanda (AU) | No observado públicamente | No observado públicamente | Integraciones públicas orientadas a billing, calendario, pagos y administración. |
| Healthie (US) | Sí, en producto enterprise/certificación ONC | Parcial | FHIR existe como infraestructura; no se observa públicamente una propuesta rehab-specific de devolución longitudinal a Epic/Cerner. |
| WebPT (US) | HL7 v2 | Sí, documental | Intercambio HL7 de documentos/notas; no se observa devolución del episodio como `Goal`/`Observation`/`CarePlan` FHIR nativos. |
| EMRFlow (US) | Sí, FHIR R4 / SMART on FHIR anunciado | Sí, anunciado | Señal competitiva relevante. Exporta bundles/encounters; no queda claro si devuelve razonamiento longitudinal rehab-specific al EMR. |
| SPRY (US) | FHIR/HL7 anunciado | Sí, integración con partners | Señal competitiva relevante. Foco público fuerte en referral-to-payment, RCM y workflows de rehab. |

**Brecha aparente que AiduxCare debe validar:**

```
HL7 v2 document exchange   ←  WebPT y otros resuelven notas/documentos
                           ↕  ← espacio a validar comercial y técnicamente
FHIR R4 structured         ←  EpisodeOfCare + Goal + Observation + CarePlan
resource exchange               como recursos machine-readable en Epic/Dedalus
```

### Los dos flujos de datos — asimétricos en valor

**AiduxCare consume del EMR:**

- `Patient` — identidad, demografía, contactos de emergencia
- `Encounter` históricos — episodios previos en otros servicios del hospital
- `Condition` activos — diagnósticos que condicionan el tratamiento
- `Medication` — medicamentos que afectan respuesta al ejercicio o percepción del dolor
- `DiagnosticReport` / `Observation` — resultados de laboratorio e imagen con texto clínico

Con esto, Sócrates llega a la primera sesión con contexto que antes tomaba 15 minutos reconstituir manualmente. El fisioterapeuta no pregunta lo que ya está documentado.

**AiduxCare devuelve al EMR:**

- `EpisodeOfCare` — el episodio fisioterapéutico completo, estructurado sesión a sesión
- `Goal` — objetivos funcionales de rehabilitación con estado al alta (achieved / in-progress / cancelled)
- `Observation` — outcome measures (NPRS, PSFS, DASH, ROM) medidos en cada sesión
- `CarePlan` — plan ejecutado con actividades, frecuencia, y adherencia documentada
- `QuestionnaireResponse` — razonamiento socrático del episodio: hipótesis planteadas, hallazgos considerados, banderas evaluadas

Esta información hoy suele **desaparecer en la consulta del fisioterapeuta y no llega al EMR del médico en forma estructurada**. AiduxCare puede cerrar ese gap si convierte el razonamiento clínico validado por el fisioterapeuta en recursos interoperables.

### La conversación con un HIS

**Para Dedalus España, Ontario Health FHIR endpoints, o cualquier hospital con fisioterapia:**

> "Sus clientes hospitales tienen fisioterapeutas cuyo trabajo clínico nunca llega al EMR en forma estructurada. El médico que derivó al paciente nunca sabe qué pasó en esas 12 semanas de rehabilitación — recibe, con suerte, un PDF de alta. Nosotros generamos ese episodio como recursos FHIR R4 y se lo devolvemos al sistema que ya tienen. El EMR se vuelve más completo. Eso es una integración que el hospital quiere pagar, no solo tolerar."

### Roadmap de integración en tres versiones

La arquitectura soporta tres niveles de integración. Cada versión entrega valor real sin depender de la siguiente.

**Versión 1 — Piloto → 2027: Document-first, FHIR-shaped**

- `DocumentReference` FHIR con el episodio estructurado como JSON + PDF legible por humanos
- Sin SMART on FHIR. Sin escritura directa al EMR. El hospital importa manualmente o vía batch.
- Costo de implementación: bajo. Demuestra la dirección sin requerir partnership técnico con el HIS.
- Valor inmediato: el médico recibe más que un PDF — recibe datos que puede procesar.

**Versión 2 — 2027 → 2028: Recursos FHIR R4 nativos**

- `Goal`, `Observation`, `CarePlan`, `QuestionnaireResponse` mapeados con códigos SNOMED/LOINC reales por diagnóstico
- Requiere que la evidence library de Sócrates tenga 10 o más patologías con códigos clínicos validados por fisioterapeuta
- Sin SMART on FHIR todavía — los recursos se exponen vía API FHIR propia de AiduxCare
- Valor: cualquier sistema con cliente FHIR R4 puede consumir el episodio sin intervención humana

**Versión 3 — Enterprise, cliente concreto: SMART on FHIR + integración directa**

- Integración específica con Dedalus Spain, Ontario Health FHIR endpoints, o el HIS del cliente
- SMART on FHIR para autenticación delegada desde el EMR
- Escritura directa al historial longitudinal del paciente en el sistema del hospital
- Financiada por el contrato de partnership, no por runway propio
- Condición de entrada: un cliente concreto que pague el costo de integración

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
| 1.1 | 2026-05-27 | Añadida propuesta de valor de interoperabilidad. Flujos asimétricos consume/ofrece. Argumento de venta para HIS/EMR europeos. |
| 1.2 | 2026-05-27 | Propuesta de valor expandida con señales competitivas públicas (Jane, Noterro, Cliniko, WebPT, Healthie, EMRFlow, SPRY). Posicionamiento como capa clínica inteligente vs. EMR de fisio. Outputs clínicos diferenciales. Roadmap de tres versiones de integración. |

---

*Documento interno de arquitectura. No contiene datos de pacientes.*
*Fuentes: FHIR R4 (HL7), CA Core, US Core, ADR-002, ADR-008, ENGINEERING.md §2.2, sesión estratégica CEO/CTO 2026-05-25, revisión pública de Jane App / Noterro / Cliniko / WebPT / Healthie / EMRFlow / SPRY (2026-05-27)*
