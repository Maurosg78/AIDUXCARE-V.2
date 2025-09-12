import { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const useLanguageTracking = (componentName: string) => {
  const { language } = useLanguage();
  
  useEffect(() => {
    console.log(`📍 [${componentName}] Idioma actual: ${language}`);
  }, [language, componentName]);
  
  return language;
};
