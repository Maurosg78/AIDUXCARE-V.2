export interface ClinicalAnalysisRequest {
  transcription: string;
  specialty: 'physiotherapy' | 'psychology' | 'general_medicine';
  sessionType: 'initial' | 'follow_up';
}

export interface ClinicalAnalysisResponse {
  success: boolean;
  analysis?: {
    warnings: Array<{
      id: string;
      severity: 'HIGH' | 'MEDIUM' | 'LOW';
      category: string;
      title: string;
      description: string;
      recommendation: string;
      evidence: string;
    }>;
    suggestions: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      rationale: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
    soap_analysis: {
      subjective_completeness: number;
      objective_completeness: number;
      assessment_quality: number;
      plan_appropriateness: number;
      overall_quality: number;
      missing_elements: string[];
    };
    session_quality: {
      communication_score: number;
      clinical_thoroughness: number;
      patient_engagement: number;
      professional_standards: number;
      areas_for_improvement: string[];
    };
  };
  error?: string;
  message?: string;
  metadata?: {
    specialty: string;
    sessionType: string;
    processingTimeMs: number;
    timestamp: string;
  };
}

export class GoogleCloudAudioService {
  private readonly clinicalBrainEndpoint = 'https://us-central1-aiduxcare-stt-20250706.cloudfunctions.net/transcribeAudio';
  
  async analyzeClinicalTranscription(request: ClinicalAnalysisRequest): Promise<ClinicalAnalysisResponse> {
    console.log('🧠 Enviando transcripción al Cerebro Clínico...', {
      transcriptionLength: request.transcription.length,
      specialty: request.specialty,
      sessionType: request.sessionType
    });

    try {
      const response = await fetch(this.clinicalBrainEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      console.log('📡 Respuesta del Cerebro Clínico:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        // Obtener detalles del error del servidor
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = errorData.message || errorData.error || 'Error desconocido del servidor';
          console.error('❌ Error del Cerebro Clínico:', errorData);
          
          return {
            success: false,
            error: this.formatErrorMessage(response.status, errorDetails),
            message: errorDetails
          };
        } catch (parseError) {
          errorDetails = `Error HTTP ${response.status}: ${response.statusText}`;
          return {
            success: false,
            error: this.formatErrorMessage(response.status, errorDetails),
            message: errorDetails
          };
        }
      }

      const result = await response.json();
      console.log('✅ Análisis recibido del Cerebro Clínico:', {
        success: result.success,
        hasWarnings: !!result.analysis?.warnings,
        warningsCount: result.analysis?.warnings?.length || 0,
        hasSuggestions: !!result.analysis?.suggestions,
        suggestionsCount: result.analysis?.suggestions?.length || 0,
        overallQuality: result.analysis?.soap_analysis?.overall_quality
      });

      return result;

    } catch (error) {
      console.error('❌ Error crítico comunicándose con el Cerebro Clínico:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      return {
        success: false,
        error: this.formatNetworkError(errorMessage),
        message: errorMessage
      };
    }
  }

  private formatErrorMessage(statusCode: number, errorDetails: string): string {
    switch (statusCode) {
      case 400:
        return `⚠️ Solicitud inválida: ${errorDetails}. Verifique que la transcripción sea válida.`;
      case 401:
        return `🔒 Error de autenticación: ${errorDetails}. Contacte al soporte técnico.`;
      case 403:
        return `🚫 Acceso denegado: ${errorDetails}. Verifique sus permisos.`;
      case 404:
        return `🔍 Servicio no encontrado: ${errorDetails}. El Cerebro Clínico puede estar en mantenimiento.`;
      case 429:
        return `⏱️ Límite de uso excedido: ${errorDetails}. Intente nuevamente en unos minutos.`;
      case 500:
        return `🚨 Error interno del Cerebro Clínico: ${errorDetails}. El sistema está procesando pero encontró un problema técnico.`;
      case 502:
        return `🔌 Error de conexión: ${errorDetails}. El servicio puede estar temporalmente no disponible.`;
      case 503:
        return `⚙️ Servicio no disponible: ${errorDetails}. El Cerebro Clínico está en mantenimiento.`;
      case 504:
        return `⏰ Tiempo de espera agotado: ${errorDetails}. La transcripción puede ser muy larga.`;
      default:
        return `❌ Error del servidor (${statusCode}): ${errorDetails}`;
    }
  }

  private formatNetworkError(errorMessage: string): string {
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return `🌐 Error de conexión de red: ${errorMessage}. Verifique su conexión a internet.`;
    }
    
    if (errorMessage.includes('timeout')) {
      return `⏰ Tiempo de espera agotado: ${errorMessage}. La transcripción puede ser muy larga o el servicio está sobrecargado.`;
    }
    
    if (errorMessage.includes('INVALID_ARGUMENT')) {
      return `⚠️ Formato de transcripción no válido: ${errorMessage}. La transcripción no pudo ser procesada por el modelo de IA.`;
    }
    
    if (errorMessage.includes('quota')) {
      return `📊 Límites de uso alcanzados: ${errorMessage}. Se han agotado los recursos del servicio de IA.`;
    }
    
    return `🔧 Error técnico: ${errorMessage}. Contacte al soporte técnico si el problema persiste.`;
  }

  // Método para validar transcripción antes de enviar
  validateTranscription(transcription: string): { isValid: boolean; error?: string } {
    if (!transcription || transcription.trim().length === 0) {
      return { isValid: false, error: 'La transcripción está vacía' };
    }

    if (transcription.length < 10) {
      return { isValid: false, error: 'La transcripción es demasiado corta (mínimo 10 caracteres)' };
    }

    if (transcription.length > 50000) {
      return { isValid: false, error: 'La transcripción es demasiado larga (máximo 50,000 caracteres)' };
    }

    // Verificar que contiene palabras reales
    const words = transcription.trim().split(/\s+/);
    if (words.length < 3) {
      return { isValid: false, error: 'La transcripción debe contener al menos 3 palabras' };
    }

    return { isValid: true };
  }

  // Método para obtener estado del servicio
  async getServiceStatus(): Promise<{ available: boolean; message: string }> {
    try {
      const response = await fetch(`${this.clinicalBrainEndpoint}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          available: true,
          message: `✅ Cerebro Clínico disponible (${data.version || 'v1.0.0'})`
        };
      } else {
        return {
          available: false,
          message: `⚠️ Cerebro Clínico no disponible (${response.status})`
        };
      }
    } catch (error) {
      return {
        available: false,
        message: `❌ Error verificando estado del Cerebro Clínico: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }
} 