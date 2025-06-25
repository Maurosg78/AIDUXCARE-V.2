/**
 * TARGET: GUIDE QUESTIONS - Sistema de Preguntas Guía Contextuales
 * 
 * Sistema inteligente que sugiere preguntas específicas basadas en:
 * - Condición del paciente
 * - Tipo de consulta (inicial/seguimiento)
 * - Especialidad médica
 * - Optimización de tiempos de procesamiento de audio
 */

export interface GuideQuestion {
  id: string;
  question: string;
  category: "historia" | "síntomas" | "exploración" | "evolución" | "tratamiento";
  expectedKeywords: string[];
  soapSection: "subjective" | "objective" | "assessment" | "plan";
  priority: "alta" | "media" | "baja";
}

export interface QuestionSet {
  condition: string;
  keywords: string[];
  initialQuestions: GuideQuestion[];
  followUpQuestions: GuideQuestion[];
  redFlags: string[];
  specialty?: "psychology" | "physio" | "general";
}

export class GuideQuestionsService {
  private static questionSets: Record<string, QuestionSet> = {
    dolor_lumbar: {
      condition: "Dolor Lumbar",
      keywords: ["lumbar", "espalda", "dolor", "irradiado", "ciática"],
      specialty: "physio",
      initialQuestions: [
        {
          id: "lumbar_01",
          question: "¿Cómo y cuándo comenzó el dolor? ¿Fue súbito o gradual?",
          category: "historia",
          expectedKeywords: ["súbito", "gradual", "esfuerzo", "movimiento", "ayer", "semana"],
          soapSection: "subjective",
          priority: "alta"
        },
        {
          id: "lumbar_02", 
          question: "¿El dolor se irradia hacia alguna pierna? ¿Hasta dónde llega?",
          category: "síntomas",
          expectedKeywords: ["irradia", "pierna", "muslo", "pantorrilla", "pie", "hormigueo"],
          soapSection: "subjective",
          priority: "alta"
        },
        {
          id: "lumbar_03",
          question: "En una escala del 1 al 10, ¿qué intensidad tiene el dolor ahora? ¿Y en el peor momento?",
          category: "síntomas",
          expectedKeywords: ["escala", "intensidad", "dolor", "peor", "mejor"],
          soapSection: "subjective",
          priority: "alta"
        },
        {
          id: "lumbar_04",
          question: "¿Qué movimientos o posiciones empeoran el dolor? ¿Cuáles lo alivian?",
          category: "síntomas",
          expectedKeywords: ["empeora", "alivia", "sentado", "parado", "acostado", "caminar"],
          soapSection: "subjective",
          priority: "media"
        }
      ],
      followUpQuestions: [
        {
          id: "lumbar_f01",
          question: "¿Cómo ha evolucionado el dolor desde la última sesión?",
          category: "evolución",
          expectedKeywords: ["mejor", "peor", "igual", "evolución", "progreso"],
          soapSection: "subjective",
          priority: "alta"
        },
        {
          id: "lumbar_f02",
          question: "¿Ha podido realizar los ejercicios domiciliarios? ¿Con qué frecuencia?",
          category: "tratamiento",
          expectedKeywords: ["ejercicios", "casa", "frecuencia", "dificultad", "dolor"],
          soapSection: "subjective",
          priority: "alta"
        }
      ],
      redFlags: ["pérdida de control de esfínteres", "debilidad progresiva", "anestesia en silla de montar", "fiebre"]
    },

    ansiedad: {
      condition: "Ansiedad",
      keywords: ["ansiedad", "estrés", "nervios", "pánico", "preocupación"],
      specialty: "psychology",
      initialQuestions: [
        {
          id: "anx_01",
          question: "¿Cuándo comenzó a sentir estos síntomas de ansiedad? ¿Hubo algún desencadenante específico?",
          category: "historia",
          expectedKeywords: ["comenzó", "desencadenante", "evento", "cambio", "estrés"],
          soapSection: "subjective",
          priority: "alta"
        },
        {
          id: "anx_02",
          question: "¿Qué síntomas físicos experimenta cuando se siente ansioso/a?",
          category: "síntomas",
          expectedKeywords: ["palpitaciones", "sudoración", "temblor", "mareo", "respiración"],
          soapSection: "subjective",
          priority: "alta"
        },
        {
          id: "anx_03",
          question: "¿Cómo afecta la ansiedad a su vida diaria, trabajo o relaciones?",
          category: "síntomas",
          expectedKeywords: ["trabajo", "relaciones", "social", "evita", "limitación"],
          soapSection: "subjective",
          priority: "alta"
        },
        {
          id: "anx_04",
          question: "¿Ha tenido episodios de pánico? ¿Puede describir cómo se sintió?",
          category: "síntomas",
          expectedKeywords: ["pánico", "miedo", "muerte", "control", "intenso"],
          soapSection: "subjective",
          priority: "media"
        }
      ],
      followUpQuestions: [
        {
          id: "anx_f01",
          question: "¿Cómo se ha sentido desde nuestra última sesión? ¿Ha notado cambios?",
          category: "evolución",
          expectedKeywords: ["mejor", "peor", "cambios", "progreso", "retroceso"],
          soapSection: "subjective",
          priority: "alta"
        },
        {
          id: "anx_f02",
          question: "¿Ha practicado las técnicas de relajación que trabajamos? ¿Le han sido útiles?",
          category: "tratamiento",
          expectedKeywords: ["técnicas", "relajación", "respiración", "útiles", "practican"],
          soapSection: "subjective",
          priority: "alta"
        }
      ],
      redFlags: ["ideas suicidas", "autolesiones", "psicosis", "consumo de sustancias"]
    },

    cefalea: {
      condition: "Cefalea/Dolor de Cabeza",
      keywords: ["cefalea", "dolor", "cabeza", "migraña", "tensión"],
      specialty: "general",
      initialQuestions: [
        {
          id: "cef_01",
          question: "¿Dónde se localiza exactamente el dolor de cabeza?",
          category: "síntomas",
          expectedKeywords: ["frente", "temporal", "occipital", "unilateral", "bilateral"],
          soapSection: "subjective",
          priority: "alta"
        },
        {
          id: "cef_02",
          question: "¿Cómo es el dolor? ¿Pulsátil, opresivo, punzante?",
          category: "síntomas",
          expectedKeywords: ["pulsátil", "opresivo", "punzante", "quemante", "intensidad"],
          soapSection: "subjective",
          priority: "alta"
        },
        {
          id: "cef_03",
          question: "¿Con qué frecuencia tiene estos dolores de cabeza?",
          category: "historia",
          expectedKeywords: ["frecuencia", "diario", "semanal", "mensual", "episódico"],
          soapSection: "subjective",
          priority: "alta"
        },
        {
          id: "cef_04",
          question: "¿Hay algo que desencadene el dolor? ¿Estrés, alimentos, luz?",
          category: "historia",
          expectedKeywords: ["desencadena", "estrés", "alimentos", "luz", "sonido", "hormonal"],
          soapSection: "subjective",
          priority: "media"
        }
      ],
      followUpQuestions: [
        {
          id: "cef_f01",
          question: "¿Cómo han estado los dolores de cabeza esta semana?",
          category: "evolución",
          expectedKeywords: ["mejor", "peor", "frecuencia", "intensidad", "medicación"],
          soapSection: "subjective",
          priority: "alta"
        }
      ],
      redFlags: ["fiebre alta", "rigidez de nuca", "alteración visual súbita", "confusión"]
    },

    depresion: {
      condition: "Depresión",
      keywords: ["depresión", "tristeza", "ánimo", "bajo", "melancolía"],
      specialty: "psychology",
      initialQuestions: [
        {
          id: "dep_01",
          question: "¿Desde cuándo se siente de esta manera? ¿Hubo algún evento que lo desencadenara?",
          category: "historia",
          expectedKeywords: ["tiempo", "desde", "evento", "desencadenante", "pérdida"],
          soapSection: "subjective",
          priority: "alta"
        },
        {
          id: "dep_02",
          question: "¿Cómo describe su estado de ánimo la mayor parte del tiempo?",
          category: "síntomas",
          expectedKeywords: ["triste", "vacío", "desesperanzado", "irritable", "ánimo"],
          soapSection: "subjective",
          priority: "alta"
        },
        {
          id: "dep_03",
          question: "¿Ha perdido interés en actividades que antes disfrutaba?",
          category: "síntomas",
          expectedKeywords: ["interés", "actividades", "disfrutaba", "placer", "anhedonia"],
          soapSection: "subjective",
          priority: "alta"
        },
        {
          id: "dep_04",
          question: "¿Cómo está durmiendo? ¿Y su apetito?",
          category: "síntomas",
          expectedKeywords: ["sueño", "apetito", "insomnio", "hipersomnia", "peso"],
          soapSection: "subjective",
          priority: "alta"
        }
      ],
      followUpQuestions: [
        {
          id: "dep_f01",
          question: "¿Cómo se ha sentido anímicamente desde nuestra última sesión?",
          category: "evolución",
          expectedKeywords: ["ánimo", "mejor", "peor", "estable", "fluctuante"],
          soapSection: "subjective",
          priority: "alta"
        }
      ],
      redFlags: ["ideas suicidas", "plan suicida", "autolesiones", "síntomas psicóticos"]
    }
  };

