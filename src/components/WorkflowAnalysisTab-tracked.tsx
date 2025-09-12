import React, { useEffect } from 'react';
// ... otros imports ...
import { useLanguageTracking } from '../hooks/useLanguageTracking';

export const WorkflowAnalysisTab: React.FC<WorkflowAnalysisTabProps> = (props) => {
  const language = useLanguageTracking('WorkflowAnalysisTab');
  
  // Log cuando cambia el idioma
  useEffect(() => {
    console.log(`🔄 [WorkflowAnalysisTab] Renderizando en ${language.toUpperCase()}`);
  }, [language]);
  
  const buttonTexts = {
    es: {
      record: 'Grabar Audio',
      stop: 'Detener',
      upload: 'Subir Archivo',
      photo: 'Tomar Foto'
    },
    en: {
      record: 'Record Audio',
      stop: 'Stop',
      upload: 'Upload File',
      photo: 'Take Photo'
    }
  };
  
  const t = buttonTexts[language];
  
  // Verificación de sincronización
  useEffect(() => {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      if (btn.textContent?.includes('Record') && language === 'es') {
        console.error('❌ ERROR: Botón en inglés cuando idioma es ES');
      }
      if (btn.textContent?.includes('Grabar') && language === 'en') {
        console.error('❌ ERROR: Botón en español cuando idioma es EN');
      }
    });
  }, [language]);
  
  // ... resto del componente
};
