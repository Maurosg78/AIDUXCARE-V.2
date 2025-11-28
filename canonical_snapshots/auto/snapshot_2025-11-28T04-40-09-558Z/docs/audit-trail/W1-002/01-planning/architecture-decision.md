# DECISIÓN DE ARQUITECTURA - W1-002

## Contexto
- Ollama/local AI introduce riesgo de datos fuera de Canadá y dependencias no auditadas.
- Vertex AI vía Cloud Functions (northamerica-northeast1) ya existe y cumple soberanía + logging.
- CTO requiere eliminar Ollama y asegurar una sola ruta segura.

## Opciones Evaluadas

### Opción A: Vertex AI Exclusivo (Recomendado)
- **Descripción**: Todo procesamiento AI pasa por Vertex AI mediante función proxy ubicada en `northamerica-northeast1`.
- **Ventajas**:
  - ✅ Datos permanecen en Canadá.
  - ✅ Logging centralizado (Firestore/Stackdriver).
  - ✅ Menor superficie de ataque (un solo proveedor gestionado).
  - ✅ Compatible con hospital pilot + ISO.
- **Desventajas**:
  - Dependencia total en Vertex AI SLA.
  - Requiere fallback no-AI o reintentos controlados.

### Opción B: Dual Provider (Vertex + Ollama local)
- **Descripción**: Mantener Ollama como fallback para resiliencia.
- **Motivo de descarte**:
  - ❌ Rompe guardrails de soberanía.
  - ❌ Duplica superficie de auditoría.
  - ❌ CTO explicitamente prohibió.

### Opción C: Vertex + Another Canadian Provider (futuro)
- **Estado**: No aplicable en este sprint; requeriría evaluación legal adicional.

## Decisión
- Adoptar **Opción A: Vertex AI Exclusivo**.
- Documentar fallback basado en reintentos/queue, no en otro proveedor.
- Remover por completo artefactos Ollama.

## Implicaciones Técnicas
- `src/services/nlpServiceOllama.ts`, `src/lib/ollama.ts`, env vars relacionadas → eliminar o aislar fuera del build.
- Asegurar que `env.ts`, `vertex-ai-service-firebase.ts`, Cloud Functions usan `northamerica-northeast1`.
- Actualizar scripts (`check-status.sh`, etc.) para reflejar nuevo estado.
- Testing: garantizar que componentes antes conectados a Ollama ahora usen Vertex service.

## Evidencia Requerida
- Diff mostrando remoción.
- Output de `rg -n "ollama"` post-cleanup (0 coincidencias).
- Comandos `gcloud functions describe` y `firebase functions:config:get` confirmando región.

## Aprobaciones
- [x] Backend Lead (2025-11-27)
- [ ] CTO Sign-off (pendiente, se enviará junto con plan completo)

---
**Estado**: ✅ Decisión tomada - ejecución autorizada.
