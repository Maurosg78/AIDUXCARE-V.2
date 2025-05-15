/**
 * Tipo que define la estructura de una métrica de uso en el sistema
 */
export interface UsageMetric {
  timestamp: string;
  visitId: string;
  userId: string;
  type: 'suggestions_generated' | 'suggestions_accepted' | 'suggestions_integrated';
  value: number;
  estimated_time_saved_minutes?: number;
}

// Almacén en memoria para métricas (simulando Supabase)
const metricsStore: UsageMetric[] = [];

/**
 * Registra una nueva métrica de uso en el sistema
 * 
 * @param metric Datos de la métrica a registrar
 */
export const logMetric = (metric: UsageMetric): void => {
  // Validar que la métrica tenga todos los campos requeridos
  if (!metric.timestamp || !metric.visitId || !metric.userId || !metric.type || metric.value === undefined) {
    throw new Error('La métrica debe contener todos los campos requeridos');
  }
  
  // Añadir la métrica al almacén en memoria
  metricsStore.push({
    ...metric,
    // Asegurar que timestamp sea string en formato ISO
    timestamp: typeof metric.timestamp === 'string' 
      ? metric.timestamp 
      : new Date().toISOString()
  });
};

/**
 * Obtiene todas las métricas registradas para una visita específica
 * 
 * @param visitId ID de la visita para filtrar las métricas
 * @returns Array de métricas de la visita
 */
export const getMetricsByVisit = (visitId: string): UsageMetric[] => {
  if (!visitId) {
    return [];
  }
  
  return metricsStore.filter(metric => metric.visitId === visitId);
};

/**
 * Obtiene métricas agrupadas por tipo para una visita específica
 * 
 * @param visitId ID de la visita para filtrar las métricas
 * @returns Objeto con totales por tipo de métrica
 */
export const getMetricsSummaryByVisit = (visitId: string): { 
  generated: number;
  accepted: number;
  integrated: number;
  warnings: number;
  estimated_time_saved_minutes: number;
} => {
  const metrics = getMetricsByVisit(visitId);
  
  // Calcular el tiempo estimado ahorrado sumando todos los campos estimated_time_saved_minutes
  const timeSum = metrics.reduce((sum, m) => {
    return sum + (m.estimated_time_saved_minutes || 0);
  }, 0);

  // Contar advertencias (para esta métrica, asumimos que podría calcularse en el futuro)
  const warningCount = 0;
  
  return {
    generated: metrics
      .filter(m => m.type === 'suggestions_generated')
      .reduce((sum, m) => sum + m.value, 0),
      
    accepted: metrics
      .filter(m => m.type === 'suggestions_accepted')
      .reduce((sum, m) => sum + m.value, 0),
      
    integrated: metrics
      .filter(m => m.type === 'suggestions_integrated')
      .reduce((sum, m) => sum + m.value, 0),
      
    warnings: warningCount,
    
    // Tiempo estimado ahorrado total
    estimated_time_saved_minutes: timeSum
  };
}; 