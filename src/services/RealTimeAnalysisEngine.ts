/**
 * 🚨 RealTimeAnalysisEngine - Motor de Análisis en Tiempo Real
 * 
 * Sistema crítico para prevenir daño al paciente mediante análisis inmediato
 * de audio durante exploración física y técnicas manuales.
 * 
 * OBJETIVO: Detectar riesgos iatrogénicos y banderas rojas EN TIEMPO REAL
 * para prevenir daño al paciente durante consultas médicas.
 */

import { AudioChunkAnalysis, IatrogenicRisk, RedFlag } from '../types/medicalSafety';

export interface AudioData {
  id: string;
  timestamp: number;
  duration: number;
  audioBlob: Blob;
  transcription?: string;
}

export interface AudioChunk {
  id: string;
  timestamp: number;
  duration: number;
  audioData: AudioData;
  transcription: string;
}

/**
 * 🚨 Motor de Análisis en Tiempo Real
 * 
 * Procesa chunks de audio de 15 segundos para detectar riesgos iatrogénicos
 * y banderas rojas durante consultas médicas en tiempo real.
 */
export class RealTimeAnalysisEngine {
  private chunkSize: number = 15000; // 15 segundos
  private overlapSize: number = 2000; // 2 segundos overlap
  private analysisQueue: AudioChunk[] = [];
  private riskDetector: IatrogenicRiskDetector;
  private redFlagDetector: RedFlagDetector;
  private isProcessing: boolean = false;

  constructor() {
    this.riskDetector = new IatrogenicRiskDetector();
    this.redFlagDetector = new RedFlagDetector();
  }

  /**
   * Procesar chunk de audio para análisis inmediato
   */
  async processAudioChunk(audioData: AudioData): Promise<AudioChunkAnalysis> {
    try {
      console.log(`🚨 Procesando chunk de audio: ${audioData.id}`);

      // 1. Transcribir chunk si no está disponible
      let transcription = audioData.transcription;
      if (!transcription) {
        transcription = await this.transcribeChunk(audioData);
      }

      // 2. Análisis iatrogénico inmediato
      const risks = await this.riskDetector.detectRisks(transcription);
      
      // 3. Análisis de banderas rojas
      const redFlags = await this.redFlagDetector.detectRedFlags(transcription);
      
      // 4. Evaluación de urgencia
      const urgency = this.calculateUrgency(risks, redFlags);
      
      // 5. Calcular nivel de riesgo
      const riskLevel = this.calculateRiskLevel(risks, redFlags);
      
      // 6. Generar recomendaciones
      const recommendations = this.generateRecommendations(risks, redFlags);

      const analysis: AudioChunkAnalysis = {
        chunkId: audioData.id,
        timestamp: audioData.timestamp,
        duration: audioData.duration,
        transcription,
        riskLevel,
        iatrogenicRisks: risks,
        redFlags,
        recommendations,
        shouldAlert: urgency >= 3,
        urgencyLevel: urgency
      };

      console.log(`✅ Análisis completado - Urgencia: ${urgency}, Riesgos: ${risks.length}, Banderas Rojas: ${redFlags.length}`);

      return analysis;

    } catch (error) {
      console.error('❌ Error en análisis de chunk:', error);
      throw error;
    }
  }

