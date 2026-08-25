# Parking lot — ideas no prioritarias

Ítems que se dejan documentados para considerar en el futuro. **No son prioridad actual.**

---

## Máxima prioridad

### CI sin protección real desde 2026-02-21: typecheck.yml y size.yml fallan en todo push a main/stable

- **Qué es:** los workflows de CI `typecheck.yml` y `size.yml` fallan en todo push a `main`/`stable` desde 2026-02-21. `e2e.yml` tiene el mismo fallo pero no bloquea por `continue-on-error: true` preexistente.
- **Causa real (corregida 2026-08-25 — la atribución original de esta entrada estaba mal):** no fue un cambio de comportamiento de `pnpm/action-setup@v4`. Verificado en el código fuente de `v4.0.0` (el primer release de la línea v4): el chequeo que rechaza `version` + `packageManager` coexistiendo ya existía desde ahí, sin cambios. Lo que rompió esto fue el commit `4decf1b` (27 de marzo, "chore(ci): align pnpm version across workflows", del propio equipo): agregó `version: 10.29.2` al YAML para resolver un problema distinto (la acción caía a pnpm 9 por defecto sin `version:` explícito). Ese fix nunca pudo funcionar, porque `pnpm/action-setup` compara el `version:` del YAML contra el string **completo** de `packageManager`, hash de integridad incluido (`pnpm@10.29.2+sha512.bef43fa...`), no solo el número de versión — `"10.29.2" !== "10.29.2+sha512.bef43fa..."` como comparación de string literal, siempre, sin importar que ambos apunten a la misma versión real. Los dos fallos de 2026-02-21 (antes de que `version:` existiera en el YAML) fueron por la causa original — la caída a pnpm 9 — no por este conflicto; los logs de esas corridas ya expiraron en GitHub (retención de 90 días) y no se pudo confirmar con certeza absoluta, pero el comentario del propio commit `4decf1b` lo describe explícitamente.
- **Impacto real:** ningún PR mergeado a este repo desde el 21 de febrero ha tenido verificación automática de tipos ni de tamaño de bundle en CI. La única red de seguridad de tipos ha sido `tsc` local, corrido manualmente por quien hace el cambio.
- **Arreglo probable, no verificado:** fijar la versión de la acción a un tag exacto en vez de `@v4` flotante, o remover la duplicación entre `version` del workflow y `packageManager` de `package.json`, dejando una sola fuente de verdad.
- **Por qué importa:** no es un bug de funcionalidad, es la ausencia de un gate de protección que el equipo asume que existe cada vez que ve un check en rojo o verde en un PR.
- **Encontrado:** 2026-08-25, diagnóstico de los checks fallidos en el PR #287, confirmado preexistente comparando `stable` y el historial de corridas de ambos workflows (última corrida exitosa de `typecheck.yml`: 2026-02-07).

---

### `ci.yml` está siempre verde, pero no prueba nada — su job entero es un no-op

- **Qué es:** el job `build` de `.github/workflows/ci.yml` gatea sus pasos reales (`Setup pnpm`, `Setup Node`, `Install dependencies`, `Lint`, `Typecheck`, `Build`, `Test`) con `if: ${{ steps.detect_node.outputs.has_node == true && ... }}`. Los outputs de un step en GitHub Actions son siempre strings — `steps.detect_node.outputs.has_node` vale el string `"true"`, nunca el booleano `true`. La comparación `"true" == true` da `false` en la sintaxis de expresiones de GitHub Actions, así que la condición nunca se cumple.
- **Confirmado en ejecución real** (corrida `25397169992`, push a `main`, 2026-05-05, resultado: success): `Setup Node`, `Install dependencies`, `Lint`, `Build`, `Test` aparecen todos como `skipped`. El único paso que corre de verdad es el último, incondicional: `ls -la && echo "✅ CI baseline ok"` — que siempre tiene éxito sin importar el contenido real del repo.
- **Por qué importa igual de fuerte que la entrada anterior:** el check "build" en cada PR aparece verde, pero no corrió lint, no corrió typecheck, no corrió build, no corrió tests. Es una falsa sensación de seguridad idéntica en efecto a los gates rotos de `typecheck.yml`/`size.yml` — solo que estos al menos fallan visiblemente; este pasa en silencio.
- **No tocado:** solo diagnóstico, por instrucción explícita. Arreglo probable: cambiar la condición a `steps.detect_node.outputs.has_node == 'true'` (comparar contra el string) en cada uno de los `if:` de ese job.
- **Encontrado:** 2026-08-25, mismo diagnóstico que la entrada anterior — se investigó por qué `ci.yml` no mostraba el mismo fallo de `pnpm/action-setup` pese a tener el patrón idéntico `version:` + `packageManager`.

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
