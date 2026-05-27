# Informe CTO — Estrategia de Interoperabilidad FHIR
## AiduxCare + Sócrates: posicionamiento en el ecosistema de salud digital

**Fecha:** 2026-05-27
**Contexto:** Módulo 1 de 3 del curso de salud digital. Las conclusiones de este módulo son técnicamente relevantes y definen la dirección estratégica de integración con EMRs.
**Estado:** Borrador para revisión. No compromete implementación inmediata.

---

## Resumen ejecutivo

Durante el estudio del módulo 1, emergieron conclusiones estratégicas que van más allá del contenido del curso. Este informe las captura antes de que se diluyan en los módulos siguientes.

La conclusión central: **AiduxCare no debe competir por ser otro EMR de fisioterapia. Debe certificarse como proveedor de salud digital que consume datos de EMRs institucionales, genera inteligencia clínica estructurada del episodio fisioterapéutico, y la devuelve al ecosistema de salud en FHIR R4.** Ese modelo de negocio no existe en el mercado hoy. La arquitectura que estamos construyendo es la base correcta para llegarlo.

---

## 1. El gap de mercado verificado

### Investigación competitiva realizada (mayo 2026)

Se revisó documentación pública de las principales plataformas de fisioterapia del mercado:

| Plataforma | FHIR R4 | Datos estructurados de vuelta al EMR hospitalario |
|---|---|---|
| Jane App (CA) | No | No. Solo billing y calendario. |
| Noterro (CA) | No | No. Solo billing y calendario. |
| Cliniko (AU) | No | No. 91 apps, cero FHIR/HL7. |
| Power Diary / Zanda (AU) | No | No. Solo administración. |
| Healthie (US) | Sí (enterprise) | No documentado. FHIR contra su propio servidor, no hacia Epic/Cerner. |
| WebPT (US) | HL7 v2 | Documentos (equivalente PDF). No recursos FHIR estructurados. |
| EMRFlow / SPRY (US) | Anunciado | Señales competitivas. Sin evidencia de devolver episodio longitudinal estructurado. |

**Brecha confirmada:** ninguna plataforma de fisioterapia devuelve al EMR hospitalario un episodio completo como recursos FHIR R4 estructurados — `EpisodeOfCare`, `Goal`, `Observation`, `CarePlan`. WebPT llega más lejos con HL7 v2, pero es intercambio de documentos, no de datos.

### Por qué FHIR R4 solo no es suficiente como diferenciador

WebPT ya tiene HL7 v2 bidireccional con Epic y Cerner. Healthie ya tiene certificación ONC. La ventaja no es técnica — es clínica. Lo que AiduxCare genera que ningún sistema tiene:

| Dato clínico | Recurso FHIR | Por qué no existe en ningún EMR |
|---|---|---|
| Adherencia longitudinal al HEP sesión a sesión | `Observation` | El HEP vive en el PMS de fisio. El cumplimiento nunca llega al EMR. |
| Evolución funcional trazada a decisiones del fisio | `Goal` + `Observation` | Los scores (NPRS, PSFS, DASH) se miden en el PMS. El médico nunca los ve estructurados. |
| Señales psicosociales validadas por el fisioterapeuta | `Observation` | Identificadas por Sócrates, aceptadas por el fisio. No existe en ningún sistema. |
| Razonamiento clínico del episodio | `QuestionnaireResponse` | La deliberación del fisioterapeuta nunca queda como dato interoperable. |

**El fisioterapeuta atiende al paciente 45 minutos por sesión durante 12 semanas. El EMR ve una línea: "Physiotherapy session — 45 min." AiduxCare genera lo que ocurrió en esas sesiones como datos estructurados que el EMR puede ingerir.**

---

## 2. El modelo de negocio: certificación como proveedor de salud digital

### La visión

Ir a hospitales públicos y privados con una propuesta de dos caras:

**AiduxCare consume del hospital:**
- Datos del paciente al inicio del episodio (`Patient`, `Condition`, `Medication`, `DiagnosticReport`)
- La derivación estructurada (`ServiceRequest`)
- Historial de encuentros relevantes (`Encounter`)

