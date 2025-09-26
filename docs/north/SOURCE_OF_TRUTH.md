# Aidux North — Source of Truth (SoT) v1.0.0

## Qué es
Única referencia **obligatoria** para estándares de build, lint, hooks y control de cambios de Aidux North.

## Autoridad
Estos archivos son la autoridad vigente:
- `.husky/pre-push`
- `eslint.config.js`
- `eslint.override.config.js` _(temporal para desbloqueo)_
- `package.json` → scripts: `typecheck`, `lint:relaxed`, `lint:count`
- Hooks `commit-msg` con tokens `COMPLIANCE_CHECKED` y `Signed-off-by: ROADMAP_READ`

## Estado temporal (v1)
- `typecheck`: puede saltarse con `AIDUX_SKIP_TYPECHECK=1` (sólo durante v1).
- ESLint relajado en `eslint.override.config.js` para acelerar integración.
- Push a `main` sólo vía PR.

## Cumplimiento
- Todo PR **debe** incluir en la descripción:  
  `ACK: SOT v1.0.0`
- Cambios a archivos SoT requieren además:  
  `SOT_CHANGE_OK` **y** bump de versión en este documento.

## Historial
- Semilla v1.0.0 creada desde PR #113.
