import React from 'react';
import { Brain, Sparkles, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';

interface AnalysisButtonsProps {
  onAnalyzeNormal: () => void;
  onAnalyzePro: () => void;
  isProcessing: boolean;
  suggestPro?: boolean;
  credits: number;
  disabled?: boolean;
}

export const AnalysisButtons: React.FC<AnalysisButtonsProps> = ({
  onAnalyzeNormal,
  onAnalyzePro,
  isProcessing,
  suggestPro,
  credits,
  disabled = false
}) => {
  const { language } = useLanguage();
  const t = getTranslation(language).workflow.analysis;
  
  const canAffordNormal = credits >= 1 && !disabled && !isProcessing;
  const canAffordPro = credits >= 3 && !disabled && !isProcessing;
  
  return (
    <div className="space-y-3">
      {suggestPro && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <span className="text-sm text-yellow-800">
            {language === 'es' 
              ? 'Se detectaron señales de alerta clínicas - Se sugiere Análisis IA Profundo'
              : 'Clinical warning signs detected - IA Deep Analysis suggested'}
          </span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* IA Analysis Button */}
        <button
          onClick={onAnalyzeNormal}
          disabled={!canAffordNormal}
          className={`relative p-6 rounded-xl border-2 transition-all ${
            !suggestPro 
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200' 
              : 'border-gray-300 bg-white hover:bg-gray-50'
          } ${!canAffordNormal ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer transform hover:scale-[1.02]'}`}
        >
          <div className="flex flex-col items-center text-center">
            <Brain className="w-8 h-8 text-blue-600 mb-2" />
            <span className="font-bold text-lg mb-1">{t.normalButton}</span>
            <span className="text-sm text-gray-600 mb-3">
              {language === 'es' ? 'Para seguimiento y casos rutinarios' : 'For follow-ups and routine cases'}
            </span>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span className="text-blue-600">1</span>
              <span className="text-gray-600">{t.normalCost}</span>
            </div>
            {!suggestPro && (
              <span className="absolute top-2 right-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                {t.recommended}
              </span>
            )}
          </div>
        </button>
        
        {/* IA Deep Analysis Button */}
        <button
          onClick={onAnalyzePro}
          disabled={!canAffordPro}
          className={`relative p-6 rounded-xl border-2 transition-all ${
            suggestPro 
              ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 ring-2 ring-purple-200' 
              : 'border-gray-300 bg-white hover:bg-gray-50'
          } ${!canAffordPro ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer transform hover:scale-[1.02]'}`}
        >
          <div className="flex flex-col items-center text-center">
            <Sparkles className="w-8 h-8 text-purple-600 mb-2" />
            <span className="font-bold text-lg mb-1">{t.proButton}</span>
            <span className="text-sm text-gray-600 mb-3">
              {language === 'es' ? 'Casos complejos o múltiples condiciones' : 'Complex cases or multiple conditions'}
            </span>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span className="text-purple-600">3</span>
              <span className="text-gray-600">{t.proCost}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              + {t.referralTemplate}
            </div>
            {suggestPro && (
              <span className="absolute top-2 right-2 text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                {t.suggested}
              </span>
            )}
          </div>
        </button>
      </div>
      
      {(!canAffordNormal && !isProcessing && !disabled) && (
        <div className="text-center text-sm text-red-600 mt-2">
          {t.insufficientCredits}
        </div>
      )}
    </div>
  );
};
