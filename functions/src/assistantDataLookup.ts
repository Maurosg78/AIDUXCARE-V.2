import { onRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Inicializar Firebase Admin si no está inicializado
if (getApps().length === 0) {
  initializeApp();
}

interface DataLookupRequest {
  intent: string;
  params: Record<string, unknown>;
  userId: string;
}

interface DataLookupResponse {
  answerMarkdown: string;
  data?: unknown;
  metadata: {
    intent: string;
    timestamp: string;
    processingTimeMs: number;
    success: boolean;
  };
}

export const assistantDataLookup = onRequest({
  cors: true,
  maxInstances: 5
}, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { intent, params, userId } = req.body as DataLookupRequest;
    
    if (!intent || !userId) {
      res.status(400).json({ error: 'Intent y userId son requeridos' });
      return;
    }

    // Simular lookup de datos basado en intent
    let answerMarkdown = '';
    let data: unknown = null;

    switch (intent) {
      case 'testCommandCentre':
        answerMarkdown = 'Test del Command Centre ejecutado correctamente';
        data = { testType: 'e2e', status: 'success' };
        break;
      case 'patientData':
        answerMarkdown = 'Datos del paciente recuperados';
        data = { patientId: params.patientId, status: 'active' };
        break;
      case 'appointments':
        answerMarkdown = 'Citas del profesional recuperadas';
        data = { clinicianId: userId, count: 0 };
        break;
      default:
        answerMarkdown = `Intent "${intent}" no reconocido`;
        data = { intent, params };
    }

    const processingTime = Date.now() - startTime;
    
    const response: DataLookupResponse = {
      answerMarkdown,
      data,
      metadata: {
        intent,
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
        success: true
      }
    };

    // Log de auditoría
    const db = getFirestore();
    await db.collection('audit_logs').add({
      action: 'assistant_data_lookup',
      userId,
      timestamp: new Date(),
      status: 'success',
      details: {
        intent,
        processingTimeMs: processingTime,
        success: true
      }
    });

    res.json(response);
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // Log de error
    const db = getFirestore();
    await db.collection('audit_logs').add({
      action: 'assistant_data_lookup',
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


