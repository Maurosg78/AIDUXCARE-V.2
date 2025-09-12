import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Translations {
  // Navegación
  workflow: string;
  analysis: string;
  physicalEval: string;
  soap: string;
  
  // Alertas médicas con contexto
  medicalAlerts: string;
  suicidalIdeation: string;
  
  // Etiquetas
  currentSymptoms: string;
  currentMedication: string;
  physicalFindings: string;
  psychosocialFactors: string;
  
  // Acciones
  all: string;
  clear: string;
  addItem: string;
  analyzeButton: string;
  analyzing: string;
}

const translations: Record<string, Translations> = {
  en: {
    workflow: 'Clinical Workflow',
    analysis: 'Analysis',
    physicalEval: 'Physical Evaluation (Optional)',
    soap: 'SOAP',
    medicalAlerts: 'Medical-Legal Alerts',
    suicidalIdeation: 'Suicidal ideation',
    currentSymptoms: 'Current Symptoms',
    currentMedication: 'Current Medication',
    physicalFindings: 'Physical Examination Findings',
    psychosocialFactors: 'Psychosocial Factors',
    all: 'All',
    clear: 'Clear',
    addItem: 'Add item',
    analyzeButton: 'Analyze with AI',
    analyzing: 'Analyzing...'
  },
  es: {
    workflow: 'Flujo de Trabajo Clínico',
    analysis: 'Análisis',
    physicalEval: 'Evaluación Física (Opcional)',
    soap: 'SOAP',
    medicalAlerts: 'Alertas Médico-Legales',
    suicidalIdeation: 'Ideación suicida',
    currentSymptoms: 'Síntomas Actuales',
    currentMedication: 'Medicación Actual',
    physicalFindings: 'Hallazgos del Examen Físico',
    psychosocialFactors: 'Factores Psicosociales',
    all: 'Todo',
    clear: 'Limpiar',
    addItem: 'Agregar',
    analyzeButton: 'Analizar con IA',
    analyzing: 'Analizando...'
  }
};

interface LanguageContextType {
  language: 'en' | 'es';
  setLanguage: (lang: 'en' | 'es') => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  
  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t: translations[language] 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
