import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    const detectedLang = browserLang.startsWith('es') ? 'es' : 'en';
    const savedLang = localStorage.getItem('preferredLanguage') as Language;
    setLanguage(savedLang || detectedLang);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
