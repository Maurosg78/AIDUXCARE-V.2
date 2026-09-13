import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeSpanishObjectiveField,
  parseConsiderationsFromResponse,
  generateFollowUpSOAPV2Raw,
} from '../vertex-ai-soap-service';
import { ensureSpanishClinicalText } from '@/utils/normalizers/es/ensureSpanishClinicalText';

const buildAuthenticatedJsonHeadersMock = vi.fn();
vi.mock('../firebaseAuthHeaders', () => ({
  buildAuthenticatedJsonHeaders: (...args: unknown[]) => buildAuthenticatedJsonHeadersMock(...args),
}));

describe('parseConsiderationsFromResponse', () => {
  it('merges wrapped bullet lines before sanitizing', () => {
    const rawResponse = [
      '• Disminución del dolor de 5 a',
      '3/10 observada.',
      '• La trayectoria general muestra una mejora.',
      '• Alta confianza en la tendencia de mejora observada.',
    ].join('\n');

    const parsedConsiderations = parseConsiderationsFromResponse(rawResponse);

    expect(parsedConsiderations).toEqual([
      'Disminución del dolor de 5 a 3/10 observada.',
      'La trayectoria general muestra una mejora.',
      'Alta confianza en la tendencia de mejora observada.',
    ]);
  });

  it('preserves a truncated pain line pattern for downstream repair', () => {
    const rawResponse = [
      '• El puntaje de dolor ha disminuido de 5 a',
      '• La trayectoria general muestra una mejora.',
    ].join('\n');

    const parsedConsiderations = parseConsiderationsFromResponse(rawResponse);

    expect(parsedConsiderations).toEqual([
      'El puntaje de dolor ha disminuido de 5 a',
      'La trayectoria general muestra una mejora.',
    ]);
  });
});

describe('normalizeSpanishObjectiveField', () => {
  it('keeps objective strictly objective when no new measurements were recorded', () => {
    const normalizedObjective = normalizeSpanishObjectiveField(
      'No se registraron nuevas medidas objetivas hoy. Observaciones del médico sobre la radiografía: fractura estable, ligera separación en el hueso estiloides cubital.'
    );

    expect(normalizedObjective).toBe('No se registraron nuevas medidas objetivas hoy.');
  });
});

describe('ensureSpanishClinicalText', () => {
  it('normalizes anatomical and mixed-language terminology for Spain', () => {
    const normalizedSubjective = ensureSpanishClinicalText('Dolor en hueso estiloides cubital.');
    const normalizedPlan = ensureSpanishClinicalText('Strength & Conditioning y home exercise program.');

    expect(normalizedSubjective).toContain('apófisis estiloides del cúbito');
    expect(normalizedPlan).toContain('fuerza y acondicionamiento');
    expect(normalizedPlan).toContain('programa de ejercicios en casa');
  });
});

// TD-018 (2026-09-09): confirmado en producción (sesión de Luciana Correa)
// que un fetch() disparado justo al volver de background pierde la red por
// unos segundos y descartaba una sesión de 30+ min ya grabada y transcrita.
describe('generateFollowUpSOAPV2Raw — reintento ante fallo transitorio de red (TD-018)', () => {
  const okSoapResponse = () => ({
    ok: true,
    status: 200,
    json: async () => ({
      text: JSON.stringify({
        soap: { subjective: 'S', objective: 'O', assessment: 'A', plan: 'P' },
        alerts: { red_flags: [] },
      }),
    }),
  });

  beforeEach(() => {
    vi.useFakeTimers();
    buildAuthenticatedJsonHeadersMock.mockResolvedValue({ Authorization: 'Bearer test-token' });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('retries after a transient network failure and returns the parsed SOAP on the next attempt', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('La conexión de red se perdió'))
      .mockResolvedValueOnce(okSoapResponse());
    vi.stubGlobal('fetch', fetchMock);

    const resultPromise = generateFollowUpSOAPV2Raw('prompt de prueba');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.error).toBeUndefined();
    expect(result.soap).toEqual({ subjective: 'S', objective: 'O', assessment: 'A', plan: 'P' });
  });

  it('returns AI_UNAVAILABLE only after exhausting all retries, not on the first failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('La conexión de red se perdió'));
    vi.stubGlobal('fetch', fetchMock);

    const resultPromise = generateFollowUpSOAPV2Raw('prompt de prueba');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    // withRetry por defecto: 1 intento inicial + 3 reintentos = 4 llamadas.
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(result.error).toEqual({
      type: 'AI_UNAVAILABLE',
      message: 'Follow-up AI generation failed or returned invalid response',
    });
    expect(result.soap).toBeNull();
  });
});
