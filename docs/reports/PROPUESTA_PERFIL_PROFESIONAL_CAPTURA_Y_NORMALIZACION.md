# Propuesta: Captura y normalización del perfil profesional para Vertex y evaluación física

**Objetivo:** Capturar profesión, área(s) de especialidad y técnicas de trabajo de forma flexible (incluso texto libre), normalizar a un vocabulario canónico, y construir **un único perfil** que alimente tanto las consultas a Vertex (SOAP, análisis) como la evaluación física propuesta, **sin paths de código por especialidad**.

---

## 1. Orden de captura y modelo de datos

### 1.1 Secuencia en onboarding

1. **Profesión** (obligatorio)  
   - Valor controlado: Physiotherapist, Chiropractor, RMT, PT Assistant, Other.  
   - Determina el “rol” base en prompts y el alcance legal (scope) que la IA no debe cruzar.

2. **Área(s) de práctica / especialidad** (multi, flexible)  
   - En fisio no existen especialidades formales como en medicina; se pregunta por **área(s) en las que trabaja**.  
   - UX: campo(s) de texto con autocompletado/sugerencias basadas en vocabulario canónico, pero permitiendo texto libre.  
   - Ejemplos de entrada: “MSK”, “musculoesquelético”, “piso pélvico”, “pelvic health”, “pediatría”, “neuro”, “oncología rehab”.  
   - Se persiste tanto el **texto original** (para mostrar al usuario) como el **código normalizado** (para lógica).

3. **Técnicas con las que suele trabajar** (multi, flexible)  
   - Texto libre o sugerencias: “McKenzie”, “manual therapy”, “punción seca”, “Pilates clínico”, “exercicio terapéutico”, etc.  
   - Misma idea: guardar original + normalizado para construir el perfil que va a Vertex.

### 1.2 Estructura del perfil (salida normalizada)

Objeto único que se guarda en Firestore y se inyecta en cada llamada a Vertex y en la lógica de evaluación física:

```ts
// Conceptual - no implica cambiar ya el tipo en código
interface ProfessionalProfileForAI {
  profession: string;           // código: physio | chiropractor | rmt | ...
  professionLabel: string;     // etiqueta para prompts: "physiotherapist", "chiropractor", ...
  practiceAreas: Array<{
    code: string;              // normalizado: msk | pelvic | paediatrics | neuro | cardio | oncology | general
    label: string;              // para mostrar en UI / en contexto de prompt
    raw?: string;              // opcional: lo que escribió el usuario
  }>;
  techniques: Array<{
    code: string;              // normalizado: manual-therapy | mckenzie | dry-needling | ...
    label: string;
    raw?: string;
  }>;
  yearsOfExperience: number;
  practiceSetting?: string;     // clinic | hospital | ...
  // ... resto de campos actuales (country, workplace, etc.)
}
```

- **Un solo perfil** alimenta: (a) bloque de contexto para Vertex (SOAP, análisis), (b) filtrado/priorización de tests de evaluación física.  
- Añadir una nueva profesión o área implica **solo datos** (vocabulario + alias), no nuevos `if (specialty === 'X')` en el código.

---

## 2. Normalización de texto libre

### 2.1 Problemas a cubrir

- **Acentos y mayúsculas:** “Pediatría”, “PEDIATRIA”, “pediatria” → mismo código.  
- **Acrónimos y variantes:** “MSK”, “msk”, “musculoesquelético”, “musculoskeletal” → `msk`.  
- **Anglicismos / bilingüe:** “Dry needling”, “punción seca”, “IMS” → mismo código.  
- **Sinónimos:** “Piso pélvico”, “pelvic health”, “suelo pélvico” → `pelvic`.  
- **Typos leves:** distancia de edición o fuzzy match contra lista canónica (opcional en v1).

### 2.2 Enfoque recomendado: vocabulario canónico + mapa de alias

1. **Lista canónica por dominio**  
   - **Áreas de práctica:** `msk`, `neuro`, `cardio`, `pelvic`, `paediatrics`, `geriatrics`, `oncology`, `general`, etc.  
   - **Técnicas:** `manual-therapy`, `mckenzie`, `dry-needling`, `pilates`, `vestibular`, etc.  
   Cada ítem tiene: `code`, `label` (en-US o en-CA), y opcionalmente `labelEs` u otros idiomas.

