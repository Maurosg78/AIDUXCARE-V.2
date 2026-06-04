import { describe, expect, it } from 'vitest';

import {
  evaluateAttachmentPatientIdentity,
  isLowSignalImageExtraction,
  mergeImageExtractionResults,
  scoreImageExtractionUtility,
} from '../FileProcessorService';

describe('evaluateAttachmentPatientIdentity', () => {
  it('matches an explicit document patient name to the active patient', () => {
    const extractedText = 'Informe clínico\nPaciente: John Doe\nFecha: 2026-06-04';

    const result = evaluateAttachmentPatientIdentity(extractedText, 'John Doe');

    expect(result.detectedPatientName).toBe('John Doe');
    expect(result.patientIdentityStatus).toBe('match');
  });

  it('flags an explicit wrong-patient document name as suspected mismatch', () => {
    const extractedText = 'ANÁLISIS CLÍNICOS Y HEMATOLOGÍA\nKINGA KATARZYNA\nNº Historia: 12345';

    const result = evaluateAttachmentPatientIdentity(extractedText, 'John Doe');

    expect(result.detectedPatientName).toBe('KINGA KATARZYNA');
    expect(result.patientIdentityStatus).toBe('suspected_mismatch');
  });

  it('does not treat absence of an explicit patient name as mismatch', () => {
    const extractedText = 'Informe clínico sin identificación explícita del paciente.';

    const result = evaluateAttachmentPatientIdentity(extractedText, 'John Doe');

    expect(result.detectedPatientName).toBeNull();
    expect(result.patientIdentityStatus).toBe('no_name_detected');
  });
});

describe('isLowSignalImageExtraction', () => {
  it('flags trivial OCR output as low signal', () => {
    const firstValue = 'RX';
    const secondValue = 'abc';
    const thirdValue = ' 12 ';

    expect(isLowSignalImageExtraction(firstValue)).toBe(true);
    expect(isLowSignalImageExtraction(secondValue)).toBe(true);
    expect(isLowSignalImageExtraction(secondValue)).toBe(true);
    expect(isLowSignalImageExtraction(thirdValue)).toBe(true);
  });

  it('accepts clinically useful extraction text', () => {
    const extractedText =
      'Radiografía de muñeca izquierda revisada hoy. Fractura distal consolidada sin desplazamiento secundario.';

    expect(isLowSignalImageExtraction(extractedText)).toBe(false);
  });

  it('accepts clinically useful extraction text with non-diagnostic disclaimer', () => {
    const extractedText =
      'Radiografía revisada hoy. Se aprecia material de osteosíntesis sin desplazamiento grosero.\nImagen sugerente de hallazgos visibles; no constituye diagnóstico.';

    expect(isLowSignalImageExtraction(extractedText)).toBe(false);
  });
});

describe('scoreImageExtractionUtility', () => {
  it('scores clinically useful text above trivial text', () => {
    const lowSignalValue = 'RX';
    const highSignalValue =
      'Radiografía de muñeca izquierda revisada hoy. Se aprecia fractura distal consolidada, material de osteosíntesis estable y sin desplazamiento secundario visible.';

    expect(scoreImageExtractionUtility(lowSignalValue)).toBeLessThan(scoreImageExtractionUtility(highSignalValue));
  });
});

describe('mergeImageExtractionResults', () => {
  it('uses OCR text only when both visual and OCR signals exist', () => {
    const visualExtraction =
      'Se aprecia alineación conservada de la muñeca izquierda y material de osteosíntesis visible.\nImagen sugerente de hallazgos visibles; no constituye diagnóstico.';
    const ocrExtraction =
      'Radiografía AP/LAT de muñeca izquierda. Fractura distal consolidada sin desplazamiento secundario.';

    const mergedValue = mergeImageExtractionResults(visualExtraction, ocrExtraction);

    expect(mergedValue).toContain('[DOCUMENTO ADJUNTO — texto extraído por OCR]');
    expect(mergedValue).toContain('[FUENTE: adjunto por el profesional, no interpretado por AiduxCare]');
    expect(mergedValue).toContain('Radiografía AP/LAT de muñeca izquierda.');
    expect(mergedValue).not.toContain('Hallazgos visibles del adjunto:');
    expect(mergedValue).not.toContain('Se aprecia alineación conservada');
  });

  it('rejects visual-only clinical context when OCR is trivial', () => {
    const visualExtraction =
      'Se aprecia material de osteosíntesis en radio distal sin desplazamiento grosero.\nImagen sugerente de hallazgos visibles; no constituye diagnóstico.';
    const ocrExtraction = 'RX';

    const mergedValue = mergeImageExtractionResults(visualExtraction, ocrExtraction);

    expect(mergedValue).toBe('');
    expect(mergedValue).not.toContain('Texto clínico visible en el adjunto:');
  });
});
