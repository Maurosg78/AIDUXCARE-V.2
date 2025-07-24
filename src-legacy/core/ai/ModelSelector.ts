/**
 * 🧠 AiDuxCare - ModelSelector
 * Selector inteligente de modelos Gemini para optimización de costos
 * 90% casos simples → Gemini-Flash ($0.021)
 * 10% casos críticos → Gemini-Pro (máxima precisión)
 */

import { CaseComplexity, MedicalSpecialty } from './PromptFactory';

export interface ModelSelection {
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro';
  reason: string;
  estimatedCost: number;
  confidence: number;
}

export interface ComplexityAnalysis {
  complexity: CaseComplexity;
  redFlags: string[];
  urgency: 'low' | 'medium' | 'high';
  specialty: MedicalSpecialty;
  confidence: number;
  modelRecommendation: ModelSelection;
}

export class ModelSelector {
  // Costos por 1K tokens (aproximados)
  private static readonly MODEL_COSTS = {
    'gemini-1.5-flash': 0.021, // USD por 1K tokens
    'gemini-1.5-pro': 0.075    // USD por 1K tokens
  };

  // Criterios para selección de modelo
  private static readonly COMPLEXITY_CRITERIA = {
    simple: {
      maxRedFlags: 0,
      maxTokens: 2000,
      model: 'gemini-1.5-flash' as const,
      description: 'Casos rutinarios, sin banderas rojas'
    },
    moderate: {
      maxRedFlags: 1,
      maxTokens: 3000,
      model: 'gemini-1.5-flash' as const,
      description: 'Casos con una bandera roja o complejidad media'
    },
    critical: {
      maxRedFlags: 2,
      maxTokens: 5000,
      model: 'gemini-1.5-pro' as const,
      description: 'Casos con múltiples banderas rojas o alta complejidad'
    }
  };

  /**
   * Analiza la complejidad del caso y selecciona el modelo apropiado
   */
  static async analyzeAndSelectModel(
    text: string,
    specialty: MedicalSpecialty = 'fisioterapia'
  ): Promise<ComplexityAnalysis> {
    try {
      // Análisis inicial de complejidad
      const complexity = this.analyzeComplexity(text, specialty);
      
      // Detección de banderas rojas
      const redFlags = this.detectRedFlags(text, specialty);
      
      // Determinar urgencia
      const urgency = this.determineUrgency(redFlags, complexity);
      
      // Seleccionar modelo basado en análisis
      const modelSelection = this.selectModel(complexity, redFlags, urgency);
      
      return {
        complexity,
        redFlags,
        urgency,
        specialty,
        confidence: this.calculateConfidence(complexity, redFlags),
        modelRecommendation: modelSelection
      };
    } catch (error) {
      console.error('Error en análisis de complejidad:', error);
      
      // Fallback a modelo seguro
      return {
        complexity: 'critical',
        redFlags: ['Error en análisis'],
        urgency: 'high',
        specialty,
        confidence: 0.5,
        modelRecommendation: {
          model: 'gemini-1.5-pro',
          reason: 'Fallback por error en análisis',
          estimatedCost: this.MODEL_COSTS['gemini-1.5-pro'],
          confidence: 0.5
        }
      };
    }
  }

  /**
   * Análisis básico de complejidad basado en heurísticas
   */
  private static analyzeComplexity(text: string, specialty: MedicalSpecialty): CaseComplexity {
    const words = text.toLowerCase().split(/\s+/);
    const wordCount = words.length;
    
    // Indicadores de complejidad por especialidad
    const complexityIndicators = {
      fisioterapia: [
        'dolor intenso', 'limitación severa', 'trauma', 'cirugía',
        'hernia', 'radiculopatía', 'estenosis', 'fractura'
      ],
      psicologia: [
        'suicidio', 'alucinación', 'delirio', 'violencia',
        'abuso', 'trauma', 'psicosis', 'mania'
      ],
      medicina_general: [
        'dolor torácico', 'dificultad respiratoria', 'fiebre alta',
        'pérdida de peso', 'sangrado', 'convulsión'
      ]
    };

    const indicators = complexityIndicators[specialty] || [];
    const foundIndicators = indicators.filter(indicator => 
      text.toLowerCase().includes(indicator)
    ).length;

    // Criterios de complejidad
    if (foundIndicators >= 2 || wordCount > 500) {
      return 'critical';
    } else if (foundIndicators >= 1 || wordCount > 200) {
      return 'moderate';
    } else {
      return 'simple';
    }
  }

