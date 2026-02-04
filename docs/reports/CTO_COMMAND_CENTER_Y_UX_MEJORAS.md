# Informe: Command Center y UX — Mejoras acordadas para afinar con CTO

**Fecha:** Febrero 2026  
**Objetivo:** Documentar las ideas de producto y UX discutidas (Command Center, schedule, flujo rápido, tokens, identificación de sesión) para alinear con CTO y priorizar implementación.

---

## 1. Resumen ejecutivo

Se identificaron **cinco ejes** de mejora que impactan adopción y uso diario en clínica:

| Eje | Decisión / dirección | Estado |
|-----|----------------------|--------|
| **Tokens en UI** | Eliminar por completo de la experiencia del usuario | Por implementar |
| **Identificación de sesión** | 1ª = primera siempre, 2ª = segunda; tipo (Initial/Follow-up) por dato, no por orden | Parcialmente implementado |
| **Schedule (Today's Patients)** | Definir origen de datos y CTA cuando está vacío | Por definir + implementar |
| **Flujo rápido a grabación** | Objetivo: ≤2 clics desde abrir app hasta estar grabando | Por diseñar + implementar |
| **Command Center más intuitivo** | Initial y Follow-up visibles desde el inicio; menos características ocultas | Por diseñar + implementar |

---

## 2. Tokens: eliminación en producto

**Contexto:** Los tokens ya no se usarán (o no deben ser parte de la experiencia del usuario).

**Acciones acordadas:**

- Quitar **badges** “X tokens” de todas las tarjetas del Command Center (Start New Patient, Continue Existing Patient, opciones de tipo de sesión).
- Eliminar **copy** que mencione “tokens” en pantallas de flujo clínico.
- Mantener lógica de billing/uso en backend si aplica; no exponerla en la UI como concepto de “créditos”.

**Nota para CTO:** Confirmar si existe tracking interno (métricas, límites por plan) que deba seguir existiendo sin mostrarse al usuario.

---

## 3. Identificación de sesión (1ª, 2ª, 3ª…)

**Problema:** En Patient context y Visit History la “primera” sesión debe ser siempre la primera en orden cronológico, y la “segunda” la segunda, con independencia de que la visita sea Initial Assessment o Follow-up. Además, en Visit History todas las visitas aparecían como “Initial Evaluation” por no persistir `sessionType`.

**Cambios ya hechos en código:**

- **Util `getSessionOrdinalLabel(sessionNumber)`:** Etiquetas “First session”, “Second session”, … “Tenth session” (o “Session N”) usadas en Patient context (ProfessionalWorkflowPage y FollowUpWorkflowPage) para que el ordinal sea siempre cronológico.
- **Persistencia de `sessionType`:** Al crear/actualizar sesión en ProfessionalWorkflowPage se envía `sessionType: currentSessionType` ('initial' | 'followup') en el payload a Firestore, para que Visit History muestre correctamente Initial vs Follow-up.
- **Legacy en usePatientVisits:** Para sesiones sin `sessionType` (datos antiguos), se asigna tipo por orden cronológico: primera sesión = Initial, siguientes = Follow-up.

**Pendiente para CTO:** Ninguno crítico; validar en UAT que Visit History y Patient context muestren bien ordinal y tipo en datos nuevos y legacy.

**Nota CTO (copy):** “First session” está bien internamente; en UI clínica visible puede funcionar mejor **“Session 1”**, **“Session 2”** (más neutral, menos narrativa). Decidir más adelante; queda en radar.

---

## 4. Schedule: cómo se alimenta “Today's Patients”

**Pregunta:** ¿De dónde salen las citas y desde dónde se agregan?

**Propuesta en capas (para afinar con CTO):**

| Capa | Descripción | Fuente de datos |
|------|-------------|-----------------|
| **0 – Sin agenda** | Hoy: “No appointments scheduled”. Opción: mostrar “Recently seen” (últimos N pacientes) para arrancar follow-up en 1–2 clics. | Ninguna / sesiones recientes |
| **1 – Agenda interna (MVP)** | Botón “Add appointment” (o “Schedule”) que abre modal mínimo: Paciente + Fecha/hora + Tipo (Initial / Follow-up). Esas filas alimentan “Today's Patients” con CTA “Start session”. | Firestore (colección `appointments` o equivalente) |
| **2 – Integración (futuro)** | Misma UI de lista; el origen pasa a ser EMR / Google Calendar / etc. | API o sync externo |

**Decisiones a tomar:**

- ¿Existe ya modelo/colección de citas en backend? Si no, definir schema mínimo (patientId, startTime, type, clinicId/userId).
- ¿El MVP de piloto usa solo Capa 0 (empty + “Start in-clinic session now”) o ya Capa 1 (agenda interna)?
- Si Capa 1: dónde vive el CTA “Add appointment” (en el card “Today's Patients”, en header, etc.).

**✅ Decisión CTO (post-feedback):** Para piloto, **no** agenda interna completa. Quedarse en **Capa 0 + pizca de Capa 1**:
- **Capa 0:** “Today’s patients” = últimos pacientes vistos (recency-based). CTA fuerte: **“Start in-clinic session now”**.
- **Capa 1 (mínima):** NO “Add appointment”. SÍ “Resume with last patient” / “Start follow-up”.
- Agenda explícita (citas con fecha/hora) → **post-piloto**. Riesgo de scope creep y lecturas tipo “EMR light” por Niagara/MaRS.

---

## 5. Flujo rápido: menos clics hasta grabar

**Objetivo:** En consulta, el fisio abre la app y en **máximo 2–3 acciones** está en disposición de grabar (workflow con paciente y tipo de sesión decididos).

**Situación actual (resumida):** Varios pasos: elegir paciente, expandir “Start Clinical Session”, elegir tipo, navegar a workflow. Más de 2 clics en el caso típico.

**Propuesta de flujo objetivo:**

1. **Above the fold en Command Center**
   - Si hay **citas para hoy:** primera fila = “Próxima cita en X min” (o lista de hoy) + botón **“Start session”** por cita. Un clic → workflow con patientId y type ya definidos → grabación lista.
   - Si **no hay citas:** un botón dominante **“Start in-clinic session now”**.

2. **Comportamiento de “Start session” (con cita)**  
   Navegar a `/workflow?patientId=…&type=initial|followup` según la cita. Sin pasos intermedios.

3. **Comportamiento de “Start in-clinic session now” (sin cita)**  
   - Paso 1: selector de paciente (búsqueda rápida o dropdown).  
   - Paso 2 (si el paciente tiene historial): “¿First visit or follow-up?” (dos botones).  
   - Luego → mismo `/workflow` con parámetros correctos.

**Métrica sugerida:** “Número de clics (o taps) desde carga del Command Center hasta que la pantalla de workflow está lista para grabar.” Objetivo: ≤2 en caso con agenda; ≤3 en caso sin agenda.

**Para CTO:** Validar rutas y query params actuales (`/workflow`, `type`, `patientId`, `resume`) para que este flujo no duplique lógica y reutilice detección de tipo y consent cuando aplique.

**⚠️ Alerta CTO — Consent gate:** El objetivo ≤2–3 clics es correcto, pero el **consent gate nunca puede sentirse “saltable”**. Si no hay consentimiento válido, el flujo debe interrumpirse con claridad (sin parecer error, sin frustrar): ej. “Before we continue, please confirm consent…”. UX suave, gate duro.

---

## 6. Command Center: más intuitivo y menos fricción

**Problemas identificados:**

- Initial Assessment y Follow-up no están nombrados como tales en la primera pantalla (“Start New Patient” vs “Continue Existing” no dice “Follow-up”).
- El tipo de sesión (Initial / Follow-up / WSIB / etc.) está “escondido” tras elegir paciente y expandir una tarjeta.
- Muchas acciones secundarias (Pending notes, Clinical Vault, etc.) compiten con el flujo principal o no son obvias.

**Direcciones acordadas (sin bajar aún a wireframes):**

1. **Dos flujos explícitos desde el inicio**  
   - **Nueva evaluación (Initial Assessment):** “Primera vez con este paciente.”  
   - **Seguimiento (Follow-up):** “Ya lo conozco; es otra sesión.”  
   Incluir estas etiquetas en las tarjetas o subtítulos para que un usuario nuevo entienda las dos opciones sin explorar.

2. **Menos clics para Follow-up**  
   Al elegir un paciente existente, ofrecer de forma directa:  
   - Acción principal: **“Start follow-up”** (un clic → workflow follow-up).  
   - Secundaria: “View history”.  
   Evitar que “Follow-up” viva solo dentro de “Start Clinical Session” expandible.

3. **Un solo “hub” por paciente**  
   Cuando hay un paciente seleccionado, una sola zona clara: “¿Qué hacemos con [Nombre]?” con botones: Start follow-up (o Initial si no tiene historial) y View history. **Para piloto:** WSIB / MVA / Certificate **ocultos en secondary path** (“More options”). No mostrar demasiadas decisiones upfront; en clínica, decidir menos = usar más. (Alerta CTO.)

4. **Tokens fuera de la decisión**  
   Como en §2: no mostrar coste en tokens en las tarjetas para no añadir ruido a la decisión clínica.

5. **Today's Patients + empty state**  
   Si no hay citas: mensaje claro + CTA “Start in-clinic session now” (alineado con §5). Si luego hay agenda interna, añadir “Add appointment” en o junto a ese bloque.

---

## 7. Validación CTO (post-feedback)

- **Enfoque:** Correcto. El documento ataca los bloqueadores de adopción clínica real; no “UX bonito” sino reducción de fricción clínica.
- **Prioridades valoradas:** Tokens fuera, sesión ≠ tipo de visita, menos clics hasta grabar, Command Center como decisor rápido.
- **Uso externo:** Con este documento ya se puede hablar con DMZ, MaRS, Waterloo y transmitir que se refina el workflow con criterio clínico y sin scope creep.

**Qué NO hacer ahora (CTO):** Wireframes detallados, rediseño visual completo, agenda interna completa, nuevas features clínicas. Simplificar sin empobrecer.

---

## 8. Siguiente paso acordado: WO-UX-01 — Command Center Fast Path (Pilot)

**Objetivo único:** Reducir fricción para empezar una sesión clínica **sin tocar backend crítico**.

**Scope (muy acotado):**

| # | Entregable | Detalle |
|---|------------|---------|
| 1 | Eliminar tokens visibles | Quitar badges/copy de tokens en Command Center y flujos de sesión. |
| 2 | Dos CTAs explícitos | Command Center muestra claramente “Start Initial Assessment” y “Start Follow-up”. |
| 3 | Empty state claro | “No scheduled patients today” + CTA **“Start in-clinic session now”**. |
| 4 | Flujo ≤3 acciones | CC → Workflow en ≤3 acciones (respetando consent gate). |
| 5 | Sin agenda interna | No nuevas colecciones; no “Add appointment”. |

**Criterio de éxito:** Un fisio puede abrir la app y empezar una sesión **sin pensar**.

**Spec ejecutable para dev:** Ver `docs/wo/WO-UX-01-command-center-fast-path.md`.

---

## 9. Próximos pasos (actualizados)

| Prioridad | Acción | Responsable |
|-----------|--------|-------------|
| 1 | **WO-UX-01** — Implementar Command Center Fast Path (Pilot) según spec | Dev |
| 2 | Validar consent gate en flujo rápido (no saltable, mensaje claro) | Dev + Producto |
| 3 | Decidir copy ordinal: “First session” vs “Session 1” en UI visible | Producto |
| 4 | Redactar Clinical User Guide (Pilot Edition) tras confirmar 3 decisiones del outline | Producto |

---

## 10. Referencias técnicas rápidas

- **Session ordinal:** `src/utils/sessionOrdinalLabel.ts` — `getSessionOrdinalLabel(sessionNumber)`.
- **Persistencia sessionType:** `ProfessionalWorkflowPage.tsx` — payloads a `sessionService.createSessionWithId` / `updateSession` incluyen `sessionType: currentSessionType`.
- **Visit History tipo:** `src/features/patient-dashboard/hooks/usePatientVisits.ts` — lógica legacy por orden cronológico cuando falta `sessionType`.
- **Command Center:** `CommandCenterPage.tsx`, `WorkWithPatientsPanel.tsx`; flujo en dos pasos (patient-selection → session-type-selection) y uso de `SessionTypeSelection`, `PrimaryActionCard`, `PatientsListDropdown`.

---

*Documento alineado con CTO. Siguiente ejecución: WO-UX-01 (Command Center Fast Path — Pilot).*
