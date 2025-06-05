/**
 * 🎯 MVP Core Flow Page - AiDuxCare V.2
 * Flujo completo: Record audio → View SOAP → View Evidence → Save
 * Prioridad 2 del MVP - Enfoque funcional puro
 */

import React, { useState, useCallback } from 'react';
import { ProfessionalAudioProcessor } from '@/components/professional/ProfessionalAudioProcessor';
import EvidencePanel from '@/components/evidence/EvidencePanel';
import { EMRFormService } from '@/core/services/EMRFormService';
import { AudioProcessingResult } from '@/services/AudioProcessingServiceProfessional';
import { SOAPNotes } from '@/types/nlp';
import { Button } from '@/shared/components/UI/Button';
import { StructuredError, ErrorLogger } from '@/types/errors';

// IDs temporales para MVP (en producción vendrían de contexto/props)
const MVP_VISIT_ID = 'mvp-visit-001';
const MVP_USER_ID = 'mvp-user-001';
const MVP_PATIENT_ID = 'mvp-patient-001';

interface MVPFlowState {
  step: 'audio' | 'processing' | 'results' | 'saved' | 'error';
  audioProcessingResult: AudioProcessingResult | null;
  soapNotes: SOAPNotes | null;
  isSaving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  processingError: {
    userMessage: string;
    technicalDetails: string;
    retryable: boolean;
    fallbackUsed: boolean;
  } | null;
}

