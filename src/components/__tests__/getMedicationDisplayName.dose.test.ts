import { describe, it, expect } from 'vitest';

// Inline replica of getMedicationDisplayName dose-append logic for unit testing.
// Mirrors the exact guard added in ClinicalAnalysisResults.tsx:
//   if (dose && dose.trim() && !displayName.includes(dose)) return `${displayName} ${dose}`.trim();
const applyDoseToDisplayName = (displayName: string, dose: string | undefined | null): string => {
  if (dose && dose.trim() && !displayName.includes(dose)) {
    return `${displayName} ${dose}`.trim();
  }
  return displayName;
};

describe('getMedicationDisplayName — dose append (FIX)', () => {
  it('añade la dosis cuando el nombre no la contiene', () => {
    expect(applyDoseToDisplayName('Janumet', '50/1000')).toBe('Janumet 50/1000');
    expect(applyDoseToDisplayName('Trankimazin', '25')).toBe('Trankimazin 25');
  });

  it('NO añade dosis vacía o solo espacios', () => {
    expect(applyDoseToDisplayName('eliprán', '')).toBe('eliprán');
    expect(applyDoseToDisplayName('eliprán', '   ')).toBe('eliprán');
    expect(applyDoseToDisplayName('eliprán', undefined)).toBe('eliprán');
    expect(applyDoseToDisplayName('eliprán', null)).toBe('eliprán');
  });

  it('NO duplica la dosis si el nombre ya la contiene', () => {
    expect(applyDoseToDisplayName('Janumet 50/1000', '50/1000')).toBe('Janumet 50/1000');
    expect(applyDoseToDisplayName('tranquilmacín de 25', '25')).toBe('tranquilmacín de 25');
  });
});
