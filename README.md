# AIDUXCARE V.2

Asistente clínico inteligente rediseñado desde cero.

# trigger validate workflow


### 📘 Roadmap de versiones – AiDuxCare V.2

#### ✅ Versión `v2.7.0` – `runClinicalAgent`: orquestador clínico de alto nivel
**Fecha:** 2025-05-15  
**Estado:** ✅ Completado y testeado  
**Descripción:**  
Implementación del módulo `runClinicalAgent`, una función de orquestación que permite al sistema ejecutar el agente clínico a partir del contexto MCP (Memoria Clínica del Paciente), de forma desacoplada y segura.

**Características clave:**
- Transforma el `MCPContext` en un `AgentContext` válido.
- Ejecuta el agente LLM usando `executeAgent`.
- Devuelve sugerencias clínicas y un array preparado para futuras auditorías (`auditLogs`).
- Manejo robusto de errores y fallback a estado seguro.
- Totalmente compatible con múltiples proveedores: `'openai'`, `'anthropic'`, `'mistral'`, `'custom'`.
- Tests unitarios exhaustivos con Vitest.
- Preparado para integración futura con LLMs reales.

**Archivos clave:**
- `src/core/agent/runClinicalAgent.ts`
- `__tests__/core/agent/runClinicalAgent.test.ts`

**Verificaciones técnicas:**
- ✅ `npx tsc --noEmit`
- ✅ `npm run lint`
- ✅ `npm test`
- ✅ CI/Workflow GitHub Actions
- ✅ Etiqueta Git `v2.7.0` aplicada

