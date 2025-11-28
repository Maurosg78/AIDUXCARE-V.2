# Terms of Service Update - W1-004

## Cambios (2025-11-27)
- Actualizada sección de terceros para reflejar Vertex AI en Canadá y mantener disclosure de Whisper (US) como opcional.
- Ajustado lenguaje para clarificar data residency, compliance y obligaciones profesionales.
- Añadido routing público `/terms` y enlaces desde landing pages.

## Evidencia CLI
- `rg -n "TermsOfServicePage" src/pages/TermsOfServicePage.tsx`
- Router diff registrado en `src/router/router.tsx`.

## Riesgos cubiertos
- Información previa indicaba procesamiento en US → corregido.
- Usuarios ahora tienen acceso directo al documento desde landing.
