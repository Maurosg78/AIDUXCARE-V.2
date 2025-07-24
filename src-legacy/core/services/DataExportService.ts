import { FirestoreAuditLogger } from '../audit/FirestoreAuditLogger';

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  includeMetadata?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, unknown>;
}

export interface ExportResult {
  success: boolean;
  data?: string | Blob;
  filename?: string;
  recordCount: number;
  error?: string;
}

/**
 * Servicio de exportación de datos clínicos con auditoría integrada
 * Cumple HIPAA/GDPR: registra todas las exportaciones, incluye metadatos de auditoría
 */
export class DataExportService {
  /**
   * Exporta datos de paciente con auditoría automática
   */
  static async exportPatientData(
    patientId: string,
    userId: string,
    userRole: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Simular datos de paciente (en producción vendría de Firestore)
      const patientData = {
        id: patientId,
        name: 'Paciente Demo',
        visits: [
          { id: 'visit-1', date: '2025-01-15', reason: 'Consulta inicial' },
          { id: 'visit-2', date: '2025-01-22', reason: 'Seguimiento' }
        ],
        medications: ['Medicamento A', 'Medicamento B'],
        allergies: ['Alergia A'],
        notes: 'Notas clínicas del paciente'
      };

      let exportData: string;
      let filename: string;
      const recordCount = patientData.visits.length;

      switch (options.format) {
        case 'csv':
          exportData = this.generateCSV(patientData);
          filename = `patient_${patientId}_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'json':
          exportData = JSON.stringify(patientData, null, 2);
          filename = `patient_${patientId}_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'pdf':
          exportData = this.generatePDF(patientData);
          filename = `patient_${patientId}_${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        default:
          throw new Error('Formato de exportación no soportado');
      }

      // Registrar evento de auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'data_export',
        userId,
        userRole,
        patientId,
        metadata: {
          exportType: options.format,
          recordCount,
          filename,
          includeMetadata: options.includeMetadata,
          dateRange: options.dateRange,
          filters: options.filters,
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: true,
        data: exportData,
        filename,
        recordCount
      };
    } catch (error) {
      // Registrar evento de auditoría en caso de error
      await FirestoreAuditLogger.logEvent({
        type: 'data_export_failed',
        userId,
        userRole,
        patientId,
        metadata: {
          exportType: options.format,
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: false,
        recordCount: 0,
        error: (error as Error).message
      };
    }
  }

  /**
   * Exporta logs de auditoría (solo para administradores)
   */
  static async exportAuditLogs(
    userId: string,
    userRole: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Verificar permisos
      if (!['ADMIN', 'OWNER'].includes(userRole)) {
        throw new Error('Permisos insuficientes para exportar logs de auditoría');
      }

      // Obtener logs de auditoría
      const auditLogs = await FirestoreAuditLogger.exportAllLogs();
      const recordCount = auditLogs.length;

      let exportData: string;
      let filename: string;

      switch (options.format) {
        case 'csv':
          exportData = this.generateAuditCSV(auditLogs as unknown as Array<Record<string, unknown>>);
          filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'json':
          exportData = JSON.stringify(auditLogs, null, 2);
          filename = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
          break;
        default:
          throw new Error('Formato de exportación no soportado para logs de auditoría');
      }

      // Registrar evento de auditoría de exportación de logs
      await FirestoreAuditLogger.logEvent({
        type: 'audit_logs_export',
        userId,
        userRole,
        metadata: {
          exportType: options.format,
          recordCount,
          filename,
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: true,
        data: exportData,
        filename,
        recordCount
      };
    } catch (error) {
      return {
        success: false,
        recordCount: 0,
        error: (error as Error).message
      };
    }
  }

  /**
   * Genera CSV de datos de paciente
   */
  private static generateCSV(patientData: Record<string, unknown>): string {
    const headers = ['ID', 'Nombre', 'Visita', 'Fecha', 'Motivo', 'Medicamentos', 'Alergias'];
    const visits = patientData.visits as Array<Record<string, unknown>>;
    const rows = visits.map((visit) => [
      patientData.id,
      patientData.name,
      visit.id,
      visit.date,
      visit.reason,
      (patientData.medications as string[]).join('; '),
      (patientData.allergies as string[]).join('; ')
    ]);
    
    return [headers, ...rows].map(row => row.map((cell: unknown) => `"${String(cell)}"`).join(',')).join('\n');
  }

  /**
   * Genera CSV de logs de auditoría
   */
  private static generateAuditCSV(auditLogs: Array<Record<string, unknown>>): string {
    const headers = ['ID', 'Tipo', 'Usuario', 'Rol', 'Paciente', 'Visita', 'Timestamp', 'Metadatos'];
    const rows = auditLogs.map(log => [
      log.id || '',
      log.type,
      log.userId,
      log.userRole,
      log.patientId || '',
      log.visitId || '',
      (log.timestamp as Date).toISOString(),
      JSON.stringify(log.metadata || {})
    ]);
    
    return [headers, ...rows].map(row => row.map((cell: unknown) => `"${String(cell)}"`).join(',')).join('\n');
  }

  /**
   * Genera PDF de datos de paciente (simulado)
   */
  private static generatePDF(patientData: Record<string, unknown>): string {
    // En producción, usaría una librería como jsPDF
    return `PDF Report for Patient ${patientData.id}\nGenerated on ${new Date().toISOString()}`;
  }

  /**
   * Descarga archivo en el navegador
   */
  static downloadFile(content: string | Blob, filename: string): void {
    const blob = typeof content === 'string' 
      ? new Blob([content], { type: 'text/plain;charset=utf-8;' })
      : content;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
} 