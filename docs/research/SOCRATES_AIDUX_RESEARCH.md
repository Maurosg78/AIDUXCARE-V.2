# Documento de investigación — Sócrates / AiDux

**Estado:** Investigación estratégica
**Fecha:** 2026-05-13
**Relación con SoT:** `ENGINEERING.md` v1.4, sección 1.6 — Principio Sócrates

## 1. Tesis central

AiDux no debe evolucionar como “otro scribe”. El diferenciador estratégico debe ser una capa integrada de deliberación clínica, provisionalmente llamada **Sócrates**, cuyo objetivo no es tomar decisiones por el profesional, sino ayudarle a razonar mejor.

Sócrates debe observar el comportamiento clínico del profesional, el relato del paciente, la evolución longitudinal y el contexto del caso para detectar señales relevantes, inconsistencias, omisiones, patrones repetidos o posibles sesgos clínicos. A partir de ello, debe generar preguntas útiles, prudentes y trazables que amplíen el criterio clínico del profesional.

La premisa principal es:

> AiDux no reemplaza el juicio clínico. AiDux ayuda al profesional a pensar mejor, con más contexto, menos sesgo y menor carga cognitiva.

---

## 2. Qué NO es Sócrates

Sócrates no debe ser:

- Un chatbot clínico paralelo.
- Una app independiente desconectada del flujo asistencial.
- Un sistema que recomienda tratamientos de forma autónoma.
- Un motor diagnóstico.
- Un generador de órdenes clínicas.
- Un scribe que solo escribe notas.
- Una capa que convierte inferencias IA en verdades clínicas.

La tesis es que Sócrates solo puede ser útil si conoce el contexto real del paciente y del profesional. Por eso no debe diseñarse como herramienta externa donde el clínico copia y pega información. Debe vivir dentro del flujo de AiDux o integrarse dentro de sistemas externos como capa embebida.

---

## 3. Qué SÍ es Sócrates

Sócrates debe ser una **capa de deliberación clínica contextual**.

Su función es:

- Detectar señales clínicas relevantes.
- Identificar patrones longitudinales.
- Mostrar inconsistencias entre relato, evolución, objetivos y plan.
- Formular preguntas clínicas útiles.
- Ayudar a descubrir sesgos de razonamiento.
- Sugerir puntos a reevaluar, sin imponer decisiones.
- Conectar datos del paciente con el estilo y contexto profesional del clínico.
- Registrar qué preguntas fueron útiles, ignoradas, aceptadas o modificadas.

La formulación más precisa:

> Sócrates no entrega respuestas. Sócrates aprende a formular mejores preguntas clínicas.

---

## 4. Analogía estratégica

La analogía útil no es “doctor automático”.

La analogía es una pantalla de datos para un operador financiero:

- La pantalla no compra ni vende por él.
- Muestra tendencias, patrones, anomalías, señales, volatilidad y datos objetivos.
- El profesional interpreta y decide.

Aplicado a salud:

> Sócrates debe ser una pantalla de señales clínicas que ayuda al profesional a ver mejor el caso antes de decidir.

Ejemplos de señales:

- El paciente repite la misma preocupación por quinta vez.
- El dolor mejora, pero la función no cambia.
- El plan progresa carga, pero la irritabilidad sigue alta.
- Se modifica el HEP pese a baja adherencia previa.
- No se ha reevaluado objetivamente desde hace varias sesiones.
- La hipótesis clínica se mantiene, pero la evolución no la confirma claramente.

---

## 5. Problema que intenta resolver

El problema real no es solo escribir mejor una nota clínica.

El problema es que el profesional trabaja con:

- Tiempo limitado.
- Memoria imperfecta.
- Cansancio.
- Sesgos de confirmación.
- Presión asistencial.
- Pacientes complejos.
- Obligación de documentar.
- Información longitudinal dispersa.
- Dificultad para integrar evidencia en el momento clínico.

Los scribes resuelven parte de la carga documental, pero no necesariamente amplían el criterio del profesional.

