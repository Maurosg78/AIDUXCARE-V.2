/**
 * Unit Tests for SessionTypeService
 * 
 * Sprint 2A - Day 1: Session Type Infrastructure
 */

import { describe, test, expect } from 'vitest';
import { SessionTypeService, type SessionType } from '../sessionTypeService';

describe('SessionTypeService', () => {
  describe('getTokenBudget', () => {
    test('returns correct token budget for initial session', () => {
      expect(SessionTypeService.getTokenBudget('initial')).toBe(10);
    });

    test('returns correct token budget for followup session', () => {
      expect(SessionTypeService.getTokenBudget('followup')).toBe(4);
    });

    test('returns correct token budget for wsib session', () => {
      expect(SessionTypeService.getTokenBudget('wsib')).toBe(13);
    });

    test('returns correct token budget for mva session', () => {
      expect(SessionTypeService.getTokenBudget('mva')).toBe(15);
    });

    test('returns correct token budget for certificate session', () => {
      expect(SessionTypeService.getTokenBudget('certificate')).toBe(6);
    });

    test('returns followup budget as default for invalid session type', () => {
      // @ts-expect-error - Testing invalid input
      expect(SessionTypeService.getTokenBudget('invalid')).toBe(4);
    });
  });

  describe('getSessionTypeConfig', () => {
    test('returns correct config for initial session', () => {
      const config = SessionTypeService.getSessionTypeConfig('initial');
      expect(config.label).toBe('Initial Assessment');
      expect(config.tokenBudget).toBe(10);
      expect(config.icon).toBe('📋');
    });

    test('returns correct config for followup session', () => {
      const config = SessionTypeService.getSessionTypeConfig('followup');
      expect(config.label).toBe('Follow-up');
      expect(config.tokenBudget).toBe(4);
    });

    test('returns correct config for wsib session', () => {
      const config = SessionTypeService.getSessionTypeConfig('wsib');
      expect(config.label).toBe('WSIB');
      expect(config.tokenBudget).toBe(13);
    });

    test('returns correct config for mva session', () => {
      const config = SessionTypeService.getSessionTypeConfig('mva');
      expect(config.label).toBe('MVA');
      expect(config.tokenBudget).toBe(15);
    });

    test('returns correct config for certificate session', () => {
      const config = SessionTypeService.getSessionTypeConfig('certificate');
      expect(config.label).toBe('Medical Certificate');
      expect(config.tokenBudget).toBe(6);
    });
  });

  describe('getAllSessionTypes', () => {
    test('returns all session types with configurations', () => {
      const allTypes = SessionTypeService.getAllSessionTypes();
      expect(allTypes.length).toBe(5);
      expect(allTypes.map(t => t.value)).toEqual([
        'initial',
        'followup',
        'wsib',
        'mva',
        'certificate'
      ]);
    });

    test('each session type has required fields', () => {
      const allTypes = SessionTypeService.getAllSessionTypes();
      allTypes.forEach(type => {
        expect(type).toHaveProperty('value');
        expect(type).toHaveProperty('label');
        expect(type).toHaveProperty('description');
        expect(type).toHaveProperty('tokenBudget');
        expect(typeof type.tokenBudget).toBe('number');
        expect(type.tokenBudget).toBeGreaterThan(0);
      });
    });
  });

  describe('getPromptTemplate', () => {
    const mockTranscript = 'Patient reports lower back pain for 2 weeks.';

    test('generates initial assessment prompt', () => {
      const prompt = SessionTypeService.getPromptTemplate('initial', mockTranscript);
      expect(prompt).toContain('INITIAL ASSESSMENT');
      expect(prompt).toContain('comprehensive baseline');
      expect(prompt).toContain(mockTranscript);
    });

    test('generates followup prompt', () => {
      const prompt = SessionTypeService.getPromptTemplate('followup', mockTranscript);
      expect(prompt).toContain('FOLLOW-UP VISIT');
      expect(prompt).toContain('Compare progress');
      expect(prompt).toContain(mockTranscript);
    });

    test('generates wsib prompt', () => {
      const prompt = SessionTypeService.getPromptTemplate('wsib', mockTranscript);
      expect(prompt).toContain('WSIB');
      expect(prompt).toContain('Workplace Safety');
      expect(prompt).toContain('work-related factors');
      expect(prompt).toContain(mockTranscript);
    });

    test('generates mva prompt', () => {
      const prompt = SessionTypeService.getPromptTemplate('mva', mockTranscript);
      expect(prompt).toContain('MVA');
      expect(prompt).toContain('Motor Vehicle Accident');
      expect(prompt).toContain('mechanism of injury');
      expect(prompt).toContain(mockTranscript);
    });

    test('generates certificate prompt', () => {
      const prompt = SessionTypeService.getPromptTemplate('certificate', mockTranscript);
      expect(prompt).toContain('MEDICAL CERTIFICATE');
      expect(prompt).toContain('specific functional limitations');
      expect(prompt).toContain(mockTranscript);
    });
  });

  describe('validateSessionType', () => {
    test('validates initial session type', () => {
      expect(SessionTypeService.validateSessionType('initial')).toBe(true);
    });

    test('validates followup session type', () => {
      expect(SessionTypeService.validateSessionType('followup')).toBe(true);
    });

    test('validates wsib session type', () => {
      expect(SessionTypeService.validateSessionType('wsib')).toBe(true);
    });

    test('validates mva session type', () => {
      expect(SessionTypeService.validateSessionType('mva')).toBe(true);
    });

    test('validates certificate session type', () => {
      expect(SessionTypeService.validateSessionType('certificate')).toBe(true);
    });

    test('rejects invalid session type', () => {
      expect(SessionTypeService.validateSessionType('invalid')).toBe(false);
      expect(SessionTypeService.validateSessionType('')).toBe(false);
    });
  });

  describe('getDefaultSessionType', () => {
    test('returns followup as default', () => {
      expect(SessionTypeService.getDefaultSessionType()).toBe('followup');
    });
  });
});

