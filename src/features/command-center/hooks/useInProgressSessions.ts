import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import sessionService from '@/services/sessionService';

export interface InProgressSession {
  id: string;
  patientId: string;
  patientName: string;
  sessionType: string;
  transcript: string;
}

export interface InProgressSessionsState {
  loading: boolean;
  data: InProgressSession[];
}

export function useInProgressSessions(): InProgressSessionsState {
  const [state, setState] = useState<InProgressSessionsState>({ loading: true, data: [] });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { setState({ loading: false, data: [] }); return; }
      try {
        const sessions = await sessionService.getInProgressSessions(user.uid);
        setState({ loading: false, data: sessions });
      } catch {
        setState({ loading: false, data: [] });
      }
    });
    return unsubscribe;
  }, []);

  return state;
}
