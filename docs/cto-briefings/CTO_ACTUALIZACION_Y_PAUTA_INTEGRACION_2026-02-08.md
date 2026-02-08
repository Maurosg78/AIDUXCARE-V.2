# Actualización CTO + Pauta de integración — 2026-02-08

**Objetivo:** Dejar al CTO al tanto de todo lo implementado desde el último push y dar una pauta clara para integrar (commits, ramas, orden).

---

## Estado del repo (referencia)

- **Último commit pusheado:** `9950b378` en `feature/ongoing-dictation-multilang`  
  - PatientSearchBar, 3 acciones clínicas, branding, openOngoingForPatientId.
- **Rama actual:** `test/soap-baseline-validation` (creada desde `feature/ongoing-dictation-multilang`).
- **Firestore rules:** Ya desplegadas a mano (`firebase deploy --only firestore:rules`).

---

## Inventario de trabajo realizado (no en el último push)

Todo lo siguiente está implementado y probado; parte está solo en working tree (modificado/sin trackear).

### 1. Patient History y Clinical actions (ya en 9950b378)

- Quick Actions eliminado del Patient History (solo quedan las 3 acciones clínicas).
- Las 3 opciones son: **Initial Assessment**, **Follow-up**, **Ongoing patient**.
- Ruta `/patients/:id` muestra `PatientDashboardPage` (mismo contenido que `/patients/:id/history`).
- **Ongoing patient** se deshabilita cuando el paciente ya existe en AiDuxCare (baseline o visitas): `ongoingDisabled = hasActiveBaseline || (patientVisits.data?.length > 0)`.

### 2. Firestore — reglas `clinical_baselines`

- **Archivo:** `firestore.rules`
- **Cambio:** Reglas para colección `clinical_baselines`: read si auth, create si `createdBy == request.auth.uid`, sin update/delete desde cliente.
- **Motivo:** El modal Ongoing (createBaselineFromMinimalSOAP) fallaba con "Missing or insufficient permissions".
- **Estado:** Reglas ya desplegadas a UAT; el archivo en repo está modificado (no commiteado).

### 3. Dictación (botón de audio) — persistencia y transcripción

- **Archivos:** `src/hooks/useDictation.ts`, `src/components/ui/DictationButton.tsx`, `src/features/command-center/components/OngoingPatientIntakeModal.tsx`
- **Cambios:**
  - **Persistencia:** Si el navegador cierra la sesión de reconocimiento (p. ej. silencio), se reinicia automáticamente para que el botón siga en rojo y no se “apague” solo.
  - **Resultados interinos:** Se envían tanto resultados finales como interinos; la transcripción aparece en el campo mientras se habla.
  - **UI:** Estado `interim` en inputs/textareas del modal; muestran `value + interim`; al recibir resultado final se actualiza estado y se limpia interim.
- **Estado:** Modificado, no commiteado.

### 4. Barra de nivel (decibeles) junto al micrófono

- **Archivo:** `src/components/ui/DictationButton.tsx`
- **Cambio:** Componente `MicLevelBar`: cuando `isDictating` es true, pide `getUserMedia`, usa AnalyserNode y muestra una barra vertical de nivel (feedback visual sin texto).
- **Estado:** Incluido en los mismos cambios que el punto 3.

### 5. Vertex — respuesta en texto plano (SOAP)

- **Archivo:** `src/services/vertex-ai-soap-service.ts`
- **Cambio:** En `parseSOAPResponse`, si Vertex no devuelve JSON pero sí texto, se usa `parsePlainSOAPSections(rawText)` para extraer Subjective/Objective/Assessment/Plan por encabezados. Normalización de markdown (`**Subjective:**` → `Subjective:`).
- **Motivo:** Evitar “No planText found, todayFocus remains empty” cuando Vertex devuelve texto plano.
- **Estado:** Modificado, no commiteado.

### 6. WO-SOAP-PARSER-BASELINE-VALIDATION-TESTS-V1

- **Archivos nuevos:**  
  - `src/services/soapBaselineValidation.ts`  
  - `src/services/__tests__/soapBaselineValidation.test.ts`  
  - `docs/cto-briefings/WO-SOAP-PARSER-BASELINE-VALIDATION-TESTS-V1.md`
- **Archivo modificado:** `src/services/vertex-ai-soap-service.ts` (export de `parseSOAPResponse` y `parsePlainSOAPSections` para tests).
- **Contenido:**
  - `isValidBaselineSOAP(parsedSOAP)`: boolean de validación semántica (Subjective + Plan mínimos; Plan no vacío ni genérico).
  - `getBaselineValidationFailureReason(parsedSOAP)`: motivo de rechazo para auditoría; `console.warn('[BaselineValidation]', reason)` cuando se rechaza.
  - Tests Vitest: 6 casos obligatorios + plan vago ("Increase activity.") + test de `getBaselineValidationFailureReason`.
  - TODO en código para integrar el validador en el flujo de persistencia (próximo WO).
- **Estado:** Nuevos archivos sin trackear; cambios en vertex-ai-soap-service sin commitear.

---

## Resumen para el CTO

