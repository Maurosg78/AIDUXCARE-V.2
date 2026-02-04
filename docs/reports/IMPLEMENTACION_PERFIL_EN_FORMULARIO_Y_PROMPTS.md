# Implementación: captura de perfil en formulario y conexión con prompts

**Objetivo:** (1) Que el formulario de onboarding capture la información del profesional en el nuevo modelo (practice areas + techniques, normalizado). (2) Que ese perfil forme parte del prompt y que la respuesta de Vertex sea adecuada a ese perfil.

---

## Resumen del flujo actual

| Pieza | Hoy | Después |
|-------|-----|--------|
| **Onboarding** | Wizard 2: `specialty` (single), `specialties[]` (checkboxes PRIMARY_SPECIALTIES), `specialtyOther`, MSK_SKILLS si MSK. | Añadir (o sustituir) captura de **áreas de práctica** (texto + sugerencias) y **técnicas** (texto + sugerencias). Al guardar: normalizar y persistir `practiceAreas[]`, `techniques[]`, `profileVocabVersion`, `unmatchedInputs`. |
| **Perfil (Firestore)** | `users/{uid}` con `specialty`, `profession`, `practicePreferences`, etc. | Añadir `practiceAreas`, `techniques`, `profileVocabVersion`, `unmatchedInputs`. Mantener `specialty` por compatibilidad (ej. primer código de área). |
| **PromptFactory-Canada** | `buildProfessionalContext(profile)` usa `profile.specialty`, `professionalTitle`, `experienceYears`, etc. Solo texto. | Incluir `practiceAreas[].label`, `techniques[].label` y `promptHint` por área (solo del vocabulario). Si no hay `practiceAreas`, usar `specialty` (retrocompat). |
| **Análisis (Niagara)** | `analyzeWithVertexProxy` recibe `professionalProfile` → `PromptFactory.create(..., professionalProfile)` → ya inyecta contexto. | Sin cambio de flujo: el mismo `professionalProfile` enriquecido llegará a `buildProfessionalContext`. |
| **SOAP** | `vertex-ai-soap-service.generateSOAPNote(context, options)` no recibe perfil. `buildSOAPPrompt` usa rol fijo: "for a registered physiotherapist in Ontario". | Pasar `professionalProfile` en `options`. En `SOAPPromptFactory`: construir rol/contexto desde perfil (profession + areas + técnicas) e inyectar al inicio del prompt. |

---

## 1. Captura en el formulario (onboarding)

### 1.1 Dónde

- **Archivo:** `src/pages/ProfessionalOnboardingPage.tsx`
- **Paso:** Wizard 2 (Clinical Practice & Style). Hoy: `specialties[]` (checkboxes), `specialtyOther`, `practicePreferences` (MSK_SKILLS si MSK).

### 1.2 Opciones de UX (recomendada: A + B híbrido)

**Opción A – Sustituir especialidades por áreas + técnicas**

- Quitar el bloque actual de "Primary specialties" (checkboxes) y "Other specialty".
- Añadir:
  - **Áreas de práctica:** un campo de texto multi-valor (tags/chips) con **sugerencias** desde el vocabulario canónico (PRACTICE_AREAS_VOCAB). El usuario puede elegir de la lista o escribir libre (ej. "MSK", "piso pélvico", "pediatría"). Se guarda lo que escribe; al enviar se normaliza.
  - **Técnicas:** igual, con sugerencias desde PRACTICE_TECHNIQUES_VOCAB (o equivalente). Ej. "McKenzie", "manual therapy", "dry needling".

**Opción B – Convivencia (menos disruptivo)**

- Mantener el bloque actual de specialties (checkboxes) para no romper validación ni perfiles existentes.
- Añadir **debajo** (o en un sub-paso):
  - **Áreas de práctica adicionales (opcional):** texto libre con sugerencias → se normaliza y se guarda en `practiceAreas` (si el usuario no toca nada, `practiceAreas` se puede derivar de `specialties` en el submit, ver 1.4).

Recomendación: **B** en v1 (convivencia) y migrar a A cuando la validación y el resto del sistema lean solo `practiceAreas`/`techniques`.

### 1.3 Estado del formulario

Añadir en `formData` (Wizard 2):

```ts
// Nuevos campos (normalizados se calculan al submit)
practiceAreasInput: '',   // texto libre, ej. "MSK, piso pélvico, pediatría"
techniquesInput: '',      // texto libre, ej. "McKenzie, manual therapy"
// Opcional: arrays ya parseados en UI (chips)
practiceAreasChips: string[],
techniquesChips: string[],
```

Si se usa solo texto libre, al enviar se hace `split` por comas/saltos y se normaliza cada token.

### 1.4 Al enviar (handleSubmit)

