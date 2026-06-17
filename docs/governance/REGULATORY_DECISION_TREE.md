# AiDuxCare — Árbol de Decisión Regulatoria
**Versión:** 1.0  
**Fecha:** 16 Jun 2026  
**Autores:** Mauricio Sobarzo (CEO/Fisioterapeuta) + Claude (CTO AI)  
**Revisión siguiente:** Antes de activar cualquier feature nueva o al escalar más allá de 10 usuarios activos

---

## 1. Posición regulatoria declarada

**AiDuxCare Modo 1 (producción actual) es un sistema de documentación clínica asistida.**

Intended purpose oficial:
> "AiDuxCare convierte el juicio clínico del fisioterapeuta, expresado durante la consulta, en documentación SOAP estructurada. El sistema no genera diagnósticos independientes, no prescribe tratamientos ni sustituye el criterio clínico profesional. Toda decisión clínica es del fisioterapeuta."

Esta declaración está respaldada por:
- `docs/AIDUXCARE_OFFICIAL_USER_GUIDE.md:34`
- ADR-002 en `types.ts:1` ("sistema propone, fisio decide, decisión persiste con trazabilidad")
- Prompt ES production: "No diagnostiques. No prescribas." (`buildAnalysisPrompt.es.ts`)
- `DEFAULT_RESULT` del normalizer: `diagnosticos_probables: []` (`normalizeClinicalResponse.shared.ts:131`)
- SOAP finalization gate: `requiresReview` bloquea sin revisión explícita del fisio

---

## 2. Árbol EU AI Act — ¿Es AiDuxCare Annex III?

```
¿AiDuxCare está integrado en un producto regulado bajo MDR/IVDR?
├── SÍ → ruta Article 6(1)(a): automáticamente high-risk AI
│         → ver Sección 3 (análisis MDR)
└── NO → evaluar Annex III directo ↓

¿El sistema toma decisiones o genera recomendaciones clínicas autónomas
que influyen en el manejo del paciente sin aprobación explícita del fisio?
├── SÍ → Annex III (sección salud): high-risk
└── NO → evaluar features individuales ↓

Features en producción — evaluación individual:
├── Red flags → determinista, reglas publicadas literatura clínica
│   Clasificación: NO Annex III (sistema de alerta basado en reglas,
│   no inferencia estadística. El fisio decide la acción.)
│
├── Normalización de medicamentos → NLP sobre lo que el paciente
│   reportó, no prescripción nueva
│   Clasificación: NO Annex III (asistencia a documentación)
│
├── A de SOAP (Valoración) → CONDICIONADA
│   Condición: solo documenta el diagnóstico de presunción que el
│   fisio declaró en la ficha inicial o sospecha de derivación.
│   Si hay alineación → documenta el razonamiento del fisio.
│   Si no hay alineación → silencio. No se genera texto de valoración.
│   Clasificación: NO Annex III SI se implementa la condición anterior.
│   ACCIÓN REQUERIDA: implementar lógica de alineación con ficha inicial.
│
├── Plan de SOAP → documenta tratamiento que el fisio ejecutó en sesión
│   (capturado en transcript + checklists aprobados por fisio)
│   Clasificación: NO Annex III (documentación de decisión ya tomada)
│
├── Evaluaciones físicas sugeridas → ZONA GRIS ACTIVA
│   El prompt dice "Recomienda pruebas. Ordénalas por prioridad clínica."
│   El safety gate desactiva en producción. Pero:
│   - El copy UI dice "Pruebas físicas recomendadas" → evidencia negativa
│   - El campo existe en el schema con evidence_level y rationale
│   Clasificación: GREY ZONE. Defensible SOLO si:
│     (a) safety gate permanece activo
│     (b) copy cambia a "Pruebas físicas evaluadas"
│     (c) campo renombrado a evaluaciones_fisicas_realizadas
│   ACCIONES REQUERIDAS: ver Sección 6.
│
├── Memoria longitudinal → compara sesiones, clasifica trayectoria,
│   presenta patrones. No recomienda tratamiento.
│   Clasificación: NO Annex III (observación + documentación de evolución)
│
└── Sócrates (DESACTIVADO en producción) → Modo 1 proactivo,
    Modo 2 interactivo. Si se activa con sugerencias proactivas:
    Clasificación: POTENCIALMENTE Annex III → requiere DPIA + análisis
    MDR completo antes de activación.

CONCLUSIÓN EU AI ACT MODO 1 ACTUAL:
AiDuxCare en producción es DEFENSIBLE como NO Annex III bajo las
condiciones de Sección 6. La posición se mantiene mientras el physio
approval gate sea arquitectural (no opcional) y el intended purpose
declare documentación, no diagnóstico.
```

---

## 3. Árbol EU MDR 2017/745 — ¿Es AiDuxCare MDSW?

```
Test MDCG 2019-11: ¿El software está "intended" para ser usado
en diagnóstico, monitorización, predicción, pronóstico, tratamiento
o alivio de enfermedad o lesión?

Intended purpose declarado: documentación clínica asistida.
El sistema NO diagnostica, NO prescribe, NO predice evolución
clínica ni monitoriza parámetros de enfermedad.

¿El software "impulsa o influye en el manejo clínico" (drives or
influences clinical management)?
├── Argumento SÍ: las evaluaciones físicas sugeridas (cuando activas)
│   influyen en qué pruebas realiza el fisio.
│   Red flags pueden influir en derivación.
└── Argumento NO: toda influencia está mediada por aprobación explícita
    del fisio. El sistema presenta, el fisio decide y documenta.
    La arquitectura (ADR-002, ClinicalDecision con decidedBy) hace
    que la decisión sea del fisio, no del sistema.

POSICIÓN MDR ACTUAL:
AiDuxCare Modo 1 es defendible como software de propósito general
en contexto médico (NO MDSW) bajo las condiciones de Sección 6.
La defensa se debilita si evaluaciones_fisicas_sugeridas se activan
sin safety gate o si el intended purpose se expande a pronóstico/
recomendación de tratamiento.

NOTA: Si un auditor MDR clasifica AiDuxCare como MDSW Clase I
bajo MDR → automáticamente high-risk AI bajo EU AI Act Art. 6(1)(a).
Ese riesgo existe y debe monitorizarse al escalar.
```

