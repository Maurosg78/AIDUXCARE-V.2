# ENGINEERING.md — AiduxCare V2
## Estándares de Ingeniería, Gobernanza de Código y Deuda Técnica

**Versión:** 1.4
**Fecha:** 2026-05-13
**Autor:** Mauricio Sobarzo (CEO/CTO, Fisioterapeuta)
**Repositorio:** `aiduxcare-stable` · Branch: `stable`

**Propietario del SoT:** CTO

**Gobernanza del SoT:** `ENGINEERING.md` es la fuente editable oficial. Los PDFs son artefactos de referencia histórica, no fuente normativa. Todo cambio a este documento requiere commit semántico, revisión CTO y entrada en `docs/governance/CHANGELOG_ENGINEERING.md`.

---

> Este documento es la única fuente de verdad sobre cómo se construye, gobierna y mantiene el software de AiduxCare. Está diseñado para ser legible por desarrolladores humanos, auditores externos, inversores técnicos, y agentes de IA. Evoluciona con el producto.

---

## 1. Filosofía de Ingeniería

AiduxCare es un producto clínico de alta responsabilidad. Cada decisión de código tiene implicaciones para la seguridad del paciente, el cumplimiento regulatorio y la trazabilidad clínica. Esta filosofía guía todas las decisiones técnicas:

**1.1 El código es evidencia clínica**
El sistema genera, almacena y transmite notas clínicas que forman parte del historial médico del paciente. Un bug no es solo un fallo de software: puede ser una discrepancia en un registro médico. Esto eleva el estándar de calidad por encima del software de consumo genérico.

**1.2 La autonomía clínica es no negociable**
El sistema propone. El fisioterapeuta decide siempre. Ninguna función del sistema puede tomar decisiones clínicas en nombre del profesional, bloquear su juicio, ni generar documentación sin su revisión explícita. Esto no es solo un requisito de producto — es un principio ético y legal.

**1.3 Mantenibilidad sobre velocidad**
El código generado con asistencia de IA tiende a ser funcional pero arquitectónicamente débil si no se gobierna correctamente. La investigación de GitClear (2024-2025) analizando 211 millones de líneas de código documentó un aumento de 8x en bloques de código duplicado tras la adopción masiva de herramientas de IA, y una disminución de líneas "movidas" (reutilización) frente a líneas "copiadas". Este documento existe precisamente para contrarrestar esa tendencia.

**1.4 Deuda técnica documentada es deuda manejable**
La deuda técnica no documentada es deuda oculta. Este documento registra toda la deuda conocida con criterio de cierre y responsable. Un inversor o CTO externo que haga due diligence encontrará aquí la verdad — no en el código.

**1.5 Norte de producto: agentes clínicos auditables**
AiduxCare no compite por tener "el mejor modelo" aislado. Compite por construir el sistema clínico más fiable alrededor de modelos probabilísticos. Los modelos son componentes intercambiables; la ventaja del producto vive en la arquitectura de memoria clínica, prompts versionados, validadores, trazabilidad, revisión humana y experiencia operativa.

Un agente de IA en AiduxCare no es autónomo porque "sabe más"; es delegable solo cuando es auditable. Debe ejecutar tareas repetitivas, documentar qué datos usó, dejar evidencia de su propuesta, pedir confirmación cuando corresponda y permitir que el fisioterapeuta acepte, edite o descarte el resultado. En salud, la inteligencia sin trazabilidad no es una ventaja técnica: es un riesgo clínico.

Principio operativo:

```
AiduxCare is not an AI note generator.
It is a clinical operating system where AI agents assist, document,
verify, and escalate under human clinical authority.
```

Traducción de ingeniería:
- Modelo intercambiable, sistema estable.
- Prompt versionado, output verificable.
- Memoria clínica estructurada, no contexto opaco.
- Acción delegable solo si deja trazabilidad.
- El fisioterapeuta mantiene autoridad clínica explícita.

**1.6 AiduxCare amplifica criterio clínico — Principio Sócrates**
La historia de la IA médica desde 1970 documenta un patrón consistente: los sistemas que intentan reemplazar el juicio clínico tienden a fracasar en adopción clínica real. Los sistemas que amplifican al profesional, preservando su autoridad y responsabilidad, muestran mayor viabilidad. AiduxCare opera con este principio como restricción de diseño, no como aspiración.

Dos modos con propósitos distintos:

**Modo 1 — Reducción de carga documental**
Transcripción, generación de SOAP, organización de información clínica y persistencia de decisiones reducen fricción administrativa. Este modo no interviene en el juicio clínico ni convierte outputs generados por IA en decisiones clínicas sin revisión humana.

**Modo 2 — Sócrates, a demanda explícita del fisioterapeuta**
Se activa solo cuando el fisioterapeuta lo decide. Nunca es automático ni intrusivo. Sus capacidades son:
- Detectar patrones longitudinales del paciente y de la interacción clínica documentada.
- Contrastar decisiones clínicas contra evidencia curada, versionada y trazable.
- Formular preguntas que ayuden a custodiar la continuidad del paciente.

Regla canónica:

```
Sócrates no emite decisiones clínicas. Sócrates genera preguntas,
señales, tensiones clínicas y puntos de reflexión basados en datos
trazables, para revisión del fisioterapeuta.
```

Arquitectura obligatoria:
- `ClinicalContextLedger`: separa hechos documentados, observaciones IA, decisiones humanas, patrones longitudinales y preguntas no resueltas.
- `SocraticThresholdEvaluator`: decide con reglas explícitas si una señal merece convertirse en candidata a pregunta.
- `SocraticCandidateGenerator`: redacta preguntas prudentes desde contexto estructurado y trazable.
- `SocraticInteractionLog`: registra si el fisioterapeuta acepta, ignora, pospone o edita la pregunta.
- `ClinicalMemoryUpdater`: actualiza memoria longitudinal solo con fuente, contexto y trazabilidad suficientes.

