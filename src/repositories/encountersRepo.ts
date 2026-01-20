import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

import logger from '@/shared/utils/logger';
import { db as sharedDb, auth } from "@/lib/firebase";

export interface Encounter {
  id: string;
  patientId: string;
  episodeId?: string;
  authorUid: string;
  status: 'draft' | 'completed' | 'signed';
  encounterDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // SOAP
  soap?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  
  // Intervenciones aplicadas
  interventions?: {
    type: string;
    description: string;
    duration?: number; // minutos
    intensity?: string;
    sets?: number;
    reps?: number;
    notes?: string;
  }[];
  
  // Respuesta del paciente
  patientResponse?: {
    painLevel?: number; // 0-10
    tolerance?: 'excellent' | 'good' | 'fair' | 'poor';
    notes?: string;
  };
  
  // Archivos adjuntos
  attachments?: {
    type: 'photo' | 'video' | 'document';
    url: string;
    filename: string;
    uploadedAt: Timestamp;
  }[];
  
  // Firma y validación
  signature?: {
    signedBy: string;
    signedAt: Timestamp;
    version: string;
  };
}

export interface EncounterCreateData {
  patientId: string;
  episodeId?: string;
  authorUid: string;
  encounterDate: Date;
  soap?: Encounter['soap'];
  interventions?: Encounter['interventions'];
  patientResponse?: Encounter['patientResponse'];
}

class EncountersRepository {
  private db = sharedDb;
  private collectionName = 'encounters';

  // WO-FS-QUERY-01: Get current user UID for ownership filtering
  private getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.uid;
  }

  async getEncounterById(id: string): Promise<Encounter | null> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Encounter;
        // WO-FS-QUERY-01: Verify ownership before returning
        const currentUserId = this.getCurrentUserId();
        if (data.authorUid !== currentUserId) {
          return null; // Document doesn't belong to current user
        }
        return { id: docSnap.id, ...data };
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo encuentro:', error);
      throw error;
    }
  }

  async getLastEncounterByPatient(patientId: string): Promise<Encounter | null> {
    try {
      // WO-FS-QUERY-01: Add ownership filter to align with Firestore rules
      const currentUserId = this.getCurrentUserId();
      const encountersRef = collection(this.db, this.collectionName);
      const q = query(
        encountersRef,
        where('patientId', '==', patientId),
        where('status', 'in', ['completed', 'signed']),
        where('authorUid', '==', currentUserId),
        orderBy('encounterDate', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Encounter;
      }
      
      return null;
    } catch (error: any) {
      // Si el índice está en construcción, retornar null en lugar de lanzar error
      // Esto permite que el componente se renderice mientras el índice se construye
      if (error?.code === 'failed-precondition' && error?.message?.includes('index is currently building')) {
        console.warn('Índice de encounters en construcción, retornando null temporalmente');
        return null;
      }
      console.error('Error obteniendo último encuentro:', error);
      throw error;
    }
  }

  async getEncountersByPatient(patientId: string, limitCount: number = 10): Promise<Encounter[]> {
    try {
      // WO-FS-QUERY-01: Add ownership filter to align with Firestore rules
      const currentUserId = this.getCurrentUserId();
      const encountersRef = collection(this.db, this.collectionName);
      const q = query(
        encountersRef,
        where('patientId', '==', patientId),
        where('authorUid', '==', currentUserId),
        orderBy('encounterDate', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Encounter[];
    } catch (error) {
      console.error('Error obteniendo encuentros:', error);
      throw error;
    }
  }

  async getEncountersByEpisode(episodeId: string): Promise<Encounter[]> {
    try {
      // WO-FS-QUERY-01: Add ownership filter to align with Firestore rules
      const currentUserId = this.getCurrentUserId();
      const encountersRef = collection(this.db, this.collectionName);
      const q = query(
        encountersRef,
        where('episodeId', '==', episodeId),
        where('authorUid', '==', currentUserId),
        orderBy('encounterDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Encounter[];
    } catch (error) {
      console.error('Error obteniendo encuentros del episodio:', error);
      throw error;
    }
  }

  async createEncounter(data: EncounterCreateData): Promise<string> {
    try {
      // WO-FS-DATA-03: Enforce ownership on all Firestore writes
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        throw new Error('Missing authenticated user for ownership');
      }
      
      // Ensure authorUid is set from authenticated user (fail fast if missing)
      const encounterData = {
        ...data,
        authorUid: data.authorUid || currentUserId, // Use provided or fallback to current user
        status: 'draft' as const,
        encounterDate: Timestamp.fromDate(data.encounterDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // WO-FS-DATA-03: Final validation - authorUid must be present
      if (!encounterData.authorUid) {
        throw new Error('Missing authorUid: cannot create encounter without ownership');
      }
      
      const docRef = await addDoc(collection(this.db, this.collectionName), encounterData);
      return docRef.id;
    } catch (error) {
      console.error('Error creando encuentro:', error);
      throw error;
    }
  }

  async updateEncounter(id: string, updates: Partial<Encounter>): Promise<void> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error actualizando encuentro:', error);
      throw error;
    }
  }

  async completeEncounter(id: string, soap: Encounter['soap'], interventions: Encounter['interventions']): Promise<void> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      await updateDoc(docRef, {
        status: 'completed',
        soap,
        interventions,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error completando encuentro:', error);
      throw error;
    }
  }

  async signEncounter(id: string, signedBy: string): Promise<void> {
    try {
      const docRef = doc(this.db, this.collectionName, id);
      await updateDoc(docRef, {
        status: 'signed',
        signature: {
          signedBy,
          signedAt: serverTimestamp(),
          version: '1.0'
        },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error firmando encuentro:', error);
      throw error;
    }
  }
}

export const encountersRepo = new EncountersRepository();
