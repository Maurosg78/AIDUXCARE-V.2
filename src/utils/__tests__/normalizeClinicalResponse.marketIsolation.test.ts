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
      text: 'Metamizol 575 mg cada 12 horas si dolor',
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
      text: 'Metamizol 575 mg cada 12 horas si dolor',
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

  it('preserves dictated medication text over generic normalized categories', () => {
    const payloadWithGenericMedication = {
      ...responsePayload,
      conversation_highlights: {
        ...responsePayload.conversation_highlights,
        medications: [
          {
            original_text: 'MedicinaX 50 mg',
            normalized_name: 'Medicamento para condición Y',
            confidence: 'low',
            requires_review: true,
          },
          {
            original_text: 'AnsiolíticoX 1 mg',
            normalized_name: 'Medicamento para ansiedad',
            confidence: 'low',
            requires_review: true,
          },
        ],
      },
    };

    const result = normalizeClinicalResponse(payloadWithGenericMedication, { market: 'ES' });

    expect(result.medicacion_actual[0]).toMatchObject({
      text: 'MedicinaX 50 mg',
      medication_data: expect.objectContaining({
        normalized_name: 'Medicamento para condición Y',
        original_text: 'MedicinaX 50 mg',
        requires_review: true,
      }),
    });
    expect(result.medicacion_actual[1]).toMatchObject({
      text: 'AnsiolíticoX 1 mg',
      medication_data: expect.objectContaining({
        normalized_name: 'Medicamento para ansiedad',
        original_text: 'AnsiolíticoX 1 mg',
        requires_review: true,
      }),
    });
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

  it('normalizes structured red and yellow flags without rendering object placeholders', () => {
    const structuredFlagsPayload = {
      ...responsePayload,
      medicolegal_alerts: {
        ...responsePayload.medicolegal_alerts,
        red_flags: [
          {
            flag: 'Medicamento no identificado (ribotrín).',
            rationale: 'Requiere confirmación antes de dosificar ejercicio.',
          },
        ],
        yellow_flags: [
          {
            flag: 'Capacidad cardíaca reducida.',
            rationale: 'Adaptar carga y monitorizar respuesta.',
          },
        ],
      },
    };

    const result = normalizeClinicalResponse(structuredFlagsPayload, { market: 'ES' });

    expect(result.red_flags[0]).toContain('ribotrín');
    expect(result.red_flags[0]).toContain('Requiere confirmación');
    expect(result.red_flags[0]).not.toContain('[object Object]');
    expect(result.yellow_flags[0]).toContain('Capacidad cardíaca reducida');
    expect(result.yellow_flags[0]).not.toContain('[object Object]');
  });

  // §1.6 ENGINEERING.md: suggested_name dedup scenarios
  // These tests guard the three cases in mergePreExtractedMedications

  it('Scenario A: upgrades plain-string LLM entry to structured when pre-extracted has suggested_name', () => {
    // LLM extracts the misheard form. Pre-extractor has the misheard form + correction.
    // The structured entry must survive with suggested_name so the UI chip can render.
    const proxyResponse = {
      text: JSON.stringify({
        ...responsePayload,
        conversation_highlights: {
          ...responsePayload.conversation_highlights,
          medications: ['llanumet'],
        },
      }),
      pre_extracted_medications: [
        {
          original_text: 'llanumet',
          dose: '',
          frequency: '',
          mention_status: 'current',
          suggested_name: 'Janumet 50/1000',
        },
      ],
    };

    const result = normalizeClinicalResponse(proxyResponse, { market: 'ES' });

    const llanumetEntry = result.medicacion_actual.find(
      (m: any) => typeof m === 'object' && m?.medication_data?.original_text === 'llanumet'
    );
    expect(llanumetEntry).toBeDefined();
    expect((llanumetEntry as any).medication_data.suggested_name).toBe('Janumet 50/1000');
    expect((llanumetEntry as any).medication_data.requires_review).toBe(true);
    // No duplicate — only one entry for llanumet
    const duplicateCount = result.medicacion_actual.filter(
      (m: any) =>
        (typeof m === 'string' && m.toLowerCase() === 'llanumet') ||
        (typeof m === 'object' && m?.medication_data?.original_text?.toLowerCase() === 'llanumet')
    ).length;
    expect(duplicateCount).toBe(1);
  });

  it('Scenario B: no duplicate when LLM already has the corrected name from suggested_name', () => {
    // LLM correctly extracts "Janumet 50/1000". Pre-extractor has misheard "llanumet" + suggestion.
    // Only one entry for Janumet 50/1000 must appear — no phantom "llanumet" entry.
    const proxyResponse = {
      text: JSON.stringify({
        ...responsePayload,
        conversation_highlights: {
          ...responsePayload.conversation_highlights,
          medications: ['Janumet 50/1000'],
        },
      }),
      pre_extracted_medications: [
        {
          original_text: 'llanumet',
          dose: '',
          frequency: '',
          mention_status: 'current',
          suggested_name: 'Janumet 50/1000',
        },
      ],
    };

    const result = normalizeClinicalResponse(proxyResponse, { market: 'ES' });

    const janumetCount = result.medicacion_actual.filter(
      (m: any) =>
        (typeof m === 'string' && m.toLowerCase().includes('janumet')) ||
        (typeof m === 'object' &&
          (m?.text?.toLowerCase().includes('janumet') ||
           m?.medication_data?.original_text?.toLowerCase().includes('janumet')))
    ).length;
    expect(janumetCount).toBe(1);
    // No "llanumet" entry should appear
    const llanumetCount = result.medicacion_actual.filter(
      (m: any) =>
        (typeof m === 'string' && m.toLowerCase() === 'llanumet') ||
        (typeof m === 'object' && m?.medication_data?.original_text?.toLowerCase() === 'llanumet')
    ).length;
    expect(llanumetCount).toBe(0);
  });

  it('Scenario C: pre-extracted medication not in LLM output is added with suggested_name', () => {
    // LLM did not extract this medication at all. Pre-extractor found it with a correction.
    // Must appear as structured entry with suggested_name.
    const proxyResponse = {
      text: JSON.stringify({
        ...responsePayload,
        conversation_highlights: {
          ...responsePayload.conversation_highlights,
          medications: [],
        },
      }),
      pre_extracted_medications: [
        {
          original_text: 'llanumet',
          dose: '50/1000',
          frequency: 'diario',
          mention_status: 'current',
          suggested_name: 'Janumet 50/1000',
        },
      ],
    };

    const result = normalizeClinicalResponse(proxyResponse, { market: 'ES' });

    expect(result.medicacion_actual.length).toBeGreaterThan(0);
    const entry = result.medicacion_actual.find(
      (m: any) => typeof m === 'object' && m?.medication_data?.original_text === 'llanumet'
    );
    expect(entry).toBeDefined();
    expect((entry as any).medication_data.suggested_name).toBe('Janumet 50/1000');
    expect((entry as any).medication_data.dose).toBe('50/1000');
    expect((entry as any).medication_data.frequency).toBe('diario');
    expect((entry as any).medication_data.requires_review).toBe(true);
  });
});
