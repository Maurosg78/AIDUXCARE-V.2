# SaMD Classification Memo — AiduxCare + Sócrates

**Versión:** 0.1
**Fecha:** 2026-05-24
**Autor:** Mauricio Sobarzo, Nº colegiado 9657 COFCV
**Estado:** Borrador activo — cubre Modo 0. Requiere expansión a v1.0 antes de Modo 1.5.
**Próxima revisión:** antes del primer commit de Sócrates Modo 1.5 en `stable`

---

> Este documento evalúa el sistema AiduxCare + Sócrates bajo los marcos regulatorios
> aplicables. No es un documento de marketing. Es el análisis funcional que determina
> qué compliance es necesario antes de cada modo de Sócrates.

---

## 1. Sistema evaluado

### AiduxCare Modo 1 — Reducción de carga documental

Captura audio de sesiones clínicas, genera transcripción mediante Whisper, procesa
la transcripción con Vertex AI Gemini para generar SOAP estructurado. El fisioterapeuta
revisa y aprueba el SOAP antes de que se convierta en registro clínico. Sin aprobación
explícita del fisio, el SOAP no existe como documento clínico.

Datos de entrada: audio de sesión, adjuntos (PDF, imágenes con OCR), perfil profesional.
Output: SOAP estructurado propuesto para revisión. Red flags identificadas. Medicación
extraída de documentos adjuntos con atribución de fuente.
Grado de autonomía: ninguno. Todo output requiere revisión y aprobación del fisio.

### Sócrates Modo 0 — Ledger documental puro

Organiza en estructura tipada los hechos documentados, observaciones IA y decisiones
del fisioterapeuta de una sesión o de sesiones longitudinales. No genera nueva información
clínica. No presenta evidencia bibliográfica. No produce ningún output visible al
fisioterapeuta más allá de la organización de información ya existente en el sistema.

Datos de entrada: SOAP aprobado, decisiones clínicas documentadas, transcripción.
Output: estructura ClinicalContextLedger con taxonomía hecho/inferencia/decisión.
Grado de autonomía: ninguno. Es infraestructura de datos, no interfaz clínica.

### Sócrates Modo 1.5 — Evidence cards bajo demanda [NO IMPLEMENTADO]

[PENDIENTE — completar antes de cualquier código de Modo 1.5]
Descripción funcional, datos de entrada, output, grado de autonomía.

### Sócrates Modo 2 — Chat con ledger longitudinal [NO IMPLEMENTADO]

[PENDIENTE — completar antes de cualquier código de Modo 2]
Descripción funcional, datos de entrada, output, grado de autonomía.

---

## 2. Árbol de decisión MDCG 2019-11

### Modo 1 — AiduxCare documentación

**¿El software tiene propósito médico declarado?**
Sí. Genera documentación clínica (SOAP) que forma parte del historial médico del paciente.

**¿El output informa/orienta decisiones para pacientes individuales?**
Parcialmente. El SOAP documenta lo ocurrido en la sesión pero la decisión terapéutica
ya fue tomada por el fisio durante la sesión. El SOAP es registro posterior, no guía
prospectiva de tratamiento.

**¿El software usa datos del paciente individual como input?**
Sí. Audio de la sesión, adjuntos, perfil del paciente.

**¿La salida puede influir en el manejo clínico de ese paciente?**
Indirectamente. El SOAP se usa como referencia en sesiones futuras.

