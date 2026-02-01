# Informe CTO: SOAP follow-up generado pero UI muestra "Not documented."

**Fecha:** 2026-02-01  
**Contexto:** Follow-up workflow — transcripción y generación SOAP completan correctamente (logs: `soap_generation_started`, `soap_generation_completed`, transcripción exitosa), pero la nota SOAP en pantalla sigue con S/O/A/P en "Not documented."

---

## 1. Síntoma

- **Flujo:** Paciente en follow-up → grabación → transcripción OK → generación SOAP (una llamada Vertex con `buildFollowUpPromptV3` + `generateFollowUpSOAPV2Raw`).
- **Logs:** `transcription_completed`, `soap_generation_started`, `soap_generation_completed`; `transcriptLength: 502`; auto-save con `activeTab: 'soap'`.
- **UI:** Bloque "Follow-up SOAP note" muestra solo "S: Subjective / Not documented." y lo mismo para O, A, P.

Conclusión: el backend (Vertex + parser) devuelve algo, pero el estado que alimenta al editor no contiene contenido útil o se sobrescribe después.

---

## 2. Cambios ya aplicados en código

1. **Parser más flexible** (`vertex-ai-soap-service.ts`):
   - Varios conjuntos de títulos: `Subjective:/Objective:/Assessment:/Plan:` → `S:/O:/A:/P:` → `Subjetivo:/Objetivo:/Evaluación:/Plan:` (y variante con Assessment en inglés).
   - Se considera sección con contenido si tiene ≥3 caracteres y no es el placeholder "Not documented.".

2. **Fallback con texto crudo:**
   - Si no se obtiene SOAP estructurado con contenido, se arma un SOAP con `followUp: rawText` para que el editor muestre al menos la respuesta completa de Vertex en un solo bloque.

3. **Validación en página:**
   - Se acepta como éxito SOAP con S/O/A/P rellenados **o** con bloque único `followUp`, para no mostrar "no content" cuando sí hay texto en `followUp`.

Si tras un deploy reciente la UI sigue vacía, o bien el fallback no se está aplicando (p. ej. `rawText` vacío o con formato no esperado), o hay otro factor (estado, proxy, etc.) que conviene revisar.

---

## 3. Otras posibilidades para que CTO analice

### 3.1 Forma de la respuesta del proxy Vertex

- **Hipótesis:** El proxy (`vertexAIProxy`) podría devolver el texto en otra estructura (p. ej. otro path que no sea `data.candidates?.[0]?.content?.parts?.[0]?.text` o `data.text`).
- **Acción sugerida:** En entorno de desarrollo/UAT, loguear (sin PHI) la forma de `data` justo después de `response.json()` en `generateFollowUpSOAPV2Raw`: keys del objeto, tipo de `candidates`, `parts`, existencia de `text`. Si el texto viene en otro campo, el parser nunca lo verá y el fallback tendría `rawText` vacío.

### 3.2 Formato real del output de Vertex (Gemini)

- **Hipótesis:** El modelo puede estar devolviendo markdown, bloques de código, o texto con prefijos/sufijos que hacen que los regex de `parsePlainSOAPSections` no matcheen (p. ej. "```\nSubjective: ..." o títulos en otro idioma/variante).
- **Acción sugerida:** Log temporal de `rawText` (truncado, ej. primeros 500 caracteres) en `generateFollowUpSOAPV2Raw` en dev; revisar si los títulos y el cuerpo coinciden con lo que espera el parser. Ajustar regex o añadir más variantes de títulos si hace falta.

### 3.3 Estado local sobrescrito después de `setLocalSoapNote`

- **Hipótesis:** Algún `useEffect` u otra lógica podría estar volviendo a setear `localSoapNote` después de que `handleGenerateSOAPFollowUp` lo actualiza (p. ej. restauración desde `soapNote` de useNiagaraProcessor, o desde SessionStorage/localStorage).
- **Acción sugerida:** Revisar todos los sitios que llaman `setLocalSoapNote` en `ProfessionalWorkflowPage.tsx` y sus dependencias (incl. restore por `sessionId`/`patientId` y efecto que sincroniza `soapNote` → `localSoapNote`). Comprobar si en follow-up se evita correctamente restaurar un estado vacío sobre el SOAP recién generado.

### 3.4 Momento en que se muestra la pestaña SOAP

- **Hipótesis:** Se hace `setActiveTab('soap')` y `setLocalSoapNote(...)` en la misma tanda; si hay un render intermedio que lee `localSoapNote` antes de actualizarse, o si el hijo (SOAPEditor) no recibe la última versión por referencia/estado, podría verse el valor previo (null o vacío).
- **Acción sugerida:** Verificar que no haya condiciones de carrera: ver orden de setState y si el componente que muestra la nota recibe `localSoapNote` como prop directamente del estado que se acaba de actualizar.

### 3.5 Errores silenciosos en Vertex o en el parser

- **Hipótesis:** Vertex devuelve 200 pero con cuerpo vacío, o con un bloque de error dentro de `candidates`; o el parser lanza y el catch deja `soap` en null y el fallback depende de `rawText` que también está vacío.
- **Acción sugerida:** En `generateFollowUpSOAPV2Raw`, comprobar y loguear si `rawText` está vacío tras extraerlo; si existe, comprobar que el fallback a `followUp: rawTrimmed` se ejecute cuando `soap` es null o sin contenido. Añadir un log cuando se use el fallback para confirmar en UAT.

### 3.6 Build / bundle no actualizado

- **Hipótesis:** La versión desplegada (o la que carga el navegador) no incluye los últimos cambios del parser ni del fallback.
- **Acción sugerida:** Confirmar que el deploy incluye los cambios de `vertex-ai-soap-service.ts` y de `ProfessionalWorkflowPage.tsx` (handleGenerateSOAPFollowUp). Forzar recarga sin caché o verificar hash del bundle.

---

## 4. Resumen para CTO

| Área              | Posible causa                               | Siguiente paso recomendado                          |
|-------------------|---------------------------------------------|-----------------------------------------------------|
| Proxy / API       | Respuesta Vertex en otro shape              | Log de estructura de `data` y de `rawText` en dev   |
| Formato Vertex    | Títulos o formato no reconocidos            | Log de `rawText` (truncado); ampliar parser si hace falta |
| Estado React      | `localSoapNote` sobrescrito tras generar    | Revisar todos los `setLocalSoapNote` y restores     |
| Render/orden     | Tab SOAP antes de actualizar estado         | Revisar orden setState y props al editor            |
| Errores silenciosos | `rawText` vacío o fallback no aplicado    | Logs cuando `rawText` vacío y cuando se usa fallback |
| Deploy            | Código nuevo no en el bundle                | Verificar deploy y caché del cliente                |

Recomendación inmediata: añadir logs temporales (sin PHI) en `generateFollowUpSOAPV2Raw` (longitud y preview de `rawText`, y flag "fallback used") y repetir el flujo en UAT para acotar si el fallo está en la respuesta del proxy, en el parser o en el estado en React.
