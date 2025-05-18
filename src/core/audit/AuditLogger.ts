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
