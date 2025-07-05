import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CaptureWorkspace from '../components/CaptureWorkspace';
import TranscriptionArea from '../components/TranscriptionArea';
import ActionBar from '../components/ActionBar';
import EnhancedAudioCaptureService from '../services/EnhancedAudioCaptureService';
import AudioToSOAPBridge, { SOAPData } from '../services/AudioToSOAPBridge';
import PersistenceService from '../services/PersistenceService';
import CryptoService from '../services/CryptoService';

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

// Componente para mostrar estadísticas de notas guardadas
const NotesStatsPanel: React.FC = () => {
  const [stats, setStats] = useState(PersistenceService.getStats());
  const [showHistory, setShowHistory] = useState(false);
  const [notes, setNotes] = useState(PersistenceService.getAllNotes());

  const refreshStats = () => {
    setStats(PersistenceService.getStats());
    setNotes(PersistenceService.getAllNotes());
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return (
    <div style={{ 
      border: '1px solid #ddd', 
      borderRadius: '0.5rem', 
      padding: '1rem', 
      marginTop: '1rem',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0 }}>📊 Estadísticas de Notas</h4>
        <button 
          onClick={refreshStats}
          style={{ 
            padding: '0.25rem 0.5rem', 
            fontSize: '0.8rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          🔄 Actualizar
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{stats.totalNotes}</div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Notas Totales</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats.totalPatients}</div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Pacientes</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.totalSessions}</div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Sesiones</div>
        </div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          style={{ 
            padding: '0.5rem 1rem', 
            fontSize: '0.8rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: showHistory ? '#e9ecef' : 'white',
            cursor: 'pointer'
          }}
        >
          {showHistory ? '📋 Ocultar Historial' : '📋 Ver Historial'}
        </button>
        
        {stats.totalNotes > 0 && (
          <button 
            onClick={() => {
              if (confirm('¿Estás seguro de que quieres limpiar todas las notas?')) {
                PersistenceService.clearAllNotes();
                refreshStats();
                alert('Todas las notas han sido eliminadas');
              }
            }}
            style={{ 
              padding: '0.5rem 1rem', 
              fontSize: '0.8rem',
              border: '1px solid #dc3545',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: '#dc3545',
              cursor: 'pointer'
            }}
          >
            🗑️ Limpiar Todo
          </button>
        )}
      </div>

      {showHistory && notes.length > 0 && (
        <div style={{ marginTop: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
          <h5>Historial de Notas:</h5>
          {notes.slice(-5).reverse().map((note) => (
            <div key={note.id} style={{ 
              padding: '0.5rem', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              marginBottom: '0.5rem',
              backgroundColor: 'white',
              fontSize: '0.8rem'
            }}>
              <div style={{ fontWeight: 'bold' }}>ID: {note.id}</div>
              <div>Paciente: {note.patientId}</div>
              <div>Fecha: {new Date(note.createdAt).toLocaleString()}</div>
              <div>Confianza: {Math.round(note.soapData.confidence * 100)}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ConsultationPage: React.FC = () => {
  // Estados centralizados - única fuente de verdad
  const [transcriptionText, setTranscriptionText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [soapData, setSoapData] = useState<SOAPData | null>(null);
  const [activeTab, setActiveTab] = useState<'capture' | 'evaluation'>('capture');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Instanciar el servicio de audio de forma eficiente
  const audioService = useMemo(() => new EnhancedAudioCaptureService(), []);

  // Verificar soporte del navegador al cargar
  useEffect(() => {
    if (!audioService.isServiceSupported()) {
      setError('Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.');
    }
  }, [audioService]);

  // Callback para transcripción en tiempo real
  const handleTranscriptionUpdate = useCallback((text: string, isFinal: boolean) => {
    setTranscriptionText(text);
    if (isFinal) {
      console.log('Transcripción final recibida:', text);
    }
  }, []);

  // Procesar transcripción a SOAP
  const processTranscriptionToSOAP = useCallback(async (transcript: string) => {
    try {
      setIsProcessing(true);
      console.log('🧠 Procesando transcripción a SOAP...');
      
      const soapResult = await AudioToSOAPBridge.processTranscriptionToSOAP(transcript);
      
      if (AudioToSOAPBridge.validateSOAPData(soapResult)) {
        setSoapData(soapResult);
        console.log('✅ SOAP generado exitosamente:', soapResult);
        
        // Cambiar automáticamente a la pestaña de evaluación si hay datos válidos
        if (soapResult.confidence > 0.3) {
          setActiveTab('evaluation');
        }
      } else {
        console.warn('⚠️ Datos SOAP generados no son válidos');
        setError('Error al generar datos SOAP válidos');
      }
    } catch (error) {
      console.error('Error procesando SOAP:', error);
      setError('Error al procesar la transcripción a formato SOAP');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Manejar inicio/parada de grabación
  const handleMicClick = useCallback(async () => {
    try {
      setError(null);
      
      if (isRecording) {
        // Detener grabación
        const finalTranscript = audioService.stopRecording();
        setIsRecording(false);
        console.log('Grabación detenida. Transcripción final:', finalTranscript);
        
        // Procesar a SOAP automáticamente si hay contenido
        if (finalTranscript.trim()) {
          await processTranscriptionToSOAP(finalTranscript);
        }
      } else {
        // Iniciar grabación
        await audioService.startRecording(handleTranscriptionUpdate);
        setIsRecording(true);
        console.log('Grabación iniciada');
      }
    } catch (error) {
      console.error('Error en grabación:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido en grabación');
      setIsRecording(false);
    }
  }, [isRecording, audioService, handleTranscriptionUpdate, processTranscriptionToSOAP]);

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

      // Verificar soporte de cifrado
      if (!CryptoService.isSupported()) {
        console.warn('Web Crypto API no soportado, guardando sin cifrado');
      }

      // Guardar la nota usando PersistenceService (que internamente usa CryptoService)
      const noteId = await PersistenceService.saveSOAPNote(
        soapData,
        'patient-demo-001', // ID del paciente (en producción vendría del contexto)
        `session-${Date.now()}` // ID de la sesión
      );

      console.log('✅ Nota guardada con ID:', noteId);
      
      // Mostrar feedback exitoso
      alert(`✅ Nota SOAP guardada exitosamente!\n\nID: ${noteId}\nFecha: ${new Date().toLocaleString()}\nConfianza: ${Math.round(soapData.confidence * 100)}%`);
      
      // Opcional: Limpiar el estado para una nueva sesión
      // setTranscriptionText('');
      // setSoapData(null);
      // setActiveTab('capture');

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
          background: '#fee', 
          border: '1px solid #fcc', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          color: '#c33'
        }}>
          ⚠️ {error}
          <button 
            onClick={() => setError(null)}
            style={{ 
              marginLeft: '1rem', 
              background: 'none', 
              border: 'none', 
              color: '#c33', 
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            ×
          </button>
        </div>
      )}

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
                placeholder={isRecording ? "Escuchando... hable ahora" : "La transcripción aparecerá aquí"}
                disabled={isRecording}
              />
              <ActionBar
                isRecording={isRecording}
                onMicClick={handleMicClick}
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
        <div>
          <EvaluationTabContent soapData={soapData} />
          <NotesStatsPanel />
        </div>
      )}
    </div>
  );
};

export default ConsultationPage;
