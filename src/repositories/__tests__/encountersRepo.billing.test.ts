/**
 * WO-PILOTO-PRIORIDADES: Unit tests for billing export (order, sessionNumber, billingType).
 * Tests buildBillingExportFromEncounters; getEncountersForBilling uses it after filter/sort.
 */

import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { buildBillingExportFromEncounters } from '../encountersRepo';
import type { Encounter } from '../encountersRepo';

const toEncounter = (id: string, patientId: string, encounterDate: Date, status: 'completed' | 'signed' = 'completed'): Encounter => ({
  id,
  patientId,
  authorUid: 'user1',
  status,
  encounterDate: Timestamp.fromDate(encounterDate),
  createdAt: Timestamp.fromDate(encounterDate),
  updatedAt: Timestamp.fromDate(encounterDate),
});

describe('buildBillingExportFromEncounters', () => {
  it('returns empty array when no encounters', () => {
    expect(buildBillingExportFromEncounters([])).toEqual([]);
  });

  it('maps single encounter with sessionNumber 1 and visitType initial', () => {
    const enc = toEncounter('e1', 'p1', new Date('2025-01-15'));
    const result = buildBillingExportFromEncounters([enc]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      encounterId: 'e1',
      patientId: 'p1',
      sessionNumber: 1,
      visitType: 'initial',
      status: 'completed',
    });
    expect(result[0].encounterDate).toBe(new Date('2025-01-15').toISOString());
    expect(['PRIVATE', 'MVA', 'WSIB', 'UNKNOWN']).toContain(result[0].billingType);
  });

  it('assigns sessionNumber 1, 2, 3 and visitType initial then follow-up', () => {
    const enc1 = toEncounter('e1', 'p1', new Date('2025-01-15'));
    const enc2 = toEncounter('e2', 'p1', new Date('2025-01-22'));
    const enc3 = toEncounter('e3', 'p1', new Date('2025-01-29'));
    const result = buildBillingExportFromEncounters([enc1, enc2, enc3]);
    expect(result).toHaveLength(3);
    expect(result[0].sessionNumber).toBe(1);
    expect(result[0].visitType).toBe('initial');
    expect(result[1].sessionNumber).toBe(2);
    expect(result[1].visitType).toBe('follow-up');
    expect(result[2].sessionNumber).toBe(3);
    expect(result[2].visitType).toBe('follow-up');
  });

  it('preserves encounterDate as ISO string', () => {
    const enc = toEncounter('e1', 'p1', new Date('2025-06-01T12:00:00.000Z'));
    const result = buildBillingExportFromEncounters([enc]);
    expect(result[0].encounterDate).toBe('2025-06-01T12:00:00.000Z');
  });

  it('includes billingType from classification (PRIVATE when no signal)', () => {
    const enc = toEncounter('e1', 'p1', new Date('2025-01-15'));
    const result = buildBillingExportFromEncounters([enc]);
    expect(result[0].billingType).toBe('PRIVATE');
  });
});
