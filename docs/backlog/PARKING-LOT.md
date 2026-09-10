# Parking lot — ideas no prioritarias

Ítems que se dejan documentados para considerar en el futuro. **No son prioridad actual.**

---

## Resueltos

### CI sin protección real desde 2026-02-21 — RESUELTO 2026-09-10, causa real era doble

- **Qué era:** los workflows `typecheck.yml`, `size.yml` y `ci.yml` no daban protección real en ningún push/PR desde el 21-feb-2026.
- **Causa real, en dos capas — ninguna de las dos era "código roto" en el sentido de tests fallando:**
  1. **`pnpm/action-setup@v4` comparaba `version:` contra el string completo de `packageManager`** (hash de integridad incluido) — nunca podía coincidir. Diagnosticado 2026-08-25, **corregido 2026-08-28** (commit `8b66d91`, PR #288) en `typecheck.yml` y `size.yml`. Confirmado con corridas reales en verde desde entonces (última antes de esta auditoría: 28-ago, PR de AiDux Air).
  2. **Los tres workflows disparaban contra `main`, no contra `stable`** — `typecheck.yml`/`ci.yml` con `push: branches: [main]`, y `main` lleva 747 commits de atraso y cero pushes desde el 21-feb-2026 (coincide exactamente con la fecha de esta entrada). Todo el trabajo real vive en `stable`. Este segundo problema no se había identificado hasta la auditoría del 2026-09-10 — la capa 1 sola no explicaba por qué seguían sin proteger nada 2 semanas después de corregida.
- **Arreglado 2026-09-10:** los tres workflows ahora disparan en `push` y `pull_request` contra `stable` (antes: `main`, o solo `pull_request` sin push en el caso de `size.yml`).
- **Verificado localmente contra `stable` el mismo día:** typecheck ✅, build ✅, size-limit ✅, test:gate ✅. Lint también ✅ tras la limpieza (ver entrada de `ci.yml` abajo) — antes de esa limpieza, lint fallaba con 68 errores (32 en un archivo vendorizado sin excluir del linter, 36 reales y menores repartidos en 9 archivos).
- **Impacto real durante la ventana rota:** ningún PR mergeado tuvo verificación automática de tipos/tamaño/lint en CI real durante ~6 meses. La red de seguridad fue `tsc`/`eslint` local, corridos manualmente.
- **Encontrado:** 2026-08-25 (causa 1, PR #287) y 2026-09-10 (causa 2, auditoría de modularización/CI).

---

### `ci.yml` era siempre verde sin probar nada — RESUELTO 2026-09-10

- **Qué era:** el job `build` de `.github/workflows/ci.yml` gateaba sus pasos reales (`Setup pnpm`, `Setup Node`, `Install dependencies`, `Lint`, `Typecheck`, `Build`, `Test`) con `if: ${{ steps.detect_node.outputs.has_node == true && ... }}`. Los outputs de un step en GitHub Actions son siempre strings — la comparación contra el booleano `true` (sin comillas) nunca era verdadera, así que la condición nunca se cumplía.
- **Confirmado en ejecución real** (corrida `25397169992`, push a `main`, 2026-05-05, resultado: success): todos los pasos condicionales aparecían `skipped`. Solo corría el paso final incondicional: `ls -la && echo "✅ CI baseline ok"`.
- **Arreglado 2026-09-10:** las 7 condiciones `== true` cambiadas a `== 'true'` (comparación contra el string real). También se quitó `version: 10.29.2` del step `Setup pnpm` de este archivo — tenía el mismo conflicto `version` + `packageManager` ya corregido en `typecheck.yml`/`size.yml`, pero no se había tocado porque el arreglo de agosto fue diagnóstico-only para este archivo. Sin ese segundo fix, el job habría empezado a ejecutar pasos reales por primera vez y fallado de inmediato en `Setup pnpm`.
- **Trigger también corregido:** de `push`/`pull_request` contra `main` a contra `stable` (ver entrada anterior).
- **Encontrado:** 2026-08-25 (diagnóstico). **Arreglado:** 2026-09-10.

---

## Máxima prioridad

### `e2e.yml` lleva 9 meses sin ejecutar Playwright de verdad — los 42 tests que fallan no son regresiones

- **Qué es:** `e2e.yml` no tiene registro de haber ejecutado Playwright de verdad en ningún momento dentro de la ventana de retención de GitHub (mínimo 90 días). La corrida del PR #288 (25 agosto 2026) es la primera ejecución real confirmada.
- **Por qué los 42 tests fallan:** no son regresiones. Los tres archivos de spec (`hospital-portal.spec.ts`, `mobile-viewports.spec.ts`, `mvp-launch-readiness.spec.ts`) se crearon en un único commit el 2025-11-28 y nunca se modificaron desde entonces — 9 meses de desfase acumulado contra una aplicación que cambió debajo de ellos sin que nadie lo supiera:
  - `hospital-portal.spec.ts` prueba una pantalla que se movió de `/hospital` a `/hospital/note` (marcada "legacy" en el router actual).
  - `mobile-viewports.spec.ts` espera una política de bloqueo de zoom (`maximum-scale=1.0`, `user-scalable=no`) que ya no está en `index.html`, probablemente removida a propósito por accesibilidad.
  - `mvp-launch-readiness.spec.ts` referencia clases CSS que no existen en ningún archivo de `src/` hoy (`.soap-report-container`, `.region-tab`, `.test-card`) y un botón `"Send Consent SMS"` que no existe en el código actual.
- **Por qué importa:** no bloquea merges (`continue-on-error: true`), pero significa que el equipo lleva 9 meses sin ninguna verificación E2E real, con un archivo de configuración que aparentaba dar cobertura. Antes de arreglar los tests uno por uno, hay que decidir si siguen describiendo funcionalidad vigente o si corresponde reescribirlos contra la UI actual.
- **No tocado:** solo documentación, por instrucción explícita.
- **Encontrado:** 2026-08-25, verificación de la corrida real de `e2e.yml` en el PR #288, tras el fix del conflicto `pnpm/action-setup`.

---

## i18n / UX por país

### Mensaje en español para profesionales registrados en países hispanohablantes
- **Idea:** Mostrar mensajes (bienvenida, avisos, etc.) en español cuando el profesional está registrado en un país hispanohablante (España, Argentina, México, Colombia, Chile, Perú, etc.), aunque la app no esté en modo “piloto España”.
- **Contexto:** Hoy el idioma de la UI depende del piloto ES o del locale del navegador. Sería una mejora de UX detectar país (p. ej. `profile.country` o `profile.licenseCountry`) y, si es ES/AR/MX/CO/PE/CL/etc., ofrecer o priorizar español.
- **Prioridad:** Baja. Dejar en parking lot hasta que haya capacidad.
- **Notas:** Requeriría definir fuente de verdad (país de licencia vs país del perfil), posiblemente un hint de idioma preferido en perfil, y asegurar que todos los textos relevantes tengan clave en `es.json`.

---

## Errores puntuales / a investigar

### Error de permisos de Firestore en SessionService.createSessionWithId durante generación de SOAP

- **Qué es:** `SessionService.createSessionWithId` lanzó `FirebaseError: Missing or insufficient permissions` en `sessionService.ts:291`, disparado desde `handleGenerateSoap` en `ProfessionalWorkflowPage.tsx:4419`.
- **Cuándo ocurrió:** una sola vez, durante prueba manual en dev, en un intento de generar SOAP mientras el botón aún estaba deshabilitado (evaluación física incompleta). No se repitió en el flujo completo.
- **No investigado:** no se determinó si es un problema real de reglas de Firestore, una condición de carrera entre el estado del botón deshabilitado y una llamada que igual se disparó, o algo específico del entorno de prueba. No bloqueó el flujo real.
- **Por qué queda anotado igual:** un error de permisos de Firestore, aunque parezca inofensivo por no haber bloqueado nada, vale la pena que alguien lo mire con calma antes de asumir que es ruido.
- **Encontrado:** 2026-08-24, prueba end-to-end del guard de `process.env` en `npm run dev` (rama `fix/process-env-dev-guard`).

---

*Última actualización: 2026-08-25*