La LLM socrática es la última capa del flujo, no la primera. No debe recibir audio o texto libre como única fuente de razonamiento. Antes debe existir contexto estructurado y clasificado por procedencia:

```
hecho documentado != inferencia IA != decisión del fisioterapeuta
```

Reglas de uso de información:
- Un hecho documentado puede alimentar memoria si conserva fuente, sesión y texto base.
- Una observación IA solo puede alimentar Sócrates como hipótesis o señal, nunca como verdad clínica.
- Una decisión clínica canónica exige acción humana explícita del fisioterapeuta.
- Evidencia no aprobada por CTO clínico no puede usarse como base fuerte de contraste.
- Una pregunta socrática no se muestra si no puede responder "¿por qué me estás preguntando esto?" con trazabilidad.

El lenguaje de Sócrates es asistencial, trazable y orientado al futuro.

Correcto:

> "Noto que has documentado confusión y olvido de instrucciones básicas. ¿Quieres que recuerde ahondar en esta condición en la siguiente sesión?"

Incorrecto:

> "Este paciente presenta signos de deterioro cognitivo. Considera derivación a neurología."

La diferencia no es solo de tono; es de arquitectura. La primera formulación muestra lo que el sistema observó en datos documentados, no asume causas, no interroga decisiones pasadas y ofrece una acción concreta hacia adelante. La segunda reemplaza criterio clínico con una conclusión que el sistema no está autorizado a tomar.

Restricciones de diseño no negociables para el Modo 2:
- Sócrates nunca usa lenguaje imperativo clínico como "debe", "tiene que" o "es necesario".
- Toda observación debe ser trazable a datos documentados en AiduxCare.
- Toda pregunta mira hacia adelante; nunca juzga decisiones ya tomadas.
- El fisioterapeuta puede ignorar, posponer o rechazar cualquier pregunta.
- Sócrates nunca pregunta dos veces sobre lo mismo en la misma sesión.
- **Sócrates no puede razonar sobre un hecho como actual si no conserva vigencia temporal.** Un hecho cuyo `validUntil` ha expirado o cuyo `supersededBy` está definido no puede ser base de ninguna pregunta socrática. Solo la salida de `getActiveFacts()` alimenta el `SocraticThresholdEvaluator`.

Riesgo mitigado:

La IA que reduce carga cognitiva puede, si no se diseña con cuidado, atrofiar el razonamiento clínico con el tiempo. AiduxCare lo previene haciendo que Sócrates exija participación activa del fisioterapeuta. El sistema no piensa por el profesional. Le muestra lo que vio, con trazabilidad, y le pregunta qué quiere hacer con eso.

Prerrequisito técnico:

Sócrates solo es posible con memoria longitudinal activa. Sin contexto acumulado del paciente y del tratante, las preguntas son genéricas y pierden valor clínico. La memoria longitudinal no es una feature accesoria: es la condición de existencia del Modo 2.

Referencia fundacional:
Maojo V, Kulikowski CA. Inteligencia Artificial y medicina: diez lecciones aprendidas (y olvidadas): 1970-2026. An RANM. 2026;143(01):67-75. DOI: https://doi.org/10.32440/ar.2026.143.01.rev05. Revista: https://analesranm.es/revista/2026/143_01/14301_rev05.

---

## 2. Stack Tecnológico y Decisiones de Arquitectura

### 2.1 Stack principal

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Frontend | React + TypeScript + Vite | React 18 | Tipado estático reduce errores clínicos en UI |
| Backend / BaaS | Firebase (Firestore, Auth, Functions) | v11 | Compliance GDPR nativo, cifrado en reposo, escalabilidad |
| IA Clínica | Vertex AI — Gemini 2.5 Flash | Gemini 2.5 | Latencia baja, razonamiento clínico, coste operativo |
| Transcripción | OpenAI Whisper (gpt-4o-mini-transcribe) | GPT-4o | Precisión multilingual, terminología clínica |
| Deploy | GCP VPS + PM2 | — | Control total del entorno, trazabilidad de deploys |
| SMS Consentimiento | Vonage (Cloud Function) | — | Trazabilidad de consentimiento digital RGPD |

### 2.1.1 Principios de arquitectura agéntica

Toda capacidad agéntica en AiduxCare debe cumplir estos controles mínimos:

| Control | Requisito |
|---|---|
| Entrada trazable | Registrar qué fuentes clínicas alimentaron la propuesta: transcript, SOAP previo, HEP, adjuntos, memoria longitudinal o checklist. |
| Salida verificable | Generar outputs estructurados, validados y revisables antes de guardarse como historia clínica. |
| Memoria explícita | Guardar hechos clínicos como estructuras versionables; no depender solo de contexto conversacional o texto libre. |
| Herramientas acotadas | Cada acción debe tener permisos, alcance y efectos laterales definidos. |
| Confirmación humana | Toda acción que afecte documentación clínica, tratamiento, comunicación al paciente o escalado requiere revisión del fisioterapeuta. |
| Auditoría | Mantener versionado de modelo, prompt, commit, timestamp y decisión humana cuando la acción sea clínicamente relevante. |
| Escalado prudente | Ante ambigüedad, riesgo o conflicto de fuentes, el agente debe pedir confirmación o escalar; no resolver por autonomía propia. |

Los agentes no deben ocultar incertidumbre tras una interfaz fluida. La UI debe hacer eficiente el trabajo clínico sin borrar la responsabilidad profesional.

### 2.2 Decisiones de arquitectura registradas (ADRs)

**ADR-001: Firestore como base de datos principal**
*Contexto:* Sistema clínico con datos de pacientes protegidos bajo RGPD/PHIPA/PIPEDA.
*Decisión:* Firebase Firestore con reglas de seguridad a nivel de documento por `userId`.
*Consecuencia:* No hay acceso cruzado entre fisioterapeutas. Auditoría automática en `FirestoreAuditLogger`. Deuda: reglas de Firestore para sesiones legacy con `temp-user-` siguen siendo permisivas.

