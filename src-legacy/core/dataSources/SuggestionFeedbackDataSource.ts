export interface SuggestionFeedback {
  id: string;
  suggestion_id: string;
  visit_id: string;
  user_id: string;
  feedback_type: 'accepted' | 'rejected';
  created_at: string;
}

export interface SuggestionFeedbackDataSource {
  getFeedbacksByVisit(visitId: string): Promise<SuggestionFeedback[]>;
  getFeedbackBySuggestion(suggestionId: string): Promise<SuggestionFeedback | null>;
} 