---

## 4. Tabla de clasificación por feature

| Feature | Producción | Clasificación | Condición |
|---------|-----------|---------------|-----------|
| Transcripción (Whisper) | ✅ Activo | No regulado | — |
| Análisis de transcript (Gemini) | ✅ Activo | No Annex III | Intended use = documentación |
| Red flags | ✅ Activo | No Annex III | Determinista, decisión del fisio |
| Normalización medicamentos | ✅ Activo | No Annex III | Transcripción, no prescripción |
| S de SOAP | ✅ Activo | No Annex III | Documenta reporte del paciente |
| O de SOAP | ✅ Activo | No Annex III | Documenta hallazgos del fisio |
| A de SOAP | ✅ Activo | GREY ZONE | Solo si alinea con ficha inicial del fisio |
| P de SOAP | ✅ Activo | No Annex III | Documenta tratamiento ejecutado |
| Memoria longitudinal | ✅ Activo | No Annex III | Observa, no recomienda |
| Evaluaciones físicas sugeridas | ⚠️ Safety gate activo | GREY ZONE | Safety gate obligatorio + copy fix |
| Sócrates Modo 0 (advertencias) | 🔒 No activado | No Annex III | Solo observación, no directiva |
| Sócrates Modo 1 (proactivo) | 🔒 No activado | REQUIERE ANÁLISIS | No activar sin DPIA + MDR analysis |
| Sócrates Modo 2 (interactivo) | 🔒 No activado | REQUIERE ANÁLISIS | No activar sin DPIA + MDR analysis |
| CA treatment_suggestions (stub) | 🔒 Stub inactivo | Annex III si activo | NUNCA activar sin compliance |

---

## 5. La línea que no cruzamos

Cualquiera de los siguientes activa análisis regulatorio obligatorio
antes de desplegar:

1. El sistema genera texto de valoración (A de SOAP) sin ancla en
   el diagnóstico declarado por el fisio en la ficha inicial.
2. Las evaluaciones físicas sugeridas se reactivan sin safety gate.
3. Sócrates Modo 1 genera sugerencias proactivas de tratamiento.
4. El campo `treatment_suggestions` del stub CA se implementa.
5. El sistema genera predicciones de evolución clínica sobre el paciente.
6. El número de usuarios supera 50 (escala que puede activar obligaciones
   de registro en base de datos EU AI Act).

---

## 6. Acciones requeridas para mantener la posición

### Inmediatas (antes de escalar a 10+ usuarios)

| # | Acción | Archivo | Impacto regulatorio |
|---|--------|---------|---------------------|
| 1 | Cambiar copy "Pruebas físicas recomendadas" → "Pruebas físicas evaluadas" | `ClinicalAnalysisResults.tsx` | Elimina evidencia negativa en UI |
| 2 | Implementar lógica de alineación A de SOAP con ficha inicial | `buildAnalysisPrompt.es.ts` | Convierte A de grey zone a defensible |
| 3 | `regulatoryLanguageGuard` debe bloquear, no solo advertir | `regulatoryLanguageGuard.ts` | Fortalece posición para auditoría |
| 4 | Renombrar `evaluaciones_fisicas_sugeridas` → `evaluaciones_fisicas_realizadas` en schema inactivo | `normalizeClinicalResponse.shared.ts` | Elimina claim implícito en nombre del campo |
| 5 | Documentar decisión explícita sobre CA stub `treatment_suggestions` | `PromptBrainCA.ts` | Cierra ambigüedad de intended purpose |

### Antes de activar Sócrates (cualquier modo)

- [ ] DPIA completa bajo RGPD Art. 35
- [ ] Análisis MDR actualizado con features de Sócrates
- [ ] Re-evaluar este árbol de decisiones
- [ ] Consulta externa de validación regulatoria (abogado especializado o notified body)

---

## 7. Contexto EU AI Act — reforma Digital Omnibus (jun 2026)

El Parlamento Europeo aprobó reforma via Digital Omnibus (423-57):
- Obligaciones Annex III: prorrogadas del 2 ago 2026 → 2 dic 2027
- Obligaciones Annex I: hasta 2 ago 2028
- Obligaciones generales: se aplican desde 2 ago 2026

**Impacto para AiDuxCare:** si un auditor clasificara Modo 1 como
Annex III (escenario pesimista), el plazo de cumplimiento es dic 2027.
La posición correcta es usar ese plazo para construir compliance, no
para posponerlo.

**Recomendación estratégica:** AiDuxCare compite construyendo
gobernanza ahora. Los competidores que usen el retraso en su contra
estarán en desventaja en 18 meses.

---

## 8. Historial de revisiones

| Fecha | Versión | Cambio | Autor |
|-------|---------|--------|-------|
| 16 Jun 2026 | 1.0 | Creación inicial | Mauricio Sobarzo + Claude |

---

*Este documento es evidencia de due diligence regulatoria interna.
No constituye asesoramiento legal. Revisar con abogado especializado
antes de escalar a uso comercial o activar features de Sección 5.*
