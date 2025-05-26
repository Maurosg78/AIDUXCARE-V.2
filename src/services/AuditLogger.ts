interface AuditLogEntry {
  action: string;
  data: Record<string, any>;
}

export class AuditLogger {
  static async log(action: string, data: Record<string, any>): Promise<void> {
    // Aquí iría la implementación real
    console.log('Audit Log:', { action, data });
  }
} 