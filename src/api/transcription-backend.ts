/**
 * MEDICAL AIDUXCARE - BACKEND TRANSCRIPTION SERVICE
 * Pipeline profesional: Audio → Google Cloud Speech-to-Text → Structured Output
 */

export interface TranscriptionRequest {
  audio: Blob;
  patientId: string;
  speakerDiarization: boolean;
  medicalContext: string;
}

export interface SpeakerLabel {
  speaker: 'PATIENT' | 'THERAPIST';
  label: string; // Para compatibilidad con la UI
  text: string;
  timestamp: number;
  confidence: number;
}

export interface TranscriptionResponse {
  text: string; // SUCCESS Corregido: text en lugar de transcript
  confidence: number;
  duration: number; // SUCCESS Agregado: duración en segundos
  speakers?: SpeakerLabel[]; // SUCCESS Corregido: speakers en lugar de speakerLabels
  processingTime: number;
  audioQuality: 'excellent' | 'good' | 'poor';
}

export interface SOAPClassificationRequest {
  transcript: string;
  speakerLabels: SpeakerLabel[];
  patientContext: {
    id: string;
    name: string;
    condition: string;
    medicalHistory: string[];
  };
  useVertexAI: boolean;
}

export interface SOAPResponse {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  confidence: {
    subjective: number;
    objective: number;
    assessment: number;
    plan: number;
  };
  overallConfidence: number;
  processingTime: number;
  processingMethod: 'vertex-ai' | 'gemini-developer';
  timestamp: string;
}

/**
 * MOCK BACKEND IMPLEMENTATION
 * Simula el comportamiento del backend real mientras esperamos la infraestructura
 */
export class ProfessionalTranscriptionService {
  
  /**
   * Simula Google Cloud Speech-to-Text con Speaker Diarization
   */
  static async transcribeAudio(audio: Blob, config: Partial<TranscriptionRequest>): Promise<TranscriptionResponse> {
    console.log('🔊 [BACKEND MOCK] Procesando audio con Google Cloud Speech-to-Text...');
    console.log('STATS Configuración:', config);
    
    // Simular tiempo de procesamiento real
    await this.delay(2000 + Math.random() * 3000);
    
    // Simular transcripción médica realista basada en el contexto del paciente
    const mockTranscriptions = this.getMockTranscriptionForContext(config.medicalContext || '');
    const selectedTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
    
    console.log('SUCCESS [BACKEND MOCK] Transcripción completada');
    
    return {
      text: selectedTranscription.fullText, // SUCCESS Corregido: text en lugar de transcript
      confidence: Math.round((0.92 + Math.random() * 0.07) * 100), // SUCCESS Corregido: porcentaje
      duration: 45 + Math.round(Math.random() * 30), // SUCCESS Agregado: duration
      speakers: selectedTranscription.speakers.map(s => ({ // SUCCESS Corregido: speakers
        ...s,
        label: s.speaker === 'PATIENT' ? 'Paciente' : 'Terapeuta'
      })),
      processingTime: 2.3,
      audioQuality: 'excellent' as const
    };
  }

  /**
   * Simula RealWorldSOAPProcessor + Gemini clasificación
   */
  static async classifySOAP(request: SOAPClassificationRequest): Promise<SOAPResponse> {
    console.log('🤖 [BACKEND MOCK] Clasificando SOAP con RealWorldSOAPProcessor...');
    console.log('TARGET Método preferido:', request.useVertexAI ? 'Vertex AI' : 'Gemini Developer');
    
    // Simular tiempo de procesamiento de IA
    await this.delay(1500 + Math.random() * 2000);
    
    // Generar SOAP contextual basado en la transcripción
    const soapResult = this.generateContextualSOAP(request);
    
    console.log('SUCCESS [BACKEND MOCK] Clasificación SOAP completada');
    
    return soapResult;
  }

