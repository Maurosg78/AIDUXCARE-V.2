import { create } from 'zustand';

interface SharedWorkflowState {
  patient: any;
  analysisResults: any;
  selectedFindings: string[];
  unselectedFindings: string[];
  modifiedFindings: Record<string, any>;
  physicalExamResults: any[];
  suggestedTests: string[];
  performedTests: string[];
  skippedTests: string[];
  soapNote: string | null;
  
  setPatient: (patient: any) => void;
  setAnalysisResults: (results: any) => void;
  updateSelectedFindings: (findings: string[]) => void;
  updatePhysicalExamResults: (results: any[]) => void;
  setSoapNote: (note: string) => void;
  trackModifiedFinding: (id: string, modification: any) => void;
  trackSkippedTest: (testName: string) => void;
}

export const useSharedWorkflowState = create<SharedWorkflowState>((set) => ({
  patient: null,
  analysisResults: null,
  selectedFindings: [],
  unselectedFindings: [],
  modifiedFindings: {},
  physicalExamResults: [],
  suggestedTests: [],
  performedTests: [],
  skippedTests: [],
  soapNote: null,
  
  setPatient: (patient) => set({ patient }),
  
  setAnalysisResults: (results) => set({ 
    analysisResults: results,
    suggestedTests: results?.pruebas_recomendadas || []
  }),
  
  updateSelectedFindings: (findings) => set((state) => ({
    selectedFindings: findings,
    unselectedFindings: state.analysisResults?.hallazgos_clinicos
      ?.filter((h: any) => !findings.includes(h.id))
      ?.map((h: any) => h.id) || []
  })),
  
  updatePhysicalExamResults: (results) => set((state) => ({
    physicalExamResults: results,
    performedTests: results.map(r => r.testName),
    skippedTests: state.suggestedTests.filter(
      test => !results.find(r => r.testName === test)
    )
  })),
  
  setSoapNote: (note) => set({ soapNote: note }),
  
  trackModifiedFinding: (id, modification) => set((state) => ({
    modifiedFindings: {
      ...state.modifiedFindings,
      [id]: modification
    }
  })),
  
  trackSkippedTest: (testName) => set((state) => ({
    skippedTests: [...state.skippedTests, testName]
  }))
}));
