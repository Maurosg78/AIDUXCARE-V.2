import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  
  const handleLanguageChange = (lang: 'es' | 'en') => {
    setLanguage(lang);
    // Log inmediato para verificar cambio
    console.log(`🌐 Idioma cambiado a: ${lang === 'es' ? 'Español' : 'English'}`);
    console.log(`🔄 UI debe actualizarse a ${lang.toUpperCase()}`);
  };
  
  // Banderas como SVG inline para mejor rendimiento
  const SpainFlag = () => (
    <svg width="16" height="12" viewBox="0 0 16 12" className="inline-block">
      <rect width="16" height="3" fill="#C60B1E"/>
      <rect y="3" width="16" height="6" fill="#FFC400"/>
      <rect y="9" width="16" height="3" fill="#C60B1E"/>
    </svg>
  );
  
  const CanadaFlag = () => (
    <svg width="16" height="12" viewBox="0 0 16 12" className="inline-block">
      <rect width="4" height="12" fill="#FF0000"/>
      <rect x="4" width="8" height="12" fill="#FFFFFF"/>
      <rect x="12" width="4" height="12" fill="#FF0000"/>
      <path d="M8 3 L7 5 L5 5 L6.5 6 L6 8 L8 7 L10 8 L9.5 6 L11 5 L9 5 Z" fill="#FF0000"/>
    </svg>
  );
  
  return (
    <div className="flex items-center bg-gray-100 rounded-md p-0.5 h-8">
      <button
        onClick={() => handleLanguageChange('es')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all h-7 ${
          language === 'es' 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-gray-600 hover:text-gray-800'
        }`}
        title="Cambiar a Español"
      >
        <SpainFlag />
        <span>ES</span>
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all h-7 ${
          language === 'en' 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-gray-600 hover:text-gray-800'
        }`}
        title="Switch to English"
      >
        <CanadaFlag />
        <span>EN</span>
      </button>
    </div>
  );
};
