# Plan de trabajo: Estandarización vía Vertex del baseline Ongoing

## Objetivo

Tras completar el formulario **Paciente en tratamiento (primera vez en AiDuxCare)** (Ongoing), poder enviar todos los datos introducidos (y los documentos adjuntos) a **Vertex AI** para que:

1. **Analice** la información.
2. **Organice y estandarice** el contenido en una estructura equivalente a la de una **evaluación inicial** (SOAP coherente, terminología estándar, listo para EMR).
3. Se evite que el baseline quede como “texto tal cual lo escribió el fisio”, con riesgo de desorden e inconsistencia en seguimientos.

---

## Situación actual

| Componente | Comportamiento actual |
|------------|------------------------|
| **Formulario Ongoing** | Campos: motivo principal, impacto, antecedentes, objetivo, impresión clínica, notas de sesión, próximo enfoque + documentos opcionales. |
| **ongoingFormToBaselineSOAP** | Concatena los campos en 4 bloques (S/O/A/P) **sin IA**. El texto se guarda “tal cual”. |
| **createBaselineFromMinimalSOAP** | Recibe un SOAP ya formado y crea el documento de baseline en Firestore. |
| **generateBaselineSOAPFromFreeText** | Existe en `vertex-ai-soap-service.ts`: recibe **un único texto libre**, llama a Vertex y devuelve SOAP estructurado. Pensado para “pegado de notas EMR”, no para el formulario Ongoing estructurado. |

**Problema:** El baseline creado desde Ongoing no pasa por Vertex; queda desordenado y no estandarizado.

---

## Fases del plan

### Fase 1 – Definición del contrato y criterios de salida

**Objetivo:** Dejar claro qué “estandarizado” significa y cómo se integra con el resto del flujo.

1. **Contrato de salida**
   - Misma estructura que el baseline de evaluación inicial: `SOAPNote` (subjective, objective, assessment, plan).
   - Mismo nivel de calidad que el SOAP generado en Initial (conciso, sin repetir entre secciones, terminología estándar, EMR-ready).
   - Documentar en código (o en este doc) que el baseline Ongoing estandarizado debe ser **intercambiable** con el de Initial para uso en seguimientos (comparación, “plan anterior”, etc.).

2. **Idioma por jurisdicción**
   - Definir en el prompt de Vertex el idioma de salida según jurisdicción (p. ej. `ES-ES` → español, `CA-ON` → en-CA), reutilizando la lógica existente de jurisdicción si aplica.

3. **Criterios de aceptación**
   - El SOAP generado debe poder parsearse con la lógica actual (`parsePlainSOAPSections` / `deriveSOAPDataFromRawText`).
   - El Plan debe ser explícito y no genérico (ya se valida con `hasValidPlan` / `isPlanGeneric` antes de crear el baseline).

**Entregables:** Notas/código con contrato de salida y regla de idioma; criterios de aceptación documentados.

---

### Fase 2 – Servicio Vertex “Ongoing → SOAP estandarizado”

**Objetivo:** Un único punto de llamada que reciba los datos del formulario Ongoing (y opcionalmente documentos) y devuelva un SOAP estandarizado.

1. **Nueva función (o extensión de la existente)**
   - Ubicación sugerida: `vertex-ai-soap-service.ts` (junto a `generateBaselineSOAPFromFreeText`).
   - Nombre sugerido: `generateBaselineSOAPFromOngoingIntake` (o similar).

2. **Entrada**
   - Datos estructurados del formulario:
     - chiefComplaint, painPresent, painNPRS, impactNotes
     - antecedentesPrevios (historia, pruebas, inicio)
     - objectiveFindings, clinicalImpression
     - sessionNotes, plannedNextFocus
   - Opcional: texto extraído de documentos adjuntos (array de strings o un único string concatenado/etiquetado).

3. **Construcción del payload para Vertex**
   - Opción A: Un único texto con secciones etiquetadas, por ejemplo:
     - `[Motivo de consulta]\n...\n[Antecedentes e historia]\n...\n[Objetivo]\n...\n[Impresión clínica]\n...\n[Notas de sesión y plan]\n...` (+ bloque “[Documentos adjuntos]” si hay).
   - Opción B: JSON estructurado en el prompt (campos nombrados) para que el modelo no pierda contexto.
   - El prompt debe indicar explícitamente: “Con esta información de un paciente en tratamiento (no es una evaluación inicial), genera un SOAP que sirva como baseline, con la misma estructura y calidad que una evaluación inicial. Estandariza terminología y formato.”

