import supabase from '@/core/auth/supabaseClient';

export interface AuditEvent {
  id: string;
  type: string;
  userId: string;
  visitId?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export class AuditLogger {
  /**
   * Registra un evento en el sistema de auditoría
   * @param eventType Tipo de evento a registrar
   * @param payload Datos asociados al evento
   */
  static log(eventType: string, payload: Record<string, any>) {
    console.log(`[AuditLogger] ${eventType}`, payload);
    return true;
  }

  /**
   * Registra la integración de una sugerencia en el EMR
   * @param userId ID del usuario que realiza la acción
   * @param visitId ID de la visita
   * @param suggestionId ID de la sugerencia
   * @param suggestionType Tipo de sugerencia
   * @param content Contenido de la sugerencia
   * @param emrSection Sección del EMR donde se integró
   */
  static logSuggestionIntegration(
    userId: string,
    visitId: string,
    suggestionId: string,
    suggestionType: string,
    content: string,
    emrSection: string
  ) {
    const timestamp = new Date().toISOString();
    
    return this.log('suggestion_integrated', {
      visitId,
      userId,
      suggestionId,
      suggestion_type: suggestionType,
      field_id: emrSection,
      content,
      timestamp
    });
  }

  /**
   * Registra la retroalimentación proporcionada sobre una sugerencia clínica
   * @param userId ID del usuario que proporciona la retroalimentación
   * @param visitId ID de la visita relacionada
   * @param suggestionId ID de la sugerencia evaluada
   * @param feedbackType Tipo de retroalimentación (useful, irrelevant, incorrect, dangerous)
   * @param suggestionType Tipo original de la sugerencia
   */
  static logSuggestionFeedback(
    userId: string,
    visitId: string,
    suggestionId: string,
    feedbackType: 'useful' | 'irrelevant' | 'incorrect' | 'dangerous',
    suggestionType: string
  ) {
    const timestamp = new Date().toISOString();
    
    return this.log('suggestion_feedback_given', {
      visitId,
      userId,
      suggestionId,
      suggestion_type: suggestionType,
      feedback_type: feedbackType,
      timestamp
    });
  }

  static logBlockUpdates(...args: any[]) {
    console.log('[AuditLogger] blockUpdate', ...args);
  }

  static clearLogs() {
    console.log('[AuditLogger] clearLogs');
  }

  static getAuditLogs(): AuditLogEntry[] {
    return [];
  }

  static getAuditLogsFromSupabase(visitId: string): Promise<AuditLogEntry[]> {
    return Promise.resolve([]);
  }

  public static async logEvent(
    type: string,
    userId: string,
    metadata: Record<string, unknown>,
    visitId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          type,
          user_id: userId,
          visit_id: visitId,
          metadata,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error al registrar evento de auditoría:', error);
      throw error;
    }
  }

  public static async getEvents(
    userId?: string,
    visitId?: string,
    type?: string
  ): Promise<AuditEvent[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (visitId) {
        query = query.eq('visit_id', visitId);
      }

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.map(event => ({
        id: event.id,
        type: event.type,
        userId: event.user_id,
        visitId: event.visit_id,
        metadata: event.metadata,
        createdAt: new Date(event.created_at)
      }));
    } catch (error) {
      console.error('Error al obtener eventos de auditoría:', error);
      throw error;
    }
  }
}

export type AuditLogEntry = {
  visit_id: string;
  user_id: string;
  event_type: string;
  timestamp: string;
  source?: string;
  block_type?: string;
  old_content?: string;
  new_content?: string;
  suggestion_type?: string;
  suggestion_content?: string;
  emr_section?: string;
  field?: string;
  field_id?: string;
  suggestionId?: string;
  content?: string;
  feedback_type?: 'useful' | 'irrelevant' | 'incorrect' | 'dangerous';
  details?: {
    visit_id?: string;
    patient_id?: string;
    blocks_count?: number;
    suggestions_count?: number;
    description?: string;
  };
};

export type MCPUpdateAuditEntry = AuditLogEntry;
export type SuggestionIntegrationAuditEntry = AuditLogEntry;
