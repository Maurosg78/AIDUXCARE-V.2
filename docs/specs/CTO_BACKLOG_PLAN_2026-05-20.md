# CTO Backlog Plan — 2026-05-20

**Estado:** Backlog operativo actualizado post-piloto del día  
**Fuente:** Feedback Firestore pendiente + decisiones CEO/CTO 2026-05-20  
**Pendientes activos Firestore:** 7  
**SoT:** `ENGINEERING.md` v1.10 + `docs/governance/PRODUCT_VISION.md` v1.0  

## Principio de Priorización

El backlog se ordena por impacto clínico y continuidad operativa:

```text
primero preservar decisiones clínicas humanas,
luego asegurar captura y persistencia útil,
luego mejorar presentación clínica,
luego ampliar inteligencia longitudinal.
```

Regla madre vigente:

```text
decisión confirmada por el profesional > input de sesión actual > historial/baseline > propuesta IA
```

No construir nuevas capas de inteligencia sobre datos clínicos sin separación explícita entre:

- hecho documentado,
- contexto histórico,
- propuesta IA,
- decisión confirmada por el profesional.

---

## P1 activos — Antes del próximo piloto con pacientes reales

### P1.1 Baby Step 1B — Persistencia de pilares Magee

**Objetivo:** Persistir `pillarNotes` desde `EvaluationTab` hacia `ProfessionalWorkflowPage` sin afectar `evaluationTests`.

**Estado actual:** Baby Step 1A implementó los 4 pilares Magee como UI local en evaluación inicial.

**Criterio de cierre:**
- Observación, palpación, ROM y fuerza muscular salen de `EvaluationTab`.
- El estado padre recibe los valores sin resetear `evaluationTests`.
- No se toca SOAP todavía.
- No afecta follow-up.

**Siguiente paso:** Commit separado antes de Baby Step 1C.

### P1.2 HEP canónico — cerrado

**Feedback:** `BQ8iLZOUiQZYPGksPKhc`  
**Commit técnico:** `5d31692`

**Estado:** Resuelto en Firestore el 2026-05-20.

**Criterio de cierre cumplido:**
- Editar HEP, generar SOAP, verificar que solo aparece el HEP actual.
- Eliminar todos los ítems HEP, generar SOAP, verificar que no reaparecen ejercicios históricos.
- Confirmar que initial assessment no se altera.
- Marcar feedback como resuelto en Firestore.

### P1.3 Medicamentos manuales

**Feedback:** `YR3vDYSLiVxED4QcgJla`

**Objetivo:** Permitir agregar medicamentos manualmente cuando no fueron detectados desde entrevista/transcripción.

**Criterio de cierre:**
- El fisioterapeuta puede añadir medicamento manual.
- El medicamento aparece como dato documentado por profesional, no como inferencia IA.
- Persiste y llega al SOAP/registro clínico donde corresponda.

### P1.4 Canonical Clinical Decision Layer — proyecto técnico

**Tipo:** Proyecto de reconstrucción, no hotfix.

**Objetivo:** Crear una capa auditable que garantice que la decisión confirmada por el profesional gana sobre historial, baseline, memoria longitudinal y propuesta IA.

**Regla madre:**

```text
Todo output clínico final debe distinguir explícitamente:
1. hecho documentado,
2. contexto histórico,
3. propuesta IA,
4. decisión confirmada por el profesional.
```

**Scope:**
- Follow-up prompt construction.
- Initial assessment prompt construction.
- Futura integración Sócrates.

**Prerequisito:** Test coverage sobre paths clínicos críticos.

**Restricción:** No abordar implementación completa durante piloto activo.

**Relacionado:** TD-009, ADR-002, hotfix HEP `homeProgramDecisionProvided`.

---

## P2 activos — Calidad del piloto

### P2.1 Canonical Clinical Presentation Layer

**Tipo:** Proyecto producto/técnico.

**Problema:** Cada nota/certificado queda presentado según el formato vigente al momento de generación. Las mejoras visuales no son retroactivas.

**Objetivo:** Separar contenido clínico persistido de presentación imprimible/render actual.

**Criterio de diseño:**
- Persistir contenido clínico y texto original.
- Renderizar documentos con templates versionados actuales.
- Permitir re-renderizar notas antiguas con formato nuevo sin alterar el registro clínico original.
- PDF/certificado debe indicar fecha de generación y origen desde registro clínico original.

**Riesgo:** Alto si se toca sin modelo de auditoría.

**Restricción:** No implementar durante piloto activo; documentar diseño primero.

### P2.2 Ongoing — agregar al día sin iniciar sesión

**Feedback:** `V8yIlD0gnU0HO5Bi4OQf`