  /**
   * Transcribir chunk de audio
   */
  private async transcribeChunk(audioData: AudioData): Promise<string> {
    // Simulación de transcripción - en producción usar Web Speech API o similar
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simular transcripción basada en el contexto médico
        const mockTranscriptions = [
          "El paciente refiere dolor intenso en la zona lumbar",
          "Observo limitación en la flexión lumbar",
          "La técnica de manipulación está siendo aplicada",
          "El paciente menciona parestesias en la pierna derecha",
          "Hay signos de inflamación local"
        ];
        resolve(mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)]);
      }, 100);
    });
  }

  /**
   * Calcular nivel de urgencia basado en riesgos y banderas rojas
   */
  private calculateUrgency(risks: IatrogenicRisk[], redFlags: RedFlag[]): 1 | 2 | 3 | 4 | 5 {
    let urgency = 1;

    // Riesgos iatrogénicos críticos
    const criticalRisks = risks.filter(r => r.severity === 'critical');
    if (criticalRisks.length > 0) {
      urgency = Math.max(urgency, 5); // STOP IMMEDIATELY
    }

    // Riesgos severos
    const severeRisks = risks.filter(r => r.severity === 'severe');
    if (severeRisks.length > 0) {
      urgency = Math.max(urgency, 4); // HIGH ALERT
    }

    // Banderas rojas urgentes
    const urgentRedFlags = redFlags.filter(r => r.urgency === 'immediate');
    if (urgentRedFlags.length > 0) {
      urgency = Math.max(urgency, 4);
    }

    // Riesgos moderados
    const moderateRisks = risks.filter(r => r.severity === 'moderate');
    if (moderateRisks.length > 0) {
      urgency = Math.max(urgency, 3); // CAUTION
    }

    // Banderas rojas de monitoreo
    const monitorRedFlags = redFlags.filter(r => r.urgency === 'urgent');
    if (monitorRedFlags.length > 0) {
      urgency = Math.max(urgency, 3);
    }

    return urgency as 1 | 2 | 3 | 4 | 5;
  }

  /**
   * Calcular nivel de riesgo general
   */
  private calculateRiskLevel(risks: IatrogenicRisk[], redFlags: RedFlag[]): 'safe' | 'caution' | 'warning' | 'danger' {
    const urgency = this.calculateUrgency(risks, redFlags);
    
    switch (urgency) {
      case 5:
        return 'danger';
      case 4:
        return 'warning';
      case 3:
        return 'caution';
      default:
        return 'safe';
    }
  }

  /**
   * Generar recomendaciones basadas en riesgos detectados
   */
  private generateRecommendations(risks: IatrogenicRisk[], redFlags: RedFlag[]): string[] {
    const recommendations: string[] = [];

    // Recomendaciones por riesgos iatrogénicos
    risks.forEach(risk => {
      switch (risk.type) {
        case 'contraindication':
          recommendations.push(`⛔ CONTRAINDICACIÓN: ${risk.recommendedAction}`);
          break;
        case 'technique_error':
          recommendations.push(`⚠️ ERROR TÉCNICO: ${risk.recommendedAction}`);
          break;
        case 'force_excessive':
          recommendations.push(`💪 FUERZA EXCESIVA: ${risk.recommendedAction}`);
          break;
        case 'anatomic_risk':
          recommendations.push(`🔍 RIESGO ANATÓMICO: ${risk.recommendedAction}`);
          break;
      }
    });

    // Recomendaciones por banderas rojas
    redFlags.forEach(flag => {
      if (flag.referralNeeded) {
        recommendations.push(`🚨 REFERENCIA URGENTE: ${flag.recommendedAction}`);
      } else {
        recommendations.push(`⚠️ MONITOREAR: ${flag.recommendedAction}`);
      }
    });

    return recommendations;
  }

  /**
   * Agregar chunk a la cola de análisis
   */
  addChunkToQueue(chunk: AudioChunk): void {
    this.analysisQueue.push(chunk);
    this.processQueue();
  }

  /**
   * Procesar cola de análisis
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.analysisQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.analysisQueue.length > 0) {
        const chunk = this.analysisQueue.shift();
        if (chunk) {
          const audioData: AudioData = {
            id: chunk.id,
            timestamp: chunk.timestamp,
            duration: chunk.duration,
            audioBlob: chunk.audioData.audioBlob,
            transcription: chunk.transcription
          };

          const analysis = await this.processAudioChunk(audioData);
          
          // Emitir evento de análisis completado
          this.emitAnalysisComplete(analysis);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Emitir evento de análisis completado
   */
  private emitAnalysisComplete(analysis: AudioChunkAnalysis): void {
    // En producción, usar un sistema de eventos
    console.log('📊 Análisis completado:', analysis);
    
    // Trigger callback si está disponible
    if (this.onAnalysisComplete) {
      this.onAnalysisComplete(analysis);
    }
  }

  // Callback para análisis completado
  onAnalysisComplete?: (analysis: AudioChunkAnalysis) => void;
}

