import { describe, expect, it } from 'vitest';
import { buildCanadianAnalysisPrompt } from '../markets/ca/buildAnalysisPrompt.ca';
import { buildSpanishAnalysisPrompt } from '../markets/es/buildAnalysisPrompt.es';

describe('buildAnalysisPrompt medication safety', () => {
  it('preserves the ES medication reconciliation contract', () => {
    const prompt = buildSpanishAnalysisPrompt({
      contextoPaciente: 'Paciente en valoración de fisioterapia.',
      transcript: 'La paciente refiere que suspendió naproxeno por molestias gástricas.',
      visitType: 'initial',
      attachments: [],
    });

    expect(prompt).toContain('ANÁLISIS PREVIO OBLIGATORIO — MEDICACIÓN:');
    expect(prompt).toContain(
      'Un campo medications vacío solo es correcto si el paciente\ndijo explícitamente que no toma ningún medicamento.'
    );
    expect(prompt).toContain(
      'mention_status:"current|previous|stopped_adverse|topical_or_supplement|unclear"'
    );
    expect(prompt).toContain('adverse_drug_reactions:[{drug_name:"nombre del medicamento referido"');
    expect(prompt).toContain('PRIORIDAD DE NOMBRES:');
    expect(prompt).toContain('La similitud fonética NO es certeza.');
    expect(prompt).toContain(
      'Medicación explícita presente en texto OCR o informe adjunto (incluyendo Enantyum, dexketoprofeno, intramuscular, IM)'
    );
    expect(prompt).not.toContain('MANDATORY PRE-ANALYSIS — MEDICATION:');
  });

  it('injects the complete medication reconciliation contract in natural en-CA', () => {
    const prompt = buildCanadianAnalysisPrompt({
      contextoPaciente: 'Patient attending an Ontario physiotherapy assessment.',
      transcript: 'The patient mentions a medication unrelated to the presenting concern.',
      visitType: 'initial',
      attachments: [],
    });

    expect(prompt).toContain('[PROMPT_VERSION: ca-analysis-v1.3 | 2026-08-03]');
    expect(prompt).toContain('MANDATORY PRE-ANALYSIS — MEDICATION:');
    expect(prompt).toContain(
      'An empty medications array is correct only when the patient\nexplicitly states that they do not take any medication.'
    );
    expect(prompt).toContain(
      'mention_status:"current|previous|stopped_adverse|topical_or_supplement|unclear"'
    );
    expect(prompt).toContain(
      'adverse_drug_reactions:[{drug_name:"patient-reported medication name"'
    );
    expect(prompt).toContain('NAME PRIORITY:');
    expect(prompt).toContain('Phonetic similarity is NOT certainty.');
    expect(prompt).toContain(
      'Patients often mention medication incidentally during physiotherapy.'
    );
    expect(prompt).toContain(
      'Explicit medication present in OCR text or an attached written report must be included in medications'
    );
    expect(prompt).not.toContain('ANÁLISIS PREVIO OBLIGATORIO — MEDICACIÓN:');
    expect(prompt).not.toContain('PRIORIDAD DE NOMBRES:');
  });

  it('instructs CA to retain naproxen stopped after an adverse reaction', () => {
    const stoppedMedicationTranscript =
      'The patient says: I stopped taking naproxen because it upset my stomach, without medical advice.';
    const prompt = buildCanadianAnalysisPrompt({
      contextoPaciente: 'Patient attending an Ontario physiotherapy follow-up.',
      transcript: stoppedMedicationTranscript,
      visitType: 'follow-up',
      attachments: [],
    });

    expect(prompt).toContain(`<transcript>
${stoppedMedicationTranscript}
</transcript>`);
    expect(prompt).toContain(
      '"stopped_adverse" when the patient stopped it because of an adverse reaction or intolerance.'
    );
    expect(prompt).toContain(
      'mention_status: "stopped_adverse" and capture the stomach upset in adverse_drug_reactions.'
    );
    expect(prompt).toContain('Do NOT omit it or classify it as current.');
    expect(prompt.indexOf('MANDATORY PRE-ANALYSIS — MEDICATION:')).toBeLessThan(
      prompt.indexOf('[Transcript]')
    );
  });
});
