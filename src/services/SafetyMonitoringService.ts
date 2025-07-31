/**
 * 🚨 SAFETY MONITORING SERVICE - AIDUXCARE V2
 * 
 * Servicio principal para el monitoreo de seguridad en tiempo real
 * durante consultas médicas y técnicas manuales.
 * 
 * Se integra con tu arquitectura existente y usa tus tipos clinical.ts
 */

import { 
  SafetyClinicalAnalysis, 
  SafetyWarning, 
  SafetyHighlight, 
  SafetyAlert,
  SafetyConfig,
  SafetySystemState 
} from '@/types/clinical';

export class SafetyMonitoringService {
  private isActive: boolean = false;
  private config: SafetyConfig;
  private analysisCount: number = 0;
  private startTime: number = 0;

  // Patrones de detección de riesgos iatrogénicos
  private riskPatterns = {
    // Riesgos críticos (urgencia 5) - DETENER INMEDIATAMENTE
    critical: [
      /thrust.*c1.*c2/i,
      /rotación.*forzada.*cuello/i,
      /manipulación.*cervical.*alta.*velocidad/i,
      /dolor.*insoportable/i,
      /pérdida.*conciencia/i,
      /no.*puedo.*continuar/i
    ],
    
    // Riesgos altos (urgencia 4) - ALERTA CRÍTICA
    high: [
      /dolor.*irradiado.*nuevo/i,
      /parestesia.*nueva/i,
      /debilidad.*súbita/i,
      /mareo.*durante.*técnica/i,
      /nausea.*manipulación/i,
      /duele.*mucho.*pare/i
    ],
    
    // Riesgos medios (urgencia 3) - PRECAUCIÓN
    medium: [
      /manipulación.*cervical/i,
      /fuerza.*excesiva/i,
      /técnica.*peligrosa/i,
      /inflamación.*local/i,
      /resistencia.*excesiva/i
    ],
    
    // Riesgos bajos (urgencia 2) - MONITOREAR
    low: [
      /molestia/i,
      /tensión/i,
      /incomodidad/i,
      /presión.*zona/i
    ]
  };

  // Patrones de banderas rojas
  private redFlagPatterns = {
    neurological: [
      /parestesia.*nueva/i,
      /debilidad.*súbita/i,
      /pérdida.*fuerza/i,
      /alteración.*sensibilidad/i,
      /dolor.*nocturno/i
    ],
    vascular: [
      /edema.*súbito/i,
      /cambio.*color.*extremidad/i,
      /pulso.*débil/i,
      /frialdad.*extremidad/i
    ],
    infection: [
      /fiebre.*elevada/i,
      /signos.*infección/i,
      /calor.*local/i,
      /enrojecimiento.*intenso/i
    ],
    fracture: [
      /dolor.*intenso.*trauma/i,
      /deformidad.*visible/i,
      /crepitación/i,
      /movilidad.*anormal/i
    ],
    systemic: [
      /pérdida.*peso.*inexplicada/i,
      /fiebre.*persistente/i,
      /sudoración.*nocturna/i,
      /fatiga.*extrema/i
    ]
  };

  constructor(config: Partial<SafetyConfig> = {}) {
    this.config = {
      enabled: true,
      chunkSizeMs: 15000, // 15 segundos
      overlapMs: 2000, // 2 segundos
      alertThreshold: 3,
      autoStopThreshold: 5,
      enableAudioAlerts: true,
      enableVisualAlerts: true,
      enableVibration: true,
      logAllAnalyses: true,
      ...config
    };
  }

