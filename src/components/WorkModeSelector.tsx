/**
 * 🎯 WORK MODE SELECTOR - Selector de Modos de Trabajo Flexibles
 * 
 * Componente que permite al profesional elegir cómo quiere trabajar:
 * 1. Asistente en Vivo - Transcripción en tiempo real durante la consulta
 * 2. Dictado Post-Consulta - Resumen dictado después de la consulta
 * 3. Redacción Manual - Escritura manual con análisis de IA en tiempo real
 * 
 * Implementa la filosofía "Zero Friction UX" de AiDuxCare
 */

import React, { useState } from 'react';
import { 
  MicrophoneIcon, 
  DocumentTextIcon, 
  PencilIcon,
  PlayIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export type WorkMode = 'LIVE_ASSISTANT' | 'POST_CONSULTATION_DICTATION' | 'MANUAL_WRITING';

export interface WorkModeOption {
  id: WorkMode;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  estimatedTime: string;
  bestFor: string;
  isRecommended?: boolean;
}

interface WorkModeSelectorProps {
  onModeSelect: (mode: WorkMode) => void;
  patientName?: string;
  specialty?: string;
  className?: string;
}

const workModeOptions: WorkModeOption[] = [
  {
    id: 'LIVE_ASSISTANT',
    title: 'Asistente en Vivo',
    subtitle: 'Transcripción en tiempo real',
    description: 'El asistente transcribe y analiza la consulta mientras ocurre, generando notas SOAP automáticamente.',
    icon: MicrophoneIcon,
    features: [
      'Transcripción en tiempo real',
      'Análisis SOAP automático',
      'Detección de banderas rojas',
      'Identificación de hablantes',
      'Notas estructuradas automáticas'
    ],
    estimatedTime: '0 min adicionales',
    bestFor: 'Consultas estándar, profesionales que prefieren automatización completa',
    isRecommended: true
  },
  {
    id: 'POST_CONSULTATION_DICTATION',
    title: 'Dictado Post-Consulta',
    subtitle: 'Resumen dictado después',
    description: 'Dicta un resumen de la consulta después de que termine, optimizado para un solo hablante.',
    icon: DocumentTextIcon,
    features: [
      'Dictado optimizado para un hablante',
      'Análisis de resumen clínico',
      'Generación de notas SOAP',
      'Detección de puntos clave',
      'Procesamiento rápido post-consulta'
    ],
    estimatedTime: '2-3 min adicionales',
    bestFor: 'Profesionales que prefieren resumir, consultas complejas'
  },
  {
    id: 'MANUAL_WRITING',
    title: 'Redacción Manual',
    subtitle: 'Escritura con IA en tiempo real',
    description: 'Escribe las notas manualmente mientras la IA analiza y sugiere mejoras en tiempo real.',
    icon: PencilIcon,
    features: [
      'Escritura manual libre',
      'Análisis de IA en tiempo real',
      'Sugerencias de mejora',
      'Detección de omisiones',
      'Validación de terminología médica'
    ],
    estimatedTime: '5-8 min adicionales',
    bestFor: 'Profesionales que prefieren control total, casos complejos'
  }
];

export default function WorkModeSelector({ 
  onModeSelect, 
  patientName = 'el paciente',
  specialty = 'fisioterapia',
  className = '' 
}: WorkModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<WorkMode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleModeSelect = async (mode: WorkMode) => {
    setSelectedMode(mode);
    setIsLoading(true);
    
    // Simular un pequeño delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setIsLoading(false);
    onModeSelect(mode);
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¿Cómo quieres trabajar hoy?
        </h1>
        <p className="text-lg text-gray-600">
          Selecciona el modo que mejor se adapte a tu estilo de trabajo con {patientName}
        </p>
        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          Especialidad: {specialty}
        </div>
      </div>

      {/* Work Mode Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {workModeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedMode === option.id;
          
          return (
            <div
              key={option.id}
              className={`
                relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                }
                ${isLoading ? 'pointer-events-none opacity-75' : ''}
              `}
              onClick={() => handleModeSelect(option.id)}
            >
              {/* Recommended Badge */}
              {option.isRecommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    Recomendado
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className={`
                  p-3 rounded-full
                  ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                `}>
                  <Icon className="w-8 h-8" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {option.title}
                </h3>
                <p className="text-sm text-blue-600 font-medium mb-3">
                  {option.subtitle}
                </p>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  {option.description}
                </p>

                {/* Features */}
                <div className="text-left mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Características:</h4>
                  <ul className="space-y-1">
                    {option.features.map((feature, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start">
                        <CheckCircleIcon className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Meta Info */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Tiempo adicional:</span>
                    <span className="font-medium text-gray-900">{option.estimatedTime}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Ideal para:</span> {option.bestFor}
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      {selectedMode && (
        <div className="text-center">
          <button
            onClick={() => handleModeSelect(selectedMode)}
            disabled={isLoading}
            className={`
              inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200
              ${isLoading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
              }
            `}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Iniciando...
              </>
            ) : (
              <>
                Continuar con {workModeOptions.find(o => o.id === selectedMode)?.title}
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Puedes cambiar el modo de trabajo en cualquier momento desde la configuración
        </p>
      </div>
    </div>
  );
} 