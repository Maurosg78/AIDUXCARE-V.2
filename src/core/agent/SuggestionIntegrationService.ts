import { AgentSuggestion, SuggestionField } from '@/types/agent';
import { AuditLogger } from '../audit/AuditLogger';
import supabase from '@/core/auth/supabaseClient';
import { track } from '@/lib/analytics';

interface EMRField {
  id: string;
  visit_id: string;
  field_name: string;
  content: string;
  updated_at: string;
}

export class SuggestionIntegrationService {
  private static readonly PREFIX = '🔎 ';
  private static readonly VALID_FIELDS: SuggestionField[] = [
    'diagnosis',
    'treatment',
    'followup',
    'medication',
    'vitals',
    'symptoms',
    'history',
    'lab_results',
    'imaging',
    'notes'
  ];

  /**
   * Integra una sugerencia del agente IA en el EMR estructurado
   * @param suggestion Sugerencia a integrar
   * @param visitId ID de la visita
   * @param userId ID del usuario que acepta la sugerencia
   */
  public static async integrateSuggestion(
    suggestion: AgentSuggestion,
    visitId: string,
    userId: string
  ): Promise<void> {
    try {
      // Validar la sugerencia
      if (!suggestion.content?.trim()) {
        throw new Error('La sugerencia no puede tener contenido vacío');
      }

      if (!this.VALID_FIELDS.includes(suggestion.field)) {
        throw new Error('Campo inválido para la integración');
      }

      // 1. Verificar que la visita existe
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .select('id, patient_id')
        .eq('id', visitId)
        .single();

      if (visitError || !visit) {
        throw new Error(`La visita ${visitId} no existe`);
      }

      const patientId = visit.patient_id || 'unknown';

      // 2. Registrar la integración en la base de datos
      const { error } = await supabase
        .from('integrated_suggestions')
        .insert({
          suggestion_id: suggestion.id,
          visit_id: visitId,
          user_id: userId,
          integrated_at: new Date().toISOString()
        });

      if (error) {
        // Registrar el error antes de lanzarlo
        track('suggestion_integration_error', {
          suggestion_id: suggestion.id,
          suggestion_type: suggestion.type,
          suggestion_field: suggestion.field,
          error_message: error.message
        });

        AuditLogger.log('suggestion.integration_error', {
          visitId,
          userId,
          patientId,
          suggestionId: suggestion.id,
          error: error.message
        });

        throw new Error(`Error al registrar la integración de la sugerencia: ${error.message}`);
      }

      // 3. Registrar el evento de integración
      track('suggestions_integrated', {
        suggestion_id: suggestion.id,
        suggestion_type: suggestion.type,
        suggestion_field: suggestion.field
      });

      // 4. Obtener el campo actual del EMR
      const { data: currentField, error: fieldError } = await supabase
        .from('emr_fields')
        .select('*')
        .eq('visit_id', visitId)
        .eq('field_name', suggestion.field)
        .single();

      if (fieldError && fieldError.code !== 'PGRST116') {
        throw new Error(`Error al obtener el campo: ${fieldError.message}`);
      }

      // 5. Preparar el nuevo contenido
      const newContent = currentField
        ? `${currentField.content}\n\n${this.PREFIX}${suggestion.content}`
        : suggestion.content;

      // 6. Actualizar o insertar el campo
      const { error: upsertError } = await supabase
        .from('emr_fields')
        .upsert({
          visit_id: visitId,
          field_name: suggestion.field,
          content: newContent,
          updated_at: new Date().toISOString()
        });

      if (upsertError) {
        // Registrar el error antes de lanzarlo
        track('suggestion_integration_error', {
          suggestion_id: suggestion.id,
          suggestion_type: suggestion.type,
          suggestion_field: suggestion.field,
          error_message: upsertError.message
        });

        AuditLogger.log('suggestion.integration_error', {
          visitId,
          userId,
          patientId,
          suggestionId: suggestion.id,
          error: upsertError.message
        });

        throw new Error(`Error al integrar la sugerencia: ${upsertError.message}`);
      }

      // 7. Registrar el evento en Langfuse
      AuditLogger.log('suggestion.integrated', {
        visitId,
        userId,
        patientId,
        suggestionId: suggestion.id,
        field: suggestion.field,
        acceptedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error al integrar sugerencia:', error);
      throw error;
    }
  }
} 