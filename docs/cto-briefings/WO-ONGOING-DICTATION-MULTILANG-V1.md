# WO-ONGOING-DICTATION-MULTILANG-V1

**Dictación multilenguaje (EN / ES / FR) + feedback claro de transcripción**

## Estado

**Propuesta aprobada (post-baseline)**  
No se ejecuta en `pilot-baseline-2026-final`.

---

## Objetivo

Permitir dictación en **EN / ES / FR** en el **modal Ongoing**, manteniendo la **salida del sistema siempre en en-CA**, y **eliminar la confusión del usuario** aclarando **cuándo aparece la transcripción**:

* **Ideal:** transcripción **inmediata (en vivo)**.
* **Fallback:** si no es viable técnicamente, **mensaje explícito** indicando que la transcripción aparecerá **al finalizar** el dictado.

---

## Alcance (Scope)

### Incluye

* UI de selección de idioma de dictación (EN / ES / FR).
* Estado `dictationLang` en `OngoingPatientIntakeModal.tsx`.
* Uso del `lang` correcto en Web Speech API.
* **Feedback UX claro** sobre el momento de la transcripción.
* **Solo** en Ongoing (feature flag).

### Excluye

* Baseline (`pilot-baseline-2026-final`).
* Backend.
* Prompts SOAP / idioma de salida (permanece **en-CA**).
* Cambios en `DictationButton` **si no son estrictamente necesarios**.

---

## Política de idioma (canónica)

* **Entrada (voz):** EN / ES / FR (Web Speech API).
* **Salida del sistema:** **en-CA siempre** (SOAP, análisis, notas).
* Esto **no se negocia** ni se modifica.

---

## Implementación técnica (aplicada)

### 1) Idiomas de dictación

```ts
const DICTATION_LANGUAGES = [
  { label: 'English', value: 'en-CA' },
  { label: 'Español', value: 'es' },
  { label: 'Français', value: 'fr-CA' },
];
```

### 2) Estado

```ts
const [dictationLang, setDictationLang] = useState<'en-CA' | 'es' | 'fr-CA'>('en-CA');
```

### 3) UI – Selector visible

* Ubicado **encima** de los campos con micrófono.
* Etiqueta clara: **"Dictation language"**.
* Micro-texto bajo el selector: **"Transcription will appear when you stop dictation."**
* Tooltip en cada micrófono: mismo mensaje.

---

## Transcripción: comportamiento (Opción B aplicada)

* Transcripción **al finalizar** el dictado (comportamiento actual de Web Speech API con `isFinal`).
* **Feedback UX obligatorio:** mensaje bajo el selector + tooltip en el botón de micrófono: *"Transcription will appear when you stop dictation."*

---

## Criterios de aceptación (DoD)

* [x] Selector EN / ES / FR visible en Ongoing.
* [x] Dictation usa el `lang` seleccionado.
* [x] El usuario entiende cuándo aparece la transcripción (mensaje explícito).
* [x] Output clínico sigue en **en-CA**.
* [x] Solo en ongoing (modal).
* [x] Baseline intacta.

---

## Riesgos conocidos (aceptados)

* Limitaciones de Web Speech API por navegador.
* Diferencias en soporte de `interimResults`.
* Se prioriza **claridad UX** sobre “magia técnica”.

---

## Rama y ejecución

* **Branch from:** `pilot-baseline-2026-final`
* **Rama sugerida:** `feature/ongoing-dictation-multilang`
* **Deploy:** solo tras validación manual.

---

## Cierre CTO

* El esfuerzo previo **está bien hecho**.
* No se perdió.
* Se reactiva **de forma ordenada**.
* La confusión actual del usuario queda **resuelta sí o sí** (por UX o por técnica).
