import { describe, it, expect } from 'vitest';
import { classifyTrajectory, classifyTrajectoryFromTwoPoints } from '../trajectoryClassifier';

describe('trajectoryClassifier', () => {
  describe('classifyTrajectory', () => {
    it('returns stable when series has fewer than 2 valid points', () => {
      expect(classifyTrajectory([]).pattern).toBe('stable');
      expect(classifyTrajectory([5]).pattern).toBe('stable');
      expect(classifyTrajectory([NaN, 5]).pattern).toBe('stable');
    });

    it('returns improved when delta <= -2', () => {
      const r = classifyTrajectory([7, 4]);
      expect(r.pattern).toBe('improved');
      expect(r.label).toBe('improved');
      expect(r.confidence).toBe('high');
    });

    it('returns regressed when delta >= 2', () => {
      const r = classifyTrajectory([3, 6]);
      expect(r.pattern).toBe('regressed');
      expect(r.label).toBe('regressed');
      expect(r.confidence).toBe('high');
    });

    it('returns stable (plateau) when |delta| < 2 and two points', () => {
      const r = classifyTrajectory([5, 6]);
      expect(r.pattern).toBe('stable');
      expect(r.label).toBe('plateau');
    });

    it('returns fluctuating when 3+ points and high variance and |delta| < 2', () => {
      const r = classifyTrajectory([5, 7, 4, 6]);
      expect(r.pattern).toBe('fluctuating');
      expect(r.label).toBe('fluctuating');
    });
  });

  describe('classifyTrajectoryFromTwoPoints', () => {
    it('returns classification for valid previous and current', () => {
      const r = classifyTrajectoryFromTwoPoints(7, 4);
      expect(r).not.toBeNull();
      expect(r!.pattern).toBe('improved');
      expect(r!.label).toBe('improved');
    });

    it('returns null when previous or current is missing', () => {
      expect(classifyTrajectoryFromTwoPoints(null, 5)).toBeNull();
      expect(classifyTrajectoryFromTwoPoints(5, undefined)).toBeNull();
    });

    it('returns null when value out of 0-10 range', () => {
      expect(classifyTrajectoryFromTwoPoints(11, 5)).toBeNull();
      expect(classifyTrajectoryFromTwoPoints(5, -1)).toBeNull();
    });
  });
});
