/**
 * TARGET: Servicio de Límites por Plan - AiDuxCare V.2
 * 
 * Controla el uso de consultas según el plan del usuario y la clasificación
 * Implementa los límites específicos por especialidad y tipo de consulta
 */

import { ClassificationResult } from './ConsultationClassifier';

export interface PlanLimits {
  initialConsultations: number;
  followUpConsultations: number;
  emergencyConsultations: number; // -1 = ilimitadas
  specialtyFeatures: string[];
  monthlyLimit: number;
  costOptimization: boolean;
}

export interface PlanUsage {
  initialConsultations: number;
  followUpConsultations: number;
  emergencyConsultations: number;
  currentPeriodStart: Date;
  totalCost: number;
}

export interface PlanValidationResult {
  allowed: boolean;
  reason?: string;
  suggestedUpgrade?: string;
  remainingQuota: {
    initial: number;
    followUp: number;
    emergency: number;
  };
}

/**
 * Servicio de límites por plan que controla el uso según la clasificación
 */
export class PlanLimitsService {
  
  /**
   * Verifica si el usuario puede realizar este tipo de consulta según su plan
   */
  static canPerformConsultation(
    userPlan: string,
    classification: ClassificationResult,
    currentUsage: PlanUsage
  ): PlanValidationResult {
    
    const planLimits = this.getPlanLimits(userPlan);
    const consultationType = classification.consultationType;
    
    // Calcular cuotas restantes
    const remainingQuota = {
      initial: Math.max(0, planLimits.initialConsultations - currentUsage.initialConsultations),
      followUp: Math.max(0, planLimits.followUpConsultations - currentUsage.followUpConsultations),
      emergency: planLimits.emergencyConsultations === -1 ? -1 : 
                 Math.max(0, planLimits.emergencyConsultations - currentUsage.emergencyConsultations)
    };
    
    // Verificar límites por tipo de consulta
    if (consultationType === 'INICIAL') {
      if (currentUsage.initialConsultations >= planLimits.initialConsultations) {
        return {
          allowed: false,
          reason: `Límite de consultas iniciales alcanzado (${planLimits.initialConsultations})`,
          suggestedUpgrade: this.suggestUpgrade(userPlan, 'INITIAL_LIMIT'),
          remainingQuota
        };
      }
    }
    
    if (consultationType === 'SEGUIMIENTO') {
      if (currentUsage.followUpConsultations >= planLimits.followUpConsultations) {
        return {
          allowed: false,
          reason: `Límite de seguimientos alcanzado (${planLimits.followUpConsultations})`,
          suggestedUpgrade: this.suggestUpgrade(userPlan, 'FOLLOWUP_LIMIT'),
          remainingQuota
        };
      }
    }
    
    // Las emergencias tienen manejo especial
    if (consultationType === 'EMERGENCIA') {
      if (planLimits.emergencyConsultations !== -1 && 
          currentUsage.emergencyConsultations >= planLimits.emergencyConsultations) {
        // Permitir emergencias pero notificar límite
        console.warn('WARNING: Límite de emergencias alcanzado, pero se permite por seguridad');
      }
      return { allowed: true, remainingQuota };
    }
    
    // Verificar características especiales por especialidad
    const hasRequiredFeatures = this.validateSpecialtyFeatures(
      classification.specialty, 
      planLimits.specialtyFeatures
    );
    
    if (!hasRequiredFeatures.valid) {
      return {
        allowed: false,
        reason: hasRequiredFeatures.reason,
        suggestedUpgrade: this.suggestUpgrade(userPlan, 'SPECIALTY_FEATURES'),
        remainingQuota
      };
    }
    
    return { allowed: true, remainingQuota };
  }
  