Sócrates apunta a otro problema:

> Cómo ayudar al clínico a no razonar solo, cansado, con información incompleta o dispersa, sin quitarle la responsabilidad de decidir.

---

## 6. Diferenciación frente a scribes y EMR

Heidi, Tandem, Jane, Noterro, Cliniko u otros sistemas pueden añadir funciones de IA, memoria, asistentes o botones de “Ask AI”.

La diferencia de Sócrates no debería depender de tener un botón conversacional.

La diferencia debe venir de:

1. Contexto clínico longitudinal.
2. Contexto profesional del clínico.
3. Separación estricta entre hecho, inferencia IA y decisión humana.
4. Registro del ciclo señal → pregunta → respuesta profesional → decisión → evolución.
5. Aprendizaje progresivo sobre qué preguntas realmente aportan valor clínico.

La ventaja competitiva buscada no es “tenemos IA”, sino:

> Tenemos una capa entrenada para formular preguntas clínicas cada vez mejores en contextos concretos de atención.

---

## 7. Unidad de aprendizaje de Sócrates

La unidad central de aprendizaje no debe ser la historia clínica completa ni el audio bruto.

La unidad de aprendizaje debe ser un evento de deliberación clínica:

```text
señal clínica detectada
→ pregunta socrática generada
→ acción del profesional
→ decisión clínica
→ evolución posterior
→ utilidad percibida
```

Ejemplo:

```text
Señal: preocupación por recaída mencionada en 3 sesiones.
Pregunta: ¿Quieres explorar miedo a recaída antes de progresar carga?
Acción del fisio: guardar para próxima sesión.
Decisión posterior: se explora confianza y barreras.
Resultado: se ajusta HEP y mejora adherencia.
Utilidad: alta.
```

Este ciclo es el posible moat de AiDux.

---

## 8. Arquitectura conceptual propuesta

### 8.1 Flujo general

```text
Captura clínica
→ transcripción / nota / datos estructurados
→ Clinical Context Ledger
→ detección de señales
→ generación de preguntas candidatas
→ evaluación de umbral
→ visualización discreta
→ decisión del profesional
→ memoria longitudinal
→ aprendizaje de Sócrates
```

### 8.2 Clinical Context Ledger

Antes de construir Sócrates como LLM, AiDux necesita una capa estructurada que responda:

- ¿Qué sabemos?
- ¿Quién lo dijo?
- ¿De dónde salió?
- ¿Fue inferido por IA o documentado como hecho?
- ¿Fue aceptado por el profesional?
- ¿Se repite longitudinalmente?
- ¿Ya se preguntó antes?
- ¿Fue útil preguntar?

Estructura conceptual:

```ts
type ClinicalContextLedger = {
  sessionFacts: DocumentedFact[];
  aiObservations: AiObservation[];
  clinicianDecisions: ClinicalDecision[];
  longitudinalPatterns: LongitudinalPattern[];
  unresolvedQuestions: SocraticQuestionCandidate[];
  evidenceLinks?: ApprovedEvidenceReference[];
};
```

---

## 9. Separación crítica de información

### 9.1 Hechos documentados

Son elementos que provienen del paciente, del profesional o de la documentación clínica.

Ejemplos:

- Paciente refiere miedo al movimiento.
- Dolor aumenta al bajar escaleras.
- Paciente quiere volver rápido al deporte.
- HEP fue reportado como difícil de cumplir.

Estos pueden alimentar memoria longitudinal si son trazables.

**Vigencia temporal de los hechos documentados**

Un hecho documentado no es permanentemente activo. Puede expirar (ej. dolor que el paciente confirma haber resuelto), quedar supersedido por un hecho posterior más específico, o ser marcado por el fisioterapeuta como ya no relevante. La distinción de estados es:

- `active`: el hecho es actualmente válido y puede alimentar razonamiento socrático.
- `superseded`: reemplazado por un hecho más reciente — no puede ser base de preguntas activas.
- `expired`: `validUntil` superado — el hecho no puede usarse como si fuera actual.

