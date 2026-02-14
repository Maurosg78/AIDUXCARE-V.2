# Propuesta: Flujo lógico follow-up + hidratación completa del prompt Vertex

**Fecha:** 14 de febrero de 2026  
**Estado:** Pendiente de aprobación CTO  
**Contexto:** Feedback de práctica clínica — respetar el flujo natural de una consulta y aprovechar toda la información disponible para el SOAP

---

## 1. Problema actual

### 1.1 Orden de la UI no refleja el flujo clínico

Hoy el follow-up muestra bloques en un orden que no coincide con la secuencia real de una consulta:

- El profesional primero escucha al paciente (audio/transcripción).
- Luego confirma qué se hizo en clínica hoy (checklist).
- Después revisa/ajusta ejercicios en casa.
- Solo al final genera el SOAP con IA.

La UI actual no sigue este orden y no exige completar cada paso antes de permitir el análisis IA.

### 1.2 Campos nuevos no llegan al prompt de Vertex

- **TodayFocusItem.notes**: Existe en el modelo (`TodayFocusItem.notes`) pero **no se envía** al prompt. Solo se usa `item.label` en `inClinicItems.map((i) => i.label)`.
- **Notas de ajustes del tratamiento**: No existe un campo explícito para que el fisio documente actualizaciones del día o ajustes al tratamiento por la condición actual del paciente. Ese contexto se pierde.

### 1.3 Perfil del fisio no se usa en follow-up

- **Initial assessment**: Usa `PromptFactory-Canada` con `professionalProfile` → `buildCapabilityContext`, `buildProfessionalContext`, `buildPracticePreferencesContext`.
- **Follow-up**: Usa `buildFollowUpPromptV3` directamente, que **no recibe** `professionalProfile`. El prompt es genérico y no se adapta al título, especialidad, técnicas, preferencias de nota ni consentimiento del profesional.

### 1.4 Botón de análisis IA sin gate de completitud

El botón de generación SOAP aparece aunque no se haya completado el flujo (audio, in-clinic, HEP). No hay validación de que los pasos previos tengan contenido mínimo.

---

## 2. Propuesta de solución

### 2.1 Nuevo orden de la UI (flujo lógico de consulta)

```
1. Captura de audio / transcripción
   → Lo que dice el paciente al inicio de la sesión

2. Today's in-clinic treatment
   → Checklist de lo realizado hoy
   → Campo nuevo: notas de actualizaciones o ajustes (dictado o escrito)

3. Ejercicios en casa (HEP)
   → Revisión o ajuste del home program

4. Botón "Generar SOAP con IA"
   → Solo visible/habilitado cuando 1–3 tienen contenido mínimo
   → Resultado SOAP listo para copiar al EMR
```

### 2.2 Campo nuevo: notas de ajustes en in-clinic treatment

- **Ubicación**: Dentro del bloque "Today's in-clinic treatment", debajo del checklist.
- **Propósito**: Documentar actualizaciones del día o ajustes al tratamiento por la condición actual del paciente (ej. "Reducimos intensidad por dolor", "Añadimos estiramiento de isquiotibiales").
- **Input**: Dictado o texto escrito.
- **Flujo de datos**: Debe llegar al prompt de Vertex como sección explícita.

### 2.3 Hidratación completa del prompt Vertex

Todo lo que capture la UI debe llegar al prompt:

| Campo UI | Destino en prompt | Estado actual |
|----------|-------------------|---------------|
| `transcript` | `clinicalUpdate` | ✅ Sí |
| `inClinicItems[].label` | `inClinicItems` | ✅ Sí |
| `inClinicItems[].notes` | — | ❌ No |
| **Nuevo:** notas de ajustes (bloque) | — | ❌ No existe |
| `homeProgramItems[].label` | `homeProgram` | ✅ Sí |
| `homeProgramItems[].notes` | — | ❌ No |
| `professionalProfile` | — | ❌ No (follow-up no lo usa) |

### 2.4 Inyección del perfil profesional en follow-up

El prompt de follow-up debe incluir el mismo contexto que el initial assessment cuando el perfil existe:

- **Capability context**: Nivel de experiencia, dominio, tono de salida.
- **Professional context**: Título, áreas de práctica, técnicas, años de experiencia, clínica, licencia.
- **Practice preferences**: Verbosidad de nota, tono, tratamientos preferidos, do-not-suggest.
- **Consentimiento**: Respetar `dataUseConsent.personalizationFromClinicianInputs` (WO-AUTH-GUARD-ONB-DATA-01).

---

## 3. Alcance técnico

### 3.1 Cambios en `buildFollowUpPromptV3`

