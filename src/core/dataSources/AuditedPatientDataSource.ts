import { Patient, calculateAge } from '../domain/patientType';
import { FirestoreAuditLogger } from '../audit/FirestoreAuditLogger';

import { patientDataSourceFirestore } from './patientDataSourceFirestore';

/**
 * Wrapper de auditoría para PatientDataSource
 * Registra automáticamente todos los accesos y modificaciones a datos clínicos
 */
export class AuditedPatientDataSource {
  private dataSource = patientDataSourceFirestore;

  /**
   * Obtiene todos los pacientes con auditoría de acceso
   */
  async getAllPatients(professionalId: string, userId: string, userRole: string): Promise<Patient[]> {
    try {
      const patients = await this.dataSource.getAllPatients(professionalId);
      
      // Registrar acceso a datos clínicos
      await FirestoreAuditLogger.logEvent({
        type: 'patient_data_access',
        userId,
        userRole,
        metadata: {
          action: 'get_all_patients',
          professionalId,
          patientsCount: patients.length,
          accessType: 'read'
        },
      });

      return patients;
    } catch (error) {
      // Registrar acceso fallido
      await FirestoreAuditLogger.logEvent({
        type: 'patient_data_access_failed',
        userId,
        userRole,
        metadata: {
          action: 'get_all_patients',
          professionalId,
          error: (error as Error).message
        },
      });
      throw error;
    }
  }

  /**
   * Obtiene un paciente por ID con auditoría
   */
  async getPatientById(patientId: string, userId: string, userRole: string): Promise<Patient | null> {
    try {
      const patient = await this.dataSource.getPatientById(patientId);
      
      // Registrar acceso a datos clínicos específicos
      await FirestoreAuditLogger.logEvent({
        type: 'patient_data_access',
        userId,
        userRole,
        patientId,
        metadata: {
          action: 'get_patient_by_id',
          patientId,
          accessType: 'read',
          patientFound: !!patient
        },
      });

      return patient;
    } catch (error) {
      // Registrar acceso fallido
      await FirestoreAuditLogger.logEvent({
        type: 'patient_data_access_failed',
        userId,
        userRole,
        patientId,
        metadata: {
          action: 'get_patient_by_id',
          patientId,
          error: (error as Error).message
        },
      });
      throw error;
    }
  }

  /**
   * Crea un nuevo paciente con auditoría
   */
  async createPatient(
    patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'>, 
    professionalId: string,
    userId: string,
    userRole: string
  ): Promise<Patient> {
    try {
      const patient = await this.dataSource.createPatient(patientData, professionalId);
      
      // Registrar creación de datos clínicos
      await FirestoreAuditLogger.logEvent({
        type: 'patient_data_created',
        userId,
        userRole,
        patientId: patient.id,
        metadata: {
          action: 'create_patient',
          professionalId,
          patientName: `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
          patientAge: calculateAge(patient.personalInfo.dateOfBirth),
          patientGender: patient.personalInfo.gender
        },
      });

      return patient;
    } catch (error) {
      // Registrar creación fallida
      await FirestoreAuditLogger.logEvent({
        type: 'patient_data_creation_failed',
        userId,
        userRole,
        metadata: {
          action: 'create_patient',
          professionalId,
          patientData: { name: patientData.personalInfo?.firstName ?? '', age: patientData.personalInfo?.dateOfBirth ? calculateAge(patientData.personalInfo.dateOfBirth) : undefined },
          error: (error as Error).message
        },
      });
      throw error;
    }
  }

  /**
   * Actualiza un paciente con auditoría
   */
  async updatePatient(
    patientId: string, 
    patientData: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>,
    userId: string,
    userRole: string
  ): Promise<Patient> {
    try {
      // Obtener datos originales para auditoría
      const originalPatient = await this.dataSource.getPatientById(patientId);
      
      const updatedPatient = await this.dataSource.updatePatient(patientId, patientData);
      
      // Registrar modificación de datos clínicos
      await FirestoreAuditLogger.logEvent({
        type: 'patient_data_modified',
        userId,
        userRole,
        patientId,
        metadata: {
          action: 'update_patient',
          originalData: originalPatient ? {
            name: `${originalPatient.personalInfo.firstName} ${originalPatient.personalInfo.lastName}`,
            age: calculateAge(originalPatient.personalInfo.dateOfBirth),
            gender: originalPatient.personalInfo.gender
          } : null,
          newData: {
            name: `${patientData.personalInfo?.firstName ?? ''} ${patientData.personalInfo?.lastName ?? ''}`,
            age: patientData.personalInfo?.dateOfBirth ? calculateAge(patientData.personalInfo.dateOfBirth) : undefined,
            gender: patientData.personalInfo?.gender
          },
          changesDetected: this.detectChanges(originalPatient, patientData)
        },
      });

      return updatedPatient;
    } catch (error) {
      // Registrar modificación fallida
      await FirestoreAuditLogger.logEvent({
        type: 'patient_data_modification_failed',
        userId,
        userRole,
        patientId,
        metadata: {
          action: 'update_patient',
          patientData: { name: patientData.personalInfo?.firstName ?? '', age: patientData.personalInfo?.dateOfBirth ? calculateAge(patientData.personalInfo.dateOfBirth) : undefined },
          error: (error as Error).message
        },
      });
      throw error;
    }
  }

  /**
   * Elimina un paciente con auditoría
   */
  async deletePatient(patientId: string, userId: string, userRole: string): Promise<boolean> {
    try {
      // Obtener datos del paciente antes de eliminar
      const patient = await this.dataSource.getPatientById(patientId);
      
      const result = await this.dataSource.deletePatient(patientId);
      
      // Registrar eliminación de datos clínicos
      await FirestoreAuditLogger.logEvent({
        type: 'patient_data_deleted',
        userId,
        userRole,
        patientId,
        metadata: {
          action: 'delete_patient',
          patientName: `${patient?.personalInfo.firstName} ${patient?.personalInfo.lastName}`,
          patientAge: calculateAge(patient?.personalInfo?.dateOfBirth ?? new Date(0)),
          patientGender: patient?.personalInfo.gender,
          deletionSuccessful: result
        },
      });

      return result;
    } catch (error) {
      // Registrar eliminación fallida
      await FirestoreAuditLogger.logEvent({
        type: 'patient_data_deletion_failed',
        userId,
        userRole,
        patientId,
        metadata: {
          action: 'delete_patient',
          error: (error as Error).message
        },
      });
      throw error;
    }
  }

  /**
   * Detecta cambios entre datos originales y nuevos
   */
  private detectChanges(original: Patient | null, updated: Partial<Patient>): string[] {
    if (!original) return ['new_patient'];
    
    const changes: string[] = [];
    
    if (updated.personalInfo && updated.personalInfo.firstName && updated.personalInfo.firstName !== original.personalInfo.firstName) {
      changes.push('name_changed');
    }
    if (updated.personalInfo && updated.personalInfo.lastName && updated.personalInfo.lastName !== original.personalInfo.lastName) {
      changes.push('name_changed');
    }
    if (updated.personalInfo && updated.personalInfo.dateOfBirth && updated.personalInfo.dateOfBirth !== original.personalInfo.dateOfBirth) {
      changes.push('age_changed');
    }
    if (updated.personalInfo && updated.personalInfo.gender && updated.personalInfo.gender !== original.personalInfo.gender) {
      changes.push('gender_changed');
    }
    
    return changes;
  }
}

// Exportar instancia singleton
export const auditedPatientDataSource = new AuditedPatientDataSource(); 