2. **Mapa de alias → código**  
   - Por cada código, una lista de strings que se consideran equivalentes (normalizados: sin acentos, minúsculas, trim).  
   - Ejemplo para `pelvic`:  
     `["pelvic", "pelvic health", "piso pelvico", "suelo pelvico", "pelvic floor", "pelvic health"]`.  
   - Ejemplo para `dry-needling`:  
     `["dry needling", "dry-needling", "puncion seca", "punción seca", "ims", "functional dry needling"]`.

3. **Pipeline de normalización**  
   - Input: string en bruto (ej. “Piso pélvico y MSK”).  
   - Paso 1: normalizar texto (quitar acentos, minúsculas, trim, colapsar espacios).  
   - Paso 2: split por delimitadores (coma, “y”, “and”, “/”) → tokens.  
   - Paso 3: por cada token, buscar en mapa de alias; si hay match → añadir `code` (y `label`) al resultado; si no, opciones:  
     - guardar como “other” con `raw` del token, o  
     - intentar fuzzy match contra códigos conocidos (v2).  
   - Salida: lista de `{ code, label, raw? }` sin duplicados.

4. **Persistencia**  
   - En Firestore se guardan tanto `practiceAreas[]` y `techniques[]` **normalizados** (para Vertex y evaluación) como, si se desea, el texto original del usuario para mostrar en “Tu perfil” o en futuras mejoras de matching.

Así se puede permitir **texto libre** en onboarding sin listas interminables, y a la vez tener un perfil estable para la IA y para la evaluación física.

---

## 3. Uso del perfil en Vertex (prompts)

### 3.1 Un solo bloque de “professional context”

- Todas las llamadas que necesiten contexto del clínico (SOAP, análisis Niagara, etc.) reciben el **mismo** objeto de perfil normalizado.  
- Construcción del texto inyectado en el prompt, por ejemplo:  
  - “Profession: [professionLabel]. Practice areas: [practiceAreas.labels]. Main techniques: [techniques.labels]. Experience: [years] years.”  
  - Opcional: “Documentation scope: [profession] only; do not diagnose outside scope; do not prescribe.”

### 3.2 Sin paths por especialidad

- **No** hacer `if (specialty === 'pelvic') { ... } else if (specialty === 'paediatrics') { ... }` en el código de prompts.  
- En su lugar: el prompt genérico incluye siempre el bloque de professional context; el modelo adapta el tono y el contenido en función de ese texto.  
- Si en el futuro se necesitan instrucciones muy específicas por área, se pueden añadir **frases opcionales** por código de área (p. ej. “If practice areas include pelvic: avoid detailed intimate anatomy; focus on function and goals.”) como fragmentos que se concatenan al prompt según `practiceAreas[].code`, pero siguiendo una **configuración por datos** (lista de códigos → fragmento), no ramas de código nuevas por profesión.

---

## 4. Uso del perfil en la evaluación física propuesta

### 4.1 Situación actual (resumen)

- La lista de tests sugeridos viene de la respuesta del análisis (p. ej. Niagara: `evaluaciones_fisicas_sugeridas`).  
- Esos nombres se emparejan con una biblioteca (p. ej. MSK_TEST_LIBRARY) y se ordenan por importancia.  
- El perfil se usa en algunos sitios para filtrar (p. ej. por país o por etiquetas de especialidad), pero no hay un único “perfil normalizado” que rija tanto prompts como evaluación.

### 4.2 Objetivo

- **Misma fuente de verdad:** el perfil normalizado (practice areas + techniques) debe influir en:  
  - qué tests se sugieren o priorizan, y  
  - cómo se describe la evaluación en el prompt que pide “sugerir tests” (si esa sugerencia se hace vía Vertex).  
- **Sin paths únicos por especialidad:**  
  - En vez de “si es pelvic mostrar tests A, B, C; si es paeds mostrar D, E, F” en código, se mantiene:  
    - Una **biblioteca de tests** con metadatos (dominios/etiquetas), p. ej. `domains: ['msk']`, `domains: ['msk','pelvic']`, etc.  
    - Una **regla genérica:** “filtrar/ordenar tests cuya intersección con `profile.practiceAreas[].code` no sea vacía”.  
  - Así, un fisio con “MSK + piso pélvico” recibe tests que tengan `msk` o `pelvic` en sus dominios, sin código específico para “pelvic” o “paediatrics”.