**Regla canónica:** Solo la salida de `getActiveFacts()` puede alimentar el `SocraticThresholdEvaluator`. Sócrates no puede razonar sobre un hecho como actual si no conserva vigencia temporal.

La confianza en el origen del hecho también se clasifica:
- `clinician_confirmed`: el fisioterapeuta lo validó explícitamente.
- `patient_reported`: proviene del relato del paciente, sin validación directa del clínico.
- `document_extracted`: extraído de documentación clínica (transcripción, SOAP) con trazabilidad de fuente.

`inferred` no es un valor válido aquí — las inferencias de IA son siempre `AiObservation`, nunca `DocumentedFact`.

### 9.2 Inferencias IA

Son observaciones generadas por el modelo.

Ejemplos:

- Posible yellow flag.
- Posible baja adherencia.
- Posible discrepancia entre objetivo y carga tolerada.

No deben convertirse automáticamente en verdad clínica. Deben guardarse como propuestas, con fuente, versión de modelo y estado de revisión.

### 9.3 Decisiones humanas

Son decisiones tomadas, aceptadas o descartadas por el profesional.

Ejemplos:

- El fisio decide monitorizar.
- El fisio descarta una alerta.
- El fisio acepta modificar HEP.
- El fisio decide reevaluar antes de progresar.

Estas decisiones deben ser fuente canónica para continuidad asistencial.

---

## 10. Política de retención de datos para Sócrates

### 10.1 Audio raw

No debería guardarse por defecto como fuente de entrenamiento.

Solo debería conservarse en casos justificados:

- Debugging temporal.
- Consentimiento explícito.
- Retención breve.
- Cifrado.
- Acceso restringido.

### 10.2 Transcripción raw

Puede guardarse si forma parte de la documentación o trazabilidad del servicio, pero no debería usarse directamente como dataset global de entrenamiento.

Lo recomendable es extraer hechos, señales y eventos minimizados.

### 10.3 Respuesta total de Vertex

No debería guardarse completa como fuente canónica.

Puede contener:

- Inferencias no validadas.
- Errores.
- Campos descartados.
- Texto no aceptado por el profesional.
- Alucinaciones.

Mejor persistir observaciones estructuradas y versionadas.

### 10.4 SOAP aceptado y SOAP final

Deben guardarse.

El SOAP final es parte de la documentación clínica.

La respuesta aceptada es útil para entender qué output fue validado o editado por el profesional.

### 10.5 Learning Store

Para entrenar Sócrates, el foco debería estar en eventos minimizados:

```ts
type SocraticTrainingEvent = {
  signalType: string;
  questionShown: string;
  clinicianAction: 'accepted' | 'ignored' | 'saved' | 'edited';
  usefulnessRating?: number;
  downstreamOutcome?: string;
  noDirectIdentifiers: true;
};
```

---

## 11. Buckets de datos recomendados

### 11.1 Clinical Record Store

Contiene información asistencial:

- SOAP final.
- Decisiones clínicas.
- HEP.
- Consentimientos.
- Datos necesarios para continuidad clínica.

### 11.2 Trace Store

Contiene información para trazabilidad:

- Fragmentos fuente.
- Hashes.
- Pointers a sesión.
- Versiones de modelo.
- Versiones de prompt.
- Aceptación/rechazo del profesional.

### 11.3 Learning Store

Contiene información para mejora de Sócrates:

- Señales detectadas.
- Preguntas generadas.
- Acción del profesional.
- Utilidad percibida.
- Patrón clínico.
- Resultado posterior, si existe.
- Sin identificadores directos siempre que sea posible.

Estos tres almacenes no deben mezclarse.

---

## 12. Activación de Sócrates

Sócrates debería tener dos formas de activación.

### 12.1 Activación automática silenciosa

Se ejecuta en background antes del cierre o durante la preparación de la siguiente sesión.

Solo muestra algo si supera umbral de utilidad clínica.

