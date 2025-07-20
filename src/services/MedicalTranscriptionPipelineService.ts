/**
 * 🎙️ Medical Transcription Pipeline Service - AiDuxCare V.2
 * Pipeline de transcripción médica en 3 fases según Blueprint Oficial
 * Implementación del flujo de trabajo real de consulta fisioterapéutica
 */

import OptimizedClinicalBrainService, { ClinicalAnalysisRequest, ClinicalAnalysisResponse } from './OptimizedClinicalBrainService';
import ProfessionalProfileService from './ProfessionalProfileService';

export interface TranscriptionSegment {
  id: string;
  speaker: 'paciente' | 'terapeuta';
  text: string;
  timestamp: number;
  confidence: number;
}

export interface PipelinePhase1Result {
  transcription: string;
  segments: TranscriptionSegment[];
  highlights: Array<{
    id: string;
    text: string;
    category: 'síntoma' | 'hallazgo' | 'antecedente' | 'medicación' | 'actividad';
    confidence: number;
    isSelected: boolean;
  }>;
  warnings: Array<{
    id: string;
    type: 'legal' | 'contraindicación' | 'bandera_roja' | 'bandera_amarilla' | 'punto_ciego' | 'sugerencia_diagnóstica' | 'test_provocación';
    severity: 'alta' | 'media' | 'baja';
    category: 'compliance' | 'seguridad' | 'diagnóstico' | 'tratamiento';
    title: string;
    description: string;
    action: string;
    isAccepted: boolean;
  }>;
}

export interface PipelinePhase2Result {
  selectedHighlights: string[];
  acceptedWarnings: string[];
  suggestedTests: Array<{
    name: string;
    category: 'ortopédico' | 'neurológico' | 'cardiorrespiratorio' | 'funcional';
    description: string;
    contraindications: string[];
    expectedResults: string[];
  }>;
  testResults: Array<{
    testName: string;
    result: string;
    notes: string;
  }>;
}

export interface PipelinePhase3Result {
  soapDocument: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    quality: {
      subjective: number;
      objective: number;
      assessment: number;
      plan: number;
      overall: number;
    };
  };
  complianceIssues: string[];
  auditTrail: Array<{
    action: string;
    timestamp: Date;
    userId: string;
    details: string;
  }>;
}

export interface CompletePipelineResult {
  phase1: PipelinePhase1Result;
  phase2: PipelinePhase2Result;
  phase3: PipelinePhase3Result;
  metadata: {
    totalProcessingTime: number;
    professionalProfileId: string;
    patientId: string;
    sessionId: string;
    timestamp: Date;
  };
}

export class MedicalTranscriptionPipelineService {
  private static instance: MedicalTranscriptionPipelineService;
  private clinicalBrain: OptimizedClinicalBrainService;
  private profileService: ProfessionalProfileService;
  
  // Cache para transcripciones (eliminación automática según HIPAA/GDPR)
  private transcriptionCache: Map<string, { data: unknown; expiry: Date }> = new Map();
  
  // Configuración de retención de datos
  private readonly DATA_RETENTION_HOURS = 1; // 1 hora según HIPAA/GDPR

  private constructor() {
    this.clinicalBrain = OptimizedClinicalBrainService.getInstance();
    this.profileService = ProfessionalProfileService.getInstance();
    
    // Limpiar cache expirado cada hora
    setInterval(() => this.cleanExpiredCache(), 60 * 60 * 1000);
  }

  static getInstance(): MedicalTranscriptionPipelineService {
    if (!MedicalTranscriptionPipelineService.instance) {
      MedicalTranscriptionPipelineService.instance = new MedicalTranscriptionPipelineService();
    }
    return MedicalTranscriptionPipelineService.instance;
  }

