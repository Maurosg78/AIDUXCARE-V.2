import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import {
  extractLongitudinalSignalsFromClinicalAnalysis,
  extractLongitudinalSignalsFromTextCandidates,
} from '../extractLongitudinalSignals';
import type { ClinicalAnalysis } from '@/utils/cleanVertexResponse';

const baseAnalysis: ClinicalAnalysis = {
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
};

describe('extractLongitudinalSignalsFromClinicalAnalysis', () => {
  it('extracts compact longitudinal signals from normalized clinical analysis', () => {
    const timestamp = Timestamp.fromDate(new Date('2026-05-17T10:00:00Z'));
    const analysis: ClinicalAnalysis = {
      ...baseAnalysis,
      hallazgos_clinicos: [
        'Dolor disminuye de EVA 7/10 a 4/10 durante la semana.',
        'Extensión pasiva de muñeca izquierda 60° con menor edema.',
      ],
      contexto_ocupacional: [
        'Mayor velocidad al teclear y menor limitación funcional.',
      ],
      medicacion_actual: [
        'Sin medicación actual.',
      ],
      biopsychosocial_functional_limitations: [
        'Fatiga al final del día limita tolerancia.',
      ],
    };

    const result = extractLongitudinalSignalsFromClinicalAnalysis(analysis, 'session-1', timestamp);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          signalType: 'pain_change',
          value: 'Dolor disminuye de EVA 7/10 a 4/10 durante la semana.',
          source: 'vertex_analysis',
          sessionId: 'session-1',
          timestamp,
        }),
        expect.objectContaining({
          signalType: 'objective_measure_change',
          value: 'Extensión pasiva de muñeca izquierda 60° con menor edema.',
          source: 'objective_test',
        }),
        expect.objectContaining({
          signalType: 'function_change',
          value: 'Mayor velocidad al teclear y menor limitación funcional.',
        }),
      ])
    );
  });

  it('does not preserve diagnostic image visual interpretation as longitudinal signal', () => {
    const analysis: ClinicalAnalysis = {
      ...baseAnalysis,
      hallazgos_clinicos: [
        'Hallazgos radiológicos abdominales/pélvicos incidentales.',
        'La radiografía muestra cambios degenerativos lumbares.',
      ],
      hallazgos_relevantes: [
        'Paciente refiere dolor lumbar al final del día.',
      ],
    };

    const result = extractLongitudinalSignalsFromClinicalAnalysis(analysis, 'session-2');
    const values = result.map((signal) => signal.value);

    expect(values).not.toContain('Hallazgos radiológicos abdominales/pélvicos incidentales.');
    expect(values).not.toContain('La radiografía muestra cambios degenerativos lumbares.');
    expect(values).toContain('Paciente refiere dolor lumbar al final del día.');
  });

  it('extracts signals from compact SOAP text without storing raw transcript', () => {
    const result = extractLongitudinalSignalsFromTextCandidates(
      [
        'S: Refiere menor dolor, EVA 4/10.',
        'A: Progreso funcional estable con buena tolerancia.',
      ],
      'session-3'
    );

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          signalType: 'pain_change',
          value: 'S: Refiere menor dolor, EVA 4/10.',
        }),
        expect.objectContaining({
          signalType: 'function_change',
          value: 'A: Progreso funcional estable con buena tolerancia.',
        }),
      ])
    );
  });
});