### 4.3 Extensión futura (más profesiones)

- Nuevas profesiones: se añade un valor a la lista de profesiones y, si aplica, un fragmento de scope para prompts.  
- Nuevas áreas: se añade código + alias al vocabulario; la biblioteca de tests puede etiquetar tests con esos códigos.  
- Nuevas técnicas: solo vocabulario + alias; el perfil ya incluye `techniques[]` y Vertex lo usa como contexto.  
- En todos los casos, la lógica sigue siendo: “perfil normalizado → contexto para Vertex; perfil → filtro/orden por dominios”; no nuevos caminos de código por especialidad.

---

## 5. Resumen de principios

| Principio | Cómo se concreta |
|----------|-------------------|
| **Captura flexible** | Profesión fija; áreas y técnicas con texto libre + sugerencias, multi-selección. |
| **Normalización única** | Un pipeline: texto → alias/vocabulario canónico → códigos + labels. Manejo de acentos, acrónimos, anglicismos. |
| **Un solo perfil** | Un objeto normalizado (profession, practiceAreas, techniques, experience, setting) en Firestore y en memoria. |
| **Vertex** | Ese perfil se inyecta como “professional context” en todos los prompts; sin ramas por especialidad en código. |
| **Evaluación física** | Mismo perfil para filtrar/priorizar tests por dominios (tags) de la biblioteca; reglas genéricas, no paths por especialidad. |
| **Escalar sin “dejar la cagada”** | Nuevas profesiones/áreas/técnicas = datos (vocabulario + alias + tags en tests); no nuevos if/else ni flujos exclusivos por especialidad. |

---

## 7. Decisiones de diseño críticas (para WO)

### 7.1 Observabilidad del "no match"

**Problema:** Usuario escribe "vestibular rehab" y no hay alias para ese término → se guarda como `{ code: 'other', raw: 'vestibular rehab' }`.

**Solución:**
- Registrar **todos** los inputs que no matchean en analytics o en un campo dedicado:
  ```ts
  interface ProfessionalProfile {
    // ...
    unmatchedInputs?: {
      practiceAreas: string[];
      techniques: string[];
    };
  }
  ```
- O evento de analytics: `unmatched_practice_area` con payload `{ input: 'vestibular rehab', userId, timestamp }`.

**Por qué:** Alimenta el vocabulario con datos reales. Sin esto, se adivina qué alias faltan. Con esto, se prioriza por frecuencia de uso.

**Implementación:**
- Función `normalizePracticeAreas` devuelve también `{ unmatched: string[] }`.
- Al guardar perfil, si hay unmatched, se logea evento o se persiste en campo dedicado.
- Dashboard interno (futuro): "Top 20 unmatched inputs → candidatos para añadir al vocabulario".

---

### 7.2 Versionado del vocabulario

**Problema:** Si `PRACTICE_AREAS_VOCAB` cambia (ej. se añade alias "sports rehab" → `msk`), perfiles guardados antes del cambio pueden quedar desactualizados.

**Solución:**
- Vocabulario tiene un `version` o `effectiveDate`:
  ```ts
  const PRACTICE_AREAS_VOCAB_V2 = {
    version: 2,
    effectiveDate: '2026-02-15',
    areas: [ ... ]
  };
  ```
- Perfil guarda `profileVocabVersion: 2` al momento de normalización.
- **Política de re-normalización:**
  - **On-read:** Si `profile.profileVocabVersion < CURRENT_VOCAB_VERSION`, re-normalizar `practiceAreas` y `techniques` usando vocabulario actual.
  - **On-login:** Job que re-normaliza perfiles desactualizados.
  - **Lazy:** Re-normalizar solo cuando el usuario edita su perfil.

**Por qué:** Evita inconsistencias. Sin versionado, un perfil normalizado con vocab v1 puede no aprovechar mejoras de vocab v2 (nuevos alias, correcciones).

**Implementación:**
- Al guardar perfil: `profile.profileVocabVersion = CURRENT_VOCAB_VERSION`.
- Al leer perfil para Vertex/evaluación: si versión < actual, re-normalizar (o flag de "stale profile").

