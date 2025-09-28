// @ts-nocheck
import logger from '@/shared/utils/logger';
export class AuditLogger {
  static async log(action: string, data: Record<string, unknown>): Promise<void> {
    // Aquí iría la implementación real
    console.log('Audit Log:', { action, data });
  }
} 