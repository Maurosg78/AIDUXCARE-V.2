import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Inicializar Firebase Admin si no está inicializado
if (getApps().length === 0) {
  initializeApp();
}

interface AssistantQueryRequest {
  input: string;
  userId?: string;
  ctx?: unknown;
}

interface AssistantQueryResponse {
  answerMarkdown: string;
  entities: unknown[];
  metadata: {
    queryType: string;
    timestamp: string;
    processingTimeMs: number;
    confidence: number;
    sanitized: boolean;
  };
}

export const assistantQuery = onRequest({
  cors: true,
  maxInstances: 5
}, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { input, userId, ctx } = req.body as AssistantQueryRequest;
    
    if (!input || typeof input !== 'string') {
      res.status(400).json({ error: 'Input requerido y debe ser string' });
      return;
    }

    // Simular procesamiento de IA (placeholder)
    const processingTime = Date.now() - startTime;
    
    const response: AssistantQueryResponse = {
      answerMarkdown: `Respuesta simulada para: "${input}"`,
      entities: [],
      metadata: {
        queryType: 'simulated',
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
        confidence: 0.8,
        sanitized: true
      }
    };

    // Log de auditoría
    const db = getFirestore();
    await db.collection('audit_logs').add({
      action: 'assistant_query',
      userId: userId || 'anonymous',
      timestamp: new Date(),
      status: 'success',
      details: {
        input: input.substring(0, 100), // Limitar longitud para auditoría
        processingTimeMs: processingTime,
        queryType: 'simulated'
      }
    });

    res.json(response);
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // Log de error
    const db = getFirestore();
    await db.collection('audit_logs').add({
      action: 'assistant_query',
      userId: req.body?.userId || 'anonymous',
      timestamp: new Date(),
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      details: {
        processingTimeMs: processingTime
      }
    });

    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});


