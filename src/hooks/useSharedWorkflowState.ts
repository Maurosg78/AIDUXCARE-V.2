import { create } from 'zustand';

interface SharedWorkflowState {
  analysisResults: any;
  completedTests: any[];
  setAnalysisResults: (results: any) => void;
  setCompletedTests: (tests: any[]) => void;
}

export const useSharedWorkflowState = create<SharedWorkflowState>((set) => ({
  analysisResults: null,
  completedTests: [],
  setAnalysisResults: (results) => set({ analysisResults: results }),
  setCompletedTests: (tests) => set({ completedTests: tests }),
}));
