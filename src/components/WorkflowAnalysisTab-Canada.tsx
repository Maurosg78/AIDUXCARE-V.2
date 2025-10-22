import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Brain, AlertCircle, User, Calendar, FileText } from 'lucide-react';
import { ClinicalAnalysisResults } from './ClinicalAnalysisResults';
import { TranscriptionArea } from "./TranscriptionArea";
import { PatientHeader } from "./PatientHeader";
import { LoadingOverlay } from "./LoadingOverlay";
import ValidationMetrics from "./ValidationMetrics";
import { useSession } from '../context/SessionContext';
import { useCanadianVertexAI } from "@/hooks/useCanadianVertexAI";

interface WorkflowAnalysisTabProps {
  selectedPatient: any;
  transcript: string;
  setTranscript: (text: string) => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  recordingTime: string;
  niagaraResults?: any;
  onSelectionChange?: (selections: any) => void;
}

export function WorkflowAnalysisTab({
  selectedPatient,
  transcript,
  setTranscript,
  isRecording,
  startRecording,
  stopRecording,
  recordingTime,
  niagaraResults,
  onSelectionChange
}: WorkflowAnalysisTabProps) {
  
  // Hook canadiense con perfil profesional
  const { analyzeWithProfile, profile, isProfileReady, specialtyInfo } = useCanadianVertexAI();
  
  // Estado local para resultados
  const [results, setResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Session context
  const { currentSession, updateSession } = useSession();

  // Función de análisis con perfil profesional canadiense
  const handleCanadianAnalysis = async () => {
    if (!transcript.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await analyzeWithProfile(transcript);
      setResults(response);
      
      console.log('🇨🇦 Canadian Analysis Complete:', {
        specialty: specialtyInfo.specialty,
        experience: specialtyInfo.experience,
        profileReady: isProfileReady
      });
      
    } catch (err) {
      setError(err?.message || 'Analysis error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PatientHeader selectedPatient={selectedPatient} />
      
      <TranscriptionArea
        transcript={transcript}
        setTranscript={setTranscript}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        recordingTime={recordingTime}
      />

      <div className="flex items-center justify-between">
        <button
          onClick={handleCanadianAnalysis}
          disabled={!transcript.trim() || isProcessing}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Brain className="h-4 w-4" />
          {isProcessing ? 'Analyzing with AI...' : 'Analyze with AI'}
        </button>
        
        {isProfileReady && (
          <div className="text-sm text-green-600">
            🇨🇦 Profile: {specialtyInfo.specialty} | Ontario Compliance Active
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-600 p-4 bg-red-50 rounded-lg">
          Error: {error}
        </div>
      )}

      {results && (
        <ClinicalAnalysisResults
          results={results}
          onSelectionChange={onSelectionChange}
        />
      )}

      <LoadingOverlay isVisible={isProcessing} />
    </div>
  );
}
