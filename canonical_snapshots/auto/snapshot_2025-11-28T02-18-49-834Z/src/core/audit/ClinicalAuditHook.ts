import { useCallback } from 'react';

import { useUser } from '../auth/UserContext';

import { FirestoreAuditLogger } from './FirestoreAuditLogger';

/**
 * Hook personalizado para auditoría clínica
 * Integra automáticamente logging de auditoría en componentes clínicos
 */
export const useClinicalAudit = () => {
  const { user } = useUser();

  const logPatientAccess = useCallback(async (patientId: string, accessType: 'view' | 'edit' | 'export') => {
    if (!user) return;
    
    await FirestoreAuditLogger.logEvent({
      type: `patient_${accessType}`,
      userId: user.id,
      userRole: user.role,
      patientId,
      metadata: {
        accessType,
        timestamp: new Date().toISOString()
      }
    });
  }, [user]);

  const logVisitAccess = useCallback(async (visitId: string, patientId: string, accessType: 'view' | 'edit' | 'export') => {
    if (!user) return;
    
    await FirestoreAuditLogger.logEvent({
      type: `visit_${accessType}`,
      userId: user.id,
      userRole: user.role,
      patientId,
      visitId,
      metadata: {
        accessType,
        timestamp: new Date().toISOString()
      }
    });
  }, [user]);

  const logClinicalDataEdit = useCallback(async (
    patientId: string, 
    visitId: string, 
    dataType: 'soap' | 'vitals' | 'medication' | 'allergies' | 'history',
    oldValue?: string,
    newValue?: string
  ) => {
    if (!user) return;
    
    await FirestoreAuditLogger.logEvent({
      type: 'clinical_data_edit',
      userId: user.id,
      userRole: user.role,
      patientId,
      visitId,
      metadata: {
        dataType,
        oldValue,
        newValue,
        timestamp: new Date().toISOString()
      }
    });
  }, [user]);

  const logDataExport = useCallback(async (patientId: string, exportType: 'pdf' | 'csv' | 'json', recordCount: number) => {
    if (!user) return;
    
    await FirestoreAuditLogger.logEvent({
      type: 'data_export',
      userId: user.id,
      userRole: user.role,
      patientId,
      metadata: {
        exportType,
        recordCount,
        timestamp: new Date().toISOString()
      }
    });
  }, [user]);

  const logSearchQuery = useCallback(async (searchTerm: string, resultCount: number, filters?: Record<string, unknown>) => {
    if (!user) return;
    
    await FirestoreAuditLogger.logEvent({
      type: 'search_query',
      userId: user.id,
      userRole: user.role,
      metadata: {
        searchTerm,
        resultCount,
        filters,
        timestamp: new Date().toISOString()
      }
    });
  }, [user]);

  return {
    logPatientAccess,
    logVisitAccess,
    logClinicalDataEdit,
    logDataExport,
    logSearchQuery
  };
}; 