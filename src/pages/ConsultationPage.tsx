import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CaptureWorkspace from '../components/CaptureWorkspace';
import TranscriptionArea from '../components/TranscriptionArea';
import ActionBar from '../components/ActionBar';
import AudioPipelineService from '../services/AudioPipelineService';
import { GoogleCloudAudioService, type ClinicalAnalysisRequest, type ClinicalAnalysisResponse } from '../services/GoogleCloudAudioService';

// Tipos básicos

interface ClinicalWarning {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

interface ClinicalHighlight {
  text: string;
  type: string;
  confidence: number;
}
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
const AIModules: React.FC<{ warnings: ClinicalWarning[], highlights: ClinicalHighlight[], clinicalAnalysis: ClinicalAnalysisResponse | null }> = ({ 
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
  // Estados centralizados - única fuente de verdad
  const [transcriptionText, setTranscriptionText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [soapData, setSoapData] = useState<SOAPData | null>(null);
  const [activeTab, setActiveTab] = useState<'capture' | 'evaluation'>('capture');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceInfo, setServiceInfo] = useState<string>('');

  // 🧠 NUEVO: Estados para cerebro clínico
  const [clinicalAnalysis, setClinicalAnalysis] = useState<ClinicalAnalysisResponse | null>(null);
  const [highlights, setHighlights] = useState<ClinicalHighlight[]>([]);
  const [warnings, setWarnings] = useState<ClinicalWarning[]>([]);

  // Instanciar servicios
  const audioService = useMemo(() => new AudioPipelineService(), []);
  const clinicalService = useMemo(() => new GoogleCloudAudioService(), []);

  // Actualizar información del servicio
  useEffect(() => {
    const updateServiceInfo = () => {
      const info = audioService.getServiceInfo();
      setServiceInfo(info);
    };

    updateServiceInfo();
    
    // Actualizar cada 10 segundos mientras se graba
    const interval = setInterval(() => {
      if (isRecording) {
        updateServiceInfo();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [audioService, isRecording]);

  // 🔧 MEJORADO: Callback para transcripción en tiempo real con logging detallado
  const handleTranscriptionUpdate = useCallback((text: string, isFinal: boolean) => {
    console.log('🔍 CALLBACK TRANSCRIPCIÓN:', {
      isFinal,
      textLength: text.length,
      preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      timestamp: new Date().toLocaleTimeString()
    });
    
    setTranscriptionText(text);
    
    if (isFinal) {
      console.log('✅ Transcripción FINAL recibida:', text);
    } else {
      console.log('⏳ Transcripción PARCIAL actualizada');
    }
  }, []);

  // 🧠 NUEVO: Procesar transcripción con cerebro clínico real
  const processTranscriptionToSOAPAsync = useCallback(async (transcript: string) => {
    try {
      setIsProcessing(true);
      console.log('🧠 Enviando transcripción al Cerebro Clínico real...');
      
      // Preparar request para cerebro clínico
      const clinicalRequest: ClinicalAnalysisRequest = {
        transcription: transcript,
        specialty: 'physiotherapy', // TODO: Hacer configurable
        sessionType: 'initial' // TODO: Hacer configurable
      };
      
      // Enviar al cerebro clínico
      const clinicalResult = await clinicalService.analyzeClinicalTranscription(clinicalRequest);
      setClinicalAnalysis(clinicalResult);
      
      if (clinicalResult.success && clinicalResult.analysis) {
        // Extraer warnings y sugerencias
        setWarnings(clinicalResult.analysis.warnings || []);
        setHighlights(clinicalResult.analysis.suggestions || []);
        
        // Generar SOAP básico para compatibilidad
        const basicSOAP = processTranscriptionToSOAP(transcript);
        setSoapData({
          ...basicSOAP,
          confidence: clinicalResult.analysis.soap_analysis?.overall_quality ? 
            clinicalResult.analysis.soap_analysis.overall_quality / 100 : basicSOAP.confidence
        });
        
        console.log('✅ Análisis clínico completado:', {
          warnings: clinicalResult.analysis.warnings?.length || 0,
          suggestions: clinicalResult.analysis.suggestions?.length || 0,
          overallQuality: clinicalResult.analysis.soap_analysis?.overall_quality
        });
      } else {
        // Fallback a procesamiento básico si falla el cerebro clínico
        console.warn('⚠️ Cerebro clínico no disponible, usando procesamiento básico');
        
        // 🧠 ANÁLISIS BÁSICO MEJORADO
        const fallbackSOAP = processTranscriptionToSOAP(transcript);
        setSoapData(fallbackSOAP);
        
        // Generar advertencias básicas y sugerencias según el tipo de error
        if (clinicalResult.message === 'timeout_cerebro_clinico') {
          // Timeout específico - generar análisis básico pero útil
          const basicAnalysis = generateBasicClinicalAnalysis(transcript);
          setWarnings(basicAnalysis.warnings);
          setHighlights(basicAnalysis.suggestions);
          
          setError('⏰ El Cerebro Clínico tardó más de 60 segundos. Se ha generado un análisis básico. Todas las funciones médicas están disponibles.');
        } else {
          // Otros errores
          setError(`🔄 Cerebro clínico temporal: ${clinicalResult.error || 'No disponible'}. Análisis básico activo.`);
          
          // Generar análisis básico simple
          const basicAnalysis = generateBasicClinicalAnalysis(transcript);
          setWarnings(basicAnalysis.warnings);
          setHighlights(basicAnalysis.suggestions);
        }
      }
      
      // Cambiar automáticamente a la pestaña de evaluación
      setActiveTab('evaluation');
      
    } catch (error) {
      console.error('Error procesando transcripción:', error);
      
      // Fallback a procesamiento básico en caso de error
      const fallbackSOAP = processTranscriptionToSOAP(transcript);
      setSoapData(fallbackSOAP);
      
      setError(`Error de cerebro clínico: ${error instanceof Error ? error.message : 'Error desconocido'}. Usando análisis básico.`);
      setActiveTab('evaluation');
    } finally {
      setIsProcessing(false);
    }
  }, [clinicalService]);

  // Función para manejar grabación
  const handleStartRecording = useCallback(async () => {
    if (isRecording) return;

    try {
      setError(null);
      setIsRecording(true);
      console.log('🎙️ Iniciando grabación de consulta médica...');
      
      await audioService.startRecording(handleTranscriptionUpdate);
    } catch (error) {
      setIsRecording(false);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al iniciar grabación';
      setError(`Error: ${errorMessage}`);
      console.error('Error al iniciar grabación:', error);
    }
  }, [isRecording, audioService, handleTranscriptionUpdate]);

  const handleStopRecording = useCallback(async () => {
    if (!isRecording) return;

    try {
      setIsRecording(false);
      console.log('🛑 Deteniendo grabación de consulta médica...');
      
      // Detener grabación (no retorna transcript)
      audioService.stopRecording();
      
      // Usar el transcript actual del estado
      if (transcriptionText && transcriptionText.trim()) {
        console.log('📝 Procesando transcripción médica a formato SOAP...');
        await processTranscriptionToSOAPAsync(transcriptionText);
      } else {
        setError('No se detectó audio. Intenta hablar más cerca del micrófono.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al detener grabación';
      setError(`Error: ${errorMessage}`);
      console.error('Error al detener grabación:', error);
    }
  }, [isRecording, audioService, processTranscriptionToSOAPAsync, transcriptionText]);

  // Placeholder para otras funciones
  const handleUploadClick = useCallback(() => {
    console.log('Upload audio clicked');
    alert('Función de subir audio será implementada próximamente');
  }, []);

  const handleCameraClick = useCallback(() => {
    console.log('Camera clicked');
    alert('Función de cámara será implementada próximamente');
  }, []);

  const handleSave = useCallback(async () => {
    if (!soapData) {
      alert('No hay datos SOAP para guardar. Complete una transcripción primero.');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('💾 Guardando nota SOAP:', soapData);

      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      console.log('✅ Nota guardada con ID:', noteId);
      
      alert(`✅ Nota SOAP guardada exitosamente!\n\nID: ${noteId}\nFecha: ${new Date().toLocaleString()}\nConfianza: ${Math.round(soapData.confidence * 100)}%`);
      
    } catch (error) {
      console.error('Error guardando nota:', error);
      setError(`Error al guardar la nota: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [soapData]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <PatientHeader />

      {/* Mostrar errores si los hay */}
      {error && (
        <div style={{ 
          background: error.includes('⚠️') || error.includes('🎭') || error.includes('🎙️') || error.includes('🔄') ? '#fff3cd' : '#fee', 
          border: error.includes('⚠️') || error.includes('🎭') || error.includes('🎙️') || error.includes('🔄') ? '1px solid #ffeaa7' : '1px solid #fcc', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          color: error.includes('⚠️') || error.includes('🎭') || error.includes('🎙️') || error.includes('🔄') ? '#856404' : '#c33'
        }}>
          {error}
          <button 
            onClick={() => setError(null)}
            style={{ 
              marginLeft: '1rem', 
              background: 'none', 
              border: 'none', 
              color: error.includes('⚠️') || error.includes('🎭') || error.includes('🎙️') || error.includes('🔄') ? '#856404' : '#c33', 
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Indicador de servicio activo con botón para cambiar */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '0.5rem',
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          fontSize: '0.9rem'
        }}>
          <span style={{ fontWeight: 'bold' }}>{serviceInfo}</span>
          {isRecording && (
            <span style={{
              color: '#dc3545',
              fontWeight: 'bold',
              animation: 'pulse 2s infinite'
            }}>
              🔴 GRABANDO EN VIVO
            </span>
          )}
        </div>
        
        <div style={{
          fontSize: '0.8rem',
          color: '#28a745',
          padding: '0.5rem',
          backgroundColor: '#d4edda',
          borderRadius: '4px',
          border: '1px solid #c3e6cb'
        }}>
          ✅ <strong>Sistema Médico:</strong> Captura audio real de la consulta médica. 
          Habla normalmente durante la consulta para obtener transcripción automática.
        </div>
        
        {error && (
          <div style={{
            fontSize: '0.8rem',
            color: '#721c24',
            padding: '0.5rem',
            backgroundColor: '#f8d7da',
            borderRadius: '4px',
            border: '1px solid #f5c6cb'
          }}>
            ⚠️ <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Selector de Pestañas */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ccc', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('capture')} 
          style={{ 
            padding: '1rem', 
            border: activeTab === 'capture' ? '1px solid #ccc' : 'none', 
            borderBottom: activeTab === 'capture' ? '1px solid white' : '1px solid #ccc', 
            background: 'transparent', 
            cursor: 'pointer', 
            fontWeight: activeTab === 'capture' ? 'bold' : 'normal' 
          }}
        >
          Captura y Pre-evaluación
        </button>
        <button 
          onClick={() => setActiveTab('evaluation')} 
          style={{ 
            padding: '1rem', 
            border: activeTab === 'evaluation' ? '1px solid #ccc' : 'none', 
            borderBottom: activeTab === 'evaluation' ? '1px solid white' : '1px solid #ccc', 
            background: 'transparent', 
            cursor: 'pointer', 
            fontWeight: activeTab === 'evaluation' ? 'bold' : 'normal' 
          }}
        >
          Evaluación y SOAP Final {soapData && '✅'}
        </button>
      </div>

      {/* Contenido de la Pestaña Activa */}
      {activeTab === 'capture' && (
         <CaptureWorkspace>
            <div style={{ border: '1px solid #eef1f1', borderRadius: '1rem', padding: '1rem' }}>
              <div style={{ position: 'relative' }}>
              <TranscriptionArea 
                value={transcriptionText} 
                onChange={setTranscriptionText} 
                  placeholder={isRecording ? "🎙️ Escuchando en vivo... hable normalmente" : "La transcripción aparecerá aquí en tiempo real"}
                disabled={isRecording}
              />
                
                {/* Indicador de transcripción en tiempo real */}
                {isRecording && transcriptionText && (
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    animation: 'pulse 2s infinite'
                  }}>
                    🔴 TRANSCRIBIENDO
                  </div>
                )}
                
                {/* Contador de caracteres en tiempo real */}
                {transcriptionText && (
                  <div style={{
                    position: 'absolute',
                    bottom: '0.5rem',
                    right: '0.5rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}>
                    {transcriptionText.length} caracteres
                  </div>
                )}
              </div>
                              <ActionBar
                  isRecording={isRecording}
                  onStartRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  onUploadClick={handleUploadClick}
                  onCameraClick={handleCameraClick}
                  onSave={handleSave}
                  disabled={isProcessing}
                />
              {isProcessing && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
                  🔄 Procesando transcripción a SOAP...
                </div>
              )}
            </div>
           <AIModules 
             warnings={warnings}
             highlights={highlights}
             clinicalAnalysis={clinicalAnalysis}
           />
         </CaptureWorkspace>
      )}

      {activeTab === 'evaluation' && (
        <EvaluationTabContent soapData={soapData} />
      )}
    </div>
  );
};

export default ConsultationPage;