**Objetivo:** Permitir agregar/preparar paciente ongoing en la cola del día sin abrir sesión clínica activa.

**Criterio de cierre:**
- Añadir ongoing a fecha actual o futura.
- No crear sesión incompleta.
- Respetar orden manual de agenda.

### P2.3 Acciones clínicas rápidas desde historial

**Feedback:** `3Igq6r9Ix7kcY5qVcZpo`

**Objetivo:** Exponer acciones clínicas relevantes desde historial sin navegar sesión por sesión.

**Criterio de cierre:**
- Iniciar follow-up/ongoing desde historial cuando el paciente ya tiene baseline suficiente.
- Mostrar acciones con fecha, sesión y fuente.

### P2.4 Calidad follow-up / variaciones previas

**Feedback:** `GFFCsyKOQR5BfHBMlydZ`

**Objetivo:** Mejorar el resumen de evolución y valoración en follow-up, incluyendo cambios relevantes entre sesiones y número de sesión cuando exista.

**Criterio de cierre:**
- La nota no pierde variaciones clínicas relevantes.
- No duplica HEP ni revive plan histórico eliminado.
- Usa memoria longitudinal solo como contexto, no como decisión.

### P2.5 Baby Step 1C — Integrar pilares Magee al SOAP

**Prerequisito:** Baby Step 1B cerrado.

**Objetivo:** Incorporar `pillarNotes` al input SOAP de initial assessment con atribución como datos documentados por el fisioterapeuta.

**Restricción:** No mezclar con `evaluationTests`.

### P2.6 OCR multi-formato para informes escritos

**Objetivo:** Extraer texto de JPG, HEIC y PNG cuando contienen informes escritos, además de PDF.

**Regla ADR-009:** Solo OCR textual puede alimentar razonamiento clínico; píxeles no.

### P2.7 Tarjeta de medicamentos flotante

**Objetivo:** Presentar medicamentos como highlight clínico en columna derecha, no como entidad visual separada que compita con el flujo principal.

---

## P3 — Backlog

### P3.1 Botón flotante para generar SOAP

**Feedback:** `M2ZGxfV1dEthDQsjm4qj`

Hacer visible la acción sin obligar al usuario nuevo a llegar al final.

### P3.2 Certificado — gramática y formato visual

**Feedback:** `Y9KqNkY0H6Smk3ZtaDnR`

Corregir redacción tipo: "El presente certificado se emite a nombre de X. presenta..."

### P3.3 Sidebar de tests ordenado por evidencia

Requiere evidence library v0.1.

### P3.4 Número de sesión visible en workflow

Mostrar número de sesión actual en header o contexto clínico.

---

## Proyectos estratégicos — No tocar durante piloto activo

### S1 Evidence library v0.1

5 patologías frecuentes con Zotero como inbox, revisión clínica humana y commits aprobados.

### S2 Sócrates Modo 0

Blind spots documentales únicamente. Sin inferencia diagnóstica ni recomendaciones automáticas.

### S3 App del paciente / PHR / FHIR

Dirección estratégica definida en `PRODUCT_VISION.md`. Requiere spike FHIR R4 antes de Q4 2026.

### S4 TD-009 / ProfessionalWorkflowPage reconstruction

Refactor mayor de orquestación clínica, UI y generación de prompts. No iniciar durante piloto activo.

---

## Firestore feedback pendiente actual

| ID | Prioridad | Estado operativo |
|---|---|---|
| `YR3vDYSLiVxED4QcgJla` | P1 | Pendiente |
| `GFFCsyKOQR5BfHBMlydZ` | P2 | Pendiente; relacionado con memoria longitudinal/HEP |
| `3Igq6r9Ix7kcY5qVcZpo` | P2 | Pendiente |
| `V8yIlD0gnU0HO5Bi4OQf` | P2 | Pendiente |
| `M2ZGxfV1dEthDQsjm4qj` | P3 | Pendiente |
| `Q6SoxCsy8q254Gr9aAMF` | Estratégico | No implementar sin ledger |
| `Y9KqNkY0H6Smk3ZtaDnR` | P3 | Pendiente |

---

## Cierres recientes

| ID | Motivo |
|---|---|
| `eiVeXaNRN4K9FaeSTyaD` | Orden manual de cola clínica preservado |
| `BQ8iLZOUiQZYPGksPKhc` | HEP canónico respeta decisión del fisioterapeuta |
| `nzmUXDng3E3wK98WOH52` | Sugerencias automáticas de tests tratadas como safety |
| `NnKVxGN78dgHkk5y9xJ6` | Captura audio ongoing marcada resuelta por CEO |
| `jNOjK4urUjCcHrXxitUw` | Taxonomía ADR-009 para fotos clínicas contextuales |