/**
 * 🚨 Detector de Riesgos Iatrogénicos
 * 
 * Analiza transcripciones para detectar riesgos durante técnicas manuales
 */
export class IatrogenicRiskDetector {
  private riskPatterns = {
    // Contraindicaciones absolutas
    contraindicationsAbsolute: [
      /infección.*local.*activa/i,
      /fractura.*no.*consolidada/i,
      /tumor.*maligno.*zona/i,
      /trombosis.*venosa.*profunda/i,
      /embarazo.*primer.*trimestre/i,
      /osteoporosis.*severa/i,
      /metástasis.*ósea/i
    ],
    
    // Técnicas peligrosas
    dangerousTechniques: [
      /manipulación.*cervical.*alta.*velocidad/i,
      /thrust.*c1.*c2/i,
      /rotación.*forzada.*cuello/i,
      /tracción.*axial.*fuerte/i,
      /manipulación.*lumbar.*sin.*evaluación/i,
      /técnica.*contraindicada/i
    ],
    
    // Signos de alarma durante técnica
    techniqueDanger: [
      /parestesia.*nuevas/i,
      /debilidad.*súbita/i,
      /dolor.*irradiado.*nuevo/i,
      /mareo.*durante.*técnica/i,
      /nausea.*manipulación/i,
      /dolor.*intenso.*durante/i,
      /pérdida.*conciencia/i
    ],
    
    // Fuerza excesiva
    excessiveForce: [
      /duele.*mucho.*pare/i,
      /no.*puedo.*aguantar/i,
      /demasiado.*fuerte/i,
      /dolor.*insoportable/i,
      /fuerza.*excesiva/i,
      /resistencia.*excesiva/i
    ]
  };
  
  async detectRisks(transcription: string): Promise<IatrogenicRisk[]> {
    const risks: IatrogenicRisk[] = [];
    
    // Analizar cada patrón de riesgo
    Object.entries(this.riskPatterns).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        const match = transcription.match(pattern);
        if (match) {
          risks.push({
            type: this.mapCategoryToType(category),
            description: this.getRiskDescription(category, match[0]),
            severity: this.calculateSeverity(category, match[0]),
            bodyRegion: this.extractBodyRegion(transcription),
            recommendedAction: this.getRecommendedAction(category),
            evidence: match[0]
          });
        }
      });
    });
    
    return risks;
  }

  private mapCategoryToType(category: string): IatrogenicRisk['type'] {
    switch (category) {
      case 'contraindicationsAbsolute':
        return 'contraindication';
      case 'dangerousTechniques':
        return 'technique_error';
      case 'techniqueDanger':
        return 'anatomic_risk';
      case 'excessiveForce':
        return 'force_excessive';
      default:
        return 'anatomic_risk';
    }
  }

  private getRiskDescription(category: string, evidence: string): string {
    switch (category) {
      case 'contraindicationsAbsolute':
        return `Contraindicación absoluta detectada: ${evidence}`;
      case 'dangerousTechniques':
        return `Técnica peligrosa identificada: ${evidence}`;
      case 'techniqueDanger':
        return `Signo de alarma durante técnica: ${evidence}`;
      case 'excessiveForce':
        return `Fuerza excesiva aplicada: ${evidence}`;
      default:
        return `Riesgo detectado: ${evidence}`;
    }
  }

  private calculateSeverity(category: string, evidence: string): IatrogenicRisk['severity'] {
    switch (category) {
      case 'contraindicationsAbsolute':
        return 'critical';
      case 'dangerousTechniques':
        return 'severe';
      case 'techniqueDanger':
        return 'moderate';
      case 'excessiveForce':
        return 'mild';
      default:
        return 'moderate';
    }
  }

  private extractBodyRegion(transcription: string): string {
    const bodyRegions = [
      'cervical', 'lumbar', 'torácica', 'hombro', 'rodilla', 'cadera',
      'codo', 'muñeca', 'tobillo', 'columna', 'extremidad'
    ];

    for (const region of bodyRegions) {
      if (transcription.toLowerCase().includes(region)) {
        return region;
      }
    }

    return 'región no especificada';
  }

  private getRecommendedAction(category: string): string {
    switch (category) {
      case 'contraindicationsAbsolute':
        return 'DETENER TÉCNICA INMEDIATAMENTE y reevaluar contraindicaciones';
      case 'dangerousTechniques':
        return 'Suspender técnica y aplicar método alternativo más seguro';
      case 'techniqueDanger':
        return 'Detener técnica y evaluar signos neurológicos';
      case 'excessiveForce':
        return 'Reducir intensidad de la técnica';
      default:
        return 'Revisar técnica y ajustar según respuesta del paciente';
    }
  }
}

