import { Visit } from '../domain/visitType';
import { visitDataSourceFirestore } from './visitDataSourceFirestore.singleton';
import { FirestoreAuditLogger } from '../audit/FirestoreAuditLogger';

/**
 * Wrapper de auditoría para VisitDataSource
 * Registra automáticamente todos los accesos y modificaciones a visitas clínicas
 */
export class AuditedVisitDataSource {
  private dataSource = visitDataSourceFirestore;

  /**
   * Obtiene todas las visitas de un paciente con auditoría
   */
  async getAllVisitsByPatient(
    patientId: string, 
    userId: string, 
    userRole: string
  ): Promise<Visit[]> {
    try {
      const visits = await this.dataSource.getAllVisitsByPatient(patientId);
      
      // Registrar acceso a visitas clínicas
      await FirestoreAuditLogger.logEvent({
        type: 'visit_data_access',
        userId,
        userRole,
        patientId,
        metadata: {
          action: 'get_all_visits_by_patient',
          patientId,
          visitsCount: visits.length,
          accessType: 'read'
        },
      });

      return visits;
    } catch (error) {
      // Registrar acceso fallido
      await FirestoreAuditLogger.logEvent({
        type: 'visit_data_access_failed',
        userId,
        userRole,
        patientId,
        metadata: {
          action: 'get_all_visits_by_patient',
          patientId,
          error: (error as Error).message
        },
      });
      throw error;
    }
  }

  /**
   * Obtiene una visita por ID con auditoría
   */
  async getVisitById(visitId: string, userId: string, userRole: string): Promise<Visit | null> {
    try {
      const visit = await this.dataSource.getVisitById(visitId);
      
      // Registrar acceso a visita clínica específica
      await FirestoreAuditLogger.logEvent({
        type: 'visit_data_access',
        userId,
        userRole,
        visitId,
        patientId: visit?.patient_id,
        metadata: {
          action: 'get_visit_by_id',
          visitId,
          accessType: 'read',
          visitFound: !!visit,
          visitStatus: visit?.status
        },
      });

      return visit;
    } catch (error) {
      // Registrar acceso fallido
      await FirestoreAuditLogger.logEvent({
        type: 'visit_data_access_failed',
        userId,
        userRole,
        visitId,
        metadata: {
          action: 'get_visit_by_id',
          visitId,
          error: (error as Error).message
        },
      });
      throw error;
    }
  }

  /**
   * Crea una nueva visita con auditoría
   */
  async createVisit(
    visitData: Omit<Visit, 'id' | 'created_at' | 'updated_at'>, 
    patientId: string,
    userId: string,
    userRole: string
  ): Promise<Visit> {
    try {
      const visit = await this.dataSource.createVisit(visitData, patientId);
      
      // Registrar creación de visita clínica
      await FirestoreAuditLogger.logEvent({
        type: 'visit_data_created',
        userId,
        userRole,
        visitId: visit.id,
        patientId,
        metadata: {
          action: 'create_visit',
          patientId,
          visitStatus: visit.status,
          visitDate: visit.date,
          visitNotes: visit.notes ? visit.notes.substring(0, 100) + '...' : null
        },
      });

      return visit;
    } catch (error) {
      // Registrar creación fallida
      await FirestoreAuditLogger.logEvent({
        type: 'visit_data_creation_failed',
        userId,
        userRole,
        patientId,
        metadata: {
          action: 'create_visit',
          patientId,
          visitData: { 
            status: visitData.status,
            date: visitData.date 
          },
          error: (error as Error).message
        },
      });
      throw error;
    }
  }

  /**
   * Actualiza una visita con auditoría
   */
  async updateVisit(
    visitId: string, 
    visitData: Partial<Omit<Visit, 'id' | 'created_at' | 'updated_at'>>,
    userId: string,
    userRole: string
  ): Promise<Visit> {
    try {
      // Obtener datos originales para auditoría
      const originalVisit = await this.dataSource.getVisitById(visitId);
      
      const updatedVisit = await this.dataSource.updateVisit(visitId, visitData);
      
      // Registrar modificación de visita clínica
      await FirestoreAuditLogger.logEvent({
        type: 'visit_data_modified',
        userId,
        userRole,
        visitId,
        patientId: updatedVisit.patient_id,
        metadata: {
          action: 'update_visit',
          originalData: originalVisit ? {
            status: originalVisit.status,
            date: originalVisit.date,
            notes: originalVisit.notes ? originalVisit.notes.substring(0, 100) + '...' : null
          } : null,
          newData: {
            status: visitData.status,
            date: visitData.date,
            notes: visitData.notes ? visitData.notes.substring(0, 100) + '...' : null
          },
          changesDetected: this.detectVisitChanges(originalVisit, visitData)
        },
      });

      return updatedVisit;
    } catch (error) {
      // Registrar modificación fallida
      await FirestoreAuditLogger.logEvent({
        type: 'visit_data_modification_failed',
        userId,
        userRole,
        visitId,
        metadata: {
          action: 'update_visit',
          visitData: { 
            status: visitData.status,
            date: visitData.date 
          },
          error: (error as Error).message
        },
      });
      throw error;
    }
  }

  /**
   * Elimina una visita con auditoría
   */
  async deleteVisit(visitId: string, userId: string, userRole: string): Promise<boolean> {
    try {
      // Obtener datos de la visita antes de eliminar
      const visit = await this.dataSource.getVisitById(visitId);
      
      const result = await this.dataSource.deleteVisit(visitId);
      
      // Registrar eliminación de visita clínica
      await FirestoreAuditLogger.logEvent({
        type: 'visit_data_deleted',
        userId,
        userRole,
        visitId,
        patientId: visit?.patient_id,
        metadata: {
          action: 'delete_visit',
          visitStatus: visit?.status,
          visitDate: visit?.date,
          deletionSuccessful: result
        },
      });

      return result;
    } catch (error) {
      // Registrar eliminación fallida
      await FirestoreAuditLogger.logEvent({
        type: 'visit_data_deletion_failed',
        userId,
        userRole,
        visitId,
        metadata: {
          action: 'delete_visit',
          error: (error as Error).message
        },
      });
      throw error;
    }
  }

  /**
   * Detecta cambios entre datos originales y nuevos de la visita
   */
  private detectVisitChanges(original: Visit | null, updated: Partial<Visit>): string[] {
    if (!original) return ['new_visit'];
    
    const changes: string[] = [];
    
    if (updated.status && updated.status !== original.status) {
      changes.push('status_changed');
    }
    if (updated.date && updated.date !== original.date) {
      changes.push('date_changed');
    }
    if (updated.notes && updated.notes !== original.notes) {
      changes.push('notes_changed');
    }
    
    return changes;
  }
}

// Exportar instancia singleton
export const auditedVisitDataSource = new AuditedVisitDataSource(); 