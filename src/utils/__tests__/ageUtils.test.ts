import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAgeGateStatus,
  isAgeUnknown,
  isMinorForConsentGate,
  validateConsentForAgeGate,
  validateConsentForAgeGateWithLegacyPolicy,
} from '../ageUtils';

describe('ageUtils consent gate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-08T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('classifies a valid dateOfBirth under 18 as minor', () => {
    expect(getAgeGateStatus('2009-01-01', null)).toBe('minor');
    expect(isMinorForConsentGate('2009-01-01')).toBe(true);
  });

  it('classifies a minor with only birthDate as minor', () => {
    expect(getAgeGateStatus(null, '2009-01-01')).toBe('minor');
    expect(isMinorForConsentGate(null, '2009-01-01')).toBe(true);
  });

  it('classifies an adult dateOfBirth as adult', () => {
    expect(getAgeGateStatus('1985-01-01', null)).toBe('adult');
    expect(isMinorForConsentGate('1985-01-01')).toBe(false);
  });

  it('classifies missing dates as unknown', () => {
    expect(getAgeGateStatus(null, null)).toBe('unknown');
    expect(isAgeUnknown(null, null)).toBe(true);
  });

  it('classifies invalid dateOfBirth as unknown', () => {
    expect(getAgeGateStatus('not-a-date', null)).toBe('unknown');
    expect(isAgeUnknown('not-a-date', null)).toBe(true);
  });

  it('rejects adult authorization for minors as insufficient', () => {
    expect(validateConsentForAgeGate('2009-01-01', null, 'authorized')).toBe(
      'minor_requires_representative'
    );
  });

  it('accepts representative authorization for minors', () => {
    expect(validateConsentForAgeGate('2009-01-01', null, 'authorized_by_representative')).toBe(
      'valid'
    );
  });

  it('accepts explicitly marked legacy paper consent', () => {
    expect(validateConsentForAgeGate('2009-01-01', null, 'authorized', true)).toBe('valid');
  });

  it('requires adult confirmation for existing patients with unknown date of birth', () => {
    expect(
      validateConsentForAgeGateWithLegacyPolicy(
        null,
        null,
        'authorized',
        '2026-06-07T23:59:59.000Z',
        null
      )
    ).toBe('age_unknown_confirmation_required');
  });

  it('blocks new patients with unknown date of birth', () => {
    expect(
      validateConsentForAgeGateWithLegacyPolicy(
        null,
        null,
        'authorized',
        '2026-06-08T00:00:00.000Z',
        null
      )
    ).toBe('age_unknown_dob_required');
  });

  it('accepts existing unknown date of birth after clinician confirms adult age', () => {
    expect(
      validateConsentForAgeGateWithLegacyPolicy(
        null,
        null,
        'authorized',
        '2026-06-07T23:59:59.000Z',
        '2026-06-08T12:30:00.000Z'
      )
    ).toBe('valid');
  });
});
