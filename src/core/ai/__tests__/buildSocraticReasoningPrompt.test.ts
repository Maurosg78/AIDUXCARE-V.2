import { describe, expect, it, vi } from 'vitest';

import {
  buildSocraticReasoningPrompt,
  parseSocraticReasoningResponse,
  validateSocraticReasoningResponse,
  type SocraticSyntheticReasoningContext,
} from '../buildSocraticReasoningPrompt';

const SYNTHETIC_CONTEXT: SocraticSyntheticReasoningContext = {
  dataClassification: 'synthetic',
  contextId: 'synthetic-case-001',
  sources: [
    {
      id: 'DEMO-SESSION-1',
      kind: 'synthetic_patient_fact',
      citation: 'Caso sintético · Sesión 1',
      content: 'La persona simulada tolera caminar durante 20 minutos.',
    },
    {
      id: 'DEMO-EVIDENCE-1',
      kind: 'synthetic_evidence',
      citation: 'Referencia sintética DEMO-E1',
      content: 'Fixture creado únicamente para probar trazabilidad.',
    },
  ],
};

const ALLOWED_SOURCE_IDS = SYNTHETIC_CONTEXT.sources.map((source) => source.id);

describe('buildSocraticReasoningPrompt', () => {
  it('builds a synthetic-only prompt with a strict question contract', () => {
    const prompt = buildSocraticReasoningPrompt(SYNTHETIC_CONTEXT);

    expect(prompt).toContain('SYNTHETIC DEMO ONLY');
    expect(prompt).toContain('Never diagnose');
    expect(prompt).toContain('Never recommend');
    expect(prompt).toContain('Never generate assessments');
    expect(prompt).toContain('DEMO-SESSION-1');
    expect(prompt).toContain('DEMO-EVIDENCE-1');
  });

  it('rejects a non-synthetic runtime classification', () => {
    const invalidContext = {
      ...SYNTHETIC_CONTEXT,
      dataClassification: 'clinical',
    } as unknown as SocraticSyntheticReasoningContext;

    expect(() => buildSocraticReasoningPrompt(invalidContext)).toThrow(
      'accepts synthetic context only'
    );
  });
});

describe('validateSocraticReasoningResponse', () => {
  it('accepts interrogative questions with traceable sources', () => {
    const response = {
      questions: [
        {
          id: 'Q1',
          question: '¿Qué cambio funcional merece aclararse?',
          sourceRefs: ['DEMO-SESSION-1'],
        },
        {
          id: 'Q2',
          question: '¿Cómo relacionarías el dato documentado con la fuente sintética?',
          sourceRefs: ['DEMO-SESSION-1', 'DEMO-EVIDENCE-1'],
        },
      ],
    };

    const result = validateSocraticReasoningResponse(response, ALLOWED_SOURCE_IDS);

    expect(result.ok).toBe(true);
  });

  it.each([
    'Debe derivar al paciente?',
    '¿Recomiendo iniciar un tratamiento?',
    '¿Está indicado prescribir ejercicio?',
    'Diagnóstico: ¿fascitis plantar?',
    'Should the clinician prescribe treatment?',
  ])('rejects prescriptive language: %s', (question) => {
    const response = {
      questions: [
        {
          id: 'Q1',
          question,
          sourceRefs: ['DEMO-SESSION-1'],
        },
      ],
    };

    const result = validateSocraticReasoningResponse(response, ALLOWED_SOURCE_IDS);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors).toContain(
        'questions[0].question contains blocked prescriptive language'
      );
    }
  });

  it('rejects a question without a cited source', () => {
    const response = {
      questions: [
        {
          id: 'Q1',
          question: '¿Qué información falta?',
          sourceRefs: [],
        },
      ],
    };

    const result = validateSocraticReasoningResponse(response, ALLOWED_SOURCE_IDS);

    expect(result.ok).toBe(false);
  });

  it('rejects a source that is not present in the supplied context', () => {
    const response = {
      questions: [
        {
          id: 'Q1',
          question: '¿Qué información falta?',
          sourceRefs: ['UNKNOWN-SOURCE'],
        },
      ],
    };

    const result = validateSocraticReasoningResponse(response, ALLOWED_SOURCE_IDS);

    expect(result.ok).toBe(false);
  });

  it('rejects non-interrogative content', () => {
    const response = {
      questions: [
        {
          id: 'Q1',
          question: 'La evolución funcional es favorable.',
          sourceRefs: ['DEMO-SESSION-1'],
        },
      ],
    };

    const result = validateSocraticReasoningResponse(response, ALLOWED_SOURCE_IDS);

    expect(result.ok).toBe(false);
  });

  it('logs an anomaly and returns no value for an unsafe parsed response', () => {
    const warningSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const rawResponse = JSON.stringify({
      questions: [
        {
          id: 'Q1',
          question: 'Debe iniciar tratamiento?',
          sourceRefs: ['DEMO-SESSION-1'],
        },
      ],
    });

    const result = parseSocraticReasoningResponse(rawResponse, ALLOWED_SOURCE_IDS);

    expect(result.ok).toBe(false);
    expect(warningSpy).toHaveBeenCalledWith(
      '[SOCRATES-ANOMALY] Rejected structurally unsafe response',
      expect.objectContaining({
        errorCount: expect.any(Number),
      })
    );

    warningSpy.mockRestore();
  });
});
