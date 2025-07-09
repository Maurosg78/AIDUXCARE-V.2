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
  private readonly clinicalBrainEndpoint = 'https://us-east1-aiduxcare-stt-20250706.cloudfunctions.net/clinical-brain';
  
  async analyzeClinicalTranscription(request: ClinicalAnalysisRequest): Promise<ClinicalAnalysisResponse> {
    // 🔍 DIAGNÓSTICO EXHAUSTIVO - Logging detallado para detectar causa raíz
    console.log('🧠 INICIANDO DIAGNÓSTICO CLOUD FUNCTION:', {
      endpoint: this.clinicalBrainEndpoint,
      transcriptionLength: request.transcription.length,
      specialty: request.specialty,
      sessionType: request.sessionType,
      transcriptionPreview: request.transcription.substring(0, 100) + '...',
      requestSize: JSON.stringify(request).length,
      timestamp: new Date().toISOString()
    });

    // Validación exhaustiva del request antes de enviar
    const validation = this.validateTranscription(request.transcription);
    if (!validation.isValid) {
      console.error('❌ VALIDACIÓN FALLIDA:', validation.error);
      return {
        success: false,
        error: `Validación fallida: ${validation.error}`,
        message: validation.error
      };
    }

    try {
      console.log('📡 ENVIANDO REQUEST A CLOUD FUNCTION:', {
        method: 'POST',
        contentType: 'application/json',
        bodySize: JSON.stringify(request).length,
        body: {
          transcription: request.transcription.length > 200 ? 
            request.transcription.substring(0, 200) + '...' : 
            request.transcription,
          specialty: request.specialty,
          sessionType: request.sessionType
        }
      });

      // ⏰ AÑADIR TIMEOUT DE 60 SEGUNDOS
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout

      const response = await fetch(this.clinicalBrainEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal // ⏰ Añadir signal para timeout
      });

      clearTimeout(timeoutId); // Limpiar timeout si la respuesta llega

      console.log('📡 RESPUESTA RECIBIDA DE CLOUD FUNCTION:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });

      if (!response.ok) {
        // DIAGNÓSTICO EXHAUSTIVO DEL ERROR
        let errorDetails = '';
        let fullErrorResponse = null;
        
        try {
          const rawResponse = await response.text();
          console.log('📋 RAW ERROR RESPONSE:', rawResponse);
          
          try {
            fullErrorResponse = JSON.parse(rawResponse);
            errorDetails = fullErrorResponse.message || fullErrorResponse.error || 'Error desconocido del servidor';
          } catch (jsonParseError) {
            errorDetails = rawResponse || `Error HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (textError) {
          errorDetails = `Error HTTP ${response.status}: ${response.statusText}`;
        }

        console.error('❌ DIAGNÓSTICO COMPLETO DEL ERROR:', {
          status: response.status,
          statusText: response.statusText,
          errorDetails,
          fullErrorResponse,
          request: {
            transcriptionLength: request.transcription.length,
            specialty: request.specialty,
            sessionType: request.sessionType,
            transcriptionSample: request.transcription.substring(0, 150)
          },
          timestamp: new Date().toISOString()
        });

        // Si es Error 500, intentar capturar más detalles específicos
        if (response.status === 500) {
          console.error('🚨 ERROR 500 DETECTADO - ANÁLISIS ESPECÍFICO:', {
            likelyTextChunkerError: errorDetails.includes('textChunker'),
            likelyVertexAIError: errorDetails.includes('Vertex') || errorDetails.includes('INVALID_ARGUMENT'),
            likelyPromptError: errorDetails.includes('prompt') || errorDetails.includes('template'),
            fullErrorMessage: errorDetails
          });
        }

        return {
          success: false,
          error: this.formatErrorMessage(response.status, errorDetails),
          message: errorDetails
        };
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
      
      // 🚨 MANEJO ESPECÍFICO DE TIMEOUT
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('⏰ TIMEOUT DEL CEREBRO CLÍNICO:', {
          duration: '60 segundos',
          transcriptionLength: request.transcription.length,
          specialty: request.specialty,
          recommendation: 'Usar procesamiento básico'
        });

        return {
          success: false,
          error: '⏰ El Cerebro Clínico tardó más de 60 segundos. Se ha generado un análisis básico. Todas las funciones médicas están disponibles.',
          message: 'timeout_cerebro_clinico'
        };
      }

      console.error('❌ ERROR DE RED CLOUD FUNCTION:', {
        error: errorMessage,
        request: {
          transcriptionLength: request.transcription.length,
          specialty: request.specialty,
          sessionType: request.sessionType
        }
      });

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

    // 🔧 PASO 3: MENSAJE MEJORADO PARA USUARIO CLÍNICO
    // Verificar que contiene palabras reales
    const words = transcription.trim().split(/\s+/);
    if (words.length < 3) {
      return { 
        isValid: false, 
        error: 'No se ha podido detectar una transcripción clara. Por favor, verifique su micrófono e inténtelo de nuevo en un entorno con menos ruido de fondo.'
      };
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