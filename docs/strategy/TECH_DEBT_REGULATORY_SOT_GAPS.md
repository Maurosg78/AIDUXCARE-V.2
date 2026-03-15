## WO-REG-SOT-01 — Deuda técnica vs. SoT regulatorio

**Título:** Registro de deuda técnica para adaptar AiDux al SoT regulatorio  
**Versión:** 1.0  
**Fuente de verdad regulatoria:** `docs/architecture/AIDUXCARE_REGULATORY_DESIGN_SOT.md`

---

### 1. Objetivo

Crear un registro accionable de **deuda técnica regulatoria**: identificar y perseguir, de forma incremental, todos los elementos ya creados que **no cumplen totalmente** con el SoT regulatorio, sin bloquear el MVP.

---

### 2. Principios de este registro

- **No es bloqueo del MVP**: estas tareas se ejecutan progresivamente, priorizadas.  
- **Todo hallazgo debe ser trazable** a:
  - archivo(s) concreto(s),
  - fragmento de código o prompt,
  - regla violada del SoT.  
- **Cada ítem de deuda debe poder convertirse en una WO pequeña** (1–2 PRs).

---

### 3. Categorías de deuda regulatoria

Usar estas categorías para clasificar hallazgos:

1. **PROMPTS-BOUNDARY**  
   Prompts que cruzan o rozan la línea entre:
   - documentación asistida, y  
   - soporte a decisión / diagnóstico / recomendación terapéutica.

2. **SOAP-BOUNDARY**  
   Generación de SOAP que:
   - introduce diagnósticos no explícitos,  
   - sugiere tratamientos,  
   - o mezcla razonamiento clínico con decisiones automáticas.

3. **PATTERN-MODULES**  
   Módulos como:
   - red flag detection,  
   - narrativa clínica,  
   - evolución longitudinal,  
   que actualmente **producen lenguaje clínico con sabor a decisión** (p. ej. “reducción clínicamente significativa”) en lugar de mera descripción.

4. **UX-DISCLOSURE**  
   Lugares de la UI donde:
   - no se indica claramente que el contenido es borrador generado por IA, o  
   - el flujo de finalización no refuerza suficientemente el rol del clínico.

5. **AUDIT-TRAIL-GAPS**  
   Zonas donde:
   - no queda claro qué parte del texto viene de IA vs. edición humana,  
   - no se registra bien el paso de borrador → final.

---

### 4. Búsqueda inicial recomendada (checklist de rastreo)

Esta sección define **cómo ir a buscarlos** en el repositorio.

#### 4.1. PROMPTS-BOUNDARY

- **Archivos clave:**
  - `src/core/ai/PromptFactory-Canada.ts`
  - `src/core/soap/SOAPPromptFactory.ts`
  - `src/core/soap/followUp/buildFollowUpPromptV3.ts`
  - Cualquier archivo bajo `src/core/prompts/`  

- **Patrones a buscar:**
  - `"diagnosis"` / `"diagnostic"`
  - `"working diagnosis"`
  - `"recommend"` / `"recommended"`
  - `“treatment plan”` cuando no esté claramente acotado a “documented by clinician”
  - `"Note when medical imaging or physician follow-up is required"`
  - `"evidence-based assessments"` / `"assessments as considerations"`

- **Ejemplos ya detectados:**
  - `PromptFactory-Canada.ts`:

    ```22:29:src/core/ai/PromptFactory-Canada.ts
    CORE: Expose clinical variables. Never diagnose. Present differential considerations. Highlight when medical referral needed.
    ```

    - Comentario: *buena intención (“Never diagnose”), pero “Present differential considerations” + “Highlight when medical referral needed” se acerca a soporte a decisión (SoT §3, §10).*

  - `SOAPPromptFactory.ts`:

    ```94:101:src/core/soap/SOAPPromptFactory.ts
    **ASSESSMENT:** Clinical reasoning and diagnosis
    - Working diagnosis based on S+O findings
    ...
    ```

    - Comentario: *“diagnosis” dentro de la sección Assessment choca con SoT §6 (Assessment no debe crear diagnósticos).*

