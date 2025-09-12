import React, { useState, useEffect } from 'react';
import { WorkflowAnalysisTab } from '../components/WorkflowAnalysisTab';
import { PhysicalEvaluationTab } from '../components/PhysicalEvaluationTab';
import { SOAPReportTab } from '../components/SOAPReportTab';
import { useControlledReasoning } from '../hooks/useControlledReasoning';
import { useTranscription } from '../hooks/useTranscription';
import { useLanguage } from '../contexts/LanguageContext';
import { CreditDisplay } from '../components/CreditDisplay';
import { AnalysisButtons } from '../components/AnalysisButtons';
import { CreditSystem } from '../core/credits/CreditSystem';
import { FloatingCreditsCounter } from '../components/FloatingCreditsCounter';
import { getTranslation } from '../i18n/translations';

const ProfessionalWorkflowPage: React.FC = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'analysis' | 'physical' | 'soap'>('analysis');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [transcript, setTranscript] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [soapNote, setSoapNote] = useState<any>(null);
  const [shouldSuggestPro, setShouldSuggestPro] = useState(false);
  const [credits, setCredits] = useState(150);
  
  const { analyzeWithControlledReasoning, isProcessing, reasoningQuality } = useControlledReasoning();
  const { startRecording, stopRecording, isRecording } = useTranscription(setTranscript);
  
  const consumeCredits = (amount: number) => {
    if (credits >= amount) {
      setCredits(prev => prev - amount);
      console.log(`💳 Consumiendo ${amount} créditos. Restantes: ${credits - amount}`);
      return true;
    }
    return false;
  };
  
  const addCredits = (pack: string) => {
    console.log(`💳 Agregando créditos: ${pack}`);
  };

  const mockPatients = [
    { id: '1', name: 'Juan Pérez García', recordNumber: '1' },
    { id: '2', name: 'María López Martínez', recordNumber: '2' }
  ];

  const t = getTranslation(language).workflow;

  useEffect(() => {
    if (analysisResults) {
      const suggestPro = CreditSystem.shouldSuggestPro(analysisResults);
      setShouldSuggestPro(suggestPro);
    }
  }, [analysisResults]);

  const handleAnalyzeNormal = async () => {
    if (!consumeCredits(1)) {
      alert(t.analysis.insufficientCredits);
      return;
    }
    
    console.log('🔍 Análisis Normal (-1 crédito)');
    const result = await analyzeWithControlledReasoning(transcript);
    
    if (result && result.analysis) {
      setAnalysisResults({
        redFlags: result.analysis.redFlags || [],
        entities: result.analysis.entities || [],
        yellowFlags: result.analysis.yellowFlags || [],
        physicalTests: result.analysis.physicalTests || []
      });
    }
  };

  const handleAnalyzePro = async () => {
    if (!consumeCredits(3)) {
      alert(t.analysis.insufficientCredits);
      return;
    }
    
    console.log('✨ Análisis PRO (-3 créditos)');
    const result = await analyzeWithControlledReasoning(transcript);
    
    if (result && result.analysis) {
      setAnalysisResults({
        redFlags: result.analysis.redFlags || [],
        entities: result.analysis.entities || [],
        yellowFlags: result.analysis.yellowFlags || [],
        physicalTests: result.analysis.physicalTests || []
      });
    }
  };

  const handleGenerateSOAP = () => {
    setSoapNote({
      subjective: 'Patient reports...',
      objective: 'Physical examination reveals...',
      assessment: 'Clinical impression...',
      plan: 'Treatment plan...'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <div className="flex items-center gap-4">
              {/* Removido CreditDisplay del header */}
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.tabs.analysis}
          </button>
          
          <button
            onClick={() => setActiveTab('physical')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'physical'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.tabs.physical}
          </button>
          
          <button
            onClick={() => setActiveTab('soap')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'soap'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.tabs.soap}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'analysis' && (
            <>
              <WorkflowAnalysisTab
                patients={mockPatients}
                selectedPatient={selectedPatient}
                onSelectPatient={setSelectedPatient}
                transcript={transcript}
                setTranscript={setTranscript}
                isRecording={isRecording}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onAnalyze={() => {}}
                isProcessing={isProcessing}
                analysisResults={analysisResults}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
              
              <div className="mt-6 pt-6 border-t">
                <AnalysisButtons
                  onAnalyzeNormal={handleAnalyzeNormal}
                  onAnalyzePro={handleAnalyzePro}
                  isProcessing={isProcessing}
                  suggestPro={shouldSuggestPro}
                  credits={credits}
                  disabled={!transcript || transcript.length < 10}
                />
              </div>
            </>
          )}
          
          {activeTab === 'physical' && (
            <PhysicalEvaluationTab />
          )}
          
          {activeTab === 'soap' && (
            <SOAPReportTab
              onGenerateSOAP={handleGenerateSOAP}
              soapNote={soapNote}
              isGenerating={isProcessing}
            />
          )}
        </div>
      </div>
      
      {/* Contador flotante de créditos */}
      <FloatingCreditsCounter current={credits} total={150} />
    </div>
  );
};

export default ProfessionalWorkflowPage;
