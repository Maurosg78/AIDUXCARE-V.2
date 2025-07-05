import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CaptureWorkspace from '../components/CaptureWorkspace';
import TranscriptionArea from '../components/TranscriptionArea';
import ActionBar from '../components/ActionBar';

// Tipos básicos
interface SOAPData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  confidence: number;
  timestamp: string;
}

// Servicio de audio simulado simple
class SimpleAudioService {
  private isRecording: boolean = false;
  private currentTranscript: string = '';
  private callback: ((text: string, isFinal: boolean) => void) | null = null;
  private timer: NodeJS.Timeout | null = null;

  private sampleTexts = [
    "El paciente presenta dolor en el hombro derecho desde hace una semana.",
    "Refiere molestias que aumentan con el movimiento y mejoran con el reposo.",
    "No hay antecedentes de trauma previo.",
    "Examen físico muestra limitación en la abducción del brazo.",
    "Se observa dolor a la palpación en el área del tendón supraespinoso.",
    "Recomiendo radiografía de hombro y tratamiento con antiinflamatorios.",
    "Control en una semana para evaluar evolución."
  ];

  async startRecording(callback: (text: string, isFinal: boolean) => void): Promise<void> {
    if (this.isRecording) return;
    
    this.isRecording = true;
    this.callback = callback;
    this.currentTranscript = '';
    
    console.log('🎭 Iniciando grabación simulada...');
    
    // Simular transcripción gradual
    let sentenceIndex = 0;
    this.timer = setInterval(() => {
      if (!this.isRecording || sentenceIndex >= this.sampleTexts.length) {
        return;
      }
      
      const sentence = this.sampleTexts[sentenceIndex];
      this.currentTranscript += sentence + ' ';
      
      if (this.callback) {
        this.callback(this.currentTranscript, true);
      }
      
      sentenceIndex++;
    }, 2000);
  }

  stopRecording(): string {
    this.isRecording = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.callback = null;
    console.log('🎭 Grabación simulada detenida');
    return this.currentTranscript.trim();
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  isServiceSupported(): boolean {
    return true;
  }
}

// Servicio SOAP simple
class SimpleSOAPService {
  static processTranscriptionToSOAP(transcription: string): SOAPData {
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
  }
}

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

  // Instanciar el servicio de audio simple
  const audioService = useMemo(() => new SimpleAudioService(), []);

  // Callback para transcripción en tiempo real
  const handleTranscriptionUpdate = useCallback((text: string, isFinal: boolean) => {
    setTranscriptionText(text);
    if (isFinal) {
      console.log('Transcripción recibida:', text);
    }
  }, []);

  // Procesar transcripción a SOAP
  const processTranscriptionToSOAP = useCallback(async (transcript: string) => {
    try {
      setIsProcessing(true);
      console.log('🧠 Procesando transcripción a SOAP...');
      
      // Simular un pequeño delay para mostrar el procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const soapResult = SimpleSOAPService.processTranscriptionToSOAP(transcript);
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
      setError(`❌ Error en grabación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
          background: '#fee', 
          border: '1px solid #fcc', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          color: '#c33'
        }}>
          {error}
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

      {/* Indicador de servicio activo */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0.5rem 1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        marginBottom: '1rem',
        fontSize: '0.8rem',
        color: '#666'
      }}>
        <span>🎭 Modo Demostración - Transcripción Simulada</span>
        <span>
          {isRecording ? '🔴 Grabando...' : '⚫ Detenido'}
        </span>
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
                placeholder={isRecording ? "🎭 Transcripción simulada apareciendo..." : "La transcripción aparecerá aquí"}
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
        <EvaluationTabContent soapData={soapData} />
      )}
    </div>
  );
};

export default ConsultationPage;
