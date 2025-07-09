/**
 * Script para generar métricas longitudinales entre las visitas de Andrea Bultó
 * 
 * Este script compara la primera y segunda visita de Andrea, calculando
 * las métricas de evolución clínica y almacenándolas en Supabase.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { calculateClinicalEvolution } from '../src/services/UsageAnalyticsService.js';

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
    console.log('🔄 Generando métricas longitudinales para Andrea Bultó...');

    // 1. Buscar el paciente Andrea Bultó
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .ilike('full_name', '%Andrea Bultó%')
      .limit(1);

    if (patientError || !patients || patients.length === 0) {
      console.error('Error: No se encontró a la paciente Andrea Bultó', patientError);
      return;
    }

    const patient = patients[0];
    console.log(`✅ Paciente encontrada: ${patient.full_name} (${patient.id})`);

    // 2. Buscar las visitas de Andrea, ordenadas por fecha
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('*')
      .eq('patient_id', patient.id)
      .order('date', { ascending: false });

    if (visitsError || !visits || visits.length < 2) {
      console.error('Error: No se encontraron suficientes visitas para comparar', visitsError);
      return;
    }

    console.log(`✅ Encontradas ${visits.length} visitas para comparar`);
    
    // Ordenamos para trabajar con ellas: la más reciente primero
    const currentVisit = visits[0]; // Visita más reciente
    const previousVisit = visits[1]; // Visita anterior
    
    console.log(`📊 Comparando visita ${currentVisit.id} (${new Date(currentVisit.date).toLocaleDateString()}) con visita ${previousVisit.id} (${new Date(previousVisit.date).toLocaleDateString()})`);

    // 3. Obtener los contextos MCP de ambas visitas
    const { data: currentContextData, error: currentContextError } = await supabase
      .from('mcp_contexts')
      .select('context')
      .eq('visit_id', currentVisit.id)
      .single();

    const { data: previousContextData, error: previousContextError } = await supabase
      .from('mcp_contexts')
      .select('context')
      .eq('visit_id', previousVisit.id)
      .single();

    if (currentContextError || !currentContextData || previousContextError || !previousContextData) {
      console.error('Error: No se pudieron obtener los contextos MCP', currentContextError || previousContextError);
      return;
    }

    // 4. Comparar los contextos y calcular las métricas
    const currentContext = currentContextData.context;
    const previousContext = previousContextData.context;
    
    // Comparar número de campos completados
    const currentFields = currentContext.contextual?.data?.length || 0;
    const previousFields = previousContext.contextual?.data?.length || 0;
    const fieldsChanged = Math.abs(currentFields - previousFields);
    
    // 5. Obtener métricas de sugerencias IA de las visitas
    const { data: currentSuggestions, error: currentSuggestionsError } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('visit_id', currentVisit.id);
      
    const { data: previousSuggestions, error: previousSuggestionsError } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('visit_id', previousVisit.id);
      
    if (currentSuggestionsError || previousSuggestionsError) {
      console.error('Error: No se pudieron obtener las sugerencias IA', currentSuggestionsError || previousSuggestionsError);
    }
    
    // Métricas de sugerencias IA
    const suggestionsGenerated = (currentSuggestions?.length || 0);
    const suggestionsAccepted = (currentSuggestions?.filter(s => s.status === 'accepted')?.length || 0);
    const suggestionsIntegrated = (currentSuggestions?.filter(s => s.status === 'integrated')?.length || 0);
    
    // Métricas previas (para comparación)
    const previousSuggestionsGenerated = (previousSuggestions?.length || 0);
    const previousSuggestionsAccepted = (previousSuggestions?.filter(s => s.status === 'accepted')?.length || 0);
    const previousSuggestionsIntegrated = (previousSuggestions?.filter(s => s.status === 'integrated')?.length || 0);
    
    // 6. Obtener datos de audio transcriptions
    const { data: audioData, error: audioError } = await supabase
      .from('audio_transcriptions')
      .select('*')
      .eq('visit_id', currentVisit.id);
      
    if (audioError) {
      console.error('Error: No se pudieron obtener las transcripciones de audio', audioError);
    }
    
    // Calcular ítems de audio validados en total
    let audioItemsValidated = 0;
    
    if (audioData && audioData.length > 0) {
      // Para cada transcripción, contar los ítems aprobados
      audioData.forEach(transcription => {
        try {
          const content = JSON.parse(transcription.content as string);
          const approvedItems = content.filter((item: any) => item.status === 'approved').length;
          audioItemsValidated += approvedItems;
        } catch (e) {
          console.error('Error procesando contenido de transcripción:', e);
        }
      });
    }
    
    // 7. Calcular la evolución clínica
    // En este caso usamos el nivel de dolor reportado como indicador (valores menores son mejor evolución)
    // Buscamos en los contextos referencias al nivel de dolor
    
    const getCurrentPainLevel = (context: any): number => {
      // Buscar en los datos contextuales
      const painPattern = /dolor.*?(\d+)\/10|nivel de dolor.*?(\d+)\/10/i;
      
      // Buscar el patrón en todos los bloques de datos contextuales
      for (const block of context.contextual?.data || []) {
        const content = block.content || '';
        const match = content.match(painPattern);
        if (match) {
          // El valor podría estar en el primer o segundo grupo según el patrón
          return parseInt(match[1] || match[2], 10);
        }
      }
      
      // Si no encontramos, devolver un valor por defecto
      return 5; // Valor medio por defecto
    };
    
    const currentPainLevel = getCurrentPainLevel(currentContext);
    const previousPainLevel = getCurrentPainLevel(previousContext);
    
    console.log(`📈 Evolución del dolor: ${previousPainLevel}/10 → ${currentPainLevel}/10`);
    
    // Cálculo de evolución clínica (para dolor, menor es mejor)
    const clinicalEvolution = calculateClinicalEvolution(currentPainLevel, previousPainLevel, false);
    
    // 8. Determinación de nivel de riesgo
    const warningCount = currentSuggestions?.filter(s => s.type === 'warning' && s.status !== 'accepted')?.length || 0;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    if (warningCount > 0) {
      riskLevel = warningCount > 2 ? 'high' : 'medium';
    }
    
    // 9. Estimar tiempo ahorrado (aproximado)
    const timeSavedMinutes = suggestionsIntegrated * 2 + audioItemsValidated * 1;
    
    // 10. Crear el registro de métricas longitudinales
    const metricsData = {
      visit_id: currentVisit.id,
      previous_visit_id: previousVisit.id,
      patient_id: patient.id,
      user_id: currentVisit.professional_id,
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
          warnings: previousSuggestions?.filter(s => s.type === 'warning')?.length || 0,
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
    
    // 11. Guardar en Supabase
    const { data: insertResult, error: insertError } = await supabase
      .from('metrics_by_visit')
      .insert(metricsData);
      
    if (insertError) {
      console.error('Error: No se pudieron guardar las métricas longitudinales', insertError);
      return;
    }
    
    console.log(`✅ Métricas longitudinales generadas y guardadas correctamente`);
    console.log(`📊 Resumen: ${getEvolutionEmoji(clinicalEvolution)} Evolución clínica: ${clinicalEvolution}`);
    console.log(`⏱️ Tiempo estimado ahorrado: ${timeSavedMinutes} minutos`);
    console.log(`⚠️ Nivel de riesgo: ${riskLevel.toUpperCase()}`);
    
  } catch (error) {
    console.error('Error general en el proceso:', error);
  }
}

// Función auxiliar para obtener emoji de evolución
function getEvolutionEmoji(evolution: string): string {
  switch (evolution) {
    case 'improved': return '🟢';
    case 'stable': return '🟡';
    case 'worsened': return '🔴';
    default: return '⚪';
  }
}

// Exportar la función principal como default para poder importarla con dynamic import
export default generateLongitudinalMetrics; 