import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AsyncState } from '../../command-center/hooks/useUserProfile';
import logger from '@/shared/utils/logger';

export interface PatientVisit {
  id: string;
  type: 'initial' | 'follow-up' | 'consultation';
  date: Date;
  status: 'draft' | 'completed' | 'signed';
  soap?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  chiefComplaint?: string;
  diagnosis?: string;
  interventions?: string[];
  source: 'consultation' | 'encounter' | 'episode';
}

/**
 * Hook to fetch all visits (consultations, encounters) for a patient
 * Combines data from multiple collections to show complete history
 */
export function usePatientVisits(patientId: string | null): AsyncState<PatientVisit[]> {
  const [state, setState] = useState<AsyncState<PatientVisit[]>>({
    loading: true
  });

  useEffect(() => {
    if (!patientId) {
      setState({ loading: false, data: [] });
      return;
    }

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, error: new Error('User not authenticated') });
        return;
      }

      try {
        const visits: PatientVisit[] = [];

        // 1. Get consultations (SOAP notes) - Use PersistenceService for consistency
        try {
          const { PersistenceService } = await import('@/services/PersistenceService');
          const notes = await PersistenceService.getNotesByPatient(patientId);
          
          notes.forEach((note) => {
            const soapData = note.soapData || {};
            
            visits.push({
              id: note.id,
              type: 'initial', // Consultations are typically initial evaluations
              date: new Date(note.createdAt || Date.now()),
              status: 'completed', // Consultations are saved as completed
              soap: {
                subjective: soapData.subjective,
                objective: soapData.objective,
                assessment: soapData.assessment,
                plan: soapData.plan,
              },
              chiefComplaint: soapData.subjective?.substring(0, 100),
              diagnosis: soapData.assessment,
              source: 'consultation',
            });
          });
        } catch (error: any) {
          // WO-FS-DATA-03: Handle permission-denied as "no data yet"
          const isPermissionDenied = error?.code === 'permission-denied' || 
                                     error?.message?.includes('permission-denied');
          if (!isPermissionDenied) {
            console.error('[usePatientVisits] Error fetching consultations:', error);
          }
        }

        // 2. Get encounters
        try {
          const encountersRef = collection(db, 'encounters');
          const encountersQuery = query(
            encountersRef,
            where('patientId', '==', patientId),
            where('authorUid', '==', user.uid),
            orderBy('encounterDate', 'desc')
          );
          
          const encountersSnapshot = await getDocs(encountersQuery);
          encountersSnapshot.forEach((doc) => {
            const data = doc.data();
            
            visits.push({
              id: doc.id,
              type: 'follow-up', // Encounters are typically follow-ups
              date: data.encounterDate?.toDate?.() || new Date(data.createdAt || Date.now()),
              status: data.status || 'draft',
              soap: data.soap,
              chiefComplaint: data.soap?.subjective?.substring(0, 100),
              diagnosis: data.soap?.assessment,
              interventions: data.interventions?.map((i: any) => i.description || i.type),
              source: 'encounter',
            });
          });
        } catch (error: any) {
          const isPermissionDenied = error?.code === 'permission-denied' || 
                                     error?.message?.includes('permission-denied');
          if (!isPermissionDenied) {
            console.error('[usePatientVisits] Error fetching encounters:', error);
          }
        }

        // Sort all visits by date (newest first)
        visits.sort((a, b) => b.date.getTime() - a.date.getTime());

        setState({ loading: false, data: visits });
      } catch (error: any) {
        console.error('[usePatientVisits] Error:', error);
        setState({ 
          loading: false, 
          error: error instanceof Error ? error : new Error('Unknown error') 
        });
      }
    });

    return unsubscribe;
  }, [patientId]);

  return state;
}
