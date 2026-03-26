import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNiagaraProcessor } from '../useNiagaraProcessor';
import {
  containsForbiddenEnglishInEsClinicalFields,
  getForbiddenEnglishTermsInEsClinicalFields,
} from '../../utils/normalizers/es/containsForbiddenEnglishInEsClinicalFields';

vi.mock('@/core/market/resolveClinicalMarket', () => {
  const resolveClinicalMarket = vi.fn(() => {
    return {
      market: 'ES',
      locale: 'es-ES',
      jurisdiction: 'ES-ES',
    };
  });

  return {
    resolveClinicalMarket,
  };
});

vi.mock('../../services/dataDeidentificationService', () => {
  const deidentify = vi.fn((value: string) => {
    const deidentifiedText = value;
    const identifiersMap = {};

    return {
      deidentifiedText,
      identifiersMap,
    };
  });

  const reidentify = vi.fn((value: string) => {
    return value;
  });

  const logDeidentification = vi.fn(async () => {
    return undefined;
  });

  return {
    deidentify,
    reidentify,
    logDeidentification,
  };
});

describe('useNiagaraProcessor ES attachment integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the ES attachment-driven path isolated and preserves medications from the attachment output', async () => {
    const attachmentText = [
      'Informe de alta hospitalaria.',
      'Tratamiento activo:',
      'Metamizol 575 mg cada 12 horas si dolor.',
      'Deflazacort 30 mg cada 24 horas.',
    ].join('\n');

    const vertexText = JSON.stringify({
      medicolegal_alerts: {
        red_flags: [
          'Clinical concern: Metamizol use. Recommend medical review/referral based on red flags.',
        ],
        yellow_flags: [
          'Temor al movimiento tras la cirugía.',
        ],
        legal_exposure: 'high',
        alert_notes: [
          'Preocupación clínica: posible incidencia de seguridad farmacológica.',
        ],
      },
      conversation_highlights: {
        chief_complaint: 'Dolor y rigidez de muñeca tras cirugía.',
        key_findings: [
          'Movilidad activa limitada tras retirada de agujas.',
        ],
        medical_history: [
          'Fractura distal de radio intervenida.',
        ],
        medications: [
          'Metamizol, 575 mg, every 12 hours, as needed for pain.',
          'Deflazacort, 30 mg, every 24 hours.',
        ],
        summary: 'Seguimiento postquirúrgico.',
      },
      recommended_physical_tests: [],
      biopsychosocial_factors: {
        psychological: [
          'Temor al movimiento.',
        ],
      },
    });

    const fetchJson = vi.fn(async () => {
      return {
        ok: true,
        text: vertexText,
      };
    });

    const fetchMock = vi.fn(async (_url: string, options?: RequestInit) => {
      const body = typeof options?.body === 'string' ? options.body : '';

      return {
        ok: true,
        json: fetchJson,
        text: async () => body,
      };
    });

    vi.stubGlobal('fetch', fetchMock);

    const payload = {
      text: 'Paciente con dolor y miedo al movimiento tras cirugía.',
      lang: 'es',
      mode: 'live' as const,
      timestamp: 1774474307532,
      visitType: 'follow-up' as const,
      attachments: [
        {
          fileName: 'alta-hospitalaria.pdf',
          fileType: 'application/pdf',
          extractedText: attachmentText,
          pageCount: 1,
        },
      ],
    };

    const hook = renderHook(() => useNiagaraProcessor());

    let analysisResult: any = null;

    await act(async () => {
      const result = await hook.result.current.processText(payload);
      analysisResult = result;
    });

    const fetchCall = fetchMock.mock.calls[0];
    const fetchOptions = fetchCall?.[1];
    const fetchBody = typeof fetchOptions?.body === 'string' ? fetchOptions.body : '';
    const requestPayload = JSON.parse(fetchBody);
    const prompt = String(requestPayload.prompt || '');
    const medicationOutput = analysisResult?.medicacion_actual || [];
    const hasForbiddenEnglish = containsForbiddenEnglishInEsClinicalFields(analysisResult);
    const forbiddenTerms = getForbiddenEnglishTermsInEsClinicalFields(analysisResult);

    expect(prompt).toContain('fisioterapeuta colegiado en España');
    expect(prompt).toContain('## DOCUMENTOS CLÍNICOS ADJUNTOS');
    expect(prompt).toContain('EXTRACCIÓN OBLIGATORIA DE MEDICACIÓN');
    expect(prompt).toContain('Metamizol 575 mg cada 12 horas si dolor.');
    expect(prompt).toContain('Deflazacort 30 mg cada 24 horas.');
    expect(prompt).not.toContain('Ontario, Canada');
    expect(prompt).not.toContain('College of Physiotherapists of Ontario');

    expect(analysisResult).not.toBeNull();
    expect(hasForbiddenEnglish).toBe(false);
    expect(forbiddenTerms).toEqual([]);
    expect(analysisResult.red_flags[0]).toContain('Preocupación clínica:');
    expect(analysisResult.red_flags[0]).toContain('Recomendar revisión/derivación médica según red flags.');
    expect(analysisResult.motivo_consulta).toContain('Dolor y rigidez de muñeca');
    expect(medicationOutput).toContain('Metamizol, 575 mg, cada 12 horas, según dolor.');
    expect(medicationOutput).toContain('Deflazacort, 30 mg, cada 24 horas.');
  });
});
