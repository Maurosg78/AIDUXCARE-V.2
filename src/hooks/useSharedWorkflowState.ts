/* @ts-nocheck */
import { useState, useEffect, useCallback } from 'react';
import { useSession } from '../context/SessionContext';

const createInitialSharedState = (patientId: string | null = null) => ({
  patient: patientId ? { id: patientId } : null,
  analysisResults: null,
  selectedTests: [],
  physicalExamResults: [],
  soapNote: null,
  physicalEvaluation: {
    selectedTests: []
  }
});

export const useSharedWorkflowState = (currentPatientId: string | null = null) => {
  const { sessionData, updateSessionData, setSessionPatientId, resetSessionData } = useSession();
  
  // Estado compartido entre tabs
  const [sharedState, setSharedState] = useState(createInitialSharedState(currentPatientId));

  useEffect(() => {
    if (!currentPatientId) return;

    if (sessionData?.patientId && sessionData.patientId !== currentPatientId) {
      resetSessionData();
      setSharedState(createInitialSharedState(currentPatientId));
      return;
    }

    if (sessionData?.patientId !== currentPatientId) {
      setSessionPatientId(currentPatientId);
    }

    setSharedState((prev) => ({
      ...prev,
      patient: { id: currentPatientId }
    }));
  }, [currentPatientId, resetSessionData, sessionData?.patientId, setSessionPatientId]);

  useEffect(() => {
    setSharedState((prev) => ({
      ...prev,
      patient: sessionData?.patientId ? { id: sessionData.patientId } : prev.patient,
      physicalEvaluation: {
        selectedTests: Array.isArray(sessionData?.physicalEvaluation?.selectedTests)
          ? sessionData.physicalEvaluation.selectedTests
          : []
      }
    }));
  }, [sessionData?.physicalEvaluation?.selectedTests]);

  // Tab 1 -> Tab 2: Pasar tests seleccionados
  const passTestsToEvaluation = (tests: any[]) => {
    updateSessionData('tab2', { suggestedTests: tests });
    setSharedState(prev => ({ ...prev, selectedTests: tests }));
    console.log(`Pasando ${tests.length} tests a evaluación`);
  };

  const updatePhysicalEvaluation = (tests: any[]) => {
    if (currentPatientId) {
      setSessionPatientId(currentPatientId);
    }
    updateSessionData('physicalEvaluation', { selectedTests: tests });
    setSharedState((prev) => ({
      ...prev,
      patient: currentPatientId ? { id: currentPatientId } : prev.patient,
      physicalEvaluation: {
        selectedTests: tests
      }
    }));
  };

  // Tab 2 -> Tab 3: Pasar resultados de evaluación
  const passResultsToSOAP = (results: any[]) => {
    updateSessionData('tab2', { completedTests: results });
    setSharedState(prev => ({ ...prev, physicalExamResults: results }));
  };

  // Tab 3: Save final SOAP
  const saveSOAPNote = (soap: any) => {
    updateSessionData('tab3', { soapNote: soap });
    setSharedState(prev => ({ ...prev, soapNote: soap }));
  };

  const resetSharedWorkflowState = useCallback(() => {
    resetSessionData();
    setSharedState(createInitialSharedState(currentPatientId));
  }, [currentPatientId, resetSessionData]);

  return {
    sharedState,
    passTestsToEvaluation,
    passResultsToSOAP,
    saveSOAPNote,
    updatePhysicalEvaluation,
    resetSharedWorkflowState,
    sessionData
  };
};
