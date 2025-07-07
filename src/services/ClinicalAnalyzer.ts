/**
 * 🧠 ClinicalAnalyzer - Mini Cerebro Clínico Local
 * Reemplaza Cloud Function inestable con análisis 100% local
 */

export interface ClinicalWarning {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  confidence: number;
  category: 'symptom' | 'red_flag' | 'emergency' | 'follow_up';
  action?: string;
}

export interface ClinicalSuggestion {
  id: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  description: string;
  rationale: string;
  category: 'diagnostic' | 'treatment' | 'monitoring' | 'referral';
}

export interface SOAPAnalysis {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  confidence: number;
  warnings: string[];
}

export interface ClinicalAnalysis {
  warnings: ClinicalWarning[];
  suggestions: ClinicalSuggestion[];
  soapAnalysis: SOAPAnalysis;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  processingTimeMs: number;
  success: boolean;
  modelUsed: string;
}

export class ClinicalAnalyzer {
  private startTime: number = 0;

  /**
   * Análisis principal de transcripción médica
   */
  async analyzeTranscription(
    transcription: string,
    specialty: string = 'general',
    sessionType: string = 'initial'
  ): Promise<ClinicalAnalysis> {
    this.startTime = Date.now();

    try {
      console.log('🧠 INICIANDO ANÁLISIS CLÍNICO LOCAL:', {
        transcriptionLength: transcription.length,
        specialty,
        sessionType
      });

      // 1. Análisis de criticidad y advertencias
      const warnings = this.detectCriticalPatterns(transcription, specialty);
      
      // 2. Generación de sugerencias clínicas
      const suggestions = this.generateClinicalSuggestions(transcription, warnings, specialty);
      
      // 3. Clasificación SOAP automática
      const soapAnalysis = this.classifyToSOAP(transcription, specialty);
      
      // 4. Cálculo de nivel de riesgo general
      const riskLevel = this.calculateRiskLevel(warnings);

      const processingTimeMs = Date.now() - this.startTime;

      const analysis: ClinicalAnalysis = {
        warnings,
        suggestions,
        soapAnalysis,
        riskLevel,
        processingTimeMs,
        success: true,
        modelUsed: 'clinical-analyzer-local-v1.0'
      };

      console.log('✅ ANÁLISIS COMPLETADO:', {
        warningsCount: warnings.length,
        suggestionsCount: suggestions.length,
        riskLevel,
        processingTimeMs
      });

      return analysis;

    } catch (error) {
      console.error('❌ Error en análisis clínico local:', error);
      
      return {
        warnings: [],
        suggestions: [],
        soapAnalysis: {
          subjective: transcription.substring(0, 200) + '...',
          objective: 'Examen físico documentado.',
          assessment: 'Evaluación pendiente de completar.',
          plan: 'Continuar evaluación y seguimiento.',
          confidence: 30,
          warnings: ['Análisis automático limitado por error técnico']
        },
        riskLevel: 'MEDIUM',
        processingTimeMs: Date.now() - this.startTime,
        success: false,
        modelUsed: 'clinical-analyzer-local-v1.0-fallback'
      };
    }
  }

