# Informe CTO: Baseline mostrando idioma inconsistente (español vs inglés)

**Fecha:** 13 de febrero de 2026  
**Estado:** Causa raíz identificada — pendiente fix  
**Prioridad:** Alta

---

## 1. Problema identificado

### Evidencia del bug

**SOAP previo (Imagen 2 — en INGLÉS):**
```
PLAN:
- Initiate session with gentle massage to the back
- Continue focalized core abdominal work (transversus abdominis)
- Utilize Wibbi platform
```

**Baseline cargado (Imagen 1 — en ESPAÑOL):**
```
"durante el último tiempo al paciente se le da un tratamiento focalizado 
en el uso de su core abdominal y específicamente del transverso del abdomen 
también hemos puesto mucha atención en su flexibilización lumbar y ha 
evolucionado de manera favorable al punto que hoy en día tolera ejercicios 
como back y planchas laterales y frontales"
```

- El texto en español **no existe** en el SOAP de la Imagen 2.
- El baseline está cargando datos de **otra fuente** (otra sesión, mock o `clinical_baselines`).

### Actualización: localStorage vacío — textos distintos

- **localStorage está vacío** → el texto en español no viene de ahí.
- **Captura 1 (UI):** "durante el último tiempo al paciente se le da un tratamiento focalizado en el uso de su core abdominal..."
- **Firestore (planText):** "In-clinic treatment: Initiate session with gentle massage to the back. Progress with exercises..."
- **Conclusión:** No es una traducción; son **textos distintos**. El español proviene de `clinical_baselines` (fallback cuando consultations devuelve 0 notas).

---

## 2. Fuentes posibles del baseline

Tras el fix FIX-PHASE0-BASELINE-HYDRATION, el baseline puede venir de:

| Origen | Condición | Fuente de datos |
|--------|-----------|-----------------|
| **A1: consultations** | Hay notas para el paciente | `notes[0]` (más reciente por `createdAt` desc) → `soapData.plan` |
| **A3: clinical_baselines** | No hay notas O falla la query | `patient.activeBaselineId` → `baseline.snapshot.planSummary` |

El texto en español podría venir de:

1. **Hipótesis 1:** Una nota en español más reciente en `consultations` que la de la Imagen 2.
2. **Hipótesis 2:** Fallback a `clinical_baselines` (INITIAL u otra sesión en español).
3. **Hipótesis 3:** Campo distinto al esperado (p. ej. `planSummary` vs `soapData.plan`).

### Nueva hipótesis final (CTO)

**¿Existe una nota DIFERENTE en `consultations` que tenga ese texto en español?**

El sistema podría estar cargando una nota distinta a la más reciente en inglés. Buscar en `soapData.plan` de cada nota si contiene:

- "durante el último tiempo"
- "core abdominal"
- "transverso del abdomen"

---

## 3. Acciones realizadas

### 3.1 Logs de depuración añadidos

Se añadieron logs temporales en `clinicalStateService.ts`:

**Cuando hay notas (path A1):**
```
[DEBUG-BASELINE] Total notes found: N
[DEBUG-BASELINE] Note 0: { id, visitType, createdAt, planPreview, languageHint }
[DEBUG-BASELINE] Note 1: ...
[DEBUG-BASELINE] Selected as baseline: { id, visitType, createdAt, fullPlan }
```

**Cuando no hay notas (fallback A3):**
```
[DEBUG-BASELINE] No notes found, falling back to patient.activeBaselineId
[DEBUG-BASELINE] Using fallback from clinical_baselines: { baselineId, planSummary }
```

**Cuando falla la query de consultations:**
```
[DEBUG-BASELINE] Consultations query failed, falling back to activeBaselineId: <error>
```

### 3.2 Pasos para reproducir y capturar logs

1. Recompilar: `npm run build`
2. Abrir la página del FOLLOWUP del paciente Matthew Procotor.
3. En DevTools > Console, filtrar por `[DEBUG-BASELINE]`.
4. Copiar todos los logs y adjuntarlos al informe.

---

## 4. Verificaciones pendientes

### 4.1 Firestore — consultas específicas

**Paciente:** Matthew Procotor  
**patientId:** `UAq8lyrtl3LnlkXsgohE`

1. Ir a la colección `consultations`.
2. Filtrar por `patientId == UAq8lyrtl3LnlkXsgohE`.
3. Ordenar por `createdAt` descendente.
4. Capturar screenshot de **todas** las notas (al menos las primeras 5).
5. Buscar si alguna tiene `soapData.plan` con:
   - "durante el último tiempo"
   - "core abdominal"
   - "transverso del abdomen"

**Script de verificación:**
```bash
node scripts/debug-consultations-by-patient.cjs UAq8lyrtl3LnlkXsgohE
```

### 4.2 clinical_baselines

