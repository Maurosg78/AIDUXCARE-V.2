import React from 'react';
import { useLocale } from '../../i18n/ui';

export const LanguageToggle: React.FC = () => {
  const { locale, setLocale } = useLocale();
  
  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => setLocale('es')}
        className={`px-2 py-1 rounded ${
          locale === 'es' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }`}
        aria-label="Español"
      >
        ES
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-2 py-1 rounded ${
          locale === 'en' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
};