#### 4.2. SOAP-BOUNDARY

- **Archivos clave:**
  - `src/core/soap/SOAPPromptFactory.ts`
  - `src/services/vertex-ai-soap-service.ts`
  - `src/components/SOAPEditor.tsx`

- **Patrones a revisar:**
  - Secciones donde el PLAN pueda inferir/añadir tratamientos no presentes en el contexto.
  - Validaciones que **solo alertan** pero no bloquean modalidades inventadas (ej. láser, TENS, parámetros numéricos).

- **Ejemplo ya detectado:**

  ```129:147:src/services/vertex-ai-soap-service.ts
  Anti-Hallucination Validation... log warnings if AI suggests specific modalities...
  // Do NOT remove any content - user can add modalities manually
  ```

  - Comentario: *el validador no corrige ni bloquea; solo advierte. Desde SoT §8, idealmente la IA no debería proponer modalidades con parámetros si no vienen del clínico.*

#### 4.3. PATTERN-MODULES

- **Archivos clave:**
  - `src/core/synthesis/synthesizeClinicalNarrative.ts`
  - `src/core/synthesis/LongitudinalEvolution.ts`
  - `src/core/clinical/clinicalReportService.ts`

- **Patrones a revisar:**
  - Frases como:
    - `"clínicamente significativa"`
    - `"mejoría clínica"`, `"empeoramiento sintomático"`
    - `direction: 'redflag'` que luego se use para textos con tono de decisión.

- **Ejemplo ya detectado:**

  ```90:116:src/core/synthesis/LongitudinalEvolution.ts
  clinicallyMeaningful: absChange >= 2,
  narrativeText: buildLongitudinalNarrative(...)
  ...
  return `... con reducción clínicamente significativa.`;
  ```

  - Comentario: *SoT §10 permite describir patrones (“dolor reducido de 7/10 a 2/10”), pero “reducción clínicamente significativa” ya introduce juicio clínico implícito.*

#### 4.4. UX-DISCLOSURE

- **Archivos clave:**
  - `src/components/SOAPEditor.tsx`
  - `src/components/SOAPReportTab.tsx`
  - `src/components/ReferralReportModal.tsx`
  - Componentes de la landing relevantes (`SolutionSection`, etc.).

- **Checks:**
  - ¿Existe texto explícito tipo “Draft generated by AiDux. Please review before finalizing.”? (SoT §11)
  - ¿Se deja claro en cada vista donde aparece texto IA que es **borrador** y no nota definitiva?

#### 4.5. AUDIT-TRAIL-GAPS

- **Archivos clave:**
  - `src/services/PersistenceService.ts`
  - `src/repositories/encountersRepo.ts`
  - `src/services/analyticsService.ts`

- **Preguntas:**
  - ¿Se guardan versiones previas del SOAP o solo el último texto?  
  - ¿Se etiqueta de alguna forma qué parte fue generada por IA?  
  - ¿Se distingue entre “generated”, “edited”, “finalized”?  

---

### 5. Formato de ítems de deuda

Cada hallazgo debe registrarse en este mismo archivo (o en un sub-archivo dedicado) con el siguiente formato:

```md
#### [ID] Título corto

- **Categoría:** PROMPTS-BOUNDARY | SOAP-BOUNDARY | PATTERN-MODULES | UX-DISCLOSURE | AUDIT-TRAIL-GAPS
- **Archivo(s):** `ruta/al/archivo.tsx`, ...
- **Fragmento relevante:**
  ```startLine:endLine:ruta
  // código/prompt relevante
  ```
- **Regla SoT afectada:** (ej. §2 Forbidden behaviors, §6 SOAP Generation Rules, §10 Clinical Pattern Modules)
- **Riesgo:** bajo | medio | alto (explicación corta)
- **Sugerencia de corrección:** explicación breve de enfoque regulatorio-safe
```

