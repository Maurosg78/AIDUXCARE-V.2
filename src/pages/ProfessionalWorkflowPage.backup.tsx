import { useState, useEffect } from 'react';
import { PatientData } from '../types/PatientData';
import { PhysicalEvaluationTab } from '../components/PhysicalEvaluationTab';
import { SOAPDisplay } from '../components/SOAPDisplay';
import { WorkflowAnalysisTab } from '../components/WorkflowAnalysisTab';
import { SOAPGenerator } from '../services/soap-generator';
import { useNiagaraProcessor } from '../hooks/useNiagaraProcessor';
import { useTranscript } from '../hooks/useTranscript';
import { useTimer } from '../hooks/useTimer';
import sessionService from '../services/sessionService';

const ProfessionalWorkflowPage = () => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'evaluation' | 'soap'>('analysis');
  const [selectedPatient] = useState<PatientData>({
    id: "PAC-TEST-001",
    nombre: "María",
    apellidos: "González",
    fechaNacimiento: "1980-01-01",
    edad: "44 años",
    email: "maria@test.com",
    telefono: "555-0123",
    direccion: "Calle Test 123",
    ciudad: "Valencia",
    codigoPostal: "46001",
    medicoDerivador: "Dr. Test",
    institucionDerivadora: "Hospital Test",
    diagnosticoPrevio: "Dolor cervical irradiado",
    comorbilidades: "Hipertensión controlada",
    medicamentos: "Ibuprofeno 400mg cada 8h",
    alergias: "Penicilina",
    consentimientoFirmado: true,
    fechaRegistro: new Date().toISOString(),
    ultimaModificacion: new Date().toISOString(),
    modificadoPor: "Sistema"
  });

  const { 
    processText, 
    generateSOAPNote, 
    niagaraResults, 
    soapNote,
    isProcessing: isAnalyzing 
  } = useNiagaraProcessor();

  const { 
    transcript, 
    isRecording, 
    startRecording, 
    stopRecording,
    setTranscript 
  } = useTranscript();

  const { time: recordingTime } = useTimer(isRecording);
  
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);
  const [physicalTestsToPerform, setPhysicalTestsToPerform] = useState<string[]>([]);
  const [physicalExamResults, setPhysicalExamResults] = useState<any[]>([]);
  const [localSoapNote, setLocalSoapNote] = useState<any>(null);

  const handleAnalyzeWithAI = async () => {
    console.log("Texto a analizar:", transcript);    if (!transcript) return;
    console.log("Enviando texto al procesador:", transcript);    await processText(transcript);
  };

  const handleExamResultsChange = (results: any[]) => {
    setPhysicalExamResults(results);
  };

  const handleGenerateSOAP = async () => {
    try {
      const soapData = SOAPGenerator.generateFromData(
        niagaraResults?.entities || [],
        physicalExamResults,
        selectedPatient
      );
      setLocalSoapNote(soapData);
      
      // Guardar en Firestore
      try {
        const sessionId = await sessionService.createSession({
          userId: "temp-user", // TODO: usar auth real
          patientName: `${selectedPatient.nombre} ${selectedPatient.apellidos}`,
          patientId: selectedPatient.id,
          transcript: transcript,
          soapNote: soapData,
          physicalTests: physicalExamResults,
          status: "completed"
        });
        console.log("Sesión guardada:", sessionId);
      } catch (error) {
        console.error("Error guardando sesión:", error);
      }
      
      if (generateSOAPNote) {
        generateSOAPNote(selectedFindings, physicalExamResults);
      }
    } catch (error) {
      console.error("Error generando SOAP:", error);
    }
  };

  const handleDownloadReport = async () => {
    const { handleDownloadPDF } = await import("../utils/pdf-handler");
    await handleDownloadPDF(localSoapNote || soapNote, selectedPatient, physicalExamResults);
  };

  useEffect(() => {
    if (soapNote) {
      setLocalSoapNote(soapNote);
    }
  }, [soapNote]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">AiDuxCare - Flujo Profesional</h1>
          <span className="text-sm text-gray-600">mauricio@aiduxcare.com</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-3 px-1 border-b-2 ${
                activeTab === 'analysis' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              1. Análisis Inicial
            </button>
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`py-3 px-1 border-b-2 ${
                activeTab === 'evaluation' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              2. Evaluación Física
            </button>
            <button
              onClick={() => setActiveTab('soap')}
              className={`py-3 px-1 border-b-2 ${
                activeTab === 'soap' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              3. SOAP Report
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-4">
        {activeTab === 'analysis' && (
          <WorkflowAnalysisTab
            selectedPatient={selectedPatient}
            transcript={transcript}
            setTranscript={setTranscript}
            isRecording={isRecording}
            startRecording={startRecording}
            stopRecording={stopRecording}
            recordingTime={recordingTime}
            isAnalyzing={isAnalyzing}
            isTranscribing={false}
            onAnalyze={handleAnalyzeWithAI}
            niagaraResults={niagaraResults}
            selectedFindings={selectedFindings}
            setSelectedFindings={setSelectedFindings}
            onGenerateSOAP={handleGenerateSOAP}
// Reemplazar líneas 178-184 en ProfessionalWorkflowPage.tsx
// Este es el código correcto para onContinueToEvaluation
            onContinueToEvaluation={() => {
              // Extraer tests seleccionados del rawResponse
              const selectedTestIds = selectedFindings.filter(id => id.startsWith('test-'));
              let testsToPerform = [];
              
              if (niagaraResults?.rawResponse) {
                try {
                  const rawJson = JSON.parse(
                    niagaraResults.rawResponse.replace(/```json\n?/g, '').replace(/```/g, '')
                  );
                  if (rawJson.evaluaciones_fisicas_sugeridas) {
                    testsToPerform = rawJson.evaluaciones_fisicas_sugeridas
                      .filter((test, index) => selectedTestIds.includes(`test-${index}`))
                      .map(test => test.split(':')[0].trim()); // Solo el nombre del test
                  }
                } catch (e) {
                  console.error('Error extrayendo tests:', e);
                }
              }
              
              console.log(`Pasando ${testsToPerform.length} tests a evaluación física`);
              setPhysicalTestsToPerform(testsToPerform);
              setActiveTab("evaluation");
            }}
            handleExamResultsChange={handleExamResultsChange}
          />
        )}

        {activeTab === 'evaluation' && (
          <PhysicalEvaluationTab
            suggestedTests={physicalTestsToPerform}
            onComplete={(results) => {
              setPhysicalExamResults(results);
              handleGenerateSOAP();
              setActiveTab('soap');
            }}
          />
        )}

        {activeTab === 'soap' && localSoapNote && (
          <SOAPDisplay
            soapNote={localSoapNote}
            patientData={selectedPatient}
            onDownloadPDF={handleDownloadReport}
          />
        )}
      </main>
    </div>
  );
};

export default ProfessionalWorkflowPage;
