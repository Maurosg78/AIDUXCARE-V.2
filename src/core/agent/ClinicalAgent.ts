import { GoogleCloudAudioService } from '../../services/GoogleCloudAudioService';
import { AudioPipelineService } from '../../services/AudioPipelineService';

export interface ClinicalAgentConfig {
  specialty: 'physiotherapy' | 'psychology' | 'general_medicine';
  sessionType: 'initial' | 'follow_up';
  enableRealTimeAnalysis?: boolean;
  timeoutMs?: number;
  retryAttempts?: number;
}

export interface ClinicalAnalysisResult {
  success: boolean;
  warnings: Array<{
    id: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    category: 'red_flag' | 'clinical_alert' | 'contraindication' | 'safety_concern';
    title: string;
    description: string;
    recommendation: string;
    evidence: string;
  }>;
  suggestions: Array<{
    id: string;
    type: 'assessment' | 'treatment' | 'education' | 'referral';
    title: string;
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  soap_analysis: {
    subjective: {
      chief_complaint: string;
      history_present_illness: string;
      relevant_history: string;
    };
    objective: {
      examination_findings: string;
      functional_assessment: string;
    };
    assessment: {
      clinical_impression: string;
      differential_diagnosis: string[];
      prognosis: string;
    };
    plan: {
      treatment_plan: string;
      follow_up_schedule: string;
    };
  };
  processingTime?: number;
  modelUsed?: string;
  error?: string;
}

export type TranscriptionCallback = (
  text: string,
  isFinal: boolean,
  metadata: {
    status: 'recording' | 'processing' | 'error' | 'complete';
    progress: number;
  }
) => void;

/**
 * ClinicalAgent - Agente Clínico Enterprise
 * 
 * Implementa el pipeline completo de análisis clínico siguiendo el mantra:
 * crear → testear → aprobar
 * 
 * @author Mauricio Sobarzo
 * @version 2.0 - Enterprise Quality
 */
export class ClinicalAgent {
  public readonly specialty: string;
  public readonly sessionType: string;
  public readonly enableRealTimeAnalysis: boolean;
  public isRecording: boolean = false;

  private readonly audioService: GoogleCloudAudioService;
  private readonly audioPipeline: AudioPipelineService;
  private readonly timeoutMs: number;
  private readonly retryAttempts: number;

  constructor(config: ClinicalAgentConfig) {
    // Validar configuración
    this.validateConfig(config);

    // Asignar propiedades
    this.specialty = config.specialty;
    this.sessionType = config.sessionType;
    this.enableRealTimeAnalysis = config.enableRealTimeAnalysis ?? true;
    this.timeoutMs = config.timeoutMs ?? 30000; // 30 segundos
    this.retryAttempts = config.retryAttempts ?? 3;

    // Inicializar servicios
    this.audioService = new GoogleCloudAudioService();
    
    // Crear callbacks para AudioPipelineService
    const audioCallbacks = {
      onTranscriptionStart: () => {
        console.log('🎙️ ClinicalAgent: Transcripción iniciada');
      },
      onTranscriptionEnd: () => {
        console.log('✅ ClinicalAgent: Transcripción finalizada');
      },
      onTranscriptionResult: (result: { text: string; isFinal: boolean; confidence?: number }) => {
        console.log('📝 ClinicalAgent: Resultado de transcripción recibido', result);
      },
      onTranscriptionError: (error: { code: string; message: string; details?: unknown }) => {
        console.error('❌ ClinicalAgent: Error en transcripción', error);
      }
    };
    
    this.audioPipeline = new AudioPipelineService(audioCallbacks);
  }

  /**
   * Valida la configuración del agente clínico
   */
  private validateConfig(config: ClinicalAgentConfig): void {
    const validSpecialties = ['physiotherapy', 'psychology', 'general_medicine'];
    if (!validSpecialties.includes(config.specialty)) {
      throw new Error('Especialidad no válida');
    }

    const validSessionTypes = ['initial', 'follow_up'];
    if (!validSessionTypes.includes(config.sessionType)) {
      throw new Error('Tipo de sesión no válido');
    }
  }

