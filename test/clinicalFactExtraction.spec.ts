import { describe, it, expect } from 'vitest';
import type { SessionState } from '@/types/sessionState';
import { extractClinicalFactsFromSessionState } from '@/core/clinical/extractClinicalFactsFromSessionState';
import { synthesizeClinicalNarrative } from '@/core/synthesis/synthesizeClinicalNarrative';

function makeSession(partial: Partial<SessionState>): SessionState {
  return {
    sessionId: 'test-session',
    patientId: 'patient-1',
    patientName: 'Paciente Prueba',
    startTime: new Date().toISOString(),
    sessionType: 'initial',
    subtype: undefined,
    transcript: '',
    soapNote: undefined,
    ...partial,
  } as SessionState;
}

describe('clinical fact extraction - real world SOAP patterns', () => {
  it('Test 1 — SOAP clásico', () => {
    const session = makeSession({
      soapNote: {
        subjective: 'Dolor lumbar 6/10',
        objective: 'Limitación flexión',
        assessment: 'Lumbalgia mecánica',
        plan: 'Ejercicios',
        planInClinic: [],
        planHomeProgram: [],
        followUp: '',
      } as any,
    });

    const facts = extractClinicalFactsFromSessionState(session);
    expect(facts).not.toBeNull();
    const summary = synthesizeClinicalNarrative(facts!);

    expect(summary.mainProblem.toLowerCase()).toContain('lumbalgia mecanica');
    expect(facts!.facts.pain?.cursoTextoLibre).toContain('6/10');
  });

  it('Test 2 — todo en assessment', () => {
    const session = makeSession({
      soapNote: {
        subjective: '',
        objective: '',
        assessment: 'Paciente con lumbalgia mecánica 7/10 con movilidad limitada.',
        plan: '',
        planInClinic: [],
        planHomeProgram: [],
        followUp: '',
      } as any,
    });

    const facts = extractClinicalFactsFromSessionState(session);
    expect(facts).not.toBeNull();
    const summary = synthesizeClinicalNarrative(facts!);

    expect(summary.mainProblem.toLowerCase()).toContain('lumbalgia mecanica');
    expect(facts!.facts.pain?.cursoTextoLibre).toContain('7/10');
  });

  it('Test 3 — bullets', () => {
    const session = makeSession({
      soapNote: {
        subjective: '- Dolor lumbar 6/10\n- Empeora sentado',
        objective: '- Lasegue +',
        assessment: '',
        plan: '',
        planInClinic: [],
        planHomeProgram: [],
        followUp: '',
      } as any,
    });

    const facts = extractClinicalFactsFromSessionState(session);
    expect(facts).not.toBeNull();

    expect(facts!.facts.pain?.cursoTextoLibre).toContain('6/10');
    expect(facts!.facts.tests && facts!.facts.tests.length).toBeGreaterThan(0);
    const names = facts!.facts.tests!.map((t) => t.nombre.toLowerCase());
    expect(names).toContain('lasegue');
  });

  it('Test 4 — narrativa larga', () => {
    const session = makeSession({
      soapNote: {
        subjective:
          'Paciente refiere dolor lumbar desde hace 3 meses que empeora con sedestación prolongada.',
        objective: '',
        assessment:
          'Cuadro compatible con lumbalgia mecánica subaguda con componente postural importante.',
        plan: '',
        planInClinic: [],
        planHomeProgram: [],
        followUp: '',
      } as any,
    });

    const facts = extractClinicalFactsFromSessionState(session);
    expect(facts).not.toBeNull();
    const summary = synthesizeClinicalNarrative(facts!);

    expect(summary.mainProblem.toLowerCase()).toContain('lumbalgia mecanica');
  });

  it('Test 5 — template EMR sin red flags', () => {
    const session = makeSession({
      soapNote: {
        subjective: 'No red flags identified. Patient educated about posture.',
        objective: '',
        assessment: '',
        plan: '',
        planInClinic: [],
        planHomeProgram: [],
        followUp: '',
      } as any,
    });

    const facts = extractClinicalFactsFromSessionState(session);
    expect(facts).not.toBeNull();
    const summary = synthesizeClinicalNarrative(facts!);

    expect(summary.evolution.direction).not.toBe('redflag');
  });

  it('Test 6 — no falso positivo de dolor con C6/7', () => {
    const session = makeSession({
      soapNote: {
        subjective: 'Hernia C6/7 con dolor cervical.',
        objective: '',
        assessment: 'Cervicalgia mecánica.',
        plan: '',
        planInClinic: [],
        planHomeProgram: [],
        followUp: '',
      } as any,
    });

    const facts = extractClinicalFactsFromSessionState(session);
    expect(facts).not.toBeNull();
    expect(facts!.facts.pain).toBeUndefined();
  });

  it('Test 7 — Unicode minus en tests', () => {
    const session = makeSession({
      soapNote: {
        subjective: '',
        objective: 'Lasègue −. Slump +.',
        assessment: '',
        plan: '',
        planInClinic: [],
        planHomeProgram: [],
        followUp: '',
      } as any,
    });

    const facts = extractClinicalFactsFromSessionState(session);
    expect(facts).not.toBeNull();
    const tests = facts!.facts.tests ?? [];
    const lasegue = tests.find((t) => t.nombre === 'Lasegue');
    const slump = tests.find((t) => t.nombre === 'Slump');
    expect(lasegue?.resultado).toBe('negativo');
    expect(slump?.resultado).toBe('positivo');
  });
}
);

