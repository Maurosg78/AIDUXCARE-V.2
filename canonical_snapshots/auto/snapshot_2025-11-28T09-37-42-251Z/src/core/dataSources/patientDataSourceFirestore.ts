import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

import { db } from '../firebase/firebaseClient';
import { Patient, PatientSchema } from '../domain/patientType';

import logger from '@/shared/utils/logger';

const patientsCollection = collection(db, 'patients');

export class PatientDataSourceFirestore {
  /**
   * Obtiene todos los pacientes del profesional actual
   */
  async getAllPatients(professionalId: string): Promise<Patient[]> {
    const q = query(patientsCollection, where('user_id', '==', professionalId));
    const snapshot = await getDocs(q);
    const patients: Patient[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      try {
        patients.push(PatientSchema.parse({
          ...data,
          id: docSnap.id,
          created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
          updated_at: data.updated_at?.toDate ? data.updated_at.toDate().toISOString() : data.updated_at
        }));
      } catch (e) {
        console.error(`Validation error for patient ${docSnap.id}:`, e);
      }
    });
    return patients;
  }

  /**
   * Obtiene un paciente por su ID
   */
  async getPatientById(patientId: string): Promise<Patient | null> {
    const patientDoc = doc(patientsCollection, patientId);
    const docSnap = await getDoc(patientDoc);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    try {
      return PatientSchema.parse({
        ...data,
        id: docSnap.id,
        created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
        updated_at: data.updated_at?.toDate ? data.updated_at.toDate().toISOString() : data.updated_at
      });
    } catch (e) {
      console.error(`Validation error for patient ${patientId}:`, e);
      return null;
    }
  }

  /**
   * Obtiene un paciente por su user_id
   */
  async getPatientByUserId(userId: string): Promise<Patient | null> {
    const q = query(patientsCollection, where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    try {
      return PatientSchema.parse({
        ...data,
        id: docSnap.id,
        created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
        updated_at: data.updated_at?.toDate ? data.updated_at.toDate().toISOString() : data.updated_at
      });
    } catch (e) {
      console.error(`Validation error for patient with user_id ${userId}:`, e);
      return null;
    }
  }

  /**
   * Crea un nuevo paciente
   */
  async createPatient(patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'>, professionalId: string): Promise<Patient> {
    const now = new Date().toISOString();
    const newDocRef = doc(patientsCollection);
    const patient: Patient = {
      ...patientData,
      id: newDocRef.id,
      user_id: professionalId,
      created_at: now,
      updated_at: now
    } as Patient;
    await setDoc(newDocRef, patient);
    return patient;
  }

  /**
   * Actualiza un paciente existente
   */
  async updatePatient(patientId: string, patientData: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>): Promise<Patient> {
    const patientDoc = doc(patientsCollection, patientId);
    const now = new Date().toISOString();
    await updateDoc(patientDoc, { ...patientData, updated_at: now });
    const updatedSnap = await getDoc(patientDoc);
    if (!updatedSnap.exists()) throw new Error('Paciente no encontrado');
    const data = updatedSnap.data();
    return PatientSchema.parse({
      ...data,
      id: updatedSnap.id,
      created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
      updated_at: data.updated_at?.toDate ? data.updated_at.toDate().toISOString() : data.updated_at
    });
  }

  /**
   * Elimina un paciente
   */
  async deletePatient(patientId: string): Promise<boolean> {
    const patientDoc = doc(patientsCollection, patientId);
    await deleteDoc(patientDoc);
    return true;
  }
}

// Exportar una instancia singleton para uso en toda la aplicación
export const patientDataSourceFirestore = new PatientDataSourceFirestore(); 