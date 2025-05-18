import { vi } from "vitest";
import supabase from '@/core/auth/supabaseClient';
import { SupabaseClient } from '@supabase/supabase-js';
import { SuggestionType } from '../core/types/suggestions';
import { SuggestionTypeMetrics, MetricEventType, VisitMetricsSummary } from '../core/types/analytics';

/**
 * Tipo que define la estructura de una métrica de uso en el sistema
 */
export interface UsageMetric {
  timestamp: string;
  visitId: string;
  userId: string;
  type: MetricEventType;
  value: number;
  estimated_time_saved_minutes?: number;
  details?: Record<string, unknown>;
}

/**
 * Tipo que define la estructura de métricas longitudinales entre visitas
 */
export interface LongitudinalMetric {
  id?: string;
  visit_id: string;
  previous_visit_id?: string;
  patient_id: string;
  user_id: string;
  date: string;
  fields_changed: number;
  suggestions_generated: number;
  suggestions_accepted: number;
  suggestions_integrated: number;
  audio_items_validated: number;
  time_saved_minutes: number;
  risk_level_summary: 'low' | 'medium' | 'high';
  clinical_evolution: 'improved' | 'stable' | 'worsened';
  notes?: string;
  details?: Record<string, unknown>;
}

// Para el uso con metric.map
export interface MetricData {
  id: string;
  visit_id: string;
  patient_id: string;
  user_id: string;
  date: string;
  suggestions_generated: number;
  suggestions_accepted: number;
  suggestions_integrated: number;
  time_saved_minutes: number;
  risk_level_summary: string;
  clinical_evolution: string;
  details?: string;
  [key: string]: unknown;
}

// Almacén en memoria para métricas (simulando Supabase)
const metricsStore: UsageMetric[] = [];

// Almacén en memoria para métricas longitudinales
const longitudinalMetricsStore: LongitudinalMetric[] = [];

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
 * Registra una métrica específica de seguimiento
 * 
 * @param type Tipo de métrica a registrar
 * @param userId ID del usuario que realiza la acción
 * @param visitId ID de la visita asociada
 * @param details Detalles adicionales de la métrica
 */
