import { safeLogger } from "../utils/safeLogger";
import { useState, useEffect } from 'react';
import { useLanguage } from "../contexts/LanguageContext";
import { PhysicalEvaluationTab } from '../components/PhysicalEvaluationTab';
import { DocGenDisplay } from '../components/SOAPDisplay';
import { WorkflowAnalysisTab } from '../components/WorkflowAnalysisTab';
import { ProfessionalDocGenGenerator } from "../services/soap-generator-professional";
import { useChunkedAnalysis } from '../hooks/useChunkedAnalysis';
import { useTranscript } from '../hooks/useTranscript';
import { useSharedWorkflowState } from "../hooks/useSharedWorkflowState";
import { useTimer } from '../hooks/useTimer';
import { useRecording } from "../hooks/useRecording";
import { extractPatientFromTranscript, toPatientData } from "../utils/patientDataExtractor";

interface PatientData {
  id: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  edad: string;
  telefono: string;
  email: string;
}

const ProfessionalWorkflowPage = () => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'evaluation' | 'DocGen'>('analysis');
  const { t } = useLanguage();
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const { setAnalysisResults: setSharedAnalysisResults } = useSharedWorkflowState();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [DocGenNote, setDocGenNote] = useState<any>(null);
  const [DocGenLoading, setDocGenLoading] = useState(false);
  const [shouldSuggestPro, setShouldSuggestPro] = useState(false);
  const [credits, setCredits] = useState(150);
  
  const { analyzeWithChunking, isProcessing, progress, currentMessage } = useChunkedAnalysis();
  const { time, reset } = useTimer(isRecording);
  const { transcript: recordedTranscript, isRecording: isRecordingAudio, startRecording, stopRecording } = useRecording();
  
  const consumeCredits = (amount: number): boolean => {
    if (credits >= amount) {
      safeLogger.debug(`💳 Using ${amount} créditos. Remaining: ${credits - amount}`);
      setCredits(prev => prev - amount);
      return true;
    }
    return false;
  };

  const mockPatients = [
    { 
      id: "HC-2", 
      nombre: "María", 
      apellidos: "López Martínez", 
      fechaNacimiento: "1952-03-15",
      edad: "72 años",
      telefono: "555-0123",
      email: "maria.lopez@email.com"
    }
  ];

  useEffect(() => {
    if (mockPatients.length > 0 && !selectedPatient) {
      setSelectedPatient(mockPatients[0]);
    }
  }, []);

  const canAccessDocGen = () => {
    return analysisResults && transcript && transcript.length > 50;
  };

  const handleAnalyze = async () => {
    const textLength = transcript.length;
    const estimatedCredits = textLength > 5000 ? 2 : 1;
    
    if (!consumeCredits(estimatedCredits)) {
      alert("Créditos insuficientes");
      return;
    }
    
    const result = await analyzeWithChunking(transcript, false);
    
    if (result && result.analysis) {
      safeLogger.debug("✅ Análisis completado:", result);
      (window as any).__lastAnalysisResult = result;
      setAnalysisResults(result.analysis);
      setSharedAnalysisResults(result.analysis);
    }
  };

  const handleStartRecording = async () => {
    setIsRecording(true);
    await startRecording();
    safeLogger.debug("🎙️ Grabación iniciada");
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    await stopRecording();
    setTranscript(recordedTranscript);
    safeLogger.debug("⏹️ Grabación detenida");
  };

  const handleGenerateDocGen = async () => {
    if (!analysisResults || !transcript) return;
    
    setDocGenLoading(true);
    
    try {
      const { completedTests } = useSharedWorkflowState.getState();
      
      safeLogger.debug('[DocGen] Starting generation with loading indicator...');
      
      const extractedPatient = extractPatientFromTranscript(transcript);
      const patientData = extractedPatient 
        ? toPatientData(extractedPatient) 
        : selectedPatient;
      
      const sessionType = extractedPatient?.sessionType || 'initial';
      
      safeLogger.debug('[DocGen] Using patient data:', patientData);
      safeLogger.debug('[DocGen] Session type:', sessionType);
      
      const DocGenRequest = {
        analysisResults,
        physicalTestResults: completedTests || [],
        patientData,
        selectedItems: selectedIds,
        sessionContext: {
          duration: 30,
          location: 'clinic',
          sessionType
        }
      };
      
      const DocGen = await ProfessionalDocGenGenerator.generateWithVertex(DocGenRequest);
      setDocGenNote(DocGen);
      safeLogger.debug('[DocGen] Generation completed successfully');
      
    } catch (error) {
      safeLogger.error('[DocGen] Error generating:', error);
    } finally {
      setDocGenLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b px-6 py-4">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">{t.workflow}</h1>
                <div className="text-sm text-gray-500">
                  {credits} credits available
                </div>
              </div>
              
              <nav className="flex space-x-8 mt-4">
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analysis'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.analysis}
                </button>
                <button
                  onClick={() => setActiveTab('evaluation')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'evaluation'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.physicalEval}
                </button>
                <button
                  onClick={() => canAccessDocGen() && setActiveTab('DocGen')}
                  disabled={!canAccessDocGen()}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'DocGen'
                      ? 'border-blue-500 text-blue-600'
                      : canAccessDocGen()
                        ? 'border-transparent text-gray-500 hover:text-gray-700'
                        : 'border-transparent text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {t.DocGen} {!canAccessDocGen() && '(Requires Analysis)'}
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'analysis' && (
                <WorkflowAnalysisTab
                  selectedPatient={selectedPatient}
                  transcript={transcript}
                  setTranscript={setTranscript}
                  isRecording={isRecording}
                  startRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  onAnalyze={handleAnalyze}
                  isProcessing={isProcessing}
                  niagaraResults={analysisResults}
                  progress={progress}
                  currentMessage={currentMessage}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  onNavigateToEvaluation={() => setActiveTab("evaluation")}
                />
              )}
              
              {activeTab === 'evaluation' && (
                <PhysicalEvaluationTab   selectedTests={[]} patientData={selectedPatient as any} onSaveResults={() => {}} />
              )}
              
              {activeTab === 'DocGen' && (
                <div>
                  {DocGenLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <div className="text-left">
                          <p className="text-lg font-medium text-gray-700">Generating DocGen Note...</p>
                          <p className="text-sm text-gray-500">AI is analyzing clinical data and creating documentation</p>
                        </div>
                      </div>
                    </div>
                  ) : DocGenNote ? (
                    <DocGenDisplay DocGenNote={DocGenNote} patientData={(selectedPatient as any) ?? {}} onDownloadPDF={() => {}} />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">
                        Ready to generate DocGen note from analysis data
                      </p>
                      <button
                        onClick={handleGenerateDocGen}
                        disabled={!analysisResults || DocGenLoading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                      >
                        {DocGenLoading && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        {DocGenLoading ? 'Generating...' : 'Generate DocGen Note'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfessionalWorkflowPage;
