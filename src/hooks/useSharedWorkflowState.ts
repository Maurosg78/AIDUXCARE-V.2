import { trackComplianceEvent } from "../services/analytics-service";
/* @ts-nocheck */
import { useState, useEffect } from 'react';
import { useSession } from '../context/SessionContext';

export const useSharedWorkflowState = () => {
  const { sessionData, updateSessionData } = useSession();
  
  // Estado compartido entre tabs
  const [sharedState, setSharedState] = useState({
    patient: null,
    analysisResults: null,
    selectedTests: [],
    physicalExamResults: [],
    soapNote: null
  });

  // Tab 1 -> Tab 2: Pasar tests seleccionados
  const passTestsToEvaluation = (tests: any[]) => {
    updateSessionData('tab2', { suggestedTests: tests });
    setSharedState(prev => ({ ...prev, selectedTests: tests }));
  };

  // Tab 2 -> Tab 3: Pasar resultados de evaluación
  const passResultsToSOAP = (results: any[]) => {
    updateSessionData('tab2', { completedTests: results });
    setSharedState(prev => ({ ...prev, physicalExamResults: results }));
  };

  // Tab 3: Guardar SOAP final
  const saveSOAPNote = (soap: any) => {
    updateSessionData('tab3', { soapNote: soap });
    setSharedState(prev => ({ ...prev, soapNote: soap }));
  };

  return {
    sharedState,
    passTestsToEvaluation,
    passResultsToSOAP,
    saveSOAPNote,
    sessionData
  };
};