  /**
   * Obtiene los límites específicos por plan
   */
  private static getPlanLimits(planType: string): PlanLimits {
    const limits: Record<string, PlanLimits> = {
      'PSYCHOLOGY_PRO': {
        initialConsultations: 8,
        followUpConsultations: 20,
        emergencyConsultations: -1, // Ilimitadas
        specialtyFeatures: ['DSM5_SOAP', 'SUICIDE_RISK_DETECTION', 'PSYCHOLOGICAL_SCALES'],
        monthlyLimit: 28,
        costOptimization: true
      },
      'PHYSIO_PRO': {
        initialConsultations: 10,
        followUpConsultations: 25,
        emergencyConsultations: -1,
        specialtyFeatures: ['FUNCTIONAL_SOAP', 'BIOMECHANICAL_ANALYSIS', 'MOVEMENT_ASSESSMENT'],
        monthlyLimit: 35,
        costOptimization: true
      },
      'GENERAL_PRO': {
        initialConsultations: 12,
        followUpConsultations: 18,
        emergencyConsultations: -1,
        specialtyFeatures: ['ADAPTIVE_SOAP', 'GENERAL_ASSESSMENT'],
        monthlyLimit: 30,
        costOptimization: true
      },
      'STARTER': {
        initialConsultations: 8,
        followUpConsultations: 15,
        emergencyConsultations: 5, // Limitadas en plan básico
        specialtyFeatures: ['BASIC_SOAP'],
        monthlyLimit: 23,
        costOptimization: false
      },
      'CLINIC': {
        initialConsultations: 50, // Para múltiples profesionales
        followUpConsultations: 100,
        emergencyConsultations: -1,
        specialtyFeatures: [
          'DSM5_SOAP', 'FUNCTIONAL_SOAP', 'ADAPTIVE_SOAP',
          'SUICIDE_RISK_DETECTION', 'BIOMECHANICAL_ANALYSIS',
          'MULTI_USER', 'ADVANCED_ANALYTICS'
        ],
        monthlyLimit: 150,
        costOptimization: true
      }
    };
    
    return limits[planType] || limits['STARTER'];
  }
  
  /**
   * Valida si el plan tiene las características necesarias para la especialidad
   */
  private static validateSpecialtyFeatures(
    specialty: string,
    planFeatures: string[]
  ): { valid: boolean; reason?: string } {
    
    const requiredFeatures: Record<string, string[]> = {
      'PSICOLOGIA': ['DSM5_SOAP'],
      'FISIOTERAPIA': ['FUNCTIONAL_SOAP'],
      'MEDICINA_GENERAL': ['ADAPTIVE_SOAP']
    };
    
    const required = requiredFeatures[specialty] || ['BASIC_SOAP'];
    const hasAllFeatures = required.every(feature => 
      planFeatures.includes(feature) || planFeatures.includes('BASIC_SOAP')
    );
    
    if (!hasAllFeatures) {
      const missingFeatures = required.filter(feature => 
        !planFeatures.includes(feature) && !planFeatures.includes('BASIC_SOAP')
      );
      
      return {
        valid: false,
        reason: `Plan no incluye características requeridas para ${specialty}: ${missingFeatures.join(', ')}`
      };
    }
    
    return { valid: true };
  }
  
  /**
   * Sugiere upgrade de plan basado en la limitación encontrada
   */
  private static suggestUpgrade(currentPlan: string, limitType: string): string {
    const upgradeMatrix: Record<string, Record<string, string>> = {
      'STARTER': {
        'INITIAL_LIMIT': 'GENERAL_PRO - Más consultas iniciales (12 vs 8)',
        'FOLLOWUP_LIMIT': 'PSYCHOLOGY_PRO - Más seguimientos (20 vs 15)',
        'SPECIALTY_FEATURES': 'Plan especializado según tu disciplina'
      },
      'GENERAL_PRO': {
        'INITIAL_LIMIT': 'CLINIC - Para uso intensivo (50 iniciales)',
        'FOLLOWUP_LIMIT': 'PSYCHOLOGY_PRO - Optimizado para seguimientos (20 vs 18)',
        'SPECIALTY_FEATURES': 'Plan especializado según tu disciplina'
      },
      'PSYCHOLOGY_PRO': {
        'INITIAL_LIMIT': 'CLINIC - Para múltiples profesionales',
        'FOLLOWUP_LIMIT': 'CLINIC - Uso ilimitado'
      },
      'PHYSIO_PRO': {
        'INITIAL_LIMIT': 'CLINIC - Para múltiples profesionales',
        'FOLLOWUP_LIMIT': 'CLINIC - Uso ilimitado'
      }
    };
    
    return upgradeMatrix[currentPlan]?.[limitType] || 'Considera upgrade a plan superior';
  }
  
