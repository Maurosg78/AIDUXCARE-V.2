import { describe, it, expect } from 'vitest';
import { CryptoService } from '../../src/services/CryptoService';
import { CompetencyGuardService } from '../../src/services/CompetencyGuardService';
import { RemoteMonitoringService } from '../../src/services/RemoteMonitoringService';
import { AudioToSOAPBridge } from '../../src/services/AudioToSOAPBridge';

describe('Enterprise Services (Phase 1A–1D)', () => {
  it('CryptoService encrypts/decrypts correctly', async () => {
    const crypto = new CryptoService();
    await crypto.init();
    const text = 'Patient data example';
    const { iv, ciphertext } = await crypto.encrypt(text);
    const result = await crypto.decrypt(iv, ciphertext);
    expect(result).toBe(text);
  });

  it('CompetencyGuardService validates scope and certification', () => {
    expect(CompetencyGuardService.validateScope('manual therapy')).toContain('✅');
    expect(CompetencyGuardService.validateScope('surgery')).toContain('❌');
    expect(CompetencyGuardService.verifyCertification('ON-123456')).toBe(true);
  });

  it('RemoteMonitoringService logs and tracks metrics', () => {
    const monitor = new RemoteMonitoringService();
    monitor.record('SOAP_ANALYSIS', { duration: 2500 });
    const metrics = monitor.getMetrics();
    expect(metrics.totalEvents).toBeGreaterThan(0);
  });

  it('AudioToSOAPBridge optimizes and scores SOAP text', async () => {
    const text = 'Patient reports mild pain after exercise.';
    const optimized = await AudioToSOAPBridge.optimizeSOAP(text);
    const score = AudioToSOAPBridge.qualityScore(optimized);
    expect(optimized).toMatch(/Ontario/);
    expect(score).toBeGreaterThan(90);
  });
});