1. **Normalizar áreas:**  
   `normalizePracticeAreas(formData.practiceAreasInput || formData.specialties)`  
   - Si se usa convivencia: cuando `practiceAreasInput` esté vacío, pasar `formData.specialties` (códigos ya conocidos) para generar `practiceAreas: [{ code, label }]`.
2. **Normalizar técnicas:**  
   `normalizeTechniques(formData.techniquesInput || formData.practicePreferences.preferredTreatments)`  
   - Misma idea: si no hay texto libre, derivar de preferredTreatments.
3. **Obtener versión del vocabulario:**  
   `profileVocabVersion = CURRENT_PRACTICE_AREAS_VOCAB_VERSION` (constante junto al vocabulario).
4. **Guardar en perfil (updateProfile):**
   - `practiceAreas: matched[]` (solo códigos y labels; no incluir `raw` en el prompt).
   - `techniques: matched[]`
   - `profileVocabVersion: number`
   - `unmatchedInputs: { practiceAreas: unmatched[], techniques: unmatched[] }` si hay no-match.
   - **Retrocompat:** seguir guardando `specialty: practiceAreas[0]?.code || formData.specialty` para consumidores que solo lean `specialty`.

### 1.5 Dónde vive la normalización

- **Módulo nuevo (recomendado):** `src/core/profile/normalizeProfessionalProfile.ts`  
  - `normalizePracticeAreas(input: string | string[], vocab: PracticeAreasVocab): { matched: Array<{ code, label }>, unmatched: string[] }`
  - `normalizeTechniques(input: string | string[], vocab: TechniquesVocab): { matched: [...], unmatched: string[] }`
- **Vocabulario:** `src/config/vocabularies/practiceAreasV1.ts` (y opcionalmente `techniquesV1.ts`) con `version`, `effectiveDate`, lista de `{ code, label, aliases, promptHint? }`.

---

## 2. Tipo de perfil y Firestore

### 2.1 Extensión del tipo (ProfessionalProfile)

En `src/context/ProfessionalProfileContext.tsx` (y cualquier tipo compartido de perfil):

```ts
// Añadir a ProfessionalProfile
practiceAreas?: Array<{ code: string; label: string; raw?: string }>;
techniques?: Array<{ code: string; label: string; raw?: string }>;
profileVocabVersion?: number;
unmatchedInputs?: {
  practiceAreas: string[];
  techniques: string[];
};
```

- **specialty** se mantiene; puede seguir siendo el "primero" de practiceAreas o el valor legacy para no romper guards ni UI que solo lean `specialty`.

### 2.2 Validación de perfil completo

En `src/utils/professionalProfileValidation.ts` (y donde se use `isProfileComplete`):

- Considerar perfil "con especialidad" si:  
  `(profile.specialty && profile.specialty.trim() !== '') || (profile.practiceAreas && profile.practiceAreas.length > 0)`.
- Así, perfiles antiguos (solo `specialty`) y nuevos (solo `practiceAreas` o ambos) siguen siendo válidos.

---

## 3. Conexión con el prompt (que el perfil sea parte del prompt)

### 3.1 Quién construye el prompt con perfil

- **Análisis (Niagara):** ya usa `PromptFactory.create(..., professionalProfile)`. Ahí se llama a `buildProfessionalContext(professionalProfile)` y se concatena al prompt. No hay que cambiar la firma; solo el contenido de `buildProfessionalContext`.
- **SOAP:** hoy no recibe perfil. Hay que pasar `professionalProfile` y usarlo al construir el prompt.

### 3.2 buildProfessionalContext (PromptFactory-Canada)

**Archivo:** `src/core/ai/PromptFactory-Canada.ts`

- **Si** el perfil tiene `practiceAreas` (length > 0):
  - Añadir al bloque `[Clinician Profile]`:
    - `Profession: <professionLabel>` (desde `profile.profession` o professionalTitle).
    - `Practice areas: <labels de practiceAreas>` (solo labels, nunca `raw`).
    - `Main techniques: <labels de techniques>` (solo labels).
    - Para cada código en `practiceAreas` que tenga `promptHint` en el vocabulario, concatenar una línea con ese hint (texto curado, no input del usuario).
- **Si no** hay `practiceAreas`, mantener el comportamiento actual: usar `profile.specialty` y `profile.professionalTitle` para no romper perfiles viejos.
- No incluir nunca `practiceAreas[].raw` ni texto libre del usuario en el prompt (anti–prompt injection).

Con eso, la **respuesta** del modelo será adecuada al perfil porque el propio prompt contiene "quién es el clínico y en qué áreas/técnicas trabaja" más los hints por área.

### 3.3 SOAP: inyectar perfil en el prompt

**Flujo:**

