# Postmortem — UAT Auth OPERATION_NOT_ALLOWED

**Fecha:** 2025-08-11
**Responsable:** CTO
**Síntoma:** Error OPERATION_NOT_ALLOWED al crear usuarios en UAT.
**Causa raíz:** Configuración de proyecto UAT bloqueaba sign-up (fuera del código de app).
**Acciones tomadas:**
- Smoke tests REST para UAT/PROD con IdentityToolkit → evidencia guardada.
- Guardarraíles de entorno en cliente (firebase.ts y firebaseActionCode.ts).
- Checklist de consola Firebase/GCP verificado.
**Estado actual:** UAT operativo, PROD bloqueado para Email/Password.
**Aprendizaje:** siempre validar API REST fuera del SDK y mantener gates de entorno en cliente.
