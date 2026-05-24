# DPIA — Sócrates / ClinicalContextLedger

**Versión:** 0.1
**Fecha:** 2026-05-24
**Autor:** Mauricio Sobarzo, Nº colegiado 9657 COFCV
**Estado:** Estructura base. Requiere completar secciones 2-5 antes de activar Estrato 2.
**Marco:** GDPR 2016/679 · LOPDGDD (España) · PHIPA (Ontario)
**Artículo de activación DPIA:** GDPR Art. 35 — procesamiento a escala de categorías
especiales de datos (datos de salud) mediante IA

---

> Esta DPIA es obligatoria bajo GDPR Art. 35 antes de implementar cualquier
> procesamiento del Estrato 2 (señales psicosociales). No es opcional.

---

## 1. Descripción del tratamiento de datos

### Estrato 1 — Base legal estándar

**Categoría de datos:** datos de salud (GDPR Art. 9 — categoría especial)
**Fuente:** SOAP aprobado por el fisioterapeuta, decisiones clínicas documentadas,
transcripción en la medida en que el fisio la aprueba como parte del registro
**Base legal:** GDPR Art. 9(2)(h) — tratamiento necesario para la prestación de
asistencia sanitaria, bajo responsabilidad del fisioterapeuta como profesional
sujeto a secreto profesional
**Retención:** duración de la relación terapéutica + [DEFINIR período mínimo legal
según Ley 41/2002 España y PHIPA Ontario]
**Quién accede:** fisioterapeuta que atiende al paciente. AiduxCare como procesador
de datos bajo GDPR Art. 28 (DPA firmado implícito en términos de servicio).

### Estrato 2 — Señales psicosociales [REQUIERE COMPLETAR ESTA SECCIÓN ANTES DE ACTIVAR]

**Categoría de datos:** datos de salud — inferencias sobre estado psicosocial del paciente
**Fuente:** transcripción de sesión (audio capturado con consentimiento del paciente)
**Base legal propuesta:** GDPR Art. 9(2)(h)

*Análisis de necesidad para 9(2)(h) — PENDIENTE:*

El procesamiento debe ser "necesario" para la prestación de asistencia sanitaria.
"Necesario" bajo EDPB Guidelines significa que no existe alternativa menos invasiva
para el mismo propósito terapéutico.

Justificación clínica de necesidad a documentar:
- El modelo biopsicosocial es el estándar de referencia en fisioterapia MSK desde
  Engel (1977) y Waddell (1987). Las señales psicosociales (catastrofismo, miedo-
  evitación, expectativas del paciente) son predictores de outcome clínico con
  evidencia de nivel I (revisiones sistemáticas Cochrane). No considerarlas equivale
  a documentar solo el eje biológico en una disciplina que opera en tres ejes.
- [AÑADIR referencias: Waddell 1998, Vlaeyen & Linton 2000, Nicholas et al. 2011]

Condición técnica obligatoria para 9(2)(h):
- El Estrato 2 solo se activa si el fisioterapeuta lo habilita explícitamente
  (no activo por defecto)
- Las señales psicosociales detectadas se presentan como candidatos para aceptación
  del fisio — nunca como hechos documentados ni como observaciones persistidas sin
  revisión humana
- El fisio puede desactivar Estrato 2 en cualquier momento
- Período de retención: solo mientras la señal es candidata activa — si el fisio
  la rechaza, se elimina; si la acepta, pasa a Estrato 1 como decisión clínica

**Retención:** [DEFINIR — propuesta: máximo 1 sesión si no es aceptada por el fisio]
**Quién accede:** solo el fisioterapeuta que atiende al paciente

### Estrato 3 — Prohibido

**Categoría:** datos que el fisioterapeuta decidió NO incluir en el SOAP,
preguntas socráticas rechazadas como datos por paciente
**Estado:** eliminado de la arquitectura en segunda revisión del tribunal
**Implementación:** el código no puede persistir rechazos del fisio como
datos identificables por paciente

---

## 2. Análisis de necesidad y proporcionalidad [PENDIENTE]

*Completar antes de activar Estrato 2.*

**¿Puede Sócrates funcionar adecuadamente sin Estrato 2?**
[Respuesta honesta pendiente tras evaluación técnica]

**¿Qué valor clínico específico agrega el Estrato 2?**
[Documentar con referencias al modelo biopsicosocial y evidencia de outcome]

