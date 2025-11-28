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
    soapNote: null,
    physicalEvaluation: {
      selectedTests: []
    }
  });

  useEffect(() => {
    if (sessionData?.physicalEvaluation?.selectedTests) {
      setSharedState((prev) => ({
        ...prev,
        physicalEvaluation: {
          selectedTests: sessionData.physicalEvaluation.selectedTests
        }
      }));
    }
  }, [sessionData?.physicalEvaluation?.selectedTests]);

  // Tab 1 -> Tab 2: Pasar tests seleccionados
  const passTestsToEvaluation = (tests: any[]) => {
    updateSessionData('tab2', { suggestedTests: tests });
    setSharedState(prev => ({ ...prev, selectedTests: tests }));
    console.log(`Pasando ${tests.length} tests a evaluación`);
  };

  const updatePhysicalEvaluation = (tests: any[]) => {
    updateSessionData('physicalEvaluation', { selectedTests: tests });
    setSharedState((prev) => ({
      ...prev,
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

  return {
    sharedState,
    passTestsToEvaluation,
    passResultsToSOAP,
    saveSOAPNote,
    updatePhysicalEvaluation,
    sessionData
  };
};
