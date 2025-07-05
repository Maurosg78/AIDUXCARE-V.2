import React from 'react';
import CaptureWorkspace from '../components/CaptureWorkspace';
import TranscriptionArea from '../components/TranscriptionArea';
import ActionBar from '../components/ActionBar';

// Placeholder para el header del paciente y los módulos de IA
const PatientHeader = () => <div style={{ padding: '1rem', border: '1px dashed grey', marginBottom: '1rem' }}>[Header del Paciente]</div>;
const AIModules = () => <div style={{ padding: '1rem', border: '1px dashed grey', marginTop: '1rem' }}>[Módulos de Highlights, Advertencias y Preguntas IA]</div>;
const EvaluationTabContent = () => <div style={{ padding: '1rem', border: '1px dashed grey' }}>[Contenido de la Pestaña de Evaluación: Figura Humana y Editor SOAP]</div>;

const ConsultationPage: React.FC = () => {
  // Estados y lógica para los componentes de captura irán aquí
  const [transcription, setTranscription] = React.useState('');
  const [isRecording, setIsRecording] = React.useState(false);

  // Tabs simples para la demostración de la estructura
  const [activeTab, setActiveTab] = React.useState<'capture' | 'evaluation'>('capture');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <PatientHeader />

      {/* Selector de Pestañas */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ccc', marginBottom: '1.5rem' }}>
        <button onClick={() => setActiveTab('capture')} style={{ padding: '1rem', border: activeTab === 'capture' ? '1px solid #ccc' : 'none', borderBottom: activeTab === 'capture' ? '1px solid white' : '1px solid #ccc', background: 'transparent', cursor: 'pointer', fontWeight: activeTab === 'capture' ? 'bold' : 'normal' }}>
          Captura y Pre-evaluación
        </button>
        <button onClick={() => setActiveTab('evaluation')} style={{ padding: '1rem', border: activeTab === 'evaluation' ? '1px solid #ccc' : 'none', borderBottom: activeTab === 'evaluation' ? '1px solid white' : '1px solid #ccc', background: 'transparent', cursor: 'pointer', fontWeight: activeTab === 'evaluation' ? 'bold' : 'normal' }}>
          Evaluación y SOAP Final
        </button>
      </div>

      {/* Contenido de la Pestaña Activa */}
      {activeTab === 'capture' && (
         <CaptureWorkspace>
            <div style={{ border: '1px solid #eef1f1', borderRadius: '1rem', padding: '1rem' }}>
              <TranscriptionArea value={transcription} onChange={setTranscription} />
              <ActionBar
                isRecording={isRecording}
                onMicClick={() => setIsRecording(!isRecording)} // Lógica de placeholder
                onUploadClick={() => alert('Upload clicked')}
                onCameraClick={() => alert('Camera clicked')}
                onSave={() => alert('Save clicked')}
              />
            </div>
           <AIModules />
         </CaptureWorkspace>
      )}

      {activeTab === 'evaluation' && (
        <EvaluationTabContent />
      )}
    </div>
  );
};

export default ConsultationPage;