  /**
   * Detecta el tipo de condición basado en palabras clave
   */
  static detectConditionType(condition: string): string {
    const conditionLower = condition.toLowerCase();
    
    for (const [key, questionSet] of Object.entries(this.questionSets)) {
      if (questionSet.keywords.some(keyword => conditionLower.includes(keyword))) {
        return key;
      }
    }
    
    return "general";
  }

  /**
   * Obtiene el conjunto de preguntas para una condición específica
   */
  static getQuestionsForCondition(condition: string, isFollowUp: boolean = false): QuestionSet | null {
    const conditionType = this.detectConditionType(condition);
    const questionSet = this.questionSets[conditionType];
    
    if (!questionSet) return null;
    
    return {
      ...questionSet,
      initialQuestions: isFollowUp ? questionSet.followUpQuestions : questionSet.initialQuestions
    };
  }

  /**
   * Obtiene preguntas por especialidad
   */
  static getQuestionsBySpecialty(specialty: "psychology" | "physio" | "general"): QuestionSet[] {
    return Object.values(this.questionSets).filter(qs => qs.specialty === specialty);
  }

  /**
   * Obtiene red flags para una condición
   */
  static getRedFlagsForCondition(condition: string): string[] {
    const conditionType = this.detectConditionType(condition);
    const questionSet = this.questionSets[conditionType];
    
    return questionSet ? questionSet.redFlags : [];
  }

