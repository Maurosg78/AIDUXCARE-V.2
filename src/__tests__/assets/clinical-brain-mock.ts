// Mock del Cerebro Clínico para Testing E2E
export interface MockClinicalBrainResponse {
  success: boolean;
  analysis: {
    warnings: Array<{
      id: string;
      severity: string;
      category: string;
      title: string;
      description: string;
      recommendation: string;
      confidence: number;
    }>;
    suggestions: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      priority: string;
    }>;
    soap_analysis: {
      overall_quality: string;
      score: number;
    };
  };
  metadata: {
    processingTime: number;
    modelUsed: string;
    timestamp: string;
    version: string;
  };
}

export function generateMockResponse(transcription: string): MockClinicalBrainResponse {
  const lowerTranscription = transcription.toLowerCase();
  
  // Detectar banderas rojas cardíacas
  const hasChestPain = lowerTranscription.includes('dolor') && (
    lowerTranscription.includes('pecho') || 
    lowerTranscription.includes('torácico') ||
    lowerTranscription.includes('torax')
  );
  
  const hasArmPain = lowerTranscription.includes('brazo izquierdo');
  const hasBreathing = lowerTranscription.includes('respirar') || lowerTranscription.includes('aire');
  const hasSweating = lowerTranscription.includes('sudor') || lowerTranscription.includes('sudar');
  
  const isCardiacEmergency = hasChestPain && (hasArmPain || hasBreathing || hasSweating);
  
  // Generar warnings basados en contenido
  const warnings = [];
  
  if (isCardiacEmergency) {
    warnings.push({
      id: "warning_cardiac_001",
      severity: "CRITICAL",
      category: "emergency_alert",
      title: "Sospecha de Síndrome Coronario Agudo",
      description: "Combinación de dolor torácico con irradiación a brazo izquierdo y síntomas vegetativos sugiere posible evento coronario agudo",
      recommendation: "EVALUACIÓN MÉDICA URGENTE - Solicitar ECG inmediato, considerar traslado a urgencias",
      confidence: 0.92
    });
  }
  
  if (hasChestPain) {
    warnings.push({
      id: "warning_chest_001", 
      severity: hasArmPain ? "HIGH" : "MEDIUM",
      category: "clinical_alert",
      title: "Dolor Torácico Requiere Evaluación",
      description: "Presencia de dolor torácico que debe ser evaluado para descartar origen cardiaco",
      recommendation: "Evaluación médica para determinar etiología del dolor torácico",
      confidence: 0.85
    });
  }
  
  // Generar sugerencias
  const suggestions = [
    {
      id: "suggestion_001",
      type: "immediate_action",
      title: "Monitoreo de signos vitales",
      description: "Vigilar presión arterial, frecuencia cardíaca y saturación de oxígeno",
      priority: "HIGH"
    },
    {
      id: "suggestion_002", 
      type: "diagnostic",
      title: "Electrocardiograma",
      description: "Realizar ECG de 12 derivaciones para evaluación cardiaca",
      priority: "HIGH"
    },
    {
      id: "suggestion_003",
      type: "documentation",
      title: "Documentar evolución temporal",
      description: "Registrar tiempo de inicio, duración y características del dolor",
      priority: "MEDIUM"
    }
  ];
  
  return {
    success: true,
    analysis: {
      warnings,
      suggestions,
      soap_analysis: {
        overall_quality: isCardiacEmergency ? "Requiere atención inmediata" : "Evaluación necesaria",
        score: isCardiacEmergency ? 95 : 78
      }
    },
    metadata: {
      processingTime: Math.floor(Math.random() * 2000) + 1000, // 1-3 segundos
      modelUsed: "gemini-2.5-flash-mock",
      timestamp: new Date().toISOString(),
      version: "2.0-mock"
    }
  };
}

export async function mockClinicalBrainAPI(request: {
  transcription: string;
  specialty?: string;
  sessionType?: string;
}): Promise<MockClinicalBrainResponse> {
  
  // Simular tiempo de procesamiento
  await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000) + 500));
  
  // Validar entrada
  if (!request.transcription || request.transcription.trim().length === 0) {
    throw new Error('Transcripción requerida');
  }
  
  if (request.transcription.trim().length < 10) {
    throw new Error('Transcripción muy corta');
  }
  
  return generateMockResponse(request.transcription);
} 