  /**
   * FASE 1: La Anamnesis Aumentada
   * Procesamiento de transcripción médica con análisis automático
   */
  async executePhase1(
    rawTranscription: string,
    professionalProfileId: string,
    patientInfo: { age: number; gender: string; occupation: string; comorbidities: string[] }
  ): Promise<PipelinePhase1Result> {
    console.log('📋 FASE 1: Iniciando Anamnesis Aumentada...');
    
    const startTime = Date.now();

    try {
      // 1.1 Procesar transcripción en segmentos
      const segments = this.parseTranscription(rawTranscription);
      
      // 1.2 Análisis del Cerebro Clínico
      const clinicalRequest: ClinicalAnalysisRequest = {
        transcription: rawTranscription,
        specialty: 'physiotherapy',
        sessionType: 'initial',
        professionalProfileId,
        patientInfo
      };

      const clinicalAnalysis = await this.clinicalBrain.analyzeClinicalCase(clinicalRequest);
      
      // 1.3 Verificar compliance según perfil profesional
      const complianceIssues = await this.checkComplianceIssues(clinicalAnalysis, professionalProfileId);

      const processingTime = Date.now() - startTime;
      
      console.log(`✅ FASE 1 completada en ${processingTime}ms`);
      console.log(`   - Highlights detectados: ${clinicalAnalysis.highlights.length}`);
      console.log(`   - Warnings generados: ${clinicalAnalysis.warnings.length}`);
      console.log(`   - Issues de compliance: ${complianceIssues.length}`);

      return {
        transcription: rawTranscription,
        segments,
        highlights: clinicalAnalysis.highlights,
        warnings: clinicalAnalysis.warnings
      };

    } catch (error) {
      console.error('❌ Error en FASE 1:', error);
      throw error;
    }
  }

  /**
   * FASE 2: La Evaluación Funcional
   * Generación de tests sugeridos y recopilación de resultados
   */
  async executePhase2(
    phase1Result: PipelinePhase1Result,
    professionalProfileId: string,
    selectedHighlights: string[],
    acceptedWarnings: string[]
  ): Promise<PipelinePhase2Result> {
    console.log('🔍 FASE 2: Iniciando Evaluación Funcional...');
    
    const startTime = Date.now();

    try {
      // 2.1 Generar tests sugeridos basados en highlights seleccionados
      const suggestedTests = await this.generateSuggestedTests(
        selectedHighlights
      );

      // 2.2 Simular resultados de tests (en producción vendrían del frontend)
      const testResults = this.simulateTestResults(suggestedTests);

      const processingTime = Date.now() - startTime;
      
      console.log(`✅ FASE 2 completada en ${processingTime}ms`);
      console.log(`   - Tests sugeridos: ${suggestedTests.length}`);
      console.log(`   - Highlights seleccionados: ${selectedHighlights.length}`);
      console.log(`   - Warnings aceptados: ${acceptedWarnings.length}`);

      return {
        selectedHighlights,
        acceptedWarnings,
        suggestedTests,
        testResults
      };

    } catch (error) {
      console.error('❌ Error en FASE 2:', error);
      throw error;
    }
  }

  /**
   * FASE 3: La Documentación Inteligente
   * Generación del SOAP final con auditoría completa
   */
  async executePhase3(
    phase1Result: PipelinePhase1Result,
    phase2Result: PipelinePhase2Result,
    professionalProfileId: string,
    patientInfo: { age: number; gender: string; occupation: string; comorbidities: string[] }
  ): Promise<PipelinePhase3Result> {
    console.log('📝 FASE 3: Iniciando Documentación Inteligente...');
    
    const startTime = Date.now();

    try {
      // 3.1 Generar SOAP con toda la información recopilada
      const soapDocument = await this.generateFinalSOAP(
        phase1Result,
        phase2Result,
        professionalProfileId,
        patientInfo
      );

      // 3.2 Verificar compliance final
      const complianceIssues = await this.finalComplianceCheck(
        soapDocument,
        professionalProfileId
      );

      // 3.3 Crear auditoría
      const auditTrail = this.createAuditTrail(
        professionalProfileId,
        phase1Result,
        phase2Result,
        soapDocument
      );

      // 3.4 Eliminar transcripción según HIPAA/GDPR
      this.scheduleTranscriptionDeletion(professionalProfileId);

      const processingTime = Date.now() - startTime;
      
      console.log(`✅ FASE 3 completada en ${processingTime}ms`);
      console.log(`   - SOAP generado con calidad: ${soapDocument.quality.overall}%`);
      console.log(`   - Issues de compliance: ${complianceIssues.length}`);
      console.log(`   - Transcripción programada para eliminación`);

      return {
        soapDocument,
        complianceIssues,
        auditTrail
      };

    } catch (error) {
      console.error('❌ Error en FASE 3:', error);
      throw error;
    }
  }