| Cambio | Descripción |
|--------|-------------|
| Nuevo input `inClinicAdjustmentsNotes` | Texto libre con actualizaciones/ajustes del tratamiento en clínica hoy |
| Nuevo input `professionalProfile` | Perfil del fisio (opcional, para inyección condicional) |
| Incluir `inClinicItems[].notes` | Además de `label`, enviar `notes` por ítem cuando exista |
| Incluir `homeProgram[].notes` | Si el modelo lo soporta, enviar notas por ítem de HEP |
| Nueva sección en prompt | `CONTEXT — IN-CLINIC ADJUSTMENTS / UPDATES TODAY` con el texto de ajustes |
| Inyección de perfil | Reutilizar `buildCapabilityContext`, `buildProfessionalContext`, `buildPracticePreferencesContext` de PromptFactory-Canada (o equivalente) antes de las instrucciones del follow-up |

### 3.2 Cambios en la UI (ProfessionalWorkflowPage / FollowUpWorkflowPage)

| Cambio | Descripción |
|--------|-------------|
| Reordenar bloques | 1) TranscriptArea, 2) In-clinic + notas, 3) HEP, 4) Botón SOAP |
| Campo de notas de ajustes | Textarea o área con dictado en el bloque in-clinic |
| Gate del botón SOAP | Habilitar solo si: `transcript` O (`inClinicItems` + notas) O `homeProgramItems` con contenido mínimo |
| Pasar `inClinicAdjustmentsNotes` | Nuevo state → `buildFollowUpPromptV3` |
| Pasar `professionalProfile` | Desde `useProfessionalProfileContext` → `buildFollowUpPromptV3` |
| Pasar `inClinicItems[].notes` | Incluir en el payload al construir el prompt |

### 3.3 Verificación de flujo de datos

Checklist para validar que cada campo llega a Vertex:

1. `transcript` → `clinicalUpdate` en prompt ✅
2. `inClinicItems[].label` → sección IN-CLINIC TREATMENT ✅
3. `inClinicItems[].notes` → sección IN-CLINIC (por ítem o agregado) — **a implementar**
4. `inClinicAdjustmentsNotes` (nuevo) → sección IN-CLINIC ADJUSTMENTS — **a implementar**
5. `homeProgramItems[].label` → sección HOME EXERCISE PROGRAM ✅
6. `homeProgramItems[].notes` → sección HEP (si aplica) — **a evaluar**
7. `professionalProfile` → secciones [Clinician Profile], [Capability], [Preferences] — **a implementar**

---

## 4. Riesgos y dependencias

| Riesgo | Mitigación |
|--------|------------|
| Prompt demasiado largo | Limitar longitud de notas; truncar si excede umbral |
| Perfil sin completar | Si no hay perfil, omitir secciones (comportamiento actual en initial) |
| Consentimiento `personalizationFromClinicianInputs = false` | No inyectar practice preferences (ya implementado en PromptFactory-Canada) |
| Regresión en SOAP actual | Tests de regresión; comparar salida antes/después con mismos inputs |

---

## 5. Estimación de esfuerzo

| Componente | Descripción | Esfuerzo est. |
|-----------|-------------|----------------|
| **buildFollowUpPromptV3** | Nuevos inputs, sección ajustes, inyección perfil | 1–2 días |
| **UI: reordenar bloques** | Cambiar orden de secciones en follow-up | 0.5 día |
| **UI: campo notas de ajustes** | Textarea/dictado en bloque in-clinic | 0.5–1 día |
| **UI: gate del botón SOAP** | Validación de completitud antes de habilitar | 0.5 día |
| **Flujo de datos: notes por ítem** | Pasar `inClinicItems[].notes` y `homeProgramItems[].notes` al prompt | 0.5 día |
| **Tests y validación** | Regresión, pruebas con perfil completo/vacío | 1 día |

**Total estimado:** 4–5.5 días de desarrollo.

---

## 6. Decisión solicitada

**Para CTO:**

1. ¿Aprueba el nuevo orden de la UI (audio → in-clinic+notas → HEP → botón SOAP)?
2. ¿Aprueba la inyección de `professionalProfile` en el prompt de follow-up para perfilar la respuesta?
3. ¿Aprueba el campo nuevo de notas de ajustes en in-clinic treatment y su inclusión en el prompt?
4. ¿Algún ajuste al alcance o prioridad antes de implementación?

---

## Anexo: Referencias de código

| Archivo | Relevancia |
|---------|------------|
| `src/core/soap/followUp/buildFollowUpPromptV3.ts` | Prompt actual follow-up; sin professionalProfile |
| `src/core/ai/PromptFactory-Canada.ts` | buildProfessionalContext, buildCapabilityContext, buildPracticePreferencesContext |
| `src/pages/ProfessionalWorkflowPage.tsx` | handleGenerateSOAPFollowUp, buildFollowUpPromptV3, inClinicItems, homeProgramItems |
| `src/utils/parsePlanToFocus.ts` | TodayFocusItem (tiene `notes?: string`) |
| `src/context/ProfessionalProfileContext.tsx` | ProfessionalProfile, useProfessionalProfile |

---

**Documento preparado para:** Revisión y aprobación CTO  
**Próximo paso:** Aprobación y priorización en roadmap