  /**
   * Calcula el costo proyectado para el mes basado en el uso actual
   */
  static calculateProjectedCost(
    userPlan: string,
    currentUsage: PlanUsage,
    daysIntoMonth: number
  ): {
    currentCost: number;
    projectedCost: number;
    planPrice: number;
    isOptimal: boolean;
    recommendation?: string;
  } {
    
    const planPrices: Record<string, number> = {
      'PSYCHOLOGY_PRO': 79,
      'PHYSIO_PRO': 69,
      'GENERAL_PRO': 59,
      'STARTER': 29,
      'CLINIC': 149
    };
    
    const planPrice = planPrices[userPlan] || 29;
    const currentCost = currentUsage.totalCost;
    
    // Proyectar costo basado en uso actual
    const dailyAverage = currentCost / daysIntoMonth;
    const projectedCost = dailyAverage * 30; // Mes completo
    
    // Determinar si el plan es óptimo
    const isOptimal = projectedCost <= (planPrice * 0.8); // 80% del precio del plan
    
    let recommendation: string | undefined;
    if (!isOptimal && projectedCost > planPrice) {
      recommendation = 'Considera upgrade - tu uso excede el valor del plan';
    } else if (projectedCost < (planPrice * 0.3)) {
      recommendation = 'Podrías considerar un plan menor para optimizar costos';
    }
    
    return {
      currentCost,
      projectedCost,
      planPrice,
      isOptimal,
      recommendation
    };
  }
  
  /**
   * Obtiene estadísticas de uso para el dashboard
   */
  static getUsageStats(
    userPlan: string,
    currentUsage: PlanUsage
  ): {
    planName: string;
    limits: PlanLimits;
    usage: PlanUsage;
    utilizationRate: number;
    efficiency: 'LOW' | 'OPTIMAL' | 'HIGH';
    recommendations: string[];
  } {
    
    const limits = this.getPlanLimits(userPlan);
    const totalUsed = currentUsage.initialConsultations + currentUsage.followUpConsultations;
    const totalLimit = limits.initialConsultations + limits.followUpConsultations;
    const utilizationRate = (totalUsed / totalLimit) * 100;
    
    let efficiency: 'LOW' | 'OPTIMAL' | 'HIGH';
    const recommendations: string[] = [];
    
    if (utilizationRate < 30) {
      efficiency = 'LOW';
      recommendations.push('Considera un plan menor para optimizar costos');
    } else if (utilizationRate > 85) {
      efficiency = 'HIGH';
      recommendations.push('Considera upgrade para evitar límites');
    } else {
      efficiency = 'OPTIMAL';
      recommendations.push('Uso óptimo del plan actual');
    }
    
    // Recomendaciones específicas por tipo de uso
    const initialRate = (currentUsage.initialConsultations / limits.initialConsultations) * 100;
    const followUpRate = (currentUsage.followUpConsultations / limits.followUpConsultations) * 100;
    
    if (initialRate > 80 && followUpRate < 50) {
      recommendations.push('Considera más seguimientos para optimizar tratamientos');
    }
    
    if (followUpRate > 90 && initialRate < 50) {
      recommendations.push('Buen uso de seguimientos - considera más evaluaciones iniciales');
    }
    
    return {
      planName: userPlan,
      limits,
      usage: currentUsage,
      utilizationRate,
      efficiency,
      recommendations
    };
  }
} 