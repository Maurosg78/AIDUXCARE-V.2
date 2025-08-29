import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranscript } from '../hooks/useTranscript';
import { useNiagaraProcessor } from '../hooks/useNiagaraProcessor';
import { Card, Button } from '../shared/ui';
import { Mic, MicOff, Upload, FileText, Brain, Save, Download } from 'lucide-react';
import { NewPatientModal } from '../components/NewPatientModal';
import { SelectableFindings } from '../components/SelectableFindings';
import { PhysicalEvaluationTab } from '../components/PhysicalEvaluationTab';
import { ProcessingStatus } from '../components/ProcessingStatus';
import type { PhysicalExamResult } from '../types/vertex-ai';

interface PatientData {
  id: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  edad: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  medicoDerivador: string;
  institucionDerivadora: string;
  diagnosticoPrevio: string;
  comorbilidades: string;
  medicamentos: string;
  alergias: string;
  consentimientoFirmado: boolean;
  fechaRegistro: string;
  ultimaModificacion: string;
  modificadoPor: string;
}

export default function ProfessionalWorkflowPage() {
  const { user } = useAuth();
  const { transcript, isRecording, startRecording, stopRecording, setTranscript, isTranscribing } = useTranscript();
  const { processWithNiagara, results: niagaraResults, generateSOAPNote, soapNote } = useNiagaraProcessor();
  
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);
  const [physicalExamResults, setPhysicalExamResults] = useState<PhysicalExamResult[]>([]);
  const [activeTab, setActiveTab] = useState<'analysis' | 'evaluation' | 'soap'>('analysis');
  const [physicalTestsToPerform, setPhysicalTestsToPerform] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      const startTime = Date.now();
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setRecordingTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    } else {
      setRecordingTime('00:00');
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSearch = () => {
    console.log('Buscando paciente:', searchTerm);
  };

  const handleNewPatient = () => {
    setIsNewPatientModalOpen(true);
  };

  const handlePatientCreated = (patient: any) => {
    console.log('🔒 Paciente creado:', patient.id);
    setSelectedPatient(patient);
    setIsNewPatientModalOpen(false);
  };

  const handleGenerateSOAP = async () => {
    if (selectedFindings.length > 0) {
      await generateSOAPNote(selectedFindings, physicalExamResults);
      setActiveTab('soap');
    }
  };

  const handleAnalyzeWithAI = async () => {
    console.log('🧠 Iniciando análisis con IA...');
    setIsAnalyzing(true);
    await processWithNiagara(transcript);
    setIsAnalyzing(false);
  };

  const handleSaveSession = () => {
    console.log('💾 Guardando sesión:', {
      sessionId,
      patientId: selectedPatient?.id,
      transcript,
      findings: selectedFindings,
      examResults: physicalExamResults,
      soapNote
    });
  };

  const handleDownloadReport = () => {
    console.log('📥 Descargando informe...');
  };

  const handleExamResultsChange = (results: any[]) => {
    setPhysicalExamResults(results);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">AiDuxCare - Flujo Profesional</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{user?.email || 'Usuario no autenticado'}</span>
              <Button variant="outline" size="sm">Cerrar Sesión</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-gray-100 border-b py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="ID del paciente (ej: PAC-123456)"
                className="px-3 py-1.5 border rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="outline" size="sm">
                🔍 Buscar
              </Button>
              <Button onClick={handleNewPatient} variant="default" size="sm">
                👤 Nuevo Paciente
              </Button>
            </div>
            <div className="text-xs text-gray-500">
              Sesión: {sessionId} | Cumplimiento: HIPAA/GDPR
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-4">
            <button 
              onClick={() => setActiveTab('analysis')}
              className={`py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'analysis' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              1. Análisis Inicial
            </button>
            <button 
              onClick={() => setActiveTab('evaluation')}
              disabled={!niagaraResults}
              className={`py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'evaluation' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } ${!niagaraResults ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              2. Evaluación Física
            </button>
            <button 
              onClick={() => setActiveTab('soap')}
              disabled={!soapNote}
              className={`py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'soap' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } ${!soapNote ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              3. Informe SOAP
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'analysis' && (
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-4">
              <Card className="p-4">
                <h2 className="font-semibold mb-3">Ficha de paciente</h2>
                {selectedPatient ? (
                  <div className="space-y-1 text-sm">
                    <p><strong>ID:</strong> {selectedPatient.id}</p>
                    <p><strong>Nombre:</strong> {selectedPatient.nombre} {selectedPatient.apellidos}</p>
                    <p><strong>Edad:</strong> {selectedPatient.edad}</p>
                    <p><strong>Teléfono:</strong> {selectedPatient.telefono}</p>
                    <p><strong>Email:</strong> {selectedPatient.email}</p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No hay paciente seleccionado</p>
                    <Button onClick={handleNewPatient} className="mt-2" size="sm">
                      Crear Paciente
                    </Button>
                  </div>
                )}
              </Card>

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
                    disabled={!selectedPatient}
                  >
                    {isRecording ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                    {isRecording ? 'Detener' : 'Grabar'}
                  </Button>
                  <Button variant="outline" disabled={!selectedPatient}>
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                {!selectedPatient && (
                  <p className="text-xs text-orange-500 mt-2">Seleccione un paciente primero</p>
                )}
              </Card>

              <Card className="p-4">
                <h2 className="font-semibold mb-3">Gestión de Sesión</h2>
                <div className="space-y-2">
                  <Button onClick={handleSaveSession} className="w-full" variant="outline">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Sesión
                  </Button>
                  <Button className="w-full" variant="outline">
                    Nueva Sesión
                  </Button>
                  <Button onClick={handleGenerateSOAP} className="w-full" disabled={selectedFindings.length === 0}>
                    <FileText className="w-4 h-4 mr-2" />
                    Generar Informe
                  </Button>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-4">
                <h2 className="font-semibold mb-3">Contenido de la Consulta</h2>
                <textarea
                  className="w-full h-48 p-3 border rounded-md"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Escribir o pegar contenido aquí..."
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={handleAnalyzeWithAI}
                    disabled={!transcript || isAnalyzing}
                    variant="default"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Analizar con IA
                  </Button>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              {(isAnalyzing || isTranscribing || isRecording) && (
                <ProcessingStatus 
                  isRecording={isRecording}
                  isTranscribing={isTranscribing}
                  isAnalyzing={isAnalyzing}
                />
              )}
              
              {niagaraResults && (
                <>
                  <SelectableFindings
                    findings={niagaraResults}
                    onSelectionChange={setSelectedFindings}
                    onExamResultsChange={handleExamResultsChange}
                  />
                  
                  {niagaraResults.entities.some((e: any) => e.text.startsWith('📋')) && (
                    <Button 
                      onClick={() => {
                        const tests = niagaraResults.entities
                          .filter((e: any) => selectedFindings.includes(e.id) && e.text.startsWith('📋'))
                          .map((e: any) => e.text);
                        setPhysicalTestsToPerform(tests);
                        setActiveTab('evaluation');
                      }}
                      className="w-full"
                      variant="default"
                    >
                      Continuar a Evaluación Física
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'evaluation' && (
          <PhysicalEvaluationTab 
            suggestedTests={physicalTestsToPerform}
            onComplete={(results) => {
              setPhysicalExamResults(results);
              handleGenerateSOAP();
            }}
          />
        )}

        {activeTab === 'soap' && soapNote && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Informe SOAP Generado</h2>
              <Button onClick={handleDownloadReport} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-blue-600">Subjetivo</h3>
                <p className="mt-1">{soapNote.subjective}</p>
              </div>
              <div>
                <h3 className="font-semibold text-blue-600">Objetivo</h3>
                <p className="mt-1">{soapNote.objective}</p>
              </div>
              <div>
                <h3 className="font-semibold text-blue-600">Evaluación</h3>
                <p className="mt-1">{soapNote.assessment}</p>
              </div>
              <div>
                <h3 className="font-semibold text-blue-600">Plan</h3>
                <p className="mt-1">{soapNote.plan}</p>
              </div>
            </div>
          </Card>
        )}
      </main>

      <NewPatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onSave={handlePatientCreated}
      />
    </div>
  );
}
