# Privacy Policy Update - W1-003

## Cambios realizados (2025-11-27)
- Reescrito `src/pages/PrivacyPolicyPage.tsx` en inglés, alineado con PHIPA/PIPEDA.
- Añadido detalle sobre residencia canadiense (Vertex AI) y divulgación de servicios transfronterizos (Whisper).
- Actualizada información de contacto (privacy@aiduxcare.com, hotline canadiense, dirección Toronto).
- Añadido footer links desde landing principal (`HospitalPortalLandingPage`) hacia `/privacy` y `/terms`.
- Routed `/privacy` en `src/router/router.tsx`.

## Evidencia CLI
- `rg -n "PrivacyPolicyPage" src/pages/PrivacyPolicyPage.tsx` para ver contenido.
- `npm run build` se ejecutará tras completar W1-004 (testing conjunto).

## Riesgos abordados
- Contenido estaba en español y sin referencias a PHIPA → corregido.
- No existían rutas públicas → añadidas (`/privacy`).