**Conclusión Modo 1:** Zona gris entre documentación clínica electrónica (no SaMD bajo
MDCG 2019-11) y CDS de bajo nivel. La posición conservadora es diseñar como si fuera
potencial SaMD Clase I y documentar el análisis. El intended use actual ("clinical
documentation support") permanece dentro del régimen de EHR/documentación en la
mayoría de las interpretaciones disponibles siempre que el sistema no genere
recomendaciones terapéuticas prospectivas sin revisión humana.

### Modo 0 — Sócrates ledger puro

**¿El software tiene propósito médico declarado?**
Como infraestructura de datos: no directamente. El propósito es organizar información
ya existente con taxonomía de origen (hecho/inferencia/decisión).

**¿El output informa/orienta decisiones para pacientes individuales?**
No. Modo 0 no produce output visible al fisioterapeuta ni presenta información
que no estuviera ya disponible en el sistema.

**Conclusión Modo 0:** Fuera del espacio SaMD en su forma actual. Análogo a una
capa de persistencia estructurada de EHR. La condición para mantener esta conclusión
es que el código de Modo 0 no incluya interfaces de Modo 1.5/2 ni ninguna función
de presentación de evidencia, aunque sea dormida.

### Modo 1.5 — Evidence cards [ANÁLISIS PENDIENTE]

[COMPLETAR antes de código Modo 1.5]

Preguntas a responder:
- ¿La priorización contextualizada de evidencia bibliográfica entra en MDCG 2019-11
  Ejemplo 6: "filtering or ordering a list of prioritized... therapeutic options
  for a specific patient"?
- ¿Aplica Health Canada CDS exclusion: "matching patient-specific information with
  reference information" sin replacement de juicio clínico?
- ¿El criterio de ordenamiento transparente en UI mitiga la clasificación?

### Modo 2 — Chat con ledger [ANÁLISIS PENDIENTE]

[COMPLETAR antes de código Modo 2]

---

## 3. Aplicación IMDRF N12 [PENDIENTE para Modos 1.5 y 2]

Cuando se complete el análisis MDCG para Modos 1.5/2, aplicar los dos ejes IMDRF:

- Eje 1: Significancia del output (inform / drive / treat or diagnose)
- Eje 2: Estado de la condición (non-serious / serious / critical)
- Clase resultante: I / IIa / IIb / III

Hipótesis de trabajo para Modo 1.5 (fisioterapia MSK, evidencia bajo demanda):
- Eje 1: inform (el fisio consulta y decide — no acción inmediata)
- Eje 2: non-serious a serious (fisioterapia MSK raramente crítica)
- Clase probable: I o IIa — verificar con análisis completo

---

## 4. Evaluación EU AI Act

**Modo 0:** No entra en Annex III. El ledger puro sin output clínico no es un sistema
de IA de alto riesgo bajo ninguna categoría del Annex III vigente.

**Modo 1.5 y Modo 2:** [PENDIENTE — evaluar contra Annex III Point 5 cuando los modos
sean funcionales. La personalización contextual puede activar el análisis de alto riesgo
si el sistema influye materialmente en decisiones clínicas individuales.]

Controles mínimos ya implementados aplicables a AI Act:
- Human oversight activo (Art. 14): el fisio decide siempre
- Trazabilidad de fuentes (Art. 13): toda evidencia con origen declarado
- Outputs revisables (Art. 13): todo editable/eliminable/ignorable

---

## 5. Evaluación Health Canada MLMD

**Criterios de exclusión CDS de Health Canada (SaMD guidance):**

Para que Sócrates califique como CDS no regulado bajo Health Canada, debe cumplir
los tres criterios de exclusión simultáneamente:

1. Solo empareja información del paciente con información de referencia disponible
   (no genera nueva información clínica)
2. Permite que el clínico revise de forma independiente la base de la recomendación
3. No dispara acción clínica inmediata

**Estado actual:**
- Criterio 1: Modo 0 cumple. Modo 1.5: pendiente de análisis según implementación.
- Criterio 2: arquitectura lo permite — depende de implementación de UI (ver
  SOCRATES_UI_CONSTRAINTS.md).
- Criterio 3: Modo 0 cumple. Modo 1.5: depende del diseño de la interacción.

---

## 6. Tabla de conclusiones por modo y jurisdicción

| Modo | EU MDR | Health Canada | AI Act | Acción requerida antes de código |
|---|---|---|---|---|
| Modo 0 (ledger) | Fuera SaMD | Fuera regulación MLMD | No alto riesgo | Ninguna adicional |
| Modo 1.5 (evidence cards) | **PENDIENTE** | **PENDIENTE** | **PENDIENTE** | Completar secciones 3-5 de este memo |
| Modo 2 (chat + ledger) | **PENDIENTE** | **PENDIENTE** | **PENDIENTE** | Completar secciones 3-5 + revisión externa |

---

## 7. Gates de avance

**Para autorizar código de Modo 1.5:**
- [ ] Secciones 2, 3, 4, 5 de este memo completadas para Modo 1.5
- [ ] `AI_RISK_MANAGEMENT_FILE.md` v1.0 existente
- [ ] `DPIA_SOCRATES.md` v1.0 existente
- [ ] `EVIDENCE_REVIEW_PROTOCOL.md` v1.0 con doble firma en el último diagnóstico

**Para autorizar código de Modo 2:**
- [ ] Todo lo anterior
- [ ] Revisión externa por asesor legal especialista en MDR o Health Canada
- [ ] `isSocratesModeEnabled('mode_2')` en `false` por defecto en producción

---

## 8. Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 0.1 | 2026-05-24 | Versión inicial. Cubre Modo 0 y estructura base. Modos 1.5 y 2 pendientes. |

---

*Documento interno de gobernanza regulatoria. No contiene datos de pacientes.*
*Fuentes: EU MDR 2017/745 · MDCG 2019-11 · EU AI Act 2024 · Health Canada SaMD Guidance ·*
*Health Canada MLMD Guidance febrero 2025 · IMDRF N12*
