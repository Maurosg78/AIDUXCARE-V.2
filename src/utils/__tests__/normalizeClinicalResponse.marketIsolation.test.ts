import { describe, expect, it } from 'vitest';
import { normalizeClinicalResponse } from '../normalizers/normalizeClinicalResponse';

const responsePayload = {
  medicolegal_alerts: {
    red_flags: [
      'Clinical concern: Metamizol use. Recommend medical review/referral based on red flags.',
    ],
    yellow_flags: [
      'Electrical sensations with movement.',
    ],
    legal_exposure: 'high',
    alert_notes: [
      'Clinical concern: medication safety issue.',
    ],
  },
  conversation_highlights: {
    chief_complaint: 'Post-surgical wrist pain.',
    key_findings: [
      'Pin removed one week ago.',
    ],
    medical_history: [
      'Open reduction and internal fixation.',
    ],
    major_medical_history: [
      'History of myocardial infarction with coronary stents.',
    ],
    medications: [
      {
        original_text: 'Metamizol 575 mg cada 12 horas si dolor',
        normalized_name: 'Metamizol',
        active_ingredient: 'metamizol',
        confidence: 'high',
        requires_review: false,
        dose: '575 mg',
        frequency: 'cada 12 horas',
        duration: '',
      },
    ],
    summary: 'Follow-up after surgery.',
  },
  recommended_physical_tests: [],
  biopsychosocial_factors: {
    psychological: ['Fear of movement.'],
  },
};

describe('normalizeClinicalResponse market isolation', () => {
  it('applies only light ES localization in the ES normalizer', () => {
    const result = normalizeClinicalResponse(responsePayload, { market: 'ES' });

    expect(result.red_flags[0]).toContain('Preocupación clínica:');
    expect(result.red_flags[0]).toContain('Recomendar revisión/derivación médica según red flags.');
    expect(typeof result.medicacion_actual[0]).toBe('object');
    expect(result.medicacion_actual[0]).toMatchObject({
      text: 'Metamizol',
      medication_data: expect.objectContaining({
        normalized_name: 'Metamizol',
        original_text: 'Metamizol 575 mg cada 12 horas si dolor',
        requires_review: false,
      }),
    });
    expect(result.antecedentes_medicos).toContain('History of myocardial infarction with coronary stents.');
  });

  it('keeps CA output untouched by Spanish localization', () => {
    const result = normalizeClinicalResponse(responsePayload, { market: 'CA' });

    expect(result.red_flags[0]).toContain('Clinical concern:');
    expect(result.red_flags[0]).not.toContain('Preocupación clínica:');
    expect(typeof result.medicacion_actual[0]).toBe('object');
    expect(result.medicacion_actual[0]).toMatchObject({
      text: 'Metamizol',
      medication_data: expect.objectContaining({
        normalized_name: 'Metamizol',
        original_text: 'Metamizol 575 mg cada 12 horas si dolor',
        requires_review: false,
      }),
    });
    expect(result.antecedentes_medicos).toContain('History of myocardial infarction with coronary stents.');
  });

  it('keeps legacy string medications as strings', () => {
    const legacyPayload = {
      ...responsePayload,
      conversation_highlights: {
        ...responsePayload.conversation_highlights,
        medications: [
          'Metamizol, 575 mg, every 12 hours, as needed for pain.',
        ],
      },
    };

    const result = normalizeClinicalResponse(legacyPayload, { market: 'ES' });

    expect(typeof result.medicacion_actual[0]).toBe('string');
    expect(result.medicacion_actual[0]).toContain('cada 12 horas');
  });

  it('merges pre-extracted major medical history before model-returned history', () => {
    const payloadWithPreExtraction = {
      ...responsePayload,
      pre_extracted_major_medical_history: [
        'Infarto agudo de miocardio x2 (2003 y 2020, referido por el paciente)',
        'Stents coronarios x3, uno no funcional',
      ],
    };

    const result = normalizeClinicalResponse(payloadWithPreExtraction, { market: 'ES' });

    expect(result.antecedentes_medicos[0]).toBe('Infarto agudo de miocardio x2 (2003 y 2020, referido por el paciente)');
    expect(result.antecedentes_medicos).toContain('Stents coronarios x3, uno no funcional');
    expect(result.antecedentes_medicos).toContain('History of myocardial infarction with coronary stents.');
  });

  it('preserves pre-extracted major medical history from proxy text responses', () => {
    const proxyResponse = {
      text: JSON.stringify(responsePayload),
      pre_extracted_major_medical_history: [
        'Capacidad cardíaca 70-75%',
        'Tabaquismo activo',
      ],
    };

    const result = normalizeClinicalResponse(proxyResponse, { market: 'ES' });

    expect(result.antecedentes_medicos[0]).toBe('Capacidad cardíaca 70-75%');
    expect(result.antecedentes_medicos).toContain('Tabaquismo activo');
    expect(result.antecedentes_medicos).toContain('History of myocardial infarction with coronary stents.');
  });
});
