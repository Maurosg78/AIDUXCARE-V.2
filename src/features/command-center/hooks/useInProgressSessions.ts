import { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import sessionService from '@/services/sessionService';

export interface InProgressSession {
  id: string;
  patientId: string;
  patientName: string;
  sessionType: string;
  transcript: string;
  /** 'recording_in_progress' | 'interrupted' — interrupted sessions can be resumed */
  status?: string;
}

export interface InProgressSessionsState {
  loading: boolean;
  data: InProgressSession[];
  /** Refetch from Firestore (e.g. after dismissing a session or when page is shown). */
  refetch: () => Promise<void>;
}

export function useInProgressSessions(): InProgressSessionsState {
  const [state, setState] = useState<InProgressSessionsState['data']>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const user = getAuth().currentUser;
    if (!user) {
      setState([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const sessions = await sessionService.getInProgressSessions(user.uid);
      setState(sessions);
    } catch {
      setState([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const sessions = await sessionService.getInProgressSessions(user.uid);
        setState(sessions);
      } catch {
        setState([]);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  return { data: state, loading, refetch };
}
