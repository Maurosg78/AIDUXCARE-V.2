# Confirmación diagnóstico CTO — WO-IA-RESUME-01 y alineación de estado

**Fecha:** 2026-01-27  
**Rol:** Implementador (confirmación + propuesta)

---

## 1. ¿Estoy de acuerdo con el diagnóstico?

**Sí.** El diagnóstico del CTO es correcto:

| Afirmación CTO | Confirmación |
|----------------|--------------|
| WO-IA-RESUME-01 está bien implementado (motor de resume) | Correcto: resume=true + sessionId cargan sesión desde Firestore e hidratan estado; no se crea sesión nueva. |
| El problema no es el resume, sino el “camino” hasta él | Correcto: si la UI muestra “Initial Eval ✓” y “Start Follow-up” en vez de “Resume Initial Assessment”, el usuario nunca llega al flujo que ya reparamos. |
| Hay desalineación: Firestore (SOAP draft, sin baseline) vs UI (Completed, ✓) | Correcto: la SoT clínica debe ser única. |
| Hace falta alinear Dashboard/History/Quick Actions con el estado real | Correcto. |

Conclusión: **WO-IA-RESUME-01 arregla el destino; la alineación de estado arregla el camino.** Ambos son necesarios.

---

## 2. Qué ya está hecho (WO-DASHBOARD-01 = casi todo WO-STATE-ALIGN-01)

En el código actual, **WO-DASHBOARD-01** ya implementa la mayor parte de lo que el CTO describe como WO-STATE-ALIGN-01:

| Requisito CTO (WO-STATE-ALIGN-01) | Estado en código |
|-----------------------------------|------------------|
| Recalcular “Completed” solo si regla clínica (soapNote finalized) | Hecho: `patientVisits.data?.filter(v => (v.status === 'completed' \|\| v.status === 'signed') && v.soapNote?.status === 'finalized')` |
| Indicador Initial Eval ternario (No iniciado / Incompleto / Cerrado) | Hecho: ✓ cuando hasClosedInitial (initial + soapNote finalized + hasActiveBaseline), ⟳ cuando hasInitialPending, ? cuando no hay initial. |
| Quick Actions: si initial incompleto → “Resume Initial Assessment” | Hecho: initialNeedsClosure → botón amarillo con `sessionId=${initialVisit.id}&resume=true`. |
| Badge “Pending Closure” cuando SOAP no finalizado | Hecho: `(visit.status === 'draft' \|\| (visit.status === 'completed' && visit.soapNote?.status !== 'finalized'))` → “Pending Closure”. |

La **regla única** que pide el CTO ya está aplicada en el Dashboard:

> Initial Assessment está **CERRADO** solo si: (1) `soapNote.status === 'finalized'` y (2) `activeBaselineId` existe.

Todo lo demás se considera **INCOMPLETO** (⟳ o “Resume” o “Pending Closure”).

---

## 3. Hueco que sí falta: “View SOAP” en Visit History

Hoy en Visit History:

- **Click en fila:** si `visit.source === 'consultation'` → `/notes/${visit.id}`; si no (encounter/session) → solo `console.log`, no navega.
- **Botón “View SOAP →”:** solo navega cuando `visit.source === 'consultation'` → `/notes/${visit.id}`. Para visitas con `source === 'session'` o `'encounter'` no hace nada.

Para el caso Javier (visita desde **session**, SOAP draft):

- La visita viene de `usePatientVisits` (incluye sesiones desde WO-DASHBOARD-01), con `source: 'session'`, `type: 'initial'`, `soapNote.status: 'draft'`.
- Quick Actions ya muestra “Resume Initial Assessment” (correcto).
- Pero si el usuario hace click en la fila o en “View SOAP” para esa visita, **no se le lleva al workflow resumible**; o no navega (session) o iría a `/notes/` que puede ser ruta de consultas, no de sesión.

Por tanto, el único ajuste pendiente para cerrar el “camino” es:

- Para visitas con **SOAP no finalizado** (draft) y que sean **resumibles** (initial desde session/encounter):  
  **“View SOAP” y click en fila** deben llevar al workflow con `resume=true` y `sessionId=visit.id` (y patientId), no a `/notes/` ni quedar sin acción.

Eso es el **diff lógico** que falta; el resto de WO-STATE-ALIGN-01 ya está cubierto por WO-DASHBOARD-01.

---

## 4. Propuesta concreta

### Opción A — Cierre rápido (recomendada)

- **No** crear un WO-STATE-ALIGN-01 grande; tratar el tema como **cierre de WO-DASHBOARD-01**.
- **Implementar solo:** en `PatientDashboardPage`, para cada visita en Visit History:
  - Si la visita es **resumible** (initial + SOAP no finalizado + id usable como sessionId), entonces:
    - **Click en fila** y **“View SOAP →”** → `navigate(\`/workflow?type=initial&patientId=${patientId}&sessionId=${visit.id}&resume=true\`)`.
  - Si no es resumible (p. ej. consultation o SOAP ya finalizado), mantener comportamiento actual (p. ej. `/notes/${visit.id}` para consultas).
- Criterio resumible sugerido: `visit.type === 'initial' && visit.soapNote?.status !== 'finalized' && (visit.source === 'session' || visit.source === 'encounter')`. Para consultas, seguir yendo a `/notes/`.

Con esto:

- El CTO tiene la **regla única** ya aplicada (Dashboard + History alineados).
- “View SOAP” deja de ser inválido o vacío para el caso Javier y lleva al flujo de resume que ya funciona.

### Opción B — WO formal

- El CTO entrega **WO-STATE-ALIGN-01** listo para firma (objetivo: alinear UI con estado clínico real).
- Alcance explícito del WO: (1) Confirmar que Dashboard ya cumple regla única (sin cambios o con ajustes mínimos). (2) **Requerido:** “View SOAP” / click en fila para visitas con SOAP draft y resumibles → workflow con `resume=true` y `sessionId`.
- Se implementa según ese WO y se documenta en el mismo.

---

## 5. Resumen para el CTO

- **Diagnóstico:** de acuerdo: resume (WO-IA-RESUME-01) está bien; el problema visible es la UI que no deja llegar a él; la causa es desalineación de estado.
- **Estado real:** Casi toda la alineación ya está hecha en WO-DASHBOARD-01 (Completed, Initial Eval ternario, Quick Actions, Pending Closure). La regla única “cerrado solo si finalized + activeBaselineId” ya está en uso.
- **Falta:** solo que “View SOAP” y click en fila, para visitas initial con SOAP draft y source session/encounter, lleven al workflow con `resume=true` y `sessionId`.
- **Próximo paso sugerido:** aplicar el cambio de “View SOAP”/click fila (Opción A) y probar el caso Javier de punta a punta; si se prefiere trazabilidad formal, redactar WO-STATE-ALIGN-01 acotado a ese punto (Opción B).

Cuando confirmes si prefieres A o B, se puede bajar a cambios exactos de archivo/líneas y ejecutar sin refactors ni scope creep.
