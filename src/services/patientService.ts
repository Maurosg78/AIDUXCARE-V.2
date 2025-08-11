import { collection, doc, getDocs, query, where, orderBy, serverTimestamp, DocumentData, limit, addDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  idNumber: string;
  
  // Datos Clínicos
  medicalHistory: string;
  allergies: string;
  medications: string;
  previousInjuries: string;
  
  // Datos de Derivación
  referringPhysician: string;
  referringCenter: string;
  referralDate: string;
  referralReason: string;
  
  // Datos de Seguro
  insuranceProvider: string;
  insurancePolicy: string;
  insuranceGroup: string;
  copayAmount: number;
  deductibleAmount: number;
  
  // Contacto de Emergencia
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  
  // Datos Ocupacionales
  occupation: string;
  workplace: string;
  workPhone: string;
  workEmail: string;
  
  // Datos de Facturación
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Preferencias
  preferredContactMethod: 'email' | 'phone' | 'sms';
  preferredAppointmentTime: 'morning' | 'afternoon' | 'evening';
  notes: string;
  
  // Metadatos para Estadísticas
  source: 'direct' | 'referral' | 'online' | 'insurance';
  marketingChannel: 'google' | 'social' | 'referral' | 'direct';
  initialConsultationType: 'in-person' | 'virtual' | 'assessment';
  
  // Datos del Sistema
  status: 'active' | 'inactive';
  lastVisit: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientData {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  idNumber?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
  previousInjuries?: string;
  referringPhysician?: string;
  referringCenter?: string;
  referralDate?: string;
  referralReason?: string;
  insuranceProvider?: string;
  insurancePolicy?: string;
  insuranceGroup?: string;
  copayAmount?: number;
  deductibleAmount?: number;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  occupation?: string;
  workplace?: string;
  workPhone?: string;
  workEmail?: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferredContactMethod?: 'email' | 'phone' | 'sms';
  preferredAppointmentTime?: 'morning' | 'afternoon' | 'evening';
  notes?: string;
  source?: 'direct' | 'referral' | 'online' | 'insurance';
  marketingChannel?: 'google' | 'social' | 'referral' | 'direct';
  initialConsultationType?: 'in-person' | 'virtual' | 'assessment';
  status?: 'active' | 'inactive';
  lastVisit?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class PatientService {
  private static readonly COLLECTION_NAME = 'patients';

  /**
   * Busca pacientes por término de búsqueda
   * @param searchTerm - Término de búsqueda
   * @returns Promise con lista de pacientes
   */
  static async searchPatients(searchTerm: string): Promise<Patient[]> {
    try {
      const patientsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        patientsRef,
        where('fullName', '>=', searchTerm),
        where('fullName', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const patients: Patient[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        patients.push({
          id: doc.id,
          fullName: data.fullName as string,
          email: data.email as string,
          phone: data.phone as string,
          dateOfBirth: data.dateOfBirth as string,
          gender: data.gender as 'male' | 'female' | 'other' || 'other',
          idNumber: data.idNumber as string || '',
          medicalHistory: data.medicalHistory as string || '',
          allergies: data.allergies as string || '',
          medications: data.medications as string || '',
          previousInjuries: data.previousInjuries as string || '',
          referringPhysician: data.referringPhysician as string || '',
          referringCenter: data.referringCenter as string || '',
          referralDate: data.referralDate as string || '',
          referralReason: data.referralReason as string || '',
          insuranceProvider: data.insuranceProvider as string || '',
          insurancePolicy: data.insurancePolicy as string || '',
          insuranceGroup: data.insuranceGroup as string || '',
          copayAmount: data.copayAmount as number || 0,
          deductibleAmount: data.deductibleAmount as number || 0,
          emergencyContact: data.emergencyContact as {
            name: string;
            relationship: string;
            phone: string;
            email: string;
          } || { name: '', relationship: '', phone: '', email: '' },
          occupation: data.occupation as string || '',
          workplace: data.workplace as string || '',
          workPhone: data.workPhone as string || '',
          workEmail: data.workEmail as string || '',
          billingAddress: data.billingAddress as {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
          } || { street: '', city: '', state: '', zipCode: '', country: '' },
          preferredContactMethod: data.preferredContactMethod as 'email' | 'phone' | 'sms' || 'email',
          preferredAppointmentTime: data.preferredAppointmentTime as 'morning' | 'afternoon' | 'evening' || 'morning',
          notes: data.notes as string || '',
          source: data.source as 'direct' | 'referral' | 'online' | 'insurance' || 'direct',
          marketingChannel: data.marketingChannel as 'google' | 'social' | 'referral' | 'direct' || 'direct',
          initialConsultationType: data.initialConsultationType as 'in-person' | 'virtual' | 'assessment' || 'in-person',
          status: data.status as 'active' | 'inactive' || 'active',
          lastVisit: data.lastVisit as string || '',
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
        });
      });

      return patients;
    } catch (error) {
      console.error('Error searching patients:', error);
      throw new Error('Failed to search patients');
    }
  }

  /**
   * Obtiene todos los pacientes
   * @returns Promise con lista de todos los pacientes
   */
  static async getAllPatients(): Promise<Patient[]> {
    try {
      const patientsRef = collection(db, this.COLLECTION_NAME);
      const q = query(patientsRef, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const patients: Patient[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        patients.push({
          id: doc.id,
          fullName: data.fullName as string,
          email: data.email as string,
          phone: data.phone as string,
          dateOfBirth: data.dateOfBirth as string,
          gender: data.gender as 'male' | 'female' | 'other' || 'other',
          idNumber: data.idNumber as string || '',
          medicalHistory: data.medicalHistory as string || '',
          allergies: data.allergies as string || '',
          medications: data.medications as string || '',
          previousInjuries: data.previousInjuries as string || '',
          referringPhysician: data.referringPhysician as string || '',
          referringCenter: data.referringCenter as string || '',
          referralDate: data.referralDate as string || '',
          referralReason: data.referralReason as string || '',
          insuranceProvider: data.insuranceProvider as string || '',
          insurancePolicy: data.insurancePolicy as string || '',
          insuranceGroup: data.insuranceGroup as string || '',
          copayAmount: data.copayAmount as number || 0,
          deductibleAmount: data.deductibleAmount as number || 0,
          emergencyContact: data.emergencyContact as {
            name: string;
            relationship: string;
            phone: string;
            email: string;
          } || { name: '', relationship: '', phone: '', email: '' },
          occupation: data.occupation as string || '',
          workplace: data.workplace as string || '',
          workPhone: data.workPhone as string || '',
          workEmail: data.workEmail as string || '',
          billingAddress: data.billingAddress as {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
          } || { street: '', city: '', state: '', zipCode: '', country: '' },
          preferredContactMethod: data.preferredContactMethod as 'email' | 'phone' | 'sms' || 'email',
          preferredAppointmentTime: data.preferredAppointmentTime as 'morning' | 'afternoon' | 'evening' || 'morning',
          notes: data.notes as string || '',
          source: data.source as 'direct' | 'referral' | 'online' | 'insurance' || 'direct',
          marketingChannel: data.marketingChannel as 'google' | 'social' | 'referral' | 'direct' || 'direct',
          initialConsultationType: data.initialConsultationType as 'in-person' | 'virtual' | 'assessment' || 'in-person',
          status: data.status as 'active' | 'inactive' || 'active',
          lastVisit: data.lastVisit as string || '',
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
        });
      });

      return patients;
    } catch (error) {
      console.error('Error getting all patients:', error);
      throw new Error('Failed to get all patients');
    }
  }

  /**
   * Obtiene un paciente por ID
   * @param patientId - ID del paciente
   * @returns Promise con el paciente
   */
  static async getPatientById(patientId: string): Promise<Patient | null> {
    try {
      const patientRef = doc(db, this.COLLECTION_NAME, patientId);
      const patientSnap = await getDoc(patientRef);

      if (patientSnap.exists()) {
        const data = patientSnap.data() as DocumentData;
        return {
          id: patientSnap.id,
          fullName: data.fullName as string,
          email: data.email as string,
          phone: data.phone as string,
          dateOfBirth: data.dateOfBirth as string,
          gender: data.gender as 'male' | 'female' | 'other' || 'other',
          idNumber: data.idNumber as string || '',
          medicalHistory: data.medicalHistory as string || '',
          allergies: data.allergies as string || '',
          medications: data.medications as string || '',
          previousInjuries: data.previousInjuries as string || '',
          referringPhysician: data.referringPhysician as string || '',
          referringCenter: data.referringCenter as string || '',
          referralDate: data.referralDate as string || '',
          referralReason: data.referralReason as string || '',
          insuranceProvider: data.insuranceProvider as string || '',
          insurancePolicy: data.insurancePolicy as string || '',
          insuranceGroup: data.insuranceGroup as string || '',
          copayAmount: data.copayAmount as number || 0,
          deductibleAmount: data.deductibleAmount as number || 0,
          emergencyContact: data.emergencyContact as {
            name: string;
            relationship: string;
            phone: string;
            email: string;
          } || { name: '', relationship: '', phone: '', email: '' },
          occupation: data.occupation as string || '',
          workplace: data.workplace as string || '',
          workPhone: data.workPhone as string || '',
          workEmail: data.workEmail as string || '',
          billingAddress: data.billingAddress as {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
          } || { street: '', city: '', state: '', zipCode: '', country: '' },
          preferredContactMethod: data.preferredContactMethod as 'email' | 'phone' | 'sms' || 'email',
          preferredAppointmentTime: data.preferredAppointmentTime as 'morning' | 'afternoon' | 'evening' || 'morning',
          notes: data.notes as string || '',
          source: data.source as 'direct' | 'referral' | 'online' | 'insurance' || 'direct',
          marketingChannel: data.marketingChannel as 'google' | 'social' | 'referral' | 'direct' || 'direct',
          initialConsultationType: data.initialConsultationType as 'in-person' | 'virtual' | 'assessment' || 'in-person',
          status: data.status as 'active' | 'inactive' || 'active',
          lastVisit: data.lastVisit as string || '',
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting patient by ID:', error);
      throw new Error('Failed to get patient by ID');
    }
  }

  /**
   * Crea un nuevo paciente
   * @param patientData - Datos del paciente
   * @returns Promise con el ID del paciente creado
   */
  static async createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const patientsRef = collection(db, this.COLLECTION_NAME);
      const newPatient = {
        ...patientData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(patientsRef, newPatient);
      return docRef.id;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw new Error('Failed to create patient');
    }
  }

  /**
   * Actualiza un paciente existente
   * @param patientId - ID del paciente
   * @param patientData - Datos actualizados
   * @returns Promise<void>
   */
  static async updatePatient(patientId: string, patientData: Partial<Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const patientRef = doc(db, this.COLLECTION_NAME, patientId);
      await updateDoc(patientRef, {
        ...patientData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      throw new Error('Failed to update patient');
    }
  }

  /**
   * Elimina un paciente
   * @param patientId - ID del paciente
   * @returns Promise<void>
   */
  static async deletePatient(patientId: string): Promise<void> {
    try {
      const patientRef = doc(db, this.COLLECTION_NAME, patientId);
      await deleteDoc(patientRef);
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw new Error('Failed to delete patient');
    }
  }
}

// Exportar la clase directamente para uso estático
export default PatientService;
