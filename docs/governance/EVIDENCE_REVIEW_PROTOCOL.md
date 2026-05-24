# Evidence Review Protocol — AiduxCare Clinical Evidence Library

**Versión:** 1.0
**Fecha:** 2026-05-24
**Autor:** Mauricio Sobarzo, Nº colegiado 9657 COFCV
**Estado:** Activo. Aplica a partir de este documento para cualquier commit nuevo
en `src/core/clinical-evidence/`
**Prerequisito de merge:** este protocolo debe estar completado antes de que
cualquier PR que añada un nuevo diagnóstico sea mergeado a `stable`

---

## Principio

Toda evidencia que alimenta el motor clínico de AiduxCare requiere doble revisión
independiente antes del commit. Un solo revisor no es suficiente para evidencia que
puede influir en decisiones terapéuticas de fisioterapeutas en contexto clínico real.

La doble revisión no es burocracia — es el control que distingue "evidencia curada"
de "evidencia seleccionada por el interesado." Sin este control, la evidence library
no es un activo regulatorio: es un riesgo.

---

## Roles

### Revisor 1 — CTO clínico interno

**Nombre:** Mauricio Sobarzo
**Nº colegiado:** 9657 COFCV
**Rol en AiduxCare:** CEO / CTO
**Responsabilidad:** preparar el paquete de revisión, aplicar criterios técnicos
iniciales (GRADE, PEDro), hacer la propuesta de aprobación o rechazo con justificación.

### Revisor 2 — Fisioterapeuta externo por diagnóstico

**Requisitos de independencia (todos obligatorios):**
- Sin equity en AiduxCare (acciones, opciones, participaciones)
- Sin relación de empleo actual o en los 12 meses anteriores con AiduxCare
- Con número de colegiado activo (España: CGCFE colegio autonómico; Canadá: CPO)
- Con expertise específico documentable en el diagnóstico a revisar
  (publicaciones, formación acreditada, o experiencia clínica ≥ 3 años en la condición)
- Honorarios documentados por la revisión (el pago establece la relación de
  servicio y documenta que el revisor tiene incentivo a revisar, no a aprobar)

**Declaración de conflicto de interés requerida:**
El Revisor 2 debe firmar: "Declaro que no tengo relación financiera con AiduxCare,
ni con los autores o instituciones de los estudios revisados en este paquete."

---

## Proceso paso a paso

### Paso 1 — Preparación del paquete (Revisor 1)

Para cada estudio candidato, el Revisor 1 prepara:

```markdown
## Estudio: [título corto]

**Referencia completa:** [autores, año, journal, DOI]
**Diseño del estudio:** [RCT / revisión sistemática / meta-análisis / otro]
**Acceso al full text:** [URL o adjunto]
**Abstract consistente con full text:** [Sí / No / Parcialmente — justificar]

**Score PEDro:** [N/10] — si no aplica, justificar por qué
**Evaluación GRADE:** [Alto / Moderado / Bajo / Muy bajo]
**GRADE justificado por:** [risk of bias / inconsistencia / indirección /
  imprecisión / sesgo de publicación]

**Métricas clave extraídas:**
- [sensibilidad / especificidad / NNT / effect size / lo que aplique]

**Población del estudio:**
- N: [número de participantes]
- Edad: [rango o media]
- Diagnóstico principal: [exacto]
- Exclusiones: [condiciones excluidas del estudio]

**Limitaciones identificadas:**
- [listar todas las limitaciones relevantes para la población de AiduxCare]

**Conflicto de interés del estudio:** [declarado / no declarado / ninguno visible]

**Propuesta Revisor 1:** [Aprobar / Rechazar / Aprobar con limitaciones]
**Justificación:** [texto libre]
```

### Paso 2 — Revisión independiente (Revisor 2)

El Revisor 2 recibe el paquete y evalúa independientemente:
- Lee el full text (no solo el resumen del Revisor 1)
- Completa el checklist de aprobación
- Firma su evaluación sin ver la evaluación del Revisor 1 (revisión ciega)

### Paso 3 — Resolución de discrepancias

Si ambos revisores coinciden: se procede con el resultado acordado.
Si discrepan:
- Reunión de 30-60 minutos para discutir la discrepancia
- Decisión documentada con razonamiento de la posición final
- Si no se resuelve: el estudio queda en `pending_review` en Zotero hasta que
  se obtiene criterio adicional (tercer revisor, consulta al autor, evidencia adicional)

