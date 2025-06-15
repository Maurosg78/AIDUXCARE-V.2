/**
 * 🎤 TRANSCRIPTION API - GOOGLE SPEECH-TO-TEXT
 * Endpoint para la funcionalidad de "Escucha Activa" - Prioridad #3
 * Procesa audio en tiempo real y devuelve transcripción estructurada
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as admin from 'firebase-admin';
import { SpeechClient } from '@google-cloud/speech';

// === CONFIGURACIÓN REAL DE GOOGLE CLOUD SPEECH-TO-TEXT ===
const initializeSpeechClient = (): SpeechClient => {
  try {
    // Configuración de credenciales desde variables de entorno
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCLOUD_PROJECT || 'aiduxcare-mvp-prod';
    
    // Inicializar cliente con credenciales automáticas
    const speechClient = new SpeechClient({
      projectId: projectId,
      // Las credenciales se cargan automáticamente desde:
      // 1. Variable de entorno GOOGLE_APPLICATION_CREDENTIALS
      // 2. Credenciales por defecto de Google Cloud
      // 3. Metadata service en Google Cloud Platform
    });

    console.log(`✅ SpeechClient inicializado para proyecto: ${projectId}`);
    return speechClient;
  } catch (error) {
    console.error('❌ Error inicializando SpeechClient:', error);
    throw new Error(`Error de configuración de Google Cloud Speech: ${error}`);
  }
};

// Inicializar cliente global
const speechClient = initializeSpeechClient();

// === INTERFACES PARA DATOS ESTRUCTURADOS ===
interface SpeakerInfo {
  speakerId: string;
  role: 'PATIENT' | 'THERAPIST' | 'UNKNOWN';
  confidence: number;
  totalWords: number;
}

interface EnhancedTranscriptionSegment {
  id: string;
  text: string;
  speaker: SpeakerInfo;
  startTime: number;
  endTime: number;
  confidence: number;
  words: Array<{
    word: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
}

interface TranscriptionResult {
  sessionId: string;
  segments: EnhancedTranscriptionSegment[];
  speakers: SpeakerInfo[];
  totalDuration: number;
  overallConfidence: number;
  processingTime: number;
}

// === CONFIGURACIÓN AVANZADA DE SPEECH-TO-TEXT ===
const createSpeechConfig = () => {
  return {
    encoding: 'WEBM_OPUS' as const,
    sampleRateHertz: 48000,
    languageCode: 'es-ES',
    alternativeLanguageCodes: ['es-MX', 'es-AR', 'es-CL'],
    
    // === SPEAKER DIARIZATION CONFIGURATION ===
    diarizationConfig: {
      enableSpeakerDiarization: true,
      minSpeakerCount: 2,
      maxSpeakerCount: 4,
    },
    
    // === MEDICAL SPECIALIZATION ===
    model: 'medical_dictation',
    useEnhanced: true,
    
    // === ADVANCED FEATURES ===
    enableWordTimeOffsets: true,
    enableWordConfidence: true,
    enableAutomaticPunctuation: true,
    
    // === MEDICAL TERMINOLOGY BOOST ===
    speechContexts: [{
      phrases: [
        // Anatomía
        'cervical', 'lumbar', 'torácico', 'hombro', 'rodilla', 'cadera', 'muñeca', 'tobillo',
        // Síntomas
        'dolor', 'inflamación', 'rigidez', 'debilidad', 'entumecimiento', 'hormigueo',
        // Tratamientos
        'fisioterapia', 'ejercicio', 'estiramiento', 'fortalecimiento', 'movilización',
        // Medicamentos
        'ibuprofeno', 'paracetamol', 'diclofenaco', 'naproxeno', 'antiinflamatorio',
        // Escalas de dolor
        'escala del dolor', 'uno al diez', 'leve', 'moderado', 'severo', 'intenso'
      ],
      boost: 20.0
    }],
    
    // === PROFANITY FILTER ===
    profanityFilter: false, // Deshabilitado para contexto médico
  };
};

// === ANÁLISIS INTELIGENTE DE HABLANTES ===
const analyzeSpeakerRoles = (segments: any[]): SpeakerInfo[] => {
  const speakerStats = new Map<string, {
    totalWords: number;
    medicalTerms: number;
    questionCount: number;
    instructionCount: number;
    segments: any[];
  }>();

  // Patrones para identificar roles
  const medicalTermsPattern = /\b(dolor|síntoma|tratamiento|ejercicio|terapia|medicamento|inflamación|rigidez)\b/gi;
  const questionPattern = /\?|cómo|qué|cuándo|dónde|por qué/gi;
  const instructionPattern = /\b(debe|tiene que|necesita|recomiendo|sugiero|haga|realice)\b/gi;

  // Analizar cada segmento
  segments.forEach(segment => {
    const speakerId = `speaker_${segment.speakerTag || 1}`;
    
    if (!speakerStats.has(speakerId)) {
      speakerStats.set(speakerId, {
        totalWords: 0,
        medicalTerms: 0,
        questionCount: 0,
        instructionCount: 0,
        segments: []
      });
    }

    const stats = speakerStats.get(speakerId)!;
    const text = segment.alternatives[0]?.transcript || '';
    
    stats.totalWords += text.split(' ').length;
    stats.medicalTerms += (text.match(medicalTermsPattern) || []).length;
    stats.questionCount += (text.match(questionPattern) || []).length;
    stats.instructionCount += (text.match(instructionPattern) || []).length;
    stats.segments.push(segment);
  });

  // Determinar roles basado en patrones
  const speakers: SpeakerInfo[] = [];
  
  speakerStats.forEach((stats, speakerId) => {
    let role: 'PATIENT' | 'THERAPIST' | 'UNKNOWN' = 'UNKNOWN';
    let confidence = 0.5;

    // Lógica de clasificación
    const medicalTermRatio = stats.medicalTerms / stats.totalWords;
    const instructionRatio = stats.instructionCount / stats.segments.length;
    const questionRatio = stats.questionCount / stats.segments.length;

    if (instructionRatio > 0.3 && medicalTermRatio > 0.1) {
      role = 'THERAPIST';
      confidence = Math.min(0.95, 0.6 + instructionRatio + medicalTermRatio);
    } else if (questionRatio > 0.2 || stats.totalWords < stats.segments.length * 5) {
      role = 'PATIENT';
      confidence = Math.min(0.9, 0.6 + questionRatio);
    }

    speakers.push({
      speakerId,
      role,
      confidence,
      totalWords: stats.totalWords
    });
  });

  return speakers;
};

// === PROCESAMIENTO PRINCIPAL ===
export const processTranscription = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    console.log('🎤 Iniciando transcripción con Google Cloud Speech-to-Text...');
    
    // Validar datos de entrada
    const { audioData, sessionId } = req.body;
    
    if (!audioData) {
      res.status(400).json({
        success: false,
        error: 'Audio data es requerido'
      });
      return;
    }

    const currentSessionId = sessionId || uuidv4();
    
    // Convertir audio base64 a buffer
    const audioBuffer = Buffer.from(audioData, 'base64');
    console.log(`📊 Audio buffer size: ${audioBuffer.length} bytes`);

    // === LLAMADA REAL A GOOGLE CLOUD SPEECH-TO-TEXT ===
    const config = createSpeechConfig();
    
    const request = {
      config: config,
      audio: {
        content: audioBuffer.toString('base64')
      }
    };

    console.log('🔄 Enviando solicitud a Google Cloud Speech-to-Text...');
    const [response] = await speechClient.recognize(request);
    
    if (!response.results || response.results.length === 0) {
      console.log('⚠️ No se detectó audio o transcripción vacía');
      res.json({
        success: true,
        data: {
          sessionId: currentSessionId,
          segments: [],
          speakers: [],
          totalDuration: 0,
          overallConfidence: 0,
          processingTime: Date.now() - startTime
        }
      });
      return;
    }

    // === PROCESAMIENTO DE RESULTADOS ===
    const segments: EnhancedTranscriptionSegment[] = [];
    let totalConfidence = 0;
    let totalDuration = 0;

    response.results.forEach((result: any, index: number) => {
      if (!result.alternatives || result.alternatives.length === 0) return;

      const alternative = result.alternatives[0];
      const transcript = alternative.transcript || '';
      const confidence = alternative.confidence || 0;
      
      // Extraer información de tiempo y palabras
      const words = alternative.words?.map((word: any) => ({
        word: word.word || '',
        startTime: parseFloat(word.startTime?.seconds || '0') + 
                  parseFloat(word.startTime?.nanos || '0') / 1e9,
        endTime: parseFloat(word.endTime?.seconds || '0') + 
                parseFloat(word.endTime?.nanos || '0') / 1e9,
        confidence: word.confidence || 0
      })) || [];

      const startTime = words.length > 0 ? words[0].startTime : 0;
      const endTime = words.length > 0 ? words[words.length - 1].endTime : 0;
      
      totalDuration = Math.max(totalDuration, endTime);
      totalConfidence += confidence;

      // Información del hablante (de Speaker Diarization)
      const speakerTag = (result as any).speakerTag || 1;
      const speakerInfo: SpeakerInfo = {
        speakerId: `speaker_${speakerTag}`,
        role: 'UNKNOWN', // Se determinará después
        confidence: 0.5,
        totalWords: words.length
      };

      segments.push({
        id: `segment_${currentSessionId}_${index}`,
        text: transcript,
        speaker: speakerInfo,
        startTime,
        endTime,
        confidence,
        words
      });
    });

    // === ANÁLISIS DE HABLANTES ===
    const speakers = analyzeSpeakerRoles(response.results);
    
    // Actualizar información de hablantes en segmentos
    segments.forEach(segment => {
      const speaker = speakers.find(s => s.speakerId === segment.speaker.speakerId);
      if (speaker) {
        segment.speaker = speaker;
      }
    });

    const result: TranscriptionResult = {
      sessionId: currentSessionId,
      segments,
      speakers,
      totalDuration,
      overallConfidence: segments.length > 0 ? totalConfidence / segments.length : 0,
      processingTime: Date.now() - startTime
    };

    // === GUARDAR EN FIRESTORE ===
    const db = admin.firestore();
    await db.collection('transcriptions').doc(currentSessionId).set({
      ...result,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });

    console.log(`✅ Transcripción completada en ${result.processingTime}ms`);
    console.log(`📊 Segmentos: ${segments.length}, Hablantes: ${speakers.length}`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error en transcripción:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error procesando transcripción',
      details: error instanceof Error ? error.message : 'Error desconocido',
      processingTime: Date.now() - startTime
    });
  }
};

// === ENDPOINT DE ESTADO ===
export const getTranscriptionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const db = admin.firestore();
    const doc = await db.collection('transcriptions').doc(sessionId).get();
    
    if (!doc.exists) {
      res.status(404).json({
        success: false,
        error: 'Sesión de transcripción no encontrada'
      });
      return;
    }

    res.json({
      success: true,
      data: doc.data()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estado de transcripción'
    });
  }
}; 