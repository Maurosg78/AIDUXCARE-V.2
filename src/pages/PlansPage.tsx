/**
 * 💰 PÁGINA DE PLANES ESPECIALIZADOS - AiDuxCare V.2
 * 
 * Implementa la estrategia de diferenciación por especialidad médica:
 * Psychology Pro €79, Physio Pro €69, General Pro €59
 * 
 * Características clave:
 * - Early Adopters Program (100 usuarios, €29 por 3 meses)
 * - Planes especializados por disciplina
 * - Pricing strategy optimizada
 * - IA contextual especializada
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AiDuxCareLogo } from '@/components/branding/AiDuxCareLogo';
import { useAuth } from '@/contexts/AuthContext';

// ============== TIPOS E INTERFACES ===============

type PlanId = 'PSYCHOLOGY_PRO' | 'PHYSIO_PRO' | 'GENERAL_PRO' | 'STARTER' | 'CLINIC' | 'EARLY_ADOPTER';
type BillingCycle = 'monthly' | 'annual';

interface PlanFeature {
  id: string;
  name: string;
  description: string;
  isHighlight?: boolean;
  isSpecialty?: boolean;
}

interface SpecializedPlan {
  id: PlanId;
  name: string;
  subtitle: string;
  price: {
    monthly: number;
    annual: number;
  };
  originalPrice?: number; // Para mostrar descuento
  specialty: 'PSYCHOLOGY' | 'PHYSIO' | 'GENERAL' | 'STARTER' | 'CLINIC' | 'EARLY_ADOPTER';
  icon: string;
  color: string;
  gradient: string;
  limits: {
    initialConsultations: number;
    followUpConsultations: number;
    emergencyConsultations: number | 'unlimited';
  };
  features: PlanFeature[];
  redFlags: string[];
  soapType: string;
  costOptimization: {
    initial: number;
    followUp: number;
    savings: string;
  };
  isPopular?: boolean;
  isEarlyAccess?: boolean;
  maxUsers?: number; // Para early adopters
  validUntil?: string; // Para ofertas limitadas
}

// ============== COMPONENTE PRINCIPAL ===============

const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  const [selectedBilling, setSelectedBilling] = useState<BillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [earlyAdoptersCount] = useState(73); // Simular contador dinámico

  // Detectar specialty desde URL para pre-selección
  const preSelectedSpecialty = searchParams.get('specialty');

  useEffect(() => {
    if (preSelectedSpecialty) {
      const planMap: Record<string, PlanId> = {
        'psychology': 'PSYCHOLOGY_PRO',
        'physio': 'PHYSIO_PRO',
        'general': 'GENERAL_PRO'
      };
      setSelectedPlan(planMap[preSelectedSpecialty] || null);
    }
  }, [preSelectedSpecialty]);

  // ============== DATOS DE PLANES ===============

  const plans: SpecializedPlan[] = [
    // EARLY ADOPTERS - Oferta limitada
    {
      id: 'EARLY_ADOPTER',
      name: 'Early Adopter',
      subtitle: 'Oferta Limitada Lanzamiento',
      price: { monthly: 29, annual: 290 },
      originalPrice: 79,
      specialty: 'EARLY_ADOPTER',
      icon: 'LAUNCH:',
      color: 'bg-gradient-to-r from-orange-500 to-red-500',
      gradient: 'from-orange-500/10 to-red-500/10',
      limits: {
        initialConsultations: 100,
        followUpConsultations: 250,
        emergencyConsultations: 'unlimited'
      },
      features: [
        { id: 'all_specialties', name: 'Todas las Especialidades', description: 'Acceso completo a Psychology, Physio y General Pro', isHighlight: true },
        { id: 'full_ai', name: 'IA Completa', description: 'Transcripción + NLP + SOAP + Alertas', isHighlight: true },
        { id: 'early_feedback', name: 'Programa Feedback', description: 'Influye directamente en el desarrollo del producto', isSpecialty: true },
        { id: 'unlimited_support', name: 'Soporte Prioritario', description: 'Acceso directo al equipo de desarrollo' },
        { id: 'no_activation', name: 'Sin Código Activación', description: 'Acceso inmediato sin lista de espera' }
      ],
      redFlags: ['Detección completa multi-especialidad'],
      soapType: 'SOAP Adaptativo Multi-Especialidad',
      costOptimization: {
        initial: 0.15,
        followUp: 0.08,
        savings: '73% descuento vs precio final'
      },
      isEarlyAccess: true,
      maxUsers: 100,
      validUntil: 'Primeros 100 usuarios'
    },

    // PSYCHOLOGY PRO
    {
      id: 'PSYCHOLOGY_PRO',
      name: 'Psychology Pro',
      subtitle: 'IA Especializada en Salud Mental',
      price: { monthly: 79, annual: 790 },
      specialty: 'PSYCHOLOGY',
      icon: 'AI:',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      gradient: 'from-purple-500/10 to-pink-500/10',
      limits: {
        initialConsultations: 8,
        followUpConsultations: 20,
        emergencyConsultations: 'unlimited'
      },
      features: [
        { id: 'dsm5_soap', name: 'SOAP DSM-5', description: 'Clasificación automática según DSM-5', isSpecialty: true },
        { id: 'suicide_risk', name: 'Detección Riesgo Suicida', description: 'Algoritmos especializados en ideación suicida', isHighlight: true },
        { id: 'mental_state', name: 'Examen Estado Mental', description: 'Evaluación automática MSE', isSpecialty: true },
        { id: 'therapy_notes', name: 'Notas Terapéuticas', description: 'Documentación especializada psicoterapia' },
        { id: 'psychological_scales', name: 'Escalas Psicológicas', description: 'Integración con escalas validadas' }
      ],
      redFlags: ['Ideación suicida', 'Autolesión', 'Indicadores psicóticos', 'Depresión severa'],
      soapType: 'SOAP DSM-5 Especializado',
      costOptimization: {
        initial: 0.35,
        followUp: 0.18,
        savings: '49% ahorro en seguimientos'
      },
      isPopular: true
    },

    // PHYSIO PRO
    {
      id: 'PHYSIO_PRO',
      name: 'Physio Pro',
      subtitle: 'IA Especializada en Fisioterapia',
      price: { monthly: 69, annual: 690 },
      specialty: 'PHYSIO',
      icon: 'RUNNER:',
      color: 'bg-gradient-to-r from-green-500 to-blue-500',
      gradient: 'from-green-500/10 to-blue-500/10',
      limits: {
        initialConsultations: 10,
        followUpConsultations: 25,
        emergencyConsultations: 'unlimited'
      },
      features: [
        { id: 'functional_soap', name: 'SOAP Funcional', description: 'Evaluación biomecánica automatizada', isSpecialty: true },
        { id: 'biomechanical_analysis', name: 'Análisis Biomecánico', description: 'Patrones de movimiento y postural', isHighlight: true },
        { id: 'neurological_screening', name: 'Screening Neurológico', description: 'Detección signos neurológicos', isSpecialty: true },
        { id: 'exercise_prescription', name: 'Prescripción Ejercicios', description: 'Recomendaciones automáticas basadas en evidencia' },
        { id: 'functional_assessment', name: 'Evaluación Funcional', description: 'Métricas objetivas de función' }
      ],
      redFlags: ['Signos neurológicos', 'Trauma severo', 'Indicadores fractura', 'Compromiso vascular'],
      soapType: 'SOAP Funcional Biomecánico',
      costOptimization: {
        initial: 0.25,
        followUp: 0.12,
        savings: '52% ahorro en seguimientos'
      }
    },

    // GENERAL PRO
    {
      id: 'GENERAL_PRO',
      name: 'General Pro',
      subtitle: 'IA Adaptativa Multi-Especialidad',
      price: { monthly: 59, annual: 590 },
      specialty: 'GENERAL',
      icon: 'MEDICAL:',
      color: 'bg-gradient-to-r from-blue-500 to-teal-500',
      gradient: 'from-blue-500/10 to-teal-500/10',
      limits: {
        initialConsultations: 12,
        followUpConsultations: 18,
        emergencyConsultations: 'unlimited'
      },
      features: [
        { id: 'adaptive_soap', name: 'SOAP Adaptativo', description: 'Se adapta a cualquier especialidad', isSpecialty: true },
        { id: 'general_screening', name: 'Screening Amplio', description: 'Detección multi-sistema', isHighlight: true },
        { id: 'differential_diagnosis', name: 'Diagnóstico Diferencial', description: 'Sugerencias basadas en síntomas' },
        { id: 'referral_assistant', name: 'Asistente Derivación', description: 'Recomendaciones de especialización' },
        { id: 'clinical_guidelines', name: 'Guías Clínicas', description: 'Acceso a protocolos actualizados' }
      ],
      redFlags: ['Dolor torácico', 'Disnea', 'Cefalea severa', 'Dolor abdominal', 'Fiebre alta'],
      soapType: 'SOAP Adaptativo Inteligente',
      costOptimization: {
        initial: 0.20,
        followUp: 0.10,
        savings: '50% ahorro en seguimientos'
      }
    },

    // STARTER
    {
      id: 'STARTER',
      name: 'Starter',
      subtitle: 'Para Empezar',
      price: { monthly: 29, annual: 290 },
      specialty: 'STARTER',
      icon: '⚡',
      color: 'bg-gradient-to-r from-gray-500 to-slate-500',
      gradient: 'from-gray-500/10 to-slate-500/10',
      limits: {
        initialConsultations: 8,
        followUpConsultations: 15,
        emergencyConsultations: 5
      },
      features: [
        { id: 'basic_transcription', name: 'Transcripción Básica', description: 'Reconocimiento de voz estándar' },
        { id: 'basic_soap', name: 'SOAP Básico', description: 'Documentación estructurada simple' },
        { id: 'basic_analysis', name: 'Análisis Básico', description: 'Detección de patrones simples' },
        { id: 'email_support', name: 'Soporte Email', description: 'Soporte por correo electrónico' }
      ],
      redFlags: ['Detección básica de alertas'],
      soapType: 'SOAP Estándar',
      costOptimization: {
        initial: 0.15,
        followUp: 0.08,
        savings: '47% ahorro en seguimientos'
      }
    },

    // CLINIC
    {
      id: 'CLINIC',
      name: 'Clinic',
      subtitle: 'Para Clínicas y Equipos',
      price: { monthly: 149, annual: 1490 },
      specialty: 'CLINIC',
      icon: 'MEDICAL',
      color: 'bg-gradient-to-r from-indigo-600 to-purple-600',
      gradient: 'from-indigo-600/10 to-purple-600/10',
      limits: {
        initialConsultations: 50,
        followUpConsultations: 100,
        emergencyConsultations: 'unlimited'
      },
      features: [
        { id: 'multi_user', name: 'Multi-Usuario', description: 'Hasta 5 profesionales incluidos', isHighlight: true },
        { id: 'all_specialties', name: 'Todas las Especialidades', description: 'Psychology + Physio + General Pro' },
        { id: 'advanced_analytics', name: 'Analytics Avanzados', description: 'Dashboard ejecutivo y métricas' },
        { id: 'api_access', name: 'API Access', description: 'Integración con sistemas existentes' },
        { id: 'priority_support', name: 'Soporte 24/7', description: 'Soporte prioritario dedicado' },
        { id: 'custom_workflows', name: 'Workflows Personalizados', description: 'Adaptación a procesos específicos' }
      ],
      redFlags: ['Detección completa multi-especialidad + Alertas institucionales'],
      soapType: 'SOAP Multi-Especialidad Avanzado',
      costOptimization: {
        initial: 0.12,
        followUp: 0.06,
        savings: '50% ahorro vs planes individuales'
      }
    }
  ];

  // ============== MANEJADORES DE EVENTOS ===============

  const handlePlanSelect = async (planId: PlanId) => {
    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      // Simular proceso de selección
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isAuthenticated) {
        // Usuario logueado -> ir directamente a checkout/configuración
        navigate(`/subscription/checkout?plan=${planId}&billing=${selectedBilling}`);
      } else {
        // Usuario no logueado -> ir a auth con plan preseleccionado
        navigate(`/auth?plan=${planId}&billing=${selectedBilling}`);
      }
    } catch (error) {
      console.error('Error seleccionando plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAnnualSavings = (monthlyPrice: number) => {
    const annualPrice = monthlyPrice * 10; // 2 meses gratis
    const monthlySavings = (monthlyPrice * 12) - annualPrice;
    const percentSavings = Math.round((monthlySavings / (monthlyPrice * 12)) * 100);
    return { monthlySavings, percentSavings };
  };

  const formatPrice = (price: number, billing: BillingCycle) => {
    if (billing === 'annual') {
      return `€${price * 10}/año`; // 2 meses gratis
    }
    return `€${price}/mes`;
  };

  // ============== RENDER HELPERS ===============

  const renderPlanCard = (plan: SpecializedPlan) => {
    const isSelected = selectedPlan === plan.id;
    const isEarlyAdopter = plan.id === 'EARLY_ADOPTER';
    const price = selectedBilling === 'annual' ? plan.price.annual : plan.price.monthly;

    return (
      <div
        key={plan.id}
        className={`
          relative bg-white/90 backdrop-blur-sm rounded-3xl border-2 transition-all duration-300 cursor-pointer
          ${isSelected 
            ? 'border-[#5DA5A3] shadow-2xl scale-105 z-10' 
            : 'border-[#BDC3C7]/30 hover:border-[#5DA5A3]/50 hover:shadow-xl hover:scale-102'
          }
          ${plan.isPopular ? 'ring-2 ring-[#5DA5A3]/20' : ''}
          ${isEarlyAdopter ? 'ring-2 ring-orange-500/30 shadow-orange-100' : ''}
        `}
        onClick={() => handlePlanSelect(plan.id)} onKeyDown={(e) => e.key === "Enter" && handlePlanSelect(plan.id)}
      >
        {/* Badge Popular/Early Access */}
        {(plan.isPopular || plan.isEarlyAccess) && (
          <div className={`
            absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white
            ${plan.isEarlyAccess ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-[#5DA5A3] to-[#4A8280]'}
          `}>
            {plan.isEarlyAccess ? 'LAUNCH: OFERTA LIMITADA' : 'STAR: MÁS POPULAR'}
          </div>
        )}

        <div className="p-6">
          {/* Header del Plan */}
          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl ${plan.color}`}>
              {plan.icon}
            </div>
            <h3 className="text-xl font-bold text-[#2C3E50] mb-2">{plan.name}</h3>
            <p className="text-sm text-[#2C3E50]/70 mb-4">{plan.subtitle}</p>
            
            {/* Precio */}
            <div className="mb-4">
              {plan.originalPrice && isEarlyAdopter && (
                <div className="text-sm text-gray-500 line-through mb-1">
                  €{plan.originalPrice}/mes
                </div>
              )}
              <div className="text-3xl font-bold text-[#2C3E50]">
                {formatPrice(price, selectedBilling)}
              </div>
              {selectedBilling === 'annual' && !isEarlyAdopter && (
                <div className="text-sm text-green-600 font-medium">
                  2 meses gratis
                </div>
              )}
              {isEarlyAdopter && (
                <div className="text-sm text-orange-600 font-medium">
                  {earlyAdoptersCount}/100 usuarios
                </div>
              )}
            </div>
          </div>

          {/* Límites del Plan */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-[#2C3E50] mb-3">Consultas Incluidas</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#F7F7F7] rounded-lg p-2">
                <div className="text-lg font-bold text-[#5DA5A3]">{plan.limits.initialConsultations}</div>
                <div className="text-xs text-[#2C3E50]/70">Iniciales</div>
              </div>
              <div className="bg-[#F7F7F7] rounded-lg p-2">
                <div className="text-lg font-bold text-[#5DA5A3]">{plan.limits.followUpConsultations}</div>
                <div className="text-xs text-[#2C3E50]/70">Seguimientos</div>
              </div>
              <div className="bg-[#F7F7F7] rounded-lg p-2">
                <div className="text-lg font-bold text-[#5DA5A3]">
                  {plan.limits.emergencyConsultations === 'unlimited' ? '∞' : plan.limits.emergencyConsultations}
                </div>
                <div className="text-xs text-[#2C3E50]/70">Emergencias</div>
              </div>
            </div>
          </div>

          {/* Características Principales */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-[#2C3E50] mb-3">Características</h4>
            <ul className="space-y-2">
              {plan.features.slice(0, 4).map((feature) => (
                <li key={feature.id} className="flex items-start space-x-2">
                  <span className={`
                    text-xs mt-0.5 
                    ${feature.isHighlight ? 'STAR:' : feature.isSpecialty ? 'TARGET:' : 'SUCCESS:'}
                  `}>
                    {feature.isHighlight ? 'STAR:' : feature.isSpecialty ? 'TARGET:' : 'SUCCESS:'}
                  </span>
                  <div className="flex-1">
                    <span className={`text-sm ${feature.isHighlight ? 'font-semibold text-[#5DA5A3]' : 'text-[#2C3E50]'}`}>
                      {feature.name}
                    </span>
                    <p className="text-xs text-[#2C3E50]/70">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            {plan.features.length > 4 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComparison(true);
                }}
                className="text-xs text-[#5DA5A3] hover:text-[#4A8280] mt-2"
              >
                +{plan.features.length - 4} características más
              </button>
            )}
          </div>

          {/* SOAP Type */}
          <div className="mb-6 p-3 bg-gradient-to-r from-[#5DA5A3]/10 to-[#A8E6CF]/10 rounded-lg">
            <div className="text-xs text-[#2C3E50]/70 mb-1">Tipo de Documentación</div>
            <div className="text-sm font-medium text-[#2C3E50]">{plan.soapType}</div>
          </div>

          {/* Optimización de Costos */}
          <div className="mb-6">
            <div className="text-xs text-[#2C3E50]/70 mb-2">Optimización de Costos</div>
            <div className="text-sm text-green-600 font-medium">{plan.costOptimization.savings}</div>
          </div>

          {/* CTA Button */}
          <button
            disabled={isLoading && isSelected}
            className={`
              w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200
              ${isSelected 
                ? 'bg-[#5DA5A3] text-white shadow-lg' 
                : `${plan.color} text-white hover:shadow-lg hover:scale-105`
              }
              ${isLoading && isSelected ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            {isLoading && isSelected ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Procesando...</span>
              </div>
            ) : isEarlyAdopter ? (
              'Unirse a Early Adopters'
            ) : (
              'Seleccionar Plan'
            )}
          </button>

          {/* Early Adopter Info */}
          {isEarlyAdopter && (
            <div className="mt-3 text-center">
              <p className="text-xs text-[#2C3E50]/70">
                TIME Válido para los primeros {100 - earlyAdoptersCount} usuarios restantes
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============== RENDER PRINCIPAL ===============

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#5DA5A3]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 left-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="container mx-auto px-4 pt-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')} onKeyDown={(e) => e.key === "Enter" && navigate('/')}
            >
              <AiDuxCareLogo size="sm" variant="icon" />
              <div>
                <h1 className="text-xl font-bold text-[#2C3E50]">AiDuxCare</h1>
                <p className="text-xs text-[#2C3E50]/70">AI-EMR Platform</p>
                <p className="text-xs text-[#5DA5A3] font-medium italic">"Más tiempo para los pacientes, menos para el papeleo"</p>
              </div>
            </div>
            
            {isAuthenticated && (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm text-[#5DA5A3] hover:bg-[#5DA5A3]/10 rounded-lg transition-colors"
              >
                Ir a Dashboard
              </button>
            )}
          </div>

          {/* Page Title */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-[#2C3E50] mb-4">
              Elige tu <span className="text-[#5DA5A3]">Plan Especializado</span>
            </h2>
            <div className="mb-4">
              <p className="text-lg text-[#5DA5A3] font-semibold italic mb-3">
                "Más tiempo para los pacientes, menos para el papeleo"
              </p>
            </div>
            <p className="text-lg text-[#2C3E50]/80 max-w-3xl mx-auto">
              La primera plataforma EMR con IA diseñada específicamente para cada disciplina médica. 
              Obtén transcripción inteligente, análisis clínico especializado y documentación SOAP optimizada para tu especialidad.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-[#BDC3C7]/20">
              <div className="flex">
                <button
                  onClick={() => setSelectedBilling('monthly')}
                  className={`
                    px-6 py-3 rounded-xl text-sm font-medium transition-all
                    ${selectedBilling === 'monthly' 
                      ? 'bg-[#5DA5A3] text-white shadow-md' 
                      : 'text-[#2C3E50] hover:bg-[#F7F7F7]'
                    }
                  `}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setSelectedBilling('annual')}
                  className={`
                    px-6 py-3 rounded-xl text-sm font-medium transition-all relative
                    ${selectedBilling === 'annual' 
                      ? 'bg-[#5DA5A3] text-white shadow-md' 
                      : 'text-[#2C3E50] hover:bg-[#F7F7F7]'
                    }
                  `}
                >
                  Anual
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    2 meses gratis
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="container mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map(plan => renderPlanCard(plan))}
          </div>
        </div>

        {/* Features Comparison CTA */}
        <div className="container mx-auto px-4 pb-12">
          <div className="text-center">
            <button
              onClick={() => setShowComparison(true)}
              className="px-6 py-3 bg-white/80 backdrop-blur-sm text-[#2C3E50] border border-[#BDC3C7]/30 rounded-xl hover:bg-[#F7F7F7] transition-colors"
            >
              STATS: Comparar Todas las Características
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="container mx-auto px-4 pb-8">
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-[#BDC3C7]/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl mb-2">SECURE</div>
                <h4 className="font-semibold text-[#2C3E50] mb-2">Seguridad Médica</h4>
                <p className="text-sm text-[#2C3E50]/70">ISO 27001 + HIPAA + GDPR compliant</p>
              </div>
              <div>
                <div className="text-3xl mb-2">TARGET:</div>
                <h4 className="font-semibold text-[#2C3E50] mb-2">IA Especializada</h4>
                <p className="text-sm text-[#2C3E50]/70">Entrenad específicamente por disciplina médica</p>
              </div>
              <div>
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-semibold text-[#2C3E50] mb-2">Implementación Rápida</h4>
                <p className="text-sm text-[#2C3E50]/70">Setup en minutos, no días</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="container mx-auto px-4 pb-12">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-[#2C3E50] text-center mb-8">Preguntas Frecuentes</h3>
            <div className="space-y-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#BDC3C7]/20">
                <h4 className="font-semibold text-[#2C3E50] mb-2">¿Qué incluye el programa Early Adopters?</h4>
                <p className="text-sm text-[#2C3E50]/80">
                  Acceso completo a todas las especialidades por €29/mes durante 3 meses (vs €79 precio final). 
                  Incluye todas las funcionalidades premium + influencia directa en el desarrollo del producto.
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#BDC3C7]/20">
                <h4 className="font-semibold text-[#2C3E50] mb-2">¿Cómo funciona la optimización de costos?</h4>
                <p className="text-sm text-[#2C3E50]/80">
                  Nuestro algoritmo de clasificación automática reduce el costo de procesamiento para seguimientos vs consultas iniciales, 
                  optimizando el uso de IA según el contexto clínico.
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-[#BDC3C7]/20">
                <h4 className="font-semibold text-[#2C3E50] mb-2">¿Puedo cambiar de plan más adelante?</h4>
                <p className="text-sm text-[#2C3E50]/80">
                  Sí, puedes upgrade o downgrade tu plan en cualquier momento. 
                  Los cambios se aplican en el siguiente ciclo de facturación con ajuste proporcional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansPage; 