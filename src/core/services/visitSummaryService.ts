import supabase from '@/core/auth/supabaseClient';
import { AuditLogger } from '@/core/audit/AuditLogger';

interface SaveVisitSummaryParams {
  visitId: string;
  userId: string;
  summaryText: string;
}

/**
 * Guarda o actualiza un resumen clínico en la base de datos
 * @param params Parámetros del resumen a guardar
 * @returns true si se guardó correctamente
 */
export async function saveVisitSummary({
  visitId,
  userId,
  summaryText
}: SaveVisitSummaryParams): Promise<boolean> {
  try {
    // Verificar si ya existe un resumen para esta visita
    const { data: existingSummary } = await supabase
      .from('visit_summaries')
      .select('id')
      .eq('visit_id', visitId)
      .single();

    const now = new Date().toISOString();
    const summaryData = {
      visit_id: visitId,
      summary_text: summaryText,
      generated_by: 'ai-agent',
      saved_by: userId,
      updated_at: now
    };

    let error;

    if (existingSummary) {
      // Actualizar resumen existente
      const { error: updateError } = await supabase
        .from('visit_summaries')
        .update(summaryData)
        .eq('visit_id', visitId);

      error = updateError;
    } else {
      // Crear nuevo resumen
      const { error: insertError } = await supabase
        .from('visit_summaries')
        .insert([{
          ...summaryData,
          created_at: now
        }]);

      error = insertError;
    }

    if (error) {
      throw new Error(`Error al guardar resumen: ${error.message}`);
    }

    // Registrar evento en Langfuse
    AuditLogger.log('summary.saved', {
      visitId,
      userId,
      timestamp: now,
      action: existingSummary ? 'update' : 'create'
    });

    return true;

  } catch (error) {
    console.error('Error en saveVisitSummary:', error);
    throw new Error('No se pudo guardar el resumen. Intente nuevamente.');
  }
} 