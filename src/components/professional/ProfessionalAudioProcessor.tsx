/**
 * 🏥 AiDuxCare Professional - Componente de Procesamiento de Audio
 * Integración completa con Ollama NLP para uso profesional
 * 
 * @version 1.0.0
 * @author Implementador Jefe
 */

import React, { useState, useCallback, useRef } from 'react';
import { AudioProcessingServiceProfessional, AudioProcessingResult, QualityAssessment } from '@/services/AudioProcessingServiceProfessional';
import { TranscriptionSegment } from '@/core/audio/AudioCaptureService';
import { AgentSuggestion } from '@/types/agent';
import { Button } from '@/shared/components/UI/Button';
import { AuditLogger } from '@/core/audit/AuditLogger';
import { trackMetric } from '@/services/UsageAnalyticsService';

interface ProfessionalAudioProcessorProps {
  visitId: string;
  userId: string;
  patientId: string;
  onProcessingComplete?: (result: AudioProcessingResult) => void;
  onSuggestionsGenerated?: (suggestions: AgentSuggestion[]) => void;
  onError?: (error: string) => void;
  className?: string;
}

type ProcessingStage = 
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'extracting_entities'
  | 'generating_soap'
  | 'creating_suggestions'
  | 'quality_assessment'
  | 'completed'
  | 'error';

interface ProcessingStatus {
  stage: ProcessingStage;
  progress: number;
  message: string;
  timeElapsed: number;
}

