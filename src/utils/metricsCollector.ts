export class AiduxMetrics {
  static collectPromptMetrics(input: string, output: any) {
    return {
      // Métricas de eficiencia
      inputLength: input.length,
      outputCategories: Object.keys(output).length,
      processingTime: performance.now(),
      
      // Métricas de calidad
      symptomsSeparation: output.hallazgos_clinicos?.length > 0,
      yellowFlagsDetected: output.yellow_flags?.length > 0,
      testsWithMetrics: output.evaluaciones_fisicas_sugeridas?.filter(
        (t: any) => t.sensibilidad && t.especificidad
      ).length,
      
      // Métricas únicas de AiduxCare
      contextualSeparation: !!(output.contexto_ocupacional && output.contexto_psicosocial),
      concisionScore: this.calculateConcision(output),
      clinicalCompleteness: this.calculateCompleteness(output),
      
      // Timestamp para análisis temporal
      timestamp: new Date().toISOString(),
      version: "1.0"
    };
  }
  
  static calculateConcision(output: any): number {
    // Algoritmo propietario para medir concisión
    const avgWords = String(output).split(/s+/).filter((t: any) => t.sensibilidad && t.especificidad).length;
    return avgWords <= 15 ? 100 : Math.max(0, 100 - (avgWords - 15) * 5);
  }
  
  static calculateCompleteness(output: any): number {
    // Medir qué tan completo es el análisis
    const requiredFields = [
      'motivo_consulta', 'hallazgos_clinicos', 'diagnosticos_probables',
      'evaluaciones_fisicas_sugeridas', 'plan_tratamiento_sugerido'
    ];
    const filledFields = requiredFields.filter(f => 
      output[f] && (Array.isArray(output[f]) ? output[f].length > 0 : true)
    );
    return (filledFields.length / requiredFields.length) * 100;
  }
}