**ADR-002: Vertex AI para análisis clínico, no fine-tuning propio**
*Contexto:* Riesgo de alucinaciones en contexto clínico.
*Decisión:* Prompt engineering con contexto profesional explícito + validación humana obligatoria antes de finalizar toda nota SOAP.
*Consecuencia:* El fisioterapeuta siempre revisa. El sistema nunca finaliza documentación sin aprobación.

**ADR-003: Deploy siempre desde Mac local**
*Contexto:* Control de auditoría de versiones desplegadas.
*Decisión:* `VITE_ENABLE_ES_PILOT=true npm run build` + gcloud SCP + pm2 restart. Nunca buildear en VPS.
*Consecuencia:* Trazabilidad completa de qué commit está en producción en cada momento.

**ADR-004: Un commit por fix, mensaje semántico**
*Contexto:* Auditoría CPO (Ontario), due diligence de inversores.
*Decisión:* Conventional Commits (`fix:`, `feat:`, `chore:`). TSC limpio antes de cada commit.
*Consecuencia:* El historial de git es legible por un auditor externo sin contexto adicional.

**ADR-005: Postura regulatoria SaMD/MLMD conservadora**
*Contexto:* AiduxCare apoya razonamiento clínico, documentación SOAP y continuidad longitudinal. Health Canada clasifica el software por intended use, claims, etiquetado y grado de autonomía. La guía Health Canada 2026 para ML-enabled medical devices exige evidencia de ciclo de vida, riesgo, datos, validación clínica, transparencia y post-market monitoring cuando el software usa ML para lograr un propósito médico.
*Decisión:* Hasta decisión formal regulatoria, AiduxCare debe diseñarse como si pudiera ser evaluado como Clinical Decision Support / SaMD o MLMD en Canadá si sus claims comerciales o funciones pasan de documentación/soporte a recomendación clínica regulada. Todo claim público debe preservar que el sistema propone, el fisioterapeuta decide, y que las recomendaciones son soporte documentado, no diagnóstico autónomo ni tratamiento autónomo.
*Consecuencia:* Toda feature clínica debe mantener intended use explícito, human oversight verificable, evidencia trazable, risk controls, versión de modelo/prompts, logs auditables, limitaciones visibles y plan de vigilancia post-market. Cualquier cambio que aumente autonomía clínica requiere revisión CTO + evaluación regulatoria antes de release.

### ADR-004 — Biblioteca de Evidencia Clínica

**Fecha:** 2026-05-03
**Estado:** Activo
**Decisor:** CTO clínico (Mauricio Sobarzo)

**Decisión:**
La evidencia clínica vive en `src/core/clinical-evidence/` separada
de `KnowledgeBaseService`. Cada diagnóstico es un archivo TypeScript
versionado en git. Ningún cambio entra sin revisión clínica aprobada
por el CTO médico.

**Estructura:**
src/core/clinical-evidence/
  types.ts
  evidenceService.ts
  EVIDENCE_REGISTRY.ts
  diagnoses/
    fascitis-plantar.ts

**Fuentes aceptadas:**
- PubMed Central (PMC) — texto completo gratuito
- PEDro — texto completo cuando disponible
- Cochrane — resúmenes open access
- Revistas open access con DOI verificable

**Estándar de calidad mínimo:**
- Diseño: RCT, revisión sistemática, o meta-análisis
- Score PEDro ≥ 6/10 para estudios individuales
- GRADE moderado o alto para revisiones sistemáticas
- Publicación 2018 en adelante salvo evidencia seminal sin actualización
- Abstract consistente con paper completo — si no se puede leer
  el paper completo, no se acepta como fuente primaria

**Flujo de actualización:**
1. Script de monitoreo consulta PEDro/PubMed por diagnóstico
2. Compara contra versión actual en biblioteca
3. Genera diff para revisión del CTO clínico
4. CTO aprueba o rechaza cada cambio
5. Si aprueba → commit con referencia bibliográfica completa
6. Fisio nunca ve el proceso — recibe siempre la versión aprobada

**Motor de razonamiento clínico (tres capas):**
- Capa 1: Evidencia base por diagnóstico (esta biblioteca)
- Capa 2: Perfil del fisio (filtro de competencias)
- Capa 3: Variables del círculo del paciente (filtro de viabilidad)

El output es una propuesta priorizada para este fisio con este
paciente. El sistema avisa, no decide. El fisio siempre en el loop.

**Umbral mínimo para status: approved:**

Opción A — con meta-análisis:
  - 1 meta-análisis con GRADE moderado o alto
  - Texto completo revisado por CTO clínico
  - Abstract consistente con paper completo

Opción B — sin meta-análisis disponible:
  - Mínimo 3 RCTs individuales PEDro ≥ 6/10
  - Texto completo revisado por CTO clínico
  - Al menos 1 revisión sistemática que los sintetice

En ambos casos:
  - Mínimo 1 intervención con evidenceLevel: 'high'
  - Aprobación explícita del CTO clínico con fecha y número de colegiado

Si el diagnóstico no cumple el umbral → status: 'pending_papers'
El sistema informa al fisio que las sugerencias provienen de análisis
general, no de evidencia curada AiduxCare.

**Clasificación red flag vs yellow flag:**
Red flag: condición activa, sin tratamiento conocido, o síntoma que
sugiere patología grave no diagnosticada. Requiere acción del fisio.

Yellow flag: condición conocida con tratamiento médico activo
documentado en la conversación. Modifica el plan, no lo paraliza.

Regla: si el paciente menciona estar bajo tratamiento médico activo
para una condición, esa condición va a yellow_flags, no a red_flags,
independientemente de la gravedad de la condición base.

**Zotero como bandeja bibliográfica controlada:**

