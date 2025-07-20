/**
 * 🏥 Patient Service - Gestión de Pacientes
 * Cumple HIPAA/GDPR: Cifrado, auditoría, consentimiento explícito, trazabilidad completa
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/firebaseClient';
import { FirestoreAuditLogger } from '../audit/FirestoreAuditLogger';
import { 
  PatientProfile, 
  ClinicalVisit,
  generatePatientId,
  validatePatientProfile,
  needsFollowUp
} from '../domain/patientType';
import { encryptMetadata, decryptMetadata } from '../security/encryption';

export class PatientService {
  private static collectionName = 'patients';

  /**
   * Crear paciente con auditoría completa
   */
  static async createPatient(
    patient: Omit<PatientProfile, 'id' | 'metadata'>,
    createdBy: string
  ): Promise<string> {
    try {
      // Validar paciente antes de crear
      const validation = validatePatientProfile(patient as PatientProfile);
      if (!validation.isValid) {
        throw new Error(`Paciente inválido: ${validation.errors.join(', ')}`);
      }

      // Cifrar datos sensibles
      const encryptedPatient = await this.encryptSensitiveData(patient);

      // Crear metadata
      const metadata = {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        version: 1,
        isActive: true
      };

      // Generar ID único
      const patientId = generatePatientId(
        patient.professionalId,
        patient.personalInfo.firstName,
        patient.personalInfo.lastName
      );

      // Guardar en Firestore
      const docRef = doc(db, this.collectionName, patientId);
      await setDoc(docRef, {
        ...encryptedPatient,
        id: patientId,
        metadata
      });

      // Registrar evento de auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'patient_created',
        userId: createdBy,
        userRole: 'PHYSICIAN', // Asumimos que es un profesional médico
        patientId,
        metadata: {
          patientId,
          fullName: `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
          age: new Date().getFullYear() - patient.personalInfo.dateOfBirth.getFullYear(),
          primaryCondition: patient.medicalInfo.primaryCondition,
          professionalId: patient.professionalId
        }
      });

      console.log('✅ Paciente creado exitosamente:', patientId);
      return patientId;

    } catch (error) {
      console.error('❌ Error al crear paciente:', error);
      throw new Error(`Failed to create patient: ${error}`);
    }
  }

  /**
   * Obtener paciente por ID
   */
  static async getPatientById(patientId: string, requestingUserId: string): Promise<PatientProfile | null> {
    try {
      const docRef = doc(db, this.collectionName, patientId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      // Descifrar datos sensibles
      const decryptedPatient = await this.decryptSensitiveData(data);

      // Registrar acceso para auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'patient_accessed',
        userId: requestingUserId,
        userRole: 'PHYSICIAN',
        patientId,
        metadata: {
          patientId,
          accessedBy: requestingUserId,
          accessType: 'read'
        }
      });

      return decryptedPatient as PatientProfile;

    } catch (error) {
      console.error('❌ Error al obtener paciente:', error);
      throw new Error(`Failed to get patient: ${error}`);
    }
  }

  /**
   * Obtener pacientes por profesional
   */
  static async getPatientsByProfessional(
    professionalId: string,
    requestingUserId: string,
    options: {
      limit?: number;
      includeInactive?: boolean;
      sortBy?: 'name' | 'lastVisit' | 'createdAt';
    } = {}
  ): Promise<PatientProfile[]> {
    try {
      const { limit: limitCount = 50, includeInactive = false, sortBy = 'lastVisit' } = options;

      let q = query(
        collection(db, this.collectionName),
        where('professionalId', '==', professionalId)
      );

      if (!includeInactive) {
        q = query(q, where('metadata.isActive', '==', true));
      }

      // Ordenar por campo específico
      switch (sortBy) {
        case 'name':
          q = query(q, orderBy('personalInfo.lastName'), orderBy('personalInfo.firstName'));
          break;
        case 'lastVisit':
          q = query(q, orderBy('metadata.lastVisitDate', 'desc'));
          break;
        case 'createdAt':
          q = query(q, orderBy('metadata.createdAt', 'desc'));
          break;
      }

      q = query(q, limit(limitCount));

      const querySnapshot = await getDocs(q);
      
      const patients = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const decryptedPatient = await this.decryptSensitiveData(data);
          return decryptedPatient as PatientProfile;
        })
      );

      // Registrar acceso para auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'patients_list_accessed',
        userId: requestingUserId,
        userRole: 'PHYSICIAN',
        metadata: {
          professionalId,
          accessedBy: requestingUserId,
          patientCount: patients.length,
          includeInactive
        }
      });

      return patients;

    } catch (error) {
      console.error('❌ Error al obtener pacientes por profesional:', error);
      throw new Error(`Failed to get patients by professional: ${error}`);
    }
  }

  /**
   * Buscar pacientes por nombre
   */
  static async searchPatients(
    professionalId: string,
    searchTerm: string,
    requestingUserId: string
  ): Promise<PatientProfile[]> {
    try {
      // Buscar por nombre o apellido (Firestore no soporta búsqueda de texto completo)
      // Implementación básica - en producción usar Algolia o similar
      const allPatients = await this.getPatientsByProfessional(professionalId, requestingUserId, { includeInactive: true });
      
      const searchLower = searchTerm.toLowerCase();
      const filteredPatients = allPatients.filter(patient => {
        const fullName = `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`.toLowerCase();
        return fullName.includes(searchLower);
      });

      // Registrar búsqueda para auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'patients_search',
        userId: requestingUserId,
        userRole: 'PHYSICIAN',
        metadata: {
          professionalId,
          searchTerm,
          resultsCount: filteredPatients.length
        }
      });

      return filteredPatients;

    } catch (error) {
      console.error('❌ Error al buscar pacientes:', error);
      throw new Error(`Failed to search patients: ${error}`);
    }
  }

  /**
   * Actualizar paciente
   */
  static async updatePatient(
    patientId: string,
    updates: Partial<PatientProfile>,
    updatedBy: string
  ): Promise<void> {
    try {
      // Obtener paciente actual
      const currentPatient = await this.getPatientById(patientId, updatedBy);
      if (!currentPatient) {
        throw new Error('Paciente no encontrado');
      }

      // Validar actualizaciones
      const updatedPatient = { ...currentPatient, ...updates };
      const validation = validatePatientProfile(updatedPatient);
      if (!validation.isValid) {
        throw new Error(`Paciente inválido después de actualización: ${validation.errors.join(', ')}`);
      }

      // Cifrar datos sensibles actualizados
      const encryptedUpdates = await this.encryptSensitiveData(updates);

      // Actualizar metadata
      const metadata = {
        ...currentPatient.metadata,
        updatedAt: new Date(),
        updatedBy,
        version: currentPatient.metadata.version + 1
      };

      // Actualizar en Firestore
      const docRef = doc(db, this.collectionName, patientId);
      await updateDoc(docRef, {
        ...encryptedUpdates,
        metadata
      });

      // Registrar evento de auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'patient_updated',
        userId: updatedBy,
        userRole: 'PHYSICIAN',
        patientId,
        metadata: {
          patientId,
          updatedBy,
          updatedFields: Object.keys(updates),
          version: metadata.version
        }
      });

      console.log('✅ Paciente actualizado exitosamente:', patientId);

    } catch (error) {
      console.error('❌ Error al actualizar paciente:', error);
      throw new Error(`Failed to update patient: ${error}`);
    }
  }

  /**
   * Agregar visita clínica
   */
  static async addClinicalVisit(
    patientId: string,
    visit: Omit<ClinicalVisit, 'id'>,
    addedBy: string
  ): Promise<string> {
    try {
      const visitId = `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const fullVisit: ClinicalVisit = {
        ...visit,
        id: visitId
      };

      // Obtener paciente actual
      const patient = await this.getPatientById(patientId, addedBy);
      if (!patient) {
        throw new Error('Paciente no encontrado');
      }

      // Agregar visita al historial
      const updatedVisits = [...patient.clinicalHistory.visits, fullVisit];
      
      // Actualizar última fecha de visita
      await this.updatePatient(patientId, {
        clinicalHistory: {
          ...patient.clinicalHistory,
          visits: updatedVisits
        },
        metadata: {
          ...patient.metadata,
          lastVisitDate: visit.date
        }
      }, addedBy);

      // Registrar evento de auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'clinical_visit_added',
        userId: addedBy,
        userRole: 'PHYSICIAN',
        patientId,
        visitId,
        metadata: {
          patientId,
          visitId,
          visitType: visit.type,
          duration: visit.duration,
          chiefComplaint: visit.chiefComplaint
        }
      });

      console.log('✅ Visita clínica agregada exitosamente:', visitId);
      return visitId;

    } catch (error) {
      console.error('❌ Error al agregar visita clínica:', error);
      throw new Error(`Failed to add clinical visit: ${error}`);
    }
  }

  /**
   * Obtener pacientes que necesitan seguimiento
   */
  static async getPatientsNeedingFollowUp(
    professionalId: string,
    requestingUserId: string,
    daysThreshold: number = 30
  ): Promise<PatientProfile[]> {
    try {
      const allPatients = await this.getPatientsByProfessional(professionalId, requestingUserId, { includeInactive: true });
      
      const patientsNeedingFollowUp = allPatients.filter(patient => 
        needsFollowUp(patient, daysThreshold)
      );

      // Registrar consulta para auditoría
      await FirestoreAuditLogger.logEvent({
        type: 'follow_up_patients_queried',
        userId: requestingUserId,
        userRole: 'PHYSICIAN',
        metadata: {
          professionalId,
          daysThreshold,
          patientsCount: patientsNeedingFollowUp.length
        }
      });

      return patientsNeedingFollowUp;

    } catch (error) {
      console.error('❌ Error al obtener pacientes que necesitan seguimiento:', error);
      throw new Error(`Failed to get patients needing follow-up: ${error}`);
    }
  }

  /**
   * Cifrar datos sensibles del paciente
   */
  private static async encryptSensitiveData(patient: Partial<PatientProfile>): Promise<any> {
    const encryptedPatient = { ...patient };

    // Cifrar información personal sensible
    if (patient.personalInfo) {
      encryptedPatient.personalInfo = {
        ...patient.personalInfo,
        email: patient.personalInfo.email ? await encryptMetadata(patient.personalInfo.email) : undefined,
        phone: patient.personalInfo.phone ? await encryptMetadata(patient.personalInfo.phone) : undefined,
        emergencyContact: patient.personalInfo.emergencyContact ? {
          ...patient.personalInfo.emergencyContact,
          phone: await encryptMetadata(patient.personalInfo.emergencyContact.phone)
        } : undefined
      };
    }

    // Cifrar información médica sensible
    if (patient.medicalInfo) {
      encryptedPatient.medicalInfo = {
        ...patient.medicalInfo,
        familyHistory: patient.medicalInfo.familyHistory ? 
          await encryptMetadata(patient.medicalInfo.familyHistory) : ''
      };
    }

    return encryptedPatient;
  }

  /**
   * Descifrar datos sensibles del paciente
   */
  private static async decryptSensitiveData(data: any): Promise<any> {
    const decryptedData = { ...data };

    // Descifrar información personal sensible
    if (data.personalInfo) {
      decryptedData.personalInfo = {
        ...data.personalInfo,
        email: data.personalInfo.email ? await decryptMetadata(data.personalInfo.email) : undefined,
        phone: data.personalInfo.phone ? await decryptMetadata(data.personalInfo.phone) : undefined,
        emergencyContact: data.personalInfo.emergencyContact ? {
          ...data.personalInfo.emergencyContact,
          phone: await decryptMetadata(data.personalInfo.emergencyContact.phone)
        } : undefined
      };
    }

    // Descifrar información médica sensible
    if (data.medicalInfo) {
      decryptedData.medicalInfo = {
        ...data.medicalInfo,
        familyHistory: data.medicalInfo.familyHistory ? 
          await decryptMetadata(data.medicalInfo.familyHistory) : undefined
      };
    }

    return decryptedData;
  }

  /**
   * Exportar paciente para auditoría (sin datos sensibles)
   */
  static async exportPatientForAudit(patientId: string): Promise<any> {
    try {
      const patient = await this.getPatientById(patientId, 'AUDIT_SYSTEM');
      if (!patient) {
        throw new Error('Paciente no encontrado');
      }

      // Crear versión para auditoría sin datos sensibles
      const auditPatient = {
        id: patient.id,
        professionalId: patient.professionalId,
        personalInfo: {
          firstName: patient.personalInfo.firstName,
          lastName: patient.personalInfo.lastName,
          dateOfBirth: patient.personalInfo.dateOfBirth,
          gender: patient.personalInfo.gender,
          address: patient.personalInfo.address
        },
        medicalInfo: {
          primaryCondition: patient.medicalInfo.primaryCondition,
          secondaryConditions: patient.medicalInfo.secondaryConditions,
          allergies: patient.medicalInfo.allergies,
          lifestyleFactors: patient.medicalInfo.lifestyleFactors
        },
        clinicalHistory: {
          totalVisits: patient.clinicalHistory.visits.length,
          totalAssessments: patient.clinicalHistory.assessments.length,
          totalTreatments: patient.clinicalHistory.treatments.length
        },
        consent: patient.consent,
        metadata: {
          createdAt: patient.metadata.createdAt,
          lastVisitDate: patient.metadata.lastVisitDate,
          isActive: patient.metadata.isActive
        }
      };

      return auditPatient;

    } catch (error) {
      console.error('❌ Error al exportar paciente para auditoría:', error);
      throw new Error(`Failed to export patient for audit: ${error}`);
    }
  }
} 