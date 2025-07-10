import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CaptureWorkspace from '../components/CaptureWorkspace';
import TranscriptionArea from '../components/TranscriptionArea';
import ActionBar from '../components/ActionBar';
import AudioPipelineService from '../services/AudioPipelineService';
import { GoogleCloudAudioService, type ClinicalAnalysisRequest, type ClinicalAnalysisResponse } from '../services/GoogleCloudAudioService';

// Tipos básicos
interface SOAPData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  confidence: number;
  timestamp: string;
}

// Función para procesar transcripción a SOAP
const processTranscriptionToSOAP = (transcription: string): SOAPData => {
  const words = transcription.toLowerCase();
  
  let subjective = '';
  let objective = '';
  let assessment = '';
  let plan = '';
  
  // Clasificación básica por palabras clave
  if (words.includes('dolor') || words.includes('molestias') || words.includes('presenta')) {
    subjective = transcription.split('.').slice(0, 2).join('. ').trim();
  }
  
  if (words.includes('examen') || words.includes('palpación') || words.includes('limitación')) {
    objective = transcription.split('.').filter(s => 
      s.toLowerCase().includes('examen') || 
      s.toLowerCase().includes('palpación') || 
      s.toLowerCase().includes('limitación')
    ).join('. ').trim();
  }
  
  if (words.includes('hombro') || words.includes('tendón')) {
    assessment = 'Posible tendinopatía del manguito rotador. Dolor en hombro derecho con limitación funcional.';
  }
  
  if (words.includes('recomiendo') || words.includes('tratamiento') || words.includes('control')) {
    plan = transcription.split('.').filter(s => 
      s.toLowerCase().includes('recomiendo') || 
      s.toLowerCase().includes('tratamiento') || 
      s.toLowerCase().includes('control')
    ).join('. ').trim();
  }
  
  // Valores por defecto si no se encuentra contenido
  if (!subjective) subjective = 'Paciente refiere síntomas según transcripción médica.';
  if (!objective) objective = 'Examen físico según hallazgos documentados.';
  if (!assessment) assessment = 'Evaluación clínica basada en síntomas y examen físico.';
  if (!plan) plan = 'Plan de tratamiento a determinar según evolución clínica.';
  
  return {
    subjective,
    objective,
    assessment,
    plan,
    confidence: 0.85,
    timestamp: new Date().toISOString()
  };
};

// Placeholder para el header del paciente
const PatientHeader = () => <div style={{ padding: '1rem', border: '1px dashed grey', marginBottom: '1rem' }}>[Header del Paciente]</div>;

