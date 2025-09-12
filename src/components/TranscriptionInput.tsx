import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';

interface TranscriptionInputProps {
  transcript: string;
  setTranscript: (text: string) => void;
}

export const TranscriptionInput: React.FC<TranscriptionInputProps> = ({
  transcript,
  setTranscript
}) => {
  const { language } = useLanguage();
  const t = getTranslation(language).workflow;
  
  return (
    <div className="w-full">
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder={language === 'es' 
          ? "Comience a grabar o escriba/pegue el encuentro clínico..." 
          : "Start recording or type/paste the clinical encounter..."}
        className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {/* REMOVIDO: Los botones de Record/Upload/Photo ya están en WorkflowAnalysisTab */}
    </div>
  );
};
