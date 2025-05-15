/**
 * Tipo que define los proveedores de modelos de lenguaje soportados
 */
export type LLMProvider = 'openai' | 'anthropic' | 'mistral' | 'custom';

/**
 * Función que simula el envío de un prompt a un modelo de lenguaje
 * 
 * Esta implementación solo simula las respuestas con un retraso artificial.
 * En una implementación real, esta función realizaría una llamada a la API
 * del proveedor correspondiente.
 * 
 * @param prompt El texto de entrada para el modelo
 * @param provider El proveedor de LLM a utilizar
 * @returns Una promesa que se resuelve con la respuesta del modelo
 * @throws Error si el proveedor no es soportado
 */
export const sendToLLM = (prompt: string, provider: LLMProvider): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Validar que el provider sea uno de los soportados
    if (!['openai', 'anthropic', 'mistral', 'custom'].includes(provider)) {
      reject(new Error('Unsupported LLM provider'));
      return;
    }

    // Simular un retraso de 500ms
    setTimeout(() => {
      // Devolver una respuesta simulada según el proveedor
      switch (provider) {
        case 'openai':
          resolve(
            `OpenAI GPT response: He analizado el siguiente prompt: "${prompt}". ` +
            `Basado en mi entrenamiento, puedo proporcionar una respuesta detallada ` +
            `que integra múltiples fuentes de información y consideraciones clínicas relevantes.`
          );
          break;
        
        case 'anthropic':
          resolve(
            `Anthropic Claude response: En respuesta a "${prompt}", ` +
            `mi análisis indica varias consideraciones importantes. Como asistente, ` +
            `priorizo respuestas equilibradas y meticulosas que consideran los matices ` +
            `del contexto médico proporcionado.`
          );
          break;
        
        case 'mistral':
          resolve(
            `Mistral AI response: Para: "${prompt}". Mi evaluación sugiere ` +
            `las siguientes recomendaciones basadas en datos clínicos actualizados ` +
            `y protocolos médicos establecidos, considerando las mejores prácticas ` +
            `y la individualización del paciente.`
          );
          break;
        
        case 'custom':
          resolve(
            `Custom LLM response: Respuesta personalizada para: "${prompt}". ` +
            `Este modelo ha sido ajustado específicamente para el dominio médico ` +
            `y proporciona resultados optimizados para casos clínicos, con énfasis ` +
            `en las guías de práctica médica actuales.`
          );
          break;
      }
    }, 500);
  });
}; 