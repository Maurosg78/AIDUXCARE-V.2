# EVALUACIÓN DE RIESGOS - W1-002

## R1: Regresiones funcionales (sin Ollama)
- **Probabilidad**: Media
- **Impacto**: Alto (AI builder podría fallar)
- **Mitigación**:
  - Crear lista de módulos que dependían de Ollama.
  - Proveer mocks/tests para los servicios reemplazados.
  - Realizar smoke test `npm run build` + flujo clínico básico.

## R2: Vertex AI indisponible
- **Probabilidad**: Baja
- **Impacto**: Alto (sin generación de notas)
- **Mitigación**:
  - Implementar reintentos exponenciales.
  - Alertar al usuario (banner) si Vertex no responde.
  - Documentar proceso manual (crear nota sin AI).

## R3: Config incorrecta de región
- **Probabilidad**: Media
- **Impacto**: Existencial (datos fuera de Canadá)
- **Mitigación**:
  - Ejecutar comandos `gcloud functions describe` y registrar evidencias.
  - Revisar `env.ts`, Cloud Functions y .env.
  - Añadir test automatizado (CI) que verifique string `northamerica-northeast1`.

## R4: Dependencias fantasma
- **Probabilidad**: Media
- **Impacto**: Medio (build warnings, tamaño bundle)
- **Mitigación**:
  - Ejecutar `npm ls | grep ollama`.
  - Limpiar `package.json` y lockfiles.
  - Revisar docs/scripts.

## R5: Falta de rollback
- **Probabilidad**: Baja
- **Impacto**: Alto (si Vertex falla post-cleanup)
- **Mitigación**:
  - Mantener branch de respaldo.
  - Documentar pasos para revertir commit de cleanup.
  - Mantener copia de servicios en `archive/` (fuera del build) si es estrictamente necesario.

---
**Última actualización**: 2025-11-27