**AiduxCare devuelve al hospital:**
- El episodio fisioterapéutico completo como recursos FHIR R4 estructurados
- `EpisodeOfCare` — todo el episodio sesión a sesión
- `Goal` — objetivos funcionales con estado al alta
- `Observation` — outcome measures medidos en cada sesión
- `CarePlan` — plan ejecutado con adherencia documentada
- `QuestionnaireResponse` — razonamiento socrático del episodio

**El argumento para el hospital:**
> "Sus fisioterapeutas generan información clínica que nunca llega a su EMR en forma estructurada. Nosotros cerramos ese gap. A cambio, necesitamos acceso al contexto del paciente para que Sócrates pueda razonar desde la primera sesión con información completa."

Esto no es un costo para el hospital. Es un intercambio de valor simétrico.

### La expansión a profesiones aliadas de la salud

La misma lógica aplica a terapia ocupacional, fonoaudiología, nutrición, psicología clínica, podología. Cada una tiene un gap idéntico: el EMR no captura lo que ocurre en sus sesiones. AiduxCare puede ser la capa que cierra ese gap para todo el espectro de profesiones de salud aliadas.

**Esto no es soñar — es un modelo de negocio que existe en otros países:**
- OceanMD en Canadá hace exactamente esto para eReferrals entre médicos y especialistas.
- Health Gorilla en EE.UU. es un agregador de datos de salud que intercambia con EMRs vía FHIR.
- La diferencia es que ninguno lo hace para fisioterapia con razonamiento clínico longitudinal.

---

## 3. El mecanismo técnico: cómo acceder a datos de EMRs sin necesitar su permiso

### SMART on FHIR con autorización del paciente

Este es el punto técnico más importante del módulo. AiduxCare **no necesita que Epic le deje entrar**. Necesita que **el paciente autorice a AiduxCare a leer sus datos de Epic**. Eso es un derecho del paciente, no una decisión del vendor del EMR.

```
Paciente llega a primera sesión con AiduxCare
        ↓
"Autoriza a AiduxCare a leer tus datos del hospital X"
(botón en el onboarding — 30 segundos)
        ↓
Paciente hace login en el portal del hospital (Epic MyChart, etc.)
y aprueba el acceso — OAuth 2.0 estándar
        ↓
Epic entrega a AiduxCare un token con scopes:
  patient/Patient.read
  patient/Condition.read
  patient/Medication.read
  patient/DiagnosticReport.read
  patient/Observation.read
        ↓
AiduxCare consulta el FHIR R4 endpoint del hospital
        ↓
Sócrates recibe contexto clínico completo antes de la primera pregunta
```

**Epic no puede negarse a esto.** En EE.UU., la regla ONC del 21st Century Cures Act obliga a todos los EMR certificados a exponer FHIR R4 con patient access APIs. En Ontario, Canada Health Infoway está construyendo lo mismo. En España, Dedalus implementa FHIR R4.

### Los cuatro mecanismos de acceso — por orden de viabilidad inmediata

| Mecanismo | Quién autoriza | Necesita acuerdo previo con hospital | Disponible hoy |
|---|---|---|---|
| SMART on FHIR — patient launch | El paciente | No | Epic, Cerner, Oracle: sí (ONC). Ontario: en construcción. España: parcial. |
| HL7 v2 ADT eReferral | El médico que deriva | Parcial | Muy común en hospitales canadienses vía OceanMD |
| SMART on FHIR — EHR launch | El fisioterapeuta desde el EMR | Sí — hospital aprueba AiduxCare como app | Con hospital como partner activo |
| Paciente descarga y sube registros | El paciente | No | Siempre disponible, sin FHIR |

**El camino más inmediato sin partnership:** SMART on FHIR patient-authorized en el onboarding de la primera sesión. Cero negociación con el hospital. El paciente tiene el derecho legal.

---

## 4. Soberanía de datos: qué exponemos y qué protegemos

### Las tres zonas

La frontera más importante de AiduxCare no es la UI ni la API — es la línea entre lo que comparte y lo que protege.

**ZONA 1 — Superficie publicada (FHIR API de AiduxCare)**
Accesible a cualquier partner autorizado, bajo consentimiento del paciente:
- `EpisodeOfCare`, `Goal`, `Observation`, `CarePlan`, `QuestionnaireResponse`, `DocumentReference`
- Son los hechos clínicos validados por el fisioterapeuta