export const ProfessionalAudioProcessor: React.FC<ProfessionalAudioProcessorProps> = ({
  visitId,
  userId,
  patientId,
  onProcessingComplete,
  onSuggestionsGenerated,
  onError,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    stage: 'idle',
    progress: 0,
    message: 'Listo para grabar',
    timeElapsed: 0
  });
  const [result, setResult] = useState<AudioProcessingResult | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Inicia grabación de audio
   */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // Timer de grabación
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setProcessingStatus(prev => ({
          ...prev,
          stage: 'recording',
          message: `Grabando... ${elapsed}s`,
          timeElapsed: elapsed
        }));
      }, 1000);

      // Auditoría
      AuditLogger.log('audio.recording.started', {
        userId,
        visitId,
        patientId
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      onError?.('Error al iniciar grabación');
    }
  }, [userId, visitId, patientId, onError]);

  /**
   * Detiene grabación y procesa audio
   */
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Auditoría
    AuditLogger.log('audio.recording.stopped', {
      userId,
      visitId,
      patientId,
      duration: Date.now() - startTimeRef.current
    });

  }, [userId, visitId, patientId]);

  /**
   * Procesa el audio con pipeline completo
   */
  const processAudio = useCallback(async () => {
    if (!audioBlob) return;

    const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
    
    try {
      // Etapa 1: Transcribiendo
      setProcessingStatus({
        stage: 'transcribing',
        progress: 10,
        message: 'Transcribiendo audio...',
        timeElapsed: 0
      });

      // Etapa 2: Extrayendo entidades
      setTimeout(() => {
        setProcessingStatus({
          stage: 'extracting_entities',
          progress: 30,
          message: 'Extrayendo entidades clínicas...',
          timeElapsed: 0
        });
      }, 1000);

      // Etapa 3: Generando SOAP
      setTimeout(() => {
        setProcessingStatus({
          stage: 'generating_soap',
          progress: 50,
          message: 'Generando notas SOAP...',
          timeElapsed: 0
        });
      }, 2000);

      // Etapa 4: Creando sugerencias
      setTimeout(() => {
        setProcessingStatus({
          stage: 'creating_suggestions',
          progress: 70,
          message: 'Generando sugerencias clínicas...',
          timeElapsed: 0
        });
      }, 3000);

      // Etapa 5: Evaluación de calidad
      setTimeout(() => {
        setProcessingStatus({
          stage: 'quality_assessment',
          progress: 90,
          message: 'Evaluando calidad del procesamiento...',
          timeElapsed: 0
        });
      }, 4000);

      // Procesamiento real
      const processingResult = await AudioProcessingServiceProfessional.processAudioSession(
        file,
        visitId,
        userId,
        patientId,
        {
          specialization: 'fisioterapia',
          enableQualityAssessment: true,
          enableAgentSuggestions: true,
          minConfidenceThreshold: 0.7
        }
      );

      setResult(processingResult);
      
      // Etapa completada
      setProcessingStatus({
        stage: 'completed',
        progress: 100,
        message: 'Procesamiento completado exitosamente',
        timeElapsed: 0
      });

      // Callbacks
      onProcessingComplete?.(processingResult);
      onSuggestionsGenerated?.(processingResult.agentSuggestions);

      // Métrica de éxito
      trackMetric('suggestions_generated', {
        suggestionId: processingResult.processingId,
        suggestionType: 'recommendation',
        suggestionField: 'notes'
      }, userId, visitId);

    } catch (error) {
      console.error('Error processing audio:', error);
      
      setProcessingStatus({
        stage: 'error',
        progress: 0,
        message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timeElapsed: 0
      });
      
      onError?.(error instanceof Error ? error.message : 'Error en procesamiento');
    }
  }, [audioBlob, visitId, userId, patientId, onProcessingComplete, onSuggestionsGenerated, onError]);

  /**
   * Reinicia el procesador
   */
  const reset = useCallback(() => {
    setIsRecording(false);
    setProcessingStatus({
      stage: 'idle',
      progress: 0,
      message: 'Listo para grabar',
      timeElapsed: 0
    });
    setResult(null);
    setAudioBlob(null);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  /**
   * Renderiza indicador de calidad
   */
  const renderQualityIndicator = (assessment: QualityAssessment) => {
    const getColorClass = (level: 'low' | 'medium' | 'high') => {
      switch (level) {
        case 'high': return 'text-green-600 bg-green-100';
        case 'medium': return 'text-yellow-600 bg-yellow-100';
        case 'low': return 'text-red-600 bg-red-100';
      }
    };

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Evaluación de Calidad</h4>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Score General:</span>
          <span className={`px-2 py-1 rounded text-sm font-medium ${getColorClass(assessment.confidence_level)}`}>
            {assessment.overall_score}/100 ({assessment.confidence_level.toUpperCase()})
          </span>
        </div>

        {assessment.red_flags.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
            <h5 className="text-sm font-medium text-red-800 mb-1">⚠️ Indicadores de Alerta</h5>
            <ul className="text-sm text-red-700">
              {assessment.red_flags.map((flag, index) => (
                <li key={index}>• {flag}</li>
              ))}
            </ul>
          </div>
        )}

        {assessment.recommendations.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
            <h5 className="text-sm font-medium text-blue-800 mb-1">💡 Recomendaciones</h5>
            <ul className="text-sm text-blue-700">
              {assessment.recommendations.map((rec, index) => (
                <li key={index}>• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  /**
   * Renderiza progreso de procesamiento
   */
  const renderProgress = () => {
    if (processingStatus.stage === 'idle' || processingStatus.stage === 'recording') {
      return null;
    }

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-900">
            {processingStatus.message}
          </span>
          <span className="text-sm text-blue-700">
            {processingStatus.progress}%
          </span>
        </div>
        
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${processingStatus.progress}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`professional-audio-processor ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🎙️ Procesador de Audio Profesional
        </h3>
        <p className="text-sm text-gray-600">
          Pipeline completo: Audio → Transcripción → NLP → SOAP → Sugerencias
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-4">
        {!isRecording && processingStatus.stage === 'idle' && (
          <Button
            variant="primary"
            onClick={startRecording}
            className="flex items-center gap-2"
          >
            🔴 Iniciar Grabación
          </Button>
        )}

        {isRecording && (
          <Button
            variant="secondary"
            onClick={stopRecording}
            className="flex items-center gap-2 animate-pulse"
          >
            ⏹️ Detener Grabación
          </Button>
        )}

        {audioBlob && processingStatus.stage === 'idle' && (
          <Button
            variant="primary"
            onClick={processAudio}
            className="flex items-center gap-2"
          >
            🤖 Procesar con Ollama
          </Button>
        )}

        {(processingStatus.stage === 'completed' || processingStatus.stage === 'error') && (
          <Button
            variant="outline"
            onClick={reset}
            className="flex items-center gap-2"
          >
            🔄 Nuevo Procesamiento
          </Button>
        )}
      </div>

      {/* Status */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            isRecording ? 'bg-red-500 animate-pulse' : 
            processingStatus.stage === 'completed' ? 'bg-green-500' :
            processingStatus.stage === 'error' ? 'bg-red-500' :
            processingStatus.stage !== 'idle' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
          }`} />
          <span className="text-sm font-medium text-gray-700">
            {processingStatus.message}
          </span>
        </div>
      </div>

      {/* Progress */}
      {renderProgress()}

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Resumen */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">✅ Procesamiento Completado</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-green-700 font-medium">Entidades:</span>
                <div className="text-green-800">{result.entities.length}</div>
              </div>
              <div>
                <span className="text-green-700 font-medium">Sugerencias:</span>
                <div className="text-green-800">{result.agentSuggestions.length}</div>
              </div>
              <div>
                <span className="text-green-700 font-medium">Tiempo:</span>
                <div className="text-green-800">{result.metrics.total_processing_time_ms}ms</div>
              </div>
              <div>
                <span className="text-green-700 font-medium">Costo:</span>
                <div className="text-green-800 font-bold">$0.00</div>
              </div>
            </div>
          </div>

          {/* Quality Assessment */}
          {renderQualityIndicator(result.qualityAssessment)}

          {/* SOAP Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">📋 Nota SOAP Generada</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">S:</span>
                <span className="text-gray-600 ml-2">
                  {result.soapNotes.subjective.substring(0, 100)}...
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">O:</span>
                <span className="text-gray-600 ml-2">
                  {result.soapNotes.objective.substring(0, 100)}...
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">A:</span>
                <span className="text-gray-600 ml-2">
                  {result.soapNotes.assessment.substring(0, 100)}...
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">P:</span>
                <span className="text-gray-600 ml-2">
                  {result.soapNotes.plan.substring(0, 100)}...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalAudioProcessor; 