### Paso 4 — Commit con evidencia de doble revisión

El mensaje de commit en `src/core/clinical-evidence/` debe incluir:

```
feat(evidence): add [diagnóstico] — [nombre del estudio corto]

Revisor 1: Mauricio Sobarzo, Nº colegiado 9657 COFCV — [fecha] — Aprobado
Revisor 2: [nombre], Nº colegiado [X] — [institución/independiente] — [fecha] — Aprobado
Scope: [diagnóstico exacto] / [población] / [intervención aprobada]
Revisión válida hasta: [fecha máxima — máximo 3 años]
Limitaciones declaradas: Sí (ver campo limitations en el archivo)

ROADMAP_READ COMPLIANCE_CHECKED
```

---

## Checklist de aprobación (completar independientemente ambos revisores)

```markdown
□ Diseño del estudio: RCT / revisión sistemática / meta-análisis
□ Score PEDro ≥ 6/10 (si estudio individual) O justificación de excepción
□ GRADE: moderado o alto
□ Publicación 2018+ (o evidencia seminal con justificación explícita de por qué
  no existe evidencia más reciente)
□ Full text leído completo (no solo abstract)
□ Abstract es consistente con conclusiones del full text
□ Población del estudio es representativa de la población objetivo de AiduxCare
  (fisioterapia MSK, adultos, España / Ontario)
□ Limitaciones del estudio están declaradas en el campo `limitations` del archivo
  TypeScript (no omitidas)
□ Conflicto de interés del estudio analizado y sin influencia material en conclusiones
□ Revisor externo confirma: sin relación financiera con AiduxCare ni con autores

Resultado: [Aprobado / Rechazado / Aprobado con limitaciones específicas]
Firma: [nombre], Nº colegiado [X], fecha [YYYY-MM-DD]
```

---

## Criterios para revisión externa obligatoria

Los siguientes casos requieren que el Revisor 2 sea un especialista con experiencia
publicada en el área (no solo colegiado con experiencia clínica general):

- Evidencia sobre diagnósticos que incluyan señales de alarma (red flags)
- Evidencia sobre contraindicaciones de tratamiento físico
- Evidencia sobre poblaciones especiales: embarazo, adultos mayores (>75 años),
  patología sistémica comórbida (diabetes con neuropatía, cardiopatía, etc.)
- Cualquier evidencia donde el PEDro score es <6 y se propone una excepción

---

## Proceso de actualización de evidencia existente

Cuando el script de monitoreo PubMed/PEDro detecta nueva publicación para un diagnóstico:

1. Nueva evidencia entra a Zotero con estado `pending_review`
2. Revisor 1 evalúa dentro de los 30 días siguientes:
   - **¿Es confirmatoria?** (refuerza lo que ya está aprobado)
     → Revisión CTO + nota en el archivo TypeScript + no requiere Revisor 2
   - **¿Es actualizadora?** (añade nueva información relevante)
     → Proceso completo de doble revisión
   - **¿Es contradictoria?** (contradice o limita evidencia aprobada)
     → Revisión urgente: suspensión preventiva de la evidence card afectada
       hasta que se resuelva la contradicción
3. Si la revisión supera la `reviewByDate` del archivo: proceso completo de revisión
   aunque no haya nueva evidencia disponible

---

## Estado del protocolo en diagnósticos actuales

| Diagnóstico | Estado | Revisores | Fecha | Valid Until |
|---|---|---|---|---|
| fascitis-plantar | Pendiente doble revisión | Revisor 1 solo hasta ahora | — | — |
| [próximos diagnósticos] | Sin evidencia aún | — | — | — |

**Acción requerida:** el diagnóstico `fascitis-plantar` en `src/core/clinical-evidence/`
debe pasar por revisión completa con Revisor 2 externo antes de que Sócrates Modo 1.5
pueda usar su evidencia. Hasta que eso ocurra, el status de ese diagnóstico debe ser
`pending_independent_review`, no `approved`.

---

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-05-24 | Versión inicial. Protocolo completo de doble revisión. |

---

*Documento interno de gobernanza clínica. No contiene datos de pacientes.*
*Fuentes: MDCG 2019-11 · ISO 14971:2019 · ADR-004 · ADR-007 · ENGINEERING.md v1.10*
