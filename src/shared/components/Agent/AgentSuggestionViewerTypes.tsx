export const AgentSuggestionType = () => <span>Stub AgentSuggestionType</span>;
export const AgentSuggestionStatus = () => <span>Stub AgentSuggestionStatus</span>;

export interface AgentSuggestion {
  id: string;
  type: 'recommendation' | 'warning' | 'info';
  content: string;
  sourceBlockId: string;
  field: string;
} 