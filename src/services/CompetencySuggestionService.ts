/**
 * AiDuxCare — CompetencySuggestionService
 * Temporary placeholder until AI-competency engine re-enabled.
 */

export interface CompetencySuggestion {
  id: string;
  label: string;
  confidence?: number;
}

export interface CompetencySuggestionContext {
  text: string;
  timestamp: string;
}

export class CompetencySuggestionService {
  static suggest(text: string): CompetencySuggestion[] {
    if (!text) return [];
    if (/shoulder/i.test(text))
      return [
        { id: "shoulder_mobility", label: "Shoulder mobility", confidence: 0.9 },
        { id: "posture_correction", label: "Posture correction", confidence: 0.85 },
      ];
    if (/knee/i.test(text))
      return [
        { id: "knee_stability", label: "Knee stability", confidence: 0.9 },
        { id: "quad_strength", label: "Quadriceps strength", confidence: 0.82 },
      ];
    return [{ id: "general", label: "General physical conditioning", confidence: 0.7 }];
  }
}

// Aliases for backward compatibility
export const competencySuggestionService = CompetencySuggestionService;
export const CompetencySuggestionContextDefaults: CompetencySuggestionContext = {
  text: "",
  timestamp: new Date().toISOString(),
};
