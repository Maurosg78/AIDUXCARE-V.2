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
  /** WO-DASHBOARD-01: SOAP finalized state; independent from session.status */
  soapNote?: {
    status?: 'draft' | 'finalized';
  };
  /** When present, use this for workflow resume (consultations: note.sessionId; session/encounter: id) */
  sessionIdForResume?: string;
  soap?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  chiefComplaint?: string;
  diagnosis?: string;
  interventions?: string[];
  source: 'consultation' | 'encounter' | 'episode' | 'session';
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

        // 0. Fetch sessions once: build sessionIdToType (for consultations without visitType) and session visits
        const sessionIdToType = new Map<string, 'initial' | 'follow-up'>();
        try {
          const sessionsRef = collection(db, 'sessions');
          const sessionsQuery = query(
            sessionsRef,
            where('patientId', '==', patientId),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc')
          );
          const sessionsSnapshot = await getDocs(sessionsQuery);
          logger.info('[usePatientVisits][WO-DASHBOARD-01] sessions loaded', { count: sessionsSnapshot.size, patientId });
          const sessionVisits: (PatientVisit & { _missingSessionType?: boolean })[] = [];
          sessionsSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const sessionStatus = data.status || 'draft';
            const soapNoteStatus = (data.soapNote as any)?.status ?? (sessionStatus === 'signed' || sessionStatus === 'completed' ? 'finalized' : 'draft');
            const sessionType = data.sessionType;
            const date = data.timestamp?.toDate?.() || data.createdAt?.toDate?.() || new Date();
            const hasType = sessionType === 'followup' || sessionType === 'initial';
            const type: 'initial' | 'follow-up' = sessionType === 'followup' ? 'follow-up' : 'initial';
            sessionIdToType.set(docSnap.id, type);
            sessionVisits.push({
              id: docSnap.id,
              type,
              date,
              status: sessionStatus === 'completed' || sessionStatus === 'signed' ? sessionStatus : 'draft',
              soapNote: { status: soapNoteStatus === 'finalized' ? 'finalized' : 'draft' },
              soap: typeof data.soapNote === 'object' && data.soapNote && !Array.isArray(data.soapNote)
                ? {
                  subjective: (data.soapNote as any).subjective,
                  objective: (data.soapNote as any).objective,
                  assessment: (data.soapNote as any).assessment,
                  plan: (data.soapNote as any).plan,
                }
                : undefined,
              chiefComplaint: (data.soapNote as any)?.subjective?.substring?.(0, 100),
              diagnosis: (data.soapNote as any)?.assessment,
              source: 'session',
              ...(hasType ? {} : { _missingSessionType: true }),
            });
          });
          // Legacy: sessions without sessionType → assign by chronological order (first = initial, rest = follow-up)
          const needOrdinal = sessionVisits.filter((v) => (v as { _missingSessionType?: boolean })._missingSessionType);
          if (needOrdinal.length > 0) {
            const byDateAsc = [...sessionVisits].sort((a, b) => a.date.getTime() - b.date.getTime());
            let index = 0;
            byDateAsc.forEach((v) => {
              if ((v as { _missingSessionType?: boolean })._missingSessionType) {
                v.type = index === 0 ? 'initial' : 'follow-up';
                index++;
              }
            });
            byDateAsc.forEach((v) => sessionIdToType.set(v.id, v.type as 'initial' | 'follow-up'));
          }
          sessionVisits.forEach((v) => {
            const { _missingSessionType, ...rest } = v as PatientVisit & { _missingSessionType?: boolean };
            visits.push(rest);
          });
        } catch (error: any) {
          const isPermissionDenied = error?.code === 'permission-denied' ||
            error?.message?.includes('permission-denied');
          if (!isPermissionDenied) {
            console.error('[usePatientVisits][WO-DASHBOARD-01] Error fetching sessions (index may be missing)', error);
          }
        }

        // 1. Get consultations (SOAP notes) - use sessionIdToType when note has no visitType
        try {
          const { PersistenceService } = await import('@/services/PersistenceService');
          const notes = await PersistenceService.getNotesByPatient(patientId);

          notes.forEach((note) => {
            const soapData = (note.soapData || {}) as { subjective?: string; objective?: string; assessment?: string; plan?: string };
            const sessionId = (note as { sessionId?: string }).sessionId;
            const noteVisitType = (note as { visitType?: 'initial' | 'follow-up' }).visitType;
            const type: 'initial' | 'follow-up' = noteVisitType ?? sessionIdToType.get(sessionId ?? '') ?? 'initial';

            visits.push({
              id: note.id,
              type,
              date: new Date(note.createdAt || Date.now()),
              status: 'completed', // Consultations are saved as completed
              soapNote: { status: 'finalized' }, // Saved notes treated as finalized
              sessionIdForResume: sessionId, // For "Resume" / "Close IA" in workflow
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
            // Single source of truth: session really saved = completed/signed => finalized (avoid "Complete Pending Follow-up" when already closed)
            const soapNoteStatus = (data.soapNote as any)?.status ?? (data.status === 'signed' || data.status === 'completed' ? 'finalized' : 'draft');

            visits.push({
              id: doc.id,
              type: 'follow-up', // Encounters are typically follow-ups
              date: data.encounterDate?.toDate?.() || new Date(data.createdAt || Date.now()),
              status: data.status || 'draft',
              soapNote: { status: soapNoteStatus === 'finalized' ? 'finalized' : 'draft' },
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