export const MVPCorePage: React.FC = () => {
  const [flowState, setFlowState] = useState<MVPFlowState>({
    step: 'audio',
    audioProcessingResult: null,
    soapNotes: null,
    isSaving: false,
    saveSuccess: false,
    saveError: null,
    processingError: null
  });

  /**
   * Handler cuando el procesamiento de audio se completa
   */
  const handleProcessingComplete = useCallback((result: AudioProcessingResult) => {
    console.log('🎉 Procesamiento completado:', result);
    
    setFlowState(prev => ({
      ...prev,
      step: 'results',
      audioProcessingResult: result,
      soapNotes: result.soapNotes,
      processingError: null // Limpiar errores previos
    }));
  }, []);

  /**
   * Handler para guardar el formulario SOAP
   */
  const handleSaveSOAP = useCallback(async () => {
    if (!flowState.soapNotes) return;

    setFlowState(prev => ({
      ...prev,
      isSaving: true,
      saveError: null
    }));

    try {
      // Crear objeto EMR Form compatible
      const emrForm = {
        visitId: MVP_VISIT_ID,
        patientId: MVP_PATIENT_ID,
        professionalId: MVP_USER_ID,
        subjective: flowState.soapNotes.subjective,
        objective: flowState.soapNotes.objective,
        assessment: flowState.soapNotes.assessment,
        plan: flowState.soapNotes.plan,
        notes: `Generado automáticamente en MVP Core Flow - ${new Date().toISOString()}`,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Guardar usando EMRFormService
      const saveSuccess = await EMRFormService.updateEMRForm(emrForm, MVP_USER_ID);

      if (saveSuccess) {
        setFlowState(prev => ({
          ...prev,
          step: 'saved',
          isSaving: false,
          saveSuccess: true
        }));
        
        console.log('✅ SOAP guardado exitosamente');
      } else {
        throw new Error('Failed to save SOAP notes');
      }

    } catch (error) {
      console.error('❌ Error guardando SOAP:', error);
      
      setFlowState(prev => ({
        ...prev,
        isSaving: false,
        saveError: error instanceof Error ? error.message : 'Error desconocido'
      }));
    }
  }, [flowState.soapNotes]);

  /**
   * Handler para errores de procesamiento de audio
   */
  const handleProcessingError = useCallback((error: any) => {
    console.error('❌ Error en procesamiento de audio:', error);
    
    // Determinar si es un error estructurado o error genérico
    let errorInfo;
    
    if (error && typeof error === 'object' && error.userMessage) {
      // Es un error estructurado
      errorInfo = {
        userMessage: error.userMessage,
        technicalDetails: error.technicalDetails || error.message || 'Error técnico no especificado',
        retryable: error.retryable || false,
        fallbackUsed: error.fallbackAvailable || false
      };
    } else {
      // Error genérico - crear estructura básica
      const errorMessage = error instanceof Error ? error.message : String(error);
      errorInfo = {
        userMessage: 'Hubo un problema al procesar el audio. Por favor, intente de nuevo.',
        technicalDetails: errorMessage,
        retryable: true,
        fallbackUsed: false
      };
    }
    
    setFlowState(prev => ({
      ...prev,
      step: 'error',
      processingError: errorInfo
    }));
  }, []);

  /**
   * Reiniciar el flujo MVP
   */
  const handleRestartFlow = useCallback(() => {
    setFlowState({
      step: 'audio',
      audioProcessingResult: null,
      soapNotes: null,
      isSaving: false,
      saveSuccess: false,
      saveError: null,
      processingError: null
    });
  }, []);

  /**
   * Renderizar el paso actual del flujo
   */
  const renderCurrentStep = () => {
    switch (flowState.step) {
      case 'audio':
      case 'processing':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                🎙️ Paso 1: Grabación y Procesamiento
              </h2>
              <p className="text-gray-600">
                Graba la sesión clínica y procesa automáticamente con IA
              </p>
            </div>

            <ProfessionalAudioProcessor
              visitId={MVP_VISIT_ID}
              userId={MVP_USER_ID}
              patientId={MVP_PATIENT_ID}
              onProcessingComplete={handleProcessingComplete}
              onError={handleProcessingError}
            />
          </div>
        );

      case 'results':
        return (
          <div className="space-y-6">
            {/* SOAP Display */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    📋 Paso 2: Notas SOAP Generadas
                  </h2>
                  <p className="text-gray-600">
                    Documentación clínica estructurada automáticamente
                  </p>
                </div>
                
                {flowState.soapNotes?.confidence_score && (
                  <div className="bg-green-50 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-green-700">
                      Confianza: {Math.round(flowState.soapNotes.confidence_score * 100)}%
                    </span>
                  </div>
                )}
              </div>

              {flowState.soapNotes && (
                <div className="space-y-4">
                  {/* Subjective */}
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-gray-900 mb-2">SUBJECTIVE</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {flowState.soapNotes.subjective}
                    </p>
                  </div>

                  {/* Objective */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-gray-900 mb-2">OBJECTIVE</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {flowState.soapNotes.objective}
                    </p>
                  </div>

                  {/* Assessment */}
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h3 className="font-semibold text-gray-900 mb-2">ASSESSMENT</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {flowState.soapNotes.assessment}
                    </p>
                  </div>

                  {/* Plan */}
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold text-gray-900 mb-2">PLAN</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {flowState.soapNotes.plan}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Evidence Panel */}
            {flowState.audioProcessingResult && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  🔬 Paso 3: Evidencia Científica
                </h2>
                <p className="text-gray-600 mb-4">
                  Referencias bibliográficas y evidencia basada en la sesión
                </p>
                
                <EvidencePanel 
                  entities={flowState.audioProcessingResult.entities}
                  agentSuggestions={flowState.audioProcessingResult.agentSuggestions}
                />
              </div>
            )}

            {/* Save Button */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                💾 Paso 4: Guardar Documentación
              </h2>
              <p className="text-gray-600 mb-4">
                Persistir la documentación clínica en el sistema
              </p>

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSaveSOAP}
                  disabled={flowState.isSaving}
                  className="flex items-center gap-2 px-6 py-3"
                >
                  {flowState.isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      💾 Guardar SOAP
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleRestartFlow}
                  className="flex items-center gap-2"
                >
                  🔄 Nuevo Flujo
                </Button>
              </div>

              {flowState.saveError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">
                    ❌ Error: {flowState.saveError}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'saved':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-16 w-16 bg-green-100 rounded-full">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Flujo MVP Completado!
              </h2>
              
              <p className="text-gray-600 mb-6">
                La documentación clínica ha sido guardada exitosamente en el sistema.
              </p>

              <div className="space-y-3">
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Flujo Ejecutado:</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>✅ Audio grabado y procesado</div>
                    <div>✅ SOAP generado automáticamente</div>
                    <div>✅ Evidencia científica obtenida</div>
                    <div>✅ Documentación guardada en BD</div>
                  </div>
                </div>

                <Button
                  onClick={handleRestartFlow}
                  className="w-full flex items-center justify-center gap-2"
                >
                  🔄 Iniciar Nuevo Flujo MVP
                </Button>
              </div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-16 w-16 bg-red-100 rounded-full">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Error en el Procesamiento
              </h2>
              
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-700 font-medium mb-2">
                    {flowState.processingError?.userMessage || 'Hubo un problema inesperado.'}
                  </p>
                  
                  {flowState.processingError?.fallbackUsed && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                      <p className="text-yellow-800 text-sm">
                        ℹ️ Se activaron sistemas de respaldo automáticamente. 
                        Los datos generados requieren revisión manual.
                      </p>
                    </div>
                  )}
                </div>

                {/* Detalles técnicos colapsables */}
                <details className="text-left">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    🔧 Mostrar detalles técnicos
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono text-gray-700 break-all">
                    {flowState.processingError?.technicalDetails || 'No hay detalles técnicos disponibles'}
                  </div>
                </details>
              </div>

              <div className="flex justify-center gap-4">
                {flowState.processingError?.retryable && (
                  <Button
                    onClick={handleRestartFlow}
                    className="flex items-center gap-2"
                  >
                    🔄 Intentar de Nuevo
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={handleRestartFlow}
                  className="flex items-center gap-2"
                >
                  🏠 Volver al Inicio
                </Button>
              </div>

              {/* Información de contacto para soporte */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 Si el problema persiste, contacta al equipo de soporte técnico con los detalles técnicos mostrados arriba.
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
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎯 MVP Core Flow - AiDuxCare
        </h1>
        <p className="text-gray-600">
          Flujo completo de documentación clínica automatizada: Record → Process → View → Save
        </p>
        
        {/* Progress Indicator */}
        <div className="mt-4 flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${
            ['audio', 'processing', 'results', 'saved'].includes(flowState.step) ? 'bg-blue-500' : 'bg-gray-300'
          }`} />
          <div className={`h-2 w-2 rounded-full ${
            ['results', 'saved'].includes(flowState.step) ? 'bg-blue-500' : 'bg-gray-300'
          }`} />
          <div className={`h-2 w-2 rounded-full ${
            flowState.step === 'saved' ? 'bg-blue-500' : 'bg-gray-300'
          }`} />
        </div>
      </div>

      {/* Current Step */}
      {renderCurrentStep()}
    </div>
  );
};

export default MVPCorePage;