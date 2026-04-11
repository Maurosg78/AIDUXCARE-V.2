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
        const consultationSessionIds = new Set<string>();
        const encounterSessionIds = new Set<string>();
        const sessionDateById = new Map<string, Date>();
        const latestConsultationDateByType = new Map<'initial' | 'follow-up', number>();
        const latestEncounterDateByType = new Map<'initial' | 'follow-up', number>();

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
            const isArchived = data.archived === true;
            if (isArchived) {
              return;
            }
            const sessionStatus = data.status || 'draft';
            const explicitSoapStatus = (data.soapNote as any)?.status;
            // Only treat as finalized when status is explicit or session is signed.
            // `completed` without soapNote.status stays draft so Familia B (archive / pending closure) stays correct.
            const soapNoteStatus: 'draft' | 'finalized' =
              explicitSoapStatus === 'finalized' || explicitSoapStatus === 'draft'
                ? explicitSoapStatus
                : sessionStatus === 'signed'
                  ? 'finalized'
                  : 'draft';
            const sessionType = data.sessionType;
            const date = data.timestamp?.toDate?.() || data.createdAt?.toDate?.() || new Date();
            const hasType = sessionType === 'followup' || sessionType === 'initial';
            const type: 'initial' | 'follow-up' = sessionType === 'followup' ? 'follow-up' : 'initial';
            sessionIdToType.set(docSnap.id, type);
            sessionDateById.set(docSnap.id, date);
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
            const noteArchived = (note as { archived?: boolean }).archived === true;
            if (noteArchived) {
              return;
            }
            const soapData = (note.soapData || {}) as { subjective?: string; objective?: string; assessment?: string; plan?: string };
            const sessionId = (note as { sessionId?: string }).sessionId;
            const noteVisitType = (note as { visitType?: 'initial' | 'follow-up' }).visitType;
            const type: 'initial' | 'follow-up' = noteVisitType ?? sessionIdToType.get(sessionId ?? '') ?? 'initial';
            const hasSessionId = typeof sessionId === 'string' && sessionId.trim() !== '';
            const linkedSessionDate = hasSessionId ? sessionDateById.get(sessionId as string) : undefined;
            const noteDate = linkedSessionDate ?? new Date(note.createdAt || Date.now());

            if (hasSessionId) {
              consultationSessionIds.add(sessionId as string);
            }
            const noteDateMs = noteDate.getTime();
            const currentLatestConsultationDate = latestConsultationDateByType.get(type) ?? 0;
            if (noteDateMs > currentLatestConsultationDate) {
              latestConsultationDateByType.set(type, noteDateMs);
            }

            visits.push({
              id: note.id,
              type,
              date: noteDate,
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
          const orderedEncounters = encountersSnapshot.docs
            .map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }))
            .filter((entry) => entry.data.archived !== true)
            .sort((leftEntry, rightEntry) => {
              const leftDate = leftEntry.data.encounterDate?.toDate?.() || new Date(leftEntry.data.createdAt || Date.now());
              const rightDate = rightEntry.data.encounterDate?.toDate?.() || new Date(rightEntry.data.createdAt || Date.now());
              return leftDate.getTime() - rightDate.getTime();
            });
          let legacyEncounterIndex = 0;

          orderedEncounters.forEach((entry) => {
            const doc = { id: entry.id, data: () => entry.data };
            const data = doc.data();
            const encStatus = data.status || 'draft';
            const encExplicitSoap = (data.soapNote as { status?: string })?.status;
            const encounterSessionId = typeof data.sessionId === 'string' ? data.sessionId : undefined;
            const explicitVisitType = data.visitType === 'follow-up' || data.visitType === 'initial'
              ? data.visitType
              : undefined;
            const inferredVisitType: 'initial' | 'follow-up' = legacyEncounterIndex === 0 ? 'initial' : 'follow-up';
            const encounterVisitType = explicitVisitType ?? inferredVisitType;
            const linkedSessionDate = encounterSessionId ? sessionDateById.get(encounterSessionId) : undefined;
            const encounterStoredDate = data.encounterDate?.toDate?.();
            const fallbackEncounterDate = encounterStoredDate || new Date(data.createdAt || Date.now());
            const encounterDate = linkedSessionDate ?? fallbackEncounterDate;
            // WO-P0-ARCHIVED: `completed` encounters (workflow finalize) often have no soapNote.status on the doc;
            // treating them as draft put them in "Family B" and surfaced "Remove from history" on closed visits.
            const encSoapStatus: 'draft' | 'finalized' =
              encExplicitSoap === 'finalized' || encExplicitSoap === 'draft'
                ? encExplicitSoap
                : encStatus === 'signed' || encStatus === 'completed'
                  ? 'finalized'
                  : 'draft';
            const isCompletedEncounter = encStatus === 'completed' || encStatus === 'signed';

            if (isCompletedEncounter) {
              legacyEncounterIndex += 1;
            }

            if (encounterSessionId) {
              encounterSessionIds.add(encounterSessionId);
            }
            const encounterDateMs = encounterDate.getTime();
            const currentLatestEncounterDate = latestEncounterDateByType.get(encounterVisitType) ?? 0;
            if (encounterDateMs > currentLatestEncounterDate) {
              latestEncounterDateByType.set(encounterVisitType, encounterDateMs);
            }

            visits.push({
              id: doc.id,
              type: encounterVisitType,
              date: encounterDate,
              status: encStatus,
              soapNote: { status: encSoapStatus },
              sessionIdForResume: encounterSessionId,
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

        const filteredVisits = visits.filter((visit) => {
          if (visit.source === 'encounter') {
            return true;
          }

          if (visit.source === 'consultation') {
            const consultationSessionId = visit.sessionIdForResume;
            const hasEncounterTwin =
              typeof consultationSessionId === 'string' &&
              consultationSessionId.trim() !== '' &&
              encounterSessionIds.has(consultationSessionId);
            return !hasEncounterTwin;
          }

          if (visit.source === 'session') {
            if (visit.status === 'draft') {
              return true;
            }

            if (visit.status === 'completed' || visit.status === 'signed') {
              const hasConsultationTwin = consultationSessionIds.has(visit.id);
              const hasEncounterTwin = encounterSessionIds.has(visit.id);
              return !hasConsultationTwin && !hasEncounterTwin;
            }

            if (visit.status === 'interrupted') {
              const visitType = visit.type === 'follow-up' ? 'follow-up' : 'initial';
              const latestConsultationAt = latestConsultationDateByType.get(visitType) ?? 0;
              const latestEncounterAt = latestEncounterDateByType.get(visitType) ?? 0;
              const latestCompletedAt = Math.max(latestConsultationAt, latestEncounterAt);
              const visitDateMs = visit.date.getTime();
              if (latestCompletedAt > 0 && visitDateMs <= latestCompletedAt) {
                return false;
              }
            }

            const isDraftSession = visit.status === 'draft' || visit.soapNote?.status !== 'finalized';
            if (isDraftSession) {
              return true;
            }

            const hasConsultationTwin = consultationSessionIds.has(visit.id);
            const hasEncounterTwin = encounterSessionIds.has(visit.id);
            return !hasConsultationTwin && !hasEncounterTwin;
          }

          return true;
        });

        filteredVisits.sort((leftVisit, rightVisit) => rightVisit.date.getTime() - leftVisit.date.getTime());
        setState({ loading: false, data: filteredVisits });
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