---

### 7.3 `promptHint` solo curado (no user-generated)

**Problema:** Si el usuario puede escribir texto libre que se inyecta directamente en prompts, riesgo de prompt injection.

**Solución:**
- **`promptHint` es solo texto fijo** definido en `PRACTICE_AREAS_VOCAB`:
  ```ts
  {
    code: 'pelvic',
    label: 'Pelvic Health',
    aliases: ['pelvic', 'piso pelvico', ...],
    promptHint: 'Focus on function and goals; avoid detailed intimate anatomy.'
  }
  ```
- **Nunca** concatenar input libre del usuario (`raw`) al prompt.
- Si se necesita contexto adicional del usuario (ej. "trabajo principalmente con atletas"), capturarlo en campo estructurado aparte (ej. `practiceSetting: 'sports clinic'`) y sanitizar antes de usar.

**Por qué:** Principio de seguridad + "datos controlados, no código". Los hints son datos, pero curados por el equipo, no generados por usuarios.

**Implementación:**
- Template de prompt usa solo `promptHint` del vocabulario canónico.
- Validar que `buildProfessionalContext` nunca incluye `practiceAreas[].raw` sin sanitización.

---

### 7.4 Prioridad de tests cuando hay múltiples áreas

**Problema:** Usuario con `practiceAreas: ['msk', 'pelvic', 'oncology']`. Un test tiene `domains: ['msk', 'pelvic']`. ¿Cómo ordenar?

**Opciones:**

1. **Simple (v1):** Filtrado binario (intersección sí/no). Tests con cualquier dominio en común se muestran; orden por `importance` del test.
2. **Ponderado (v2):** Test tiene `primaryDomain` o `domainWeights: { msk: 0.8, pelvic: 0.2 }`. Se calcula score según overlap con perfil del usuario.

**Decisión inicial (para WO):**
- Usar **opción 1** (simple) en primera iteración.
- Estructura de test incluye `domains: string[]` + `importance: number`.
- Filtrado: `test.domains.some(d => profile.practiceAreas.map(a => a.code).includes(d))`.
- Ordenamiento: por `importance` del test (descendente).

**Futuro:** Si hay feedback de usuarios tipo "tests no son relevantes para mi área principal", añadir `primaryDomain` o weights en biblioteca de tests. Esto se especifica en el WO de `TEST_LIBRARY` (separado del WO de normalización de perfil).

**Por qué:** No sobre-diseñar. Empezar simple (filtrado + importance) y evolucionar con datos reales de uso.

---

## 8. Próximos pasos sugeridos (actualizado)

1. **Definir vocabulario canónico v1**  
   - 7-10 áreas más comunes con códigos, labels y aliases.  
   - Incluir `promptHint` curado para cada área.  
   - Versión inicial: `PRACTICE_AREAS_VOCAB_V1 = { version: 1, effectiveDate: '2026-02-15', areas: [...] }`.

2. **Pipeline de normalización con observabilidad**  
   - Función `normalizePracticeAreas(input) → { matched: [], unmatched: [] }`.  
   - Tests unitarios con casos reales (acentos, acrónimos, no-match).  
   - Tests unitarios con casos reales (acentos, “MSK”, “piso pélvico”, “dry needling”, etc.).

3. **Adaptar onboarding**  
   - Paso “Áreas de práctica”: campo texto (o multi-input) con sugerencias desde el vocabulario, guardando normalizado + raw.  
   - Paso “Técnicas”: igual.  
   - Guardar en el documento de perfil (Firestore) la estructura normalizada.

4. **Unificar consumo del perfil**  
   - Todas las llamadas a Vertex que hoy usen “specialty” o datos sueltos del perfil deben pasar a usar el objeto normalizado (practiceAreas, techniques, profession).  
   - Evaluación física: que la sugerencia de tests (ya sea por Vertex o por filtrado de biblioteca) use solo `profile.practiceAreas` (y opcionalmente `profile.techniques`) con reglas genéricas por dominios/tags.

Con esto se puede **capturar** bien las habilidades del fisio (y luego de otras profesiones) y hacer que Vertex y la evaluación física sean acordes al perfil, **sin crear paths únicos por especialidad** y preparando el terreno para crecer a más profesiones sin duplicar lógica.
