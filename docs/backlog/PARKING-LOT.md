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

## Errores puntuales / a investigar

### Error de permisos de Firestore en SessionService.createSessionWithId durante generación de SOAP

- **Qué es:** `SessionService.createSessionWithId` lanzó `FirebaseError: Missing or insufficient permissions` en `sessionService.ts:291`, disparado desde `handleGenerateSoap` en `ProfessionalWorkflowPage.tsx:4419`.
- **Cuándo ocurrió:** una sola vez, durante prueba manual en dev, en un intento de generar SOAP mientras el botón aún estaba deshabilitado (evaluación física incompleta). No se repitió en el flujo completo.
- **No investigado:** no se determinó si es un problema real de reglas de Firestore, una condición de carrera entre el estado del botón deshabilitado y una llamada que igual se disparó, o algo específico del entorno de prueba. No bloqueó el flujo real.
- **Por qué queda anotado igual:** un error de permisos de Firestore, aunque parezca inofensivo por no haber bloqueado nada, vale la pena que alguien lo mire con calma antes de asumir que es ruido.
- **Encontrado:** 2026-08-24, prueba end-to-end del guard de `process.env` en `npm run dev` (rama `fix/process-env-dev-guard`).

---

*Última actualización: 2026-08-24*