No debe bloquear el workflow salvo riesgo crítico.

### 12.2 Botón manual

El profesional puede presionar un botón tipo:

- “Sócrates”.
- “Cuestióname este caso”.
- “Amplía mi criterio”.
- “Revisa mi razonamiento”.
- “Ver señales clínicas”.

Preguntas posibles:

- ¿Qué estoy pasando por alto?
- ¿Qué contradice mi hipótesis principal?
- ¿Qué debería reevaluar antes de progresar?
- ¿Qué alternativa razonable existe?
- ¿Qué parte de la evolución no calza?
- ¿Qué decisión debo documentar mejor?

---

## 13. Umbrales iniciales de activación

Antes de depender solo de una LLM, conviene definir reglas simples.

Ejemplos:

- Si una preocupación aparece en 3 o más sesiones y no hay decisión humana asociada → candidato a pregunta.
- Si hay mejora subjetiva pero no dato funcional actualizado en varias sesiones → candidato.
- Si el HEP fue modificado pero la adherencia previa fue baja → candidato.
- Si una red/yellow flag fue inferida por IA pero nunca aceptada o descartada por el fisio → candidato.
- Si el objetivo del paciente y el plan clínico no parecen alineados → candidato.
- Si la hipótesis clínica se mantiene pero la evolución no la confirma → candidato.

La LLM puede redactar mejor la pregunta, pero el umbral debe ser explícito y auditable.

---

## 14. Interfaz sin fricción

Sócrates no debe convertirse en otro panel complejo.

Tres momentos posibles:

### 14.1 Durante cierre de sesión

Bloque pequeño:

```text
AiDux notó 1 posible pregunta útil para continuidad.
[Ver] [Guardar para próxima sesión] [Ignorar]
```

### 14.2 Antes de ver al paciente

Recordatorio contextual:

```text
En sesiones previas apareció miedo a recaída y presión por volver rápido.
¿Quieres explorarlo hoy?
```

### 14.3 En historial longitudinal

Como línea trazable:

```text
Patrón observado: preocupación por retorno rápido.
Basado en: sesiones X, Y, Z.
Estado: pendiente de explorar.
```

---

## 15. Evidencia curada

Sócrates no debería consultar evidencia libre sin control.

Solo debería contrastar contra evidencia si:

```text
evidence.status === 'approved'
```

Si no hay evidencia aprobada:

```text
No hay evidencia AiDux aprobada para este diagnóstico/contexto.
Puedo ayudarte a formular preguntas clínicas, pero no contrastar contra guía validada.
```

Esto reduce riesgo regulatorio y evita claims peligrosos.

---

## 16. Límites de lenguaje

Sócrates debe evitar lenguaje imperativo.

### Prohibido

- “Debes hacer X.”
- “El tratamiento correcto es Y.”
- “El paciente presenta Z.” si Z es inferencia no confirmada.
- “Diagnóstico probable definitivo.”
- “Se recomienda intervenir con…” como orden clínica.

### Permitido

- “¿Quieres revisar X antes de continuar?”
- “Esta señal aparece en varias sesiones.”
- “Podría ser útil reevaluar…”
- “Hay una discrepancia entre…”
- “La información disponible no permite concluir…”
- “Esta inferencia requiere validación clínica.”

---

## 17. Roadmap tentativo

### Sprint 1 — Data audit

Objetivo:

- Mapear todo lo que Vertex devuelve hoy.
- Identificar qué se pierde.
- Clasificar datos como hecho, inferencia o decisión.
- Definir qué puede alimentar memoria.

Resultado:

- Documento técnico.
- Backlog priorizado.

### Sprint 2 — Clinical Context Ledger MVP

Objetivo:

- Crear tipos.
- Crear extractor estructurado desde sesión actual.
- No UI.
- No nueva LLM todavía.

Resultado:

- Aidux empieza a saber qué sabe.

### Sprint 2.5 — Threshold Rules MVP

Objetivo:

- Crear reglas explícitas de activación.
- Detectar señales simples sin LLM.