  /**
   * Inicializar el servicio de monitoreo
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🚨 Inicializando SafetyMonitoringService...');
      
      // Verificar soporte del navegador
      if (!this.checkBrowserSupport()) {
        throw new Error('Navegador no soportado para el sistema de seguridad');
      }

      this.startTime = Date.now();
      console.log('✅ SafetyMonitoringService inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando SafetyMonitoringService:', error);
      return false;
    }
  }

  /**
   * Activar el monitoreo de seguridad
   */
  start(): void {
    if (!this.config.enabled) {
      console.warn('⚠️ Sistema de seguridad deshabilitado en configuración');
      return;
    }

    this.isActive = true;
    this.startTime = Date.now();
    console.log('🚨 Sistema de monitoreo de seguridad ACTIVADO');
  }

  /**
   * Desactivar el monitoreo de seguridad
   */
  stop(): void {
    this.isActive = false;
    console.log('⏹️ Sistema de monitoreo de seguridad DESACTIVADO');
  }

  /**
   * Analizar transcripción de audio en busca de riesgos
   */
  async analyzeTranscription(
    transcription: string,
    chunkId?: string,
    timestamp?: number
  ): Promise<SafetyClinicalAnalysis> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Analizando transcripción: "${transcription}"`);

      // 1. Detectar warnings de seguridad (riesgos iatrogénicos)
      const safetyWarnings = this.detectSafetyWarnings(transcription);
      
      // 2. Detectar highlights de seguridad (banderas rojas)
      const safetyHighlights = this.detectSafetyHighlights(transcription);
      
      // 3. Calcular nivel de riesgo general
      const riskLevel = this.calculateRiskLevel(safetyWarnings, safetyHighlights);
      
      // 4. Calcular urgencia máxima
      const urgencyLevel = this.calculateUrgencyLevel(safetyWarnings, safetyHighlights);
      
      // 5. Determinar si debe alertar
      const shouldAlert = urgencyLevel >= this.config.alertThreshold;
      
      // 6. Generar recomendaciones
      const recommendations = this.generateRecommendations(safetyWarnings, safetyHighlights);

      const analysis: SafetyClinicalAnalysis = {
        success: true,
        metadata: {
          processingTimeMs: Date.now() - startTime,
          modelVersion: 'safety-v1.0',
          confidence: this.calculateConfidence(safetyWarnings, safetyHighlights)
        },
        warnings: safetyWarnings, // Usa tu tipo Warning existente
        highlights: safetyHighlights, // Usa tu tipo Highlight existente
        safetyWarnings,
        safetyHighlights,
        riskLevel,
        shouldAlert,
        urgencyLevel,
        audioChunkId: chunkId,
        transcription,
        chunkDuration: this.config.chunkSizeMs,
        recommendations
      };

      this.analysisCount++;
      
      if (this.config.logAllAnalyses) {
        console.log(`📊 Análisis completado:`, {
          riskLevel,
          urgencyLevel,
          shouldAlert,
          warnings: safetyWarnings.length,
          highlights: safetyHighlights.length
        });
      }

      return analysis;

    } catch (error) {
      console.error('❌ Error en análisis de transcripción:', error);
      
      return {
        success: false,
        metadata: {
          processingTimeMs: Date.now() - startTime,
          modelVersion: 'safety-v1.0'
        },
        riskLevel: 'safe',
        shouldAlert: false,
        urgencyLevel: 1,
        transcription,
        recommendations: ['Error en análisis - continuar con precaución']
      };
    }
  }

  /**
   * Detectar warnings de seguridad (riesgos iatrogénicos)
   */
  private detectSafetyWarnings(transcription: string): SafetyWarning[] {
    const warnings: SafetyWarning[] = [];

    Object.entries(this.riskPatterns).forEach(([severityKey, patterns]) => {
      patterns.forEach(pattern => {
        const match = transcription.match(pattern);
        if (match) {
          const severity = this.mapSeverityKeyToWarningLevel(severityKey);
          const urgency = this.mapSeverityKeyToUrgency(severityKey);
          
          warnings.push({
            severity,
            title: `Riesgo ${severityKey} detectado`,
            description: this.getWarningDescription(severityKey, match[0]),
            recommendation: this.getWarningRecommendation(severityKey),
            urgencyLevel: urgency,
            bodyRegion: this.extractBodyRegion(transcription),
            evidence: match[0],
            iatrogenicType: this.mapSeverityToIatrogenicType(severityKey),
            actionRequired: this.mapUrgencyToAction(urgency),
            timestamp: Date.now()
          });
        }
      });
    });

    return warnings;
  }

  /**
   * Detectar highlights de seguridad (banderas rojas)
   */
  private detectSafetyHighlights(transcription: string): SafetyHighlight[] {
    const highlights: SafetyHighlight[] = [];

    Object.entries(this.redFlagPatterns).forEach(([categoryKey, patterns]) => {
      patterns.forEach(pattern => {
        const match = transcription.match(pattern);
        if (match) {
          highlights.push({
            priority: this.mapCategoryToPriority(categoryKey),
            title: `Bandera roja ${categoryKey}`,
            description: this.getHighlightDescription(categoryKey, match[0]),
            category: categoryKey as SafetyHighlight['category'],
            urgency: this.mapCategoryToUrgency(categoryKey),
            referralNeeded: this.needsReferral(categoryKey),
            evidence: match[0],
            timestamp: Date.now()
          });
        }
      });
    });

    return highlights;
  }

  /**
   * Calcular nivel de riesgo general
   */
  private calculateRiskLevel(
    warnings: SafetyWarning[], 
    highlights: SafetyHighlight[]
  ): 'safe' | 'caution' | 'warning' | 'danger' {
    const maxUrgency = this.calculateUrgencyLevel(warnings, highlights);
    
    if (maxUrgency >= 5) return 'danger';
    if (maxUrgency >= 4) return 'warning';
    if (maxUrgency >= 3) return 'caution';
    return 'safe';
  }

  /**
   * Calcular nivel de urgencia máximo
   */
  private calculateUrgencyLevel(
    warnings: SafetyWarning[], 
    highlights: SafetyHighlight[]
  ): 1 | 2 | 3 | 4 | 5 {
    let maxUrgency = 1;

    warnings.forEach(warning => {
      maxUrgency = Math.max(maxUrgency, warning.urgencyLevel);
    });

    highlights.forEach(highlight => {
      const urgency = highlight.urgency === 'immediate' ? 5 : 
                     highlight.urgency === 'urgent' ? 4 : 3;
      maxUrgency = Math.max(maxUrgency, urgency);
    });

    return maxUrgency as 1 | 2 | 3 | 4 | 5;
  }

  /**
   * Generar recomendaciones basadas en análisis
   */
  private generateRecommendations(
    warnings: SafetyWarning[], 
    highlights: SafetyHighlight[]
  ): string[] {
    const recommendations: string[] = [];

    // Recomendaciones por warnings
    warnings.forEach(warning => {
      if (warning.recommendation) {
        recommendations.push(warning.recommendation);
      }
    });

    // Recomendaciones por highlights
    highlights.forEach(highlight => {
      if (highlight.referralNeeded) {
        recommendations.push(`Considerar derivación por ${highlight.category}`);
      }
    });

    // Recomendación general si no hay específicas
    if (recommendations.length === 0) {
      recommendations.push('Continuar con técnica actual');
      recommendations.push('Monitorear respuesta del paciente');
    }

    return [...new Set(recommendations)]; // Eliminar duplicados
  }

  /**
   * Obtener estado actual del sistema
   */
  getSystemState(): SafetySystemState {
    return {
      isActive: this.isActive,
      isProcessing: false, // Se actualiza externamente
      currentRiskLevel: 'safe', // Se actualiza externamente
      activeAlerts: [], // Se maneja externamente
      analysisCount: this.analysisCount,
      errors: []
    };
  }

  /**
   * Obtener estadísticas del sistema
   */
  getStatistics(): { 
    totalAnalyses: number; 
    systemUptimeMs: number;
    isActive: boolean;
  } {
    return {
      totalAnalyses: this.analysisCount,
      systemUptimeMs: this.startTime > 0 ? Date.now() - this.startTime : 0,
      isActive: this.isActive
    };
  }

  // ========== MÉTODOS PRIVADOS DE UTILIDAD ==========

  private checkBrowserSupport(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.AudioContext &&
      window.MediaRecorder
    );
  }

  private mapSeverityKeyToWarningLevel(key: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (key === 'critical' || key === 'high') return 'HIGH';
    if (key === 'medium') return 'MEDIUM';
    return 'LOW';
  }

  private mapSeverityKeyToUrgency(key: string): 1 | 2 | 3 | 4 | 5 {
    switch (key) {
      case 'critical': return 5;
      case 'high': return 4;
      case 'medium': return 3;
      case 'low': return 2;
      default: return 1;
    }
  }

  private mapSeverityToIatrogenicType(key: string): SafetyWarning['iatrogenicType'] {
    if (key === 'critical') return 'contraindication';
    if (key === 'high') return 'technique_error';
    if (key === 'medium') return 'force_excessive';
    return 'anatomic_risk';
  }

  private mapUrgencyToAction(urgency: number): SafetyWarning['actionRequired'] {
    if (urgency >= 5) return 'STOP_IMMEDIATELY';
    if (urgency >= 4) return 'CAUTION';
    if (urgency >= 3) return 'MONITOR';
    return 'INFORM';
  }

  private mapCategoryToPriority(category: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (['neurological', 'vascular'].includes(category)) return 'HIGH';
    if (['infection', 'fracture'].includes(category)) return 'MEDIUM';
    return 'LOW';
  }

  private mapCategoryToUrgency(category: string): 'immediate' | 'urgent' | 'monitor' {
    if (['neurological', 'vascular'].includes(category)) return 'immediate';
    if (['infection', 'fracture'].includes(category)) return 'urgent';
    return 'monitor';
  }

  private needsReferral(category: string): boolean {
    return ['neurological', 'vascular', 'infection', 'fracture'].includes(category);
  }

  private extractBodyRegion(transcription: string): string {
    const regions = [
      { pattern: /cervical|cuello/i, region: 'Cervical' },
      { pattern: /lumbar|espalda.*baja/i, region: 'Lumbar' },
      { pattern: /dorsal|espalda.*media/i, region: 'Dorsal' },
      { pattern: /hombro/i, region: 'Hombro' },
      { pattern: /rodilla/i, region: 'Rodilla' }
    ];

    for (const { pattern, region } of regions) {
      if (pattern.test(transcription)) return region;
    }
    
    return 'No especificado';
  }

  private getWarningDescription(severity: string, evidence: string): string {
    switch (severity) {
      case 'critical': return `Riesgo crítico detectado: ${evidence}`;
      case 'high': return `Riesgo alto identificado: ${evidence}`;
      case 'medium': return `Precaución requerida: ${evidence}`;
      default: return `Monitorear: ${evidence}`;
    }
  }

  private getWarningRecommendation(severity: string): string {
    switch (severity) {
      case 'critical': return 'DETENER TÉCNICA INMEDIATAMENTE';
      case 'high': return 'Suspender técnica y evaluar situación';
      case 'medium': return 'Reducir intensidad y monitorear';
      default: return 'Continuar con precaución';
    }
  }

  private getHighlightDescription(category: string, evidence: string): string {
    return `Bandera roja ${category}: ${evidence}`;
  }

  private calculateConfidence(warnings: SafetyWarning[], highlights: SafetyHighlight[]): number {
    // Confianza basada en número de matches y claridad de patterns
    const totalFindings = warnings.length + highlights.length;
    if (totalFindings === 0) return 0.9; // Alta confianza en "seguro"
    if (totalFindings >= 3) return 0.95; // Muy alta confianza con múltiples findings
    return 0.85; // Confianza estándar
  }
} 