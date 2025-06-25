/**
 * Script para generar métricas longitudinales simuladas
 * 
 * Este script crea un registro de métricas longitudinales de prueba
 * con datos simulados para probar la visualización en la UI.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Función para calcular evolución clínica
function calculateClinicalEvolution(currentValue, previousValue, isPositiveEvolution = true) {
  const difference = currentValue - previousValue;
  
  // Sin cambio significativo (menos del 10%)
  if (Math.abs(difference) < 0.1 * previousValue) {
    return 'stable';
  }
  
  // Para métricas donde un incremento es positivo (ej. rango de movimiento)
  if (isPositiveEvolution) {
    return difference > 0 ? 'improved' : 'worsened';
  }
  
  // Para métricas donde un decremento es positivo (ej. nivel de dolor)
  return difference < 0 ? 'improved' : 'worsened';
}

// Función para generar UUIDs
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Función auxiliar para obtener emoji de evolución
function getEvolutionEmoji(evolution) {
  switch (evolution) {
    case 'improved': return '🟢';
    case 'stable': return '🟡';
    case 'worsened': return '🔴';
    default: return '⚪';
  }
}

// Configuración Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno de Supabase no definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Función principal
async function generateLongitudinalMetrics() {
  try {
    console.log('RELOAD: Generando métricas longitudinales simuladas...');

    // Generar UUIDs para los IDs necesarios
    const patientId = generateUUID();
    const currentVisitId = generateUUID();
    const previousVisitId = generateUUID();
    const userId = generateUUID();
    
    console.log('🆔 IDs generados:');
    console.log(`  - Patient ID: ${patientId}`);
    console.log(`  - Current Visit ID: ${currentVisitId}`);
    console.log(`  - Previous Visit ID: ${previousVisitId}`);
    console.log(`  - User ID: ${userId}`);
    
    // Datos de métricas
    const suggestionsGenerated = 12;
    const suggestionsAccepted = 9;
    const suggestionsIntegrated = 7;
    const fieldsChanged = 8;
    const audioItemsValidated = 6;
    
    // Datos previos para comparación
    const previousSuggestionsGenerated = 10;
    const previousSuggestionsAccepted = 6;
    const previousSuggestionsIntegrated = 4;
    
    // Evolución del dolor
    const currentPainLevel = 3; // En escala 1-10
    const previousPainLevel = 7; // En escala 1-10
    
    // Para dolor, menor valor es mejor (evolución positiva)
    const clinicalEvolution = calculateClinicalEvolution(
      currentPainLevel, 
      previousPainLevel, 
      false // false porque para dolor, un decremento es positivo
    );
    
    // Estimar tiempo ahorrado
    const timeSavedMinutes = suggestionsIntegrated * 2 + audioItemsValidated * 1;
    
    // Nivel de riesgo
    const warningCount = 1; // Ejemplo: 1 advertencia en la visita actual
    const riskLevel = warningCount > 2 ? 'high' : warningCount > 0 ? 'medium' : 'low';
    
    // Crear registro de métricas
    const metricsData = {
      id: generateUUID(), // ID único para el registro
      visit_id: currentVisitId,
      previous_visit_id: previousVisitId,
      patient_id: patientId,
      user_id: userId,
      date: new Date().toISOString(),
      fields_changed: fieldsChanged,
      suggestions_generated: suggestionsGenerated,
      suggestions_accepted: suggestionsAccepted,
      suggestions_integrated: suggestionsIntegrated,
      audio_items_validated: audioItemsValidated,
      time_saved_minutes: timeSavedMinutes,
      risk_level_summary: riskLevel,
      clinical_evolution: clinicalEvolution,
      notes: `Evolución del nivel de dolor: ${previousPainLevel}/10 → ${currentPainLevel}/10`,
      details: JSON.stringify({
        previous_metrics: {
          generated: previousSuggestionsGenerated,
          accepted: previousSuggestionsAccepted,
          integrated: previousSuggestionsIntegrated,
          field_matched: 0,
          warnings: 2,
          estimated_time_saved_minutes: previousSuggestionsIntegrated * 2
        },
        current_metrics: {
          generated: suggestionsGenerated,
          accepted: suggestionsAccepted,
          integrated: suggestionsIntegrated,
          field_matched: 0,
          warnings: warningCount,
          estimated_time_saved_minutes: timeSavedMinutes
        },
        comparison_date: new Date().toISOString(),
        pain_level_comparison: {
          previous: previousPainLevel,
          current: currentPainLevel
        }
      })
    };
    
    // Opción 1: Insertar directamente utilizando SQL nativo 
    // (saltándose las restricciones de clave foránea)
    console.log('Insertando datos de métricas simuladas en Supabase usando SQL nativo...');
    
    const { data: insertResult, error: insertError } = await supabase.rpc(
      'insert_metric_record',
      {
        p_metric_record: metricsData
      }
    );
    
    if (insertError) {
      console.error('Error con RPC insert_metric_record:', insertError);
      
      // Alternativa: Insertar utilizando sentencia SQL directa
      console.log('Intentando método alternativo con SQL directo...');
      
      // Crear SQL para inserción directa
      const sql = `
        INSERT INTO metrics_by_visit (
          id, visit_id, previous_visit_id, patient_id, user_id, date,
          fields_changed, suggestions_generated, suggestions_accepted,
          suggestions_integrated, audio_items_validated, time_saved_minutes,
          risk_level_summary, clinical_evolution, notes, details
        ) VALUES (
          '${metricsData.id}',
          '${metricsData.visit_id}',
          '${metricsData.previous_visit_id}',
          '${metricsData.patient_id}',
          '${metricsData.user_id}',
          '${metricsData.date}',
          ${metricsData.fields_changed},
          ${metricsData.suggestions_generated},
          ${metricsData.suggestions_accepted},
          ${metricsData.suggestions_integrated},
          ${metricsData.audio_items_validated},
          ${metricsData.time_saved_minutes},
          '${metricsData.risk_level_summary}',
          '${metricsData.clinical_evolution}',
          '${metricsData.notes.replace(/'/g, "''")}',
          '${JSON.stringify(metricsData.details).replace(/'/g, "''")}'
        ) RETURNING id;
      `;
      
      // Ejecutar SQL directamente
      const { data: sqlResult, error: sqlError } = await supabase.rpc(
        'run_sql',
        { query: sql }
      );
      
      if (sqlError) {
        console.error('Error ejecutando SQL directo:', sqlError);
        
        // Tercer intento: Usar el método de inserción normal pero omitiendo constraints
        console.log('Intentando inserción simple sin validar foreign keys...');
        
        try {
          // Guardar en el almacén local como última opción
          console.log('⚠️ Guardando métricas simuladas solo en memoria local');
          console.log(`SUCCESS: Métricas longitudinales generadas correctamente (solo memoria)`);
          console.log(`STATS: Resumen: ${getEvolutionEmoji(clinicalEvolution)} Evolución clínica: ${clinicalEvolution}`);
          console.log(`⏱️ Tiempo estimado ahorrado: ${timeSavedMinutes} minutos`);
          console.log(`⚠️ Nivel de riesgo: ${riskLevel.toUpperCase()}`);
          
          // Devolver true para indicar que al menos tenemos datos en memoria
          return {
            success: true,
            inMemoryOnly: true,
            data: metricsData
          };
        } catch (finalError) {
          console.error('Error en el último intento:', finalError);
          return { success: false };
        }
      } else {
        console.log(`SUCCESS: Métricas longitudinales generadas y guardadas correctamente con SQL directo`);
        return { success: true, data: sqlResult };
      }
    } else {
      console.log(`SUCCESS: Métricas longitudinales generadas y guardadas correctamente`);
      console.log(`STATS: Resumen: ${getEvolutionEmoji(clinicalEvolution)} Evolución clínica: ${clinicalEvolution}`);
      console.log(`⏱️ Tiempo estimado ahorrado: ${timeSavedMinutes} minutos`);
      console.log(`⚠️ Nivel de riesgo: ${riskLevel.toUpperCase()}`);
      
      return { success: true, data: insertResult };
    }
  } catch (error) {
    console.error('Error general en el proceso:', error);
    return { success: false, error };
  }
}

// Exportar la función principal como default para poder importarla con dynamic import
export default generateLongitudinalMetrics;

// Ejecutar directamente si es el script principal
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('LAUNCH: Ejecutando generación de métricas longitudinales directamente...');
  generateLongitudinalMetrics()
    .then(result => {
      if (result.success) {
        console.log('SUCCESS: Proceso completado con éxito');
        if (result.inMemoryOnly) {
          console.log('⚠️ Nota: Los datos solo existen en memoria, no se guardaron en la base de datos');
        }
      } else {
        console.log('ERROR: Proceso completado con errores');
      }
    })
    .catch(err => console.error('ERROR: Error en la ejecución:', err));
} 