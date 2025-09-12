import React from 'react';
import { Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../i18n/translations';

interface CreditDisplayProps {
  credits: number;
  onAddCredits?: () => void;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({ 
  credits, 
  onAddCredits 
}) => {
  const { language } = useLanguage();
  const t = getTranslation(language).workflow;
  const isLow = credits < 10;
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
      isLow ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
    }`}>
      <Zap className="w-4 h-4" />
      <span className="font-medium text-sm">
        {t.credits}: <strong>{credits}</strong> {t.remaining}
      </span>
      
      {isLow && onAddCredits && (
        <button
          onClick={onAddCredits}
          className="ml-2 text-xs underline hover:no-underline"
        >
          +50 CR (9 CAD)
        </button>
      )}
    </div>
  );
};
