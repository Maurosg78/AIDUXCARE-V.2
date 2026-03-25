import { describe, expect, it } from 'vitest';
import { resolveClinicalMarket } from '../resolveClinicalMarket';

describe('resolveClinicalMarket', () => {
  it('returns ES when Spain pilot is explicitly enabled', () => {
    const result = resolveClinicalMarket({ isSpainPilotEnabled: true });

    expect(result.market).toBe('ES');
    expect(result.locale).toBe('es-ES');
    expect(result.jurisdiction).toBe('ES-ES');
  });

  it('returns CA when Spain pilot is explicitly disabled', () => {
    const result = resolveClinicalMarket({ isSpainPilotEnabled: false });

    expect(result.market).toBe('CA');
    expect(result.locale).toBe('en-CA');
    expect(result.jurisdiction).toBe('CA-ON');
  });
});