Flujo de evidencia candidata:
1. Nueva búsqueda bibliográfica (PubMed/PMC, DOI, Cochrane, PEDro)
2. Vertex resume y clasifica candidato — no decide validez clínica
3. Paper guardado en Zotero con estado: pending_review
4. CTO clínico revisa paper completo (abstract consistente con full text)
5. CTO aprueba → approved / rechaza → rejected en Zotero
6. Solo approved se materializa como commit en src/core/clinical-evidence/
7. Solo src/core/clinical-evidence/ aprobado afecta el motor de razonamiento

Roles:
- Zotero: inbox de candidatos, organización por diagnóstico, trazabilidad
- Vertex: descubrimiento y resumen de evidencia candidata
- src/core/clinical-evidence/: única fuente ejecutable del runtime
- CTO clínico: único rol con autoridad para promover evidencia al motor

Regla crítica e inamovible:
Evidencia no aprobada por CTO clínico = no afecta razonamiento clínico.
Vertex no puede promover evidencia al motor sin revisión humana.
El runtime de Aidux solo razona con evidencia versionada en git y
aprobada explícitamente con fecha y número de colegiado.

---

## 3. Convenciones de Código

Estas reglas son **no negociables** y se aplican a todo el código, sea escrito por humanos o generado por agentes de IA.

### 3.1 Regla fundamental

```
One operation per line.
One intermediate variable per step.
```

Esta regla no es estética — es de auditoría. Cada línea debe poder leerse, revisarse y trackearse individualmente en un diff. Una línea que hace múltiples operaciones no puede auditarse con precisión.

**Incorrecto:**
```typescript
const sessions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
```

**Correcto:**
```typescript
const sessionDocs = snapshot.docs;
const sessions = sessionDocs.map((d) => {
  const sessionId = d.id;
  const sessionData = d.data();
  const session = { id: sessionId, ...sessionData };
  return session;
});
```

### 3.2 TypeScript estricto

- `pnpm exec tsc --noEmit` debe pasar con salida limpia antes de cualquier commit.
- No se permiten `any` sin comentario justificativo explícito.
- No se permiten `@ts-ignore` sin issue de backlog asociado.

### 3.3 Componentes

- No crear nuevos componentes sin autorización explícita del CEO/CTO.
- Cada componente nuevo requiere un briefing de diseño previo documentado.
- Reutilizar antes de crear.

### 3.4 Gestión de estado

- No usar `localStorage` para datos clínicos. Solo `SessionStorage` con scoping por `sessionId`.
- Los efectos secundarios deben tener cleanup explícito (especialmente listeners de Firestore y `setInterval`).
- Los `useEffect` deben declarar todas sus dependencias correctamente.

### 3.5 Seguridad

- Nunca hardcodear credenciales, API keys ni tokens en el código fuente.
- Toda comunicación con Firebase a través de reglas de seguridad por `userId`.
- Los logs de consola no deben incluir datos de pacientes (PHI). El sistema tiene `stripPHIFields` en analytics — aplicarlo consistentemente.

---

## 4. Proceso de Desarrollo con IA

AiduxCare utiliza desarrollo asistido por IA como práctica estándar. Este proceso está diseñado para capturar los beneficios de velocidad mientras mitiga los riesgos documentados por la industria.

### 4.1 Principio rector

> "Treat AI-generated output as a pull request." — BCG, 2025

El agente de IA implementa. El CTO humano decide la arquitectura, revisa el diff, y autoriza el commit. Ningún código generado por agente llega a producción sin revisión humana explícita.

### 4.2 Workflow estándar

```
1. CEO/CTO define el problema y el approach (Claude.ai — esta conversación)
2. CEO/CTO elabora el briefing de implementación con restricciones explícitas
3. Agente (Claude Code) implementa
4. TSC verification: pnpm exec tsc --noEmit 2>&1 | grep -v "web-vitals"
5. CEO/CTO revisa diff antes del commit
6. Build + deploy + validación en pilot
7. Commit semántico solo si validación pasa
```

### 4.3 Restricciones de briefing obligatorias

Todo briefing para un agente de IA debe incluir:
- Archivo(s) específico(s) a modificar
- Qué NO tocar
- Regla de codificación activa
- Comando de verificación TSC
- Instrucción explícita: "No build, no deploy, no commit"

### 4.4 CLAUDE.md

El archivo `CLAUDE.md` en la raíz del repositorio contiene las convenciones para el agente de IA. Según la documentación oficial de Anthropic, este archivo "va a cada sesión" y debe contener **únicamente instrucciones universalmente aplicables**. Las instrucciones específicas de feature pertenecen a briefings ad-hoc, no a `CLAUDE.md`.

> Nota: Investigación reciente de ETH Zurich (2026) muestra que los archivos de contexto para agentes tienen un impacto menor de lo esperado cuando los modelos son suficientemente capaces. El valor principal de `CLAUDE.md` no es técnico — es de gobernanza: fuerza la codificación del conocimiento institucional.

### 4.5 Sub-agentes de revisión (roadmap)

Siguiendo las mejores prácticas de la industria (proceso documentado en el ecosistema de Lanzadera y BCG, 2025), el siguiente nivel de madurez incluye sub-agentes especializados de revisión pre-commit:

- **Agente CTO:** revisión de arquitectura y deuda técnica
- **Agente Seguridad:** injection vulnerabilities, PHI exposure, Firestore rules
- **Agente CPO/Clínico:** coherencia del flujo clínico, autonomía del fisioterapeuta, compliance CPO/CGCFE

*Estado actual:* no implementado. Prioridad: Q3 2026.

---

## 5. Alineación ISO/IEC 25010:2023

La versión 2023 del estándar internacional de calidad de software añadió **safety** como característica de primer nivel, junto con escalabilidad e inclusividad como subcaracterísticas. Para AiduxCare, las nueve características se mapean así:

