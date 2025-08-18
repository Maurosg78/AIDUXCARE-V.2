import { Request, Response } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// Inicializar Firebase Admin si no está inicializado
if (getApps().length === 0) {
  initializeApp();
}

export interface LocalTranscriptionRequest {
  id: string;
  text: string;
  confidence: number;
  timestamp: string;
  userId: string;
  sessionId: string;
  metadata: {
    duration: number;
    sampleRate: number;
    channels: number;
  };
}

export interface ProTranscriptionResponse {
  id: string;
  originalText: string;
  proText: string;
  confidence: number;
  improvements: string[];
  processingTime: number;
  timestamp: Date;
  status: 'success' | 'error';
  error?: string;
}

export const processLocalTranscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, text, confidence, timestamp, userId, sessionId, metadata } = req.body as LocalTranscriptionRequest;

    // Validar parámetros requeridos
    if (!id || !text || !userId || !sessionId) {
      res.status(400).json({
        error: 'Faltan parámetros requeridos: id, text, userId, sessionId'
      });
      return;
    }

    const db = getFirestore();
    const startTime = Date.now();

    // Log de la solicitud para auditoría
    await db.collection('audit_logs').add({
      action: 'local_transcription_process',
      userId,
      transcriptionId: id,
      sessionId,
      timestamp: new Date(),
      status: 'processing',
      metadata: {
        originalConfidence: confidence,
        audioDuration: metadata.duration,
        sampleRate: metadata.sampleRate
      }
    });

    // Procesar la transcripción con IA Pro
    const proResult = await enhanceTranscriptionWithAI(text, confidence, metadata);

    // Calcular tiempo de procesamiento
    const processingTime = Date.now() - startTime;

    // Crear respuesta Pro
    const response: ProTranscriptionResponse = {
      id,
      originalText: text,
      proText: proResult.text,
      confidence: proResult.confidence,
      improvements: proResult.improvements,
      processingTime,
      timestamp: new Date(),
      status: 'success'
    };

    // Guardar resultado en Firestore
    await db.collection('pro_transcriptions').doc(id).set({
      ...response,
      userId,
      sessionId,
      originalMetadata: metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Actualizar log de auditoría
    await db.collection('audit_logs').add({
      action: 'local_transcription_completed',
      userId,
      transcriptionId: id,
      sessionId,
      timestamp: new Date(),
      status: 'success',
      metadata: {
        processingTime,
        finalConfidence: proResult.confidence,
        improvementsCount: proResult.improvements.length
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error en processLocalTranscription:', error);

    // Log del error para auditoría
    try {
      const db = getFirestore();
      await db.collection('audit_logs').add({
        action: 'local_transcription_error',
        userId: req.body?.userId || 'unknown',
        transcriptionId: req.body?.id || 'unknown',
        sessionId: req.body?.sessionId || 'unknown',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Error desconocido',
        status: 'error'
      });
    } catch (logError) {
      console.error('Error al registrar error en auditoría:', logError);
    }

    const errorResponse: ProTranscriptionResponse = {
      id: req.body?.id || 'unknown',
      originalText: req.body?.text || '',
      proText: '',
      confidence: 0,
      improvements: [],
      processingTime: 0,
      timestamp: new Date(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    };

    res.status(500).json(errorResponse);
  }
};

// Función para mejorar la transcripción con IA Pro
async function enhanceTranscriptionWithAI(
  text: string,
  originalConfidence: number,
  metadata: { duration: number; sampleRate: number; channels: number }
): Promise<{ text: string; confidence: number; improvements: string[] }> {
  
  // En implementación real, aquí se llamaría a Vertex AI o Gemini
  // Por ahora, simulamos mejoras básicas
  
  let enhancedText = text;
  const improvements: string[] = [];
  let confidence = originalConfidence;

  // Simular correcciones de terminología médica
  if (text.toLowerCase().includes('dolor')) {
    enhancedText = enhancedText.replace(/dolor/gi, 'dolor');
    if (text.toLowerCase().includes('lumbar')) {
      enhancedText = enhancedText.replace(/lumbar/gi, 'lumbar');
      improvements.push('Terminología anatómica validada');
    }
  }

  // Simular estructura SOAP si no está presente
  if (!text.includes('S:') && !text.includes('O:') && !text.includes('A:') && !text.includes('P:')) {
    if (text.includes('paciente') || text.includes('dolor') || text.includes('síntoma')) {
      enhancedText = `S: ${text}\nO: [Observaciones pendientes]\nA: [Evaluación pendiente]\nP: [Plan pendiente]`;
      improvements.push('Estructura SOAP aplicada');
      confidence += 0.15;
    }
  }

  // Simular identificación de entidades clínicas
  const clinicalTerms = ['dolor', 'inflamación', 'rigidez', 'limitación', 'trauma'];
  const foundTerms = clinicalTerms.filter(term => text.toLowerCase().includes(term));
  
  if (foundTerms.length > 0) {
    improvements.push(`Entidades clínicas identificadas: ${foundTerms.join(', ')}`);
    confidence += 0.1;
  }

  // Simular validación de contexto médico
  if (metadata.duration > 30) { // Más de 30 segundos
    improvements.push('Audio de duración clínicamente relevante');
    confidence += 0.05;
  }

  // Limitar confianza máxima
  confidence = Math.min(confidence, 0.95);

  // Mejoras adicionales basadas en el contexto
  if (text.length > 50) {
    improvements.push('Transcripción de longitud adecuada para análisis clínico');
  }

  if (originalConfidence < 0.5) {
    improvements.push('Confianza mejorada significativamente');
  }

  return {
    text: enhancedText,
    confidence,
    improvements
  };
}

// Función para obtener transcripciones Pro por usuario
export const getProTranscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, limit = 50 } = req.query;

    if (!userId) {
      res.status(400).json({
        error: 'Parámetro userId requerido'
      });
      return;
    }

    const db = getFirestore();
    
    const snapshot = await db.collection('pro_transcriptions')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(Number(limit))
      .get();

    const transcriptions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({
      success: true,
      transcriptions,
      count: transcriptions.length
    });

  } catch (error) {
    console.error('Error en getProTranscriptions:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