---

### 6. Ejemplos iniciales de deuda ya identificada

> **Nota:** Estos son ejemplos semilla; deben completarse con más detalle cuando se aborden.

#### [REG-SOT-PR-001] Assessment con “diagnosis” en prompt SOAP

- **Categoría:** PROMPTS-BOUNDARY / SOAP-BOUNDARY  
- **Archivo:** `src/core/soap/SOAPPromptFactory.ts`  
- **Fragmento relevante:**

```94:101:src/core/soap/SOAPPromptFactory.ts
**ASSESSMENT:** Clinical reasoning and diagnosis
- Working diagnosis based on S+O findings
...
```

- **Regla SoT afectada:** §6 (Assessment no debe crear diagnósticos; debe limitarse a reflejar impresiones del clínico).  
- **Riesgo:** medio — el prompt puede inducir al modelo a formular diagnósticos en lenguaje fuerte.  
- **Sugerencia de corrección:** cambiar wording a:
  - “Clinical impression as documented by the physiotherapist”  
  - reforzar “Do not create new diagnoses; only restate or structure clinician language”.

#### [REG-SOT-PM-001] “Reducción clínicamente significativa” en narrativa longitudinal

- **Categoría:** PATTERN-MODULES  
- **Archivo:** `src/core/synthesis/LongitudinalEvolution.ts`  
- **Fragmento relevante:**

```90:115:src/core/synthesis/LongitudinalEvolution.ts
const clinicallyMeaningful = absChange >= 2;
...
if (direction === 'improved') {
  if (clinicallyMeaningful) {
    return `Disminución progresiva del dolor desde ${first}/10 ... con reducción clínicamente significativa.`;
  }
...
```

- **Regla SoT afectada:** §3 (solo descripción de datos), §10 (módulos de patrones solo describen, no califican clínicamente).  
- **Riesgo:** medio — introduce juicio de “importancia clínica” que puede ser interpretado como valoración terapéutica.  
- **Sugerencia de corrección:** mantener cálculo interno de MCID, pero:
  - limitar narrativa a “Disminución progresiva del dolor desde X/10 a Y/10”  
  - si se usa MCID, solo como dato para dashboards internos, no en texto clínico.

---

### 7. Próximos pasos sugeridos

1. **Mapeo completo de prompts** (PROMPTS-BOUNDARY):
   - Revisar todos los prompts bajo `src/core/ai` y `src/core/soap` frente a SoT.  
   - Registrar 5–10 ítems de deuda concretos con el formato de §5.

2. **Revisión de módulos de patrones** (PATTERN-MODULES):
   - Ajustar wording de `synthesizeClinicalNarrative` y `LongitudinalEvolution` para:
     - describir hechos (“dolor reducido de X a Y”),  
     - evitar términos de juicio (“clínicamente significativo”, “empeoramiento importante”, etc.) salvo que vengan literalmente del clínico.

3. **UX Disclosure**:
   - Añadir textos SoT §11 en:
     - `SOAPEditor` (cabecera de la nota generada),
     - modales de informe derivador.

4. **Audit Trail**:
   - Diseñar mini-plan para:
     - versionado de SOAP,  
     - flags de origen de texto (AI vs humano),  
     - registro de transición draft → final.

---

### 8. Relación con SoT

Este documento **no redefine** el SoT, solo lo aplica a la base de código actual para:

- hacer visibles las brechas, y  
- convertirlas en pequeñas unidades de trabajo (WO-REG-XXX) que puedan ejecutarse sin romper el MVP.

Toda decisión de priorización debe alinearse con:

- `docs/architecture/AIDUXCARE_REGULATORY_DESIGN_SOT.md`  
- Documentos de compliance (`docs/compliance/*`, `docs/north/*`).  

