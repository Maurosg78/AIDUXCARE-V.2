/**
 * 🎤 TRANSCRIPTION API
 * API para transcripción de audio usando Google Cloud Speech-to-Text
 */

import { Request, Response } from 'express';
// import { healthcare } from '@googleapis/healthcare';
// import { GoogleAuth } from 'google-auth-library';

// TODO: Implementar transcripción con Google Cloud Speech-to-Text
// import { SpeechClient } from '@google-cloud/speech';

export const transcribeAudio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { audioData, languageCode = 'es-ES' } = req.body;

    if (!audioData) {
      res.status(400).json({
        error: 'Datos de audio requeridos para transcripción',
      });
      return;
    }

    console.log('🎤 Iniciando transcripción de audio...');

    // TODO: Implementar transcripción real con Google Cloud Speech-to-Text
    // Por ahora, simulamos la transcripción
    const mockTranscription = {
      transcript: 'El paciente refiere dolor en el hombro derecho desde hace 3 semanas.',
      confidence: 0.95,
      languageCode: languageCode,
      alternatives: [
        {
          transcript: 'El paciente refiere dolor en el hombro derecho desde hace 3 semanas.',
          confidence: 0.95,
        },
      ],
    };

    console.log('✅ Transcripción completada');

    res.json({
      success: true,
      transcription: mockTranscription,
    });
  } catch (error: any) {
    console.error('❌ Error en transcripción:', error.message);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
    });
  }
};

export const getTranscriptionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    console.log('📋 Obteniendo historial de transcripción para sesión:', sessionId);

    // TODO: Implementar obtención de historial desde base de datos
    const mockHistory = [
      {
        id: '1',
        sessionId: sessionId,
        transcript: 'El paciente refiere dolor en el hombro derecho.',
        timestamp: new Date().toISOString(),
        confidence: 0.95,
      },
    ];

    res.json({
      success: true,
      history: mockHistory,
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo historial:', error.message);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
    });
  }
}; 