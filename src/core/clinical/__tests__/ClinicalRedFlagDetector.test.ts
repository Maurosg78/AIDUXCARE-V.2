import { describe, it, expect } from 'vitest';
import { detectRedFlags, mergeRedFlags } from '../ClinicalRedFlagDetector';
import type { ClinicalAnalysis } from '@/utils/normalizers/normalizeClinicalResponse.shared';

const emptyAnalysis = (): ClinicalAnalysis => ({
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
});

// ─── Regla 1 — POLIFARMACIA_DEPRESORES_SNC ───────────────────────────────────

describe('POLIFARMACIA_DEPRESORES_SNC', () => {
  it('activa cuando hay ≥2 clases de depresores del SNC en medicacion_actual', () => {
    const analysis = emptyAnalysis();
    analysis.medicacion_actual = [
      { text: 'diazepam', medication_data: { original_text: 'diazepam' } },
      { text: 'tramadol', medication_data: { original_text: 'tramadol' } },
    ] as any;
    const flags = detectRedFlags('Tomo estas pastillas', analysis);
    const flag = flags.find((f) => f.code === 'POLIFARMACIA_DEPRESORES_SNC');
    expect(flag).toBeDefined();
    expect(flag?.source).toBe('deterministic');
    expect(flag?.trigger).toContain('diazepam');
  });

  it('activa cuando los depresores se mencionan en el transcript', () => {
    const flags = detectRedFlags(
      'Me tomo alprazolam y también tramadol para el dolor',
      emptyAnalysis(),
    );
    expect(flags.find((f) => f.code === 'POLIFARMACIA_DEPRESORES_SNC')).toBeDefined();
  });

  it('NO activa con una sola clase de depresores', () => {
    const analysis = emptyAnalysis();
    analysis.medicacion_actual = [
      { text: 'diazepam', medication_data: { original_text: 'diazepam' } },
    ] as any;
    const flags = detectRedFlags('Solo tomo diazepam', analysis);
    expect(flags.find((f) => f.code === 'POLIFARMACIA_DEPRESORES_SNC')).toBeUndefined();
  });

  it('activa con variante fonética Trankimazin', () => {
    const flags = detectRedFlags(
      'Tomo trankimazin y también sertralina por las mañanas',
      emptyAnalysis(),
    );
    expect(flags.find((f) => f.code === 'POLIFARMACIA_DEPRESORES_SNC')).toBeDefined();
  });
});

// ─── Regla 2 — TRAUMATISMO_MAYOR_65 ──────────────────────────────────────────

describe('TRAUMATISMO_MAYOR_65', () => {
  it('activa con caída y edad ≥65 en transcript', () => {
    const flags = detectRedFlags(
      'Me caí por las escaleras. Tengo 72 años.',
      emptyAnalysis(),
    );
    const flag = flags.find((f) => f.code === 'TRAUMATISMO_MAYOR_65');
    expect(flag).toBeDefined();
    expect(flag?.trigger).toBeTruthy();
  });

  it('activa con patientAgeHint ≥65', () => {
    const flags = detectRedFlags(
      'Tuve un accidente con el patinete',
      emptyAnalysis(),
      68,
    );
    expect(flags.find((f) => f.code === 'TRAUMATISMO_MAYOR_65')).toBeDefined();
  });

  it('NO activa si hay traumatismo pero paciente tiene <65 años', () => {
    const flags = detectRedFlags(
      'Me caí. Tengo 45 años.',
      emptyAnalysis(),
    );
    expect(flags.find((f) => f.code === 'TRAUMATISMO_MAYOR_65')).toBeUndefined();
  });

  it('NO activa si hay edad ≥65 pero sin traumatismo', () => {
    const flags = detectRedFlags(
      'Tengo 70 años y me duele la rodilla',
      emptyAnalysis(),
    );
    expect(flags.find((f) => f.code === 'TRAUMATISMO_MAYOR_65')).toBeUndefined();
  });
});

// ─── Regla 3 — DOLOR_NOCTURNO_REPOSO ─────────────────────────────────────────

describe('DOLOR_NOCTURNO_REPOSO', () => {
  it('activa con dolor nocturno explícito', () => {
    const flags = detectRedFlags(
      'Tengo dolor nocturno que no me deja dormir',
      emptyAnalysis(),
    );
    expect(flags.find((f) => f.code === 'DOLOR_NOCTURNO_REPOSO')).toBeDefined();
  });

  it('activa cuando el dolor despierta al paciente', () => {
    const flags = detectRedFlags(
      'Me despierta el dolor por las noches',
      emptyAnalysis(),
    );
    expect(flags.find((f) => f.code === 'DOLOR_NOCTURNO_REPOSO')).toBeDefined();
  });

  it('activa con dolor en reposo', () => {
    const flags = detectRedFlags(
      'Noto dolor en reposo, incluso sin moverme',
      emptyAnalysis(),
    );
    expect(flags.find((f) => f.code === 'DOLOR_NOCTURNO_REPOSO')).toBeDefined();
  });

  it('NO activa con dolor solo diurno', () => {
    const flags = detectRedFlags(
      'Me duele cuando camino mucho, pero de noche estoy bien',
      emptyAnalysis(),
    );
    expect(flags.find((f) => f.code === 'DOLOR_NOCTURNO_REPOSO')).toBeUndefined();
  });
});