| Característica ISO 25010:2023 | Estado AiduxCare | Evidencia |
|---|---|---|
| **Functional Suitability** | ✅ Activo | SOAP generation, análisis clínico, consentimiento digital |
| **Performance Efficiency** | ⚠️ Parcial | Chunks >1MB en build (warning activo). Deuda: code splitting |
| **Compatibility** | ✅ Activo | EMR-compatible SOAP output. Exportación PDF/TXT |
| **Interaction Capability** | ✅ Activo | ES-ES completo en piloto España. Responsive. Accesibilidad pendiente |
| **Reliability** | ✅ Activo | Auto-save cada cambio. Backup en localStorage. Resume de sesiones |
| **Security** | ✅ Activo | Firestore rules por userId. RGPD. Cifrado en reposo. PHI stripping en analytics |
| **Maintainability** | ⚠️ Parcial | Convenciones documentadas. Deuda técnica registrada. Re-render loop pendiente |
| **Flexibility (Portabilidad)** | ✅ Activo | React SPA. Deploy en cualquier servidor con Node. Multi-jurisdicción (ES/CA) |
| **Safety** | ✅ Activo | Validación CPO en SOAP. Alertas clínicas obligatorias. Autonomía del fisioterapeuta |

---

## 6. Compliance y Seguridad de Datos Clínicos

### 6.1 Marco regulatorio activo

| Marco | Jurisdicción | Estado | Evidencia en código |
|---|---|---|---|
| RGPD / LOPDGDD | España (UE) | ✅ Implementado | Consentimiento digital trazado. Datos en Firestore EU. SMS con token de 7 días |
| PHIPA | Ontario, Canadá | ✅ Arquitectura | Reglas Firestore por userId. Audit log. Consentimiento verificado antes de acceso clínico |
| PIPEDA | Canadá federal | ✅ Arquitectura | Cifrado en reposo. Acceso por rol. Retención de datos configurable |
| Ley 41/2002 | España | ✅ Implementado | Consentimiento informado previo. Historia clínica trazable |
| CGCFE | España | ✅ Parcial | Validación SOAP por estándares fisioterapia. Número de colegiado en informes |
| CPO Ontario | Canadá | ✅ Parcial | SOAP validation. Compliance block modal. Audit-ready encounters |
| Health Canada SaMD | Canadá | ⚠️ Watchlist regulatoria | Intended use controlado. Sistema propone, fisio decide. No claims de diagnóstico/tratamiento autónomo |
| Health Canada MLMD | Canadá | ⚠️ Watchlist regulatoria | Vertex/Gemini con humano en el loop. Falta MLMD technical file formal si se comercializa como dispositivo |
| EU AI Act | Unión Europea | ⚠️ Watchlist regulatoria | Human oversight activo. Falta AI risk management file si se clasifica como high-risk AI |

### 6.2 Roadmap de certificaciones

El camino de certificación para un healthtech que opera en España con expansión a Canadá debe separar tres frentes:

1. **Privacidad y seguridad de datos:** RGPD/LOPDGDD, PHIPA, PIPEDA, ISO/IEC 27001, SOC 2.
2. **Software clínico / medical device readiness:** intended use, clasificación SaMD/MLMD, IEC 62304, ISO 14971, ciberseguridad de medical devices.
3. **Gobernanza de IA:** ISO/IEC 42001, GMLP, transparencia, human-AI team, monitoring y control de cambios.

```
[ACTUAL]     RGPD/LOPDGDD + PHIPA/PIPEDA arquitectura + SoT de ingeniería
[2026]       ISO/IEC 27001 readiness — ISMS, risk register, asset inventory, access reviews
[2026]       SaMD/MLMD classification memo — intended use, claims, autonomy, user, workflow
[2026]       IEC 62304-lite SDLC — requirements, risk traceability, verification, release records
[2026]       ISO 14971-lite risk file — hazards, harms, controls, residual risk, post-market signals
[2027]       SOC 2 Type I → Type II — Security required; Availability/Confidentiality/Privacy recommended
[2027]       ISO/IEC 42001 readiness — AI management system for clinical AI governance
[2027+]      Health Canada submission readiness if commercial claims trigger SaMD/MLMD licensing
```

**Regla comercial:** marketing, web, demos, pitch decks y contratos no pueden afirmar diagnóstico, tratamiento autónomo, triage autónomo, sustitución de criterio profesional ni reducción garantizada de riesgo clínico sin revisión regulatoria. Las palabras permitidas son: soporte, propuesta, documentación, trazabilidad, evidencia curada, continuidad clínica y revisión humana obligatoria.

**Palabras prohibidas sin revisión regulatoria:** diagnóstico, tratamiento, prescripción, triage autónomo, reemplaza al profesional, reduce errores clínicos, mejora outcomes.

**Palabras permitidas:** soporte, propuesta, documentación, trazabilidad, evidencia curada, continuidad clínica, revisión humana obligatoria.

**Regla de auditoría:** toda certificación futura debe poder reconstruirse desde Git, Firestore audit logs, registros de consentimiento, decisiones de fisioterapeuta, versiones de prompts/modelos, release notes, risk register y evidencias TSC/ISMS.

### 6.3 Controles técnicos de seguridad activos

- **Autenticación:** Firebase Auth con verificación de email
- **Autorización:** Reglas Firestore por `userId` en cada colección
- **Auditoría:** `FirestoreAuditLogger` registra eventos críticos con timestamp y userId
- **PHI:** `stripPHIFields` en analytics. Logs de consola sin datos de pacientes
- **Consentimiento:** Token de 7 días con URL única. Estado persistido en Firestore
- **Cifrado:** En reposo (Firestore default). En tránsito (HTTPS forzado)

### 6.4 Baseline de auditoría requerido antes de comercialización

Antes de vender AiduxCare a clínicas fuera del piloto, deben existir estos artefactos vivos:

