import { useEffect } from 'react';
import { SessionStorage } from '../services/session-storage';

export const useSessionPersistence = (
  patientId: string, 
  sessionData: any,
  userId?: string,
  visitType?: string,
  sessionId?: string
) => {
  // Guardar automáticamente cada 30 segundos
  useEffect(() => {
    if (!patientId || !sessionData) return;
    
    const interval = setInterval(() => {
      // ✅ T1: Use v2 key structure with userId, visitType, sessionId
      SessionStorage.saveSession(
        patientId, 
        {
          ...sessionData,
          lastSaved: new Date().toISOString(),
          status: 'draft'
        },
        userId,
        visitType,
        sessionId
      );
      console.log('Sesión guardada automáticamente');
    }, 30000);
    
    return () => clearInterval(interval);
  }, [patientId, sessionData, userId, visitType, sessionId]);
  
  // Guardar al cerrar/recargar la página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (patientId && sessionData) {
        // ✅ T1: Use v2 key structure with userId, visitType, sessionId
        SessionStorage.saveSession(
          patientId, 
          {
            ...sessionData,
            lastSaved: new Date().toISOString(),
            status: 'draft'
          },
          userId,
          visitType,
          sessionId
        );
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [patientId, sessionData, userId, visitType, sessionId]);
  
  // Recuperar sesión anterior
  const getPreviousSession = () => {
    // ✅ T1: Use v2 key structure with userId, visitType, sessionId (with legacy fallback)
    return SessionStorage.getSession(patientId, userId, visitType, sessionId);
  };
  
  // Finalizar sesión (cuando se completa SOAP)
  const finalizeSession = (soapData: any) => {
    // ✅ T1: Use v2 key structure with userId, visitType, sessionId
    SessionStorage.saveSession(
      patientId, 
      {
        ...sessionData,
        soap: soapData,
        completedAt: new Date().toISOString(),
        status: 'completed'
      },
      userId,
      visitType,
      sessionId
    );
  };
  
  return {
    getPreviousSession,
    finalizeSession
  };
};