export const track = (
  type: 'suggestions_generated' | 'suggestions_accepted' | 'suggestions_integrated' | 'suggestion_field_matched' | 'suggestion_feedback_given' | 'suggestion_feedback_viewed' | 'suggestion_search_filter_used' | 'suggestion_explanation_viewed',
  userId: string,
  visitId: string,
  value: number = 1,
  details?: Record<string, unknown>
): void => {
  logMetric({
    timestamp: new Date().toISOString(),
    visitId,
    userId,
    type,
    value,
    details
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
export const getMetricsSummaryByVisit = (visitId: string): VisitMetricsSummary => {
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

    field_matched: metrics
      .filter(m => m.type === 'suggestion_field_matched')
      .reduce((sum, m) => sum + m.value, 0),
      
    warnings: warningCount,
    
    // Tiempo estimado ahorrado total
    estimated_time_saved_minutes: timeSum
  };
};

/**
 * Calcula y registra métricas longitudinales entre dos visitas
 * 
 * @param currentVisitId ID de la visita actual
 * @param previousVisitId ID de la visita anterior/previa
 * @param patientId ID del paciente
 * @param userId ID del profesional
 * @param fieldsChanged Número de campos clínicos que han cambiado entre visitas
 * @param audioItemsValidated Número de ítems de audio validados
 * @param clinicalEvolution Estado de evolución clínica ('improved', 'stable', 'worsened')
 * @returns La métrica longitudinal calculada
 */
export const calculateLongitudinalMetrics = async (
  currentVisitId: string,
  previousVisitId: string,
  patientId: string,
  userId: string,
  fieldsChanged: number = 0,
  audioItemsValidated: number = 0,
  clinicalEvolution: 'improved' | 'stable' | 'worsened' = 'stable'
): Promise<LongitudinalMetric> => {
  // Obtener métricas de ambas visitas
  const currentMetrics = getMetricsSummaryByVisit(currentVisitId);
  const previousMetrics = getMetricsSummaryByVisit(previousVisitId);
  
  // Determinar el nivel de riesgo basado en advertencias y adherencia a sugerencias
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  
  // Si hay más advertencias en la visita actual y/o baja adherencia a sugerencias,
  // aumentar el nivel de riesgo
  if (currentMetrics.warnings > previousMetrics.warnings) {
    riskLevel = 'medium';
  }
  
  // Si la adherencia a sugerencias es baja (menos del 50% de sugerencias aceptadas)
  const adherenceRate = currentMetrics.generated > 0 
    ? (currentMetrics.accepted / currentMetrics.generated) 
    : 1;
    
  if (adherenceRate < 0.5 && currentMetrics.warnings > 0) {
    riskLevel = 'high';
  }
  
  // Crear la métrica longitudinal
  const longitudinalMetric: LongitudinalMetric = {
    visit_id: currentVisitId,
    previous_visit_id: previousVisitId,
    patient_id: patientId,
    user_id: userId,
    date: new Date().toISOString(),
    fields_changed: fieldsChanged,
    suggestions_generated: currentMetrics.generated,
    suggestions_accepted: currentMetrics.accepted,
    suggestions_integrated: currentMetrics.integrated,
    audio_items_validated: audioItemsValidated,
    time_saved_minutes: currentMetrics.estimated_time_saved_minutes,
    risk_level_summary: riskLevel,
    clinical_evolution: clinicalEvolution,
    details: {
      previous_metrics: previousMetrics,
      current_metrics: currentMetrics,
      comparison_date: new Date().toISOString()
    }
  };
  
  // Guardar la métrica en el almacén local
  longitudinalMetricsStore.push(longitudinalMetric);
  
  // Intentar guardar en Supabase si está disponible
  await saveLongitudinalMetricsToSupabase(longitudinalMetric);
  
  return longitudinalMetric;
};

/**
 * Guarda una métrica longitudinal en Supabase
 * 
 * @param metric Métrica longitudinal a guardar
 * @returns true si se guardó correctamente, false en caso contrario
 */
export const saveLongitudinalMetricsToSupabase = async (metric: LongitudinalMetric): Promise<boolean> => {
  try {
    // Usar el cliente Supabase disponible
    
    // Usar la función getSupabaseClient
    const client = getSupabaseClient();
    
    // Guardar en la tabla metrics_by_visit
    const { error } = await client
      .from('metrics_by_visit')
      .insert([{
        ...metric,
        details: JSON.stringify(metric.details)
      }]);
    
    if (error) {
      console.error('Error guardando métricas longitudinales:', error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Error guardando métricas longitudinales:', e);
    return false;
  }
};

/**
 * Obtiene las métricas longitudinales para un paciente específico
 * 
 * @param patientId ID del paciente
 * @returns Array de métricas longitudinales
 */
export const getLongitudinalMetricsByPatient = async (patientId: string): Promise<LongitudinalMetric[]> => {
  try {
    // Primero intentar obtener de Supabase
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('metrics_by_visit')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error obteniendo métricas longitudinales:', error);
      // Retornar las métricas del almacén local como fallback
      return longitudinalMetricsStore.filter(m => m.patient_id === patientId);
    }
    
    if (!data || data.length === 0) {
      // Si no hay datos en Supabase, devolver del almacén local
      return longitudinalMetricsStore.filter(m => m.patient_id === patientId);
    }
    
    // Transformar los datos para asegurar el formato correcto
    return data.map((metric: MetricData) => ({
      id: metric.id,
      visit_id: metric.visit_id,
      previous_visit_id: metric.previous_visit_id as string | undefined,
      patient_id: metric.patient_id,
      user_id: metric.user_id,
      date: metric.date,
      fields_changed: metric.fields_changed as number,
      suggestions_generated: metric.suggestions_generated,
      suggestions_accepted: metric.suggestions_accepted,
      suggestions_integrated: metric.suggestions_integrated,
      audio_items_validated: metric.audio_items_validated as number,
      time_saved_minutes: metric.time_saved_minutes,
      risk_level_summary: metric.risk_level_summary as 'low' | 'medium' | 'high',
      clinical_evolution: metric.clinical_evolution as 'improved' | 'stable' | 'worsened',
      notes: metric.notes as string | undefined,
      details: metric.details 
        ? JSON.parse(metric.details as string) 
        : undefined
    }));
  } catch (e) {
    console.error('Error obteniendo métricas longitudinales:', e);
    // En caso de error, devolver del almacén local
    return longitudinalMetricsStore.filter(m => m.patient_id === patientId);
  }
};

/**
 * Obtiene una métrica longitudinal específica para una visita
 * 
 * @param visitId ID de la visita
 * @returns Métrica longitudinal o null si no existe
 */
export const getLongitudinalMetricForVisit = async (visitId: string): Promise<LongitudinalMetric | null> => {
  try {
    // Usar el cliente Supabase disponible
    
    // Usar la función getSupabaseClient
    const supabase = getSupabaseClient();
    
    // Obtener la métrica de Supabase
    const { data, error } = await supabase
      .from('metrics_by_visit')
      .select('*')
      .eq('visit_id', visitId)
      .single();
    
    if (error) {
      // Si la tabla no existe o hay un error, generar datos de respaldo
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.warn('Tabla metrics_by_visit no encontrada, generando métricas simuladas');
        return generateFallbackMetric(visitId);
      }
      
      // Si no encontramos métricas, pero la tabla existe, buscar en el almacén local
      const metric = longitudinalMetricsStore.find(m => m.visit_id === visitId);
      if (metric) return metric;
      
      // Como último recurso, generar datos de respaldo
      return generateFallbackMetric(visitId);
    }
    
    // Procesar los datos para convertir detalles de JSON a objeto
    return {
      ...data,
      details: typeof data.details === 'string' 
        ? JSON.parse(data.details) 
        : data.details
    };
  } catch (err) {
    console.error('Error al obtener métrica longitudinal:', err);
    return generateFallbackMetric(visitId);
  }
};

/**
 * Genera una métrica longitudinal de respaldo cuando no se puede obtener de la BD
 * 
 * @param visitId ID de la visita
 * @returns Métrica longitudinal generada
 */
const generateFallbackMetric = (visitId: string): LongitudinalMetric => {
  // Generar un ID para la visita anterior y el paciente
  const randomId = () => 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  
  // Generar valores aleatorios para la métrica
  const suggestionsGenerated = Math.floor(Math.random() * 15) + 5;
  const suggestionsAccepted = Math.floor(Math.random() * suggestionsGenerated);
  const suggestionsIntegrated = Math.floor(Math.random() * suggestionsAccepted);
  const audioValidated = Math.floor(Math.random() * 10);
  const timeSaved = suggestionsIntegrated * 2 + audioValidated;
  
  // Determinar evolución clínica aleatoria
  const evolutions: Array<'improved' | 'stable' | 'worsened'> = ['improved', 'stable', 'worsened'];
  const randomEvolution = evolutions[Math.floor(Math.random() * evolutions.length)];
  
  // Determinar nivel de riesgo
  const riskLevels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
  const randomRisk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
  
  // Crear métrica de respaldo
  const fallbackMetric: LongitudinalMetric = {
    id: randomId(),
    visit_id: visitId,
    previous_visit_id: randomId(),
    patient_id: randomId(),
    user_id: randomId(),
    date: new Date().toISOString(),
    fields_changed: Math.floor(Math.random() * 10) + 1,
    suggestions_generated: suggestionsGenerated,
    suggestions_accepted: suggestionsAccepted,
    suggestions_integrated: suggestionsIntegrated,
    audio_items_validated: audioValidated,
    time_saved_minutes: timeSaved,
    risk_level_summary: randomRisk,
    clinical_evolution: randomEvolution,
    notes: 'Métrica simulada para demostración',
    details: {
      previous_metrics: {
        generated: suggestionsGenerated - 2,
        accepted: suggestionsAccepted - 1,
        integrated: suggestionsIntegrated - 1,
        field_matched: 0,
        warnings: 1,
        estimated_time_saved_minutes: timeSaved - 3
      },
      current_metrics: {
        generated: suggestionsGenerated,
        accepted: suggestionsAccepted,
        integrated: suggestionsIntegrated,
        field_matched: 0,
        warnings: randomRisk === 'low' ? 0 : randomRisk === 'medium' ? 1 : 3,
        estimated_time_saved_minutes: timeSaved
      },
      comparison_date: new Date().toISOString(),
      pain_level_comparison: {
        previous: randomEvolution === 'improved' ? 7 : randomEvolution === 'stable' ? 5 : 3,
        current: randomEvolution === 'improved' ? 3 : randomEvolution === 'stable' ? 5 : 7
      }
    }
  };
  
  // Guardar en el almacén local para futuras consultas
  longitudinalMetricsStore.push(fallbackMetric);
  
  return fallbackMetric;
};

/**
 * Calcula el estado de evolución clínica basado en campos de contexto
 * 
 * @param currentFields Cantidad o valor de campos actuales
 * @param previousFields Cantidad o valor de campos previos
 * @param isPositiveEvolution true si un incremento representa mejora, false si representa empeoramiento
 * @returns Estado de evolución
 */
export const calculateClinicalEvolution = (
  currentFields: number,
  previousFields: number,
  isPositiveEvolution: boolean = true
): 'improved' | 'stable' | 'worsened' => {
  const difference = currentFields - previousFields;
  
  // Sin cambio significativo
  if (Math.abs(difference) < 0.1 * previousFields) {
    return 'stable';
  }
  
  // Para métricas donde un incremento es positivo (ej. rango de movimiento)
  if (isPositiveEvolution) {
    return difference > 0 ? 'improved' : 'worsened';
  }
  
  // Para métricas donde un decremento es positivo (ej. nivel de dolor)
  return difference < 0 ? 'improved' : 'worsened';
};

/**
 * Genera un emoji indicador para representar la evolución clínica
 * 
 * @param evolution Estado de evolución clínica
 * @returns Emoji representativo
 */
export const getEvolutionIndicator = (evolution: 'improved' | 'stable' | 'worsened'): string => {
  switch (evolution) {
    case 'improved': return '🟢'; // Verde: mejora
    case 'stable': return '🟡';   // Amarillo: estable
    case 'worsened': return '🔴'; // Rojo: empeoramiento
    default: return '⚪';         // Blanco: desconocido
  }
};

/**
 * Obtiene métricas acumuladas por tipo de sugerencia para una visita específica
 * 
 * @param visitId ID de la visita para filtrar las métricas
 * @returns Array con las métricas acumuladas por tipo de sugerencia
 */
export const getMetricsByTypeForVisit = (visitId: string): SuggestionTypeMetrics[] => {
  if (!visitId) {
    return [];
  }
  
  const metrics = getMetricsByVisit(visitId);
  
  // Inicializar los contadores para cada tipo de sugerencia
  const typeMetrics: Record<SuggestionType, {
    generated: number;
    accepted: number;
    integrated: number;
    timeSavedMinutes: number;
  }> = {
    'recommendation': { generated: 0, accepted: 0, integrated: 0, timeSavedMinutes: 0 },
    'warning': { generated: 0, accepted: 0, integrated: 0, timeSavedMinutes: 0 },
    'info': { generated: 0, accepted: 0, integrated: 0, timeSavedMinutes: 0 }
  };
  
  // Procesar cada métrica para acumular valores por tipo
  metrics.forEach(metric => {
    // Obtener el tipo de sugerencia desde los detalles
    const suggestionType = metric.details?.suggestion_type as SuggestionType;
    
    // Solo procesar si es un tipo válido
    if (suggestionType && typeMetrics[suggestionType]) {
      // Incrementar contadores según el tipo de métrica
      if (metric.type === 'suggestions_generated') {
        typeMetrics[suggestionType].generated += metric.value;
      } else if (metric.type === 'suggestions_accepted') {
        typeMetrics[suggestionType].accepted += metric.value;
      } else if (metric.type === 'suggestions_integrated') {
        typeMetrics[suggestionType].integrated += metric.value;
        
        // Acumular tiempo ahorrado si está disponible
        if (metric.estimated_time_saved_minutes) {
          typeMetrics[suggestionType].timeSavedMinutes += metric.estimated_time_saved_minutes;
        } else {
          // Estimación base: 3 minutos por sugerencia integrada
          typeMetrics[suggestionType].timeSavedMinutes += (metric.value * 3);
        }
      }
    }
  });
  
  // Convertir a array de SuggestionTypeMetrics con tasa de aceptación calculada
  return Object.entries(typeMetrics).map(([type, data]) => {
    // Calcular tasa de aceptación (evitar división por cero)
    const acceptanceRate = data.generated > 0 
      ? Math.round((data.accepted / data.generated) * 100) 
      : 0;
      
    return {
      type: type as SuggestionType,
      generated: data.generated,
      accepted: data.accepted,
      acceptanceRate,
      timeSavedMinutes: data.timeSavedMinutes
    };
  });
};

/**
 * Devuelve una instancia del cliente Supabase para uso interno
 */
const getSupabaseClient = (): SupabaseClient => {
  return supabase as SupabaseClient;
};

/**
 * Interfaz para el impacto longitudinal por tipo de sugerencia
 */
export interface LongitudinalImpactByType {
  type: SuggestionType;
  totalGenerated: number;
  totalAccepted: number;
  totalTimeSavedMinutes: number;
  acceptanceRate: number;
  visitCount: number;
}

/**
 * Obtiene métricas longitudinales agrupadas por tipo de sugerencia para un paciente específico
 * 
 * @param patientId ID del paciente para obtener métricas longitudinales
 * @returns Array con métricas acumuladas por tipo de sugerencia
 */
export const getLongitudinalImpactByPatient = async (patientId: string): Promise<LongitudinalImpactByType[]> => {
  try {
    // Obtener métricas longitudinales para el paciente
    const metrics = await getLongitudinalMetricsByPatient(patientId);
    
    if (!metrics || metrics.length === 0) {
      return [];
    }
    
    // Inicializar contadores por tipo de sugerencia
    const typeImpact: Record<SuggestionType, {
      generated: number;
      accepted: number;
      timeSavedMinutes: number;
      visitCount: number;
    }> = {
      'recommendation': { generated: 0, accepted: 0, timeSavedMinutes: 0, visitCount: 0 },
      'warning': { generated: 0, accepted: 0, timeSavedMinutes: 0, visitCount: 0 },
      'info': { generated: 0, accepted: 0, timeSavedMinutes: 0, visitCount: 0 }
    };
    
    // Procesar cada métrica longitudinal
    metrics.forEach(metric => {
      // Contar cada visita una vez por tipo
      let recommendationCounted = false;
      let warningCounted = false;
      let infoCounted = false;
      
      // Si hay sugerencias generadas de algún tipo, incrementar el contador de visitas para ese tipo
      if (metric.suggestions_generated > 0) {
        // Obtener detalles si existen
        const details = metric.details as any;
        
        if (details && details.suggestion_types) {
          // Si hay detalles específicos por tipo
          if (details.suggestion_types.recommendation && details.suggestion_types.recommendation.generated > 0) {
            typeImpact.recommendation.generated += details.suggestion_types.recommendation.generated;
            typeImpact.recommendation.accepted += details.suggestion_types.recommendation.accepted || 0;
            typeImpact.recommendation.timeSavedMinutes += details.suggestion_types.recommendation.time_saved_minutes || 0;
            if (!recommendationCounted) {
              typeImpact.recommendation.visitCount++;
              recommendationCounted = true;
            }
          }
          
          if (details.suggestion_types.warning && details.suggestion_types.warning.generated > 0) {
            typeImpact.warning.generated += details.suggestion_types.warning.generated;
            typeImpact.warning.accepted += details.suggestion_types.warning.accepted || 0;
            typeImpact.warning.timeSavedMinutes += details.suggestion_types.warning.time_saved_minutes || 0;
            if (!warningCounted) {
              typeImpact.warning.visitCount++;
              warningCounted = true;
            }
          }
          
          if (details.suggestion_types.info && details.suggestion_types.info.generated > 0) {
            typeImpact.info.generated += details.suggestion_types.info.generated;
            typeImpact.info.accepted += details.suggestion_types.info.accepted || 0;
            typeImpact.info.timeSavedMinutes += details.suggestion_types.info.time_saved_minutes || 0;
            if (!infoCounted) {
              typeImpact.info.visitCount++;
              infoCounted = true;
            }
          }
        } else {
          // Si no hay detalles específicos, distribuir proporcionalmente
          // Asumimos una distribución aproximada: 50% recomendaciones, 30% advertencias, 20% informativas
          const recommendationPct = 0.5;
          const warningPct = 0.3;
          const infoPct = 0.2;
          
          typeImpact.recommendation.generated += Math.round(metric.suggestions_generated * recommendationPct);
          typeImpact.recommendation.accepted += Math.round(metric.suggestions_accepted * recommendationPct);
          typeImpact.recommendation.timeSavedMinutes += Math.round(metric.time_saved_minutes * recommendationPct);
          if (!recommendationCounted) {
            typeImpact.recommendation.visitCount++;
            recommendationCounted = true;
          }
          
          typeImpact.warning.generated += Math.round(metric.suggestions_generated * warningPct);
          typeImpact.warning.accepted += Math.round(metric.suggestions_accepted * warningPct);
          typeImpact.warning.timeSavedMinutes += Math.round(metric.time_saved_minutes * warningPct);
          if (!warningCounted) {
            typeImpact.warning.visitCount++;
            warningCounted = true;
          }
          
          typeImpact.info.generated += Math.round(metric.suggestions_generated * infoPct);
          typeImpact.info.accepted += Math.round(metric.suggestions_accepted * infoPct);
          typeImpact.info.timeSavedMinutes += Math.round(metric.time_saved_minutes * infoPct);
          if (!infoCounted) {
            typeImpact.info.visitCount++;
            infoCounted = true;
          }
        }
      }
    });
    
    // Convertir a array con porcentajes de aceptación calculados
    return Object.entries(typeImpact)
      .map(([type, data]) => {
        const acceptanceRate = data.generated > 0 
          ? Math.round((data.accepted / data.generated) * 100) 
          : 0;
          
        return {
          type: type as SuggestionType,
          totalGenerated: data.generated,
          totalAccepted: data.accepted,
          totalTimeSavedMinutes: data.timeSavedMinutes,
          acceptanceRate,
          visitCount: data.visitCount
        };
      })
      // Ordenar por cantidad generada (de mayor a menor)
      .sort((a, b) => b.totalGenerated - a.totalGenerated);
  } catch (error) {
    console.error('Error al obtener métricas longitudinales por tipo:', error);
    return [];
  }
}; 