1. **Llamada a SOAP:**  
   En `ProfessionalWorkflowPage` (o donde se llame a `generateSOAPNoteFromService`), pasar el perfil en options:  
   `generateSOAPNoteFromService(organized.context, { ..., professionalProfile: professionalProfile })`.

2. **vertex-ai-soap-service:**  
   En `generateSOAPNote`, aceptar `options.professionalProfile` y pasarlo a `buildSOAPPrompt(context, { ...options, professionalProfile })`.

3. **SOAPPromptFactory:**  
   - Añadir a `SOAPPromptOptions`: `professionalProfile?: ProfessionalProfile | null`.
   - En `buildInitialAssessmentPrompt`, `buildFollowUpPrompt`, y el resto de builders que generen el primer párrafo:
     - Si hay `professionalProfile`, construir la línea de rol dinámicamente, por ejemplo:  
       `You are a clinical documentation assistant for a registered [physiotherapist/chiropractor/RMT] in Ontario, Canada.`  
       (mapear `profile.profession` a etiqueta para el rol).
     - Opcional: añadir 1–2 líneas de contexto desde `buildProfessionalContext(professionalProfile)` (solo labels + promptHints), para que el SOAP también se adapte a áreas/técnicas.
   - Si no hay perfil, mantener el texto actual: "for a registered physiotherapist in Ontario, Canada".

Así, **parte del prompt es el perfil** (rol + contexto) y la **respuesta** (SOAP y análisis) queda alineada con ese perfil sin paths por especialidad.

---

## 4. Orden sugerido de implementación

1. **Vocabulario y normalización**  
   - Añadir `src/config/vocabularies/practiceAreasV1.ts` (y técnicas si aplica) con `version`, códigos, labels, aliases, `promptHint`.  
   - Implementar `normalizePracticeAreas` y `normalizeTechniques` en `src/core/profile/normalizeProfessionalProfile.ts` con retorno `{ matched, unmatched }`.  
   - Tests unitarios para normalización (acentos, alias, no-match).

2. **Perfil y persistencia**  
   - Extender tipo `ProfessionalProfile` con `practiceAreas`, `techniques`, `profileVocabVersion`, `unmatchedInputs`.  
   - En onboarding, al guardar: llamar a normalización, rellenar esos campos y seguir guardando `specialty` para compatibilidad.  
   - Actualizar `isProfileComplete` (o equivalente) para aceptar `practiceAreas` como alternativa a `specialty`.

3. **Formulario**  
   - Añadir en Wizard 2 los campos de áreas y técnicas (texto + sugerencias desde vocabulario, o convivencia con checkboxes como en 1.2).  
   - En submit, usar normalización y guardar en perfil como en 1.4.

4. **buildProfessionalContext**  
   - En `PromptFactory-Canada.ts`, si `profile.practiceAreas?.length` > 0: usar practiceAreas/techniques y promptHints del vocabulario; si no, usar `specialty`/professionalTitle como hoy.  
   - No inyectar nunca `raw` ni texto libre del usuario.

5. **SOAP**  
   - Añadir `professionalProfile` a `SOAPPromptOptions` y a la llamada a `generateSOAPNote` desde el workflow.  
   - En `SOAPPromptFactory`, construir rol (y opcionalmente 1–2 líneas de contexto) desde el perfil; fallback a "physiotherapist" si no hay perfil.

6. **Evaluación física (futuro)**  
   - Cuando la biblioteca de tests tenga `domains[]`, filtrar/ordenar por intersección con `profile.practiceAreas[].code` como en la propuesta de perfil.

---

## 5. Esquema de datos (resumen)

**Firestore `users/{uid}` (campos nuevos o modificados):**

```ts
{
  // Existentes
  profession: string,
  specialty: string,  // mantener; puede ser practiceAreas[0].code o legacy
  practicePreferences: { ... },
  // Nuevos
  practiceAreas: [
    { code: 'msk', label: 'Musculoskeletal (MSK)' },
    { code: 'pelvic', label: 'Pelvic Health' }
  ],
  techniques: [
    { code: 'manual-therapy', label: 'Manual Therapy' },
    { code: 'mckenzie', label: 'McKenzie Method' }
  ],
  profileVocabVersion: 1,
  unmatchedInputs: {
    practiceAreas: ['vestibular rehab'],
    techniques: []
  }
}
```

**Prompt (fragmento de ejemplo):**

```
[Clinician Profile]
Profession: Physiotherapist
Practice areas: Musculoskeletal (MSK), Pelvic Health
Main techniques: Manual Therapy, McKenzie Method
Experience: 5 years
Focus on function and goals; avoid detailed intimate anatomy.
```

Con esto el formulario captura la información del profesional, se normaliza y persiste, y tanto el análisis como el SOAP reciben ese perfil como parte del prompt para que la respuesta sea adecuada al perfil.
