import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Upload, AlertTriangle } from 'lucide-react';
import { ClinicalAnalysisResults } from './ClinicalAnalysisResults';
import { TranscriptionArea } from './TranscriptionArea';

interface WorkflowAnalysisTabProps {
  selectedPatient: any;
  transcript: string;
  setTranscript: (text: string) => void;
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  onAnalyze: () => Promise<void>;
  niagaraResults: any;
  isProcessing: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  physicalExamResults: any[];
  handleExamResultsChange: (results: any[]) => void;
  onContinue?: () => void;
}

export const WorkflowAnalysisTab: React.FC<WorkflowAnalysisTabProps> = ({
  selectedPatient,
  transcript,
  setTranscript,
  isRecording,
  startRecording,
  stopRecording,
  onAnalyze,
  niagaraResults,
  isProcessing,
  selectedIds,
  onSelectionChange,
  physicalExamResults,
  handleExamResultsChange,
  onContinue
}) => {
  const [recordingTime, setRecordingTime] = useState('00:00');

  const handleAnalyzeClick = async () => {
    console.log('Analizando con IA...', { transcript, selectedPatient });
    if (transcript && selectedPatient) {
      await onAnalyze();
    } else {
      alert('Por favor, ingrese una transcripción antes de analizar');
    }
  };

  const handleRecordToggle = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Contenido de la Consulta</h3>
        <TranscriptionArea
          transcript={transcript}
          setTranscript={setTranscript}
          isRecording={isRecording}
          startRecording={handleRecordToggle}
          stopRecording={stopRecording}
          recordingTime={recordingTime}
          isTranscribing={false}
          onAnalyze={handleAnalyzeClick}
          isAnalyzing={isProcessing}
        />
      </div>

      {niagaraResults && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Resultados del Análisis</h3>
          <ClinicalAnalysisResults
            results={niagaraResults}
            onSelectionChange={onSelectionChange}
            selectedIds={selectedIds}
            onExamResultsChange={handleExamResultsChange}
          />
          
          {onContinue && selectedIds.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={onContinue}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continuar a Evaluación Física →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
