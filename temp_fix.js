// Nuevo manejo robusto de JSON
const parsed = (() => {
  try {
    if (typeof response === "string") {
      return JSON.parse(response);
    } else if (response.text) {
      return JSON.parse(response.text);
    } else {
      return response;
    }
  } catch (error) {
    console.error('[SOAP Parser] JSON truncated, attempting repair...', error);
    // Intentar reparar JSON truncado
    let text = response.text || response;
    if (typeof text === 'string') {
      // Cerrar strings y objetos abiertos
      const openBraces = (text.match(/{/g) || []).length;
      const closeBraces = (text.match(/}/g) || []).length;
      const openQuotes = (text.match(/"/g) || []).length;
      
      // Si hay quotes impares, cerrar string
      if (openQuotes % 2 !== 0) {
        text += '"';
      }
      
      // Cerrar objetos abiertos
      for (let i = 0; i < openBraces - closeBraces; i++) {
        text += '}';
      }
      
      try {
        return JSON.parse(text);
      } catch (repairError) {
        console.error('[SOAP Parser] Repair failed, using fallback');
        throw new Error('JSON_TRUNCATED');
      }
    }
    throw error;
  }
})();
