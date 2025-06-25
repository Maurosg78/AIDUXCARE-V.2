/**
 * TARGET: WORK MODE DEMO PAGE - Página de Demostración de Modos de Trabajo
 * 
 * Página que demuestra el flujo completo de selección de modos de trabajo flexibles.
 * Integra WorkModeSelector con los componentes placeholder para cada modo.
 */

import React, { useState } from 'react';
import WorkModeSelector, { WorkMode } from '../components/WorkModeSelector';
import PostConsultationDictation from '../components/PostConsultationDictation';
import ManualWriting from '../components/ManualWriting';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

type DemoStep = 'SELECTOR' | 'LIVE_ASSISTANT' | 'POST_CONSULTATION_DICTATION' | 'MANUAL_WRITING' | 'COMPLETE';

interface DemoData {
  patientName: string;
  specialty: string;
  selectedMode: WorkMode | null;
  transcription: string;
  finalText: string;
}

export default function WorkModeDemoPage() {
  const [currentStep, setCurrentStep] = useState<DemoStep>('SELECTOR');
  const [demoData, setDemoData] = useState<DemoData>({
    patientName: 'María González',
    specialty: 'Fisioterapia',
    selectedMode: null,
    transcription: '',
    finalText: ''
  });

  const handleModeSelect = (mode: WorkMode) => {
    setDemoData(prev => ({ ...prev, selectedMode: mode }));
    setCurrentStep(mode);
  };

  const handleBackToSelector = () => {
    setCurrentStep('SELECTOR');
  };

  const handleDictationComplete = (transcription: string) => {
    setDemoData(prev => ({ ...prev, transcription }));
    setCurrentStep('COMPLETE');
  };

  const handleManualComplete = (text: string) => {
    setDemoData(prev => ({ ...prev, finalText: text }));
    setCurrentStep('COMPLETE');
  };

  const handleLiveAssistantComplete = () => {
    setCurrentStep('COMPLETE');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'SELECTOR':
        return (
          <WorkModeSelector
            onModeSelect={handleModeSelect}
            patientName={demoData.patientName}
            specialty={demoData.specialty}
          />
        );

      case 'LIVE_ASSISTANT':
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Asistente en Vivo
              </h1>
              <p className="text-lg text-gray-600">
                Funcionalidad existente optimizada
              </p>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Funcionalidad completa disponible
              </div>
            </div>
            
            <div className="bg-white rounded-xl border-2 border-gray-200 p-8 text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Funcionalidad Implementada
              </h3>
              <p className="text-gray-600 mb-6">
                El modo "Asistente en Vivo" ya está completamente implementado en el sistema.
                Incluye transcripción en tiempo real, análisis SOAP automático y detección de banderas rojas.
              </p>
              
              <div className="space-y-4 mb-6">
                <div className="text-left bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Características disponibles:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Transcripción en tiempo real durante la consulta</li>
                    <li>• Análisis SOAP automático</li>
                    <li>• Detección de banderas rojas</li>
                    <li>• Identificación de hablantes</li>
                    <li>• Notas estructuradas automáticas</li>
                  </ul>
                </div>
              </div>
              
              <button
                onClick={handleLiveAssistantComplete}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Continuar Demo
              </button>
            </div>
            
            <div className="text-center mt-6">
              <button
                onClick={handleBackToSelector}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Volver al selector de modos
              </button>
            </div>
          </div>
        );

      case 'POST_CONSULTATION_DICTATION':
        return (
          <PostConsultationDictation
            patientName={demoData.patientName}
            onComplete={handleDictationComplete}
            onBack={handleBackToSelector}
          />
        );

      case 'MANUAL_WRITING':
        return (
          <ManualWriting
            patientName={demoData.patientName}
            onComplete={handleManualComplete}
            onBack={handleBackToSelector}
          />
        );

      case 'COMPLETE':
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ¡Demo Completada!
              </h1>
              <p className="text-lg text-gray-600">
                Has experimentado el selector de modos de trabajo flexibles
              </p>
            </div>

            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Resumen de la Demo
              </h3>
              
              <div className="space-y-4">
                <div>
                  <span className="font-medium text-gray-900">Modo seleccionado:</span>
                  <span className="ml-2 text-gray-600">
                    {demoData.selectedMode === 'LIVE_ASSISTANT' && 'Asistente en Vivo'}
                    {demoData.selectedMode === 'POST_CONSULTATION_DICTATION' && 'Dictado Post-Consulta'}
                    {demoData.selectedMode === 'MANUAL_WRITING' && 'Redacción Manual'}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-900">Paciente:</span>
                  <span className="ml-2 text-gray-600">{demoData.patientName}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-900">Especialidad:</span>
                  <span className="ml-2 text-gray-600">{demoData.specialty}</span>
                </div>

                {demoData.transcription && (
                  <div>
                    <span className="font-medium text-gray-900">Transcripción generada:</span>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700">
                      {demoData.transcription}
                    </div>
                  </div>
                )}

                {demoData.finalText && (
                  <div>
                    <span className="font-medium text-gray-900">Texto redactado:</span>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700">
                      {demoData.finalText.substring(0, 200)}...
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center space-y-4">
              <button
                onClick={() => {
                  setCurrentStep('SELECTOR');
                  setDemoData({
                    patientName: 'María González',
                    specialty: 'Fisioterapia',
                    selectedMode: null,
                    transcription: '',
                    finalText: ''
                  });
                }}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Probar Otro Modo
              </button>
              
              <div>
                <p className="text-sm text-gray-500">
                  Esta demo muestra la interfaz de selección de modos de trabajo.
                  <br />
                  La funcionalidad completa se implementará en las próximas fases del desarrollo.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Demo: Modos de Trabajo Flexibles
              </h1>
              <p className="text-sm text-gray-600">
                Zero Friction UX - Selecciona cómo quieres trabajar
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Estado: Demo</div>
              <div className="text-xs text-gray-400">AiDuxCare V.2</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        {renderCurrentStep()}
      </div>
    </div>
  );
} 