**¿Existe alternativa menos invasiva?**
[Analizar: ¿puede el fisio introducir señales psicosociales manualmente en lugar
de detectarlas automáticamente desde transcripción?]

**Conclusión de proporcionalidad:**
[Basada en las respuestas anteriores]

---

## 3. Derechos del paciente

### Derecho de acceso (GDPR Art. 15 / PHIPA s.52)

**¿Qué puede ver el paciente?**
- Estrato 1: todos los hechos documentados en SOAP — acceso completo
- Estrato 2 si fue aceptado por el fisio: visible como parte de notas clínicas
- Estrato 2 si está pendiente (candidato): [DEFINIR — recomendación: no visible
  al paciente mientras es candidato, ya que es una observación clínica de trabajo
  del profesional similar a notas de trabajo no finalizadas]

**Mecanismo técnico:** [PENDIENTE — definir UI de acceso del paciente]

### Derecho de rectificación (GDPR Art. 16)

El fisioterapeuta puede corregir señales psicosociales mal inferidas antes y después
de aceptarlas. El sistema registra la corrección con timestamp y autoría.

### Derecho al olvido (GDPR Art. 17 / PHIPA s.54)

Cuando un paciente solicita eliminación de sus datos:
1. Estrato 1: eliminación de la colección Firestore del paciente con audit log
2. Estrato 2 candidatos activos: eliminación inmediata
3. Estrato 2 aceptados por fisio: parte del registro clínico — la Ley 41/2002
   puede imponer período mínimo de retención que prevalece sobre el derecho al olvido
   en contexto sanitario. [VERIFICAR con asesor legal]

**Mecanismo técnico:** [PENDIENTE — implementar proceso de eliminación por pacientId]

### Derecho a la portabilidad (GDPR Art. 20)

Los datos del Estrato 1 deben ser exportables en formato estándar (JSON/FHIR-compatible).
[Pendiente de implementación en roadmap FHIR — ver PRODUCT_VISION.md §5]

### Derecho a la información (GDPR Art. 13)

**Texto que debe aparecer en el consentimiento estándar del paciente:**

```
AiduxCare puede identificar señales del contexto clínico expresadas
durante la sesión para ayudar al fisioterapeuta a organizar información
bibliográfica disponible sobre su condición. Esta función puede desactivarse
por el fisioterapeuta. Las señales identificadas no se incluyen en su
historia clínica oficial sin conocimiento y aprobación del profesional.
```

**Formato:** sección del consentimiento informado existente, no formulario adicional.
No interrumpe la sesión clínica.

---

## 4. Transferencias internacionales [PENDIENTE — verificar configuración actual]

**Vertex AI (Google Cloud Platform):**
- Región de procesamiento: [verificar — debe ser EU para datos de pacientes españoles]
- Mecanismo de adecuación: decisión de adecuación CE o SCCs vigentes
- DPA con Google Cloud: [verificar si está firmado como parte de GCP]

**OpenAI Whisper / gpt-4o-mini-transcribe:**
- Región de procesamiento: [verificar]
- Mecanismo de adecuación: SCCs o mecanismo equivalente
- DPA con OpenAI: [verificar]
- Nota de riesgo: el audio de la sesión clínica contiene PHI. Si el procesamiento
  no está en EU o bajo SCCs válidas, esto es una transferencia internacional de
  datos de salud que requiere base legal específica bajo GDPR Cap. V.

---

## 5. Evaluación de riesgo residual [PENDIENTE]

*Completar después de secciones 2-4.*

**Nivel de riesgo residual para el titular:** [Bajo / Medio / Alto]

**Medidas adicionales recomendadas si nivel es Medio o Alto:**
[A definir]

**¿Requiere consulta previa a la AEPD?** (GDPR Art. 36)
Solo si el riesgo residual sigue siendo alto después de todas las medidas.
[Evaluar cuando se complete la sección]

---

## 6. Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 0.1 | 2026-05-24 | Estructura base. Estrato 1 con base legal. Estrato 2 con análisis pendiente. Derechos del paciente documentados. |

---

*Documento interno de privacidad. No contiene datos de pacientes.*
*Responsable: Mauricio Sobarzo (CTO/DPO de facto hasta nombramiento formal)*
*Fuentes: GDPR 2016/679 · LOPDGDD · EDPB Guidelines · PHIPA Ontario*