| Artefacto | Objetivo auditor/regulador | Estado |
|---|---|---|
| Intended Use Statement | Definir si AiduxCare es documentación clínica, CDS, SaMD o MLMD | Pendiente |
| Claims Register | Controlar claims comerciales y evitar claims medical device no aprobados | Pendiente |
| SaMD/MLMD Classification Memo | Documentar análisis Health Canada por función y grado de autonomía | Pendiente |
| Risk Management File | ISO 14971-lite: peligros, daños, controles, riesgo residual | Pendiente |
| Software Safety Classification | IEC 62304-lite por módulo clínico | Pendiente |
| Requirements Traceability Matrix | Requisito → riesgo → control → test → release | Pendiente |
| Model/Prompt Card | Intended use, inputs, outputs, limitaciones, versión, known failure modes | Parcial |
| Evidence Register | ADR-004: evidencia clínica aprobada por CTO | Activo parcial |
| Human Oversight Evidence | Prueba de que el fisio revisa/decide antes de SOAP final | Activo |
| Post-market Surveillance Log | Feedback, incidentes, near misses, acciones correctivas | Parcial |
| Vulnerability Management/SBOM | Dependencias, CVEs, patch policy, secure release | Pendiente |
| Access Review Log | Revisión periódica de usuarios, roles y permisos | Pendiente |
| Backup/DR Test Evidence | Evidencia de recuperación y continuidad | Pendiente |
| DPIA/PIA | Evaluación privacidad RGPD/PHIPA/PIPEDA por flujo clínico | Pendiente |
| SOC 2 Control Matrix | Mapeo a Security, Availability, Confidentiality, Processing Integrity, Privacy | Pendiente |

### 6.5 Reglas SaMD/MLMD para nuevas features clínicas

Toda feature que afecte análisis clínico, recomendaciones, priorización, alertas, SOAP o continuidad longitudinal debe declarar:

- **Intended use:** qué problema soporta y qué explícitamente no hace.
- **Usuario previsto:** fisioterapeuta, administrativo, paciente u otro.
- **Paciente/población prevista:** alcance, exclusiones, limitaciones.
- **Grado de autonomía:** informativo, recomendación, priorización, bloqueo, automatización.
- **Datos de entrada:** transcript, historia, tests, evidencia, adjuntos, sensores, EMR.
- **Output clínico:** texto, alerta, recomendación, score, plan, resumen.
- **Riesgo clínico principal:** daño posible si output es incorrecto, incompleto o tardío.
- **Control humano:** dónde el fisio acepta, edita, descarta o documenta decisión.
- **Evidencia:** fuente clínica o razonamiento documentado.
- **Trazabilidad:** logs, versión modelo/prompt, commit, test, feedback asociado.
- **Post-market signal:** qué feedback, incidente o métrica indicaría degradación.

Si una feature cambia de “documentación/soporte” a “recomendación clínica que puede influir tratamiento”, debe revisarse como posible SaMD/MLMD antes de release.

### 6.6 Controles AI/ML mínimos

AiduxCare usa modelos externos (Vertex AI Gemini y OpenAI Whisper) y no entrena modelos propios en runtime clínico actual. Aun así, para auditoría se aplican controles de AI management:

- **Versionado:** registrar proveedor, modelo, versión/configuración, prompt, fecha y commit.
- **Bounded changes:** ningún cambio de prompt/modelo entra sin diff, TSC y validación clínica.
- **Human-AI team:** medir el flujo como equipo fisio + IA, no solo calidad del modelo.
- **Transparency:** mostrar al usuario límites, incertidumbre y base de evidencia cuando aplique.
- **Performance monitoring:** feedback estructurado, fallos, falsos positivos/negativos clínicos y near misses.
- **Bias/representativeness:** cuando se use dataset propio o validación clínica, documentar representatividad por sexo/género/edad/origen cuando sea razonable.
- **Rollback:** toda actualización relevante de prompt/modelo debe tener plan de reversión.
- **No silent learning:** no se permite entrenamiento automático con datos clínicos de pacientes sin aprobación CTO, DPIA/PIA y base legal/consentimiento explícitos.

### 6.7 Ciberseguridad medical device readiness

Aunque AiduxCare no esté licenciado como medical device, las funciones clínicas deben adoptar baseline de ciberseguridad proporcional al riesgo:

- **Secure design:** requisitos de seguridad desde diseño, no al final.
- **Risk management:** amenazas de ciberseguridad vinculadas a daño clínico posible.
- **Verification and validation:** tests de controles críticos, no solo build exitoso.
- **SBOM:** inventario de dependencias, librerías, servicios cloud y modelos externos.
- **Vulnerability disclosure:** canal y proceso para recibir, evaluar y corregir vulnerabilidades.
- **Patch policy:** criterio de severidad, SLA y evidencia de parcheo.
- **Traceability matrix:** riesgo → requisito → control → prueba → release.
- **Backup/recovery:** evidencia periódica de restauración, no solo backups configurados.
- **Incident response:** playbook para brecha PHI, degradación IA, pérdida de sesión y fallo de generación SOAP.

---

## 7. Deuda Técnica Documentada

La deuda técnica no documentada es el mayor riesgo de mantenibilidad en software generado con IA. Esta tabla es la fuente de verdad. Toda deuda conocida está aquí.

### 7.1 Deuda técnica activa

