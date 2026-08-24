# Parking lot — ideas no prioritarias

Ítems que se dejan documentados para considerar en el futuro. **No son prioridad actual.**

---

## i18n / UX por país

### Mensaje en español para profesionales registrados en países hispanohablantes
- **Idea:** Mostrar mensajes (bienvenida, avisos, etc.) en español cuando el profesional está registrado en un país hispanohablante (España, Argentina, México, Colombia, Chile, Perú, etc.), aunque la app no esté en modo “piloto España”.
- **Contexto:** Hoy el idioma de la UI depende del piloto ES o del locale del navegador. Sería una mejora de UX detectar país (p. ej. `profile.country` o `profile.licenseCountry`) y, si es ES/AR/MX/CO/PE/CL/etc., ofrecer o priorizar español.
- **Prioridad:** Baja. Dejar en parking lot hasta que haya capacidad.
- **Notas:** Requeriría definir fuente de verdad (país de licencia vs país del perfil), posiblemente un hint de idioma preferido en perfil, y asegurar que todos los textos relevantes tengan clave en `es.json`.

---

## Datos clínicos / longitudinal memory

### Bug: `extractFunctionStatus` clasifica "unable to" como mejora funcional

- **Qué es:** `extractFunctionStatus()` en `src/services/patientTrajectoryMemoryService.ts:131` clasifica texto clínico en `'improved' | 'stable' | 'decreased' | null` buscando keywords por substring (`text.includes(keyword)`, sin límites de palabra) y evaluando primero la lista de `improved`, luego `decreased`, luego `stable` — la primera lista que matchea gana.
- **Mecanismo exacto del bug:** la lista de keywords `improved` incluye `'able to'`. La lista de keywords `decreased` incluye `'unable to'`. Como `"unable to"` contiene literalmente `"able to"` como substring, cualquier texto con la negación dispara el keyword positivo antes de que la función llegue a evaluar la lista de `decreased`. Confirmado con el test existente (`src/services/__tests__/patientTrajectoryMemoryService.test.ts:74-80`): el texto `"Refiere dificultad para vestirse y unable to lift objects overhead."` — una frase de deterioro funcional inequívoco — se clasifica como `'improved'`.
- **Es el mismo patrón de bug que orden de evaluación de reglas donde la primera coincidencia gana sin considerar especificidad ni negación** — vale la pena revisar si `extractRomStatus` y `extractAdherenceLevel`, las dos funciones hermanas en el mismo archivo, tienen colisiones de substring equivalentes; no se auditaron hoy, solo `extractFunctionStatus` porque fue la que falló en el run de tests.
- **Dónde está en el camino real (no es código huérfano):** `PatientTrajectoryMemoryService` se instancia en `src/pages/ProfessionalWorkflowPage.tsx` dentro del flujo de finalización de SOAP, tanto para `visitType === 'follow-up'` (línea ~6707) como para `visitType === 'initial'` (línea ~6791). El resultado de `buildEncounterLongitudinalSnapshot()` — incluyendo el `functionStatus` potencialmente invertido — se persiste en Firestore vía `encountersRepo.createEncounterCompleted({ ..., longitudinalSnapshot })`, en cada sesión finalizada cuyo texto S/O/A/P contenga una negación de ese tipo.
- **Por qué no es urgente hoy:** verificado por grep en todo `src/` — ningún componente de UI, ningún prompt hacia el modelo, ningún servicio de patrón longitudinal lee `.functionStatus` de vuelta. Es un campo de solo-escritura. El dato puede estar ya mal guardado para pacientes reales, pero no influye ninguna decisión ni aparece en ninguna nota hoy.
- **Advertencia con fecha — por qué el arreglo tiene que ir *antes*, no después:** el día que se active `VITE_PROMPT_BRAIN_VERSION=v3` (o cualquier funcionalidad futura que empiece a leer `longitudinalSnapshot` hacia atrás para construir contexto), este bug deja de ser silencioso. En ese momento, todo el histórico de `functionStatus` acumulado hasta esa activación ya es dato corrupto retroactivo — corregir la función en ese punto ya no alcanza, hace falta además una limpieza/reprocesamiento de lo ya escrito. El arreglo de la función debe cerrarse **antes** de esa activación, no después.
- **Prioridad:** Baja por ahora (hueco sembrado, no fuga activa) — condicionada: sube a bloqueante en el momento en que se planifique activar Prompt Brain v3 o cualquier lector retroactivo de `longitudinalSnapshot`.
- **Encontrado:** 2026-08-24, diagnóstico integral pre-decisión de refactorización de `ProfessionalWorkflowPage.tsx`.

---

*Última actualización: 2026-08-24*
