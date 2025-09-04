import React, { useState } from 'react';
import { Card, Button } from '../shared/ui';
import { Mic, MicOff, Brain, AlertCircle, User, Calendar, FileText } from 'lucide-react';
import { ClinicalAnalysisResults } from './ClinicalAnalysisResults';
import { TranscriptionArea } from "./TranscriptionArea";
import { LoadingOverlay } from "./LoadingOverlay";

interface WorkflowAnalysisTabProps {
  selectedPatient: any;
  transcript: string;
  setTranscript: (text: string) => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  recordingTime: string;
  isAnalyzing: boolean;
  isTranscribing: boolean;
  onAnalyze: () => void;
  niagaraResults: any;
  selectedFindings: string[];
  setSelectedFindings: (findings: string[]) => void;
  onGenerateSOAP: () => void;
  onContinueToEvaluation: () => void;
  physicalExamResults: any[];
  handleExamResultsChange: (results: any[]) => void;
}

export const WorkflowAnalysisTab: React.FC<WorkflowAnalysisTabProps> = ({
  selectedPatient,
  transcript,
  setTranscript,
  isRecording,
  startRecording,
  stopRecording,
  recordingTime,
  isAnalyzing,
  isTranscribing,
  onAnalyze,
  niagaraResults,
  selectedFindings,
  setSelectedFindings,
  onGenerateSOAP,
  onContinueToEvaluation,
  physicalExamResults,
  handleExamResultsChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxHeight = isExpanded ? 'max-h-96' : 'max-h-40';
  
  // Debug log
  console.log("WorkflowAnalysisTab recibió niagaraResults:", niagaraResults);

  return (
    <>
      <LoadingOverlay isLoading={isAnalyzing} />
      
      <div className="h-full flex flex-col gap-4 p-4">
        
        {/* FILA 1: Información del Paciente (Compacta) */}
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedPatient?.name || 'María González'}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>ID: {selectedPatient?.id || 'PAC-TEST-001'}</span>
                  <span>44 años</span>
                  <span>Dx: Dolor cervical irradiado</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedPatient?.allergies && (
                <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                  ⚠ Alergias: Penicilina
                </div>
              )}
              <div className="text-sm text-gray-500">
                {selectedPatient?.medications?.length > 0 && (
                  <span>Medicación: Ibuprofeno 400mg c/8h</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* FILA 2: Área de Transcripción/Escritura */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Contenido de la Consulta</h3>
            <div className="flex items-center gap-2">
              {transcript.length > 0 && (
                <span className="text-xs text-gray-500">{transcript.split(' ').length} palabras</span>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {isExpanded ? 'Minimizar' : 'Expandir'}
              </button>
            </div>
          </div>
          
          <div className={`transition-all duration-300 ${maxHeight} overflow-y-auto`}>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Escribe o dicta el contenido de la consulta..."
              className="w-full h-full min-h-[120px] p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isRecording ? `Grabando ${recordingTime}` : 'Grabar'}
              </button>
              
              {isTranscribing && (
                <span className="text-sm text-gray-500">Transcribiendo...</span>
              )}
            </div>
            
            <button
              onClick={onAnalyze}
              disabled={!transcript || isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Brain className="w-4 h-4" />
              {isAnalyzing ? 'Analizando...' : 'Analizar con IA'}
            </button>
          </div>
        </Card>

        {/* FILA 3: Resultados del Análisis (Solo si hay resultados) */}
        {niagaraResults && (
          <div className="flex-1 overflow-auto">
            <ClinicalAnalysisResults
              results={niagaraResults}
              selectedIds={selectedFindings}
              onSelectionChange={setSelectedFindings}
            />
          </div>
        )}
      </div>
    </>
  );
};