**ZONA 2 — Write-back (SMART on FHIR, Versión 3)**
Lo que AiduxCare escribe en el EMR del hospital:
- Solo recursos de Zona 1, bajo token SMART del paciente
- El hospital recibe datos estructurados, no acceso a AiduxCare

**ZONA 3 — Interior protegido (nunca se expone)**
- Cadenas de razonamiento de Sócrates
- Ledger interno (`DocumentedFact`, `AiObservation`, `LongitudinalPattern`)
- Transcripciones de audio crudas
- Lógica de detección de señales psicosociales
- Patrones longitudinales inter-paciente (datos de población)
- Versiones de prompts y modelos

### La regla de decisión para cualquier solicitud de integración

> **¿El partner recibe hechos clínicos del paciente, o recibe el proceso que los generó?**
> — Hechos clínicos validados: sí, en FHIR, con consentimiento.
> — Proceso de razonamiento: nunca, sin importar el argumento.

### El argumento de compliance como vector de extracción

Los hospitales usarán PHIPA/GDPR/HIPAA como justificación para pedir acceso profundo a AiduxCare. La respuesta arquitectónica:

- **Legítimo bajo compliance:** audit logs, registros de consentimiento, datos del paciente en Zona 1. Ya están en la superficie publicada.
- **No legítimo bajo ningún argumento:** transcripciones de audio, razonamiento interno de Sócrates, patrones de población entre pacientes.

**Distinción legal crítica:** AiduxCare es controlador de datos del episodio fisioterapéutico, no un procesador del EMR del hospital. Esto debe estar en los términos de servicio antes de cualquier integración, no durante la negociación.

### La pregunta de Epic Cosmos y datasets de población

Si un hospital pide que Cosmos acceda a datos de AiduxCare para quality reporting:

- **Sí a:** outcome measures de-identificados en agregado (mejora media de NPRS por diagnóstico, adherencia media al HEP). Bajo acuerdo explícito, con contraprestación, de-identificado.
- **No a:** acceso individual a pacientes, cadenas de razonamiento de Sócrates, transcripciones, cualquier dato que permita a Epic reconstruir el proceso de AiduxCare.

La diferencia entre compartir outcomes agregados con Cosmos y permitir acceso profundo es la diferencia entre una alianza de investigación y una adquisición encubierta de IP.

---

## 5. Sócrates: generador de datos nuevos, no organizador de datos del EMR

### La distinción que define el posicionamiento

Los grandes EMRs (Epic, Oracle, Dedalus) están construyendo sus propias capas de IA para organizar y surfacear datos que ya tienen. Si Sócrates se posiciona como "el agente que organiza información del EMR para el fisio", compite con Epic AI — y pierde.

**Sócrates no organiza datos del EMR. Genera datos clínicos que el EMR nunca tuvo.**

```
EMR grande (Epic/Dedalus)
  └── AI propio → organiza y surfacea datos que YA ESTÁN en el EMR
  └── Gap: la consulta de fisio es una caja negra de 45 min
            → aparece como una línea en el historial

AiduxCare + Sócrates
  └── Captura lo que pasa DENTRO de esa caja negra
  └── Genera EpisodeOfCare + Goal + Observation + CarePlan
  └── Devuelve al EMR datos que el EMR nunca generó internamente
```

### La analogía correcta

Un laboratorio de análisis clínicos envía resultados a Epic. Epic no tiene acceso al proceso interno del laboratorio, a sus modelos de análisis, ni a sus algoritmos de detección. Recibe los resultados en HL7. **AiduxCare es ese laboratorio para el episodio fisioterapéutico.** El hospital recibe el output. El proceso queda en AiduxCare.

---

## 6. El roadmap de integración en tres versiones

Cada versión es independiente y entrega valor real sin depender de la siguiente.

### Versión 1 — Piloto → 2027: Document-first

- `DocumentReference` FHIR con el episodio estructurado como JSON + PDF legible
- Sin SMART on FHIR. El hospital importa manualmente o vía batch.
- Costo de implementación: bajo
- Demostración de la dirección sin requerir partnership técnico

### Versión 2 — 2027 → 2028: Recursos FHIR R4 nativos

