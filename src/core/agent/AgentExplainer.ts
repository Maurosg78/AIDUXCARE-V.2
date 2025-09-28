// @ts-nocheck
import type { AgentSuggestion } from '@/types/agent';

/**
 * Función que simula la generación de una explicación detallada para una sugerencia del agente
 * 
 * Esta función simula el comportamiento de llamar a un modelo LLM para generar una explicación
 * más detallada sobre la sugerencia del agente. En una implementación real, esta función
 * podría enviar la sugerencia a un servicio de LLM para análisis.
 * 
 * @param suggestion La sugerencia del agente para la que se generará una explicación
 * @returns Una promesa que resuelve a la explicación generada
 */
export const explainSuggestion = (suggestion: AgentSuggestion): Promise<string> => {
  return new Promise((resolve) => {
    // Simulamos una demora de 500ms para emular una llamada asíncrona
    setTimeout(() => {
      // Generamos texto simulado basado en el tipo de sugerencia
      switch (suggestion.type) {
        case 'recommendation':
          resolve(
            `Esta recomendación se basa en las mejores prácticas clínicas para el escenario descrito. ` +
            `El agente ha identificado un patrón en los datos del paciente que sugiere la necesidad de ` +
            `tomar la acción recomendada. Los estudios clínicos muestran que seguir este tipo de ` +
            `recomendaciones mejora los resultados en pacientes con condiciones similares.`
          );
          break;
        case 'warning':
          resolve(
            `Esta advertencia se ha generado porque el agente ha detectado un posible factor de riesgo ` +
            `o una situación que requiere atención especial. Ignorar esta advertencia podría llevar a ` +
            `complicaciones como deterioro clínico, interacciones medicamentosas adversas o errores en ` +
            `el tratamiento. Se recomienda evaluar cuidadosamente la situación.`
          );
          break;
        case 'info':
          resolve(
            `Esta información contextual es relevante para la atención del paciente y puede ser útil ` +
            `para la toma de decisiones clínicas. El agente proporciona este tipo de información para ` +
            `asegurar que todos los factores importantes sean considerados durante la evaluación.`
          );
          break;
        default:
          resolve('No hay explicación disponible para este tipo de sugerencia.');
      }
    }, 500);
  });
}; 