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

**Gate C0 — Política Vertex (antes de Sprint C)**

- [ ] **Solo** la propuesta **aprobada** se persiste en `sessions/{id}.proposedTreatmentPlan` (o campo equivalente acordado).
- [ ] Borradores y rechazos **no** se escriben en Firestore (solo memoria / estado React hasta descartar o aprobar).
- [ ] AC explícito: tras recargar la página antes de aprobar, **no** reaparece una propuesta rechazada desde servidor.

**Gate técnico global (CTO)**

- [ ] Documentado: *"PersistenceService: sin cambios de **API pública**; cambios de ensamblado de prompts/contexto en el **orquestador de workflow**."*

---

## Sprint A — Presentación del paciente (Paso 1)

**UI**

- [ ] Una **única** tarjeta contigua (no colapsables): tres zonas separadas con `border-t` (identidad + foco; contexto última sesión; HEP).
- [ ] "Foco hoy" refleja la fuente acordada (`nextSessionFocus` / plan previo — lo que ya definiste en código).
- [ ] Assessment última sesión: **2–3 líneas** máx. visibles o truncado con acceso al detalle si aplica.

**HEP**

- [ ] Cada ítem del HEP muestra checkbox (o control equivalente) **antes** de iniciar la grabación principal del Paso 5.
- [ ] Cada toggle persiste en Firestore en `sessions/{id}.hepCompliance` como array de `{ itemId, done, date }` (forma mínima acordada).
- [ ] Sin error `permission-denied` al guardar compliance con usuario piloto en UAT.

**Validación piloto**

- [ ] Al menos **una** sesión real de prueba: reload de página → estado HEP coincide con lo guardado.
- [ ] Sign-off registrado (Slack/ticket): "Sprint A OK en piloto".

---

## Sprint B — ¿Cómo llega hoy? (Paso 2)

**Captura**

- [ ] Componente dedicado: un control **Iniciar / Detener** (clip **independiente** de la grabación del Paso 5).
- [ ] Duración esperada acotada en UX (p. ej. aviso 1–3 min); no graba el Paso 5 por el mismo control.

**STT**

- [ ] Transcripción producida por el **pipeline ya aprobado para piloto** (p. ej. Whisper existente) — **sin** nuevo proveedor ni nueva cuenta IAM solo para esto.
- [ ] `subjectiveAudioTranscript` guardado en `sessions/{id}` tras STT exitoso (o estado de error visible y reintentable).

**Integración SOAP (preparación)**

- [ ] El valor de `subjectiveAudioTranscript` está disponible para el orquestador que arma el prompt del **Paso 6** como "subjetivo inicial" (aunque el refino de narrativa sea Sprint D si así lo partís).
- [ ] Criterio binario mínimo en esta etapa: en logs o en preview de desarrollo, el prompt de generación incluye el bloque de subjetivo del Paso 2 cuando existe.

**Compliance**

- [ ] Ticket o nota legal: clip Paso 2 cubierto por consentimiento vigente **o** aviso explícito pendiente (Gate legal documentado, no "falta silenciosa").

---

## Sprint C — Ideas fisio + Propuesta Vertex (Pasos 3 y 4)

**Paso 3**

- [ ] Campo texto libre + dictado opcional; **no** obligatorio para avanzar.
- [ ] `therapistTreatmentIdeas` persistido en `sessions/{id}` cuando el usuario escribe algo (o política clara: solo persistir al "continuar" — pero **una** política y testeada).

**Red flags**

- [ ] Bloque visible **antes** de disparar / mostrar resultado de Vertex en Paso 4.
- [ ] Contenido derivado del mecanismo ya existente (no nuevo detector ad-hoc sin spec).

**Paso 4 — Vertex**

- [ ] Petición incluye **`baselineId` de referencia** (p. ej. `patient.activeBaselineId` o id efectivo usado) en payload/logs trazables para auditoría.
- [ ] Prompt incluye: subjetivo Paso 2 (si existe), HEP compliance Paso 1, ideas Paso 3, assessment baseline, perfil `users/{uid}` (`specialty`, `practiceAreas`, `techniques`, `experienceYears`) con degradación si arrays vacíos.
- [ ] UI muestra leyenda fija: **propuesta borrador — requiere aprobación** (o `t()` equivalente).

**Aprobación**

- [ ] Lista de ítems: cada uno **aprobado / editado / descartado** antes de cerrar el paso; **ninguna** ejecución "auto-aprobada".
- [ ] Solo versión **aprobada** escrita en `sessions/{id}.proposedTreatmentPlan` con `items: [{ technique, rationale, approved }]`.
- [ ] Recarga de página **después** de aprobar: plan aprobado visible; **después** de rechazar todo sin aprobar: sin rastro persistido de borradores rechazados.

**Perfil vacío**

- [ ] Si `practiceAreas` y `techniques` vacíos: mensaje no bloqueante invitando a completar perfil; flujo **no** se bloquea.

---

## Sprint D — Integración y validación clínica

**Orchestación**

- [ ] Flujo follow-up recorre Pasos **1 → 6** con **un** paciente real sin usar atajos de desarrollo no productivos.
- [ ] Paso 5 sin regresión: grabación principal, tabs/pipeline ES-CA, consent gate, `handleFinalizeSOAP` sin cambios de contrato indebidos.

**SOAP (Paso 6)**

- [ ] Subjetivo final combina narrativamente Paso 2 + transcripción Paso 5 según spec (criterio clínico: **aprobación** del fisio en checklist).
- [ ] Objetivo / plan reflejan **tratamiento ejecutado** y plan aprobado, no el texto crudo de borradores rechazados.

**Medición**

- [ ] Tiempo total flujo v2 vs. v1 anotado (aunque sea N pequeño).
- [ ] NPS o escala corta recogida post-sesión.

**Coste (editorial CTO)**

- [ ] Tabla de costes actualizada: delta **real** Paso 4 + incremento neto en Paso 6 (evitar doble conteo de SOAP si solo cambian inputs).

---

## Cierre global del "programa v2"

- [ ] Todas las colecciones/campos nuevos citados en reglas o confirmados como cubiertos por reglas existentes en `sessions`.
- [ ] Ningún catch-all `document=**` en `firestore.rules`.
- [ ] Handoff a doc interno: política HEP en Plan vs narrativa SOAP (pregunta abierta del spec) **resuelta** o explícitamente "diferido a v2.1".

---

Con esto, **ningún sprint se cierra** solo con "el panel existe" o "Vertex responde": hace falta **persistencia correcta**, **reglas**, **trazabilidad** (`baselineId`), **política de borradores**, y **validación piloto** donde correspondía.
