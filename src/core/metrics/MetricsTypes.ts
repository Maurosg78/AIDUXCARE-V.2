export type SuggestionEventType = 'generated' | 'shown' | 'accepted' | 'rejected' | 'integrated';

export interface SuggestionEvent {
  suggestionId: string;
  visitId: string;
  type: SuggestionEventType;
  atISO: string;
  meta?: Record<string, unknown>;
}
