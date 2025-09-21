import React from 'react';
import { Mic, MicOff, Brain, Loader2 } from 'lucide-react';
import { t } from '../utils/translations';
import { ClinicalAnalysisResults } from './ClinicalAnalysisResults';

interface WorkflowAnalysisTabProps {
  transcript: string;
  setTranscript: (text: string) => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  recordingTime?: number;
  onAnalyze: () => Promise<void>;
  analysisResult: any;
  isLoading: boolean;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
}

export const WorkflowAnalysisTab: React.FC<WorkflowAnalysisTabProps> = ({
  transcript,
  setTranscript,
  isRecording,
  startRecording,
  stopRecording,
  recordingTime,
  onAnalyze,
  analysisResult,
  isLoading,
  selectedIds,
  setSelectedIds
}) => {
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(e.target.value);
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const wordCount = transcript ? transcript.split(/\s+/).filter(word => word.length > 0).length : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex gap-4">
        {/* Panel izquierdo - Transcripción */}
        <div className="flex-1 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">{t('Contenido de la Consulta')}</h3>
            <textarea
              value={transcript}
              onChange={handleTextAreaChange}
              className="w-full h-64 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('El contenido de la transcripción aparecerá aquí...')}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {wordCount} {t('palabras')}
              </span>
              <a 
                href="#" 
                className="text-sm text-blue-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                {t('Expandir')}
              </a>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRecordClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              disabled={isLoading}
              type="button"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isRecording ? t('Grabando...') : t('Grabar')}
            </button>

            <button 
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors" 
              disabled={isLoading}
              type="button"
            >
              <span className="text-sm">📷</span>
            </button>

            <button 
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors" 
              disabled={isLoading}
              type="button"
            >
              <span className="text-sm">📎</span>
            </button>

            <button
              onClick={onAnalyze}
              disabled={!transcript.trim() || isLoading}
              className={`ml-auto flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                isLoading
                  ? 'bg-blue-400 text-white cursor-not-allowed'
                  : transcript.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              type="button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('Analizando...')}
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  {t('Analizar con IA')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Panel derecho - Resultados */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">{t('Analizando...')}</p>
              <p className="text-sm text-gray-500 mt-2">{t('Esto puede tomar unos segundos')}</p>
            </div>
          ) : analysisResult ? (
            <ClinicalAnalysisResults
              results={analysisResult}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="mb-2">{t('Los resultados del análisis aparecerán aquí')}</p>
              <p className="text-sm">{t('Pega o dicta una transcripción y presiona Analizar con IA')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowAnalysisTab;