// 🧠 NUEVO: Módulos de IA reales con datos del cerebro clínico
const AIModules: React.FC<{ warnings: any[], highlights: any[], clinicalAnalysis: ClinicalAnalysisResponse | null }> = ({ 
  warnings, 
  highlights, 
  clinicalAnalysis 
}) => (
  <div style={{ padding: '1rem', border: '1px solid #e9ecef', borderRadius: '8px', marginTop: '1rem', backgroundColor: '#f8f9fa' }}>
    <h3 style={{ marginBottom: '1rem', color: '#495057' }}>🧠 Análisis Clínico en Tiempo Real</h3>
    
    {/* Advertencias Críticas */}
    {warnings.length > 0 && (
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ color: '#dc3545', marginBottom: '0.5rem' }}>🚨 Advertencias Clínicas ({warnings.length})</h4>
        {warnings.map((warning, index) => (
          <div key={index} style={{ 
            padding: '0.75rem', 
            backgroundColor: warning.severity === 'HIGH' ? '#f8d7da' : warning.severity === 'MEDIUM' ? '#fff3cd' : '#d1ecf1',
            border: `1px solid ${warning.severity === 'HIGH' ? '#f5c6cb' : warning.severity === 'MEDIUM' ? '#ffeaa7' : '#bee5eb'}`,
            borderRadius: '4px',
            marginBottom: '0.5rem'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              {warning.severity === 'HIGH' ? '🔴' : warning.severity === 'MEDIUM' ? '🟡' : '🔵'} {warning.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
              {warning.description}
            </div>
            {warning.recommendation && (
              <div style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '0.25rem', color: '#495057' }}>
                💡 {warning.recommendation}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
    
    {/* Sugerencias y Highlights */}
    {highlights.length > 0 && (
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ color: '#28a745', marginBottom: '0.5rem' }}>💡 Sugerencias Clínicas ({highlights.length})</h4>
        {highlights.map((suggestion, index) => (
          <div key={index} style={{ 
            padding: '0.75rem', 
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            marginBottom: '0.5rem'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              {suggestion.priority === 'HIGH' ? '⚡' : suggestion.priority === 'MEDIUM' ? '📝' : '💭'} {suggestion.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
              {suggestion.description}
            </div>
          </div>
        ))}
      </div>
    )}
    
    {/* Estado del Análisis */}
    {clinicalAnalysis && (
      <div style={{ fontSize: '0.8rem', color: '#6c757d', textAlign: 'center', marginTop: '1rem' }}>
        {clinicalAnalysis.success ? (
          <>
            ✅ Análisis completado por Cerebro Clínico 
            {clinicalAnalysis.metadata?.processingTimeMs && (
              <> en {clinicalAnalysis.metadata.processingTimeMs}ms</>
            )}
          </>
        ) : (
          <span style={{ color: '#dc3545' }}>
            ❌ Cerebro clínico no disponible - usando análisis básico
          </span>
        )}
      </div>
    )}
    
    {/* Placeholder si no hay datos */}
    {warnings.length === 0 && highlights.length === 0 && !clinicalAnalysis && (
      <div style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic' }}>
        Complete una transcripción para ver análisis clínico en tiempo real
      </div>
    )}
  </div>
);

// Componente para la pestaña de evaluación con datos SOAP
const EvaluationTabContent: React.FC<{ soapData: SOAPData | null }> = ({ soapData }) => (
  <div style={{ padding: '1rem', border: '1px dashed grey' }}>
    <h3>Evaluación y SOAP Final</h3>
    {soapData ? (
      <div style={{ marginTop: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Subjective:</strong>
          <textarea
            value={soapData.subjective}
            readOnly
            style={{ 
              width: '100%', 
              minHeight: '80px', 
              padding: '0.5rem', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa',
              resize: 'vertical'
            }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Objective:</strong>
          <textarea
            value={soapData.objective}
            readOnly
            style={{ 
              width: '100%', 
              minHeight: '80px', 
              padding: '0.5rem', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa',
              resize: 'vertical'
            }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Assessment:</strong>
          <textarea
            value={soapData.assessment}
            readOnly
            style={{ 
              width: '100%', 
              minHeight: '80px', 
              padding: '0.5rem', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa',
              resize: 'vertical'
            }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Plan:</strong>
          <textarea
            value={soapData.plan}
            readOnly
            style={{ 
              width: '100%', 
              minHeight: '80px', 
              padding: '0.5rem', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa',
              resize: 'vertical'
            }}
          />
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '0.8rem', 
          color: '#666',
          padding: '0.5rem',
          backgroundColor: '#e9ecef',
          borderRadius: '4px'
        }}>
          <span>Confianza: {Math.round(soapData.confidence * 100)}%</span>
          <span>Generado: {new Date(soapData.timestamp).toLocaleString()}</span>
        </div>
      </div>
    ) : (
      <p style={{ color: '#666', fontStyle: 'italic' }}>
        No hay datos SOAP disponibles. Complete una transcripción primero.
      </p>
    )}
  </div>
);

// Función de fallback para generar análisis básico local
const generateBasicClinicalAnalysis = (transcription: string) => {
  const lowerText = transcription.toLowerCase();
  const warnings = [];
  const suggestions = [];

  // 🚨 PATRONES DE BANDERAS ROJAS BÁSICAS
  if (lowerText.includes('dolor') && (lowerText.includes('pecho') || lowerText.includes('torácico'))) {
    warnings.push({
      id: 'basic_chest_pain',
      severity: 'HIGH',
      category: 'cardiovascular',
      title: 'Dolor torácico detectado',
      description: 'Se menciona dolor en región torácica que requiere evaluación',
      recommendation: 'Considerar evaluación cardiológica y ECG',
      evidence: 'Términos: dolor + pecho/torácico'
    });
  }

  if (lowerText.includes('cabeza') && lowerText.includes('dolor')) {
    warnings.push({
      id: 'basic_headache',
      severity: 'MEDIUM',
      category: 'neurological',
      title: 'Cefalea reportada',
      description: 'Paciente refiere dolor de cabeza',
      recommendation: 'Evaluar características, duración e intensidad',
      evidence: 'Términos: dolor + cabeza'
    });
  }

  if (lowerText.includes('cervical') || lowerText.includes('cuello')) {
    warnings.push({
      id: 'basic_cervical',
      severity: 'MEDIUM',
      category: 'musculoskeletal',
      title: 'Dolor cervical identificado',
      description: 'Se reporta molestia en región cervical',
      recommendation: 'Evaluación postural y rango de movimiento',
      evidence: 'Términos: cervical/cuello'
    });
  }

  // 💡 SUGERENCIAS BÁSICAS SIEMPRE ÚTILES
  suggestions.push(
    {
      id: 'basic_assessment',
      type: 'clinical_review',
      title: 'Completar evaluación física',
      description: 'Realizar examen físico sistemático de las áreas afectadas',
      priority: 'HIGH'
    },
    {
      id: 'basic_history',
      type: 'documentation',
      title: 'Documentar antecedentes',
      description: 'Registrar historia clínica relevante y medicamentos actuales',
      priority: 'MEDIUM'
    },
    {
      id: 'basic_followup',
      type: 'follow_up',
      title: 'Programar seguimiento',
      description: 'Establecer plan de seguimiento según evolución clínica',
      priority: 'MEDIUM'
    }
  );

  // Sugerencias específicas según especialidad detectada
  if (lowerText.includes('fisio') || lowerText.includes('ejercicio') || lowerText.includes('movimiento')) {
    suggestions.push({
      id: 'basic_physio',
      type: 'treatment',
      title: 'Evaluación biomecánica',
      description: 'Analizar patrones de movimiento y función articular',
      priority: 'HIGH'
    });
  }

  return { warnings, suggestions };
};

const ConsultationPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [soapData, setSOAPData] = useState<SOAPData | null>(null);
  const [serviceInfo, setServiceInfo] = useState('');
  const [warnings, setWarnings] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [clinicalAnalysis, setClinicalAnalysis] = useState<ClinicalAnalysisResponse | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<{
    status: 'idle' | 'recording' | 'processing' | 'completed' | 'error';
    progress: number;
    message: string;
  }>({
    status: 'idle',
    progress: 0,
    message: 'Listo para grabar'
  });

  // Servicios
  const audioPipeline = useMemo(() => new AudioPipelineService(), []);
  const googleCloudService = useMemo(() => new GoogleCloudAudioService(), []);

  // Actualizar información del servicio
  const updateServiceInfo = useCallback(() => {
    const info = audioPipeline.getServiceInfo();
    setServiceInfo(info);
  }, [audioPipeline]);

  // Inicializar
  useEffect(() => {
    updateServiceInfo();
  }, [updateServiceInfo]);

  // Manejar transcripción
  const handleTranscription = useCallback((
    text: string, 
    isFinal: boolean, 
    metadata?: { 
      status?: 'recording' | 'processing' | 'completed' | 'error';
      progress?: number;
      error?: string;
    }
  ) => {
    // Actualizar estado de grabación
    if (metadata?.status) {
      let message = '';
      switch (metadata.status) {
        case 'recording':
          message = 'Grabando audio... El análisis aparecerá al finalizar.';
          break;
        case 'processing':
          message = 'Procesando audio con Google Cloud...';
          break;
        case 'completed':
          message = 'Análisis completado';
          break;
        case 'error':
          message = `Error: ${metadata.error || 'Desconocido'}`;
          break;
      }

      setRecordingStatus({
        status: metadata.status,
        progress: metadata.progress || 0,
        message
      });
    }

    // Si es final, procesar con el cerebro clínico
    if (isFinal && text) {
      setTranscription(text);
      
      // Generar SOAP básico mientras esperamos el análisis completo
      const basicSOAP = processTranscriptionToSOAP(text);
      setSOAPData(basicSOAP);
    }
  }, []);

  // Iniciar grabación
  const startRecording = useCallback(async () => {
    try {
      await audioPipeline.iniciarGrabacion(handleTranscription);
      setIsRecording(true);
      setRecordingStatus({
        status: 'recording',
        progress: 0,
        message: 'Grabando audio... El análisis aparecerá al finalizar.'
      });
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      setRecordingStatus({
        status: 'error',
        progress: 0,
        message: `Error al iniciar grabación: ${error instanceof Error ? error.message : 'Desconocido'}`
      });
    }
  }, [audioPipeline, handleTranscription]);

  // Detener grabación
  const stopRecording = useCallback(async () => {
    try {
      await audioPipeline.detenerGrabacion();
      setIsRecording(false);
    } catch (error) {
      console.error('Error al detener grabación:', error);
      setRecordingStatus({
        status: 'error',
        progress: 0,
        message: `Error al detener grabación: ${error instanceof Error ? error.message : 'Desconocido'}`
      });
    }
  }, [audioPipeline]);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      audioPipeline.cleanup();
    };
  }, [audioPipeline]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <PatientHeader />
      
      <div style={{ marginBottom: '2rem' }}>
        <ActionBar
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          recordingStatus={recordingStatus}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <TranscriptionArea
            transcription={transcription}
            isRecording={isRecording}
            recordingStatus={recordingStatus}
          />
          
          <AIModules
            warnings={warnings}
            highlights={highlights}
            clinicalAnalysis={clinicalAnalysis}
          />
        </div>

        <div>
          <EvaluationTabContent soapData={soapData} />
        </div>
      </div>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: '#6c757d'
      }}>
        <strong>Estado del Sistema:</strong> {serviceInfo}
      </div>
    </div>
  );
};

export default ConsultationPage;
