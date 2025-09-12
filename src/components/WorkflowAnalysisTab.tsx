import React from 'react';
import { PatientSelector } from './PatientSelector';
import { TranscriptionInput } from './TranscriptionInput';
import { ClinicalAnalysisResults } from './ClinicalAnalysisResults';
import { Mic, Upload, Camera } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';

interface WorkflowAnalysisTabProps {
  patients: any[];
  selectedPatient: any;
  onSelectPatient: (patient: any) => void;
  transcript: string;
  setTranscript: (text: string) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onAnalyze: () => void;
  isProcessing: boolean;
  analysisResults: any;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export const WorkflowAnalysisTab: React.FC<WorkflowAnalysisTabProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  transcript,
  setTranscript,
  isRecording,
  onStartRecording,
  onStopRecording,
  onAnalyze,
  isProcessing,
  analysisResults,
  selectedIds,
  onSelectionChange,
}) => {
  const { language } = useLanguage();
  
  // Textos traducidos para los botones
  const buttonTexts = {
    es: {
      record: 'Grabar Audio',
      stop: 'Detener',
      upload: 'Subir Archivo',
      photo: 'Tomar Foto'
    },
    en: {
      record: 'Record Audio',
      stop: 'Stop',
      upload: 'Upload File',
      photo: 'Take Photo'
    }
  };
  
  const t = buttonTexts[language];

  return (
    <div className="space-y-6">
      {/* Patient Selector */}
      <PatientSelector
        patients={patients}
        selectedPatient={selectedPatient}
        onSelectPatient={onSelectPatient}
      />

      {/* Transcription Input */}
      <div>
        <TranscriptionInput
          transcript={transcript}
          setTranscript={setTranscript}
        />
        
        {/* Recording Controls - UN SOLO SET DE BOTONES */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isRecording 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <Mic className="w-4 h-4" />
            {isRecording ? t.stop : t.record}
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Upload className="w-4 h-4" />
            {t.upload}
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Camera className="w-4 h-4" />
            {t.photo}
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResults && (
        <ClinicalAnalysisResults
          analysisData={analysisResults}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
        />
      )}
    </div>
  );
};
