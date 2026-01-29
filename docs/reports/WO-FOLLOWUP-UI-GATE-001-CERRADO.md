# WO-FOLLOWUP-UI-GATE-001 — Cerrado

**Título:** Follow-up UI Gate — Baseline obligatorio antes de Vertex  
**Estado:** Cerrado  
**Fecha:** 2026-01-27  

---

## Objetivo cumplido

Garantizar que **no exista Follow-up** si el paciente **no tiene baseline clínico válido**, usando exclusivamente `buildFollowUpClinicalBaseline(patientId)`.

- Si no hay baseline: no se construye prompt, no se llama a Vertex, no se muestra botón de generar SOAP; se muestra mensaje clínico claro.

---

## Cambios realizados (solo UI / orquestación)

| Archivo | Cambio |
|---------|--------|
| `src/pages/FollowUpWorkflowPage.tsx` | 1) Import de tipo `FollowUpClinicalBaseline`. 2) Sección 3 (Clinical Conversation Capture) envuelta en `showFollowUpFlow`: cuando Follow-up está bloqueado no se renderiza transcripción ni botón "Generate Follow-up SOAP". |

**Ya existían (sin modificar):**

- Gate en mount: `buildFollowUpClinicalBaseline(patientId)` al montar; `FollowUpNotAllowedError` → `followUpBlocked = true`.
- Estado bloqueado: mensaje "Follow-up not available" + texto clínico (Initial Assessment o baseline primero).
- Spinner "Checking clinical history…" mientras carga baseline.
- Botón Generate SOAP solo en flujo permitido (secciones 2, 3 y 4 bajo `showFollowUpFlow`).
- Guardrail en `handleGenerateSOAPFollowUp`: `if (!baseline) throw new Error('Invariant violated: Follow-up attempted without baseline')`.

---

## DoD — Confirmación

### Funcional
- [x] Follow-up no se puede iniciar sin baseline válido
- [x] `FollowUpNotAllowedError` bloquea el flujo
- [x] Vertex no es llamado sin baseline
- [x] Prompt V3 no se construye sin baseline
- [x] El usuario entiende por qué no puede continuar (mensaje clínico)

### UX
- [x] Mensaje clínico claro (no técnico)
- [x] No hay botones inútiles cuando está bloqueado
- [x] No hay estados ambiguos
- [x] No aparece "SOAP invalid / missing fields" cuando el problema es baseline (flujo bloqueado no llega a SOAP)

### Técnico
- [x] Cero cambios en servicios IA
- [x] Cero cambios en baseline builder
- [x] Build pasa
- [x] Tests existentes (baseline, prompt V3, parser) pasan

### Verificación manual (UAT)
- [ ] Paciente sin historia → Follow-up bloqueado
- [ ] Paciente con IA o baseline manual → flujo completo funciona
- [ ] Console limpia (sin logs legacy)
- [ ] SOAP visible cuando corresponde

*(Las casillas UAT se marcan tras capturas bloqueado / permitido.)*

---

## Referencias

- WO-BASELINE-001, WO-PROMPT-FOLLOWUP-V3, WO-PARSER-ROBUST-SOAP — sin cambios.
- INFORME_CTO_FOLLOWUP_SESION_PREVIA_Y_SOAP_UAT.md — hipótesis que este WO corrige a nivel UI.
