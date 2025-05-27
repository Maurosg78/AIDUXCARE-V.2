import type { SuggestionToIntegrate } from '@/core/services/EMRFormService';

export class EMRFormService {
  static async insertSuggestion(
    suggestion: SuggestionToIntegrate,
    visitId: string,
    patientId: string,
    userId: string
  ): Promise<boolean> {
    // Evitar warnings de variables no usadas
    void suggestion; void visitId; void patientId; void userId;
    // Aquí iría la implementación real
    return true;
  }
} 