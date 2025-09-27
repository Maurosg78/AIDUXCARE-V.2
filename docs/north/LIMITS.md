# Límites (v1)

- Se permite `AIDUX_SKIP_TYPECHECK=1` para push durante estabilización.
- Lint relajado con `eslint.override.config.js` (temporal).
- No se permiten pushes directos a `main`.
- Los commits deben incluir tokens exigidos por `commit-msg`.

## Salida de v1
Para cerrar v1:
1) Quitar `eslint.override.config.js`.
2) Restaurar `typecheck` estricto (`tsc --noEmit`).
3) Publicar SoT v1.1+ con cambios y fecha.
