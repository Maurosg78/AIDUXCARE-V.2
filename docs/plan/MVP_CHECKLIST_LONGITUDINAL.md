# Checklist MVP — Motor longitudinal y Clinical Reasoning

**Alcance:** MVP **solo para España** (mercado ES).

**Objetivo:** Tener el MVP “completo” desde la perspectiva del motor longitudinal, consideraciones clínicas, informe derivador y Patient Clinical Memory.

---

## ✅ Completado (esta línea de trabajo)

| Área | Estado | Notas |
|------|--------|--------|
| **Fase A** Contexto longitudinal en follow-up | ✅ | longitudinalSummary, SessionComparisonService, en prompt V3 |
| **Fase B** Plan anterior en prompt (solo contexto) | ✅ | previousPlansSummary, guardrails en buildFollowUpPromptV3 |
| **Fase C** AI considerations | ✅ | generateFollowUpAnalysis, considerations, UI “Insert into plan” con [AI considerations reviewed] |
| **Trajectory** Clasificador + pain series | ✅ | trajectoryClassifier, ventana 3 sesiones, confidence |
| **Trajectory en informe derivador** | ✅ | Frase de evolución automática (Clinical evolution), guardrail painSeries≥2 y confidence≠low |
| **Patient Clinical Memory** | ✅ | Eventos en Firestore, patrones (plateau, improvement, fluctuating_persistent), ventana 90 días, UI “AI Patient Pattern Insight” |
| **Guardrails regulatorios** | ✅ | logRegulatoryLanguageWarnings en follow-up, consideraciones/prompt sin diagnóstico ni recomendación |
| **Persistencia SOAP + encounter (ProfessionalWorkflowPage)** | ✅ | Save/finalize → Clinical Vault, create/update encounter con SOAP, recordEncounterTrajectory en follow-up |

---

## ✅ Cierre MVP longitudinal (ruta unificada)

| Ítem | Estado | Notas |
|------|--------|--------|
| **Unificación follow-up** | ✅ | Quien use solo la ruta “Follow-up” (página paralela) Ruta `/follow-up` redirige a `/workflow?type=followup&patientId=...`. Ver `FollowUpRedirect.tsx`. |

(Redirige a ProfessionalWorkflowPage; no hay doble flujo.) (persistir SOAP, crear/actualizar encounter con SOAP, llamar `recordEncounterTrajectory` en follow-up) o documentar que la ruta “oficial” de follow-up es la de ProfessionalWorkflowPage y ocultar/redirigir la otra.

---

## 🟡 Opcional (no bloqueante para MVP)

| Ítem | Notas |
|------|--------|
| **SessionPatternAnalysis (Fase D)** | Patrones por tipo de intervención (ej. “exercise → improvement”); requiere más datos y sesiones. Plan lo deja para después. |
| **Trajectory con 3+ puntos en classifier** | Mejora de precisión; ya hay ventana de 3 sesiones. |
| **Más patrones en Patient Clinical Memory** | Añadir reglas según feedback clínico. |
| **Tests E2E / integración** | EXECUTION_TRACKER Days 5–6 (Physical Tests UI, Integration Testing). |
| **Launch prep (Day 7)** | ✅ Cubierto por la sección «Pre-lanzamiento piloto España» más abajo (build/env, consentimiento, verificación rápida). |

---

## Resumen

- **Para que el MVP esté “completo” en esta línea:** ruta de follow-up unificada; `/follow-up` redirige a `/workflow?type=followup`. Pipeline siempre completo.
- **Valor longitudinal operativo** en la única ruta oficial (ProfessionalWorkflowPage).
- **Piloto España (flujo e2e):** listo — initial → SOAP/encounter → follow-up (ruta unificada) → trajectory, memory, considerations, informe derivador. Tests E2E automatizados son opcionales (no bloquean go-live).

---

## Completado pre-lanzamiento (formulario + doc)

| Ítem | Estado |
|------|--------|
| Formulario de bugs y sugerencias (FeedbackWidget/Modal) | ✅ Textos en español vía i18n (`feedback.widget.*`, `feedback.modal.*`). |
| Config ES-ES consent | ✅ `verbalVersionId: 'v1-es-ES-verbal'`, `writtenVersionId: 'v1-es-ES-written'` en JurisdictionEngine. |
| Documentación env piloto España | ✅ `.env.local.example` documenta `VITE_ENABLE_ES_PILOT=true`. |

---

## Pre-lanzamiento piloto España (go-live lunes)

Checklist de un vistazo: [GO_LIVE_PILOTO_ESPAÑA.md](./GO_LIVE_PILOTO_ESPAÑA.md).

| Ítem | Acción |
|------|--------|
| **Build/env** | En el entorno de despliegue España, definir `VITE_ENABLE_ES_PILOT=true` (build-time). Así la UI arranca en español y el texto de revisión SOAP usa normativa europea/española/autonómica. |
| **Consentimiento** | Ya conectado: con el flag ES se usa `v1-es-ES-verbal` (texto en español en `consentTexts.ts`). |
| **Verificación rápida** | `pnpm typecheck` y `pnpm build`; abrir flujo, comprobar gate de consentimiento en español, pestaña SOAP en español y mensaje de revisión con "normativa aplicable y colegio profesional de tu comunidad autónoma". |
| **Opcional** | ✅ `.env.local.example` documenta `VITE_ENABLE_ES_PILOT=true` para piloto España. |
