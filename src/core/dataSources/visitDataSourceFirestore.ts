import { db } from '../firebase/firebaseClient';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, Timestamp, Firestore, query, where, addDoc } from 'firebase/firestore';
import { Visit, VisitSchema } from '../domain/visitType';

const visitsCollection = collection(db, 'visits');

export class VisitDataSourceFirestore {
  private db: Firestore;
  constructor(firestore?: Firestore) {
    this.db = firestore || db;
  }

  private get visitsCollection() {
    return collection(this.db, 'visits');
  }

  /**
   * Obtiene todas las visitas de un paciente
   */
  async getAllVisitsByPatient(patientId: string): Promise<Visit[]> {
    const q = query(this.visitsCollection, where('patient_id', '==', patientId));
    const snapshot = await getDocs(q);
    const visits: Visit[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      try {
        visits.push(VisitSchema.parse({
          ...data,
          id: docSnap.id,
          created_at: data.created_at?.toString() || '',
          updated_at: data.updated_at?.toString() || ''
        }));
      } catch (e) {
        console.error(`Validation error for visit ${docSnap.id}:`, e);
      }
    });
    return visits;
  }

  /**
   * Obtiene una visita por su ID
   */
  async getVisitById(visitId: string): Promise<Visit | null> {
    const visitDoc = doc(this.visitsCollection, visitId);
    const docSnap = await getDoc(visitDoc);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    try {
      return VisitSchema.parse({
        ...data,
        id: docSnap.id,
        created_at: data.created_at?.toString() || '',
        updated_at: data.updated_at?.toString() || ''
      });
    } catch (e) {
      // Manejo de error estándar
      return null;
    }
  }

  /**
   * Crea una nueva visita
   */
  async createVisit(visitData: Omit<Visit, 'id' | 'created_at' | 'updated_at'>, patientId: string): Promise<Visit> {
    const now = new Date().toISOString();
    const visit: Omit<Visit, 'id'> = {
      ...visitData,
      patient_id: patientId,
      created_at: now,
      updated_at: now
    };
    const docRef = await addDoc(this.visitsCollection, visit);
    return {
      ...visit,
      id: docRef.id
    } as Visit;
  }

  /**
   * Actualiza una visita existente
   */
  async updateVisit(visitId: string, visitData: Partial<Omit<Visit, 'id' | 'created_at' | 'updated_at'>>): Promise<Visit> {
    const visitDoc = doc(this.visitsCollection, visitId);
    const now = new Date().toISOString();
    await updateDoc(visitDoc, { ...visitData, updated_at: now });
    const updatedSnap = await getDoc(visitDoc);
    if (!updatedSnap.exists()) throw new Error('Visita no encontrada');
    const data = updatedSnap.data();
    return VisitSchema.parse({
      ...data,
      id: updatedSnap.id,
      created_at: data.created_at?.toString() || '',
      updated_at: data.updated_at?.toString() || ''
    });
  }

  /**
   * Elimina una visita
   */
  async deleteVisit(visitId: string): Promise<boolean> {
    const visitDoc = doc(this.visitsCollection, visitId);
    await deleteDoc(visitDoc);
    return true;
  }
}
// Instancia singleton para producción: ver visitDataSourceFirestore.singleton.ts 