  /**
   * Sugiere preguntas adicionales basadas en respuestas previas
   */
  static suggestFollowUpQuestions(responses: Record<string, string>, condition: string): GuideQuestion[] {
    const questionSet = this.getQuestionsForCondition(condition);
    if (!questionSet) return [];

    const suggestions: GuideQuestion[] = [];
    
    // Analizar respuestas para sugerir preguntas específicas
    for (const [questionId, response] of Object.entries(responses)) {
      const responseLower = response.toLowerCase();
      
      // Si menciona dolor irradiado, preguntar por síntomas neurológicos
      if (responseLower.includes('irradia') || responseLower.includes('hormigueo')) {
        suggestions.push({
          id: 'neuro_01',
          question: '¿Siente hormigueo, entumecimiento o pérdida de fuerza en alguna parte?',
          category: 'síntomas',
          expectedKeywords: ['hormigueo', 'entumecimiento', 'fuerza', 'debilidad'],
          soapSection: 'subjective',
          priority: 'alta'
        });
      }
      
      // Si menciona mejora, preguntar por factores que ayudaron
      if (responseLower.includes('mejor') || responseLower.includes('mejora')) {
        suggestions.push({
          id: 'improvement_01',
          question: '¿Qué factores cree que han contribuido a esta mejora?',
          category: 'evolución',
          expectedKeywords: ['factores', 'tratamiento', 'ejercicios', 'medicación'],
          soapSection: 'assessment',
          priority: 'media'
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Genera resumen de preguntas clave respondidas
   */
  static generateQuestionSummary(responses: Record<string, string>, questions: GuideQuestion[]): string {
    const summary: string[] = [];
    
    for (const question of questions) {
      const response = responses[question.id];
      if (response) {
        summary.push(`${question.category.toUpperCase()}: ${response}`);
      }
    }
    
    return summary.join('\n');
  }
}
