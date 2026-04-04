import { describe, expect, it } from 'vitest';

import {
  isLowSignalImageExtraction,
  mergeImageExtractionResults,
  scoreImageExtractionUtility,
} from '../FileProcessorService';

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
  it('combines visual and OCR signals when both add useful information', () => {
    const visualExtraction =
      'Se aprecia alineación conservada de la muñeca izquierda y material de osteosíntesis visible.\nImagen sugerente de hallazgos visibles; no constituye diagnóstico.';
    const ocrExtraction =
      'Radiografía AP/LAT de muñeca izquierda. Fractura distal consolidada sin desplazamiento secundario.';

    const mergedValue = mergeImageExtractionResults(visualExtraction, ocrExtraction);

    expect(mergedValue).toContain('Hallazgos visibles del adjunto:');
    expect(mergedValue).toContain('Texto clínico visible en el adjunto:');
    expect(mergedValue).toContain('Imagen sugerente de hallazgos visibles; no constituye diagnóstico.');
  });

  it('keeps the stronger signal when OCR is trivial', () => {
    const visualExtraction =
      'Se aprecia material de osteosíntesis en radio distal sin desplazamiento grosero.\nImagen sugerente de hallazgos visibles; no constituye diagnóstico.';
    const ocrExtraction = 'RX';

    const mergedValue = mergeImageExtractionResults(visualExtraction, ocrExtraction);

    expect(mergedValue).toContain('Se aprecia material de osteosíntesis');
    expect(mergedValue).not.toContain('Texto clínico visible en el adjunto:');
  });
});