- `Goal`, `Observation`, `CarePlan`, `QuestionnaireResponse` con códigos SNOMED/LOINC validados
- API FHIR propia de AiduxCare — cualquier sistema con cliente FHIR R4 puede consumir
- Sin SMART on FHIR todavía
- Condición de entrada: evidence library de Sócrates con ≥10 patologías y códigos clínicos validados por fisioterapeuta

### Versión 3 — Enterprise, cliente concreto: SMART on FHIR + integración directa

- SMART on FHIR para autenticación delegada desde el EMR
- Escritura directa al historial longitudinal del paciente
- Integración específica con Dedalus Spain, Ontario Health, o el HIS del cliente
- **Financiada por el contrato de partnership, no por runway propio**
- Condición de entrada: un cliente concreto que pague el costo de la certificación de la integración

---

## 7. El camino de certificación — qué es real, qué es visión

### Lo que es técnicamente factible hoy

- Arquitectura FHIR R4 correcta para exponer episodios fisioterapéuticos: **existe en el repo**
- `ClinicalProvenance` para trazabilidad de origen de datos: **diseñado, Commit 2**
- Sócrates source-agnostic — puede consumir datos de cualquier origen: **diseñado**
- SMART on FHIR patient-authorized para leer de EMRs sin acuerdo con el hospital: **no implementado, pero el camino técnico es claro**

### Lo que requiere tiempo y recursos no triviales

| Paso | Qué requiere | Tiempo estimado |
|---|---|---|
| Certificación como software médico (SaMD) en España | Evaluación de conformidad CE, clasificación como IIa o IIb | 12-18 meses |
| Equivalente en Canadá (Health Canada) | Similar proceso regulatorio | 12-24 meses |
| Epic App Orchard (EE.UU.) | Revisión técnica + acuerdo comercial con Epic | 6-12 meses |
| Partnership con Dedalus Spain | Negociación + certificación de integración | 12-24 meses |
| Contratos de intercambio de datos con hospitales públicos | Aprobación de comités de ética + compras institucionales | 18-36 meses |

### Lo que esto significa para la hoja de ruta

- **2026:** piloto España/Ontario. Sin FHIR hacia hospitales todavía. Versión 1 (DocumentReference) como prueba de concepto.
- **2027:** primer hospital partner que recibe datos estructurados de AiduxCare vía FHIR R4. Inicio del proceso de certificación SaMD.
- **2028:** SMART on FHIR bidireccional con primer cliente enterprise. Evidencia de outcomes acumulada para negotiation con Dedalus o equivalente.
- **2029-2030:** ecosistema de profesiones aliadas de la salud. Modelo de intercambio de datos de población con hospitales.

---

## 8. Lo que no es un sueño

La visión de ir a hospitales públicos y privados, certificarse como proveedor de salud digital, consumir datos del EMR y devolver datos estructurados del episodio fisioterapéutico — **eso es el modelo de negocio correcto**. No existe hoy en el mercado de fisioterapia. La arquitectura que estamos construyendo es la base técnica adecuada.

Lo que requiere honestidad es el tiempo. Esto es territorio 2027-2030, no 2026. El piloto España/Ontario es el paso que construye la evidencia clínica que justifica la inversión en certificación y partnership institucional.

**El riesgo no es que la visión sea incorrecta. El riesgo es intentar llegar ahí antes de tener la evidencia clínica que la justifica.**

El piloto no es el destino — es la prueba de que la dirección es correcta.

---

## 9. Decisiones pendientes para los módulos 2 y 3

El módulo 1 abre estas preguntas que los módulos siguientes deberán responder:

- [ ] ¿Qué regulación específica aplica para SaMD en España bajo MDR 2017/745?
- [ ] ¿Cómo funciona el proceso de certificación de apps en el ecosistema de Dedalus Spain?
- [ ] ¿Qué endpoints FHIR R4 expone Ontario Health hoy y cuál es el proceso de acceso?
- [ ] ¿Hay programas de partnership para startups de salud digital con hospitales públicos en España (SNS)?
- [ ] ¿Qué clasificación regulatoria tiene Sócrates como componente de IA clínica bajo EU AI Act?

---

*Documento interno. No contiene datos de pacientes.*
*Basado en sesión estratégica CEO/CTO + módulo 1 de curso de salud digital, 2026-05-27.*
*Referencia técnica: `docs/governance/INTEROPERABILITY_ARCHITECTURE.md` v1.2*
