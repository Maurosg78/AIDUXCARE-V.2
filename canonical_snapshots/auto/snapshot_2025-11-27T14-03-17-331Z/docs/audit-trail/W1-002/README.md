# ENTREGABLE W1-002: Ollama Cleanup + Vertex AI Canada Verification

## Estado Actual
- **Fase**: 02-development (Vertex verification completada)
- **Objetivo**: Eliminar dependencias de Ollama y asegurar que todo AI se procese vía Vertex AI en Canadá.
- **Última actualización**: 2025-11-27

## Avances
1. ✅ Auditoría CLI de referencias Ollama (`ollama-occurrences.txt`).
2. ✅ Requisitos/arquitectura/riesgos documentados.
3. ✅ Vertex AI configuration verificada (proyecto, Cloud Function, cliente, curl test).
4. ⏳ Próximo: limpiar código (remover Ollama) y pruebas.

## Evidencia Clave
- `01-planning/requirements.md`, `architecture-decision.md`, `risk-assessment.md`, `cto-brief.md`
- `02-development/ollama-audit.md`
- `02-development/vertex-project-config.txt`
- `02-development/vertex-function-describe.txt`
- `02-development/vertex-env-occurrences.txt`
- `02-development/vertex-proxy-head.txt`
- `02-development/vertex-verification.md`

## Próximos Pasos
1. Eliminar servicios Ollama (`src/services/nlpServiceOllama.ts`, `src/lib/ollama.ts`, env configs).
2. Borrar dependencias en `package.json` y scripts.
3. Ejecutar tests + documentar resultados.
4. Actualizar `docs/COMPLIANCE_REMEDIATION_CHECKLIST.md` para W1-002.

## Guardrails
- CLI-first execution, evidencia en audit-trail.
- ISO 27001 controls mapeados (A.8.23, A.8.27, A.12.1).
- CTO review checkpoint diario.

---
**Status**: 🟢 En curso, siguiendo plan CTO.
