# Follow-up Workflow v2 — Definition of Done

Criterios **binarios** (cumple / no cumple). Ningún sprint se cierra con implementación parcial sin cumplir el bloque correspondiente.

---

## Barreras previas (gates)

**Gate A0 — Canon de datos (antes de Sprint A)**

- [ ] `hepCompliance` vive **solo** en `sessions/{id}` (no en `encounters` ni duplicado en otro doc como fuente de verdad).
- [ ] El spec o ADR interno de una línea dice explícitamente: *"fuente de verdad HEP compliance = sessions"*.

**Gate B0 — Integridad Firestore (antes de Sprint B)**

- [ ] Muestra de sesiones **follow-up del piloto** en UAT: cada documento relevante tiene al menos uno de `userId` / `authorUid` / `ownerUid` alineado con el usuario que actualiza (mismo criterio que `isOwner` en reglas).
- [ ] Lista documentada de IDs revisados o script de auditoría con salida "0 incumplimientos" para esa muestra.
- [ ] Si hay incumplimientos: plan de backfill **antes** de activar escrituras nuevas del Paso 2.

**Gate técnico global (CTO)**

- [ ] Documentado: *"PersistenceService: sin cambios de **API pública**; cambios de ensamblado de prompts/contexto en el **orquestador de workflow**."*

---

## Sprint A — Presentación del paciente (Paso 1)

**UI**

- [ ] Una **única** tarjeta contigua (no colapsables): tres zonas separadas con `border-t` (identidad + foco; contexto última sesión; HEP).
- [ ] "Foco hoy" refleja la fuente acordada (`nextSessionFocus` / plan previo — lo que ya definiste en código).
- [ ] Assessment última sesión: texto completo visible en briefing (sin `line-clamp` obligatorio), según tarjeta compacta Sprint B.

**HEP**

- [ ] Cada ítem del HEP muestra checkbox (o control equivalente) **antes** de iniciar la grabación principal del Paso 4.
- [ ] Cada toggle persiste en Firestore en `sessions/{id}.hepCompliance` como array de `{ itemId, done, date }` (forma mínima acordada).
- [ ] Sin error `permission-denied` al guardar compliance con usuario piloto en UAT.

**Validación piloto**

- [ ] Al menos **una** sesión real de prueba: reload de página → estado HEP coincide con lo guardado.
- [ ] Sign-off registrado (Slack/ticket): "Sprint A OK en piloto".

---

## Sprint B — ¿Cómo llega hoy? (Paso 2)

**Captura**

- [ ] Componente dedicado: un control **Iniciar / Detener** (clip **independiente** de la grabación del Paso 4).
- [ ] Duración esperada acotada en UX (p. ej. aviso 1–3 min); no graba el Paso 5 por el mismo control.

**STT**

- [ ] Transcripción producida por el **pipeline ya aprobado para piloto** (p. ej. Whisper existente) — **sin** nuevo proveedor ni nueva cuenta IAM solo para esto.
- [ ] `subjectiveAudioTranscript` guardado en `sessions/{id}` tras STT exitoso (o estado de error visible y reintentable).

**Integración SOAP (preparación)**

- [ ] El valor de `subjectiveAudioTranscript` está disponible para el orquestador que arma el prompt del **Paso 5 (SOAP)** como "subjetivo inicial" (aunque el refino de narrativa sea Sprint D si así lo partís).
- [ ] Criterio binario mínimo en esta etapa: en logs o en preview de desarrollo, el prompt de generación incluye el bloque de subjetivo del Paso 2 cuando existe.

**Compliance**

- [ ] Ticket o nota legal: clip Paso 2 cubierto por consentimiento vigente **o** aviso explícito pendiente (Gate legal documentado, no "falta silenciosa").

---

## Sprint D — Integración y validación clínica

**Orchestación**

- [ ] Flujo follow-up recorre Pasos **1 → 5** (más SOAP) con **un** paciente real sin usar atajos de desarrollo no productivos.
- [ ] Paso 4 (grabación) sin regresión: grabación principal, tabs/pipeline ES-CA, consent gate, `handleFinalizeSOAP` sin cambios de contrato indebidos.

**SOAP (Paso 5)**

- [ ] Subjetivo final combina narrativamente Paso 2 + transcripción de la sesión (grabación principal) según spec (criterio clínico: **aprobación** del fisio en checklist).
- [ ] Objetivo / plan reflejan **tratamiento ejecutado** e ítems in-clinic confirmados; no existe `proposedTreatmentPlan` intermedio en este flujo.

**Medición**

- [ ] Tiempo total flujo v2 vs. v1 anotado (aunque sea N pequeño).
- [ ] NPS o escala corta recogida post-sesión.

**Coste (editorial CTO)**

- [ ] Tabla de costes actualizada: **una** llamada Vertex a SOAP; sin fila de coste de propuesta intermedia eliminada.

---

## Cierre global del "programa v2"

- [ ] Todas las colecciones/campos nuevos citados en reglas o confirmados como cubiertos por reglas existentes en `sessions`.
- [ ] Ningún catch-all `document=**` en `firestore.rules`.
- [ ] Handoff a doc interno: política HEP en Plan vs narrativa SOAP (pregunta abierta del spec) **resuelta** o explícitamente "diferido a v2.1".

---

Con esto, **ningún sprint se cierra** solo con "el panel existe" o "Vertex responde": hace falta **persistencia correcta**, **reglas**, **trazabilidad** (`baselineId` en SOAP donde aplique), y **validación piloto** donde correspondía.
