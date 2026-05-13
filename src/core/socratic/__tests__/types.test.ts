import { describe, expect, it } from 'vitest';

import { getActiveFacts } from '../types';
import type { DocumentedFact } from '../types';

const baseFact: DocumentedFact = {
  id: 'fact-active',
  text: 'Paciente refiere temor a recaida.',
  category: 'fear_or_confidence',
  confidence: 'patient_reported',
  status: 'active',
  traceability: {
    sourceType: 'transcript',
    sessionId: 'session-1',
    sourceText: 'Tengo miedo de volver a lesionarme.',
    createdBy: 'human',
  },
};

describe('getActiveFacts', () => {
  it('keeps active facts without expiry or supersession', () => {
    expect(getActiveFacts([baseFact], '2026-05-13T12:00:00.000Z')).toEqual([baseFact]);
  });

  it('filters expired, superseded and non-active facts', () => {
    const activeFact: DocumentedFact = {
      ...baseFact,
      id: 'fact-current',
    };
    const expiredFact: DocumentedFact = {
      ...baseFact,
      id: 'fact-expired',
      validUntil: '2026-05-12T23:59:59.000Z',
    };
    const supersededFact: DocumentedFact = {
      ...baseFact,
      id: 'fact-superseded',
      supersededBy: 'fact-current',
    };
    const inactiveFact: DocumentedFact = {
      ...baseFact,
      id: 'fact-inactive',
      status: 'superseded',
    };

    expect(
      getActiveFacts(
        [activeFact, expiredFact, supersededFact, inactiveFact],
        '2026-05-13T12:00:00.000Z',
      ),
    ).toEqual([activeFact]);
  });
});
