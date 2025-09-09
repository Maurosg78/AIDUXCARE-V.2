# Integración de Governance en tu código existente

## 1. En tu vertex-ai-service-firebase.ts

```typescript
// Añadir al inicio
import { cleanVertexResponse } from '../utils/cleanVertexResponse-enhanced';
import { logger } from '../core/monitoring/logger';

// En tu función existente
export async function analyzeWithVertexAI(
  transcript: string,
  sessionId: string
) {
  const traceId = `${sessionId}-${Date.now()}`;
  
  logger.clinical('analysis.start', '1.1.0', { 
    sessionId, 
    traceId 
  });
  
  try {
    // Tu código existente de llamada a Vertex
    const response = await callVertexAI(transcript);
    
    // Usar la nueva función de limpieza con validación
    const cleaned = cleanVertexResponse(response, traceId);
    
    logger.clinical('analysis.complete', '1.1.0', { 
      sessionId,
      traceId,
      success: !cleaned.error 
    });
    
    return cleaned;
    
  } catch (error) {
    logger.error('vertex.analysis.failed', error, { 
      sessionId, 
      traceId 
    });
    throw error;
  }
}
```

## 2. Métricas para mostrar en la demo

```typescript
// En tu dashboard component
import { logger } from '../core/monitoring/logger';

// Loggear métricas importantes
logger.metric('soap.completion_time', timeInSeconds);
logger.metric('soap.tests_suggested', testsCount);
logger.metric('user.session_duration', durationInMinutes);
```

## 3. Para el día de la demo

Antes de la demo, ejecuta:
```bash
export VITE_ENV=production
export VITE_PROMPT_VERSION=1.1.0
export VITE_LOG_LEVEL=error  # Minimizar logs en consola
npm run build
npm run preview
```
