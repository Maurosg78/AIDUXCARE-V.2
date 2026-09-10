import { describe, it, expect, vi } from 'vitest';

// TD-020 (2026-09-11): filterRedFlagsAgainstDecisions espera string[] en
// incomingRedFlags — normalizeDecisionText llama a .normalize('NFD') sobre
// cada elemento. Un caller que pasa FollowUpAlertFlag[] (objetos
// {label, evidence, suggested_action}) en vez de extraer .label revienta
// en producción con "t.normalize is not a function" (confirmado: sesión
// Luciana Correa, AiDux Air). Este archivo no existía — se crea acá para
// dejar el contrato de la función bajo test, no solo documentado en un
// comentario.
const getDocsMock = vi.fn();
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  setDoc: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({ db: {} }));

import { filterRedFlagsAgainstDecisions } from '../clinicalDecisionService';

describe('filterRedFlagsAgainstDecisions', () => {
  it('accepts plain strings and returns them as active when there are no prior decisions', async () => {
    getDocsMock.mockResolvedValue({ docs: [] });

    const result = await filterRedFlagsAgainstDecisions('patient-1', [
      'Dolor torácico de inicio súbito',
    ]);

    expect(result.active).toEqual(['Dolor torácico de inicio súbito']);
    expect(result.previouslyReviewed).toEqual([]);
  });

  it('drops a red flag entirely once resolved/false_positive, ignoring accents/case', async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        {
          id: 'decision-1',
          data: () => ({
            kind: 'red_flag',
            status: 'false_positive',
            source: 'clinician',
            text: 'dolor toracico de inicio subito',
            decidedBy: 'uid-1',
            decidedAt: '2026-09-01T00:00:00.000Z',
            sessionId: 'session-1',
            patientId: 'patient-1',
            reason: null,
          }),
        },
      ],
    });

    const result = await filterRedFlagsAgainstDecisions('patient-1', [
      'Dolor Torácico de inicio súbito',
    ]);

    expect(result.active).toEqual([]);
    expect(result.previouslyReviewed).toEqual([]);
  });

  it('surfaces a previously monitored red flag under previouslyReviewed, not active', async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        {
          id: 'decision-2',
          data: () => ({
            kind: 'red_flag',
            status: 'monitoring',
            source: 'clinician',
            text: 'dolor toracico de inicio subito',
            decidedBy: 'uid-1',
            decidedAt: '2026-09-01T00:00:00.000Z',
            sessionId: 'session-1',
            patientId: 'patient-1',
            reason: null,
          }),
        },
      ],
    });

    const result = await filterRedFlagsAgainstDecisions('patient-1', [
      'Dolor Torácico de inicio súbito',
    ]);

    expect(result.active).toEqual([]);
    expect(result.previouslyReviewed).toHaveLength(1);
    expect(result.previouslyReviewed[0].status).toBe('monitoring');
  });

  it('throws a clear TypeError if a caller passes flag objects instead of extracted labels — the exact TD-020 regression', async () => {
    getDocsMock.mockResolvedValue({ docs: [] });

    const flagObjectsMisusedAsStrings = [
      { label: 'Dolor torácico', evidence: '', suggested_action: '' },
    ] as unknown as string[];

    await expect(
      filterRedFlagsAgainstDecisions('patient-1', flagObjectsMisusedAsStrings),
    ).rejects.toThrow(/normalize is not a function/);
  });
});
