import React, { createContext, useContext, useState } from 'react';

interface LanguageContextType {
  language: 'en' | 'es';
  setLanguage: (lang: 'en' | 'es') => void;
  t: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  
  const translations = {
    en: {
      workflow: 'Professional Workflow',
      analysis: 'Analysis', 
      physicalEval: 'Physical Evaluation',
      soap: 'SOAP Report'
    },
    es: {
      workflow: 'Flujo de Trabajo Clínico',
      analysis: 'Análisis Inicial', 
      physicalEval: 'Evaluación Física',
      soap: 'Informe SOAP'
    }
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
