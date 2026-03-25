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
    medications: [
      'Metamizol, 575 mg, every 12 hours, as needed for pain.',
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
    expect(result.medicacion_actual[0]).toContain('cada 12 horas');
    expect(result.medicacion_actual[0]).toContain('según dolor');
  });

  it('keeps CA output untouched by Spanish localization', () => {
    const result = normalizeClinicalResponse(responsePayload, { market: 'CA' });

    expect(result.red_flags[0]).toContain('Clinical concern:');
    expect(result.red_flags[0]).not.toContain('Preocupación clínica:');
    expect(result.medicacion_actual[0]).toContain('every 12 hours');
    expect(result.medicacion_actual[0]).not.toContain('cada 12 horas');
  });
});