| ID | Descripción | Severidad | Origen | Criterio de cierre |
|---|---|---|---|---|
| **TD-001** | Re-render loop en `EvaluationTab` al escribir notas de tests | Media | Agente IA | Eliminar escrituras innecesarias a Firestore en cada keystroke |
| **TD-002** | Sesiones legacy `temp-user-...` no actualizables en Firestore | Baja | Histórico | Migración de datos o exclusión explícita del query |
| **TD-003** | `mskTestLibrary.ts` — 38 tests en inglés | Media | Histórico | Traducción ES-ES con revisión clínica de terminología |
| **TD-004** | Motor ES de informe de derivación no conectado a UI | Baja | Arquitectura | Wiring de `clinicalReportService.ts` al modal de informe |
| **TD-005** | Chunks >1MB en build (Vite warning) | Baja | Arquitectura | `manualChunks` en `vite.config.ts` para code splitting |
| **TD-006** | `VoiceInputButton` no disponible en tests manuales de biblioteca | Media | Agente IA | Unificar renderizado de campos entre tests IA y tests manuales |
| **TD-007** | `lastName` no hidratado desde `users/{uid}` en perfil profesional | Baja | Datos | Migración de datos o derivación desde `fullName` (fix parcial activo) |
| **TD-008** | Pre-población de tests desde transcripción no implementada | Alta (feature) | Roadmap | Implementar `extracted_measurements` en prompt de análisis + binding en `EvaluationTab` |
| **TD-009** | `ClinicalAnalysisResults.tsx` mantiene `any` sin comentario justificativo | Media | Histórico | Tipar `ClinicalAnalysisResults` y entidades derivadas o añadir justificación explícita por campo |
| **TD-010** | `ClinicalAnalysisResults.tsx` tiene `useEffect` sin cleanup explícito | Baja | Histórico | Confirmar que no registra listeners/timers o documentar cleanup/no-op explícito |

### 7.2 Deuda de producto (no código)

| ID | Descripción | Dueño | Decisión pendiente |
|---|---|---|---|
| **PD-001** | Consentimiento escrito sin opción de impresión | CEO | Flujo alternativo o QR |
| **PD-002** | Certificados y email de actualización al paciente | CEO | Gap funcional — requiere sprint dedicado |
| **PD-003** | Edición de datos del paciente — UX/discoverability | CEO | Añadir acceso desde command center |
| **PD-004** | Consentimiento tutores/menores/incapacidad | CEO | Fuera de scope piloto actual |

---

## 8. Handoff Readiness

Un desarrollador técnico externo debe poder arrancar en menos de 30 minutos con este documento y el repositorio. Esta sección lo garantiza.

### 8.1 Prerrequisitos

```bash
node --version  # >= 18
pnpm --version  # >= 8
gcloud --version # Google Cloud SDK configurado con proyecto aiduxcare-v2-uat-dev
```

### 8.2 Setup local

```bash
git clone https://github.com/Maurosg78/AIDUXCARE-V.2 aiduxcare-stable
cd aiduxcare-stable
git checkout stable
pnpm install
cp .env.example .env.local  # Variables de Firebase — solicitar al CEO
pnpm dev
```

### 8.3 Verificación de calidad

```bash
# TypeScript — debe salir limpio
pnpm exec tsc --noEmit 2>&1 | grep -v "web-vitals"

# Build de producción
VITE_ENABLE_ES_PILOT=true npm run build
```

### 8.4 Deploy a producción

```bash
VITE_ENABLE_ES_PILOT=true npm run build && \
gcloud compute ssh pilot-vps --command="rm -rf /var/www/pilot/dist/*" && \
gcloud compute scp --recurse dist/* pilot-vps:/var/www/pilot/dist/ && \
gcloud compute ssh pilot-vps --command="pm2 restart pilot-web"
```

**Regla:** Nunca buildear en el VPS. Siempre desde Mac local.

### 8.5 Colecciones Firestore principales

| Colección | Propósito | Acceso |
|---|---|---|
| `users/{uid}` | Perfil profesional del fisioterapeuta | Solo el propio usuario |
| `patients/{patientId}` | Datos del paciente | userId del fisioterapeuta |
| `notes/{noteId}` | Notas SOAP guardadas | userId del fisioterapeuta |
| `sessions/{sessionId}` | Estado de sesión clínica | userId del fisioterapeuta |
| `encounters/{encounterId}` | Encuentros completados (longitudinal) | userId del fisioterapeuta |
| `patient_trajectory_events` | Eventos de trayectoria clínica | userId del fisioterapeuta |
| `patient_consent/{patientId}` | Estado de consentimiento | userId del fisioterapeuta |
| `user_feedback` | Feedback de usuarios del piloto | Admin only |

---

## 9. Fuentes y Referencias

Este documento está fundamentado en los siguientes estándares y publicaciones:

1. **ISO/IEC 25010:2023** — Systems and software Quality Requirements and Evaluation (SQuaRE). International Organization for Standardization. Noviembre 2023. https://www.iso.org/standard/78176.html

2. **GitClear AI Copilot Code Quality Report 2024-2025** — Análisis de 211 millones de líneas de código. Documenta el aumento de 8x en duplicación de código y la disminución de reutilización en codebases con IA. https://www.gitclear.com/

3. **Google DORA Report 2024** — "A 25% increase in AI usage quickens code reviews and benefits documentation, but results in a 7.2% decrease in delivery stability." Citado en LeadDev, agosto 2025.

4. **Ox Security — Army of Juniors: The AI Code Security Crisis (2025)** — "AI-generated code is highly functional but systematically lacking in architectural judgment." https://www.infoq.com/news/2025/11/ai-code-technical-debt/

5. **BCG X — From Dev Speed to Business Impact (2025)** — "Treat AI-generated output as a pull request. Encourage a lead engineer mindset at every level." https://www.bcg.com/x/the-multiplier/ai-assisted-coding-generative-engineering

6. **Sonar — State of Code Developer Survey 2026** — "72% of developers who use AI coding tools rely on them daily. 42% of committed code is AI-assisted." https://www.sonarsource.com/state-of-code-developer-survey-report.pdf

7. **Anthropic — Claude Code Best Practices (2025-2026)** — CLAUDE.md, subagents, skills authoring. https://code.claude.com/docs/en/best-practices

8. **ETH Zurich — Context files for coding agents (2026)** — Documenta que los archivos AGENTS.md/CLAUDE.md tienen impacto limitado (5% sobre baseline) con modelos de frontera actuales. El valor es de gobernanza, no solo técnico. Citado en XDA Developers, 2026.

9. **Assuric — SOC 2 for Healthtech (2025)** — Roadmap de certificaciones para healthtech: GDPR → ISO 27001 → SOC 2. https://www.assuric.com/blog/soc2-compliance-for-healthtech

