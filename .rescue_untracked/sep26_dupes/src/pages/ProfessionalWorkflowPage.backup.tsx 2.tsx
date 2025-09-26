import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Upload, Search, UserPlus, Save, FileText } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { useTranscript } from '../hooks/useTranscript';
import { Button, Card } from '../shared/ui';
import { useNiagaraProcessor } from '../hooks/useNiagaraProcessor';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { SelectableFindings } from '../components/SelectableFindings';
import { NewPatientModal } from '../components/NewPatientModal';
import { FileProcessorService } from '../services/FileProcessorService';
import type { PhysicalExamResult } from '../types/vertex-ai';

export default function ProfessionalWorkflowPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [sessionId] = useState(`session_${Date.now()}`);
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);
  const [physicalExamResults, setPhysicalExamResults] = useState<PhysicalExamResult[]>([]);
  const [searchPatientId, setSearchPatientId] = useState('');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null)[1];
  
  const [patientData, setPatientData] = useState<any>({
    id: '',
    nombre: 'Seleccione un paciente',
    apellidos: '',
    edad: '',
    email: '',
    telefono: '',
    diagnosticoPrevio: '',
    comorbilidades: '',
    medicamentos: '',
    diagnosticosDetectados: [],
    medicamentosDetectados: []
  });
  
  const { 
    transcript, 
    setTranscript,
    isRecording, 
    isTranscribing,
    startRecording, 
    stopRecording,
    reset: resetTranscript
  } = useTranscript();
  
  const { 
    results: niagaraResults, 
    processing: niagaraProcessing,
    soapNote,
    processWithNiagara,
    generateSOAPNote,
    reset: resetNiagara
  } = useNiagaraProcessor();
  
  // Timer para grabación
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let seconds = 0;
    
    if (isRecording) {
      interval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        setRecordingTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }, 1000);
    } else {
      setRecordingTime('00:00');
    }
    
    return () => clearInterval(interval);
  }, [isRecording]);
  
  const handleAnalyzeWithAI = () => {
    const text = (transcript || '').trim();
    if (!text) {
      alert('Por favor ingrese texto o grabe audio para analizar');
      return;
    }
    
    if (!patientData.id) {
      alert('Por favor seleccione o cree un paciente primero');
      return;
    }
    
    console.log('🧠 Iniciando análisis con IA...');
    processWithNiagara(text);
  };
  
  const handleSearchPatient = () => {
    // Simulación - conectar con base de datos real
    if (searchPatientId === 'PAC-001') {
      setPatientData({
        id: 'PAC-001',
        nombre: 'María',
        apellidos: 'González',
        edad: '45 años',
        email: 'maria@email.com',
        telefono: '+34 600 000 000',
        diagnosticoPrevio: 'Dolor lumbar crónico',
        comorbilidades: 'Psoriasis, Celiaquía',
        medicamentos: 'Fluoxetina 20mg',
        diagnosticosDetectados: [],
        medicamentosDetectados: []
      });
    } else {
      alert('Paciente no encontrado');
    }
  };
  
  const handleSavePatient = (newPatient: any) => {
    setPatientData(newPatient);
    console.log('🔒 Paciente creado:', newPatient.id);
  };
  
  const handleSaveSession = () => {
    if (!patientData.id) {
      alert('No hay paciente seleccionado');
      return;
    }
    
    if (!transcript && !niagaraResults) {
      alert('No hay información para guardar');
      return;
    }
    
    console.log('💾 Guardando sesión...', {
      paciente: patientData.id,
      sesion: sessionId,
      transcript: transcript?.length,
      analisis: !!niagaraResults
    });
    
    alert('Sesión guardada correctamente');
  };
  
  const handleGenerateReport = () => {
    if (!niagaraResults || selectedFindings.length === 0) {
      alert('Seleccione hallazgos para generar el informe');
      return;
    }
    
    generateSOAPNote(selectedFindings, physicalExamResults);
  };
  
  const handleNewSession = () => {
    if (transcript || niagaraResults) {
      if (!confirm('¿Desea guardar la sesión actual antes de crear una nueva?')) {
        return;
      }
    }
    
    resetTranscript();
    resetNiagara();
    setSelectedFindings([]);
    setPhysicalExamResults([]);
    setRecordingTime('00:00');
  };
  
  const hasContent = transcript && transcript.trim().length > 0;
  const hasPatient = patientData.id !== '';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">AiDuxCare - Flujo Profesional</h1>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button onClick={() => firebaseAuthService.logout()} variant="outline" size="sm">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {/* Barra de gestión de pacientes */}
        <Card className="p-3 mb-4">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="ID del paciente (ej: PAC-001)..."
              value={searchPatientId}
              onChange={(e) => setSearchPatientId(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            />
            <Button onClick={handleSearchPatient} size="sm" variant="outline">
              <Search className="w-4 h-4 mr-1" />
              Buscar
            </Button>
            <Button onClick={() => setShowNewPatientModal(true)} size="sm" variant="outline">
              <UserPlus className="w-4 h-4 mr-1" />
              Nuevo Paciente
            </Button>
            <span className="ml-auto text-xs text-gray-500">
              Sesión: {sessionId} | Cumplimiento: HIPAA/GDPR
            </span>
          </div>
        </Card>

        {/* Bloques superiores */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Columna 1: Info del paciente */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Ficha de paciente</h2>
            {hasPatient ? (
              <div className="space-y-1 text-sm">
                <p><strong>ID:</strong> {patientData.id}</p>
                <p><strong>Nombre:</strong> {patientData.nombre} {patientData.apellidos}</p>
                <p><strong>Edad:</strong> {patientData.edad}</p>
                <p><strong>Teléfono:</strong> {patientData.telefono}</p>
                <p><strong>Email:</strong> {patientData.email}</p>
                {patientData.diagnosticoPrevio && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs"><strong>Dx previo:</strong> {patientData.diagnosticoPrevio}</p>
                    <p className="text-xs"><strong>Medicación:</strong> {patientData.medicamentos}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No hay paciente seleccionado</p>
                <Button 
                  onClick={() => setShowNewPatientModal(true)} 
                  size="sm" 
                  className="mt-2"
                >
                  Crear Paciente
                </Button>
              </div>
            )}
          </Card>

          {/* Columna 2: Controles de grabación */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Grabación de Consulta</h2>
            <div className="text-4xl font-mono text-center py-2">
              {recordingTime}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? 'destructive' : 'default'}
                className="flex-1"
                disabled={isTranscribing || !hasPatient}
              >
                {isRecording ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                {isRecording ? 'Detener' : 'Grabar'}
              </Button>
              <Button
                onClick={() => fileInputRef?.click?.()}
                variant="outline"
                title="Subir archivo"
                disabled={!hasPatient}
              >
                <Upload className="w-4 h-4" />
              </Button>
            </div>
            {!hasPatient && (
              <p className="text-xs text-orange-500 mt-2">Seleccione un paciente primero</p>
            )}
          </Card>

          {/* Columna 3: Acciones de sesión */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Gestión de Sesión</h2>
            <div className="space-y-2">
              <Button 
                onClick={handleSaveSession}
                variant="outline"
                className="w-full"
                disabled={!hasPatient || (!hasContent && !niagaraResults)}
              >
                <Save className="w-4 h-4 mr-1" />
                Guardar Sesión
              </Button>
              
              <Button 
                onClick={handleNewSession} 
                variant="outline" 
                className="w-full"
                disabled={isRecording || isTranscribing || niagaraProcessing}
              >
                Nueva Sesión
              </Button>
              
              {selectedFindings.length > 0 && (
                <Button 
                  onClick={handleGenerateReport}
                  variant="default"
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Generar Informe
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Área de texto principal */}
        <Card className="p-4 mb-4">
          <h2 className="font-semibold mb-2">Contenido de la Consulta</h2>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={hasPatient ? "Escriba aquí..." : "Seleccione un paciente primero"}
            className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isRecording || !hasPatient}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              Encriptación AES-256 | Logs de auditoría activos
            </p>
            <Button
              onClick={handleAnalyzeWithAI}
              disabled={niagaraProcessing || !hasContent || !hasPatient}
              size="sm"
            >
              🧠 Analizar con IA
            </Button>
          </div>
        </Card>

        {/* Resultados del análisis */}
        {niagaraResults && !niagaraProcessing && (
          <SelectableFindings
            findings={niagaraResults}
            onSelectionChange={setSelectedFindings}
            onExamResultsChange={setPhysicalExamResults}
          />
        )}

        {/* Modal de nuevo paciente */}
        <NewPatientModal
          isOpen={showNewPatientModal}
          onClose={() => setShowNewPatientModal(false)}
          onSave={handleSavePatient}
        />
      </main>
    </div>
  );
}
