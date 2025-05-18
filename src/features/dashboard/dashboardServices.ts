import supabase from '@/core/auth/supabaseClient';
import { visitDataSourceSupabase } from '../../core/dataSources/visitDataSourceSupabase';
import { getLongitudinalMetricsByPatient, getMetricsByTypeForVisit, getMetricsSummaryByVisit } from '../../services/UsageAnalyticsService';

/**
 * Interfaz para los datos resumidos de actividad del profesional
 */
export interface ActivitySummary {
  totalVisits: number;
  suggestionsGenerated: number;
  suggestionsAccepted: number;
  suggestionsIntegrated: number;
  timeSavedMinutes: number;
}

/**
 * Interfaz para datos de métricas semanales para gráficos
 */
export interface WeeklyMetric {
  week: string;
  visits: number;
  suggestionsGenerated: number;
  suggestionsAccepted: number;
}

/**
 * Obtiene un resumen de la actividad del profesional
 * 
 * @param professionalId ID del profesional
 * @returns Resumen de actividad con métricas consolidadas
 */
export const getProfessionalActivitySummary = async (professionalId: string): Promise<ActivitySummary> => {
  try {
    // 1. Obtener todas las visitas del profesional
    const visits = await visitDataSourceSupabase.getVisitsByProfessionalId(professionalId);
    
    // 2. Inicializar el resumen de actividad
    const summary: ActivitySummary = {
      totalVisits: visits.length,
      suggestionsGenerated: 0,
      suggestionsAccepted: 0,
      suggestionsIntegrated: 0,
      timeSavedMinutes: 0
    };
    
    // 3. Para cada visita, obtener métricas y acumularlas
    for (const visit of visits) {
      const visitMetrics = getMetricsSummaryByVisit(visit.id);
      
      // Acumular métricas
      summary.suggestionsGenerated += visitMetrics.generated;
      summary.suggestionsAccepted += visitMetrics.accepted;
      summary.suggestionsIntegrated += visitMetrics.integrated;
      summary.timeSavedMinutes += visitMetrics.estimated_time_saved_minutes;
    }
    
    return summary;
  } catch (error) {
    console.error("Error obteniendo resumen de actividad:", error);
    // Devolver valores por defecto en caso de error
    return {
      totalVisits: 0,
      suggestionsGenerated: 0,
      suggestionsAccepted: 0,
      suggestionsIntegrated: 0,
      timeSavedMinutes: 0
    };
  }
};

/**
 * Genera datos de métricas semanales para los últimos 28 días (4 semanas)
 * 
 * @param professionalId ID del profesional
 * @returns Array con datos semanales para gráficos
 */
export const getWeeklyMetrics = async (professionalId: string): Promise<WeeklyMetric[]> => {
  try {
    // 1. Obtener todas las visitas del profesional
    const visits = await visitDataSourceSupabase.getVisitsByProfessionalId(professionalId);
    
    // Definir las últimas 4 semanas
    const today = new Date();
    const weeklyData: WeeklyMetric[] = [];
    
    // Generar datos para las últimas 4 semanas
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7 * (i + 1));
      
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - 7 * i);
      
      // Formato de fecha para etiqueta
      const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth()+1} - ${weekEnd.getDate()}/${weekEnd.getMonth()+1}`;
      
      // Inicializar métricas para esta semana
      const weekMetrics: WeeklyMetric = {
        week: weekLabel,
        visits: 0,
        suggestionsGenerated: 0,
        suggestionsAccepted: 0
      };
      
      // Calcular métricas para visitas en este rango de fechas
      for (const visit of visits) {
        const visitDate = new Date(visit.date);
        
        if (visitDate >= weekStart && visitDate < weekEnd) {
          // Contar la visita
          weekMetrics.visits++;
          
          // Obtener métricas para esta visita
          const visitMetrics = getMetricsSummaryByVisit(visit.id);
          
          // Acumular métricas
          weekMetrics.suggestionsGenerated += visitMetrics.generated;
          weekMetrics.suggestionsAccepted += visitMetrics.accepted;
        }
      }
      
      // Añadir a los datos semanales
      weeklyData.unshift(weekMetrics); // Añadir al principio para que esté en orden cronológico
    }
    
    return weeklyData;
  } catch (error) {
    console.error("Error obteniendo métricas semanales:", error);
    // Devolver datos de ejemplo en caso de error
    return [
      { week: 'Semana 1', visits: 0, suggestionsGenerated: 0, suggestionsAccepted: 0 },
      { week: 'Semana 2', visits: 0, suggestionsGenerated: 0, suggestionsAccepted: 0 },
      { week: 'Semana 3', visits: 0, suggestionsGenerated: 0, suggestionsAccepted: 0 },
      { week: 'Semana 4', visits: 0, suggestionsGenerated: 0, suggestionsAccepted: 0 }
    ];
  }
};

/**
 * Obtiene métricas longitudinales para las visitas de un profesional
 * 
 * @param professionalId ID del profesional
 * @returns Promise que resuelve a un objeto con métricas longitudinales por paciente
 */
export const getLongitudinalMetricsByProfessional = async (professionalId: string) => {
  try {
    // 1. Obtener todas las visitas del profesional
    const visits = await visitDataSourceSupabase.getVisitsByProfessionalId(professionalId);
    
    // 2. Agrupar visitas por paciente
    const patientIds = [...new Set(visits.map(visit => visit.patient_id))];
    
    // 3. Para cada paciente, obtener sus métricas longitudinales
    const allMetrics = await Promise.all(
      patientIds.map(async (patientId) => {
        const metrics = await getLongitudinalMetricsByPatient(patientId);
        return {
          patientId,
          metrics
        };
      })
    );
    
    return allMetrics;
  } catch (error) {
    console.error("Error obteniendo métricas longitudinales:", error);
    return [];
  }
}; 