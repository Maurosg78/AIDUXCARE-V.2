// @ts-nocheck
import { useEffect } from 'react';

import { SessionStorage } from '../services/session-storage';

export const useSessionPersistence = (patientId: string, sessionData: any) => {
  // Guardar automáticamente cada 30 segundos
  useEffect(() => {
    if (!patientId || !sessionData) return;
    
    const interval = setInterval(() => {
      SessionStorage.saveSession(patientId, {
        ...sessionData,
        lastSaved: new Date().toISOString(),
        status: 'draft'
      });
      console.log('Sesión guardada automáticamente');
    }, 30000);
    
    return () => clearInterval(interval);
  }, [patientId, sessionData]);
  
  // Guardar al cerrar/recargar la página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (patientId && sessionData) {
        SessionStorage.saveSession(patientId, {
          ...sessionData,
          lastSaved: new Date().toISOString(),
          status: 'draft'
        });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [patientId, sessionData]);
  
  // Recuperar sesión anterior
  const getPreviousSession = () => {
    return SessionStorage.getSession(patientId);
  };
  
  // Finalizar sesión (cuando se completa SOAP)
  const finalizeSession = (soapData: any) => {
    SessionStorage.saveSession(patientId, {
      ...sessionData,
      soap: soapData,
      completedAt: new Date().toISOString(),
      status: 'completed'
    });
  };
  
  return {
    getPreviousSession,
    finalizeSession
  };
};