4. **Prompt y modelo**
   - Basarse en la idea de `BASELINE_FROM_TEXT_SYSTEM` pero adaptado a “intake estructurado” y a salida en el idioma de la jurisdicción.
   - Usar el mismo modelo que el resto (p. ej. `gemini-2.0-flash-exp` vía proxy) y la misma acción `analyze` (o la que corresponda).

5. **Parseo de la respuesta**
   - Reutilizar `parsePlainSOAPSections` y, si hace falta, la lógica de JSON de `generateBaselineSOAPFromFreeText`.
   - Devolver `SOAPNote` tipado para que quien llame pueda usar el mismo contrato que `createBaselineFromMinimalSOAP`.

6. **Manejo de errores**
   - Si Vertex falla o devuelve algo no parseable: decidir si se lanza error (y el UI muestra mensaje) o si se hace fallback a “SOAP tal cual” (ongoingFormToBaselineSOAP). Recomendación: no guardar baseline sin SOAP válido; mostrar error y permitir reintentar o guardar sin estandarizar (con confirmación).

**Entregables:** Función `generateBaselineSOAPFromOngoingIntake` (o nombre acordado), tests unitarios si aplica, y documentación breve del contrato entrada/salida.

---

### Fase 3 – Integración en el flujo Ongoing (UI y creación de baseline)

**Objetivo:** Que, al terminar el formulario Ongoing, los datos pasen por Vertex y el baseline se cree con el SOAP estandarizado.

1. **Punto de integración**
   - En `OngoingPatientIntakeModal`, en el `handleSubmit` actual:
     - Tras validar el formulario y (si aplica) crear el paciente, en lugar de llamar solo a `ongoingFormToBaselineSOAP(getFormData())` y luego `createBaselineFromMinimalSOAP`:
     - Llamar primero a `generateBaselineSOAPFromOngoingIntake(formData, attachmentsText?)`.
     - Con el SOAP devuelto, llamar a `createBaselineFromMinimalSOAP({ patientId, soap, createdBy, source: 'ongoing_intake' })`.
   - Incluir los textos de documentos adjuntos en la llamada a Vertex (Fase 4).

2. **UX**
   - Mostrar estado de carga (“Estandarizando con IA…” / “Analizando la información…”) mientras se llama a Vertex.
   - Si Vertex falla: mensaje claro y opción “Guardar sin estandarizar” (fallback a `ongoingFormToBaselineSOAP`) u “Reintentar”. Definir con producto.

3. **Opcional – Botón “Estandarizar con IA”**
   - Alternativa: botón que, antes de “Crear base clínica e iniciar sesión”, llame a Vertex y muestre una vista previa del SOAP generado; el usuario confirma y entonces se crea el baseline. Aumenta control pero añade un paso; puede ser Fase 3b.

4. **Trazabilidad**
   - Opcional: en el documento de baseline (o en metadatos) guardar que fue estandarizado por IA (p. ej. `standardizedByAI: true`, `source: 'ongoing_intake'` ya existe). Útil para auditoría y soporte.

**Entregables:** Cambios en `OngoingPatientIntakeModal`, manejo de loading/error, y (opcional) flujo de previsualización y confirmación.

---

### Fase 4 – Inclusión de documentos adjuntos en el análisis

**Objetivo:** Que el texto extraído de los documentos del formulario Ongoing se envíe a Vertex para que forme parte del SOAP estandarizado.

1. **Datos disponibles**
   - En el modal, los adjuntos están en `attachments`; cada uno puede tener `extractedText` (y `name`). Hoy no se persisten en el baseline; solo se muestran como chips.

2. **Construcción del bloque “documentos”**
   - Antes de llamar a `generateBaselineSOAPFromOngoingIntake`, construir un string con el texto de los adjuntos (p. ej. por cada uno: `[Nombre del archivo]\n{extractedText}\n`), con un límite de caracteres para no exceder límites de prompt (p. ej. 8.000–10.000 caracteres en total para documentos).
   - Pasar ese string como segundo argumento (o dentro del payload) a la función de Vertex.