  /**
   * Analiza una transcripción clínica completa
   * 
   * @param transcription - Transcripción a analizar
   * @returns Promise<ClinicalAnalysisResult> - Resultado del análisis clínico
   */
  async analyzeTranscription(transcription: string): Promise<ClinicalAnalysisResult> {
    const startTime = Date.now();

    try {
      // Validar transcripción
      this.validateTranscription(transcription);

      console.log('🧠 ClinicalAgent: Iniciando análisis de transcripción', {
        specialty: this.specialty,
        sessionType: this.sessionType,
        transcriptionLength: transcription.length,
        timestamp: new Date().toISOString()
      });

      // Realizar análisis clínico con reintentos
      const result = await this.performAnalysisWithRetries(transcription);

      const processingTime = Date.now() - startTime;

      console.log('✅ ClinicalAgent: Análisis completado exitosamente', {
        processingTime,
        warningsCount: result.warnings?.length || 0,
        suggestionsCount: result.suggestions?.length || 0,
        modelUsed: result.modelUsed
      });

      return {
        ...result,
        processingTime,
        success: true
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error('❌ ClinicalAgent: Error en análisis de transcripción', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        processingTime,
        specialty: this.specialty
      });

      return {
        success: false,
        warnings: [],
        suggestions: [],
        soap_analysis: {
          subjective: { chief_complaint: '', history_present_illness: '', relevant_history: '' },
          objective: { examination_findings: '', functional_assessment: '' },
          assessment: { clinical_impression: '', differential_diagnosis: [], prognosis: '' },
          plan: { treatment_plan: '', follow_up_schedule: '' }
        },
        processingTime,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Valida la transcripción antes del análisis
   */
  private validateTranscription(transcription: string): void {
    if (!transcription || transcription.trim().length === 0) {
      throw new Error('Transcripción no puede estar vacía');
    }

    if (transcription.length > 10000) {
      throw new Error('Transcripción excede el límite máximo de 10,000 caracteres');
    }
  }

  /**
   * Realiza análisis con reintentos automáticos
   */
  private async performAnalysisWithRetries(transcription: string): Promise<ClinicalAnalysisResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🔄 ClinicalAgent: Intento ${attempt}/${this.retryAttempts}`);

        const result = await this.audioService.analyzeClinicalTranscription({
          transcription,
          specialty: this.specialty as 'physiotherapy' | 'psychology' | 'general_medicine',
          sessionType: this.sessionType as 'initial' | 'follow_up'
        });

        if (result.success && result.analysis) {
          // Convertir ClinicalAnalysisResponse a ClinicalAnalysisResult
          return {
            success: true,
            warnings: (result.analysis.warnings || []).map(warning => ({
              ...warning,
              category: warning.category as 'red_flag' | 'clinical_alert' | 'contraindication' | 'safety_concern'
            })),
            suggestions: (result.analysis.suggestions || []).map(suggestion => ({
              ...suggestion,
              type: suggestion.type as 'assessment' | 'treatment' | 'education' | 'referral'
            })),
            soap_analysis: {
              subjective: {
                chief_complaint: '',
                history_present_illness: '',
                relevant_history: ''
              },
              objective: {
                examination_findings: '',
                functional_assessment: ''
              },
              assessment: {
                clinical_impression: '',
                differential_diagnosis: [],
                prognosis: ''
              },
              plan: {
                treatment_plan: '',
                follow_up_schedule: ''
              }
            },
            modelUsed: result.metadata?.specialty || 'unknown'
          };
        } else {
          throw new Error(result.error || 'Análisis falló sin error específico');
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Error desconocido');
        
        console.warn(`⚠️ ClinicalAgent: Intento ${attempt} falló`, {
          error: lastError.message,
          attempt,
          maxAttempts: this.retryAttempts
        });

        // Si no es el último intento, esperar antes del siguiente
        if (attempt < this.retryAttempts) {
          await this.delay(1000 * attempt); // Backoff exponencial
        }
      }
    }

    throw lastError || new Error('Todos los intentos de análisis fallaron');
  }

  /**
   * Inicia la captura de audio en tiempo real
   */
  async startAudioCapture(_callback: TranscriptionCallback): Promise<void> {
    if (this.isRecording) {
      throw new Error('Ya hay una grabación en curso');
    }

    try {
      console.log('🎙️ ClinicalAgent: Iniciando captura de audio');

      await this.audioPipeline.startRecording();
      this.isRecording = true;

      console.log('✅ ClinicalAgent: Captura de audio iniciada exitosamente');

    } catch (error) {
      console.error('❌ ClinicalAgent: Error al iniciar captura de audio', {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  /**
   * Detiene la captura de audio
   */
  async stopAudioCapture(): Promise<void> {
    if (!this.isRecording) {
      console.warn('⚠️ ClinicalAgent: No hay grabación activa para detener');
      return;
    }

    try {
      console.log('🛑 ClinicalAgent: Deteniendo captura de audio');

      await this.audioPipeline.stopRecording();
      this.isRecording = false;

      console.log('✅ ClinicalAgent: Captura de audio detenida exitosamente');

    } catch (error) {
      console.error('❌ ClinicalAgent: Error al detener captura de audio', {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  /**
   * Utilidad para delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtiene el estado actual del agente
   */
  getStatus(): {
    isRecording: boolean;
    specialty: string;
    sessionType: string;
    enableRealTimeAnalysis: boolean;
  } {
    return {
      isRecording: this.isRecording,
      specialty: this.specialty,
      sessionType: this.sessionType,
      enableRealTimeAnalysis: this.enableRealTimeAnalysis
    };
  }
} 