  /**
   * Detección de patrones críticos y generación de advertencias
   */
  private detectCriticalPatterns(transcription: string, specialty: string): ClinicalWarning[] {
    const warnings: ClinicalWarning[] = [];
    const text = transcription.toLowerCase();

    // PATRONES CRÍTICOS UNIVERSALES
         const criticalPatterns = [
       {
         pattern: /dolor.*pecho.*brazo|dolor.*torácico.*irrad|opresión.*pecho|dolor.*opresivo.*pecho|sudoración.*profusa|dolor.*brazo.*mandíbula/i,
         severity: 'CRITICAL' as const,
         title: 'Sospecha de Síndrome Coronario Agudo',
         description: 'Combinación de dolor torácico con irradiación sugiere posible evento coronario agudo',
         category: 'emergency' as const,
         action: 'Derivación inmediata a urgencias - ECG de 12 derivaciones',
         confidence: 92
       },
      {
        pattern: /dolor.*cabeza.*súbito|cefalea.*intensa.*repentina|peor.*dolor.*vida/i,
        severity: 'CRITICAL' as const,
        title: 'Cefalea de Inicio Súbito',
        description: 'Cefalea súbita intensa puede indicar hemorragia subaracnoidea',
        category: 'emergency' as const,
        action: 'Evaluación neurológica urgente - TC cerebral sin contraste',
        confidence: 88
      },
      {
        pattern: /dificultad.*respirar|disnea.*severa|no.*puedo.*respirar/i,
        severity: 'HIGH' as const,
        title: 'Dificultad Respiratoria Significativa',
        description: 'Disnea severa requiere evaluación inmediata de vía aérea y función pulmonar',
        category: 'red_flag' as const,
        action: 'Monitoreo saturación O2 - Evaluación vía aérea',
        confidence: 85
      },
      {
        pattern: /dolor.*abdominal.*intenso|abdomen.*rígido|defensa.*abdominal/i,
        severity: 'HIGH' as const,
        title: 'Dolor Abdominal Agudo',
        description: 'Dolor abdominal severo con signos de irritación peritoneal',
        category: 'red_flag' as const,
        action: 'Evaluación quirúrgica - Exámenes complementarios',
        confidence: 80
      }
    ];

    // PATRONES ESPECÍFICOS POR ESPECIALIDAD
    if (specialty === 'cardiology') {
      criticalPatterns.push({
        pattern: /palpitaciones.*mareos|taquicardia.*síncope|arritmia/i,
        severity: 'HIGH' as const,
        title: 'Síntomas Cardiovasculares Complejos',
        description: 'Combinación de síntomas sugiere posible arritmia significativa',
        category: 'red_flag' as const,
        action: 'Monitoreo ECG continuo - Holter 24h',
        confidence: 78
      });
    }

    if (specialty === 'physiotherapy') {
      criticalPatterns.push(       {
         pattern: /pérdida.*fuerza|perdido.*fuerza|entumecimiento|hormigueo|debilidad.*súbita|parestesia/i,
         severity: 'HIGH' as const,
         title: 'Signos Neurológicos de Alarma',
         description: 'Pérdida de fuerza o sensibilidad puede indicar compromiso neurológico',
         category: 'red_flag' as const,
         action: 'Evaluación neurológica - Derivación a especialista',
         confidence: 82
       });
    }

    // Análisis de patrones
    criticalPatterns.forEach((pattern, index) => {
      if (pattern.pattern.test(transcription)) {
        warnings.push({
          id: `warning_${index}_${Date.now()}`,
          severity: pattern.severity,
          title: pattern.title,
          description: pattern.description,
          confidence: pattern.confidence,
          category: pattern.category,
          action: pattern.action
        });
      }
    });

    return warnings;
  }

  /**
   * Generación de sugerencias clínicas contextuales
   */
  private generateClinicalSuggestions(
    transcription: string, 
    warnings: ClinicalWarning[], 
    specialty: string
  ): ClinicalSuggestion[] {
    const suggestions: ClinicalSuggestion[] = [];
    const text = transcription.toLowerCase();

    // SUGERENCIAS BASADAS EN ADVERTENCIAS
    warnings.forEach((warning, index) => {
      if (warning.severity === 'CRITICAL' && warning.category === 'emergency') {
        suggestions.push({
          id: `suggestion_emergency_${index}`,
          priority: 'HIGH',
          title: 'Monitoreo de Signos Vitales',
          description: 'Vigilar presión arterial, frecuencia cardíaca y saturación de oxígeno',
          rationale: 'Emergencia detectada requiere monitoreo continuo',
          category: 'monitoring'
        });
      }
    });

    // SUGERENCIAS ESPECÍFICAS POR CONTENIDO
    if (/dolor.*crónico|dolor.*persistente|meses.*dolor/i.test(transcription)) {
      suggestions.push({
        id: `suggestion_chronic_pain_${Date.now()}`,
        priority: 'MEDIUM',
        title: 'Evaluación Multidisciplinaria del Dolor',
        description: 'Considerar enfoque integral para manejo de dolor crónico',
        rationale: 'Dolor crónico se beneficia de abordaje multidisciplinario',
        category: 'treatment'
      });
    }

    if (/estrés|ansiedad|nervios|preocup/i.test(transcription)) {
      suggestions.push({
        id: `suggestion_psychosocial_${Date.now()}`,
        priority: 'MEDIUM',
        title: 'Evaluación Psicosocial',
        description: 'Considerar impacto de factores psicológicos en la condición',
        rationale: 'Factores psicosociales pueden influir en la evolución clínica',
        category: 'diagnostic'
      });
    }

    // SUGERENCIAS POR ESPECIALIDAD
    if (specialty === 'physiotherapy') {
      suggestions.push({
        id: `suggestion_functional_assessment_${Date.now()}`,
        priority: 'HIGH',
        title: 'Evaluación Funcional Completa',
        description: 'Realizar análisis biomecánico y evaluación de rango de movimiento',
        rationale: 'Evaluación funcional es esencial en fisioterapia',
        category: 'diagnostic'
      });
    }

    // SUGERENCIA UNIVERSAL DE DOCUMENTACIÓN
    suggestions.push({
      id: `suggestion_documentation_${Date.now()}`,
      priority: 'MEDIUM',
      title: 'Documentar Evolución Temporal',
      description: 'Registrar tiempo de inicio, duración y características evolutivas',
      rationale: 'Documentación temporal ayuda al diagnóstico diferencial',
      category: 'diagnostic'
    });

    return suggestions;
  }

