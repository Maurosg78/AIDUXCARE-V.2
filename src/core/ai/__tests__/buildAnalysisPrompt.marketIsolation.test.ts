import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const baseParams = {
  contextoPaciente: 'Patient undergoing physiotherapy assessment',
  transcript: 'Patient reports wrist pain after surgery.',
  visitType: 'follow-up' as const,
};

const loadBuildAnalysisPrompt = async () => {
  const module = await import('../markets/buildAnalysisPrompt');
  const buildAnalysisPrompt = module.buildAnalysisPrompt;

  return buildAnalysisPrompt;
};

describe('buildAnalysisPrompt market isolation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T12:00:00.000Z'));
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds an ES prompt without Canadian regulatory wording', async () => {
    const buildAnalysisPrompt = await loadBuildAnalysisPrompt();
    const prompt = buildAnalysisPrompt(baseParams, { market: 'ES' });

    expect(prompt).toContain('español clínico formal (es-ES)');
    expect(prompt).toContain('Ley 41/2002');
    expect(prompt).not.toContain('Ontario');
    expect(prompt).not.toContain('WSIB');
    expect(prompt).not.toContain('CPO');
  });

  it('builds a CA prompt without Spanish regulatory wording', async () => {
    const buildAnalysisPrompt = await loadBuildAnalysisPrompt();
    const prompt = buildAnalysisPrompt(baseParams, { market: 'CA' });

    expect(prompt).toContain('Canadian English (en-CA)');
    expect(prompt).toContain('Ontario, Canada');
    expect(prompt).toContain('CPO');
    expect(prompt).not.toContain('Ley 41/2002');
    expect(prompt).not.toContain('Consejo General de Colegios de Fisioterapeutas de España');
  });

  it('keeps stable snapshots for both markets', async () => {
    const buildAnalysisPrompt = await loadBuildAnalysisPrompt();
    const spanishPrompt = buildAnalysisPrompt(baseParams, { market: 'ES' });
    const canadianPrompt = buildAnalysisPrompt(baseParams, { market: 'CA' });

    expect(spanishPrompt).toMatchSnapshot('es-analysis-prompt');
    expect(canadianPrompt).toMatchSnapshot('ca-analysis-prompt');
  });
});
