import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

import { Patient } from '../core/types/patient';

import logger from '@/shared/utils/logger';
import { db as sharedDb } from "@/lib/firebase";

// Extender el tipo Patient del core para incluir id y timestamps de Firestore
export interface PatientWithId extends Patient {
  id: string;
  updatedAt?: Timestamp;
}

export interface PatientCreateData extends Omit<Patient, 'id' | 'createdAt' | 'provenance'> {
  // Campos requeridos para crear paciente
  firstName: string;
  lastName: string;
  chiefComplaint: string;
  ownerUid: string;
  status: 'active' | 'inactive';
}

class PatientsRepository {
  private db = sharedDb;
  private collectionName = 'patients';

  async getPatientById(id: string): Promise<PatientWithId | null> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as PatientWithId;
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo paciente:', error);
      throw error;
    }
  }

  async getPatientsByOwner(ownerUid: string, status?: 'active' | 'inactive'): Promise<PatientWithId[]> {
    try {
      const patientsRef = collection(this.db, this.collectionName);
      let q = query(
        patientsRef,
        where('ownerUid', '==', ownerUid)
      );
      
      if (status) {
        q = query(q, where('status', '==', status));
      }
      
      // Obtener datos sin orderBy para evitar problemas de índice compuesto
      const querySnapshot = await getDocs(q);
      
      // Ordenar en el cliente por createdAt (descendente)
      const patients = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as PatientWithId[];
      
      // Ordenar por createdAt descendente en el cliente
      patients.sort((a, b) => {
        const aDate = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date(0);
        const bDate = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });
      
      return patients;
    } catch (error) {
      console.error('Error obteniendo pacientes:', error);
      throw error;
    }
  }

  async createPatient(data: PatientCreateData): Promise<string> {
    try {
      const fullNameLower = `${data.firstName} ${data.lastName}`.trim().toLowerCase();
      const docRef = await addDoc(collection(this.db, this.collectionName), {
        ...data,
        nameLower: fullNameLower,
        clinical: data.clinical ? {
          ...data.clinical,
          allergies: Array.isArray((data as unknown as { clinical?: { allergies?: unknown[] } }).clinical?.allergies)
            ? ((data as unknown as { clinical?: { allergies?: unknown[] } }).clinical!.allergies!.map((a) =>
                typeof a === 'string' ? ({ display: a as string }) : a as { display: string; code?: string }
              ))
            : (data as unknown as { clinical?: { allergies?: { display: string; code?: string }[] } }).clinical?.allergies,
        } : undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creando paciente:', error);
      throw error;
    }
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<void> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error actualizando paciente:', error);
      throw error;
    }
  }

  async updateClinicalData(id: string, clinicalData: Patient['clinical']): Promise<void> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      await updateDoc(docRef, {
        clinical: clinicalData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error actualizando datos clínicos:', error);
      throw error;
    }
  }
}

export const patientsRepo = new PatientsRepository();
