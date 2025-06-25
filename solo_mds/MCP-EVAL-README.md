# Sistema de Evaluación del MCPContextBuilder

Este sistema proporciona un conjunto de pruebas automatizadas para evaluar el comportamiento del componente `MCPContextBuilder` de AiDuxCare, responsable de construir el contexto clínico (MCP) a partir de datos estructurados.

## Estructura del Sistema

El sistema de evaluación consta de:

### 1. Archivos Mock para Datos de Prueba

Los mocks están ubicados en `__mocks__/inputs/` y proporcionan datos de prueba para diferentes escenarios:

- **`fullVisit.ts`**: Contexto completo con todos los campos requeridos.
- **`missingFieldsVisit.ts`**: Contexto con campos críticos faltantes.
- **`inconsistentVisit.ts`**: Contexto con datos inconsistentes o inválidos.
- **`minimalVisit.ts`**: Contexto mínimo pero válido.

### 2. Archivo de Pruebas

El archivo principal de pruebas está en `__tests__/evals/MCPContextBuilder.eval.test.ts` y evalúa cuatro casos de uso:

1. **Datos clínicos completos**: Verifica que el builder genere un contexto con la estructura correcta.
2. **Campos críticos faltantes**: Comprueba que se preserve la estructura incluso con campos faltantes.
3. **Valores inconsistentes**: Evalúa que se mantenga la mayor cantidad de datos posible.
4. **Datos mínimos válidos**: Verifica que funcione correctamente con datos mínimos.

### 3. Script de Depuración

El archivo `src/core/mcp/debugMCP.ts` permite visualizar el comportamiento del builder con diferentes entradas y facilita el diagnóstico de problemas.

## Ejecución de las Pruebas

Para ejecutar las pruebas de evaluación:

```bash
npm run test:mcp-eval
```

O para ejecutar todas las pruebas del proyecto:

```bash
npm test
```

## Resultados y Criterios de Éxito

Las pruebas verifican que el `MCPContextBuilder`:

- Construya un contexto MCP válido desde datos completos del EMR.
- Omita datos irrelevantes o inconsistentes sin romper la estructura.
- Preserve campos clave del contexto.
- Genere errores claros cuando falten datos esenciales.
- Retorne una estructura compatible con `MCPContextSchema`.

## Diseño del Sistema de Evaluación

El sistema de evaluación está diseñado para ser:

1. **Completo**: Cubre múltiples casos de uso y escenarios.
2. **Independiente**: No depende de sistemas externos como Supabase.
3. **Mantenible**: Los tests son claros y los mocks son reutilizables.
4. **Robusto**: Capaz de detectar problemas sutiles en la construcción del contexto.

## Notas de Implementación

- Para simular errores de validación, se utilizan formatos de fecha inválidos y contenidos nulos.
- Se mockean `console.warn` y `console.debug` para capturar advertencias sin contaminar la salida.
- La evaluación se centra en la estructura del contexto y no en detalles específicos de implementación. 