  /**
   * Detección de banderas rojas específicas por especialidad
   */
  private static detectRedFlags(text: string, specialty: MedicalSpecialty): string[] {
    const redFlagPatterns = {
      fisioterapia: [
        /dolor\s+nocturno/i,
        /pérdida\s+de\s+peso/i,
        /dolor\s+que\s+no\s+mejora/i,
        /síntomas\s+neurológicos/i,
        /historia\s+de\s+cáncer/i,
        /trauma\s+reciente/i
      ],
      psicologia: [
        /suicidio/i,
        /alucinación/i,
        /delirio/i,
        /violencia/i,
        /abuso/i,
        /daño\s+a\s+otros/i
      ],
      medicina_general: [
        /dolor\s+torácico/i,
        /dificultad\s+respiratoria/i,
        /pérdida\s+de\s+consciencia/i,
        /sangrado\s+abundante/i,
        /fiebre\s+alta/i,
        /síntomas\s+neurológicos\s+agudos/i
      ]
    };

    const patterns = redFlagPatterns[specialty] || [];
    const foundFlags: string[] = [];

    patterns.forEach(pattern => {
      if (pattern.test(text)) {
        const match = text.match(pattern);
        if (match) {
          foundFlags.push(match[0]);
        }
      }
    });

    return foundFlags;
  }

  /**
   * Determina el nivel de urgencia
   */
  private static determineUrgency(redFlags: string[], complexity: CaseComplexity): 'low' | 'medium' | 'high' {
    if (redFlags.length >= 2 || complexity === 'critical') {
      return 'high';
    } else if (redFlags.length >= 1 || complexity === 'moderate') {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Selecciona el modelo apropiado basado en análisis
   */
  private static selectModel(
    complexity: CaseComplexity,
    redFlags: string[],
    urgency: 'low' | 'medium' | 'high'
  ): ModelSelection {
    // const criteria = this.COMPLEXITY_CRITERIA[complexity]; // No utilizado actualmente
    
    // Casos críticos siempre usan Gemini-Pro
    if (complexity === 'critical' || redFlags.length >= 2 || urgency === 'high') {
      return {
        model: 'gemini-1.5-pro',
        reason: `Caso crítico: ${redFlags.length} banderas rojas, urgencia ${urgency}`,
        estimatedCost: this.MODEL_COSTS['gemini-1.5-pro'],
        confidence: 0.95
      };
    }
    
    // Casos simples/moderados usan Gemini-Flash
    return {
      model: 'gemini-1.5-flash',
      reason: `Caso ${complexity}: ${redFlags.length} banderas rojas, urgencia ${urgency}`,
      estimatedCost: this.MODEL_COSTS['gemini-1.5-flash'],
      confidence: 0.85
    };
  }

  /**
   * Calcula la confianza del análisis
   */
  private static calculateConfidence(complexity: CaseComplexity, redFlags: string[]): number {
    let confidence = 0.7; // Base
    
    // Ajustar por complejidad
    if (complexity === 'critical') confidence += 0.2;
    if (complexity === 'simple') confidence += 0.1;
    
    // Ajustar por banderas rojas
    if (redFlags.length > 0) confidence += 0.1;
    if (redFlags.length >= 2) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Calcula el costo estimado para un análisis
   */
  static estimateCost(model: 'gemini-1.5-flash' | 'gemini-1.5-pro', tokenCount: number): number {
    const costPer1K = this.MODEL_COSTS[model];
    return (tokenCount / 1000) * costPer1K;
  }

  /**
   * Obtiene estadísticas de optimización de costos
   */
  static getOptimizationStats(): {
    flashUsage: number;
    proUsage: number;
    costSavings: number;
    roi: number;
  } {
    // Estadísticas proyectadas basadas en la estrategia 90/10
    const totalCases = 10000;
    const flashCases = totalCases * 0.9; // 90%
    const proCases = totalCases * 0.1;   // 10%
    
    const avgTokensPerCase = 2500;
    const flashCost = this.estimateCost('gemini-1.5-flash', avgTokensPerCase) * flashCases;
    const proCost = this.estimateCost('gemini-1.5-pro', avgTokensPerCase) * proCases;
    
    const totalCost = flashCost + proCost;
    const allProCost = this.estimateCost('gemini-1.5-pro', avgTokensPerCase) * totalCases;
    const costSavings = allProCost - totalCost;
    
    return {
      flashUsage: flashCases,
      proUsage: proCases,
      costSavings,
      roi: (costSavings / totalCost) * 100
    };
  }
} 