3. **Prompt**
   - Incluir en el prompt una sección “[Información de documentos adjuntos]” o similar e instruir al modelo a integrar hallazgos relevantes (informes, pruebas de imagen, etc.) en las secciones Subjective/Objective/Assessment según corresponda, sin inventar datos.

4. **Persistencia de adjuntos (opcional)**
   - Si se desea que los documentos queden vinculados al baseline (no solo su texto usado en el prompt), definir dónde se guardan (p. ej. referencias en el documento de baseline o en una subcolección) e implementarlo en una fase posterior.

**Entregables:** Integración de `attachments` (texto extraído) en la llamada a Vertex y ajuste del prompt; opcionalmente persistencia de referencias a documentos.

---

### Fase 5 – Calidad y alineación con evaluación inicial

**Objetivo:** Que el SOAP generado desde Ongoing sea de la misma “calidad” y estilo que el de una evaluación inicial.

1. **Reutilizar estándares de prompt**
   - Revisar en `SOAPPromptFactory` (o equivalente) las instrucciones para Initial (secciones concisas, sin repetir, terminología, EMR-ready, longitud orientativa).
   - Incluir en el prompt de Ongoing instrucciones equivalentes (mismas reglas de Subjective/Objective/Assessment/Plan), adaptadas a “baseline a partir de intake de paciente en tratamiento”.

2. **Idioma y terminología**
   - Respetar la jurisdicción (ES → español, CA → en-CA) y usar la misma convención de términos que en el flujo Initial para ese idioma.

3. **Validación post-Vertex**
   - Aplicar las mismas validaciones que ya existen antes de crear el baseline (plan no genérico, longitud mínima si aplica). Si el modelo devuelve un plan genérico, considerar reintento con prompt más explícito o fallback a “sin estandarizar”.

4. **Pruebas**
   - Casos de prueba con formulario Ongoing típico (varios campos rellenados, con y sin documentos) y comprobar que el SOAP generado es parseable, tiene las 4 secciones y el plan pasa `hasValidPlan`.
   - Opcional: comparar con un baseline de evaluación inicial (misma estructura, sin duplicados entre secciones).

**Entregables:** Prompt alineado con Initial, validaciones unificadas y pruebas (manuales o automatizadas).

---

## Orden sugerido de implementación

1. **Fase 1** – Contrato y criterios (rápido, evita rework).
2. **Fase 2** – Servicio Vertex `generateBaselineSOAPFromOngoingIntake` (núcleo).
3. **Fase 4** – Inclusión de documentos en el payload (paralelizable con Fase 2 si se diseña la firma de la función con “documentos” desde el principio).
4. **Fase 3** – Integración en el modal (llamada, loading, errores, opcional previsualización).
5. **Fase 5** – Refino de prompts y calidad, y pruebas.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-------------|
| Vertex devuelve SOAP no parseable | Parseo robusto (plain text + JSON), mensaje claro al usuario y opción de guardar sin estandarizar. |
| Latencia en “Crear base clínica” | Loading claro; opcionalmente hacer la llamada a Vertex en background y notificar cuando esté listo (más complejo). |
| Coste de tokens | Límite de caracteres en documentos; prompt conciso; mismo modelo que el resto del flujo. |
| Diferencias de calidad entre Initial y Ongoing | Fase 5: mismos criterios de prompt y validación; revisión de ejemplos reales. |

---

## Resumen

- **Problema:** El baseline creado desde “Paciente en tratamiento (primera vez)” queda tal cual lo escribe el fisio, sin análisis ni estandarización.
- **Solución:** Enviar los datos del formulario Ongoing (y documentos) a Vertex, obtener un SOAP estandarizado con la misma estructura y calidad que una evaluación inicial, y crear el baseline con ese SOAP.
- **Pasos:** Definir contrato e idioma (Fase 1) → Servicio Vertex para Ongoing (Fase 2) → Incluir documentos (Fase 4) → Integrar en el modal (Fase 3) → Ajustar calidad y pruebas (Fase 5).

Si quieres, el siguiente paso puede ser bajar la Fase 2 a tareas de código concretas (nombres de funciones, firma de `generateBaselineSOAPFromOngoingIntake`, y ejemplo de prompt) en los archivos que ya hemos visto.