Resultado:

- Primer motor de señales clínicas auditables.

### Sprint 3 — Socratic Review Prompt

Objetivo:

- Nuevo prompt especializado.
- Input estructurado y trazable.
- Output JSON validado.
- Prohibir lenguaje imperativo.
- Prohibir diagnóstico nuevo.
- Prohibir repetir preguntas ya ignoradas sin nuevo dato.

Resultado:

- Candidatos a preguntas, todavía sin UI final.

### Sprint 4 — UI mínima en cierre

Objetivo:

- Mostrar máximo 1 o 2 preguntas.
- Acciones: explorar, guardar, ignorar.
- Persistir decisión del profesional.

Resultado:

- Primer Sócrates visible pero discreto.

### Sprint 5 — Command Center longitudinal

Objetivo:

- Mostrar preguntas guardadas para próxima sesión.
- Integrar con preparación de paciente.
- No bloquear workflow.

Resultado:

- Sócrates ayuda en el momento adecuado.

### Sprint 6 — Evidencia curada

Objetivo:

- Conectar clinical-evidence solo si está aprobada.
- Formular preguntas basadas en evidencia, no recomendaciones autónomas.

Resultado:

- Razonamiento aumentado bajo control.

---

## 18. Preguntas legales a investigar en España

### 18.1 Historia clínica

- ¿Quién define cómo debe guardarse la historia clínica en fisioterapia privada en España?
- ¿Qué exige exactamente la Ley 41/2002?
- ¿Qué exige la normativa autonómica de la Comunidad Valenciana?
- ¿Qué contenido mínimo debe tener una nota clínica de fisioterapia?
- ¿Cuánto tiempo debe conservarse?
- ¿Qué diferencias existen entre historia clínica, nota privada del profesional y documentación asistencial?

### 18.2 Uso de datos para Sócrates

- ¿Puede una clínica usar datos clínicos del paciente para asistencia directa con Sócrates?
- ¿Qué base jurídica permite usar datos para continuidad asistencial?
- ¿Qué base jurídica permite usar datos para mejora del producto?
- ¿Se requiere consentimiento separado para aprendizaje global?
- ¿Basta con pseudonimización o se requiere anonimización?
- ¿Puede usarse feedback clínico del profesional sin datos identificables del paciente?
- ¿Cómo debe informarse al paciente?

### 18.3 Rol de AiDux

- ¿AiDux sería encargado del tratamiento, responsable o corresponsable?
- ¿Qué debe contener el contrato de tratamiento de datos con la clínica?
- ¿Qué obligaciones tiene AiDux si procesa datos de salud?
- ¿Qué logs debe conservar?
- ¿Qué datos no debería conservar?

### 18.4 IA y producto sanitario

- ¿Cuándo Sócrates se mantiene como apoyo cognitivo/documental?
- ¿Cuándo cruza hacia clinical decision support regulado?
- ¿Cómo afecta el EU AI Act?
- ¿Cómo afecta MDR/medical device software si el sistema empieza a sugerir alternativas clínicas?
- ¿Qué wording reduce riesgo?
- ¿Qué nivel de human-in-the-loop debe demostrarse?

---

## 19. Preguntas técnicas a investigar

- ¿Qué campos devuelve Vertex actualmente que no estamos persistiendo?
- ¿Qué información relevante se pierde al guardar solo SOAP final?
- ¿Qué parte de la transcripción debe conservarse?
- ¿Cómo crear source pointers sin guardar todo el texto sensible?
- ¿Cómo versionar modelo, prompt y output?
- ¿Cómo registrar aceptación/rechazo del profesional?
- ¿Cómo evitar que Sócrates repita preguntas ignoradas?
- ¿Cómo medir utilidad clínica de una pregunta?
- ¿Cómo entrenar sin usar datos identificables?
- ¿Cómo exportar Sócrates como capa integrable en terceros?

---

## 20. Preguntas de producto a validar

