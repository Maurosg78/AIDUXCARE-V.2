import React, { createContext, useContext, useEffect, useState } from 'react';
import { getLanguage, setLanguage, type Language } from '@/utils/translations';

type Ctx = { lang: Language; setLang: (l: Language) => void; };
const LanguageContext = createContext<Ctx | null>(null);

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(getLanguage());
  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as Language;
      if (detail === 'en' || detail === 'es') setLangState(detail);
    };
    window.addEventListener('language-change', onChange as EventListener);
    return () => window.removeEventListener('language-change', onChange as EventListener);
  }, []);
  const setLang = (l: Language) => setLanguage(l);
  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within <LanguageProvider/>');
  return ctx;
};
export default LanguageContext;