  /**
   * Genera transcripciones médicas realistas por contexto
   */
  private static getMockTranscriptionForContext(context: string): Array<{fullText: string, speakers: SpeakerLabel[]}> {
    if (context.toLowerCase().includes('lumbar') || context.toLowerCase().includes('espalda')) {
      return [{
        fullText: "Doctora buenos días. Vengo porque tengo un dolor en la parte baja de la espalda que me está molestando, especialmente por las mañanas cuando me levanto. Me duele cuando me muevo de cierta manera. Muy bien, déjeme examinarla. Flexione hacia adelante por favor. Veo que hay cierta limitación en el movimiento y refiere molestias en esta zona. Vamos a evaluar más detalladamente para determinar el mejor abordaje fisioterapéutico.",
        speakers: [
          { speaker: 'PATIENT', label: 'Paciente', text: 'Doctora buenos días. Vengo porque tengo un dolor en la parte baja de la espalda que me está molestando, especialmente por las mañanas cuando me levanto. Me duele cuando me muevo de cierta manera.', timestamp: 0, confidence: 0.95 },
          { speaker: 'THERAPIST', label: 'Terapeuta', text: 'Muy bien, déjeme examinarla. Flexione hacia adelante por favor. Veo que hay cierta limitación en el movimiento y refiere molestias en esta zona.', timestamp: 15, confidence: 0.93 },
          { speaker: 'THERAPIST', label: 'Terapeuta', text: 'Vamos a evaluar más detalladamente para determinar el mejor abordaje fisioterapéutico.', timestamp: 35, confidence: 0.96 }
        ]
      }];
    }
    
    if (context.toLowerCase().includes('hombro')) {
      return [{
        fullText: "Doctor, vengo por un dolor en el hombro que comenzó hace poco después de hacer un esfuerzo. Me molesta cuando levanto el brazo. Entiendo. Permítame evaluar la movilidad del hombro. Levante el brazo lateralmente. Observo cierta limitación en el movimiento del hombro. Vamos a trabajar en mejorar la función y el rango de movimiento con fisioterapia.",
        speakers: [
          { speaker: 'PATIENT', label: 'Paciente', text: 'Doctor, vengo por un dolor en el hombro que comenzó hace poco después de hacer un esfuerzo. Me molesta cuando levanto el brazo.', timestamp: 0, confidence: 0.94 },
          { speaker: 'THERAPIST', label: 'Terapeuta', text: 'Entiendo. Permítame evaluar la movilidad del hombro. Levante el brazo lateralmente. Observo cierta limitación en el movimiento del hombro.', timestamp: 18, confidence: 0.92 },
          { speaker: 'THERAPIST', label: 'Terapeuta', text: 'Vamos a trabajar en mejorar la función y el rango de movimiento con fisioterapia.', timestamp: 40, confidence: 0.95 }
        ]
      }];
    }

    // Transcripción genérica
    return [{
      fullText: "Buenos días doctor. Vengo por una consulta porque he estado sintiendo algunas molestias. Perfecto, cuénteme en detalle qué síntomas ha presentado y desde cuándo. Voy a realizar un examen físico completo para evaluar su condición.",
      speakers: [
        { speaker: 'PATIENT', label: 'Paciente', text: 'Buenos días doctor. Vengo por una consulta porque he estado sintiendo algunas molestias.', timestamp: 0, confidence: 0.90 },
        { speaker: 'THERAPIST', label: 'Terapeuta', text: 'Perfecto, cuénteme en detalle qué síntomas ha presentado y desde cuándo. Voy a realizar un examen físico completo para evaluar su condición.', timestamp: 8, confidence: 0.88 }
      ]
    }];
  }

