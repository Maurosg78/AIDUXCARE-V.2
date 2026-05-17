import { describe, expect, it } from 'vitest';
import { applyImagingScopeGuard } from '../imagingScopeGuard';
import type { ClinicalAnalysis } from '@/utils/cleanVertexResponse';

const baseAnalysis = (overrides: Partial<ClinicalAnalysis> = {}): ClinicalAnalysis => ({
  motivo_consulta: '',
  hallazgos_clinicos: [],
  hallazgos_relevantes: [],
  contexto_ocupacional: [],
  contexto_psicosocial: [],
  medicacion_actual: [],
  antecedentes_medicos: [],
  diagnosticos_probables: [],
  red_flags: [],
  yellow_flags: [],
  evaluaciones_fisicas_sugeridas: [],
  derivacion_recomendada: '',
  pronostico_estimado: '',
  notas_seguridad: '',
  riesgo_legal: 'low',
  biopsychosocial_psychological: [],
  biopsychosocial_social: [],
  biopsychosocial_occupational: [],
  biopsychosocial_protective: [],
  biopsychosocial_functional_limitations: [],
  biopsychosocial_patient_strengths: [],
  ...overrides,
});

describe('applyImagingScopeGuard', () => {
  it('removes visual RX-derived findings from canonical clinical fields', () => {
    const result = applyImagingScopeGuard(
      baseAnalysis({
        red_flags: [
          'Hallazgos radiológicos abdominales/pélvicos incidentales descritos en adjunto 2.',
          'Dolor nocturno progresivo referido por el paciente.',
        ],
        hallazgos_clinicos: [
          'Cambios degenerativos lumbares en radiografía lateral.',
          'Rigidez lumbar matinal referida durante la anamnesis.',
        ],
        notas_seguridad: 'Hallazgos radiológicos descritos en adjunto 2 • Controlar tolerancia al ejercicio.',
        evaluaciones_fisicas_sugeridas: [
          {
            name: 'Revisar RX',
            objective: 'Ver patrón de gas y densidades radiopacas',
            rationale: 'La radiografía muestra posibles hallazgos incidentales',
          },
          {
            name: 'Prueba funcional lumbar',
            objective: 'Valorar tolerancia al movimiento',
            rationale: 'Dolor al ejercicio referido por paciente',
          },
        ],
      }),
      [
        {
          fileName: 'rx-lumbar.jpg',
          fileType: 'image/jpeg',
          extractedText: 'Hallazgos visibles del adjunto: radiografía lateral de columna lumbar.',
        },
      ]
    );

    expect(result.analysis.red_flags).toEqual(['Dolor nocturno progresivo referido por el paciente.']);
    expect(result.analysis.hallazgos_clinicos).toEqual(['Rigidez lumbar matinal referida durante la anamnesis.']);
    expect(result.analysis.notas_seguridad).toBe('Controlar tolerancia al ejercicio.');
    expect(result.analysis.evaluaciones_fisicas_sugeridas).toHaveLength(1);
    expect(result.removedImagingItems).toBe(4);
  });

  it('preserves attributed written report and transcript imaging comments', () => {
    const result = applyImagingScopeGuard(
      baseAnalysis({
        red_flags: [
          'según informe adjunto — hallazgos radiológicos pendientes de seguimiento médico.',
          'Comentado por el profesional durante la sesión: cambios degenerativos lumbares, pendiente de correlación clínica y sin sustituir informe radiológico.',
        ],
        hallazgos_clinicos: [
          'requiere revisión por profesional competente por imagen diagnóstica aportada.',
        ],
      }),
      [
        {
          fileName: 'rx-lumbar.jpg',
          fileType: 'image/jpeg',
          extractedText: 'Se observa una radiografía anteroposterior de columna lumbar.',
        },
      ]
    );

    expect(result.analysis.red_flags).toHaveLength(2);
    expect(result.analysis.hallazgos_clinicos).toHaveLength(1);
    expect(result.removedImagingItems).toBe(0);
  });

  it('rescues Enantyum IM from OCR text when Vertex omits medication', () => {
    const result = applyImagingScopeGuard(
      baseAnalysis(),
      [
        {
          fileName: 'informe-urgencias.pdf',
          fileType: 'application/pdf',
          extractedText: '[DOCUMENTO ESCANEADO]\nSe administran enantyum IM.',
        },
      ]
    );

    expect(result.analysis.medicacion_actual).toEqual([
      'según informe adjunto/OCR — Enantyum IM (requires_review: true)',
    ]);
    expect(result.rescuedMedications).toBe(1);
  });

  it('rescues Enantyum dose and frequency from OCR text', () => {
    const result = applyImagingScopeGuard(
      baseAnalysis(),
      [
        {
          fileName: 'informe-urgencias.pdf',
          fileType: 'application/pdf',
          extractedText: 'Paciente en tratamiento con Enantyum 400mg IM cada 8 horas según prescripción médica.',
        },
      ]
    );

    expect(result.analysis.medicacion_actual).toEqual([
      'según informe adjunto/OCR — Enantyum 400mg IM cada 8 horas según prescripción médica (requires_review: true)',
    ]);
    expect(result.rescuedMedications).toBe(1);
  });

  it('does not duplicate rescued medication when already present', () => {
    const result = applyImagingScopeGuard(
      baseAnalysis({
        medicacion_actual: ['Enantyum IM administrado en urgencias'],
      }),
      [
        {
          fileName: 'informe.pdf',
          fileType: 'application/pdf',
          extractedText: 'Se administran enantyum IM.',
        },
      ]
    );

    expect(result.analysis.medicacion_actual).toEqual(['Enantyum IM administrado en urgencias']);
    expect(result.rescuedMedications).toBe(0);
  });
});
