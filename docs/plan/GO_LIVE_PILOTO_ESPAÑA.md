# Go-live piloto España

Checklist de verificación el día del lanzamiento. Detalle completo en [MVP_CHECKLIST_LONGITUDINAL.md](./MVP_CHECKLIST_LONGITUDINAL.md) (sección «Pre-lanzamiento piloto España»).

## Antes del deploy

- [ ] Build con `VITE_ENABLE_ES_PILOT=true` en el entorno de España.
- [ ] `pnpm typecheck` y `pnpm build` sin errores.

## Después del deploy

- [ ] Abrir flujo (initial o follow-up): gate de consentimiento en español.
- [ ] Pestaña SOAP en español; mensaje de revisión con «normativa aplicable y colegio profesional de tu comunidad autónoma».
- [ ] Formulario de comentarios (botón flotante) en español.
- [ ] Página de Preguntas frecuentes (FAQ) en español.
- [ ] Vista de detalle de nota (Ver SOAP desde historial) en español.

## Referencia

- Variable de entorno: `.env.local.example` documenta `VITE_ENABLE_ES_PILOT=true`.
- Consentimiento verbal ES: `v1-es-ES-verbal` en `consentTexts.ts`; se activa con el flag de piloto.
