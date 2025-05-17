export class AuditLogger {
  static log(...args: any[]) {
    console.log('[AuditLogger] log', ...args);
  }

  static logSuggestionIntegration(...args: any[]) {
    console.log('[AuditLogger] suggestionIntegration', ...args);
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