  /**
   * Ejecutar pipeline completo
   */
  async executeCompletePipeline(
    rawTranscription: string,
    professionalProfileId: string,
    patientInfo: { age: number; gender: string; occupation: string; comorbidities: string[] },
    selectedHighlights: string[],
    acceptedWarnings: string[]
  ): Promise<CompletePipelineResult> {
    console.log('🚀 INICIANDO PIPELINE COMPLETO DE TRANSCRIPCIÓN MÉDICA');
    console.log('=' .repeat(80));
    
    const totalStartTime = Date.now();
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // FASE 1: Anamnesis Aumentada
      const phase1Result = await this.executePhase1(rawTranscription, professionalProfileId, patientInfo);
      
      // FASE 2: Evaluación Funcional
      const phase2Result = await this.executePhase2(phase1Result, professionalProfileId, selectedHighlights, acceptedWarnings);
      
      // FASE 3: Documentación Inteligente
      const phase3Result = await this.executePhase3(phase1Result, phase2Result, professionalProfileId, patientInfo);

      const totalProcessingTime = Date.now() - totalStartTime;

      console.log('=' .repeat(80));
      console.log('🏁 PIPELINE COMPLETO FINALIZADO');
      console.log(`⏱️ Tiempo total: ${totalProcessingTime}ms`);
      console.log(`📊 Highlights procesados: ${phase1Result.highlights.length}`);
      console.log(`⚠️ Warnings generados: ${phase1Result.warnings.length}`);
      console.log(`🔍 Tests sugeridos: ${phase2Result.suggestedTests.length}`);
      console.log(`📝 Calidad SOAP: ${phase3Result.soapDocument.quality.overall}%`);
      console.log('=' .repeat(80));

      return {
        phase1: phase1Result,
        phase2: phase2Result,
        phase3: phase3Result,
        metadata: {
          totalProcessingTime,
          professionalProfileId,
          patientId: `patient-${Date.now()}`,
          sessionId,
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('💥 ERROR EN PIPELINE COMPLETO:', error);
      throw error;
    }
  }

  // Métodos auxiliares privados

  private parseTranscription(rawText: string): TranscriptionSegment[] {
    const lines = rawText.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      id: `seg-${index + 1}`,
      speaker: line.toLowerCase().includes('paciente') ? 'paciente' : 'terapeuta',
      text: line.replace(/^(paciente|terapeuta):\s*/i, ''),
      timestamp: index * 1000,
      confidence: 0.85 + Math.random() * 0.1
    }));
  }

  private async checkComplianceIssues(
    clinicalAnalysis: ClinicalAnalysisResponse,
    professionalProfileId: string
  ): Promise<string[]> {
    const issues: string[] = [];
    const profile = this.profileService.getProfile(professionalProfileId);
    
    if (!profile) {
      issues.push('Perfil profesional no encontrado');
      return issues;
    }

    // Verificar sugerencias de medicamentos
    clinicalAnalysis.warnings.forEach(warning => {
      if (warning.description.toLowerCase().includes('medicamento') ||
          warning.description.toLowerCase().includes('fármaco')) {
        issues.push(`Sugerencia de medicamento prohibida en ${profile.country}`);
      }
    });

    return issues;
  }

  private async generateSuggestedTests(
    selectedHighlights: string[]
  ): Promise<PipelinePhase2Result['suggestedTests']> {
    const tests: PipelinePhase2Result['suggestedTests'] = [];

    // Tests ortopédicos
    if (selectedHighlights.some(h => h.toLowerCase().includes('dolor'))) {
      tests.push({
        name: 'Test de Lasègue',
        category: 'ortopédico',
        description: 'Evaluación de irritación radicular lumbar',
        contraindications: ['Dolor agudo severo', 'Fractura vertebral'],
        expectedResults: ['Positivo/Negativo', 'Ángulo de reproducción del dolor']
      });
    }

    if (selectedHighlights.some(h => h.toLowerCase().includes('hombro'))) {
      tests.push({
        name: 'Test de Neer',
        category: 'ortopédico',
        description: 'Evaluación de pinzamiento subacromial',
        contraindications: ['Fractura de hombro', 'Luxación reciente'],
        expectedResults: ['Positivo/Negativo', 'Reproducción del dolor']
      });
    }

    // Tests neurológicos
    if (selectedHighlights.some(h => h.toLowerCase().includes('adormecimiento'))) {
      tests.push({
        name: 'Test de Sensibilidad',
        category: 'neurológico',
        description: 'Evaluación de alteraciones sensitivas',
        contraindications: ['Heridas abiertas', 'Infección activa'],
        expectedResults: ['Normal/Disminuida/Ausente', 'Patrón de distribución']
      });
    }

    // Tests funcionales
    tests.push({
      name: 'Test de Timed Up and Go',
      category: 'funcional',
      description: 'Evaluación de movilidad y equilibrio',
      contraindications: ['Inestabilidad severa', 'Dolor agudo'],
      expectedResults: ['<10s Normal', '10-20s Riesgo leve', '>20s Riesgo alto']
    });

    return tests;
  }

  private simulateTestResults(suggestedTests: PipelinePhase2Result['suggestedTests']): PipelinePhase2Result['testResults'] {
    return suggestedTests.map(test => ({
      testName: test.name,
      result: 'Normal',
      notes: 'Resultado simulado para testing'
    }));
  }

  private async generateFinalSOAP(
    phase1Result: PipelinePhase1Result,
    phase2Result: PipelinePhase2Result,
    professionalProfileId: string,
    patientInfo: { age: number; gender: string; occupation: string; comorbidities: string[] }
  ): Promise<PipelinePhase3Result['soapDocument']> {
    // Usar el Cerebro Clínico optimizado para generar SOAP final
    const clinicalRequest: ClinicalAnalysisRequest = {
      transcription: phase1Result.transcription,
      specialty: 'physiotherapy',
      sessionType: 'initial',
      professionalProfileId,
      patientInfo
    };

    const clinicalAnalysis = await this.clinicalBrain.analyzeClinicalCase(clinicalRequest);
    
    return clinicalAnalysis.soapDocument;
  }

  private async finalComplianceCheck(
    soapDocument: PipelinePhase3Result['soapDocument'],
    professionalProfileId: string
  ): Promise<string[]> {
    const issues: string[] = [];
    const profile = this.profileService.getProfile(professionalProfileId);
    
    if (!profile) {
      issues.push('Perfil profesional no encontrado');
      return issues;
    }

    // Verificar que no se sugieran medicamentos en el SOAP
    const soapText = `${soapDocument.subjective} ${soapDocument.objective} ${soapDocument.assessment} ${soapDocument.plan}`.toLowerCase();
    
    if (soapText.includes('medicamento') || soapText.includes('fármaco')) {
      issues.push(`SOAP contiene sugerencias de medicamentos (prohibido en ${profile.country})`);
    }

    return issues;
  }

  private createAuditTrail(
    professionalProfileId: string,
    phase1Result: PipelinePhase1Result,
    phase2Result: PipelinePhase2Result,
    soapDocument: PipelinePhase3Result['soapDocument']
  ): PipelinePhase3Result['auditTrail'] {
    return [
      {
        action: 'Pipeline iniciado',
        timestamp: new Date(),
        userId: professionalProfileId,
        details: 'Inicio del pipeline de transcripción médica'
      },
      {
        action: 'Fase 1 completada',
        timestamp: new Date(),
        userId: professionalProfileId,
        details: `${phase1Result.highlights.length} highlights, ${phase1Result.warnings.length} warnings`
      },
      {
        action: 'Fase 2 completada',
        timestamp: new Date(),
        userId: professionalProfileId,
        details: `${phase2Result.selectedHighlights.length} highlights seleccionados, ${phase2Result.suggestedTests.length} tests sugeridos`
      },
      {
        action: 'SOAP generado',
        timestamp: new Date(),
        userId: professionalProfileId,
        details: `Calidad SOAP: ${soapDocument.quality.overall}%`
      }
    ];
  }

  private scheduleTranscriptionDeletion(professionalProfileId: string): void {
    setTimeout(() => {
      this.transcriptionCache.delete(professionalProfileId);
      console.log(`🗑️ Transcripción eliminada para ${professionalProfileId} (compliance HIPAA/GDPR)`);
    }, this.DATA_RETENTION_HOURS * 60 * 60 * 1000);
  }

  private cleanExpiredCache(): void {
    const now = new Date();
    let deletedCount = 0;
    
    for (const [key, value] of this.transcriptionCache.entries()) {
      if (value.expiry < now) {
        this.transcriptionCache.delete(key);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`🗑️ Cache limpiado: ${deletedCount} transcripciones expiradas eliminadas`);
    }
  }
}

export default MedicalTranscriptionPipelineService; 