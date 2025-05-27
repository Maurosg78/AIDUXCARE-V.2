import type { SuggestionToIntegrate } from '@/core/services/EMRFormService';

export class EMRFormService {
  static async insertSuggestion(
    suggestion: SuggestionToIntegrate,
    visitId: string,
    patientId: string,
    userId: string
  ): Promise<boolean> {
    // Aquí iría la implementación real
    return true;
  }
} 