  /**
   * Genera clasificación SOAP contextual usando IA simulada
   * IMPORTANTE: Conservador y apropiado para fisioterapia, sin diagnósticos médicos ni medicamentos
   */
  private static generateContextualSOAP(request: SOAPClassificationRequest): SOAPResponse {
    const transcript = request.transcript.toLowerCase();
    
    let subjective = "Paciente refiere molestias según lo manifestado durante la consulta.";
    let objective = "Evaluación funcional realizada según protocolos de fisioterapia.";
    let assessment = "Evaluación fisioterapéutica en proceso. Se requiere más información para determinar plan de tratamiento específico.";
    let plan = "1. Evaluación funcional completa\n2. Programa de ejercicios terapéuticos\n3. Seguimiento fisioterapéutico\n4. Derivación médica si se requiere manejo farmacológico o estudios complementarios";

    // Análisis CONSERVADOR basado ÚNICAMENTE en lo transcrito, SIN inventar detalles
    if (transcript.includes('dolor') && (transcript.includes('lumbar') || transcript.includes('espalda'))) {
      subjective = "Paciente refiere molestias en región lumbar según lo expresado durante la consulta.";
      objective = "Evaluación funcional de región lumbar realizada, con hallazgos documentados por el fisioterapeuta.";
      assessment = "Disfunción musculoesquelética en región lumbar que requiere abordaje fisioterapéutico conservador. Evaluación en curso para determinar origen funcional.";
      plan = "1. Evaluación biomecánica completa\n2. Programa de ejercicios de movilidad\n3. Educación en higiene postural\n4. Seguimiento fisioterapéutico semanal\n5. Derivación médica para valoración y manejo farmacológico si es necesario";
    }
    
    if (transcript.includes('hombro') && transcript.includes('dolor')) {
      subjective = "Paciente refiere molestias en hombro según lo comunicado durante la evaluación.";
      objective = "Evaluación funcional de hombro realizada, con valoración de rango de movimiento documentada.";
      assessment = "Disfunción funcional de hombro que requiere evaluación específica fisioterapéutica. Necesario determinar limitaciones funcionales específicas.";
      plan = "1. Evaluación detallada de patrones de movimiento\n2. Programa de movilización progresiva\n3. Ejercicios de fortalecimiento gradual\n4. Educación en ergonomía\n5. Derivación médica para estudios complementarios si es necesario";
    }

    // Para cualquier mención de medicamentos, derivar apropiadamente
    if (transcript.includes('medicamento') || transcript.includes('pastilla') || transcript.includes('medicina')) {
      plan = "1. Evaluación funcional fisioterapéutica\n2. Programa de ejercicios terapéuticos\n3. DERIVACIÓN MÉDICA para evaluación farmacológica (fisioterapeuta no prescribe medicamentos)\n4. Seguimiento fisioterapéutico\n5. Coordinación con equipo médico";
    }

    const baseConfidence = 75 + Math.random() * 15; // 75-90% (más conservador)
    const confidenceVariation = () => Math.round(baseConfidence + (Math.random() - 0.5) * 10);

    return {
      subjective,
      objective,
      assessment,
      plan,
      confidence: {
        subjective: confidenceVariation(),
        objective: confidenceVariation(),
        assessment: confidenceVariation(),
        plan: confidenceVariation()
      },
      overallConfidence: Math.round(baseConfidence),
      processingTime: Math.round(1500 + Math.random() * 2000),
      processingMethod: request.useVertexAI ? 'vertex-ai' : 'gemini-developer',
      timestamp: new Date().toISOString()
    };
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * API Routes Mock - Simula los endpoints del backend
 */
export const BackendAPI = {
  async transcribeAudio(audioBlob: Blob, medicalContext: string): Promise<TranscriptionResponse> {
    console.log('🎤 BackendAPI.transcribeAudio llamado con:', {
      audioSize: audioBlob.size,
      audioType: audioBlob.type,
      medicalContext
    });
    
    return await ProfessionalTranscriptionService.transcribeAudio(audioBlob, {
      medicalContext,
      speakerDiarization: true
    });
  },

  async classifySOAP(transcript: string, medicalContext: string): Promise<SOAPResponse> {
    console.log('🤖 BackendAPI.classifySOAP llamado con:', {
      transcriptLength: transcript.length,
      medicalContext
    });
    
    const request: SOAPClassificationRequest = {
      transcript,
      speakerLabels: [], // Se obtendría de la transcripción real
      patientContext: {
        id: 'mock-patient',
        name: 'Mock Patient',
        condition: medicalContext,
        medicalHistory: []
      },
      useVertexAI: false // Usar Gemini Developer por ahora
    };
    
    return await ProfessionalTranscriptionService.classifySOAP(request);
  }
}; 