| Área | Qué se hizo | Dónde está |
|------|-------------|------------|
| Patient History | Quick Actions fuera; 3 acciones (Initial / Follow-up / Ongoing); Ongoing deshabilitado si paciente ya existe; `/patients/:id` = dashboard | En 9950b378 (ya pusheado) |
| Firestore | Reglas `clinical_baselines` | Desplegadas; `firestore.rules` modificado en repo |
| Dictación | Persistencia de sesión, resultados interinos, transcripción en tiempo real | Modificado (useDictation, DictationButton, OngoingPatientIntakeModal) |
| UX dictación | Barra de nivel (decibeles) junto al micrófono | Mismo bloque que dictación |
| Vertex SOAP | Fallback texto plano en parser; export de parsers para tests | vertex-ai-soap-service modificado |
| Baseline validation | Validador + tests WO-SOAP; ajustes CTO (log, plan vago, getBaselineValidationFailureReason) | Archivos nuevos + vertex-ai-soap-service |

Nada de esto cambia lógica de persistencia de baseline: el validador solo **detecta** si un SOAP es apto para baseline; la integración en el flujo de guardado será un WO aparte.

---

## Pauta de trabajo para integrar todo

### Opción A — Una rama, dos commits (recomendada)

Rama: `test/soap-baseline-validation` (actual).

1. **Commit 1 — WO-SOAP-PARSELINE-VALIDATION (solo validación + tests + parser)**  
   Incluir únicamente:
   - `src/services/soapBaselineValidation.ts` (nuevo)
   - `src/services/__tests__/soapBaselineValidation.test.ts` (nuevo)
   - `docs/cto-briefings/WO-SOAP-PARSER-BASELINE-VALIDATION-TESTS-V1.md` (nuevo)
   - Cambios en `src/services/vertex-ai-soap-service.ts` (export de parsers + fallback texto plano)

   Mensaje sugerido:
   ```text
   test(soap): validate Vertex responses before baseline persistence

   WO-SOAP-PARSER-BASELINE-VALIDATION-TESTS-V1
   - isValidBaselineSOAP() + getBaselineValidationFailureReason()
   - Export parseSOAPResponse, parsePlainSOAPSections for tests
   - Plain-text SOAP fallback in parseSOAPResponse
   - Vitest: 6 cases + vague plan + audit reason
   ```

2. **Commit 2 — Dictación, mic level, Firestore rules**  
   Incluir:
   - `firestore.rules` (reglas clinical_baselines)
   - `src/hooks/useDictation.ts`
   - `src/components/ui/DictationButton.tsx`
   - `src/features/command-center/components/OngoingPatientIntakeModal.tsx`

   Mensaje sugerido:
   ```text
   feat(ongoing): dictation persistence, mic level bar, Firestore rules

   - useDictation: restart on browser end, interim results
   - DictationButton: MicLevelBar, onInterim, valueRef
   - OngoingPatientIntakeModal: interim state for inputs/textareas
   - firestore.rules: clinical_baselines (create by createdBy)
   ```

3. **Push y merge**  
   - `git push -u origin test/soap-baseline-validation`
   - Crear PR hacia `feature/ongoing-dictation-multilang` (o hacia `main`/pilot según política).
   - Tras aprobación, merge. Las reglas ya están desplegadas; el commit de rules deja el repo alineado con producción.

### Opción B — Dos ramas

- **test/soap-baseline-validation:** Solo Commit 1 (SOAP validation + parser). Push y PR.
- **feature/ongoing-dictation-multilang:** Traer solo los cambios de dictación + rules + modal (Commit 2) en esa rama, otro PR.

Útil si quieren revisar/mergear SOAP validation y dictation por separado.

### Verificación antes de push

```bash
# En test/soap-baseline-validation
npx vitest run src/services/__tests__/soapBaselineValidation.test.ts
npm run typecheck   # o el comando de typecheck del proyecto
```

---

## Próximos pasos (fuera de esta pauta)

1. **Integrar `isValidBaselineSOAP()` en el flujo de persistencia** (nuevo WO): antes de crear baseline / actualizar paciente, llamar al validador; si `false`, no persistir y loguear `getBaselineValidationFailureReason()`.
2. **Feature flag o guard** (opcional): activar la validación de baseline de forma gradual.

---

## Referencia rápida de archivos

| Archivo | Incluir en Commit 1 (SOAP) | Incluir en Commit 2 (dictation/rules) |
|---------|----------------------------|----------------------------------------|
| `firestore.rules` | No | Sí |
| `src/hooks/useDictation.ts` | No | Sí |
| `src/components/ui/DictationButton.tsx` | No | Sí |
| `src/features/command-center/components/OngoingPatientIntakeModal.tsx` | No | Sí |
| `src/services/vertex-ai-soap-service.ts` | Sí | No |
| `src/services/soapBaselineValidation.ts` | Sí | No |
| `src/services/__tests__/soapBaselineValidation.test.ts` | Sí | No |
| `docs/cto-briefings/WO-SOAP-PARSER-BASELINE-VALIDATION-TESTS-V1.md` | Sí | No |

Con esto el CTO tiene el estado completo y una pauta concreta para integrar todo (commits, ramas y orden).
