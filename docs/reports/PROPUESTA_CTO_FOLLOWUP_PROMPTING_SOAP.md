 # Propuesta CTO: Ajustes de prompting follow-up SOAP (JSON crudo + repetición)

**Fecha:** 2026-02-01  
**Estado:** Pendiente de aprobación CTO  
**Contexto:** Tras WO-FOLLOWUP-SOAP-03 el contenido llega a la UI, pero se observan dos problemas de prompting/parseo, no de bugs de flujo.

---

## 1. Resumen de problemas

| # | Problema | Causa probable | Impacto |
|---|----------|----------------|---------|
| 1 | **Contenido se muestra como JSON crudo** | Vertex devuelve un objeto JSON con keys capitalizados (`"Subjective"`, `"Objective"`, etc.). El fallback mete `rawText` completo en `followUp` sin parsearlo. El parser JSON (líneas 872-906) usa `soapData.subjective` (minúsculas) y no matchea keys capitalizados. | Usuario ve `{"Subjective":"...","Objective":"..."}` en lugar de texto legible por secciones. |
| 2 | **Texto repetitivo** | El prompt incluye el baseline completo y pide "Update the Subjective/Objective/Assessment/Plan". El modelo a veces repite el baseline en lugar de documentar solo lo nuevo/cambiado de la sesión. | Nota follow-up larga y redundante; difícil de leer y transferir al EMR. |

---

## 2. Propuesta de trabajo (para aprobación)

### 2.1 Problema 1 — JSON crudo en UI

**Objetivo:** Que cuando Vertex devuelva un único JSON con keys en cualquier capitalización (p. ej. `Subjective`, `Objective`), se parsee y se muestre como SOAP legible (S/O/A/P o bloque único), no como string crudo.

**Cambios propuestos:**

1. **Normalizar keys en el parser JSON existente** (`vertex-ai-soap-service.ts`, bloque que usa `soapData.subjective`, `soapData.objective`, etc.):
   - Al leer del objeto parseado, aceptar tanto key en minúsculas como capitalizada:  
     `soapData.Subjective ?? soapData.subjective`,  
     `soapData.Objective ?? soapData.objective`,  
     `soapData.Assessment ?? soapData.assessment`,  
     `soapData.Plan ?? soapData.plan`.
   - Sin cambiar contrato del resto del flujo; solo asegurar que un JSON con keys capitalizados produzca un `soap` con subjective/objective/assessment/plan rellenados.

2. **En el fallback, intentar parsear como JSON antes de usar raw como string:**
   - Antes de asignar `followUp: rawTrimmed`, hacer `try { const parsed = JSON.parse(rawTrimmed); ... }`.
   - Si `parsed` es un objeto y tiene al menos una de las keys (Subjective, Objective, Assessment, Plan en cualquier capitalización), mapear a `soap` con la misma normalización de keys y **no** asignar el string crudo a `followUp`.
   - Solo si el parse falla o el objeto no tiene forma SOAP, mantener el comportamiento actual: `followUp: rawTrimmed`.

**Criterios de aceptación:**
- Si Vertex devuelve solo un JSON con keys `Subjective`/`Objective`/`Assessment`/`Plan`, la UI muestra las secciones (o el bloque único construido desde S/O/A/P), no el JSON crudo.
- Si Vertex devuelve texto plano con "Subjective:\n...", el comportamiento actual se mantiene.
- No se introduce regresión en respuestas que ya se parsean bien.

---

### 2.2 Problema 2 — Texto repetitivo (prompt)

**Objetivo:** Reducir la repetición del baseline en la nota follow-up; que el modelo documente sobre todo lo nuevo o cambiado en la sesión.

**Cambios propuestos (solo en prompt — `buildFollowUpPromptV3.ts`):**

1. **Reforzar instrucción de no copiar el baseline:**
   - En la sección TASK o FINAL REMINDERS, añadir una línea explícita, por ejemplo:  
     *"Do NOT copy the baseline sections verbatim. Each section of your output must contain only what is NEW or CHANGED from today's visit. If there is no update for a section, write briefly e.g. 'No change from previous' or one short phrase."*

2. **Reforzar en OUTPUT FORMAT:**
   - Junto a "Subjective: (text)", añadir recordatorio:  
     *"(today's report only, do not repeat baseline)"*  
   - Y análogo para Objective, Assessment, Plan si el CTO lo considera útil (o una sola línea general para las cuatro).

**Criterios de aceptación:**
- Tras el cambio, en UAT con al menos un caso real (p. ej. Novak Doe), la nota follow-up generada no repite párrafos largos del baseline; las secciones reflejan principalmente la actualización de la sesión.
- No se exige un cambio de contrato del prompt (solo añadir instrucciones); el formato de salida solicitado (Subjective:/Objective:/Assessment:/Plan:) se mantiene.

---

## 3. Orden de implementación sugerido

1. **Primero: Problema 1 (parseo JSON / fallback)**  
   - Cambios solo en `vertex-ai-soap-service.ts`.  
   - Validar en UAT que una respuesta en JSON con keys capitalizados se muestre como SOAP legible.

2. **Después: Problema 2 (prompt anti-repetición)**  
   - Cambios solo en `buildFollowUpPromptV3.ts`.  
   - Validar en UAT que la nota sea menos repetitiva.

---

## 4. Archivos afectados

| Archivo | Cambios |
|---------|---------|
| `src/services/vertex-ai-soap-service.ts` | Normalización de keys en parser JSON; en fallback, intentar `JSON.parse(rawTrimmed)` y mapear a soap si es objeto SOAP. |
| `src/core/soap/followUp/buildFollowUpPromptV3.ts` | Añadir 1–2 frases en TASK/FINAL REMINDERS y en OUTPUT FORMAT para no copiar baseline y documentar solo lo nuevo/cambiado. |

---

## 5. Resumen para aprobación CTO

- **Problema 1:** Ajuste de parseo y fallback para aceptar JSON con keys capitalizados y evitar mostrar JSON crudo en la UI.  
- **Problema 2:** Ajuste de prompting para reducir repetición del baseline en la nota follow-up.  
- **Riesgo:** Bajo; cambios acotados a un servicio y al texto del prompt.  
- **Próximo paso:** Tras aprobación, implementar en el orden indicado y validar en UAT.
