// Función para extraer acrónimos de paréntesis: "Timed Up and Go (TUG)" -> "TUG"
const extractAcronym = (text) => {
  const match = text.match(/\(([^)]+)\)/);
  return match ? match[1].toLowerCase() : '';
};

// Función para limpiar texto de matching
const cleanText = (text) => {
  return text.toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
};

// Mejorar matching logic
const findMatchingTest = (aiSuggestedName, testLibrary) => {
  const cleanAI = cleanText(aiSuggestedName);
  const aiAcronym = extractAcronym(aiSuggestedName);
  
  return testLibrary.find(libraryTest => {
    const cleanLibrary = cleanText(libraryTest.name);
    const libraryAcronym = extractAcronym(libraryTest.name);
    
    // Matching por nombre completo
    if (cleanLibrary.includes(cleanAI) || cleanAI.includes(cleanLibrary)) return true;
    
    // Matching por acrónimo
    if (aiAcronym && libraryAcronym && aiAcronym === libraryAcronym) return true;
    
    // Matching por palabras clave específicas
    const keywordMatches = {
      'tug': 'timed up and go',
      'berg': 'berg balance',
      'orthostatic': 'orthostatic',
      'vital signs': 'orthostatic',
      'blood pressure': 'orthostatic'
    };
    
    for (const [keyword, target] of Object.entries(keywordMatches)) {
      if (cleanAI.includes(keyword) && cleanLibrary.includes(target)) return true;
    }
    
    return false;
  });
};
