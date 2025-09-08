// Agregar al inicio de vertex-ai-service-firebase.ts
export const getLanguageFromStorage = () => {
  return localStorage.getItem('preferredLanguage') || 'es';
};

export const getLanguageInstructions = () => {
  const lang = getLanguageFromStorage();
  return lang === 'en' 
    ? 'RESPOND ENTIRELY IN ENGLISH. All medical terms, findings, and recommendations must be in English.' 
    : 'RESPONDE COMPLETAMENTE EN ESPAÑOL. Todos los términos médicos, hallazgos y recomendaciones deben estar en español.';
};
