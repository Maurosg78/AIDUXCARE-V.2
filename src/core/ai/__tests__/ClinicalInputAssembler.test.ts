import { describe, expect, it } from 'vitest';
import {
  ATTACHMENT_TOTAL_BUDGET_CHARS,
  createClinicalInputPackage,
  MAIN_TRANSCRIPT_BUDGET_CHARS,
  PROFESSIONAL_CONTEXT_BUDGET_CHARS,
  serializeClinicalInputPackage,
} from '../ClinicalInputAssembler';

const repeated = (value: string, count: number): string => Array(count).fill(value).join(' ');

describe('ClinicalInputAssembler', () => {
  it('preserves critical extracted data while compacting a 33K transcript', () => {
    const beginning = 'medicamento sintetico inicial dolor rodilla ';
    const middle = repeated('texto neutro de relleno', 900);
    const middleMedication = ' pastilla sintetica intermedia ansiedad ';
    const ending = repeated('evaluacion fuerza tratamiento ejercicio final', 180);
    const transcript = `${beginning}${middle}${middleMedication}${ending}`;
    const medications = [
      { original_text: 'MedSyntheticA 1 mg', mention_status: 'current' },
      { original_text: 'MedSyntheticB 2 mg', mention_status: 'current' },
      { original_text: 'MedSyntheticC 3 mg', mention_status: 'current' },
    ];

    const clinicalInputPackage = createClinicalInputPackage({
      transcript,
      preExtractedMedications: medications,
    });

    expect(clinicalInputPackage.criticalExtractedData.medications).toEqual(medications);
    expect(clinicalInputPackage.budgetReport.transcriptIncludedChars).toBeLessThanOrEqual(
      MAIN_TRANSCRIPT_BUDGET_CHARS
    );
    expect(clinicalInputPackage.budgetReport.budgetMode).toBe('compact');
  });

  it('includes compact attachment evidence without full duplication', () => {
    const attachmentText = repeated('hallazgo sintetico de informe adjunto', 120);

    const clinicalInputPackage = createClinicalInputPackage({
      transcript: '',
      attachmentsText: [
        {
          id: 'attachment-a',
          type: 'application/pdf',
          extractedText: attachmentText,
          eligibilityStatus: 'eligible',
        },
      ],
    });

    expect(clinicalInputPackage.attachmentEvidence).toHaveLength(1);
    expect(clinicalInputPackage.budgetReport.attachmentIncludedChars).toBeLessThanOrEqual(
      ATTACHMENT_TOTAL_BUDGET_CHARS
    );
    expect(clinicalInputPackage.budgetReport.attachmentIncludedChars).toBeLessThan(
      clinicalInputPackage.budgetReport.attachmentOriginalChars
    );
  });

  it('uses beginning, ending, and keyword snippets for long transcripts', () => {
    const beginning = repeated('motivo dolor rodilla inicio', 60);
    const neutralMiddle = repeated('conversacion neutra sin senales', 600);
    const relevantMiddle = ' medicacion sintetica mencionada en mitad de la consulta ';
    const ending = repeated('ejercicio fuerza tratamiento cierre', 80);
    const transcript = `${beginning}${neutralMiddle}${relevantMiddle}${ending}`;

    const clinicalInputPackage = createClinicalInputPackage({ transcript });

    expect(clinicalInputPackage.transcriptEvidence.beginningExcerpt.length).toBeGreaterThan(0);
    expect(clinicalInputPackage.transcriptEvidence.endingExcerpt.length).toBeGreaterThan(0);
    expect(clinicalInputPackage.transcriptEvidence.relevantSnippets.length).toBeGreaterThanOrEqual(1);
  });

  it('omits clinical text from suspected ineligible attachments', () => {
    const clinicalInputPackage = createClinicalInputPackage({
      transcript: '',
      attachmentsText: [
        {
          id: 'attachment-b',
          type: 'application/pdf',
          extractedText: repeated('texto clinico sintetico adjunto', 50),
          eligibilityStatus: 'suspected_mismatch',
        },
      ],
    });

    expect(clinicalInputPackage.attachmentEvidence[0].excerpt).toBe('');
    expect(clinicalInputPackage.attachmentEvidence[0].includedChars).toBe(0);
    expect(clinicalInputPackage.attachmentEvidence[0].originalChars).toBeGreaterThan(0);
  });

  it('truncates professional context to budget', () => {
    const professionalContext = repeated('contexto profesional sintetico', 100);

    const clinicalInputPackage = createClinicalInputPackage({
      transcript: '',
      professionalContext,
    });

    expect(clinicalInputPackage.professionalContext?.length).toBeLessThanOrEqual(
      PROFESSIONAL_CONTEXT_BUDGET_CHARS
    );
    expect(clinicalInputPackage.budgetReport.professionalContextChars).toBeLessThanOrEqual(
      PROFESSIONAL_CONTEXT_BUDGET_CHARS
    );
  });

  it('serializes the compact package as JSON', () => {
    const clinicalInputPackage = createClinicalInputPackage({
      transcript: 'dolor sintetico',
      visitType: 'initial',
      locale: 'ES',
    });

    const serialized = serializeClinicalInputPackage(clinicalInputPackage);
    const parsed = JSON.parse(serialized);

    expect(parsed.version).toBe('clinical-input-assembler-v1');
  });
});