10. **Sekurno — ISO 27001 for Biotech & HealthTech (2025)** — "Trusted ISO 27001 auditors: BSI Group, NQA, Schellman, and Bureau Veritas." https://www.sekurno.com/post/iso-27001-compliance-checklist-for-biotech-and-healthtech-2025

11. **RiscLens — ISO 27001 Audit Preparation for HealthTech Startups (2026)** — "Most HealthTech companies at Seed to Series A stage spend between $30k-$60k on their initial ISO 27001 audit." https://risclens.com/iso-27001/iso-27001-audit-prep/healthtech

12. **HumanLayer — Writing a good CLAUDE.md (2025)** — "CLAUDE.md should contain as few instructions as possible — ideally only ones which are universally applicable." https://www.humanlayer.dev/blog/writing-a-good-claude-md

13. **Health Canada — Software as a Medical Device (SaMD): Definition and Classification** — Clarifica intended use, CDS/PDS, exclusiones y clasificación SaMD bajo Food and Drugs Act / Medical Devices Regulations. https://www.canada.ca/en/health-canada/services/drugs-health-products/medical-devices/application-information/guidance-documents/software-medical-device-guidance-document.html

14. **Health Canada — Pre-market guidance for machine learning-enabled medical devices (2026)** — Guía vigente para MLMD: lifecycle, GMLP, design, risk management, data, testing, clinical validation, transparency, post-market monitoring y PCCP. https://www.canada.ca/en/health-canada/services/drugs-health-products/medical-devices/application-information/guidance-documents/pre-market-guidance-machine-learning-enabled-medical-devices.html

15. **Health Canada / FDA / MHRA — Good Machine Learning Practice for Medical Device Development** — 10 principios para MLMD, incluyendo human-AI team, representatividad de datos, independencia train/test, transparencia y monitoring post-deployment. https://www.canada.ca/en/health-canada/services/drugs-health-products/medical-devices/good-machine-learning-practice-medical-device-development.html

16. **Health Canada — Predetermined Change Control Plans for ML-enabled Medical Devices** — Principios de PCCP: bounded, risk-based, evidence-based, transparent y lifecycle-oriented. https://www.canada.ca/en/health-canada/services/drugs-health-products/medical-devices/good-machine-learning-practice-medical-device-development/predetermined-change-control-plans-machine-learning-enabled-medical-devices.html

17. **Health Canada — Transparency for ML-enabled Medical Devices** — Principios de transparencia centrados en el usuario, el paciente y la interpretación segura del output MLMD. https://www.canada.ca/en/health-canada/services/drugs-health-products/medical-devices/transparency-machine-learning-guiding-principles.html

18. **Health Canada — Pre-market Requirements for Medical Device Cybersecurity** — Secure design, cybersecurity risk management, verification/validation, BOM, vulnerability management, maintenance plan y traceability matrix. https://www.canada.ca/en/health-canada/services/drugs-health-products/medical-devices/application-information/guidance-documents/cybersecurity/document.html

19. **ISO 14971:2019** — Medical devices — Application of risk management to medical devices. Confirmada como vigente en 2025. https://www.iso.org/standard/72704.html

20. **IEC 62304:2006 + Amendment 1:2015** — Medical device software — Software life cycle processes. Confirmada como vigente en 2021. https://www.iso.org/standard/38421.html

21. **ISO/IEC 27001:2022** — Information security, cybersecurity and privacy protection — Information security management systems — Requirements. https://www.iso.org/standard/27001

22. **ISO/IEC 42001:2023** — Artificial intelligence management system. Primer estándar internacional de sistema de gestión de IA. https://www.iso.org/standard/42001

23. **AICPA & CIMA — 2017 Trust Services Criteria with Revised Points of Focus 2022** — Criterios SOC 2 para Security, Availability, Processing Integrity, Confidentiality y Privacy. https://www.aicpa.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022

24. **AICPA & CIMA — 2018 SOC 2 Description Criteria with Revised Implementation Guidance 2022** — Criterios para preparar/evaluar la descripción del sistema en SOC 2. https://www.aicpa-cima.com/resources/download/get-description-criteria-for-your-organizations-soc-2-r-report

25. **Office of the Privacy Commissioner of Canada — PIPEDA meaningful consent** — Consentimiento significativo, información clara, sensibilidad de datos, control del nivel de detalle y retiro de consentimiento. https://www.priv.gc.ca/en/privacy-topics/collecting-personal-information/consent/gl_omc_201805/

26. **Ontario PHIPA — Personal Health Information Protection Act** — Salvaguardas, proveedores a custodios, audit logs electrónicos y deber de proteger PHI contra pérdida, robo, acceso no autorizado, copia, modificación o disposición. https://www.ontario.ca/laws/statute/04p03

27. **European Commission — AI in healthcare / AI Act** — AI Act vigente desde 2024; high-risk AI para software médico exige risk mitigation, high-quality datasets, user information y human oversight. https://health.ec.europa.eu/ehealth-digital-health-and-care/artificial-intelligence-healthcare_en

---

## 10. Control de Versiones de este Documento

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | Abril 2026 | Versión inicial. Piloto España activo. |
| 1.1 | 2026-05-05 | `ENGINEERING.md` declarado SoT editable; PDFs quedan como referencia histórica. |
| 1.2 | 2026-05-06 | Añadida postura regulatoria SaMD/MLMD, auditoría comercial, ISO 14971, IEC 62304, Health Canada MLMD 2026, GMLP, PCCP, SOC 2/ISO 27001/ISO 42001 y ciberseguridad medical-device. |
| 1.3 | 2026-05-07 | Añadido norte de producto: agentes clínicos auditables, arquitectura agéntica y autoridad clínica explícita del fisioterapeuta. |
| 1.4 | 2026-05-13 | Añadido Principio Sócrates: AiduxCare amplifica criterio clínico con razonamiento a demanda, trazable y no imperativo. |

---

*AiduxCare V2 — Documento interno de ingeniería. No contiene datos de pacientes.*
