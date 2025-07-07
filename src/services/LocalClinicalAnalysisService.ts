/**
 * 🧠 Local Clinical Analysis Service
 * Reemplaza completamente el Cloud Function con análisis 100% local
 */

import { clinicalAnalyzer, type ClinicalAnalysis } from './ClinicalAnalyzer';

export interface LocalAnalysisOptions {
  specialty?: string;
  sessionType?: string;
  enableEnhancedMode?: boolean;
}

export interface LocalAnalysisResult {
  success: boolean;
  analysis?: ClinicalAnalysis;
  error?: string;
  processingTime: number;
  mode: 'local' | 'enhanced' | 'fallback';
}

export class LocalClinicalAnalysisService {
  private static instance: LocalClinicalAnalysisService;
  
  public static getInstance(): LocalClinicalAnalysisService {
    if (!LocalClinicalAnalysisService.instance) {
      LocalClinicalAnalysisService.instance = new LocalClinicalAnalysisService();
    }
    return LocalClinicalAnalysisService.instance;
  }

  /**
   * Análisis clínico completo local que reemplaza Cloud Function
   */
  async analyzeTranscription(
    transcription: string,
    options: LocalAnalysisOptions = {}
  ): Promise<LocalAnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log('🧠 LOCAL CLINICAL ANALYSIS - INICIANDO:', {
        transcriptionLength: transcription.length,
        specialty: options.specialty || 'general',
        sessionType: options.sessionType || 'initial'
      });

      // Validación de entrada
      if (!transcription || transcription.trim().length < 10) {
        throw new Error('Transcripción muy corta para análisis clínico');
      }

      // Análisis usando ClinicalAnalyzer local
      const analysis = await clinicalAnalyzer.analyzeTranscription(
        transcription,
        options.specialty || 'general',
        options.sessionType || 'initial'
      );

      const processingTime = Date.now() - startTime;

      console.log('✅ ANÁLISIS LOCAL COMPLETADO:', {
        success: analysis.success,
        warningsCount: analysis.warnings.length,
        suggestionsCount: analysis.suggestions.length,
        riskLevel: analysis.riskLevel,
        processingTime,
        confidence: analysis.soapAnalysis.confidence
      });

      return {
        success: true,
        analysis,
        processingTime,
        mode: options.enableEnhancedMode ? 'enhanced' : 'local'
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error('❌ Error en análisis clínico local:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en análisis local',
        processingTime,
        mode: 'fallback'
      };
    }
  }

  /**
   * Formato compatible con GoogleCloudAudioService para reemplazo directo
   */
  async processTranscriptionCompatible(
    transcription: string,
    specialty: string = 'physiotherapy',
    sessionType: string = 'initial'
  ): Promise<any> {
    try {
      const result = await this.analyzeTranscription(transcription, {
        specialty,
        sessionType,
        enableEnhancedMode: true
      });

      if (!result.success || !result.analysis) {
        throw new Error(result.error || 'Análisis fallido');
      }

      const analysis = result.analysis;

      // Formato compatible con respuesta Cloud Function
      return {
        success: true,
        warnings: analysis.warnings,
        suggestions: analysis.suggestions,
        soapAnalysis: {
          subjective: analysis.soapAnalysis.subjective,
          objective: analysis.soapAnalysis.objective,
          assessment: analysis.soapAnalysis.assessment,
          plan: analysis.soapAnalysis.plan,
          confidence: analysis.soapAnalysis.confidence
        },
        riskLevel: analysis.riskLevel,
        processingTime: analysis.processingTimeMs,
        modelUsed: analysis.modelUsed,
        metadata: {
          specialty,
          sessionType,
          analysisMode: 'local-clinical-analyzer',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error en processTranscriptionCompatible:', error);
      throw error;
    }
  }

  /**
   * Test de funcionalidad con casos predefinidos
   */
  async runDiagnosticTest(): Promise<boolean> {
    const testCases = [
      {
        name: 'Emergencia Cardíaca',
        transcription: 'Tengo un dolor muy fuerte en el pecho que se irradia hacia el brazo izquierdo, me siento mareado y con náuseas',
        expectedWarnings: 1,
        expectedRisk: 'CRITICAL'
      },
      {
        name: 'Dolor Crónico',
        transcription: 'Doctor, tengo dolor en la espalda baja que me molesta desde hace varios meses, especialmente por las mañanas',
        expectedWarnings: 0,
        expectedRisk: 'LOW'
      }
    ];

    let allTestsPassed = true;

    for (const testCase of testCases) {
      try {
        const result = await this.analyzeTranscription(testCase.transcription);
        
        const passed = result.success && 
                      result.analysis &&
                      result.analysis.warnings.length >= testCase.expectedWarnings;

        console.log(`🧪 Test "${testCase.name}": ${passed ? '✅ PASS' : '❌ FAIL'}`, {
          warningsCount: result.analysis?.warnings.length || 0,
          riskLevel: result.analysis?.riskLevel || 'UNKNOWN'
        });

        if (!passed) allTestsPassed = false;

      } catch (error) {
        console.error(`❌ Test "${testCase.name}" falló:`, error);
        allTestsPassed = false;
      }
    }

    return allTestsPassed;
  }
}

// Export singleton instance
export const localClinicalAnalysisService = LocalClinicalAnalysisService.getInstance(); 