# REQUISITOS - W1-002: Eliminar Ollama + Verificar Vertex AI Canadá

## Información General
- **Fecha**: 2025-11-27
- **Responsable**: Backend Lead
- **CTO Prioridad**: P1 (Critical for data sovereignty)
- **Controles ISO**: A.8.23 (Use of Cloud Services), A.8.27 (Secure system change), A.12.1 (Operating procedures)

## Requisitos Funcionales

### R1: Inventario completo de dependencias Ollama
- Ejecutar auditoría CLI (`rg -n "ollama"`) y registrar resultados.
- Mantener archivo `ollama-occurrences.txt` como evidencia.
- Objetivo: identificar todos los imports, env vars, configs, scripts, docs.

### R2: Eliminación total de Ollama del código activo
- Retirar imports, servicios, hooks y config que apunten a Ollama/local AI.
- Mantener referencias únicamente si son parte de documentación histórica (marcadas como deprecated) y fuera del build.
- Verificar con `npm run build` que no se requiera ningún paquete Ollama.

### R3: Configuración única de Vertex AI en región canadiense
- Validar que todas las URLs/Functions apunten a `northamerica-northeast1`.
- Confirmar que `env.ts`, `vertex-ai-service-firebase.ts`, Cloud Functions, y cualquier proxy utilicen región Canadá.
- Documentar evidencia (`gcloud functions describe`, `firebase functions:config:get`).

### R4: Fallback & resiliencia
- Definir estrategia de fallback controlado (ej. cola de reintentos, mensaje al usuario) en lugar de recurrir a servicios fuera de Canadá.
- Documentar proceso y tests.

### R5: Testing post-cleanup
- Unit tests: asegurar que servicios que consumían Ollama ahora usan Vertex AI o mocks.
- Smoke test CLI (p.ej., `npm run build`, `npm run test:vertex` si existe).
- Documentar resultados en `03-testing/`.

### R6: Documentación ISO
- Actualizar checklist en `docs/COMPLIANCE_REMEDIATION_CHECKLIST.md` para W1-002.
- Crear entries en `docs/audit-trail/W1-002/` para cada fase.

## Requisitos No Funcionales

### Seguridad
- Zero llamadas a endpoints fuera de Canadá.
- Tokens/keys almacenados solo en `.env` seguro.

### Observabilidad
- Registrar en auditoría los endpoints utilizados (Vertex AI proxy logs).

### Performance
- Medir cambios de latencia si se elimina Ollama local (documentar comparativa si aplica).

## Dependencias
- Acceso a Firebase Functions / Google Cloud CLI.
- Keys de Vertex AI existentes.
- Coordinación con DevOps para verificar regiones.

## KPIs de Éxito
- `rg -n "ollama"` retorna 0 resultados en código activo.
- Vertex AI endpoints evidenciados en región canadiense.
- Build y tests pasan sin dependencias a Ollama.

---
**Estado**: ⏳ Planificación en progreso