- [ ] Obtener `patient.activeBaselineId` del paciente.
- [ ] Revisar el documento en `clinical_baselines/{baselineId}`.
- [ ] Verificar `snapshot.planSummary` y su idioma.

### 4.3 Orden de las notas

- [ ] Confirmar que `getNotesByPatient` usa `orderBy('createdAt', 'desc')`.
- [ ] Verificar que no hay problemas de zona horaria en `createdAt`.

---

## 5. Próximos pasos

1. Ejecutar el flujo con los logs activos y recopilar salida.
2. Revisar Firestore según el apartado 4.
3. Con los logs y datos de Firestore, determinar si el problema es:
   - Nota incorrecta seleccionada (orden, filtros).
   - Uso del fallback cuando no debería.
   - Datos mezclados entre `consultations` y `clinical_baselines`.

---

## 6. Script de verificación

**`scripts/debug-consultations-by-patient.cjs`**

Lista todas las notas de `consultations` para un paciente, ordenadas por `createdAt` desc, e indica si alguna contiene las frases en español.

```bash
# Con patientId por defecto (Matthew Procotor)
node scripts/debug-consultations-by-patient.cjs

# Con patientId explícito
node scripts/debug-consultations-by-patient.cjs UAq8lyrtl3LnlkXsgohE
```

**Credenciales:** `GOOGLE_APPLICATION_CREDENTIALS` o `gcloud auth application-default login`

**Nota:** Si Firestore requiere un índice compuesto `(patientId, createdAt)`, el script indicará cómo crearlo.

---

## 7. Resultado de la verificación (13 feb 2026)

**Script ejecutado:** `node scripts/debug-consultations-by-patient.cjs UAq8lyrtl3LnlkXsgohE`

| Resultado | Valor |
|-----------|-------|
| Notas encontradas | **1** |
| visitType | follow-up |
| createdAt | 2026-02-13T13:28:21.978Z |
| plan (idioma) | **INGLÉS** ("In-clinic treatment: Initiate session with gentle massage...") |

**Conclusión:** Solo hay **una nota** en `consultations` para este paciente, y está en **inglés**. El texto "durante el último tiempo al paciente se le da un tratamiento focalizado..." **no existe** en consultations.

---

## 8. Causa raíz identificada

**Script ejecutado:** `node scripts/debug-baseline-sources.cjs UAq8lyrtl3LnlkXsgohE`

| Fuente | Contenido | Idioma |
|--------|-----------|--------|
| **consultations** (nota más reciente) | "In-clinic treatment: Initiate session with gentle massage..." | Inglés |
| **treatment_plans** (más reciente) | "In-clinic treatment: Initiate session with gentle massage..." | Inglés |
| **clinical_baselines** (activeBaselineId) | "durante el último tiempo al paciente se la da un tratamiento focalizado..." | Español |

**Conclusión:** El texto en español viene de `clinical_baselines` (documento `wLZ89UluOnBaMjEcT1Bj`), que es el baseline del INITIAL o del formulario ongoing.

**Flujo del bug:**
1. `getBaselineSafe` intenta primero el path A1 (consultations).
2. `getNotesByPatient` filtra por `authorUid == currentUser.uid`.
3. Si devuelve **0 notas** (p. ej. usuario distinto al autor, o problema de permisos) → fallback A3.
4. A3 usa `patient.activeBaselineId` → `clinical_baselines` → **planSummary en español** (del INITIAL/ongoing).
5. La UI muestra ese baseline en español en lugar de la nota en inglés.

**Por qué consultations puede devolver 0 notas:**
- El usuario que ve el baseline no es el `authorUid` de la nota en inglés.
- O hay un error/permiso que hace que la query falle o devuelva vacío.

### Propuesta de fix

**Opción A (recomendada):** Al finalizar un FOLLOWUP, actualizar también `clinical_baselines` y `patient.activeBaselineId` con el SOAP del follow-up. Así el fallback A3 tendrá siempre el baseline más reciente, independientemente de quién vea la pantalla.

**Opción B:** Revisar por qué `getNotesByPatient` devuelve 0 notas cuando el Admin SDK ve 1 nota (filtro `authorUid`, usuario distinto, permisos).

---

## 9. Archivos modificados / creados

| Archivo | Cambio |
|---------|--------|
| `src/services/clinicalStateService.ts` | Logs `[DEBUG-BASELINE]` temporales |
| `scripts/debug-consultations-by-patient.cjs` | Listar notas por patientId |
| `scripts/debug-treatment-plans-by-patient.cjs` | Listar treatment_plans por patientId |
| `scripts/debug-baseline-sources.cjs` | Verificar todas las fuentes (consultations, treatment_plans, clinical_baselines) |
| `scripts/debug-notes.js` | Corregido patientId |

**Nota:** Los logs en clinicalStateService son temporales y deben eliminarse una vez cerrada la investigación.
