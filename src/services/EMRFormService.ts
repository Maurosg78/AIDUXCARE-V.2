import { AgentSuggestion } from '@/shared/components/Agent/AgentSuggestionViewerTypes';

export class EMRFormService {
  static async insertSuggestion(
    suggestion: AgentSuggestion,
    visitId: string,
    userId: string
  ): Promise<boolean> {
    // Aquí iría la implementación real
    return true;
  }
} 