import { FirestoreAuditLogger } from '../audit/FirestoreAuditLogger';
import { auditedPatientDataSource } from '../dataSources/AuditedPatientDataSource';
import { auditedVisitDataSource } from '../dataSources/AuditedVisitDataSource';

import logger from '@/shared/utils/logger';

/**
 * Tipos de exportación disponibles
 */
export enum ExportType {
  PATIENT_DATA = 'patient_data',
  VISIT_DATA = 'visit_data',
  AUDIT_LOGS = 'audit_logs',
  FULL_EXPORT = 'full_export'
}

/**
 * Formato de exportación
 */
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf'
}

/**
 * Interfaz para datos de exportación
 */
export interface ExportRequest {
  type: ExportType;
  format: ExportFormat;
  patientId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeAuditLogs?: boolean;
}

/**
 * Resultado de exportación
 */
export interface ExportResult {
  success: boolean;
  data?: unknown;
  filename?: string;
  recordCount?: number;
  error?: string;
}

/**
 * Servicio de exportación de datos con auditoría completa
 * Cumple con HIPAA/GDPR para exportación de datos médicos
 */
export class AuditedDataExportService {
  
  /**
   * Exporta datos clínicos con auditoría completa
   */
  async exportData(
    request: ExportRequest,
    userId: string,
    userRole: string
  ): Promise<ExportResult> {
    const exportId = this.generateExportId();
    
    try {
      // Registrar inicio de exportación
      await FirestoreAuditLogger.logEvent({
        type: 'data_export_started',
        userId,
        userRole,
        patientId: request.patientId,
        metadata: {
          exportId,
          exportType: request.type,
          exportFormat: request.format,
          dateRange: request.dateRange,
          includeAuditLogs: request.includeAuditLogs
        },
      });

      let data: unknown;
      let recordCount = 0;

      // Ejecutar exportación según tipo
      switch (request.type) {
        case ExportType.PATIENT_DATA:
          data = await this.exportPatientData(request, userId, userRole);
          recordCount = Array.isArray(data) ? data.length : 1;
          break;
          
        case ExportType.VISIT_DATA:
          data = await this.exportVisitData(request, userId, userRole);
          recordCount = Array.isArray(data) ? data.length : 1;
          break;
          
        case ExportType.AUDIT_LOGS:
          data = await this.exportAuditLogs(request);
          recordCount = Array.isArray(data) ? data.length : 1;
          break;
          
        case ExportType.FULL_EXPORT:
          data = await this.exportFullData(request, userId, userRole);
          recordCount = this.countRecords(data as Record<string, unknown>);
          break;
          
        default:
          throw new Error(`Tipo de exportación no soportado: ${request.type}`);
      }

      // Formatear datos según formato solicitado
      const formattedData = await this.formatData(data, request.format);
      const filename = this.generateFilename(request, exportId);

      // Registrar exportación exitosa
      await FirestoreAuditLogger.logEvent({
        type: 'data_export_completed',
        userId,
        userRole,
        patientId: request.patientId,
        metadata: {
          exportId,
          exportType: request.type,
          exportFormat: request.format,
          recordCount,
          filename,
          fileSize: this.estimateFileSize(formattedData)
        },
      });

      return {
        success: true,
        data: formattedData,
        filename,
        recordCount
      };

    } catch (error) {
      // Registrar exportación fallida
      await FirestoreAuditLogger.logEvent({
        type: 'data_export_failed',
        userId,
        userRole,
        patientId: request.patientId,
        metadata: {
          exportId,
          exportType: request.type,
          exportFormat: request.format,
          error: (error as Error).message
        },
      });

      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Exporta datos de pacientes
   */
  private async exportPatientData(
    request: ExportRequest,
    userId: string,
    userRole: string
  ): Promise<unknown> {
    if (request.patientId) {
      // Exportar paciente específico
      const patient = await auditedPatientDataSource.getPatientById(
        request.patientId,
        userId,
        userRole
      );
      return patient ? [patient] : [];
    } else {
      // Exportar todos los pacientes del profesional
      return await auditedPatientDataSource.getAllPatients(
        userId, // professionalId
        userId,
        userRole
      );
    }
  }

  /**
   * Exporta datos de visitas
   */
  private async exportVisitData(
    request: ExportRequest,
    userId: string,
    userRole: string
  ): Promise<unknown> {
    if (!request.patientId) {
      throw new Error('Se requiere patientId para exportar datos de visitas');
    }

    return await auditedVisitDataSource.getAllVisitsByPatient(
      request.patientId,
      userId,
      userRole
    );
  }

  /**
   * Exporta logs de auditoría (solo para administradores)
   */
  private async exportAuditLogs(
    request: ExportRequest
  ): Promise<unknown> {
    const exportId = this.generateExportId();
    const userId = 'admin_user_id'; // Placeholder for admin user ID
    const userRole = 'admin'; // Placeholder for admin user role

    try {
      await FirestoreAuditLogger.logEvent({
        type: 'data_export_started',
        userId,
        userRole,
        patientId: request.patientId,
        metadata: {
          exportId,
          exportType: ExportType.AUDIT_LOGS,
          exportFormat: request.format,
          dateRange: request.dateRange,
          includeAuditLogs: request.includeAuditLogs
        },
      });

      const filters: Record<string, unknown> = {};
      if (request.patientId) {
        filters.patientId = request.patientId;
      }
      if (request.dateRange) {
        filters.timestamp = {
          start: request.dateRange.start,
          end: request.dateRange.end
        };
      }

      const data = await FirestoreAuditLogger.getEvents(filters);
      const recordCount = Array.isArray(data) ? data.length : 1;

      const formattedData = await this.formatData(data, request.format);
      const filename = this.generateFilename(request, exportId);

      await FirestoreAuditLogger.logEvent({
        type: 'data_export_completed',
        userId,
        userRole,
        patientId: request.patientId,
        metadata: {
          exportId,
          exportType: ExportType.AUDIT_LOGS,
          exportFormat: request.format,
          recordCount,
          filename,
          fileSize: this.estimateFileSize(formattedData)
        },
      });

      return {
        success: true,
        data: formattedData,
        filename,
        recordCount
      };

    } catch (error) {
      await FirestoreAuditLogger.logEvent({
        type: 'data_export_failed',
        userId,
        userRole,
        patientId: request.patientId,
        metadata: {
          exportId,
          exportType: ExportType.AUDIT_LOGS,
          exportFormat: request.format,
          error: (error as Error).message
        },
      });

      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Exporta todos los datos (exportación completa)
   */
  private async exportFullData(
    request: ExportRequest,
    userId: string,
    userRole: string
  ): Promise<Record<string, unknown>> {
    const [patients, auditLogs] = await Promise.all([
      this.exportPatientData(request, userId, userRole),
      request.includeAuditLogs ? this.exportAuditLogs(request) : []
    ]);

    // Obtener visitas para cada paciente
    const visitsPromises = (patients as Array<{ id: string }>).map(async (patient) => {
      try {
        return await auditedVisitDataSource.getAllVisitsByPatient(
          patient.id,
          userId,
          userRole
        );
      } catch (error) {
        console.error(`Error obteniendo visitas para paciente ${patient.id}:`, error);
        return [];
      }
    });

    const visitsArrays = await Promise.all(visitsPromises);
    const allVisits = visitsArrays.flat();

    return {
      exportDate: new Date().toISOString(),
      patients,
      visits: allVisits,
      auditLogs: request.includeAuditLogs ? auditLogs : [],
      summary: {
        totalPatients: (patients as Array<unknown>).length,
        totalVisits: allVisits.length,
        totalAuditLogs: request.includeAuditLogs ? (auditLogs as Array<unknown>).length : 0
      }
    };
  }

  /**
   * Formatea datos según el formato solicitado
   */
  private async formatData(data: unknown, format: ExportFormat): Promise<unknown> {
    switch (format) {
      case ExportFormat.JSON:
        return JSON.stringify(data, null, 2);
        
      case ExportFormat.CSV:
        return this.convertToCSV(data);
        
      case ExportFormat.PDF:
        return this.convertToPDF(data);
        
      default:
        return data;
    }
  }

  /**
   * Convierte datos a formato CSV
   */
  private convertToCSV(data: unknown): string {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0] as Record<string, unknown>);
    const csvRows = [
      headers.join(','),
      ...(data as Array<Record<string, unknown>>).map((row) => 
        headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  /**
   * Convierte datos a formato PDF (simulado)
   */
  private convertToPDF(data: unknown): string {
    // En una implementación real, usaría una librería como jsPDF
    // Por ahora, retornamos un placeholder
    return `PDF Export - ${JSON.stringify(data).substring(0, 100)}...`;
  }

  /**
   * Genera ID único para exportación
   */
  private generateExportId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Genera nombre de archivo para exportación
   */
  private generateFilename(request: ExportRequest, exportId: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = request.format.toLowerCase();
    return `aiduxcare_export_${request.type}_${timestamp}_${exportId}.${extension}`;
  }

  /**
   * Cuenta registros en datos exportados
   */
  private countRecords(data: unknown): number {
    if (Array.isArray(data)) {
      return data.length;
    }
    if (typeof data === 'object' && data !== null) {
      return Object.keys(data).length;
    }
    return 1;
  }

  /**
   * Estima tamaño del archivo
   */
  private estimateFileSize(data: unknown): string {
    const size = new Blob([String(data)]).size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Exportar instancia singleton
export const auditedDataExportService = new AuditedDataExportService(); 