  /**
   * Clasificación automática a formato SOAP
   */
  private classifyToSOAP(transcription: string, specialty: string): SOAPAnalysis {
    const sentences = transcription.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let subjective = '';
    let objective = '';
    let assessment = '';
    let plan = '';
    const warnings: string[] = [];

    // Clasificación por patrones linguísticos
    sentences.forEach(sentence => {
      const s = sentence.trim().toLowerCase();
      
      // SUBJECTIVE: Lo que dice el paciente
      if (/siento|duele|tengo|me molesta|siento que|noto que/i.test(sentence)) {
        subjective += sentence.trim() + '. ';
      }
      
      // OBJECTIVE: Observaciones y exámenes
      else if (/observo|palpo|examen|exploración|inspección|se observa/i.test(sentence)) {
        objective += sentence.trim() + '. ';
      }
      
      // ASSESSMENT/PLAN: Evaluación y planes del terapeuta
      else if (/recomiendo|sugiero|plan|tratamiento|diagnóstico|impresión/i.test(sentence)) {
        if (/diagnóstico|impresión|evaluación|considero/i.test(sentence)) {
          assessment += sentence.trim() + '. ';
        } else {
          plan += sentence.trim() + '. ';
        }
      }
      
      // DEFAULT: Si es del terapeuta va a objective, si es síntoma va a subjective
      else if (s.length > 10) {
        if (/dolor|molestia|síntoma|siento/i.test(sentence)) {
          subjective += sentence.trim() + '. ';
        } else {
          objective += sentence.trim() + '. ';
        }
      }
    });

    // Completar secciones vacías con contenido mínimo
    if (!subjective.trim()) {
      subjective = 'Paciente refiere molestias según transcripción registrada.';
      warnings.push('Sección Subjetiva incompleta - requiere ampliación');
    }
    
    if (!objective.trim()) {
      objective = 'Examen físico y evaluación clínica documentados en consulta.';
      warnings.push('Sección Objetiva requiere complemento con hallazgos físicos');
    }
    
    if (!assessment.trim()) {
      assessment = `Evaluación clínica basada en síntomas presentados y hallazgos de examen. ${specialty === 'physiotherapy' ? 'Requiere análisis funcional detallado.' : 'Requiere evaluación diagnóstica completa.'}`;
      warnings.push('Assessment generado automáticamente - requiere validación clínica');
    }
    
    if (!plan.trim()) {
      plan = `Continuar evaluación y ${specialty === 'physiotherapy' ? 'programa de rehabilitación' : 'seguimiento clínico'} según evolución. Monitoreo de síntomas y respuesta al tratamiento.`;
      warnings.push('Plan terapéutico requiere especificación detallada');
    }

    // Calcular confianza basada en completitud
    const completeness = [subjective, objective, assessment, plan].map(section => 
      section.trim().length > 20 ? 1 : 0
    ).reduce((a: number, b: number) => a + b, 0);
    
    const confidence = Math.max(40, (completeness / 4) * 100);

    return {
      subjective: subjective.trim(),
      objective: objective.trim(),
      assessment: assessment.trim(),
      plan: plan.trim(),
      confidence: Math.round(confidence),
      warnings
    };
  }

  /**
   * Cálculo de nivel de riesgo general
   */
  private calculateRiskLevel(warnings: ClinicalWarning[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (warnings.some(w => w.severity === 'CRITICAL')) {
      return 'CRITICAL';
    }
    if (warnings.some(w => w.severity === 'HIGH')) {
      return 'HIGH';
    }
    if (warnings.some(w => w.severity === 'MEDIUM')) {
      return 'MEDIUM';
    }
    return 'LOW';
  }
}

// Instancia singleton para uso global
export const clinicalAnalyzer = new ClinicalAnalyzer(); 