/**
 * 🚨 Detector de Banderas Rojas
 * 
 * Identifica señales de alarma que requieren atención inmediata
 */
export class RedFlagDetector {
  private redFlagPatterns = {
    // Neurológicas
    neurological: [
      /parestesia.*nueva/i,
      /debilidad.*súbita/i,
      /pérdida.*fuerza/i,
      /alteración.*sensibilidad/i,
      /dolor.*irradiado.*nuevo/i,
      /dolor.*nocturno/i,
      /dolor.*que.*despierta/i
    ],
    
    // Vasculares
    vascular: [
      /edema.*súbito/i,
      /cambio.*color.*extremidad/i,
      /pulso.*débil/i,
      /frialdad.*extremidad/i,
      /dolor.*isquémico/i
    ],
    
    // Infección
    infection: [
      /fiebre.*elevada/i,
      /signos.*infección/i,
      /drenaje.*purulento/i,
      /calor.*local/i,
      /enrojecimiento.*intenso/i
    ],
    
    // Fractura
    fracture: [
      /dolor.*intenso.*trauma/i,
      /deformidad.*visible/i,
      /crepitación/i,
      /movilidad.*anormal/i,
      /dolor.*punto.*específico/i
    ],
    
    // Sistémicas
    systemic: [
      /pérdida.*peso.*inexplicada/i,
      /fiebre.*persistente/i,
      /sudoración.*nocturna/i,
      /fatiga.*extrema/i,
      /dolor.*nocturno/i
    ]
  };

  async detectRedFlags(transcription: string): Promise<RedFlag[]> {
    const redFlags: RedFlag[] = [];

    Object.entries(this.redFlagPatterns).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        const match = transcription.match(pattern);
        if (match) {
          redFlags.push({
            category: category as RedFlag['category'],
            indicator: this.getIndicatorDescription(category, match[0]),
            urgency: this.calculateUrgency(category),
            recommendedAction: this.getRecommendedAction(category),
            referralNeeded: this.needsReferral(category)
          });
        }
      });
    });

    return redFlags;
  }

  private getIndicatorDescription(category: string, evidence: string): string {
    switch (category) {
      case 'neurological':
        return `Signo neurológico: ${evidence}`;
      case 'vascular':
        return `Signo vascular: ${evidence}`;
      case 'infection':
        return `Signo de infección: ${evidence}`;
      case 'fracture':
        return `Signo de fractura: ${evidence}`;
      case 'systemic':
        return `Signo sistémico: ${evidence}`;
      default:
        return `Bandera roja: ${evidence}`;
    }
  }

  private calculateUrgency(category: string): RedFlag['urgency'] {
    switch (category) {
      case 'neurological':
      case 'vascular':
        return 'immediate';
      case 'infection':
      case 'fracture':
        return 'urgent';
      case 'systemic':
        return 'monitor';
      default:
        return 'urgent';
    }
  }

  private getRecommendedAction(category: string): string {
    switch (category) {
      case 'neurological':
        return 'Evaluación neurológica inmediata';
      case 'vascular':
        return 'Evaluación vascular urgente';
      case 'infection':
        return 'Evaluación médica para infección';
      case 'fracture':
        return 'Radiografía y evaluación ortopédica';
      case 'systemic':
        return 'Evaluación médica general';
      default:
        return 'Evaluación médica';
    }
  }

  private needsReferral(category: string): boolean {
    return ['neurological', 'vascular', 'infection', 'fracture'].includes(category);
  }
} 