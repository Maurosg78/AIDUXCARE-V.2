export const EMRFormService = {
  async getEMRForm(visitId: string) {
    return null;
  },
  async updateEMRForm(formData: unknown, userId: string) {
    return false;
  },
  async getSectionContent(visitId: string, section: string) {
    return "";
  },
  mapSuggestionTypeToEMRSection(type: string) {
    return "notes" as const;
  },
  async insertSuggestion(suggestion: unknown, visitId: string, patientId: string, userId: string) {
    return false;
  }
};

export type EMRSection = "subjective" | "objective" | "assessment" | "plan" | "notes";

export interface SuggestionToIntegrate {
  id: string;
  content: string;
  type: string;
  sourceBlockId: string;
  field?: string;
}
