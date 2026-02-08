/**
 * WO-SOAP-PARSER-BASELINE-VALIDATION-TESTS-V1
 * Tests obligatorios para validar parseo de respuestas Vertex antes de persistir baseline.
 * Scope: parseSOAPResponse, parsePlainSOAPSections, isValidBaselineSOAP.
 * No toca backend, persistencia, prompts, UI ni flujo Ongoing.
 */

import { describe, it, expect } from 'vitest';
import { parseSOAPResponse, parsePlainSOAPSections } from '../vertex-ai-soap-service';
import { isValidBaselineSOAP, getBaselineValidationFailureReason } from '../soapBaselineValidation';

describe('WO-SOAP-PARSER-BASELINE-VALIDATION-TESTS-V1', () => {
  describe('1. Vertex devuelve JSON válido', () => {
    it('resultado es baseline válida', () => {
      const vertexResponse = {
        soap: {
          subjective: 'Patient reports low back pain for 6 months, worse with prolonged sitting.',
          objective: 'ROM lumbar flexion 60°, negative SLR.',
          assessment: 'Patterns consistent with lumbar dysfunction.',
          plan: 'Continue manual therapy 2x/week. HEP: core stability exercises daily. Reassess in 4 weeks.',
        },
      };
      const parsed = parseSOAPResponse(vertexResponse, 'follow-up');
      expect(parsed).toBeDefined();
      expect(parsed.subjective).toBeTruthy();
      expect(parsed.plan).toBeTruthy();
      expect(isValidBaselineSOAP(parsed)).toBe(true);
    });

    it('alternativa candidates[0].content.parts[0].text con JSON', () => {
      const vertexResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '{"subjective":"Patient with chronic LBP.","objective":"Limited ROM.","assessment":"Lumbar syndrome.","plan":"MT 2x/week; HEP daily. Reassess in 2 weeks."}',
                },
              ],
            },
          },
        ],
      };
      const parsed = parseSOAPResponse(vertexResponse, 'initial');
      expect(parsed.plan).toContain('MT');
      expect(isValidBaselineSOAP(parsed)).toBe(true);
    });
  });

  describe('2. Vertex devuelve texto plano estructurado', () => {
    it('resultado es baseline válida', () => {
      const rawText = `Subjective: Patient reports low back pain for 6 months.
Objective: ROM lumbar flexion 60 degrees.
Assessment: Patterns consistent with lumbar dysfunction.
Plan: Continue manual therapy twice weekly. Home exercise program: core stability daily. Reassess in 4 weeks.`;
      const parsed = parsePlainSOAPSections(rawText);
      expect(parsed).not.toBeNull();
      expect(parsed!.subjective).toBeTruthy();
      expect(parsed!.plan).toBeTruthy();
      expect(parsed!.plan.length).toBeGreaterThanOrEqual(15);
      expect(isValidBaselineSOAP(parsed)).toBe(true);
    });
  });

  describe('3. Texto plano con markdown', () => {
    it('resultado es baseline válida', () => {
      const rawText = `**Subjective:** Patient with chronic LBP, improving.
**Objective:** Full ROM today.
**Assessment:** Responding to treatment.
**Plan:** Continue MT 2x/week and HEP daily. Reassess in 2 weeks.`;
      const parsed = parsePlainSOAPSections(rawText);
      expect(parsed).not.toBeNull();
      expect(parsed!.subjective).toBeTruthy();
      expect(parsed!.plan).toBeTruthy();
      expect(isValidBaselineSOAP(parsed)).toBe(true);
    });
  });

  describe('4. Texto plano sin Plan', () => {
    it('resultado es baseline inválida', () => {
      const rawText = `Subjective: Patient feels better.
Objective: Improved ROM.
Assessment: Progress noted.`;
      const parsed = parsePlainSOAPSections(rawText);
      // Parser puede devolver null (no matchea secciones) o SOAP con plan vacío/placeholder
      if (parsed === null) {
        expect(isValidBaselineSOAP(null)).toBe(false);
        return;
      }
      const planTrimmed = (parsed.plan ?? '').trim();
      const hasNoRealPlan = !planTrimmed || planTrimmed.length < 15 || planTrimmed === 'Not documented.';
      expect(hasNoRealPlan || !isValidBaselineSOAP(parsed)).toBe(true);
      expect(isValidBaselineSOAP(parsed)).toBe(false);
    });
  });

  describe('5. Texto plano con Plan vacío o genérico', () => {
    it('Plan vacío → baseline inválida', () => {
      const rawText = `Subjective: Patient reports improvement.
Objective: ROM improved.
Assessment: Good progress.
Plan:`;
      const parsed = parsePlainSOAPSections(rawText);
      if (parsed) {
        expect(isValidBaselineSOAP(parsed)).toBe(false);
      }
    });

    it('Plan "Continue treatment as planned." → baseline inválida', () => {
      const rawText = `Subjective: Patient with low back pain.
Objective: Some limitation.
Assessment: Lumbar dysfunction.
Plan: Continue treatment as planned.`;
      const parsed = parsePlainSOAPSections(rawText);
      expect(parsed).not.toBeNull();
      expect(isValidBaselineSOAP(parsed!)).toBe(false);
    });

    it('Plan genérico "n/a" → baseline inválida', () => {
      const soap = {
        subjective: 'Patient presented with LBP.',
        objective: 'Limited ROM.',
        assessment: 'Lumbar syndrome.',
        plan: 'n/a',
      };
      expect(isValidBaselineSOAP(soap)).toBe(false);
    });

    it('Plan corto pero no genérico "Increase activity." → baseline inválida (demasiado vago)', () => {
      const soap = {
        subjective: 'Patient reports improvement with current program.',
        objective: 'ROM improved.',
        assessment: 'Progress.',
        plan: 'Increase activity.',
      };
      expect(isValidBaselineSOAP(soap)).toBe(false);
    });
  });

  describe('6. Texto no clínico / conversacional', () => {
    it('resultado es baseline inválida', () => {
      const rawText = 'The patient feels better today and we talked about exercises.';
      const parsed = parsePlainSOAPSections(rawText);
      // Sin secciones SOAP el parser devuelve null
      expect(parsed === null || !isValidBaselineSOAP(parsed)).toBe(true);
      if (parsed) {
        expect(isValidBaselineSOAP(parsed)).toBe(false);
      }
    });

    it('objeto null o sin secciones → inválida', () => {
      expect(isValidBaselineSOAP(null)).toBe(false);
      expect(isValidBaselineSOAP({ subjective: '', objective: '', assessment: '', plan: '' })).toBe(false);
    });
  });

  describe('isValidBaselineSOAP — requisitos mínimos', () => {
    it('exige Subjective con longitud mínima', () => {
      expect(
        isValidBaselineSOAP({
          subjective: 'Short',
          objective: '',
          assessment: '',
          plan: 'Continue manual therapy 2x/week. HEP daily. Reassess in 4 weeks.',
        })
      ).toBe(false);
    });

    it('exige Plan con contenido accionable (no genérico)', () => {
      expect(
        isValidBaselineSOAP({
          subjective: 'Patient reports low back pain for 6 months.',
          objective: '',
          assessment: '',
          plan: 'Continue treatment.',
        })
      ).toBe(false);
    });

    it('acepta SOAP con Subjective y Plan suficientes', () => {
      expect(
        isValidBaselineSOAP({
          subjective: 'Patient reports low back pain for 6 months.',
          objective: 'ROM limited.',
          assessment: 'Lumbar dysfunction.',
          plan: 'Manual therapy 2x/week. HEP: core exercises daily. Reassess in 4 weeks.',
        })
      ).toBe(true);
    });

    it('getBaselineValidationFailureReason devuelve motivo cuando Plan es genérico', () => {
      const soap = {
        subjective: 'Patient with LBP.',
        objective: '',
        assessment: '',
        plan: 'Continue treatment as planned.',
      };
      expect(getBaselineValidationFailureReason(soap)).toBe('Plan is generic or not actionable');
      expect(getBaselineValidationFailureReason(null)).toBe('Missing or invalid SOAP object');
    });
  });
});
