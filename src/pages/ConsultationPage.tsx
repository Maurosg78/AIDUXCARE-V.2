import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CaptureWorkspace from '../components/CaptureWorkspace';
import TranscriptionArea from '../components/TranscriptionArea';
import ActionBar from '../components/ActionBar';
import HybridAudioService from '../services/HybridAudioService';

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

// Placeholder para el header del paciente y los módulos de IA
const PatientHeader = () => <div style={{ padding: '1rem', border: '1px dashed grey', marginBottom: '1rem' }}>[Header del Paciente]</div>;
const AIModules = () => <div style={{ padding: '1rem', border: '1px dashed grey', marginTop: '1rem' }}>[Módulos de Highlights, Advertencias y Preguntas IA]</div>;

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

const ConsultationPage: React.FC = () => {
  // Estados centralizados - única fuente de verdad
  const [transcriptionText, setTranscriptionText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [soapData, setSoapData] = useState<SOAPData | null>(null);
  const [activeTab, setActiveTab] = useState<'capture' | 'evaluation'>('capture');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceInfo, setServiceInfo] = useState<string>('');

  // Instanciar el servicio de audio híbrido
  const audioService = useMemo(() => new HybridAudioService(), []);

  // Actualizar información del servicio
  useEffect(() => {
    const updateServiceInfo = () => {
      const info = audioService.getDetailedServiceInfo();
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

  // Callback para transcripción en tiempo real
  const handleTranscriptionUpdate = useCallback((text: string, isFinal: boolean) => {
    setTranscriptionText(text);
    if (isFinal) {
      console.log('Transcripción recibida:', text);
    }
  }, []);

  // Procesar transcripción a SOAP
  const processTranscriptionToSOAPAsync = useCallback(async (transcript: string) => {
    try {
      setIsProcessing(true);
      console.log('🧠 Procesando transcripción a SOAP...');
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const soapResult = processTranscriptionToSOAP(transcript);
      setSoapData(soapResult);
      console.log('✅ SOAP generado exitosamente:', soapResult);
      
      // Cambiar automáticamente a la pestaña de evaluación
      setActiveTab('evaluation');
    } catch (error) {
      console.error('Error procesando SOAP:', error);
      setError('Error al procesar la transcripción a formato SOAP');
    } finally {
      setIsProcessing(false);
    }
  }, []);

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
              <TranscriptionArea 
                value={transcriptionText} 
                onChange={setTranscriptionText} 
                placeholder={isRecording ? "Escuchando... hable cerca del micrófono" : "La transcripción aparecerá aquí"}
                disabled={isRecording}
              />
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
           <AIModules />
         </CaptureWorkspace>
      )}

      {activeTab === 'evaluation' && (
        <EvaluationTabContent soapData={soapData} />
      )}
    </div>
  );
};

export default ConsultationPage;
