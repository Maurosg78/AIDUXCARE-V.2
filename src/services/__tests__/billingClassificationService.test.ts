/**
 * WO-PILOTO-PRIORIDADES: Unit tests for BillingClassificationService.
 * Pure, deterministic classification; no SOAP, no side effects.
 */

import { describe, it, expect } from 'vitest';
import { BillingClassificationService } from '../billingClassificationService';
import type { BillingType } from '@/types/billing';

describe('BillingClassificationService.classifyEncounter', () => {
  it('returns UNKNOWN when encounter is null/undefined', () => {
    expect(BillingClassificationService.classifyEncounter(null as any)).toBe('UNKNOWN');
    expect(BillingClassificationService.classifyEncounter(undefined as any)).toBe('UNKNOWN');
  });

  it('returns UNKNOWN when id is missing', () => {
    expect(BillingClassificationService.classifyEncounter({ patientId: 'p1' })).toBe('UNKNOWN');
  });

  it('returns UNKNOWN when patientId is missing', () => {
    expect(BillingClassificationService.classifyEncounter({ id: 'e1' })).toBe('UNKNOWN');
  });

  it('returns MVA when billingType is MVA', () => {
    expect(
      BillingClassificationService.classifyEncounter({ id: 'e1', patientId: 'p1', billingType: 'MVA' })
    ).toBe('MVA');
  });

  it('returns MVA when source is mva', () => {
    expect(
      BillingClassificationService.classifyEncounter({ id: 'e1', patientId: 'p1', source: 'mva' })
    ).toBe('MVA');
  });

  it('returns WSIB when billingType is WSIB', () => {
    expect(
      BillingClassificationService.classifyEncounter({ id: 'e1', patientId: 'p1', billingType: 'WSIB' })
    ).toBe('WSIB');
  });

  it('returns WSIB when source is wsib', () => {
    expect(
      BillingClassificationService.classifyEncounter({ id: 'e1', patientId: 'p1', source: 'wsib' })
    ).toBe('WSIB');
  });

  it('returns PRIVATE when no billing signal (id + patientId present)', () => {
    expect(
      BillingClassificationService.classifyEncounter({ id: 'e1', patientId: 'p1' })
    ).toBe('PRIVATE');
    expect(
      BillingClassificationService.classifyEncounter({ id: 'e1', patientId: 'p1', status: 'completed' })
    ).toBe('PRIVATE');
  });

  it('prefers MVA/WSIB over PRIVATE when both present', () => {
    expect(
      BillingClassificationService.classifyEncounter({
        id: 'e1',
        patientId: 'p1',
        source: 'mva',
        billingType: 'WSIB',
      })
    ).toBe('MVA'); // first check is MVA
  });
});
