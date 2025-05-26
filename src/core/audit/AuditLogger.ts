import supabase from '@/core/auth/supabaseClient';

export interface AuditEvent {
  id: string;
  type: string;
  userId: string;
  visitId?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  visit_id: string;
  patient_id: string;
  timestamp: string;
  metadata: Record<string, unknown>;
  event_type?: string;
  source?: string;
  block_type?: string;
  old_content?: string;
  new_content?: string;
  suggestion_type?: string;
  suggestion_content?: string;
  emr_section?: string;
  details?: {
    visit_id?: string;
    patient_id?: string;
    blocks_count?: number;
    suggestions_count?: number;
    description?: string;
    block_type?: string;
    block_content?: string;
    suggestion_content?: string;
    emr_section?: string;
  };
}

export interface BlockUpdate {
  id: string;
  type: 'contextual' | 'persistent' | 'semantic';
  content: string;
  visit_id: string;
  patient_id?: string;
}

export class AuditLogger {
  private static logs: AuditLogEntry[] = [];

  /**
   * Obtiene todos los logs de auditoría almacenados
   * @returns Array de entradas de log
   */
  static getAuditLogs(): AuditLogEntry[] {
    return this.logs;
  }

  /**
   * Limpia todos los logs de auditoría almacenados
   */
  static clearLogs(): void {
    this.logs = [];
  }

  /**
   * Registra actualizaciones de bloques en el sistema de auditoría
   * @param oldBlocks Bloques originales
   * @param newBlocks Bloques actualizados
   * @param userId ID del usuario que realiza la actualización
   * @param visitId ID de la visita
   */
  static logBlockUpdates(
    oldBlocks: BlockUpdate[],
    newBlocks: BlockUpdate[],
    userId: string,
    visitId: string
  ): void {
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      user_id: userId,
      action: 'block.update',
      visit_id: visitId,
      patient_id: oldBlocks[0]?.patient_id || '',
      timestamp: new Date().toISOString(),
      metadata: {
        oldBlocks,
        newBlocks
      },
      event_type: 'mcp.block.update',
      block_type: oldBlocks[0]?.type,
      old_content: oldBlocks[0]?.content,
      new_content: newBlocks[0]?.content
    };

    this.logs.push(entry);
  }

  /**
   * Registra un evento en el sistema de auditoría
   * @param eventType Tipo de evento a registrar
   * @param payload Datos asociados al evento
   */
  static log(
    action: string,
    metadata: {
      userId: string;
      visitId: string;
      patientId: string;
      [key: string]: unknown;
    }
  ): void {
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      user_id: metadata.userId,
      action,
      visit_id: metadata.visitId,
      patient_id: metadata.patientId,
      timestamp: new Date().toISOString(),
      metadata,
      event_type: action
    };

    this.logs.push(entry);
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
    suggestionType: 'recommendation' | 'warning' | 'info',
    content: string,
    section: string
  ): void {
    this.log('suggestion.integration', {
      userId,
      visitId,
      patientId: '', // Necesitamos obtener el patientId de alguna manera
      suggestionId,
      suggestionType,
      content,
      section
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
  ): void {
    this.log('suggestion_feedback_given', {
      userId,
      visitId,
      patientId: '', // Necesitamos obtener el patientId de alguna manera
      suggestionId,
      suggestion_type: suggestionType,
      feedback_type: feedbackType,
      timestamp: new Date().toISOString()
    });
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

export type MCPUpdateAuditEntry = AuditLogEntry & {
  event_type: 'mcp.block.update';
};

export type SuggestionIntegrationAuditEntry = AuditLogEntry & {
  event_type: 'suggestion.integrated';
};