// ─── Regla 4 — DEFICIT_NEUROLOGICO ───────────────────────────────────────────

describe('DEFICIT_NEUROLOGICO', () => {
  it('activa con hormigueo', () => {
    const flags = detectRedFlags(
      'Noto hormigueo en la pierna derecha',
      emptyAnalysis(),
    );
    const flag = flags.find((f) => f.code === 'DEFICIT_NEUROLOGICO');
    expect(flag).toBeDefined();
    expect(flag?.trigger).toBe('hormigueo');
  });

  it('activa con debilidad progresiva', () => {
    const flags = detectRedFlags(
      'Tengo pérdida de fuerza progresiva en el brazo',
      emptyAnalysis(),
    );
    expect(flags.find((f) => f.code === 'DEFICIT_NEUROLOGICO')).toBeDefined();
  });

  it('activa con incontinencia', () => {
    const flags = detectRedFlags(
      'A veces tengo incontinencia urinaria',
      emptyAnalysis(),
    );
    expect(flags.find((f) => f.code === 'DEFICIT_NEUROLOGICO')).toBeDefined();
  });

  it('NO activa con síntomas musculares sin patrón neurológico', () => {
    const flags = detectRedFlags(
      'Me duele la espalda y tengo contractura muscular',
      emptyAnalysis(),
    );
    expect(flags.find((f) => f.code === 'DEFICIT_NEUROLOGICO')).toBeUndefined();
  });
});

// ─── Regla 5 — ANTICOAGULANTE_TRAUMATISMO ────────────────────────────────────

describe('ANTICOAGULANTE_TRAUMATISMO', () => {
  it('activa con Sintrom y caída', () => {
    const analysis = emptyAnalysis();
    analysis.medicacion_actual = [
      { text: 'Sintrom', medication_data: { original_text: 'Sintrom' } },
    ] as any;
    const flags = detectRedFlags('Me caí ayer por las escaleras', analysis);
    const flag = flags.find((f) => f.code === 'ANTICOAGULANTE_TRAUMATISMO');
    expect(flag).toBeDefined();
    expect(flag?.trigger).toContain('sintrom');
  });

  it('activa con rivaroxabán en transcript y golpe', () => {
    const flags = detectRedFlags(
      'Tomo rivaroxaban y me di un golpe en la cabeza',
      emptyAnalysis(),
    );
    expect(flags.find((f) => f.code === 'ANTICOAGULANTE_TRAUMATISMO')).toBeDefined();
  });

  it('NO activa con anticoagulante sin traumatismo', () => {
    const analysis = emptyAnalysis();
    analysis.medicacion_actual = [
      { text: 'Sintrom', medication_data: { original_text: 'Sintrom' } },
    ] as any;
    const flags = detectRedFlags('Me duele la rodilla al caminar', analysis);
    expect(flags.find((f) => f.code === 'ANTICOAGULANTE_TRAUMATISMO')).toBeUndefined();
  });

  it('NO activa con traumatismo sin anticoagulante', () => {
    const flags = detectRedFlags(
      'Me caí de la bicicleta ayer',
      emptyAnalysis(),
    );
    expect(flags.find((f) => f.code === 'ANTICOAGULANTE_TRAUMATISMO')).toBeUndefined();
  });
});

// ─── mergeRedFlags — dedup ────────────────────────────────────────────────────

describe('mergeRedFlags', () => {
  it('añade flags deterministas no presentes', () => {
    const existing = ['Dolor lumbar mecánico'];
    const detected = [{
      code: 'DEFICIT_NEUROLOGICO',
      text: 'Posibles signos neurológicos referidos por el paciente. Recomendar evaluación médica urgente para descartar compromiso neurológico.',
      source: 'deterministic' as const,
      trigger: 'hormigueo',
    }];
    const merged = mergeRedFlags(existing, detected);
    expect(merged).toHaveLength(2);
    expect(merged[1]).toContain('neurológico');
  });

  it('no duplica si el LLM ya detectó el mismo hallazgo', () => {
    const existing = ['Riesgo de polifarmacia: múltiples depresores del SNC detectados'];
    const detected = [{
      code: 'POLIFARMACIA_DEPRESORES_SNC',
      text: 'Riesgo de polifarmacia por uso concomitante de múltiples depresores del SNC.',
      source: 'deterministic' as const,
      trigger: 'diazepam, tramadol',
    }];
    const merged = mergeRedFlags(existing, detected);
    expect(merged).toHaveLength(1);
  });

  it('retorna existing intacto si no hay flags detectados', () => {
    const existing = ['Dolor cervical'];
    const merged = mergeRedFlags(existing, []);
    expect(merged).toStrictEqual(existing);
  });
});