- ¿Los fisioterapeutas quieren ser cuestionados por una IA?
- ¿Qué tono debe tener Sócrates para no sentirse invasivo?
- ¿Prefieren preguntas automáticas o botón manual?
- ¿Cuántas preguntas por sesión toleran?
- ¿Qué categorías de preguntas aportan más valor?
- ¿Qué preguntas generan rechazo?
- ¿Cuándo debe aparecer Sócrates: antes, durante o después de la sesión?
- ¿Qué valor percibe una clínica: calidad clínica, seguridad, documentación, aprendizaje profesional o diferenciación comercial?
- ¿Pagarían por esto separado del scribe?

---

## 21. Hipótesis a validar

### Hipótesis 1

Los profesionales no necesitan solo ayuda para escribir; necesitan ayuda para ver señales clínicas que se pierden por carga cognitiva.

### Hipótesis 2

Las mejores preguntas clínicas pueden mejorar calidad de razonamiento sin desplazar la decisión humana.

### Hipótesis 3

El feedback del profesional sobre preguntas útiles/no útiles puede construir un moat difícil de replicar.

### Hipótesis 4

Sócrates solo será valioso si está integrado al contexto clínico y no funciona como app paralela.

### Hipótesis 5

El aprendizaje de Sócrates debe basarse en eventos de deliberación, no en almacenamiento masivo de historias clínicas completas.

---

## 22. Riesgos principales

### Riesgo regulatorio

Que Sócrates sea interpretado como sistema de recomendación clínica o medical device si cruza la línea entre preguntar y decidir.

### Riesgo de privacidad

Guardar demasiado raw data puede aumentar exposición y obligaciones legales.

### Riesgo de workflow

Si Sócrates genera demasiadas preguntas, se vuelve ruido y aumenta carga cognitiva.

### Riesgo de confianza

Si pregunta desde inferencias no validadas, el clínico puede perder confianza.

### Riesgo competitivo

Grandes players pueden añadir botones similares. La defensa debe ser el contexto, el dataset de deliberación y la calidad de preguntas.

---

## 23. Principios de diseño

1. Human-in-the-loop real.
2. Preguntas, no órdenes.
3. Señales, no diagnósticos autónomos.
4. Trazabilidad por defecto.
5. Mínima retención de datos sensibles.
6. Separación entre hecho, inferencia y decisión.
7. No interrumpir salvo umbral alto.
8. Aprender de utilidad clínica, no de volumen bruto.
9. Evidencia curada antes que búsqueda libre.
10. Menos fricción, no más paneles.
11. **Vigencia temporal obligatoria.** Sócrates no puede razonar sobre un hecho como actual si ese hecho no conserva vigencia temporal confirmada. Solo hechos con `status: active`, sin `supersededBy` y con `validUntil` no expirado pueden ser base de una pregunta socrática.

---

## 24. Definición canónica propuesta

> Sócrates es la capa de deliberación clínica contextual de AiDux. Su función no es decidir por el profesional, sino detectar señales, inconsistencias y patrones longitudinales para formular preguntas clínicas útiles, trazables y prudentes. Su ventaja competitiva vendrá de aprender, con feedback humano y contexto clínico real, qué preguntas ayudan efectivamente a mejorar el razonamiento clínico en cada paciente y profesional.

---

## 25. Próximo paso recomendado

Antes de construir una nueva UI o una nueva llamada LLM, realizar una auditoría técnica de información actual:

```text
source → transformación → revisión humana → persistencia → uso futuro
```

Para cada dato capturado hoy por AiDux, decidir:

- ¿Es hecho clínico?
- ¿Es inferencia IA?
- ¿Es decisión humana?
- ¿Debe persistir?
- ¿Debe alimentar memoria longitudinal?
- ¿Puede alimentar Sócrates?
- ¿Necesita aceptación explícita del profesional?
- ¿Tiene base legal para el uso previsto?

Resultado esperado:

> Un mapa de datos clínicos que permita construir Sócrates como arquitectura de razonamiento contextual, no como prompt aislado.
