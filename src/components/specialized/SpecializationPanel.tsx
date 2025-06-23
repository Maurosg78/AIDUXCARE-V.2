/**
 * 🎯 SPECIALIZATION PANEL - PANEL DE ESPECIALIZACIÓN INTELIGENTE
 * 
 * Muestra la especialización activa, límites del plan, optimización de costos
 * y características específicas por disciplina médica
 */

import React, { useState, useEffect } from 'react';
import { 
  PlanType, 
  SpecializedPlan, 
  UsageStats,
  MedicalSpecialty,
  ConsultationType,
  specializedPlansService 
} from '../../services/SpecializedPlansService';

interface SpecializationPanelProps {
  currentPlan: PlanType;
  currentSpecialty: MedicalSpecialty;
  currentConsultationType: ConsultationType;
  usageStats?: UsageStats;
  costOptimization?: {
    cost: number;
    reasoning: string;
    optimization: string;
  };
  onPlanUpgrade?: (recommendedPlan: PlanType) => void;
  isProcessing?: boolean;
}

const SpecializationPanel: React.FC<SpecializationPanelProps> = ({
  currentPlan,
  currentSpecialty,
  currentConsultationType,
  usageStats,
  costOptimization,
  onPlanUpgrade,
  isProcessing = false
}) => {

  const [plan, setPlan] = useState<SpecializedPlan | null>(null);
  const [showCostDetails, setShowCostDetails] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    try {
      const planData = specializedPlansService.getPlan(currentPlan);
      setPlan(planData);
    } catch (error) {
      console.error('Error cargando plan:', error);
    }
  }, [currentPlan]);

  if (!plan) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-[#BDC3C7]/20">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-slate-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const getSpecialtyIcon = (specialty: MedicalSpecialty) => {
    switch (specialty) {
      case 'PSICOLOGIA':
        return '🧠';
      case 'FISIOTERAPIA':
        return '🏃‍♂️';
      case 'MEDICINA_GENERAL':
        return '🩺';
      default:
        return '⚕️';
    }
  };

  const getSpecialtyColor = (specialty: MedicalSpecialty) => {
    switch (specialty) {
      case 'PSICOLOGIA':
        return 'bg-purple-500';
      case 'FISIOTERAPIA':
        return 'bg-green-500';
      case 'MEDICINA_GENERAL':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getConsultationTypeIcon = (type: ConsultationType) => {
    switch (type) {
      case 'INICIAL':
        return '🆕';
      case 'SEGUIMIENTO':
        return '🔄';
      case 'EMERGENCIA':
        return '🚨';
      default:
        return '📋';
    }
  };

  const getRemainingConsultations = () => {
    if (!usageStats) return null;

    switch (currentConsultationType) {
      case 'INICIAL':
        return plan.limits.initialConsultations - usageStats.currentPeriod.initialUsed;
      case 'SEGUIMIENTO':
        return plan.limits.followUpConsultations - usageStats.currentPeriod.followUpUsed;
      case 'EMERGENCIA':
        return plan.limits.emergencyConsultations - usageStats.currentPeriod.emergencyUsed;
      default:
        return null;
    }
  };

  const getUsagePercentage = () => {
    if (!usageStats) return 0;

    const remaining = getRemainingConsultations();
    if (remaining === null) return 0;

    const limit = currentConsultationType === 'INICIAL' ? plan.limits.initialConsultations :
                  currentConsultationType === 'SEGUIMIENTO' ? plan.limits.followUpConsultations :
                  plan.limits.emergencyConsultations;

    return ((limit - remaining) / limit) * 100;
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-[#BDC3C7]/20">
      
      {/* Header del Plan */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${getSpecialtyColor(currentSpecialty)} rounded-full flex items-center justify-center text-white font-bold`}>
            {getSpecialtyIcon(currentSpecialty)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#2C3E50]">{plan.name}</h3>
            <p className="text-sm text-[#2C3E50]/60">€{plan.price}/mes · {plan.specialty}</p>
          </div>
        </div>
        
        {isProcessing && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[#A8E6CF] rounded-full animate-pulse"></div>
            <span className="text-xs text-[#5DA5A3] font-medium">Procesando</span>
          </div>
        )}
      </div>

      {/* Consulta Actual */}
      <div className="mb-4 p-3 bg-[#A8E6CF]/10 rounded-lg border border-[#A8E6CF]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getConsultationTypeIcon(currentConsultationType)}</span>
            <span className="text-sm font-medium text-[#2C3E50]">
              Consulta {currentConsultationType.toLowerCase()}
            </span>
          </div>
          
          {costOptimization && (
            <button
              onClick={() => setShowCostDetails(!showCostDetails)}
              className="text-xs text-[#5DA5A3] hover:text-[#2C3E50] transition-colors"
            >
              €{costOptimization.cost.toFixed(3)}
            </button>
          )}
        </div>

        {/* Detalles de Costo */}
        {showCostDetails && costOptimization && (
          <div className="mt-3 pt-3 border-t border-[#A8E6CF]/30">
            <div className="space-y-1">
              <p className="text-xs text-[#2C3E50]/70">
                <strong>Costo:</strong> €{costOptimization.cost.toFixed(3)}
              </p>
              <p className="text-xs text-[#2C3E50]/70">
                <strong>Razón:</strong> {costOptimization.reasoning}
              </p>
              <p className="text-xs text-[#5DA5A3] font-medium">
                <strong>Optimización:</strong> {costOptimization.optimization}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Límites de Uso */}
      {usageStats && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#2C3E50]">Límites de Uso</span>
            <span className="text-xs text-[#2C3E50]/60">
              {getRemainingConsultations()} restantes
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getUsageColor()}`}
              style={{ width: `${getUsagePercentage()}%` }}
            ></div>
          </div>
          
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-[#2C3E50]">
                {plan.limits.initialConsultations - (usageStats.currentPeriod.initialUsed || 0)}
              </div>
              <div className="text-[#2C3E50]/60">Iniciales</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-[#2C3E50]">
                {plan.limits.followUpConsultations - (usageStats.currentPeriod.followUpUsed || 0)}
              </div>
              <div className="text-[#2C3E50]/60">Seguimientos</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-[#2C3E50]">
                {plan.limits.emergencyConsultations - (usageStats.currentPeriod.emergencyUsed || 0)}
              </div>
              <div className="text-[#2C3E50]/60">Emergencias</div>
            </div>
          </div>
        </div>
      )}

      {/* Características Especializadas */}
      <div className="border-t border-[#BDC3C7]/20 pt-4">
        <button
          onClick={() => setShowFeatures(!showFeatures)}
          className="w-full flex items-center justify-between text-sm font-medium text-[#2C3E50] hover:text-[#5DA5A3] transition-colors"
        >
          <span>Características Especializadas</span>
          <svg 
            className={`w-4 h-4 transition-transform ${showFeatures ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showFeatures && (
          <div className="mt-3 space-y-2">
            {plan.features.filter(f => f.isActive).map((feature) => (
              <div key={feature.id} className="flex items-start space-x-2 p-2 bg-[#F7F7F7] rounded-md">
                <div className="w-2 h-2 bg-[#5DA5A3] rounded-full mt-1"></div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-[#2C3E50]">
                    {feature.name}
                  </div>
                  <div className="text-xs text-[#2C3E50]/60">
                    {feature.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alerta de Límite */}
      {usageStats && getUsagePercentage() >= 90 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Límite casi alcanzado
              </p>
              <p className="text-xs text-red-600">
                Quedan {getRemainingConsultations()} consultas de este tipo
              </p>
              {onPlanUpgrade && (
                <button
                  onClick={() => onPlanUpgrade('CLINIC')}
                  className="mt-2 text-xs text-red-700 hover:text-red-900 underline"
                >
                  Actualizar plan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Información de Ahorro */}
      {costOptimization && costOptimization.optimization.includes('%') && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-lg">💰</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                Optimización Activa
              </p>
              <p className="text-xs text-green-600">
                {costOptimization.optimization}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecializationPanel;