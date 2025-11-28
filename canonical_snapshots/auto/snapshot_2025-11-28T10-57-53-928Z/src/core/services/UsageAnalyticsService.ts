import logger from '@/shared/utils/logger';
interface MetricData {
  [key: string]: string | number | boolean;
}

export const trackMetric = (
  metricName: string,
  userId: string,
  visitId: string,
  value: number,
  metadata?: MetricData
): void => {
  // Implementación del tracking de métricas
  console.log('Tracking metric:', {
    metricName,
    userId,
    visitId,
    value,
    metadata,
    timestamp: new Date().toISOString()
  });
}; 