/**
 * CompetencyGuardService — Phase 1B
 * Validates practitioner scope under COTO (Ontario)
 * Market: CA
 * Language: en-CA
 */
export class CompetencyGuardService {
  static validateScope(entry: string): string {
    const restricted = /(surgery|prescription|diagnose cancer)/i;
    if (restricted.test(entry))
      return '❌ Outside Ontario physiotherapy scope — violates COTO competency framework';
    return '✅ Within authorized physiotherapy practice scope';
  }

  static verifyCertification(id: string): boolean {
    return /^ON-\d{5,7}$/.test(id);
  }
}
